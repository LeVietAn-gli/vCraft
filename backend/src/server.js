import { installAuth } from './modules/auth/auth.js'
import { buyerRoutes } from './modules/buyer/buyer.routes.js'
import { batchRepository } from './modules/production/batches.repository.js'
import { milestoneRepository } from './modules/production/milestones.repository.js'
import { productRepository } from './modules/products/products.repository.js'
import { milestoneImageRepository } from './modules/production/milestone-images.repository.js'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { createApp, requireArtisan } from './app.js'
import { readConfig } from './config/env.js'
import { installDemoSession } from './demo/session.js'
import { demoDataRoutes } from './demo/routes.js'
import { createMedia } from './modules/media/media.service.js'
import { connectDatabase, workshopRepository } from './modules/workshops/workshops.repository.js'

const config = readConfig()
const demo = config.NODE_ENV !== 'production' && config.VCRAFT_DEMO_PASSWORD
if (demo && !config.SESSION_SECRET)
  throw new Error('Cần cấu hình SESSION_SECRET để chạy phiên demo.')
if (demo && config.HOST !== '127.0.0.1') throw new Error('Chạy đăng nhập demo trên 127.0.0.1.')
const database = connectDatabase(config.DATABASE_URL)
const repository = workshopRepository(database)
const media = createMedia(
  resolve(fileURLToPath(new URL('../', import.meta.url)), config.UPLOAD_DIR),
  config.MAX_UPLOAD_MB,
)
const app = createApp({
  repository,
  products: productRepository(database),
  milestones: milestoneImageRepository(database),
  batches: batchRepository(database),
  journal: milestoneRepository(database),
  media,
  origin: config.CLIENT_ORIGIN ?? config.APP_PUBLIC_URL,
  frontend: fileURLToPath(new URL('../../frontend/dist/', import.meta.url)),
  supplementalRoutes: [
    buyerRoutes(database),
    demoDataRoutes({ repository, origin: config.APP_PUBLIC_URL, requireArtisan }),
  ],
  installSession(app) {
    if (config.SESSION_SECRET)
      installAuth(app, {
        db: database,
        connectionString: config.DATABASE_URL,
        secret: config.SESSION_SECRET,
        demoPassword: demo,
        secure: config.APP_PUBLIC_URL.startsWith('https://'),
      })
    else {
      app.get('/api/auth/me', (_req, res) =>
        res
          .status(401)
          .json({ error: { code: 'UNAUTHENTICATED', message: 'Vui lòng đăng nhập.' } }),
      )
      app.use('/api/auth', (_req, res) =>
        res
          .status(503)
          .json({
            error: { code: 'AUTH_UNAVAILABLE', message: 'Máy chủ chưa cấu hình phiên đăng nhập.' },
          }),
      )
    }
    if (demo)
      installDemoSession(app, {
        password: demo,
        secret: config.SESSION_SECRET,
        lookupUser: repository.lookupUser,
        shared: true,
      })
  },
})
const server = app.listen(config.PORT, config.HOST, () =>
  console.info('vCraft API cổng', config.PORT),
)
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => server.close(() => database.$disconnect()))
}
