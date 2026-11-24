import { Router } from 'express'
import { validate } from '../../errors.js'
import { uploadGallery } from '../media/gallery.js'
import { productImageId } from '../products/products.schema.js'
import { byId } from '../workshops/workshops.schema.js'

export function milestoneImageRoutes({ milestones, media, requireArtisan }) {
  const router = Router()
  router.use('/me/milestones', requireArtisan, (_req, res, next) => {
    res.set('Cache-Control', 'private, no-store')
    next()
  })
  router.get('/me/milestones', async (req, res) =>
    res.json({ data: await milestones.list(req.user.id) }),
  )
  router.get('/me/milestones/:id/images', validate(byId, 'params'), async (req, res) =>
    res.json({
      data: {
        ...(await milestones.get(req.user.id, req.validated.params.id)),
        maxUploadMb: media.maxUploadMb,
      },
    }),
  )
  router.post(
    '/me/milestones/:id/images',
    validate(byId, 'params'),
    async (req, _res, next) => {
      await milestones.get(req.user.id, req.validated.params.id)
      next()
    },
    media.receive(false, async (req, res) => {
      const data = await uploadGallery(media, req.files ?? [], req.body, (entries) =>
        milestones.append(req.user.id, req.validated.params.id, entries),
      )
      res.status(201).json({ data })
    }),
  )
  router.delete(
    '/me/milestones/:id/images/:imageId',
    validate(productImageId, 'params'),
    async (req, res) => {
      const { id, imageId } = req.validated.params
      const image = await milestones.remove(req.user.id, id, imageId)
      await media.clean([image.imageUrl, image.thumbUrl])
      res.sendStatus(204)
    },
  )
  return router
}
