import { AppError } from '../utils/error.js';

// A PostgreSQL DATE is represented as midnight UTC; compare calendar days in UTC.
export function validateSendDates(rfq, now = new Date()) {
  if (!(rfq.bidDeadline instanceof Date) || Number.isNaN(+rfq.bidDeadline) || rfq.bidDeadline <= now) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Hạn nhận báo giá phải ở tương lai');
  }
  if (!(rfq.requiredBy instanceof Date) || Number.isNaN(+rfq.requiredBy)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Ngày giao hàng không hợp lệ');
  }
  const deadlineDate = rfq.bidDeadline.toISOString().slice(0, 10);
  const requiredDate = rfq.requiredBy.toISOString().slice(0, 10);
  if (requiredDate <= deadlineDate) throw new AppError(400, 'VALIDATION_ERROR', 'Hạn giao hàng phải sau ngày hết nhận báo giá');
  if (typeof rfq.title !== 'string' || rfq.title.trim().length < 5 || !Number.isInteger(rfq.quantity) ||
      rfq.quantity <= 0 || typeof rfq.deliveryAddress !== 'string' || !rfq.deliveryAddress.trim()) {
    throw new AppError(400, 'VALIDATION_ERROR');
  }
}
