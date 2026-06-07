/**
 * exports.routes.ts — Route definitions for ExportJob endpoints.
 *
 * Middleware chain per R3/R4/R17:
 *   authenticate → resolveActiveWorkspace → requirePermission → enforceScope
 *
 * GET /api/v1/exports       — permission: export_reports (list own jobs)
 * GET /api/v1/exports/:id   — permission: export_reports (single job + signed URL)
 *
 * Requirements: 12.10, 12.11, 12.12, 12.13, 12.14, 17.6
 */

import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate'
import { resolveActiveWorkspace } from '../../middleware/resolveActiveWorkspace'
import { requirePermission } from '../../middleware/requirePermission'
import { enforceScope } from '../../middleware/enforceScope'
import { PERMISSIONS } from '../../lib/permissions'
import { listExportJobsHandler, getExportJobHandler } from './exports.controller'

const router = Router()

const baseGuard = [authenticate, resolveActiveWorkspace]

// ---------------------------------------------------------------------------
// GET /api/v1/exports
// List export jobs for the current user.
// Requirements: 12.10, 12.11, 12.12, 12.13
// ---------------------------------------------------------------------------
router.get(
  '/exports',
  ...baseGuard,
  requirePermission(PERMISSIONS.EXPORT_REPORTS),
  enforceScope,
  listExportJobsHandler,
)

// ---------------------------------------------------------------------------
// GET /api/v1/exports/:id
// Single export job with status + signed URL (if Completed).
// Requirements: 12.10, 12.14, 17.6
// ---------------------------------------------------------------------------
router.get(
  '/exports/:id',
  ...baseGuard,
  requirePermission(PERMISSIONS.EXPORT_REPORTS),
  enforceScope,
  getExportJobHandler,
)

export default router
