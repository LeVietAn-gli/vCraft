import { AppError } from '../../errors.js'
import { transition } from './rfq.service.js'

function pending(plan) {
  if (plan.status === 'DRAFT') throw new AppError(409, 'PLAN_NOT_SENT', 'Phương án chưa được gửi.')
  if (plan.status === 'REJECTED')
    throw new AppError(409, 'PLAN_REJECTED', 'Phương án đã bị từ chối.')
  if (plan.status !== 'PENDING_BUYER') throw transition()
  if (plan.rfq.status !== 'BIDDING')
    throw new AppError(409, 'RFQ_NOT_BIDDING', 'Yêu cầu không ở giai đoạn báo giá.')
}
function verifyAllocation(plan) {
  let quantity = 0
  let amount = plan.totalAmount.mul(0)
  for (const item of plan.items) {
    const bid = item.bid
    if (
      bid.rfqId !== plan.rfqId ||
      bid.workshopId !== item.workshopId ||
      bid.status !== 'SUBMITTED' ||
      !bid.lockedAt ||
      item.quantity <= 0 ||
      item.quantity > bid.quantityOffered ||
      !item.unitPrice.equals(bid.unitPrice) ||
      !item.lineTotal.equals(item.unitPrice.mul(item.quantity))
    )
      throw new AppError(409, 'PLAN_STALE', 'Báo giá và phương án không còn khớp.')
    quantity += item.quantity
    amount = amount.add(item.lineTotal)
  }
  if (
    !quantity ||
    quantity !== plan.rfq.quantity ||
    quantity !== plan.totalQuantity ||
    !amount.equals(plan.totalAmount)
  )
    throw new AppError(409, 'PLAN_STALE', 'Tổng phân bổ không khớp với yêu cầu.')
}
export async function acceptInTransaction(tx, buyerId, id) {
  const plan = await tx.lockPlan(buyerId, id)
  if (plan.status === 'ACCEPTED')
    return { order: await tx.orderForPlan(id), alreadyProcessed: true }
  pending(plan)
  verifyAllocation(plan)
  const rfq = await tx.setRfqStatus(plan.rfqId, buyerId, 'BIDDING', 'ACCEPTED')
  if (rfq.count !== 1) throw transition()
  await tx.decidePlan(id, { status: 'ACCEPTED' })
  const order = await tx.createOrder(plan, buyerId)
  await tx.createTasks(order.id, plan.items)
  const chosen = plan.items.map((item) => item.bidId),
    lockedAt = new Date()
  await tx.updateBids(plan.rfqId, { in: chosen }, { status: 'ACCEPTED', lockedAt })
  await tx.updateBids(plan.rfqId, { notIn: chosen }, { status: 'REJECTED', lockedAt })
  return { order, alreadyProcessed: false }
}
export function ordersService(repo) {
  return {
    list: repo.listOrders,
    async detail(buyerId, id) {
      const order = await repo.ownedOrder(buyerId, id, true)
      const tasks = order.tasks.map(({ batch, ...task }) => ({
        ...task,
        batchCode: batch?.isPublic && batch.workshop.status === 'APPROVED' ? batch.batchCode : null,
      }))
      const progress = tasks.reduce(
        (sum, t) => ({
          quantity: sum.quantity + t.quantity,
          completedQuantity: sum.completedQuantity + t.completedQuantity,
        }),
        { quantity: 0, completedQuantity: 0 },
      )
      return { ...order, tasks, progress }
    },
    async accept(buyerId, id) {
      try {
        return await repo.transaction((tx) => acceptInTransaction(tx, buyerId, id))
      } catch (e) {
        if (e.code === 'P2002')
          throw new AppError(
            409,
            'ORDER_ALREADY_EXISTS',
            'Phương án đã có đơn hàng hoặc trùng phân công.',
          )
        throw e
      }
    },
    reject(buyerId, id, reason) {
      return repo.transaction(async (tx) => {
        const plan = await tx.lockPlan(buyerId, id)
        pending(plan)
        await tx.updateBids(plan.rfqId, { in: plan.items.map((i) => i.bidId) }, { lockedAt: null })
        return tx.decidePlan(id, { status: 'REJECTED', rejectReason: reason || null })
      })
    },
    receive(buyerId, id) {
      return repo.transaction(async (tx) => {
        const order = await tx.ownedOrder(buyerId, id)
        if ((await tx.receive(id, buyerId)).count !== 1) throw transition()
        if ((await tx.setRfqStatus(order.rfqId, buyerId, 'IN_PRODUCTION', 'DELIVERED')).count !== 1)
          throw transition()
        return tx.ownedOrder(buyerId, id)
      })
    },
  }
}
