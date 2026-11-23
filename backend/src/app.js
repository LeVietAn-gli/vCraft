import express from 'express'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { AppError, errorHandler } from './errors.js'
import { imageName } from './modules/media/media.service.js'
import { createWorkshopService } from './modules/workshops/workshops.service.js'
import { workshopRoutes } from './modules/workshops/workshops.routes.js'

export function requireArtisan(req, _res, next) {
  if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Đăng nhập bằng tài khoản nghệ nhân.')
  if (req.user.role !== 'ARTISAN')
    throw new AppError(403, 'FORBIDDEN', 'Trang này dành cho nghệ nhân.')
  next()
}

export function createApp({
  repository,
  media,
  origin,
  frontend,
  installSession,
  supplementalRoutes,
}) {
  const app = express()
  app.disable('x-powered-by')
  app.use((_req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff')
    next()
  })
  app.use(
    '/api',
    (req, _res, next) => {
      if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method) && req.get('Origin') !== origin) {
        throw new AppError(403, 'CSRF_REJECTED', 'Địa chỉ trang gửi yêu cầu không hợp lệ.')
      }
      next()
    },
    express.json({ limit: '96kb' }),
  )
  installSession?.(app)
  const service = createWorkshopService(repository, media)
  app.use('/api', workshopRoutes({ service, media, requireArtisan }))
  if (supplementalRoutes) app.use('/api', supplementalRoutes)

  const missing = () => new AppError(404, 'NOT_FOUND', 'Không tìm thấy nội dung.')
  app.get('/uploads/:name', async (req, res, next) => {
    const name = req.params.name
    const url = '/uploads/' + name
    if (!imageName.test(name) || !(await repository.canReadMedia(url, req.user))) throw missing()
    res.set('Cache-Control', 'private, no-store')
    res.sendFile(media.filename(url), { cacheControl: false }, (error) => {
      if (error) next(error.code === 'ENOENT' ? missing() : error)
    })
  })
  app.use(['/api', '/uploads'], () => {
    throw missing()
  })
  if (frontend && existsSync(join(frontend, 'index.html'))) {
    app.use(express.static(frontend))
    app.get('/{*path}', (req, res) => {
      if (!req.accepts('html') || /\.[a-z0-9]+$/i.test(req.path)) throw missing()
      res.sendFile(join(frontend, 'index.html'))
    })
  }
  app.use(() => {
    throw missing()
  })
  app.use(errorHandler)
  return app
}
