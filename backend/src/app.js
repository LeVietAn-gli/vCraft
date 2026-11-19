import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { Pool } from 'pg';
import helmet from 'helmet';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env, validateEnv } from './config/env.js';
import { csrf } from './middlewares/csrf.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { rfqRouter } from './modules/rfq/rfq.routes.js';
import { orderRouter, planBuyerRouter } from './modules/orders/orders.routes.js';
import { buyerReadRouter } from './integration/buyer-read.routes.js';
import { categoryRouter, catalogRouter, workshopRouter, traceRouter, newsRouter } from './integration/public-read.routes.js';

validateEnv();
export const app = express();
if (env.trustProxy) app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: { directives: {
  defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  imgSrc: ["'self'", 'data:', 'https://*.tile.openstreetmap.org'],
  connectSrc: ["'self'"], fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
} } }));
app.use(express.json({ limit: '256kb' }));
const pool = new Pool({ connectionString: env.databaseUrl });
const PgStore = connectPgSimple(session);
app.use(session({
  name: 'vcraft.sid',
  store: new PgStore({ pool, tableName: 'session', createTableIfMissing: false }),
  secret: env.sessionSecret,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: { httpOnly: true, sameSite: 'lax', secure: env.isProduction,
    maxAge: 24 * 60 * 60 * 1000, path: '/' },
}));
app.use('/api', csrf);
app.get('/api/health', (_req, res) => res.json({ data: { status: 'ok' } }));
app.use('/api/auth', authRouter);
app.use('/api/rfqs', rfqRouter);
app.use('/api/rfqs', buyerReadRouter);
app.use('/api/plans', planBuyerRouter);
app.use('/api/orders', orderRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/products', catalogRouter);
app.use('/api/workshops', workshopRouter);
app.use('/api/trace', traceRouter);
app.use('/api/news', newsRouter);
// N2 owns media uploads and Artisan APIs; N3 owns bidding, plans authoring and Admin APIs.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../');
app.use('/uploads', express.static(path.join(root, 'backend/uploads')));
const dist = path.join(root, 'frontend/dist');
app.use(express.static(dist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) return next();
  if (!req.accepts('html')) return next();
  res.sendFile(path.join(dist, 'index.html'), (error) => error && next(error));
});
app.use((_req, _res, next) => next(Object.assign(new Error('Not found'), { status: 404, code: 'NOT_FOUND' })));
app.use(errorHandler);
