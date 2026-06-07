/**
 * departments.routes.ts — route definitions for department endpoints.
 *
 * Middleware chain per R3/R4/R17:
 *   authenticate → resolveActiveWorkspace → requirePermission → enforceScope
 *
 * GET  /api/v1/departments          — view_employees (list)
 * POST /api/v1/departments          — manage_employees (create)
 * GET  /api/v1/departments/:id      — view_employees (detail + employees)
 * PATCH /api/v1/departments/:id     — manage_employees (update/deactivate)
 *
 * No DELETE endpoint — R8.4 (lifecycle via status only)
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */

import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate'
import { resolveActiveWorkspace } from '../../middleware/resolveActiveWorkspace'
import { requirePermission } from '../../middleware/requirePermission'
import { enforceScope } from '../../middleware/enforceScope'
import { PERMISSIONS } from '../../lib/permissions'
import {
  listDepartmentsHandler,
  createDepartmentHandler,
  getDepartmentHandler,
  updateDepartmentHandler,
} from './departments.controller'

const router = Router()

// Shared base guard for all department routes
const baseGuard = [authenticate, resolveActiveWorkspace]

/**
 * GET /api/v1/departments
 * Lists all departments; accessible to HR with view_employees.
 *
 * Requirements: 8.1
 */
router.get(
  '/departments',
  ...baseGuard,
  requirePermission(PERMISSIONS.VIEW_EMPLOYEES),
  enforceScope,
  listDepartmentsHandler,
)

/**
 * POST /api/v1/departments
 * Create a new department; requires manage_employees.
 *
 * Requirements: 8.1, 8.5, 8.6
 */
router.post(
  '/departments',
  ...baseGuard,
  requirePermission(PERMISSIONS.MANAGE_EMPLOYEES),
  enforceScope,
  createDepartmentHandler,
)

/**
 * GET /api/v1/departments/:id
 * Department detail with active employee list.
 *
 * Requirements: 8.2
 */
router.get(
  '/departments/:id',
  ...baseGuard,
  requirePermission(PERMISSIONS.VIEW_EMPLOYEES),
  enforceScope,
  getDepartmentHandler,
)

/**
 * PATCH /api/v1/departments/:id
 * Update name and/or status (deactivate).
 *
 * Requirements: 8.4, 8.6
 */
router.patch(
  '/departments/:id',
  ...baseGuard,
  requirePermission(PERMISSIONS.MANAGE_EMPLOYEES),
  enforceScope,
  updateDepartmentHandler,
)

export default router
