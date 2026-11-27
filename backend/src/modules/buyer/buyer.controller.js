const amounts = new Set(['budgetMax', 'unitPrice', 'lineTotal', 'totalAmount'])
function toWire(value, field) {
  if (value == null) return value
  if (amounts.has(field) && typeof value.toFixed === 'function') return value.toFixed(2)
  if (value instanceof Date)
    return ['requiredBy', 'dueDate'].includes(field)
      ? value.toISOString().slice(0, 10)
      : value.toISOString()
  if (Array.isArray(value)) return value.map((item) => toWire(item))
  if (typeof value === 'object')
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toWire(item, key)]))
  return value
}

export function buyerController(rfqs, orders) {
  const detail = (read) => async (req, res) =>
    res.json({ data: toWire(await read(req.user.id, req.params.id)) })
  const list = (read) => async (req, res) =>
    res.json(toWire(await read(req.user.id, req.validated.query)))
  return {
    listRfqs: list(rfqs.list),
    listOrders: list(orders.list),
    rfq: detail(rfqs.detail),
    bids: detail(rfqs.bids),
    currentPlan: detail(rfqs.currentPlan),
    order: detail(orders.detail),
    send: detail(rfqs.send),
    receive: detail(orders.receive),
    create: async (req, res) =>
      res.status(201).json({ data: toWire(await rfqs.create(req.user.id, req.validated.body)) }),
    edit: async (req, res) =>
      res.json({ data: toWire(await rfqs.edit(req.user.id, req.params.id, req.validated.body)) }),
    reject: async (req, res) =>
      res.json({
        data: toWire(await orders.reject(req.user.id, req.params.id, req.validated.body.reason)),
      }),
    async accept(req, res) {
      const data = await orders.accept(req.user.id, req.params.id)
      res.status(data.alreadyProcessed ? 200 : 201).json({ data: toWire(data) })
    },
  }
}
