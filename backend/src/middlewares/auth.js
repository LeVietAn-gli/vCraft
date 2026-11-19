import { prisma } from '../lib/prisma.js';
import { AppError, asyncHandler } from '../utils/error.js';

export const requireAuth = asyncHandler(async (req, _res, next) => {
  if (!req.session?.userId) throw new AppError(401, 'UNAUTHENTICATED');
  const user = await prisma.user.findUnique({ where: { id: req.session.userId },
    select: { id: true, role: true, status: true } });
  if (!user || user.status !== 'ACTIVE') throw new AppError(401, 'UNAUTHENTICATED');
  req.user = user;
  next();
});
export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) return next(new AppError(401, 'UNAUTHENTICATED'));
  if (!roles.includes(req.user.role)) return next(new AppError(403, 'FORBIDDEN'));
  next();
};
