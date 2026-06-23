/**
 * faceStorage.ts - attendance face-capture object storage.
 *
 * Vercel Blob private storage is preferred when BLOB_READ_WRITE_TOKEN is set.
 * The legacy S3-compatible Supabase Storage path remains as a fallback for older
 * deployments. If no storage is configured, attendance still works without a
 * stored face image.
 */

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { get, put } from '@vercel/blob'
import { Readable } from 'node:stream'
import { env } from './env'
import { logger } from '../lib/logger'

const S3_BUCKET = env.S3_FACE_BUCKET || 'face-captures'
const BLOB_FACE_PREFIX = (env.BLOB_FACE_PREFIX || 'face-captures').replace(/^\/+|\/+$/g, '')

let _client: S3Client | null = null

export interface FaceBlobObject {
  stream: Readable
  contentType: string
  size: number | null
  etag: string | null
}

function blobToken(): string | null {
  const token = env.BLOB_READ_WRITE_TOKEN?.trim()
  return token ? token : null
}

function blobPath(key: string): string {
  const normalizedKey = key.replace(/^\/+/, '')
  if (!BLOB_FACE_PREFIX) return normalizedKey
  if (normalizedKey === BLOB_FACE_PREFIX || normalizedKey.startsWith(`${BLOB_FACE_PREFIX}/`)) {
    return normalizedKey
  }
  return `${BLOB_FACE_PREFIX}/${normalizedKey}`
}

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
    forcePathStyle: true,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
  })
  return _client
}

/** True when either Vercel Blob or legacy S3 credentials are configured. */
export function faceStorageConfigured(): boolean {
  return blobToken() !== null || client() !== null
}

/** True when attendance face reads must go through the authenticated proxy. */
export function faceStorageUsesVercelBlob(): boolean {
  return blobToken() !== null
}

/**
 * Upload a face-capture image. Returns the stored object key/pathname, or null
 * if storage is not configured / the upload failed. This is best-effort and
 * never blocks attendance.
 */
export async function uploadFaceImage(
  key: string,
  body: Buffer,
  contentType = 'image/jpeg',
): Promise<string | null> {
  const token = blobToken()
  if (token) {
    const pathname = blobPath(key)
    try {
      const blob = await put(pathname, body, {
        access: 'private',
        allowOverwrite: false,
        contentType,
        token,
      })
      return blob.pathname
    } catch (err) {
      logger.warn('faceStorage: Vercel Blob upload failed', {
        key: pathname,
        error: err instanceof Error ? err.message : String(err),
      })
      return null
    }
  }

  const c = client()
  if (!c) return null
  try {
    await c.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    )
    return key
  } catch (err) {
    logger.warn('faceStorage: S3 upload failed', {
      key,
      error: err instanceof Error ? err.message : String(err),
    })
    return null
  }
}

/**
 * Stream a private Vercel Blob object for an already-authorized request.
 */
export async function getFaceBlobObject(
  key: string | null | undefined,
): Promise<FaceBlobObject | null> {
  if (!key) return null
  const token = blobToken()
  if (!token) return null

  try {
    const result = await get(key, { access: 'private', token })
    if (!result || result.statusCode !== 200 || !result.stream) {
      return null
    }

    return {
      stream: Readable.fromWeb(result.stream as never),
      contentType: result.blob.contentType ?? 'image/jpeg',
      size: result.blob.size,
      etag: result.blob.etag ?? null,
    }
  } catch (err) {
    logger.warn('faceStorage: Vercel Blob read failed', {
      key,
      error: err instanceof Error ? err.message : String(err),
    })
    return null
  }
}

/**
 * Presigned GET URL for a stored legacy S3 image. Vercel Blob private objects
 * are delivered through the authenticated attendance route.
 */
export async function getFaceSignedUrl(
  key: string | null | undefined,
  expiresInSeconds = 60 * 60 * 6,
): Promise<string | null> {
  if (!key) return null
  if (blobToken()) return null

  const c = client()
  if (!c) return null
  try {
    return await getSignedUrl(
      c,
      new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }),
      { expiresIn: expiresInSeconds },
    )
  } catch (err) {
    logger.warn('faceStorage: S3 signing failed', {
      key,
      error: err instanceof Error ? err.message : String(err),
    })
    return null
  }
}

export { S3_BUCKET as FACE_BUCKET }
