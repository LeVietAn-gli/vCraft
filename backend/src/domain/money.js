// Monetary invariants use integer cents (BigInt), never floating point math.
export function toCents(value) {
  const text = String(value);
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) throw new Error('INVALID_MONEY');
  const [whole, fraction = ''] = text.split('.');
  return BigInt(whole) * 100n + BigInt((fraction + '00').slice(0, 2));
}
export function assertPlanReady(plan) {
  const items = plan.items || [];
  if (items.length === 0 || plan.status !== 'PENDING_BUYER') throw new Error('PLAN_INVALID');
  let quantity = 0;
  let cents = 0n;
  const bids = new Set();
  const workshops = new Set();
  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0 || !item.bid ||
      item.bid.rfqId !== plan.rfqId || item.bid.workshopId !== item.workshopId ||
      item.bid.status !== 'SUBMITTED' || !Number.isInteger(item.bid.quantityOffered) ||
      item.quantity > item.bid.quantityOffered || bids.has(item.bidId) || workshops.has(item.workshopId) ||
      toCents(item.unitPrice) <= 0n || toCents(item.unitPrice) !== toCents(item.bid.unitPrice)) {
      throw new Error('PLAN_INVALID');
    }
    bids.add(item.bidId);
    workshops.add(item.workshopId);
    const line = toCents(item.unitPrice) * BigInt(item.quantity);
    if (line !== toCents(item.lineTotal)) throw new Error('PLAN_INVALID');
    quantity += item.quantity;
    cents += line;
  }
  if (!Number.isInteger(plan.rfq.quantity) || quantity !== plan.rfq.quantity || quantity !== plan.totalQuantity ||
      cents !== toCents(plan.totalAmount)) throw new Error('PLAN_INVALID');
  return { quantity, totalCents: cents };
}
export function computeProgress(tasks) {
  const quantity = tasks.reduce((sum, task) => sum + task.quantity, 0);
  const completedQuantity = tasks.reduce((sum, task) => sum + task.completedQuantity, 0);
  return { quantity, completedQuantity, percentage: quantity ? Math.round(completedQuantity / quantity * 100) : 0 };
}
