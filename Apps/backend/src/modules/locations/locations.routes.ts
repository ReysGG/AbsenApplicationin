/**
 * locations.routes.ts — route definitions for location endpoints.
 *
 * Middleware chain per R3/R4/R17:
 *   authenticate → resolveActiveWorkspace → requirePermission → enforceScope → handler
 *
 * Location endpoints:
 *   GET  /api/v1/locations            — view_employees
 *   POST /api/v1/locations            — manage_locations
 *   GET  /api/v1/locations/:id        — view_employees
 *   PATCH /api/v1/locations/:id       — manage_locations (+ manage_geofence check in controller for radius)
 *   PATCH /api/v1/locations/:id/status — manage_locations
 *
 * WFH Location per Employee (Task 23):
 *   GET  /api/v1/employees/:employeeId/wfh-locations          — view_employees
 *   POST /api/v1/employees/:employeeId/wfh-locations          — manage_employees
 *   DELETE /api/v1/employees/:employeeId/wfh-locations/:locationId — manage_employees
 *
 * No DELETE for locations — R9.10 (lifecycle via status only)
 *
 * Requirements: 9.1–9.15
 */

import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate'
import { resolveActiveWorkspace } from '../../middleware/resolveActiveWorkspace'
import { requirePermission } from '../../middleware/requirePermission'
import { enforceScope } from '../../middleware/enforceScope'
import { PERMISSIONS } from '../../lib/permissions'
import {
  listLocationsHandler,
  createLocationHandler,
  getLocationHandler,
  updateLocationHandler,
  updateLocationStatusHandler,
  listEmployeeWfhLocationsHandler,
  assignWfhLocationHandler,
  removeWfhLocationHandler,
} from './locations.controller'

const router = Router()

const baseGuard = [authenticate, resolveActiveWorkspace]

// ---------------------------------------------------------------------------
// Location endpoints
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/locations
 * List locations; accessible to HR with view_employees.
 * Query: ?status=Active|Inactive|all, ?type=Office|Branch|WFHApproved
 *
 * Requirements: 9.1, 9.11
 */
router.get(
  '/locations',
  ...baseGuard,
  requirePermission(PERMISSIONS.VIEW_EMPLOYEES),
  enforceScope,
  listLocationsHandler,
)

/**
 * POST /api/v1/locations
 * Create a new location; requires manage_locations.
 *
 * Requirements: 9.1, 9.2, 9.4, 9.5, 9.15
 */
router.post(
  '/locations',
  ...baseGuard,
  requirePermission(PERMISSIONS.MANAGE_LOCATIONS),
  enforceScope,
  createLocationHandler,
)

/**
 * GET /api/v1/locations/:id
 * Location detail with assignedEmployeeCount.
 *
 * Requirements: 9.12
 */
router.get(
  '/locations/:id',
  ...baseGuard,
  requirePermission(PERMISSIONS.VIEW_EMPLOYEES),
  enforceScope,
  getLocationHandler,
)

/**
 * PATCH /api/v1/locations/:id
 * Update location fields. Requires manage_locations.
 * Controller additionally checks manage_geofence if radiusMeters is being changed (R9.8).
 *
 * Requirements: 9.5, 9.6, 9.8, 9.15
 */
router.patch(
  '/locations/:id',
  ...baseGuard,
  requirePermission(PERMISSIONS.MANAGE_LOCATIONS),
  enforceScope,
  updateLocationHandler,
)

/**
 * PATCH /api/v1/locations/:id/status
 * Deactivate or reactivate a location. No hard delete (R9.10).
 *
 * Requirements: 9.10, 9.15
 */
router.patch(
  '/locations/:id/status',
  ...baseGuard,
  requirePermission(PERMISSIONS.MANAGE_LOCATIONS),
  enforceScope,
  updateLocationStatusHandler,
)

// ---------------------------------------------------------------------------
// WFH Location per Employee (Task 23)
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/employees/:employeeId/wfh-locations
 * List WFH locations for a specific employee.
 *
 * Requirements: 9.13
 */
router.get(
  '/employees/:employeeId/wfh-locations',
  ...baseGuard,
  requirePermission(PERMISSIONS.VIEW_EMPLOYEES),
  enforceScope,
  listEmployeeWfhLocationsHandler,
)

/**
 * POST /api/v1/employees/:employeeId/wfh-locations
 * Assign a WFHApproved location to an employee (max 3 per employee).
 *
 * Requirements: 9.13, 9.14
 */
router.post(
  '/employees/:employeeId/wfh-locations',
  ...baseGuard,
  requirePermission(PERMISSIONS.MANAGE_EMPLOYEES),
  enforceScope,
  assignWfhLocationHandler,
)

/**
 * DELETE /api/v1/employees/:employeeId/wfh-locations/:locationId
 * Remove a WFH location assignment from an employee.
 * Deletes the assignment pivot record — not the location itself.
 *
 * Requirements: 9.13
 */
router.delete(
  '/employees/:employeeId/wfh-locations/:locationId',
  ...baseGuard,
  requirePermission(PERMISSIONS.MANAGE_EMPLOYEES),
  enforceScope,
  removeWfhLocationHandler,
)

export default router
