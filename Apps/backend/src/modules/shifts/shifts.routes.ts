/**
 * shifts.routes.ts — Route definitions for shift endpoints.
 *
 * Middleware chain per R3/R4/R17:
 *   authenticate → resolveActiveWorkspace → requirePermission → enforceScope
 *
 * GET  /api/v1/shifts                       — view_employees
 * POST /api/v1/shifts                       — manage_shifts
 * GET  /api/v1/shifts/:id                   — view_employees
 * PATCH /api/v1/shifts/:id                  — manage_shifts
 * POST /api/v1/shifts/:id/assign            — manage_shifts
 * GET  /api/v1/employees/without-shift      — view_employees
 *
 * No DELETE endpoint — R10.10 (lifecycle Active → Inactive only).
 *
 * Requirements: 10.1–10.13
 */

import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate'
import { resolveActiveWorkspace } from '../../middleware/resolveActiveWorkspace'
import { requirePermission } from '../../middleware/requirePermission'
import { enforceScope } from '../../middleware/enforceScope'
import { PERMISSIONS } from '../../lib/permissions'
import {
  listShiftsHandler,
  createShiftHandler,
  getShiftHandler,
  updateShiftHandler,
  assignShiftHandler,
  listEmployeesWithoutShiftHandler,
} from './shifts.controller'

const router = Router()

// Shared guards for authenticated routes
const baseGuard = [authenticate, resolveActiveWorkspace]

// ---------------------------------------------------------------------------
// Employee without shift (must be before /:id routes)
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/employees/without-shift
 * Returns active employees with no assigned shift.
 * Must be registered BEFORE /employees/:id to avoid param collision.
 *
 * Requirements: 10.11
 */
router.get(
  '/employees/without-shift',
  ...baseGuard,
  requirePermission(PERMISSIONS.VIEW_EMPLOYEES),
  enforceScope,
  listEmployeesWithoutShiftHandler,
)

// ---------------------------------------------------------------------------
// Shift routes
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/shifts
 * List shifts with optional ?status=Active|Inactive|all filter.
 *
 * Requirements: 10.1, 10.2
 */
router.get(
  '/shifts',
  ...baseGuard,
  requirePermission(PERMISSIONS.VIEW_EMPLOYEES),
  enforceScope,
  listShiftsHandler,
)

/**
 * POST /api/v1/shifts
 * Create a new shift.
 *
 * Requirements: 10.2–10.6, 10.9, 10.12, 10.13
 */
router.post(
  '/shifts',
  ...baseGuard,
  requirePermission(PERMISSIONS.MANAGE_SHIFTS),
  enforceScope,
  createShiftHandler,
)

/**
 * GET /api/v1/shifts/:id
 * Shift detail.
 *
 * Requirements: 10.2
 */
router.get(
  '/shifts/:id',
  ...baseGuard,
  requirePermission(PERMISSIONS.VIEW_EMPLOYEES),
  enforceScope,
  getShiftHandler,
)

/**
 * PATCH /api/v1/shifts/:id
 * Update shift fields or deactivate (Active → Inactive).
 * No hard delete (R10.10).
 *
 * Requirements: 10.9, 10.10, 10.12, 10.13
 */
router.patch(
  '/shifts/:id',
  ...baseGuard,
  requirePermission(PERMISSIONS.MANAGE_SHIFTS),
  enforceScope,
  updateShiftHandler,
)

/**
 * POST /api/v1/shifts/:id/assign
 * Assign shift to employees.
 *
 * Requirements: 10.8, 10.13
 */
router.post(
  '/shifts/:id/assign',
  ...baseGuard,
  requirePermission(PERMISSIONS.MANAGE_SHIFTS),
  enforceScope,
  assignShiftHandler,
)

export default router
