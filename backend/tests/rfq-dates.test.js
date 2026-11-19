import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSendDates } from '../src/domain/rfq-dates.js';
import { AppError } from '../src/utils/error.js';
const now = new Date('2026-11-19T08:00:00.000Z');
const valid = () => ({ title: 'Đặt 5000 cốc thủ công', quantity: 5000,
  deliveryAddress: 'Cầu Giấy, Hà Nội', bidDeadline: new Date('2026-11-22T11:00:00.000Z'),
  requiredBy: new Date('2026-12-14T00:00:00.000Z') });
test('cho gửi khi deadline ở tương lai và giao sau deadline', () => {
  assert.doesNotThrow(() => validateSendDates(valid(), now));
});
test('không cho gửi nếu hạn báo giá đã qua', () => {
  const rfq = valid();rfq.bidDeadline = new Date('2026-11-19T07:59:59.000Z');
  assert.throws(() => validateSendDates(rfq, now), AppError);
});
test('không cho giao cùng ngày với hạn nhận báo giá', () => {
  const rfq = valid();rfq.requiredBy = new Date('2026-11-22T00:00:00.000Z');
  assert.throws(() => validateSendDates(rfq, now), /Hạn giao hàng/);
});
test('không cho gửi dữ liệu phi lý hoặc ngày lỗi', () => {
  for (const makeInvalid of [
    (r) => { r.bidDeadline = new Date('invalid'); },
    (r) => { r.requiredBy = new Date('invalid'); },
    (r) => { r.quantity = 0; },
    (r) => { r.quantity = 1.5; },
    (r) => { r.title = ''; },
    (r) => { r.deliveryAddress = ''; },
  ]) { const rfq = valid();makeInvalid(rfq);assert.throws(() => validateSendDates(rfq, now), AppError); }
});
