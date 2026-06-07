/**
 * attendance.routes.ts — Route definitions for attendance endpoints.
 *
 * Middleware chain per R3/R4/R17:
 *   authenticate → resolveActiveWorkspace → requirePermission → enforceScope
 *
 * GET  /api/v1/attendance                      — view_live_attendance
 * GET  /api/v1/attendance/:id                  — view_live_attendance
 * POST /api/v1/attendance/:id/adjustment-note  — view_live_attendance
 *
 * AttendanceLogs are READ-ONLY from the dashboard except for the `notes` field
 * which HR can update via adjustment-note (R6.6).
 *
 * Requirements: 6.1, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9
 */

import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate'
import { resolveActiveWorkspace } from '../../middleware/resolveActiveWorkspace'
import { requirePermission } from '../../middleware/requirePermission'
import { enforceScope } from '../../middleware/enforceScope'
import { PERMISSIONS } from '../../lib/permissions'
import {
  listAttendanceHandler,
  getAttendanceHandler,
  addAdjustmentNoteHandler,
} from './attendance.controller'

const router = Router()

// Shared middleware chain
const baseGuard = [authenticate, resolveActiveWorkspace]

// ---------------------------------------------------------------------------
// GET /api/v1/attendance
// List attendance records with filters, pagination, and scope.
// Requirements: 6.1, 6.3, 6.4, 6.5, 16.2, 16.7
// ---------------------------------------------------------------------------
router.get(
  '/attendance',
  ...baseGuard,
  requirePermission(PERMISSIONS.VIEW_LIVE_ATTENDANCE),
  enforceScope,
  listAttendanceHandler,
)

// ---------------------------------------------------------------------------
// GET /api/v1/attendance/:id
// Full attendance record detail.
// Requirements: 6.8, 6.9
// ---------------------------------------------------------------------------
router.get(
  '/attendance/:id',
  ...baseGuard,
  requirePermission(PERMISSIONS.VIEW_LIVE_ATTENDANCE),
  enforceScope,
  getAttendanceHandler,
)

// ---------------------------------------------------------------------------
// POST /api/v1/attendance/:id/adjustment-note
// Add admin note — only notes field is updated (R6.6).
// Requirements: 6.6, 6.7, 14.1
// ---------------------------------------------------------------------------
router.post(
  '/attendance/:id/adjustment-note',
  ...baseGuard,
  requirePermission(PERMISSIONS.VIEW_LIVE_ATTENDANCE),
  enforceScope,
  addAdjustmentNoteHandler,
)

export default router
