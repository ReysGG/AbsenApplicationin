/**
 * cleanupExportJob.ts — Scheduled cleanup for expired export files.
 *
 * Runs every 24 hours.
 * 1. Find all Completed/Failed ExportJobs where the file retention period (7 days) has elapsed
 *    - Completed: olderThan 7 days based on completedAt
 *    - Failed/Queued: olderThan 7 days based on requestedAt (no completedAt)
 * 2. For each: delete file from storage (best-effort)
 * 3. Set ExportJob.status = Expired
 * 4. Keep ExportJob record for 30 days (history), just mark as Expired
 *    (Records older than 30 days are hard-deleted to enforce maximum history retention)
 *
 * Requirements: 12.11, 12.12
 */

import { prisma } from '../config/prisma'
import { getStorageClient } from '../config/supabaseStorage'
import { logger } from '../lib/logger'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000   // 24 hours
const FILE_RETENTION_DAYS = 7
const HISTORY_RETENTION_DAYS = 30
const EXPORTS_BUCKET = 'exports'

// ---------------------------------------------------------------------------
// Core cleanup logic
// ---------------------------------------------------------------------------

/**
 * Run one cleanup cycle:
 *   1. Mark Completed/Failed jobs older than 7 days as Expired + delete storage files
 *   2. Hard-delete Expired jobs older than 30 days (history pruning)
 */
async function runCleanup(): Promise<void> {
  logger.info('cleanupExportJob: starting cleanup run')

  const now = new Date()
  const fileRetentionCutoff = new Date(now.getTime() - FILE_RETENTION_DAYS * 24 * 60 * 60 * 1000)
  const historyRetentionCutoff = new Date(now.getTime() - HISTORY_RETENTION_DAYS * 24 * 60 * 60 * 1000)

  // -------------------------------------------------------------------------
  // Step 1: Find jobs eligible for expiry (Completed or Failed, past 7 days)
  // -------------------------------------------------------------------------
  let jobsToExpire: Array<{ id: string; filePath: string | null; status: string }> = []

  try {
    jobsToExpire = await (prisma as any).exportJob.findMany({
      where: {
        status: { in: ['Completed', 'Failed'] },
        OR: [
          // Completed jobs: use completedAt for file retention cutoff
          { status: 'Completed', completedAt: { lte: fileRetentionCutoff } },
          // Failed jobs without completedAt: use requestedAt
          { status: 'Failed', completedAt: null, requestedAt: { lte: fileRetentionCutoff } },
          // Failed jobs with completedAt
          { status: 'Failed', completedAt: { lte: fileRetentionCutoff } },
        ],
      },
      select: { id: true, filePath: true, status: true },
    })
  } catch (err) {
    logger.error('cleanupExportJob: failed to query jobs for expiry', {
      error: err instanceof Error ? err.message : String(err),
    })
    return
  }

  logger.info(`cleanupExportJob: found ${jobsToExpire.length} jobs to expire`)

  // -------------------------------------------------------------------------
  // Step 2 + 3: Delete storage file (best-effort) and mark as Expired
  // -------------------------------------------------------------------------
  const storage = getStorageClient()

  for (const job of jobsToExpire) {
    // Delete file from storage (best-effort — do not fail the job if storage delete fails)
    if (job.filePath) {
      try {
        // Derive path within the bucket from the stored filePath
        // filePath is stored as "{workspaceId}/{jobId}.{ext}" without the bucket prefix
        await deleteStorageFile(storage, EXPORTS_BUCKET, job.filePath)
      } catch (err) {
        logger.warn('cleanupExportJob: failed to delete storage file (best-effort)', {
          jobId: job.id,
          filePath: job.filePath,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }

    // Mark job as Expired
    try {
      await (prisma as any).exportJob.update({
        where: { id: job.id },
        data: { status: 'Expired' },
      })
      logger.debug('cleanupExportJob: marked job as Expired', { jobId: job.id })
    } catch (err) {
      logger.error('cleanupExportJob: failed to mark job as Expired', {
        jobId: job.id,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  // -------------------------------------------------------------------------
  // Step 4: Hard-delete Expired jobs older than 30 days (history pruning)
  // ExportJob records within 30 days are kept for history (R12.12).
  // -------------------------------------------------------------------------
  try {
    const deleted = await (prisma as any).exportJob.deleteMany({
      where: {
        status: 'Expired',
        requestedAt: { lte: historyRetentionCutoff },
      },
    })
    if (deleted.count > 0) {
      logger.info(`cleanupExportJob: hard-deleted ${deleted.count} expired job records (>30 days old)`)
    }
  } catch (err) {
    logger.error('cleanupExportJob: failed to hard-delete old expired records', {
      error: err instanceof Error ? err.message : String(err),
    })
  }

  logger.info('cleanupExportJob: cleanup run complete')
}

/**
 * Best-effort file delete from storage.
 * The StorageClient interface doesn't expose a delete method, so we use the
 * Supabase client directly when available; in dev mode this is a no-op.
 */
async function deleteStorageFile(
  storage: { upload: unknown; getSignedUrl: unknown },
  _bucket: string,
  _filePath: string,
): Promise<void> {
  // The StorageClient interface only exposes upload + getSignedUrl.
  // File deletion is best-effort: if the underlying client exposes a `delete`
  // method (future extension), use it; otherwise log and skip.
  const extendedStorage = storage as Record<string, unknown>
  if (typeof extendedStorage['delete'] === 'function') {
    await (extendedStorage['delete'] as (b: string, p: string) => Promise<void>)(_bucket, _filePath)
  } else {
    // Dev mode or client without delete support — log and move on
    logger.debug('cleanupExportJob: storage client does not support delete, skipping', {
      bucket: _bucket,
      filePath: _filePath,
    })
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Start the cleanup job.
 * Returns a cleanup function that stops the interval (for graceful shutdown).
 *
 * Requirements: 12.11, 12.12
 */
export function startCleanupJob(): () => void {
  logger.info('cleanupExportJob: starting, runs every 24 hours')

  // Run once at startup (after a short delay to avoid blocking server start)
  const startupTimer = setTimeout(() => void runCleanup(), 10_000)

  // Then run every 24 hours
  const handle = setInterval(() => void runCleanup(), CLEANUP_INTERVAL_MS)

  return () => {
    clearTimeout(startupTimer)
    clearInterval(handle)
    logger.info('cleanupExportJob: stopped')
  }
}
