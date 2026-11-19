import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT || 4000),
  publicUrl: (process.env.APP_PUBLIC_URL || 'http://localhost:5173').replace(/\/$/, ''),
  sessionSecret: process.env.SESSION_SECRET,
  databaseUrl: process.env.DATABASE_URL,
  isProduction: process.env.NODE_ENV === 'production',
  trustProxy: process.env.TRUST_PROXY === 'true',
};

export function validateEnv() {
  if (!env.databaseUrl) throw new Error('DATABASE_URL is required');
  if (!env.sessionSecret || env.sessionSecret.length < 32) throw new Error('SESSION_SECRET must be at least 32 chars');
  if (!/^https?:\/\//.test(env.publicUrl)) throw new Error('APP_PUBLIC_URL must be a full http(s) URL');
  if (env.isProduction && !env.publicUrl.startsWith('https://')) throw new Error('APP_PUBLIC_URL must be https in production');
}
