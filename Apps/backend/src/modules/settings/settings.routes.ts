/**
 * settings.routes.ts — route definitions for settings endpoints.
 *
 * Middleware chain per R3/R4/R17:
 *   authenticate → resolveActiveWorkspace → (requirePermission) → handler
 *
 * GET  /api/v1/settings/workspace        — view_dashboard
 * PATCH /api/v1/settings/workspace       — manage_roles (or Stakeholder, checked in service)
 * GET  /api/v1/settings/roles            — manage_roles
 * POST /api/v1/settings/roles            — authenticated (Stakeholder check in service)
 * DELETE /api/v1/settings/roles/:id      — authenticated (Stakeholder check in service)
 * GET  /api/v1/settings/holidays         — view_dashboard
 * POST /api/v1/settings/holidays         — manage_attendance_policy
 * PATCH /api/v1/settings/holidays/:id    — manage_attendance_policy
 * DELETE /api/v1/settings/holidays/:id   — manage_attendance_policy
 *
 * Requirements: 3.8, 3.9, 3.12, 13.1–13.12
 */

import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate'
import { resolveActiveWorkspace } from '../../middleware/resolveActiveWorkspace'
import { requirePermission } from '../../middleware/requirePermission'
import { PERMISSIONS } from '../../lib/permissions'
import { sensitiveRateLimit } from '../../middleware/rateLimiter'
import {
  getWorkspaceSettingsHandler,
  updateWorkspaceSettingsHandler,
  getRoleAssignmentsHandler,
  assignRoleHandler,
  removeRoleHandler,
  listHolidaysHandler,
  createHolidayHandler,
  updateHolidayHandler,
  deleteHolidayHandler,
} from './settings.controller'

const router = Router()

const baseGuard = [authenticate, resolveActiveWorkspace]

// ---------------------------------------------------------------------------
// Workspace Settings
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/settings/workspace
 * Retrieve workspace settings. Any authenticated user with view_dashboard.
 *
 * Requirements: 13.1, 13.2
 */
router.get(
  '/settings/workspace',
  ...baseGuard,
  requirePermission(PERMISSIONS.VIEW_DASHBOARD),
  getWorkspaceSettingsHandler,
)

/**
 * PATCH /api/v1/settings/workspace
 * Update workspace settings.
 * manage_roles required at route level (additional Stakeholder check in service for sensitive fields).
 *
 * Requirements: 13.1–13.9, 13.11
 */
router.patch(
  '/settings/workspace',
  ...baseGuard,
  requirePermission(PERMISSIONS.MANAGE_ROLES),
  updateWorkspaceSettingsHandler,
)

// ---------------------------------------------------------------------------
// Role Management (Stakeholder only)
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/settings/roles
 * List all role assignments.
 * sensitiveRateLimit: 50 req / 15 min per IP (R17.3).
 * Requires manage_roles.
 *
 * Requirements: 3.8, 13.10
 */
router.get(
  '/settings/roles',
  sensitiveRateLimit,
  ...baseGuard,
  requirePermission(PERMISSIONS.MANAGE_ROLES),
  getRoleAssignmentsHandler,
)

/**
 * POST /api/v1/settings/roles
 * Assign a role. Stakeholder-only check in service layer.
 * sensitiveRateLimit: 50 req / 15 min per IP (R17.3).
 *
 * Requirements: 3.8, 3.9, 13.10, 13.11
 */
router.post(
  '/settings/roles',
  sensitiveRateLimit,
  ...baseGuard,
  requirePermission(PERMISSIONS.MANAGE_ROLES),
  assignRoleHandler,
)

/**
 * DELETE /api/v1/settings/roles/:id
 * Remove a role assignment. Stakeholder-only check in service layer.
 * sensitiveRateLimit: 50 req / 15 min per IP (R17.3).
 * Prevents removing the last Stakeholder.
 *
 * Requirements: 3.12, 13.11
 */
router.delete(
  '/settings/roles/:id',
  sensitiveRateLimit,
  ...baseGuard,
  requirePermission(PERMISSIONS.MANAGE_ROLES),
  removeRoleHandler,
)

// ---------------------------------------------------------------------------
// Holiday Calendar
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/settings/holidays
 * List workspace holidays.
 *
 * Requirements: 13.12
 */
router.get(
  '/settings/holidays',
  ...baseGuard,
  requirePermission(PERMISSIONS.VIEW_DASHBOARD),
  listHolidaysHandler,
)

/**
 * POST /api/v1/settings/holidays
 * Create a new holiday.
 *
 * Requirements: 13.12
 */
router.post(
  '/settings/holidays',
  ...baseGuard,
  requirePermission(PERMISSIONS.MANAGE_ATTENDANCE_POLICY),
  createHolidayHandler,
)

/**
 * PATCH /api/v1/settings/holidays/:id
 * Update a holiday.
 *
 * Requirements: 13.12
 */
router.patch(
  '/settings/holidays/:id',
  ...baseGuard,
  requirePermission(PERMISSIONS.MANAGE_ATTENDANCE_POLICY),
  updateHolidayHandler,
)

/**
 * DELETE /api/v1/settings/holidays/:id
 * Delete a holiday.
 *
 * Requirements: 13.12
 */
router.delete(
  '/settings/holidays/:id',
  ...baseGuard,
  requirePermission(PERMISSIONS.MANAGE_ATTENDANCE_POLICY),
  deleteHolidayHandler,
)

export default router
