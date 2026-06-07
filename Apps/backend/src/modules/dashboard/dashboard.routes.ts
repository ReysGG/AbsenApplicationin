/**
 * dashboard.routes.ts — route definitions for dashboard endpoints.
 *
 * All routes require:
 *   authenticate → resolveActiveWorkspace → requirePermission(view_dashboard) → enforceScope
 *
 * GET /api/v1/dashboard/summary
 * GET /api/v1/dashboard/attendance-trend
 * GET /api/v1/dashboard/department-breakdown
 * GET /api/v1/dashboard/live-preview
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.6, 5.7, 5.8, 5.9, 5.10
 */

import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate'
import { resolveActiveWorkspace } from '../../middleware/resolveActiveWorkspace'
import { requirePermission } from '../../middleware/requirePermission'
import { enforceScope } from '../../middleware/enforceScope'
import { PERMISSIONS } from '../../lib/permissions'
import {
  summaryHandler,
  attendanceTrendHandler,
  departmentBreakdownHandler,
  livePreviewHandler,
} from './dashboard.controller'

const router = Router()

// Shared middleware chain for all dashboard routes
const dashboardGuard = [
  authenticate,
  resolveActiveWorkspace,
  requirePermission(PERMISSIONS.VIEW_DASHBOARD),
  enforceScope,
]

/**
 * GET /api/v1/dashboard/summary
 * Returns summary cards for today's attendance.
 */
router.get('/dashboard/summary', ...dashboardGuard, summaryHandler)

/**
 * GET /api/v1/dashboard/attendance-trend
 * Returns N-day attendance trend (default 30, max 90).
 */
router.get('/dashboard/attendance-trend', ...dashboardGuard, attendanceTrendHandler)

/**
 * GET /api/v1/dashboard/department-breakdown
 * Returns per-department attendance breakdown.
 */
router.get('/dashboard/department-breakdown', ...dashboardGuard, departmentBreakdownHandler)

/**
 * GET /api/v1/dashboard/live-preview
 * Returns latest N check-ins today (default 5, max 20).
 */
router.get('/dashboard/live-preview', ...dashboardGuard, livePreviewHandler)

export default router
