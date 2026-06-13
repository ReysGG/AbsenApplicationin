/**
 * shared.routes.ts — shared reference-data API, mounted at /api/v1.
 *
 *   GET   /shared/leave-types        — view_dashboard (read, any HR role)
 *   POST  /shared/leave-types        — manage_attendance_policy (configure)
 *   PATCH /shared/leave-types/:id    — manage_attendance_policy (configure)
 *
 * Activates the LeaveType model that previously had no endpoint (audit §12).
 *
 * Requirements: 11.3
 */

import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate'
import { resolveActiveWorkspace } from '../../middleware/resolveActiveWorkspace'
import { requirePermission } from '../../middleware/requirePermission'
import { PERMISSIONS } from '../../lib/permissions'
import {
  listLeaveTypesHandler,
  createLeaveTypeHandler,
  updateLeaveTypeHandler,
} from './shared.controller'

const router = Router()

const baseGuard = [authenticate, resolveActiveWorkspace]

router.get(
  '/shared/leave-types',
  ...baseGuard,
  requirePermission(PERMISSIONS.VIEW_DASHBOARD),
  listLeaveTypesHandler,
)

router.post(
  '/shared/leave-types',
  ...baseGuard,
  requirePermission(PERMISSIONS.MANAGE_ATTENDANCE_POLICY),
  createLeaveTypeHandler,
)

router.patch(
  '/shared/leave-types/:id',
  ...baseGuard,
  requirePermission(PERMISSIONS.MANAGE_ATTENDANCE_POLICY),
  updateLeaveTypeHandler,
)

export default router
