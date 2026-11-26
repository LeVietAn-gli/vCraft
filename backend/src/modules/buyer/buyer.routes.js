import { Router } from 'express'
import { z } from 'zod'
import { requireBuyer } from '../auth/auth.js'
import { validate } from '../../errors.js'
import { byId } from '../workshops/workshops.schema.js'
import { draft, patch, reason, rfqQuery, orderQuery } from './buyer.schema.js'
import { rfqService } from './rfq.service.js'
import { ordersService } from './orders.service.js'
import { buyerRepository } from './buyer.repository.js'
import { buyerController } from './buyer.controller.js'

export function buyerRoutes(db) {
  const router = Router()
  const repo = buyerRepository(db)
  const controller = buyerController(rfqService(repo), ordersService(repo))
  const id = validate(byId, 'params')
  const empty = validate(z.strictObject({}))
  router.get('/rfqs', requireBuyer, validate(rfqQuery, 'query'), controller.listRfqs)
  router.post('/rfqs', requireBuyer, validate(draft), controller.create)
  router.get('/rfqs/:id', requireBuyer, id, controller.rfq)
  router.patch('/rfqs/:id', requireBuyer, id, validate(patch), controller.edit)
  router.post('/rfqs/:id/send', requireBuyer, id, empty, controller.send)
  router.get('/rfqs/:id/bids', requireBuyer, id, controller.bids)
  router.get('/rfqs/:id/plans/current', requireBuyer, id, controller.currentPlan)
  router.post('/plans/:id/accept', requireBuyer, id, empty, controller.accept)
  router.post('/plans/:id/reject', requireBuyer, id, validate(reason), controller.reject)
  router.get('/orders', requireBuyer, validate(orderQuery, 'query'), controller.listOrders)
  router.get('/orders/:id', requireBuyer, id, controller.order)
  router.post('/orders/:id/confirm-received', requireBuyer, id, empty, controller.receive)
  return router
}
