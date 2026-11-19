/** Temporary N3 read bridge: Buyer/Admin views for bids and allocation plans.
 * Remove/replace these handlers when N3 merges its own bids/plans modules. */
import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validate.js';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { AppError, asyncHandler } from '../utils/error.js';

export const buyerReadRouter = Router();
buyerReadRouter.use(requireAuth, requireRole('BUYER', 'ADMIN'));
const idSchema = z.object({ id: z.string().uuid() });
async function ensureRfqAccess(req) {
  const rfq = await prisma.rfq.findFirst({ where: { id: req.params.id,
    ...(req.user.role === 'BUYER' ? { buyerId: req.user.id } : {}) }, select: { id: true } });
  if (!rfq) throw new AppError(404, 'RFQ_NOT_FOUND');
}
buyerReadRouter.get('/:id/bids', validate(idSchema, 'params'), asyncHandler(async (req, res) => {
  await ensureRfqAccess(req);
  const bids = await prisma.bid.findMany({ where: { rfqId: req.params.id },
    include: { workshop: { select: { name: true, slug: true } } }, orderBy: { createdAt: 'asc' } });
  res.json({ data: bids });
}));
buyerReadRouter.get('/:id/plans/current', validate(idSchema, 'params'), asyncHandler(async (req, res) => {
  await ensureRfqAccess(req);
  const plan = await prisma.allocationPlan.findFirst({ where: { rfqId: req.params.id, status: { in: ['PENDING_BUYER', 'ACCEPTED', 'REJECTED'] } },
    orderBy: { createdAt: 'desc' }, include: {
      items: { include: { workshop: { select: { name: true, slug: true } }, bid: { select: { id: true, leadTimeDays: true } } } },
    } });
  if (!plan) throw new AppError(404, 'PLAN_NOT_FOUND');
  res.json({ data: plan });
}));
