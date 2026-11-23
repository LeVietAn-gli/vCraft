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
  media,
  origin: config.APP_PUBLIC_URL,
  frontend: fileURLToPath(new URL('../../frontend/dist/', import.meta.url)),
  supplementalRoutes: demoDataRoutes({ repository, origin: config.APP_PUBLIC_URL, requireArtisan }),
  installSession: demo
    ? (app) =>
        installDemoSession(app, {
          password: demo,
          secret: config.SESSION_SECRET,
          lookupUser: repository.lookupUser,
        })
    : undefined,
})
const server = app.listen(config.PORT, config.HOST, () =>
  console.info('vCraft API cổng', config.PORT),
)
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => server.close(() => database.$disconnect()))
}
