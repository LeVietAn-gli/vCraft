import { Router } from 'express'
import qrcode from 'qrcode'
import { z } from 'zod'
import { AppError, validate } from '../errors.js'
import { byId, catalogQuery } from '../modules/workshops/workshops.schema.js'

export function demoDataRoutes({ repository, origin, requireArtisan }) {
  const router = Router()
  const code = z.object({ batchCode: z.string().regex(/^[A-Z0-9-]{1,100}$/i) })
  const query = z.object({
    format: z.enum(['png', 'svg']).default('png'),
    size: z.coerce.number().int().min(128).max(1024).default(320),
  })
  router.get(
    '/products',
    validate(catalogQuery.pick({ page: true, limit: true }), 'query'),
    async (req, res) => res.json(await repository.publicProducts(req.validated.query)),
  )
  router.get('/trace/:batchCode', validate(code, 'params'), async (req, res) => {
    const value = await repository.trace(req.validated.params.batchCode)
    if (!value) throw new AppError(404, 'BATCH_NOT_FOUND', 'Không tìm thấy lô công khai.')
    res.json({ data: value })
  })
  router.get(
    '/me/batches/:id/qr',
    requireArtisan,
    validate(byId, 'params'),
    validate(query, 'query'),
    async (req, res) => {
      const batch = await repository.ownedBatch(req.user.id, req.validated.params.id)
      if (!batch) throw new AppError(404, 'BATCH_NOT_FOUND', 'Không tìm thấy lô của xưởng.')
      const { format, size } = req.validated.query
      const url = origin + '/truy-xuat/' + encodeURIComponent(batch.batchCode)
      const file =
        format === 'svg'
          ? await qrcode.toString(url, { type: 'svg', width: size })
          : await qrcode.toBuffer(url, { width: size })
      res.type(format).set('Cache-Control', 'private, no-store').send(file)
    },
  )
  return router
}
