/**
 * reports.routes.ts — Route definitions for report endpoints.
 *
 * Middleware chain per R3/R4/R17:
 *   authenticate → resolveActiveWorkspace → requirePermission → enforceScope
 *
 * GET /api/v1/reports/attendance-summary  — permission: view_reports
 * GET /api/v1/reports/daily-detail        — permission: view_reports
 * GET /api/v1/reports/late                — permission: view_reports
 * GET /api/v1/reports/missing-checkout    — permission: view_reports
 * GET /api/v1/reports/export              — permission: export_reports
 *
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9, 12.10
 */

import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate'
import { resolveActiveWorkspace } from '../../middleware/resolveActiveWorkspace'
import { requirePermission } from '../../middleware/requirePermission'
import { enforceScope } from '../../middleware/enforceScope'
import { PERMISSIONS } from '../../lib/permissions'
import { sensitiveRateLimit } from '../../middleware/rateLimiter'
import {
  getAttendanceSummaryHandler,
  getDailyDetailHandler,
  getLateReportHandler,
  getMissingCheckoutHandler,
  exportReportHandler,
} from './reports.controller'

const router = Router()

const baseGuard = [authenticate, resolveActiveWorkspace]

// ---------------------------------------------------------------------------
// GET /api/v1/reports/attendance-summary
// Summary counts + up to 10 sample rows.
// Requirements: 12.1, 12.2, 12.3, 12.5, 12.6
// ---------------------------------------------------------------------------
router.get(
  '/reports/attendance-summary',
  ...baseGuard,
  requirePermission(PERMISSIONS.VIEW_REPORTS),
  enforceScope,
  getAttendanceSummaryHandler,
)

// ---------------------------------------------------------------------------
// GET /api/v1/reports/daily-detail
// Paginated daily attendance records.
// Requirements: 12.1, 12.2, 12.5, 12.6
// ---------------------------------------------------------------------------
router.get(
  '/reports/daily-detail',
  ...baseGuard,
  requirePermission(PERMISSIONS.VIEW_REPORTS),
  enforceScope,
  getDailyDetailHandler,
)

// ---------------------------------------------------------------------------
// GET /api/v1/reports/late
// Paginated late attendance logs.
// Requirements: 12.1, 12.2, 12.5, 12.6
// ---------------------------------------------------------------------------
router.get(
  '/reports/late',
  ...baseGuard,
  requirePermission(PERMISSIONS.VIEW_REPORTS),
  enforceScope,
  getLateReportHandler,
)

// ---------------------------------------------------------------------------
// GET /api/v1/reports/missing-checkout
// Paginated missing-checkout logs.
// Requirements: 12.1, 12.2, 12.5, 12.6
// ---------------------------------------------------------------------------
router.get(
  '/reports/missing-checkout',
  ...baseGuard,
  requirePermission(PERMISSIONS.VIEW_REPORTS),
  enforceScope,
  getMissingCheckoutHandler,
)

// ---------------------------------------------------------------------------
// GET /api/v1/reports/export
// Sync (≤5000) or async (>5000, ≤50000) export.
// sensitiveRateLimit: 50 req / 15 min per IP (R17.3).
// Requirements: 12.4, 12.6, 12.7, 12.8, 12.9, 12.10, 12.13, 12.14
// ---------------------------------------------------------------------------
router.get(
  '/reports/export',
  sensitiveRateLimit,
  ...baseGuard,
  requirePermission(PERMISSIONS.EXPORT_REPORTS),
  enforceScope,
  exportReportHandler,
)

export default router
