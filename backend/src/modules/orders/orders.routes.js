import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { requireAuth, requireRole } from '../../middlewares/auth.js';
import { asyncHandler } from '../../utils/error.js';
import { idSchema, orderListSchema, rejectSchema } from './orders.schema.js';
import { acceptPlan, rejectPlan, listOrders, getOrder, confirmReceived } from './orders.service.js';

export const planBuyerRouter = Router();
planBuyerRouter.use(requireAuth, requireRole('BUYER'));
planBuyerRouter.post('/:id/accept', validate(idSchema, 'params'), asyncHandler(async (req, res) => {
  const result = await acceptPlan(req.params.id, req.user.id);
  res.status(result.alreadyProcessed ? 200 : 201).json({ data: result });
}));
planBuyerRouter.post('/:id/reject', validate(idSchema, 'params'), validate(rejectSchema), asyncHandler(async (req, res) => {
  res.json({ data: await rejectPlan(req.params.id, req.user.id, req.body.reason) });
}));

export const orderRouter = Router();
orderRouter.use(requireAuth);
orderRouter.get('/', requireRole('BUYER', 'ADMIN'), validate(orderListSchema, 'query'), asyncHandler(async (req, res) => {
  res.json(await listOrders(req.user, req.validatedQuery));
}));
orderRouter.get('/:id', requireRole('BUYER', 'ADMIN'), validate(idSchema, 'params'), asyncHandler(async (req, res) => {
  res.json({ data: await getOrder(req.user, req.params.id) });
}));
orderRouter.post('/:id/confirm-received', requireRole('BUYER'), validate(idSchema, 'params'), asyncHandler(async (req, res) => {
  res.json({ data: await confirmReceived(req.params.id, req.user.id) });
}));
