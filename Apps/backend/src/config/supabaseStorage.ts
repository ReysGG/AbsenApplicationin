/**
 * supabaseStorage.ts — Supabase Storage client for private bucket file operations.
 *
 * Uses @supabase/supabase-js if available and SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set.
 * Falls back to dev mode (writes to temp) when credentials are not configured.
 *
 * Requirements: 17.6, 17.7, 11.15
 */

import path from 'path'
import os from 'os'
import fs from 'fs/promises'
import { env } from './env'
import { logger } from '../lib/logger'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UploadResult {
  /** The storage path / key of the uploaded file (e.g. leave-attachments/ws-abc/file.pdf) */
  storagePath: string
  /** A signed URL valid for 24 hours */
  signedUrl: string
  /** Whether this was a real Supabase upload or a dev-mode placeholder */
  devMode: boolean
}

export interface StorageClient {
  upload(
    bucket: string,
    filePath: string,
    fileBuffer: Buffer,
    mimeType: string,
  ): Promise<UploadResult>
  getSignedUrl(bucket: string, storagePath: string, expiresInSeconds?: number): Promise<string>
}

// ---------------------------------------------------------------------------
// Supabase Storage implementation
// ---------------------------------------------------------------------------

class SupabaseStorageClient implements StorageClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(supabaseClient: any) {
    this.client = supabaseClient
  }

  async upload(
    bucket: string,
    filePath: string,
    fileBuffer: Buffer,
    mimeType: string,
  ): Promise<UploadResult> {
    const { data, error } = await this.client.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        upsert: false,
      })

    if (error) {
      throw new Error(`Supabase Storage upload failed: ${error.message}`)
    }

    const storagePath = (data as { path: string }).path
    const signedUrl = await this.getSignedUrl(bucket, storagePath, 60 * 60 * 24)

    return { storagePath, signedUrl, devMode: false }
  }

  async getSignedUrl(
    bucket: string,
    storagePath: string,
    expiresInSeconds = 60 * 60 * 24,
  ): Promise<string> {
    const { data, error } = await this.client.storage
      .from(bucket)
      .createSignedUrl(storagePath, expiresInSeconds)

    if (error || !data?.signedUrl) {
      throw new Error(`Failed to create signed URL: ${error?.message ?? 'unknown'}`)
    }

    return data.signedUrl as string
  }
}

// ---------------------------------------------------------------------------
// Dev mode implementation (no Supabase configured)
// ---------------------------------------------------------------------------

class DevStorageClient implements StorageClient {
  async upload(
    bucket: string,
    filePath: string,
    fileBuffer: Buffer,
    _mimeType: string,
  ): Promise<UploadResult> {
    // Write to temp dir for local dev
    const tempDir = path.join(os.tmpdir(), 'attendx-dev-storage', bucket)
    const destPath = path.join(tempDir, filePath.replace(/\//g, '_'))
    try {
      await fs.mkdir(tempDir, { recursive: true })
      await fs.writeFile(destPath, fileBuffer)
    } catch {
      // Non-critical in dev
    }

    const storagePath = `${bucket}/${filePath}`
    const signedUrl = `http://localhost:4000/dev-storage/${bucket}/${filePath}`

    logger.warn('DEV MODE: Supabase Storage not configured, file saved to temp', {
      storagePath,
      destPath,
    })

    return { storagePath, signedUrl, devMode: true }
  }

  async getSignedUrl(_bucket: string, storagePath: string, _expiresInSeconds?: number): Promise<string> {
    return `http://localhost:4000/dev-storage/${storagePath}?dev=1`
  }
}

// ---------------------------------------------------------------------------
// Factory — create the appropriate client
// ---------------------------------------------------------------------------

let _storageClient: StorageClient | null = null

/**
 * Returns a lazily-initialized storage client.
 * - If SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set → real Supabase client.
 * - Otherwise → dev mode client (writes to temp, returns placeholder URL).
 */
export function getStorageClient(): StorageClient {
  if (_storageClient) return _storageClient

  const supabaseUrl = env.SUPABASE_URL
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY

  if (supabaseUrl && serviceRoleKey) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createClient } = require('@supabase/supabase-js')
      const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
      })
      _storageClient = new SupabaseStorageClient(supabase)
      logger.info('Supabase Storage client initialized')
    } catch {
      logger.warn('Failed to initialize Supabase client, falling back to dev mode')
      _storageClient = new DevStorageClient()
    }
  } else {
    logger.warn('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — using dev storage mode')
    _storageClient = new DevStorageClient()
  }

  return _storageClient
}

/** Bucket name for leave attachments */
export const LEAVE_ATTACHMENTS_BUCKET = 'leave-attachments'

/** Maximum file size in bytes (5 MB) */
export const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024

/** Allowed MIME types for leave attachments */
export const ALLOWED_ATTACHMENT_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
] as const

export type AllowedMimeType = (typeof ALLOWED_ATTACHMENT_MIME_TYPES)[number]

/**
 * Resets the cached storage client (for testing only).
 * @internal
 */
export function _resetStorageClient(): void {
  _storageClient = null
}
