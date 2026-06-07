/**
 * reports.controller.ts — Request/response handlers for report endpoints.
 *
 * GET  /api/v1/reports/attendance-summary  — summary + sample rows
 * GET  /api/v1/reports/daily-detail        — paginated daily records
 * GET  /api/v1/reports/late                — paginated late records
 * GET  /api/v1/reports/missing-checkout    — paginated missing-checkout records
 * GET  /api/v1/reports/export              — sync or async export
 *
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9, 12.10
 */

import type { Request, Response, NextFunction } from 'express'
import { sendSuccess } from '../../lib/response'
import { ValidationError } from '../../lib/errors'
import { reportQuerySchema, exportQuerySchema } from './reports.schema'
import {
  getAttendanceSummary,
  getDailyDetail,
  getLateReport,
  getMissingCheckoutReport,
  exportReport,
} from './reports.service'

// ---------------------------------------------------------------------------
// GET /reports/attendance-summary
// ---------------------------------------------------------------------------

/**
 * Returns summary counts + up to 10 sample rows.
 * Permission: view_reports
 *
 * Requirements: 12.1, 12.2, 12.3, 12.5, 12.6
 */
export async function getAttendanceSummaryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parseResult = reportQuerySchema.safeParse(req.query)
    if (!parseResult.success) {
      return next(new ValidationError('Query tidak valid', parseResult.error.flatten()))
    }

    const workspaceId = req.workspaceId!

    const result = await getAttendanceSummary({
      workspaceId,
      query: parseResult.data,
      scopeFilter: req.scopeFilter ?? null,
    })

    sendSuccess(res, result)
  } catch (err) {
    next(err)
  }
}

// ---------------------------------------------------------------------------
// GET /reports/daily-detail
// ---------------------------------------------------------------------------

/**
 * Returns paginated daily attendance records.
 * Permission: view_reports
 *
 * Requirements: 12.1, 12.2, 12.5, 12.6
 */
export async function getDailyDetailHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parseResult = reportQuerySchema.safeParse(req.query)
    if (!parseResult.success) {
      return next(new ValidationError('Query tidak valid', parseResult.error.flatten()))
    }

    const workspaceId = req.workspaceId!

    const result = await getDailyDetail({
      workspaceId,
      query: parseResult.data,
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
// GET /reports/late
// ---------------------------------------------------------------------------

/**
 * Returns paginated attendance records with status=Late.
 * Permission: view_reports
 *
 * Requirements: 12.1, 12.2, 12.5, 12.6
 */
export async function getLateReportHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parseResult = reportQuerySchema.safeParse(req.query)
    if (!parseResult.success) {
      return next(new ValidationError('Query tidak valid', parseResult.error.flatten()))
    }

    const workspaceId = req.workspaceId!

    const result = await getLateReport({
      workspaceId,
      query: parseResult.data,
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
// GET /reports/missing-checkout
// ---------------------------------------------------------------------------

/**
 * Returns paginated attendance records with status=MissingCheckout.
 * Permission: view_reports
 *
 * Requirements: 12.1, 12.2, 12.5, 12.6
 */
export async function getMissingCheckoutHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parseResult = reportQuerySchema.safeParse(req.query)
    if (!parseResult.success) {
      return next(new ValidationError('Query tidak valid', parseResult.error.flatten()))
    }

    const workspaceId = req.workspaceId!

    const result = await getMissingCheckoutReport({
      workspaceId,
      query: parseResult.data,
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
// GET /reports/export
// ---------------------------------------------------------------------------

/**
 * Sync or async export.
 *   - ≤ 5000 rows  → respond with file buffer inline
 *   - > 5000, ≤ 50000 → create ExportJob, return { jobId, status: "Queued" }
 *   - > 50000 → 400 ValidationError
 *
 * Permission: export_reports
 * Audit: export_report
 *
 * Requirements: 12.4, 12.6, 12.7, 12.8, 12.9, 12.10, 12.13, 12.14, 17.6, 17.10
 */
export async function exportReportHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parseResult = exportQuerySchema.safeParse(req.query)
    if (!parseResult.success) {
      return next(new ValidationError('Query tidak valid', parseResult.error.flatten()))
    }

    const workspaceId = req.workspaceId!
    const actorUserId = req.user!.userId

    const result = await exportReport({
      workspaceId,
      query: parseResult.data,
      actorUserId,
      scopeFilter: req.scopeFilter ?? null,
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
      requestId: req.requestId ?? null,
    })

    if (result.type === 'async') {
      // Async: return job info
      sendSuccess(res, { jobId: result.jobId, status: result.status }, 'Export job dibuat', 202)
    } else {
      // Sync: stream file buffer
      res.setHeader('Content-Type', result.mimeType)
      res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`)
      res.setHeader('Content-Length', result.buffer.length)
      res.status(200).end(result.buffer)
    }
  } catch (err) {
    next(err)
  }
}
