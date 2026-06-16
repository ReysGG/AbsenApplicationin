/**
 * faceStorage.ts — uploads attendance face-capture images to an S3-compatible
 * bucket (Supabase Storage S3 endpoint) and produces short-lived presigned GET
 * URLs for HR review on the dashboard.
 *
 * Uses S3 access keys (storage-scoped), NOT the Supabase service_role key, so a
 * leak is limited to storage. When S3 env vars are unset the feature degrades
 * gracefully: upload is a no-op and signed-URL returns null (attendance still
 * works, just without a stored face image).
 */

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { env } from './env'
import { logger } from '../lib/logger'

const BUCKET = env.S3_FACE_BUCKET || 'face-captures'

let _client: S3Client | null = null

function client(): S3Client | null {
  if (
    !env.S3_ENDPOINT ||
    !env.S3_ACCESS_KEY_ID ||
    !env.S3_SECRET_ACCESS_KEY
  ) {
    return null
  }
  if (_client) return _client
  _client = new S3Client({
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION || 'ap-southeast-1',
    forcePathStyle: true, // Supabase S3 requires path-style addressing.
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
  })
  return _client
}

/** True when S3 credentials are configured. */
export function faceStorageConfigured(): boolean {
  return client() !== null
}

/**
 * Upload a face-capture image. Returns the stored object key, or null if S3 is
 * not configured / the upload failed (best-effort — never throws).
 */
export async function uploadFaceImage(
  key: string,
  body: Buffer,
  contentType = 'image/jpeg',
): Promise<string | null> {
  const c = client()
  if (!c) return null
  try {
    await c.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    )
    return key
  } catch (err) {
    logger.warn('faceStorage: upload failed', {
      key,
      error: err instanceof Error ? err.message : String(err),
    })
    return null
  }
}

/**
 * Presigned GET URL for a stored face image (default 6h). Returns null if S3 is
 * unconfigured, the key is empty, or signing fails.
 */
export async function getFaceSignedUrl(
  key: string | null | undefined,
  expiresInSeconds = 60 * 60 * 6,
): Promise<string | null> {
  if (!key) return null
  const c = client()
  if (!c) return null
  try {
    return await getSignedUrl(
      c,
      new GetObjectCommand({ Bucket: BUCKET, Key: key }),
      { expiresIn: expiresInSeconds },
    )
  } catch (err) {
    logger.warn('faceStorage: signing failed', {
      key,
      error: err instanceof Error ? err.message : String(err),
    })
    return null
  }
}

export { BUCKET as FACE_BUCKET }
