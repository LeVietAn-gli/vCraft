// File này làm gì: Nhận yêu cầu tạo, đọc, sửa lô và quản lý mốc.
// Ai gọi file này: app.js khi khởi tạo các API sản xuất.
import { Router } from 'express'
import { validate } from '../../errors.js'
import { byId } from '../workshops/workshops.schema.js'
import {
  batchQuery,
  createBatch,
  patchBatch,
  createMilestone,
  patchMilestone,
  milestoneOrder,
} from './batches.schema.js'
import { createBatchService } from './batches.service.js'

// Các route dùng danh tính phiên và chỉ nhận tham số đã qua Zod.
export function batchRoutes({ batches, journal, media, requireArtisan }) {
  const router = Router()
  const service = createBatchService(batches, journal, media)
  const batch = Router()
  batch.use(requireArtisan, (_req, res, next) => {
    res.set('Cache-Control', 'private, no-store')
    next()
  })
  batch.get('/', validate(batchQuery, 'query'), async (req, res) =>
    res.json(await service.list(req.user.id, req.validated.query)),
  )
  batch.post('/', validate(createBatch), async (req, res) =>
    res.status(201).json({ data: await service.create(req.user.id, req.validated.body) }),
  )
  batch.get('/:id', validate(byId, 'params'), async (req, res) =>
    res.json({ data: await service.get(req.user.id, req.validated.params.id) }),
  )
  batch.patch('/:id', validate(byId, 'params'), validate(patchBatch), async (req, res) =>
    res.json({
      data: await service.update(req.user.id, req.validated.params.id, req.validated.body),
    }),
  )
  batch.delete('/:id', validate(byId, 'params'), async (req, res) => {
    await service.removeBatch(req.user.id, req.validated.params.id)
    res.sendStatus(204)
  })
  batch.post(
    '/:id/milestones',
    validate(byId, 'params'),
    validate(createMilestone),
    async (req, res) =>
      res.status(201).json({
        data: await journal.create(req.user.id, req.validated.params.id, req.validated.body),
      }),
  )
  batch.patch(
    '/:id/milestones/order',
    validate(byId, 'params'),
    validate(milestoneOrder),
    async (req, res) =>
      res.json({
        data: await journal.reorder(req.user.id, req.validated.params.id, req.validated.body.ids),
      }),
  )
  router.use('/me/batches', batch)
  router.patch(
    '/me/milestones/:id',
    requireArtisan,
    validate(byId, 'params'),
    validate(patchMilestone),
    async (req, res) =>
      res.json({
        data: await journal.update(req.user.id, req.validated.params.id, req.validated.body),
      }),
  )
  router.delete(
    '/me/milestones/:id',
    requireArtisan,
    validate(byId, 'params'),
    async (req, res) => {
      await service.removeMilestone(req.user.id, req.validated.params.id)
      res.sendStatus(204)
    },
  )
  return router
}
