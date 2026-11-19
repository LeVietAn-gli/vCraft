import { apiFetch, withQuery } from './client.js';
export const buyerApi = {
  categories: () => apiFetch('/categories'),
  rfqs: (filters) => apiFetch(withQuery('/rfqs', filters)),
  rfq: (id) => apiFetch(`/rfqs/${encodeURIComponent(id)}`),
  createRfq: (input) => apiFetch('/rfqs', { method: 'POST', body: input }),
  updateRfq: (id, input) => apiFetch(`/rfqs/${encodeURIComponent(id)}`, { method: 'PATCH', body: input }),
  sendRfq: (id) => apiFetch(`/rfqs/${encodeURIComponent(id)}/send`, { method: 'POST' }),
  bids: (id) => apiFetch(`/rfqs/${encodeURIComponent(id)}/bids`),
  plan: (id) => apiFetch(`/rfqs/${encodeURIComponent(id)}/plans/current`),
  accept: (id) => apiFetch(`/plans/${encodeURIComponent(id)}/accept`, { method: 'POST' }),
  reject: (id, reason) => apiFetch(`/plans/${encodeURIComponent(id)}/reject`, { method: 'POST', body: { reason } }),
  orders: (filters) => apiFetch(withQuery('/orders', filters)),
  order: (id) => apiFetch(`/orders/${encodeURIComponent(id)}`),
  received: (id) => apiFetch(`/orders/${encodeURIComponent(id)}/confirm-received`, { method: 'POST' }),
};
