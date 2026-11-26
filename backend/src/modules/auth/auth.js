import { phone } from './phone.js'
import { timingSafeEqual } from 'node:crypto'
import bcrypt from 'bcryptjs'
import session from 'express-session'
import connectPgSimple from 'connect-pg-simple'
import { rateLimit } from 'express-rate-limit'
import { z } from 'zod'
import { AppError, validate } from '../../errors.js'

const email = z.string().trim().toLowerCase().max(255).pipe(z.email())
const credentials = z.strictObject({ email, password: z.string().min(1).max(128) })
const registration = credentials.extend({
  password: z
    .string()
    .min(8)
    .max(72)
    .refine((value) => Buffer.byteLength(value) <= 72, 'Mật khẩu tối đa 72 byte.'),
  fullName: z.string().trim().min(1).max(150),
  phone,
  role: z.literal('BUYER').default('BUYER'),
})
const profile = { id: true, email: true, fullName: true, phone: true, role: true }
const loginRequired = () => new AppError(401, 'UNAUTHENTICATED', 'Vui lòng đăng nhập để tiếp tục.')
const dummyHash = bcrypt.hashSync('vcraft-invalid-account', 10)
const cookieName = 'vcraft.sid'

export function requireBuyer(req, res, next) {
  res.set('Cache-Control', 'private, no-store')
  if (!req.user) throw loginRequired()
  if (req.user.role !== 'BUYER')
    throw new AppError(403, 'FORBIDDEN', 'Chức năng dành cho người mua.')
  next()
}

export function installAuth(app, { db, connectionString, secret, secure, demoPassword }) {
  const activeAccounts = {
    status: 'ACTIVE',
    ...(demoPassword ? {} : { NOT: { email: { endsWith: '@vcraft.local' } } }),
  }
  const demoBytes = demoPassword ? Buffer.from(demoPassword) : null
  const PgStore = connectPgSimple(session)
  const store = new PgStore({ conString: connectionString, tableName: 'session' })
  app.use(
    session({
      name: cookieName,
      secret,
      store,
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true, sameSite: 'lax', secure, maxAge: 86400000 },
    }),
  )
  app.use(async (req, _res, next) => {
    if (req.session.userId)
      req.user = await db.user.findFirst({
        where: { id: req.session.userId, ...activeAccounts },
        select: profile,
      })
    next()
  })
  app.use('/api/auth', (_req, res, next) => {
    res.set('Cache-Control', 'private, no-store')
    next()
  })
  app.get('/api/auth/me', (req, res) => {
    if (!req.user) throw loginRequired()
    res.json({ data: req.user })
  })
  app.post('/api/auth/register', validate(registration), async (req, res) => {
    const { password, ...account } = req.validated.body
    if (account.email.endsWith('@vcraft.local'))
      throw new AppError(400, 'VALIDATION_ERROR', 'Tên miền này dành cho tài khoản demo.')
    try {
      const user = await db.user.create({
        data: { ...account, passwordHash: await bcrypt.hash(password, 12) },
        select: profile,
      })
      res.status(201).json({ data: user })
    } catch (error) {
      if (error.code === 'P2002') throw new AppError(409, 'EMAIL_TAKEN', 'Email đã được đăng ký.')
      throw error
    }
  })
  const limiter = rateLimit({
    windowMs: 15 * 60_000,
    limit: 10,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => req.ip ?? 'local-socket',
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      error: {
        code: 'TOO_MANY_ATTEMPTS',
        message: 'Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau.',
      },
    },
  })
  app.post('/api/auth/login', limiter, validate(credentials), async (req, res) => {
    const { email, password } = req.validated.body
    const account = await db.user.findFirst({
      where: { email, ...activeAccounts },
      select: { ...profile, passwordHash: true },
    })
    const legacyDemo =
      demoBytes &&
      account?.email.endsWith('@vcraft.local') &&
      account.passwordHash === 'DEMO_SESSION_ONLY'
    const bytes = Buffer.from(password)
    const valid = legacyDemo
      ? bytes.length === demoBytes.length && timingSafeEqual(bytes, demoBytes)
      : bytes.length <= 72 && (await bcrypt.compare(password, account?.passwordHash ?? dummyHash))
    if (!valid || !account)
      throw new AppError(401, 'UNAUTHENTICATED', 'Email hoặc mật khẩu chưa đúng.')
    await new Promise((resolve, reject) =>
      req.session.regenerate((error) => (error ? reject(error) : resolve())),
    )
    req.session.userId = account.id
    await new Promise((resolve, reject) =>
      req.session.save((error) => (error ? reject(error) : resolve())),
    )
    delete account.passwordHash
    res.json({ data: account })
  })
  app.post('/api/auth/logout', async (req, res) => {
    if (!req.user) throw loginRequired()
    await new Promise((resolve, reject) =>
      req.session.destroy((error) => (error ? reject(error) : resolve())),
    )
    res
      .clearCookie(cookieName, { path: '/', httpOnly: true, sameSite: 'lax', secure })
      .sendStatus(204)
  })
  return store
}
