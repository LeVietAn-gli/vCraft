import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../utils/error.js';

export function errorHandler(error, _req, res, _next) {
  let err = error;
  if (error instanceof ZodError) err = new AppError(400, 'VALIDATION_ERROR', null,
    error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })));
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') err = new AppError(409, 'IN_USE', 'Dữ liệu đã tồn tại hoặc bị trùng');
    if (error.code === 'P2003') err = new AppError(409, 'IN_USE', 'Dữ liệu đang được sử dụng');
  }
  if (error.status === 404 && error.code === 'NOT_FOUND') err = new AppError(404, 'NOT_FOUND', 'Không tìm thấy tài nguyên');
  if (!(err instanceof AppError)) {
    console.error('Unhandled server error:', error);
    err = new AppError(500, 'INTERNAL_ERROR');
  }
  res.status(err.status).json({ error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) } });
}
