import { Router } from 'express'
import { validate } from '../../errors.js'
import { workshopController } from './workshops.controller.js'
import { byId, bySlug, catalogQuery, imageOrder, profilePatch } from './workshops.schema.js'

export function workshopRoutes({ service, media, requireArtisan }) {
  const router = Router()
  const controller = workshopController(service)
  router.get('/categories', controller.categories)
  router.get('/workshops', validate(catalogQuery, 'query'), controller.list)
  router.get(
    '/workshops/suggest',
    validate(catalogQuery.pick({ q: true }), 'query'),
    controller.suggest,
  )
  router.get(
    '/workshops/map',
    validate(catalogQuery.pick({ isOpenForVisit: true }), 'query'),
    controller.map,
  )
  router.get('/workshops/:slug', validate(bySlug, 'params'), controller.detail)
  const owner = Router()
  owner.use(requireArtisan)
  owner.use((_req, res, next) => {
    res.set('Cache-Control', 'private, no-store')
    next()
  })
  const mayUpload = async (req, _res, next) => {
    await service.mayUpload(req.user.id)
    next()
  }
  owner.get('/', controller.own)
  owner.patch('/', validate(profilePatch), controller.update)
  owner.post('/images', mayUpload, media.receive(false, controller.addImages))
  owner.patch('/images/order', validate(imageOrder), controller.orderImages)
  owner.delete('/images/:id', validate(byId, 'params'), controller.remove(false))
  owner.post('/certificates', mayUpload, media.receive(true, controller.addCertificate))
  owner.delete('/certificates/:id', validate(byId, 'params'), controller.remove(true))
  router.use('/me/workshop', owner)
  return router
}
