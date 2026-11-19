import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { validate } from '../../middlewares/validate.js';
import { requireAuth } from '../../middlewares/auth.js';
import { asyncHandler } from '../../utils/error.js';
import { registerSchema, loginSchema } from './auth.schema.js';
import { register, verifyCredentials } from './auth.service.js';
import { authRepository } from './auth.repository.js';

export const authRouter = Router();
authRouter.post('/register', validate(registerSchema), asyncHandler(async (req, res) => {
  res.status(201).json({ data: await register(req.body) });
}));
authRouter.post('/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 10,
  standardHeaders: 'draft-7', legacyHeaders: false, message: { error: { code: 'TOO_MANY_ATTEMPTS', message: 'Thử lại sau ít phút' } },
}), validate(loginSchema), asyncHandler(async (req, res) => {
  const user = await verifyCredentials(req.body);
  await new Promise((resolve, reject) => req.session.regenerate((err) => err ? reject(err) : resolve()));
  req.session.userId = user.id;
  await new Promise((resolve, reject) => req.session.save((err) => err ? reject(err) : resolve()));
  res.json({ data: await authRepository.findPublic(user.id) });
}));
authRouter.post('/logout', requireAuth, asyncHandler(async (req, res) => {
  await new Promise((resolve, reject) => req.session.destroy((err) => err ? reject(err) : resolve()));
  res.clearCookie('vcraft.sid', { path: '/' });
  res.status(204).end();
}));
authRouter.get('/me', requireAuth, asyncHandler(async (req, res) => {
  res.json({ data: await authRepository.findPublic(req.user.id) });
}));
