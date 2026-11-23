import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

const backend = new URL('../../', import.meta.url)
const envPath = fileURLToPath(new URL('.env', backend))

export function loadEnv() {
  if (existsSync(envPath)) process.loadEnvFile(envPath)
}

export function readConfig() {
  loadEnv()
  const values = z
    .object({
      DATABASE_URL: z.string().regex(/^postgres(?:ql)?:\/\//),
      APP_PUBLIC_URL: z
        .url()
        .refine((url) => /^https?:\/\//.test(url) && new URL(url).origin === url),
      UPLOAD_DIR: z.string().min(1).default('./uploads'),
      MAX_UPLOAD_MB: z.coerce.number().int().min(1).max(20).default(5),
      PORT: z.coerce.number().int().min(1).max(65535).default(3000),
      HOST: z.ipv4().default('127.0.0.1'),
      NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
      VCRAFT_DEMO_PASSWORD: z.string().min(12).max(128).optional(),
      SESSION_SECRET: z.string().min(32).optional(),
    })
    .parse({
      ...process.env,
      VCRAFT_DEMO_PASSWORD: process.env.VCRAFT_DEMO_PASSWORD || undefined,
      SESSION_SECRET: process.env.SESSION_SECRET || undefined,
    })
  return values
}
