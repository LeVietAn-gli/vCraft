import { AppError } from '../../errors.js'

const workshop = { select: { name: true, slug: true } }
const orderSummary = { rfq: { select: { id: true, title: true, code: true, unit: true } } }
const rfqMissing = () => new AppError(404, 'RFQ_NOT_FOUND', 'Không tìm thấy yêu cầu báo giá.')
const orderMissing = () => new AppError(404, 'ORDER_NOT_FOUND', 'Không tìm thấy đơn hàng.')
const latestPlan = {
  where: { status: { not: 'DRAFT' } },
  orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  take: 1,
  include: { items: { include: { workshop }, orderBy: { id: 'asc' } } },
}
const bidList = { include: { workshop }, orderBy: [{ unitPrice: 'asc' }, { id: 'asc' }] }
const withTotals = (bids) =>
  bids.map((b) => ({ ...b, lineTotal: b.unitPrice.mul(b.quantityOffered).toFixed(2) }))

async function pageOf(table, buyerId, query, include) {
  const { page, limit, status } = query,
    where = { buyerId, status }
  const [data, total] = await Promise.all([
    table.findMany({
      where,
      include,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    table.count({ where }),
  ])
  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}
async function code(tx, kind) {
  const [{ number }] =
    kind === 'RFQ'
      ? await tx.$queryRaw`SELECT nextval('rfq_code_seq') AS number`
      : await tx.$queryRaw`SELECT nextval('order_code_seq') AS number`
  return [kind, new Date().getUTCFullYear(), String(number).padStart(4, '0')].join('-')
}
export function buyerRepository(db) {
  async function ownedRfq(buyerId, id, include) {
    const row = await db.rfq.findFirst({ where: { id, buyerId }, include })
    if (!row) throw rfqMissing()
    return row
  }
  return {
    transaction: (work) => db.$transaction((tx) => work(buyerRepository(tx))),
    listRfqs: (buyerId, query) =>
      pageOf(db.rfq, buyerId, query, {
        order: { select: { id: true, status: true } },
        plans: { where: { status: 'PENDING_BUYER' }, select: { id: true }, take: 1 },
      }),
    async rfqDetail(buyerId, id) {
      const row = await ownedRfq(buyerId, id, {
        category: { select: { id: true, name: true } },
        referenceProduct: { select: { id: true, name: true, slug: true } },
        invitations: { include: { workshop }, orderBy: { createdAt: 'asc' } },
        order: { select: { id: true, status: true } },
        plans: latestPlan,
        bids: bidList,
      })
      return { ...row, bids: withTotals(row.bids) }
    },
    async bids(buyerId, id) {
      return withTotals((await ownedRfq(buyerId, id, { bids: bidList })).bids)
    },
    async currentPlan(buyerId, id) {
      return (await ownedRfq(buyerId, id, { plans: latestPlan })).plans[0] ?? null
    },
    async lockRfq(buyerId, id) {
      const [found] =
        await db.$queryRaw`SELECT id FROM "Rfq" WHERE id=${id}::uuid AND "buyerId"=${buyerId}::uuid FOR UPDATE`
      if (!found) throw rfqMissing()
      return db.rfq.findUniqueOrThrow({ where: { id } })
    },
    checkCategory: (id) => db.category.findUnique({ where: { id }, select: { id: true } }),
    checkProduct: (id, categoryId) =>
      db.product.findFirst({
        where: { id, categoryId, status: 'VISIBLE', workshop: { status: 'APPROVED' } },
        select: { id: true },
      }),
    contact: (buyerId) =>
      db.user.findUniqueOrThrow({
        where: { id: buyerId },
        select: { fullName: true, phone: true },
      }),
    createRfq: async (data) => db.rfq.create({ data: { ...data, code: await code(db, 'RFQ') } }),
    updateRfq: (id, data) => db.rfq.update({ where: { id }, data }),
    matches: (categoryId) =>
      db.workshop.findMany({
        where: { status: 'APPROVED', acceptsOrders: true, categories: { some: { categoryId } } },
        select: { id: true },
      }),
    invite: (rfqId, matches) =>
      db.rfqInvitation.createMany({
        data: matches.map(({ id: workshopId }) => ({ rfqId, workshopId })),
      }),
    async lockPlan(buyerId, id) {
      const [row] =
        await db.$queryRaw`SELECT p.id FROM "AllocationPlan" p JOIN "Rfq" r ON r.id=p."rfqId"
        WHERE p.id=${id}::uuid AND r."buyerId"=${buyerId}::uuid FOR UPDATE OF p`
      if (!row) throw new AppError(404, 'PLAN_NOT_FOUND', 'Không tìm thấy phương án.')
      return db.allocationPlan.findUniqueOrThrow({
        where: { id },
        include: { items: { include: { bid: true } }, rfq: true },
      })
    },
    orderForPlan: (planId) => db.order.findUniqueOrThrow({ where: { planId } }),
    setRfqStatus: (id, buyerId, from, to) =>
      db.rfq.updateMany({ where: { id, buyerId, status: from }, data: { status: to } }),
    decidePlan: (id, data) =>
      db.allocationPlan.update({ where: { id }, data: { ...data, decidedAt: new Date() } }),
    createOrder: async (plan, buyerId) =>
      db.order.create({
        data: {
          code: await code(db, 'ORD'),
          rfqId: plan.rfqId,
          planId: plan.id,
          buyerId,
          totalAmount: plan.totalAmount,
        },
      }),
    createTasks: (orderId, items) =>
      db.productionTask.createMany({
        data: items.map((item) => ({
          orderId,
          workshopId: item.workshopId,
          planItemId: item.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          dueDate: item.dueDate,
        })),
      }),
    updateBids: (rfqId, ids, data) => db.bid.updateMany({ where: { rfqId, id: ids }, data }),
    listOrders: (buyerId, query) => pageOf(db.order, buyerId, query, orderSummary),
    async ownedOrder(buyerId, id, details = false) {
      const include = details
        ? {
            ...orderSummary,
            tasks: {
              include: {
                workshop,
                batch: {
                  select: {
                    batchCode: true,
                    isPublic: true,
                    workshop: { select: { status: true } },
                  },
                },
              },
              orderBy: [{ dueDate: 'asc' }, { id: 'asc' }],
            },
          }
        : undefined
      const order = await db.order.findFirst({ where: { buyerId, id }, include })
      if (!order) throw orderMissing()
      return order
    },
    receive: (id, buyerId) =>
      db.order.updateMany({
        where: { id, buyerId, status: 'READY' },
        data: { status: 'DELIVERED', receivedAt: new Date() },
      }),
  }
}
