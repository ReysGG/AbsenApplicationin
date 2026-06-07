/**
 * exports.service.ts — Business logic for ExportJob history endpoints.
 *
 * Endpoints covered:
 *   GET /exports         — list ExportJob records for this workspace (latest 30)
 *   GET /exports/:id     — single ExportJob with status + signed URL
 *
 * Requirements: 12.10, 12.11, 12.12, 12.13, 12.14, 17.6
 */

import { prisma } from '../../config/prisma'
import { ForbiddenError, NotFoundError } from '../../lib/errors'
import { getStorageClient } from '../../config/supabaseStorage'
import type { ScopeFilter } from '../../types/auth'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExportJobItem {
  id: string
  workspaceId: string
  requestedBy: string
  reportType: string
  format: string
  rowCount: number | null
  status: string
  signedUrl: string | null
  signedUrlExpiresAt: string | null
  requestedAt: string
  completedAt: string | null
  errorMessage: string | null
  filtersJson: unknown
}

export interface ExportJobListResult {
  items: ExportJobItem[]
  pagination: {
    page: number
    page_size: number
    total: number
    total_pages: number
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EXPORTS_BUCKET = 'exports'
const MAX_LIST = 30

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapExportJob(job: {
  id: string
  workspaceId: string
  requestedBy: string
  reportType: string
  format: string
  rowCount: number | null
  status: string
  filePath: string | null
  signedUrlExpiresAt: Date | null
  requestedAt: Date
  completedAt: Date | null
  errorMessage: string | null
  filtersJson: unknown
}, signedUrl: string | null): ExportJobItem {
  return {
    id: job.id,
    workspaceId: job.workspaceId,
    requestedBy: job.requestedBy,
    reportType: job.reportType,
    format: job.format,
    rowCount: job.rowCount,
    status: job.status,
    signedUrl,
    signedUrlExpiresAt: job.signedUrlExpiresAt?.toISOString() ?? null,
    requestedAt: job.requestedAt.toISOString(),
    completedAt: job.completedAt?.toISOString() ?? null,
    errorMessage: job.errorMessage,
    filtersJson: job.filtersJson,
  }
}

// ---------------------------------------------------------------------------
// listExportJobs
// ---------------------------------------------------------------------------

/**
 * GET /exports
 *
 * Returns the latest 30 ExportJob records for the current user in this workspace.
 * Only shows records belonging to the requesting user (R12.13).
 *
 * Requirements: 12.10, 12.11, 12.12, 12.13
 */
export async function listExportJobs(params: {
  workspaceId: string
  userId: string
  page: number
  pageSize: number
  scopeFilter?: ScopeFilter | null
}): Promise<ExportJobListResult> {
  const { workspaceId, userId, page, pageSize } = params

  const effectivePageSize = Math.min(pageSize, MAX_LIST)
  const skip = (page - 1) * effectivePageSize

  const where = {
    workspaceId,
    requestedBy: userId,
  }

  const [total, jobs] = await Promise.all([
    prisma.exportJob.count({ where }),
    prisma.exportJob.findMany({
      where,
      skip,
      take: effectivePageSize,
      orderBy: { requestedAt: 'desc' },
    }),
  ])

  const items = (jobs as Parameters<typeof mapExportJob>[0][]).map((j) => mapExportJob(j, null))

  return {
    items,
    pagination: {
      page,
      page_size: effectivePageSize,
      total: total as number,
      total_pages: Math.ceil((total as number) / effectivePageSize),
    },
  }
}

// ---------------------------------------------------------------------------
// getExportJobById
// ---------------------------------------------------------------------------

/**
 * GET /exports/:id
 *
 * Returns a single ExportJob with status.
 * If status is Completed and filePath is set, generates a signed URL.
 * Ownership check: only the user who created the job can access it (R17.6).
 *
 * Requirements: 12.10, 12.14, 17.6
 */
export async function getExportJobById(params: {
  workspaceId: string
  jobId: string
  userId: string
}): Promise<ExportJobItem> {
  const { workspaceId, jobId, userId } = params

  const job = await prisma.exportJob.findFirst({
    where: { id: jobId, workspaceId },
  })

  if (!job) {
    throw new NotFoundError('Export job')
  }

  // Ownership check — only the requester can access (R17.6)
  if (job.requestedBy !== userId) {
    throw new ForbiddenError('Anda tidak memiliki akses ke export job ini')
  }

  // Generate signed URL if completed and filePath is set
  let signedUrl: string | null = null
  if (job.status === 'Completed' && job.filePath) {
    try {
      const storage = getStorageClient()
      // 24 hour signed URL (R12.10)
      signedUrl = await storage.getSignedUrl(EXPORTS_BUCKET, job.filePath, 60 * 60 * 24)

      // Update expiry in DB (best-effort)
      const expiresAt = new Date(Date.now() + 60 * 60 * 24 * 1000)
      await prisma.exportJob.update({
        where: { id: jobId },
        data: { signedUrlExpiresAt: expiresAt },
      }).catch(() => {
        // Non-critical
      })
    } catch {
      // Non-critical — signed URL generation failure doesn't break the response
      signedUrl = null
    }
  }

  return mapExportJob(job as Parameters<typeof mapExportJob>[0], signedUrl)
}
