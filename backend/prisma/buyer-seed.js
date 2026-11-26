import { buyerRepository } from '../src/modules/buyer/buyer.repository.js'
import bcrypt from 'bcryptjs'
import { acceptInTransaction } from '../src/modules/buyer/orders.service.js'

// Fixtures are inserted once. Re-running seed preserves decisions made during the demo.
export async function seedBuyers(db, password) {
  const hash =
    password && Buffer.byteLength(password) <= 72
      ? await bcrypt.hash(password, 12)
      : 'DEMO_SESSION_ONLY'
  for (const index of [1, 2, 3]) {
    const email = 'buyer' + index + '@vcraft.local'
    await db.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        role: 'BUYER',
        fullName: 'Người mua mẫu ' + index,
        phone: '090000000' + index,
        passwordHash: hash,
      },
    })
  }
  const studio = await db.workshop.findUniqueOrThrow({ where: { slug: 'men-lam' } })
  const category = await db.category.findUniqueOrThrow({ where: { slug: 'gom-gia-dung' } })
  const admin = await db.user.findUniqueOrThrow({ where: { email: 'admin@vcraft.local' } })
  for (const [suffix, account, stage, title] of [
    ['01', 1, 'DRAFT', 'Đặt bát men lam cho nhà hàng'],
    ['02', 1, 'PENDING_BUYER', 'Bộ chén làm quà tặng'],
    ['03', 1, 'READY', 'Bát gốm cho cửa hàng'],
    ['04', 2, 'IN_PRODUCTION', 'Cốc gốm in biểu trưng'],
    ['05', 3, 'SENT', 'Bình hoa cho triển lãm'],
  ]) {
    const buyer = await db.user.findUniqueOrThrow({
      where: { email: 'buyer' + account + '@vcraft.local' },
    })
    const code = 'RFQ-DEMO-' + suffix
    const day = 86400000
    const deadline = new Date(Date.now() + 7 * day),
      due = new Date(Date.now() + 30 * day)
    await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "User" WHERE id=${buyer.id}::uuid FOR UPDATE`
      if (await tx.rfq.findUnique({ where: { code } })) return
      const bidding = !['DRAFT', 'SENT'].includes(stage)
      const rfq = await tx.rfq.create({
        data: {
          code,
          buyerId: buyer.id,
          categoryId: category.id,
          title,
          description: 'Gốm gia dụng men lam, đóng gói theo bộ.',
          quantity: 100,
          unit: 'chiếc',
          budgetMax: '6000000',
          bidDeadline: deadline,
          requiredBy: due,
          contactName: buyer.fullName,
          contactPhone: buyer.phone || '0900000001',
          deliveryAddress: 'Cầu Giấy, Hà Nội',
          status: bidding ? 'BIDDING' : stage,
          sentAt: stage === 'DRAFT' ? null : new Date(),
        },
      })
      if (stage === 'DRAFT') return
      await tx.rfqInvitation.create({
        data: {
          rfqId: rfq.id,
          workshopId: studio.id,
          status: bidding ? 'BID_SUBMITTED' : 'INVITED',
        },
      })
      if (!bidding) return
      const bid = await tx.bid.create({
        data: {
          rfqId: rfq.id,
          workshopId: studio.id,
          quantityOffered: 100,
          unitPrice: 45000,
          leadTimeDays: 15,
          lockedAt: new Date(),
        },
      })
      const plan = await tx.allocationPlan.create({
        data: {
          rfqId: rfq.id,
          createdById: admin.id,
          totalQuantity: 100,
          totalAmount: 4500000,
          sentAt: new Date(),
          status: 'PENDING_BUYER',
          items: {
            create: {
              bidId: bid.id,
              workshopId: studio.id,
              quantity: 100,
              unitPrice: 45000,
              lineTotal: 4500000,
              dueDate: due,
            },
          },
        },
      })
      if (stage === 'PENDING_BUYER') return
      const { order } = await acceptInTransaction(buyerRepository(tx), buyer.id, plan.id)
      const ready = stage === 'READY'
      await tx.productionTask.updateMany({
        where: { orderId: order.id },
        data: {
          status: ready ? 'COMPLETED' : 'IN_PROGRESS',
          completedQuantity: ready ? 100 : 40,
          startedAt: new Date(),
          completedAt: ready ? new Date() : null,
        },
      })
      await tx.order.update({ where: { id: order.id }, data: { status: stage } })
      await tx.rfq.update({ where: { id: rfq.id }, data: { status: 'IN_PRODUCTION' } })
    })
  }
}
