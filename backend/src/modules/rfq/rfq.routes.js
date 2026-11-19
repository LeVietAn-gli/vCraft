import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { requireAuth, requireRole } from '../../middlewares/auth.js';
import { asyncHandler } from '../../utils/error.js';
import { createRfqSchema, editRfqSchema, listRfqSchema, idSchema } from './rfq.schema.js';
import { createRfq, listRfqs, getRfq, updateRfq, sendRfq } from './rfq.service.js';

export const rfqRouter = Router();
rfqRouter.use(requireAuth);
rfqRouter.post('/', requireRole('BUYER'), validate(createRfqSchema), asyncHandler(async (req, res) => {
  res.status(201).json({ data: await createRfq(req.user.id, req.body) });
}));
rfqRouter.get('/', requireRole('BUYER', 'ADMIN'), validate(listRfqSchema, 'query'), asyncHandler(async (req, res) => {
  res.json(await listRfqs(req.user, req.validatedQuery));
}));
rfqRouter.get('/:id', requireRole('BUYER', 'ADMIN', 'ARTISAN'), validate(idSchema, 'params'), asyncHandler(async (req, res) => {
  res.json({ data: await getRfq(req.user, req.params.id) });
}));
rfqRouter.patch('/:id', requireRole('BUYER'), validate(idSchema, 'params'), validate(editRfqSchema), asyncHandler(async (req, res) => {
  res.json({ data: await updateRfq(req.user.id, req.params.id, req.body) });
}));
rfqRouter.post('/:id/send', requireRole('BUYER'), validate(idSchema, 'params'), asyncHandler(async (req, res) => {
  res.json({ data: await sendRfq(req.user.id, req.params.id) });
}));
