/**
 * dashboard.controller.ts — request/response handlers for dashboard endpoints.
 *
 * GET /api/v1/dashboard/summary
 * GET /api/v1/dashboard/attendance-trend
 * GET /api/v1/dashboard/department-breakdown
 * GET /api/v1/dashboard/live-preview
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.6, 5.7, 5.8, 5.9, 5.10
 */

import type { Request, Response, NextFunction } from 'express'
import { sendSuccess } from '../../lib/response'
import { UnauthenticatedError, ValidationError } from '../../lib/errors'
import {
  getDashboardSummary,
  getAttendanceTrend,
  getDepartmentBreakdown,
  getLivePreview,
} from './dashboard.service'

// ---------------------------------------------------------------------------
// Helper: today UTC as YYYY-MM-DD
// ---------------------------------------------------------------------------
function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

// ---------------------------------------------------------------------------
// Helper: parse & validate date string YYYY-MM-DD
// ---------------------------------------------------------------------------
function parseDate(raw: unknown, fallback: string): string {
  if (typeof raw !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return fallback
  const d = new Date(raw)
  if (isNaN(d.getTime())) return fallback
  return raw
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/dashboard/summary
 *
 * Query params:
 *   date          YYYY-MM-DD  (default: today UTC)
 *   department_id string | "all"
 *   location_id   string | "all"
 *
 * Requirements: 5.1, 5.6, 5.7, 5.8, 5.10
 */
export async function summaryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user || !req.workspaceId) {
      return next(new UnauthenticatedError('Autentikasi diperlukan'))
    }

    const q = req.query as Record<string, unknown>
    const date = parseDate(q['date'], todayUtc())
    const departmentId = typeof q['department_id'] === 'string' ? q['department_id'] : undefined
    const locationId = typeof q['location_id'] === 'string' ? q['location_id'] : undefined

    const data = await getDashboardSummary({
      workspaceId: req.workspaceId,
      date,
      departmentId,
      locationId,
      scopeFilter: req.scopeFilter,
    })

    sendSuccess(res, data)
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/v1/dashboard/attendance-trend
 *
 * Query params:
 *   days          number  (default: 30, max: 90)
 *   department_id string | "all"
 *   location_id   string | "all"
 *
 * Requirements: 5.2, 5.4, 5.9, 5.10
 */
export async function attendanceTrendHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user || !req.workspaceId) {
      return next(new UnauthenticatedError('Autentikasi diperlukan'))
    }

    const q = req.query as Record<string, unknown>
    const rawDays = parseInt(String(q['days'] ?? '30'), 10)
    const days = isNaN(rawDays) ? 30 : rawDays
    const departmentId = typeof q['department_id'] === 'string' ? q['department_id'] : undefined
    const locationId = typeof q['location_id'] === 'string' ? q['location_id'] : undefined

    if (days < 1 || days > 90) {
      return next(new ValidationError('Parameter days harus antara 1 dan 90'))
    }

    const data = await getAttendanceTrend({
      workspaceId: req.workspaceId,
      days,
      departmentId,
      locationId,
      scopeFilter: req.scopeFilter,
    })

    sendSuccess(res, data)
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/v1/dashboard/department-breakdown
 *
 * Query params:
 *   date          YYYY-MM-DD  (default: today UTC)
 *   department_id string | "all"
 *   location_id   string | "all"
 *
 * Requirements: 5.3, 5.4, 5.8, 5.10
 */
export async function departmentBreakdownHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user || !req.workspaceId) {
      return next(new UnauthenticatedError('Autentikasi diperlukan'))
    }

    const q = req.query as Record<string, unknown>
    const date = parseDate(q['date'], todayUtc())
    const departmentId = typeof q['department_id'] === 'string' ? q['department_id'] : undefined
    const locationId = typeof q['location_id'] === 'string' ? q['location_id'] : undefined

    const data = await getDepartmentBreakdown({
      workspaceId: req.workspaceId,
      date,
      departmentId,
      locationId,
      scopeFilter: req.scopeFilter,
    })

    sendSuccess(res, data)
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/v1/dashboard/live-preview
 *
 * Query params:
 *   limit         number  (default: 5, max: 20)
 *   department_id string | "all"
 *   location_id   string | "all"
 *
 * Requirements: 5.3, 5.4, 5.8, 5.10
 */
export async function livePreviewHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user || !req.workspaceId) {
      return next(new UnauthenticatedError('Autentikasi diperlukan'))
    }

    const q = req.query as Record<string, unknown>
    const rawLimit = parseInt(String(q['limit'] ?? '5'), 10)
    const limit = isNaN(rawLimit) ? 5 : rawLimit
    const departmentId = typeof q['department_id'] === 'string' ? q['department_id'] : undefined
    const locationId = typeof q['location_id'] === 'string' ? q['location_id'] : undefined

    const data = await getLivePreview({
      workspaceId: req.workspaceId,
      limit,
      departmentId,
      locationId,
      scopeFilter: req.scopeFilter,
    })

    sendSuccess(res, data)
  } catch (err) {
    next(err)
  }
}
