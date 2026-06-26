import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().optional(),
  BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be at least 32 chars'),
  BETTER_AUTH_URL: z.string().url().default('http://localhost:3000'),
  INTERNAL_JWT_SECRET: z.string().min(32, 'INTERNAL_JWT_SECRET must be at least 32 chars'),
  SUPABASE_URL: z.string().url().optional().or(z.literal('')),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  // Vercel Blob private storage for attendance face captures. This is preferred
  // over the legacy S3-compatible storage when BLOB_READ_WRITE_TOKEN is set.
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  BLOB_FACE_PREFIX: z.string().optional().default('face-captures'),
  // S3-compatible storage (Supabase Storage S3 endpoint) for attendance face
  // captures. Kept as a fallback when Vercel Blob is not configured.
  S3_ENDPOINT: z.string().optional().or(z.literal('')),
  S3_REGION: z.string().optional().default('ap-southeast-1'),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_FACE_BUCKET: z.string().optional().default('face-captures'),
  FACE_SERVICE_URL: z.string().url().optional().or(z.literal('')),
  FACE_SERVICE_TIMEOUT_MS: z.coerce.number().int().positive().default(8000),
  FACE_MATCH_THRESHOLD: z.coerce.number().min(0).max(1).default(0.6),
  FACE_QUALITY_MIN_SCORE: z.coerce.number().min(0).max(1).default(0.65),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment variables:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
