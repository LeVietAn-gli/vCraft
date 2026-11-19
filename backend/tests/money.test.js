import test from 'node:test';
import assert from 'node:assert/strict';
import { toCents, assertPlanReady, computeProgress } from '../src/domain/money.js';

function validPlan() {
  const rfqId = 'rfq-A';
  const bid = (id, ws, qty, price) => ({ id, rfqId, workshopId: ws, quantityOffered: qty,
    status: 'SUBMITTED', unitPrice: price });
  return {
    rfqId, status: 'PENDING_BUYER', rfq: { quantity: 5000 }, totalQuantity: 5000,
    totalAmount: '211200000.00',
    items: [
      { bidId: 'b1', workshopId: 'w1', quantity: 2000, unitPrice: '42000.00', lineTotal: '84000000.00', bid: bid('b1','w1',2000,'42000.00') },
      { bidId: 'b2', workshopId: 'w2', quantity: 1800, unitPrice: '44000.00', lineTotal: '79200000.00', bid: bid('b2','w2',1800,'44000.00') },
      { bidId: 'b3', workshopId: 'w3', quantity: 1200, unitPrice: '40000.00', lineTotal: '48000000.00', bid: bid('b3','w3',1200,'40000.00') },
    ],
  };
}

test('toCents giữ chính xác tiền lớn mà Number không biểu diễn được', () => {
  assert.equal(toCents('9007199254740993.01'), 900719925474099301n);
  assert.equal(toCents('100.5'), 10050n);
  assert.equal(toCents('0'), 0n);
});
test('toCents từ chối số âm, số mũ, số lẻ quá hai chữ số', () => {
  for (const invalid of ['-2', '0.123', 'NaN', 'Infinity', '1e6', '', '1,000', ' 1'])
    assert.throws(() => toCents(invalid), /INVALID_MONEY/, invalid);
});
test('phương án đúng trả tổng khối lượng và tổng tiền chính xác', () => {
  assert.deepEqual(assertPlanReady(validPlan()), { quantity: 5000, totalCents: 21120000000n });
});

test('chặn phương án thiếu/vượt khối lượng, tổng tiền sai, thiếu xưởng', () => {
  for (const bad of [
    (p) => { p.totalQuantity += 1; },
    (p) => { p.rfq.quantity -= 1; },
    (p) => { p.totalAmount = '211200000.01'; },
    (p) => { p.items.pop(); },
    (p) => { p.items[0].quantity = 2001; },
    (p) => { p.items[1].lineTotal = '79200000.01'; },
    (p) => { p.items[1].unitPrice = '43000.00'; },
    (p) => { p.items[1].unitPrice = '0'; p.items[1].bid.unitPrice = '0'; },
    (p) => { p.items[1].bid.rfqId = 'rfq-B'; },
    (p) => { p.items[1].bid.workshopId = 'other'; },
    (p) => { p.items[1].bid.status = 'REJECTED'; },
    (p) => { p.items[1].bid.quantityOffered = 5; },
    (p) => { p.items[1].bidId = p.items[0].bidId; },
    (p) => { p.items[1].workshopId = p.items[0].workshopId; },
    (p) => { p.items[1].quantity = 0; },
    (p) => { p.items[1].quantity = 1.5; },
    (p) => { p.status = 'ACCEPTED'; },
  ]) {
    const plan = validPlan();bad(plan);
    assert.throws(() => assertPlanReady(plan), /PLAN_INVALID/);
  }
});

test('tiến độ lấy tổng sản lượng, không đếm số xưởng hoàn tất', () => {
  assert.deepEqual(computeProgress([
    { quantity: 100, completedQuantity: 100 },
    { quantity: 900, completedQuantity: 0 },
  ]), { quantity: 1000, completedQuantity: 100, percentage: 10 });
  assert.equal(computeProgress([]).percentage, 0);
});
