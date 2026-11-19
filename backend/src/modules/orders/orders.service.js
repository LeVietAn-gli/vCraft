import { prisma } from '../../lib/prisma.js';
import { newCode } from '../../utils/code.js';
import { AppError } from '../../utils/error.js';
import { paginationMeta } from '../../utils/pagination.js';
import { assertPlanReady, computeProgress } from '../../domain/money.js';
import { ordersRepository } from './orders.repository.js';

async function resolveAlreadyProcessed(tx, planId, buyerId) {
  const plan = await ordersRepository.findPlan(tx, planId);
  if (!plan || plan.rfq.buyerId !== buyerId) throw new AppError(404, 'PLAN_NOT_FOUND');
  if (plan.status === 'REJECTED') throw new AppError(409, 'PLAN_REJECTED');
  if (plan.status === 'DRAFT') throw new AppError(409, 'PLAN_NOT_SENT');
  const order = await ordersRepository.findExistingOrder(tx, planId, buyerId);
  if (plan.status === 'ACCEPTED' && order) return { order, alreadyProcessed: true };
  throw new AppError(409, 'INVALID_TRANSITION');
}
async function findCommittedOrder(planId, buyerId) {
  const plan = await prisma.allocationPlan.findUnique({ where: { id: planId },
    select: { status: true, rfq: { select: { buyerId: true } } } });
  if (plan?.status !== 'ACCEPTED' || plan.rfq.buyerId !== buyerId) return null;
  const order = await prisma.order.findUnique({ where: { planId } });
  return order ? { order, alreadyProcessed: true } : null;
}

export async function acceptPlan(planId, buyerId) {
  try {
    return await prisma.$transaction(async (tx) => {
      const plan = await ordersRepository.findPlan(tx, planId);
      if (!plan || plan.rfq.buyerId !== buyerId) throw new AppError(404, 'PLAN_NOT_FOUND');
      if (plan.status !== 'PENDING_BUYER') return resolveAlreadyProcessed(tx, planId, buyerId);
      if (plan.rfq.status !== 'BIDDING') throw new AppError(409, 'RFQ_NOT_BIDDING');
      // Compare-and-set on the parent plan serializes competing accept/reject requests.
      const { count } = await tx.allocationPlan.updateMany({
        where: { id: planId, status: 'PENDING_BUYER' },
        data: { status: 'ACCEPTED', decidedAt: new Date() },
      });
      if (count !== 1) return resolveAlreadyProcessed(tx, planId, buyerId);
      try { assertPlanReady(plan); }
      catch { throw new AppError(409, 'PLAN_INVALID'); }
      const rfqResult = await tx.rfq.updateMany({
        where: { id: plan.rfqId, status: 'BIDDING' }, data: { status: 'ACCEPTED' },
      });
      if (rfqResult.count !== 1) throw new AppError(409, 'RFQ_NOT_BIDDING');
      const order = await tx.order.create({ data: {
        code: newCode('ORD'), rfqId: plan.rfqId, planId, buyerId,
        totalAmount: plan.totalAmount,
      } });
      await tx.productionTask.createMany({ data: plan.items.map((item) => ({
        orderId: order.id, workshopId: item.workshopId, planItemId: item.id,
        quantity: item.quantity, unitPrice: item.unitPrice, dueDate: item.dueDate,
      })) });
      const chosen = plan.items.map((item) => item.bidId);
      const now = new Date();
      await tx.bid.updateMany({ where: { id: { in: chosen } }, data: { status: 'ACCEPTED', lockedAt: now } });
      await tx.bid.updateMany({ where: { rfqId: plan.rfqId, id: { notIn: chosen } },
        data: { status: 'REJECTED', lockedAt: now } });
      return { order, alreadyProcessed: false };
    }, { maxWait: 5000, timeout: 15000 });
  } catch (error) {
    // Even in a racing request, a committed result must be discoverable by (planId, buyerId).
    if (['P2002', 'P2034'].includes(error?.code)) {
      const existing = await findCommittedOrder(planId, buyerId);
      if (existing) return existing;
      throw new AppError(409, 'ORDER_ALREADY_EXISTS');
    }
    throw error;
  }
}
export async function rejectPlan(planId, buyerId, reason) {
  return prisma.$transaction(async (tx) => {
    const plan = await ordersRepository.findPlan(tx, planId);
    if (!plan || plan.rfq.buyerId !== buyerId) throw new AppError(404, 'PLAN_NOT_FOUND');
    const result = await tx.allocationPlan.updateMany({
      where: { id: planId, status: 'PENDING_BUYER' },
      data: { status: 'REJECTED', rejectReason: reason || null, decidedAt: new Date() },
    });
    if (result.count !== 1) throw new AppError(409, 'INVALID_TRANSITION');
    await tx.bid.updateMany({ where: { id: { in: plan.items.map((item) => item.bidId) }, status: 'SUBMITTED' },
      data: { lockedAt: null } });
    return { id: planId, status: 'REJECTED', rejectReason: reason || null };
  });
}
export async function listOrders(user, { status, page, limit }) {
  const where = { ...(user.role === 'BUYER' ? { buyerId: user.id } : {}), ...(status ? { status } : {}) };
  const result = await ordersRepository.list(where, page, limit);
  return { data: result.data.map(({ tasks, ...order }) => ({ ...order, progress: computeProgress(tasks) })),
    meta: paginationMeta(page, limit, result.total) };
}
export async function getOrder(user, id) {
  const order = await ordersRepository.byId({ id, ...(user.role === 'BUYER' ? { buyerId: user.id } : {}) });
  if (!order) throw new AppError(404, 'ORDER_NOT_FOUND');
  return { ...order, progress: computeProgress(order.tasks) };
}
export async function confirmReceived(orderId, buyerId) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({ where: { id: orderId, buyerId } });
    if (!order) throw new AppError(404, 'ORDER_NOT_FOUND');
    const updated = await tx.order.updateMany({ where: { id: orderId, buyerId, status: 'READY' },
      data: { status: 'DELIVERED', receivedAt: new Date() } });
    if (updated.count !== 1) throw new AppError(409, 'INVALID_TRANSITION', 'Chỉ xác nhận được khi mọi xưởng đã bàn giao');
    const rfq = await tx.rfq.updateMany({ where: { id: order.rfqId, status: 'IN_PRODUCTION' },
      data: { status: 'DELIVERED' } });
    if (rfq.count !== 1) throw new AppError(409, 'INVALID_TRANSITION');
    return tx.order.findUnique({ where: { id: orderId } });
  });
}
