import { Router } from 'express'
import { validate } from '../../errors.js'
import { createProductService } from './products.service.js'
import { byId, bySlug, imageOrder } from '../workshops/workshops.schema.js'
import {
  editProduct,
  managedQuery,
  newProduct,
  productImageId,
  productQuery,
} from './products.schema.js'

export function productRoutes({ products: repository, media, requireArtisan }) {
  const products = createProductService(repository, media)
  const router = Router()
  router.get('/products', validate(productQuery, 'query'), async (req, res) =>
    res.json(await products.catalog(req.validated.query)),
  )
  router.get('/products/:slug', validate(bySlug, 'params'), async (req, res) =>
    res.json({ data: await products.detail(req.validated.params.slug) }),
  )
  const owner = Router()
  owner.use(requireArtisan, (_req, res, next) => {
    res.set('Cache-Control', 'private, no-store')
    next()
  })
  owner.get('/', validate(managedQuery, 'query'), async (req, res) =>
    res.json(await products.list(req.user.id, req.validated.query)),
  )
  owner.get('/:id', validate(byId, 'params'), async (req, res) =>
    res.json({ data: await products.get(req.user.id, req.validated.params.id) }),
  )
  owner.post('/', validate(newProduct), async (req, res) => {
    const body = req.validated.body
    return res.status(201).json({ data: await products.create(req.user.id, body) })
  })
  owner.patch('/:id', validate(byId, 'params'), validate(editProduct), async (req, res) =>
    res.json({
      data: await products.update(req.user.id, req.validated.params.id, req.validated.body),
    }),
  )
  owner.delete('/:id', validate(byId, 'params'), async (req, res) => {
    await products.remove(req.user.id, req.validated.params.id)
    res.sendStatus(204)
  })
  owner.post(
    '/:id/images',
    validate(byId, 'params'),
    async (req, _res, next) => {
      await products.get(req.user.id, req.validated.params.id)
      next()
    },
    media.receive(false, async (req, res) => {
      const data = await products.upload(
        req.user.id,
        req.validated.params.id,
        req.files ?? [],
        req.body,
      )
      res.status(201).json({ data })
    }),
  )
  owner.patch(
    '/:id/images/order',
    validate(byId, 'params'),
    validate(imageOrder),
    async (req, res) =>
      res.json({
        data: await products.reorder(req.user.id, req.validated.params.id, req.validated.body.ids),
      }),
  )
  owner.patch(
    '/:id/images/:imageId/primary',
    validate(productImageId, 'params'),
    async (req, res) => {
      const { id, imageId } = req.validated.params
      res.json({ data: await products.primary(req.user.id, id, imageId) })
    },
  )
  owner.delete('/:id/images/:imageId', validate(productImageId, 'params'), async (req, res) => {
    const { id, imageId } = req.validated.params
    await products.removeImage(req.user.id, id, imageId)
    res.sendStatus(204)
  })
  router.use('/me/products', owner)
  return router
}
