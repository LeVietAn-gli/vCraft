import { timingSafeEqual } from 'node:crypto'
import session from 'express-session'
import { z } from 'zod'
import { AppError, validate } from '../errors.js'

const login = z.strictObject({ email: z.email(), password: z.string().max(128) })

export function installDemoSession(app, { password, secret, lookupUser }) {
  if (!password) return
  app.use(
    session({
      name: 'vcraft.demo.sid',
      secret,
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60_000 },
    }),
  )
  app.use(async (req, _res, next) => {
    if (req.session.userId) req.user = await lookupUser({ id: req.session.userId })
    next()
  })
  app.post('/api/demo/session', validate(login), async (req, res) => {
    const { email, password: typed } = req.validated.body
    const given = Buffer.from(typed)
    const expected = Buffer.from(password)
    const user =
      email.endsWith('@vcraft.local') &&
      given.length === expected.length &&
      timingSafeEqual(given, expected) &&
      (await lookupUser({ email }))
    if (!user) throw new AppError(401, 'UNAUTHENTICATED', 'Tài khoản demo hoặc mật khẩu chưa đúng.')
    await new Promise((resolve, reject) =>
      req.session.regenerate((error) => (error ? reject(error) : resolve())),
    )
    req.session.userId = user.id
    await new Promise((resolve, reject) =>
      req.session.save((error) => (error ? reject(error) : resolve())),
    )
    res.json({ data: user })
  })
  app.delete('/api/demo/session', (req, res, next) => {
    req.session.destroy((error) => {
      if (error) return next(error)
      res.clearCookie('vcraft.demo.sid').sendStatus(204)
    })
  })
}
