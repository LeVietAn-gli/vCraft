import { AppError } from '../utils/error.js';
import { env } from '../config/env.js';

export function csrf(req, _res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  // Browser sends Origin on JSON/form mutations; reject missing origin, too.
  const origin = req.get('Origin');
  if (!origin || origin !== new URL(env.publicUrl).origin) return next(new AppError(403, 'CSRF_REJECTED'));
  next();
}
