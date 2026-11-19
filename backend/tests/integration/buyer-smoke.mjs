/**
 * Manual destructive smoke test for a disposable database seeded with `npm run db:seed`.
 * Run against a running dev server: node backend/tests/integration/buyer-smoke.mjs
 * DO NOT run against production. It accepts demo RFQ 3 and delivers demo order 5.
 */
import assert from 'node:assert/strict';

const baseUrl = process.env.SMOKE_BASE_URL || 'http://localhost:4000';
const origin = process.env.SMOKE_ORIGIN || 'http://localhost:5173';
const password = process.env.SMOKE_PASSWORD || 'Demo@2026!';
if (process.env.NODE_ENV === 'production') throw new Error('Smoke test không chạy trên production');

function client() {
  let cookie = '';
  return {
    async call(path, options = {}) {
      const response = await fetch(`${baseUrl}/api${path}`, {
        method: options.method || 'GET',
        headers: { Origin: origin, ...(cookie ? { Cookie: cookie } : {}),
          ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      });
      if (response.headers.get('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
      const payload = response.status === 204 ? null : await response.json();
      return { status: response.status, payload };
    },
    async login(email) {
      const result = await this.call('/auth/login', { method: 'POST', body: { email, password } });
      assert.equal(result.status, 200, `${email}: ${JSON.stringify(result.payload)}`);
    },
  };
}
const buyer1 = client(), buyer2 = client();
await buyer1.login('buyer1@vcraft.demo');
await buyer2.login('buyer2@vcraft.demo');
const list = await buyer1.call('/rfqs?limit=50');
assert.equal(list.status, 200);
const rfq = list.payload.data.find((x) => x.code === 'RFQ-2026-DEMO3');
assert.ok(rfq, 'Seed RFQ-2026-DEMO3 missing');
const forbidden = await buyer2.call(`/rfqs/${rfq.id}`);
assert.equal(forbidden.status, 404, 'Buyer B cannot read Buyer A RFQ');
const planResp = await buyer1.call(`/rfqs/${rfq.id}/plans/current`);
assert.equal(planResp.status, 200);
const plan = planResp.payload.data;
const wrongBuyer = await buyer2.call(`/plans/${plan.id}/accept`, { method: 'POST' });
assert.equal(wrongBuyer.status, 404, 'Buyer B cannot accept Buyer A plan');
const attempts = await Promise.all(Array.from({ length: 2 }, () => buyer1.call(`/plans/${plan.id}/accept`, { method: 'POST' })));
assert.ok(attempts.every((x) => [200,201].includes(x.status)), 'Concurrent accept should be idempotent');
const orderId = attempts[0].payload.data.order.id;
assert.equal(attempts[1].payload.data.order.id, orderId, 'Accept must return the same order');
const order = await buyer1.call(`/orders/${orderId}`);
assert.equal(order.status, 200);
assert.equal(order.payload.data.tasks.length, 3, 'Exactly three workshop tasks expected');
const forbiddenOrder = await buyer2.call(`/orders/${orderId}`);
assert.equal(forbiddenOrder.status, 404);
const duplicate = await buyer1.call(`/plans/${plan.id}/accept`, { method: 'POST' });
assert.equal(duplicate.status, 200);
assert.equal(duplicate.payload.data.alreadyProcessed, true);
const buyer2Orders = await buyer2.call('/orders?status=READY');
assert.equal(buyer2Orders.status, 200);
const ready = buyer2Orders.payload.data.find((o) => o.status === 'READY');
assert.ok(ready, 'Seed READY order missing');
const buyer1WrongReceipt = await buyer1.call(`/orders/${ready.id}/confirm-received`, { method: 'POST' });
assert.equal(buyer1WrongReceipt.status, 404);
const receipt = await buyer2.call(`/orders/${ready.id}/confirm-received`, { method: 'POST' });
assert.equal(receipt.status, 200);
assert.equal(receipt.payload.data.status, 'DELIVERED');
const again = await buyer2.call(`/orders/${ready.id}/confirm-received`, { method: 'POST' });
assert.equal(again.status, 409);
const logout = await buyer1.call('/auth/logout', { method: 'POST' });
assert.equal(logout.status, 204);
const after = await buyer1.call('/auth/me');
assert.equal(after.status, 401);
console.log('PASS: session, owner isolation, concurrent accept, task count, idempotency, receipt, logout');
