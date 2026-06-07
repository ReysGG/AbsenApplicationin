/**
 * employees.routes.ts — Route definitions for employee endpoints.
 *
 * Middleware chain per R3/R4/R17:
 *   authenticate → resolveActiveWorkspace → requirePermission → enforceScope
 *
 * GET  /api/v1/employees                    — view_employees
 * POST /api/v1/employees                    — manage_employees
 * GET  /api/v1/employees/:id                — view_employees
 * PATCH /api/v1/employees/:id               — manage_employees
 * PATCH /api/v1/employees/:id/status        — manage_employees
 * POST /api/v1/employees/:id/resend-invitation — manage_employees
 * POST /api/v1/employees/activate           — PUBLIC (no auth)
 *
 * No DELETE endpoint — R7.8 (lifecycle via status only).
 *
 * Requirements: 7.1–7.16, 2.1–2.8
 */

import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate'
import { resolveActiveWorkspace } from '../../middleware/resolveActiveWorkspace'
import { requirePermission } from '../../middleware/requirePermission'
import { enforceScope } from '../../middleware/enforceScope'
import { PERMISSIONS } from '../../lib/permissions'
import {
  listEmployeesHandler,
  createEmployeeHandler,
  getEmployeeHandler,
  updateEmployeeHandler,
  updateEmployeeStatusHandler,
  resendInvitationHandler,
  activateAccountHandler,
} from './employees.controller'

const router = Router()

// Shared guards for authenticated routes
const baseGuard = [authenticate, resolveActiveWorkspace]

// ---------------------------------------------------------------------------
// PUBLIC — no auth (activation link)
// ---------------------------------------------------------------------------

/**
 * POST /api/v1/employees/activate
 * Public endpoint hit from the invitation email link.
 * Must be registered BEFORE /:id routes to avoid param collision.
 *
 * Requirements: 2.5, 2.7
 */
router.post('/employees/activate', activateAccountHandler)

// ---------------------------------------------------------------------------
// Authenticated routes
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/employees
 * List employees with filters + pagination + scope.
 *
 * Requirements: 7.1, 7.10
 */
router.get(
  '/employees',
  ...baseGuard,
  requirePermission(PERMISSIONS.VIEW_EMPLOYEES),
  enforceScope,
  listEmployeesHandler,
)

/**
 * POST /api/v1/employees
 * Create a new employee.
 *
 * Requirements: 7.3, 7.4, 7.5, 7.6, 2.1, 2.2
 */
router.post(
  '/employees',
  ...baseGuard,
  requirePermission(PERMISSIONS.MANAGE_EMPLOYEES),
  enforceScope,
  createEmployeeHandler,
)

/**
 * GET /api/v1/employees/:id
 * Employee detail with warnings.
 *
 * Requirements: 7.12
 */
router.get(
  '/employees/:id',
  ...baseGuard,
  requirePermission(PERMISSIONS.VIEW_EMPLOYEES),
  enforceScope,
  getEmployeeHandler,
)

/**
 * PATCH /api/v1/employees/:id
 * Update employee fields.
 *
 * Requirements: 7.4, 7.5, 7.15, 7.16
 */
router.patch(
  '/employees/:id',
  ...baseGuard,
  requirePermission(PERMISSIONS.MANAGE_EMPLOYEES),
  enforceScope,
  updateEmployeeHandler,
)

/**
 * PATCH /api/v1/employees/:id/status
 * Lifecycle status change (Active / Inactive / Suspended / Archived).
 * Archive triggers account disable logic (Task 20).
 *
 * Requirements: 7.8–7.11, 7.16
 */
router.patch(
  '/employees/:id/status',
  ...baseGuard,
  requirePermission(PERMISSIONS.MANAGE_EMPLOYEES),
  enforceScope,
  updateEmployeeStatusHandler,
)

/**
 * POST /api/v1/employees/:id/resend-invitation
 * Resend activation email — invalidates old token, generates new.
 *
 * Requirements: 2.3, 2.6
 */
router.post(
  '/employees/:id/resend-invitation',
  ...baseGuard,
  requirePermission(PERMISSIONS.MANAGE_EMPLOYEES),
  enforceScope,
  resendInvitationHandler,
)

export default router
