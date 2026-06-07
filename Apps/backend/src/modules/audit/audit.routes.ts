/**
 * audit.routes.ts — route definitions for audit log endpoints.
 *
 * Middleware chain:
 *   authenticate → resolveActiveWorkspace → requirePermission(view_audit_logs) → handler
 *
 * GET /api/v1/audit-logs       — view_audit_logs (read-only)
 * GET /api/v1/audit-logs/:id   — view_audit_logs (read-only)
 *
 * No POST/PATCH/DELETE routes — audit logs are append-only (R14.4).
 *
 * Requirements: 14.1–14.7
 */

import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate'
import { resolveActiveWorkspace } from '../../middleware/resolveActiveWorkspace'
import { requirePermission } from '../../middleware/requirePermission'
import { enforceScope } from '../../middleware/enforceScope'
import { PERMISSIONS } from '../../lib/permissions'
import { listAuditLogsHandler, getAuditLogByIdHandler } from './audit.controller'

const router = Router()

const baseGuard = [authenticate, resolveActiveWorkspace]

/**
 * GET /api/v1/audit-logs
 * Paginated, filtered list of audit logs (scope-limited for Support Admin).
 *
 * Requirements: 14.2, 14.5, 14.6, 14.7
 */
router.get(
  '/audit-logs',
  ...baseGuard,
  requirePermission(PERMISSIONS.VIEW_AUDIT_LOGS),
  enforceScope,
  listAuditLogsHandler,
)

/**
 * GET /api/v1/audit-logs/:id
 * Single audit log entry detail.
 *
 * Requirements: 14.2, 14.7
 */
router.get(
  '/audit-logs/:id',
  ...baseGuard,
  requirePermission(PERMISSIONS.VIEW_AUDIT_LOGS),
  enforceScope,
  getAuditLogByIdHandler,
)

export default router
