/*
 * File này làm gì: Đọc và kiểm tra cấu hình backend.
 * Ai gọi file này: Điểm khởi động server và các lệnh cần đọc .env.
 */
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

const backend = new URL('../../', import.meta.url)
const envPath = fileURLToPath(new URL('.env', backend))

const httpOrigin = z.url().refine((url) => /^https?:\/\//.test(url) && new URL(url).origin === url)

// Nạp cấu hình từ .env nếu bản chạy có file này.
export function loadEnv() {
  if (existsSync(envPath)) process.loadEnvFile(envPath)
}

// Kiểm tra kiểu và định dạng cấu hình trước khi mở cổng HTTP.
export function readConfig() {
  loadEnv()
  const values = z
    .object({
      DATABASE_URL: z.string().regex(/^postgres(?:ql)?:\/\//),
      APP_PUBLIC_URL: httpOrigin,
      CLIENT_ORIGIN: httpOrigin.optional(),
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
      CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || undefined,
      VCRAFT_DEMO_PASSWORD: process.env.VCRAFT_DEMO_PASSWORD || undefined,
      SESSION_SECRET: process.env.SESSION_SECRET || undefined,
    })
  return values
}
