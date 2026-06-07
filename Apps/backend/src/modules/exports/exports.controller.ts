/**
 * exports.controller.ts — Request/response handlers for ExportJob endpoints.
 *
 * GET /api/v1/exports       — list export jobs for current user
 * GET /api/v1/exports/:id   — single export job with status + signed URL
 *
 * Requirements: 12.10, 12.11, 12.12, 12.13, 12.14, 17.6
 */

import type { Request, Response, NextFunction } from 'express'
import { sendSuccess } from '../../lib/response'
import { listExportJobs, getExportJobById } from './exports.service'

// ---------------------------------------------------------------------------
// GET /exports
// ---------------------------------------------------------------------------

/**
 * List export jobs for the current user in this workspace (latest 30).
 * Permission: export_reports
 *
 * Requirements: 12.10, 12.11, 12.12, 12.13
 */
export async function listExportJobsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const workspaceId = req.workspaceId!
    const userId = req.user!.userId

    const pageRaw = parseInt(String(req.query['page'] ?? '1'), 10) || 1
    const pageSizeRaw = parseInt(String(req.query['page_size'] ?? '30'), 10) || 30
    const page = Math.max(1, pageRaw)
    const pageSize = Math.min(Math.max(1, pageSizeRaw), 30)

    const result = await listExportJobs({
      workspaceId,
      userId,
      page,
      pageSize,
      scopeFilter: req.scopeFilter ?? null,
    })

    res.status(200).json({
      success: true,
      data: result.items,
      pagination: result.pagination,
      message: 'OK',
    })
  } catch (err) {
    next(err)
  }
}

// ---------------------------------------------------------------------------
// GET /exports/:id
// ---------------------------------------------------------------------------

/**
 * Get a single export job with status + signed URL (if Completed).
 * Only the user who created the job can access it (R17.6).
 *
 * Requirements: 12.10, 12.14, 17.6
 */
export async function getExportJobHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const workspaceId = req.workspaceId!
    const userId = req.user!.userId
    const jobId = req.params['id'] as string

    const result = await getExportJobById({ workspaceId, jobId, userId })

    sendSuccess(res, result)
  } catch (err) {
    next(err)
  }
}
