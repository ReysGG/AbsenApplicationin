/**
 * leave.routes.ts — Route definitions for leave request endpoints.
 *
 * Middleware chain per R3/R4/R17:
 *   authenticate → resolveActiveWorkspace → requirePermission → enforceScope
 *
 * All leave endpoints require `approve_leave` permission.
 *
 * GET  /api/v1/leave-requests                   — list (paginated + filtered + scope)
 * GET  /api/v1/leave-requests/:id               — detail with signed attachment URL
 * POST /api/v1/leave-requests                   — HR manual leave record creation
 * PATCH /api/v1/leave-requests/:id/approve      — approve (scope check + conflict warning)
 * PATCH /api/v1/leave-requests/:id/reject       — reject (scope check)
 * PATCH /api/v1/leave-requests/:id/cancel       — cancel (Pending only)
 * POST  /api/v1/leave-requests/:id/attachment   — upload attachment (R11.15)
 *
 * Requirements: 11.1–11.16, 17.6, 17.7
 */

import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate'
import { resolveActiveWorkspace } from '../../middleware/resolveActiveWorkspace'
import { requirePermission } from '../../middleware/requirePermission'
import { enforceScope } from '../../middleware/enforceScope'
import { PERMISSIONS } from '../../lib/permissions'
import {
  listLeaveRequestsHandler,
  getLeaveRequestHandler,
  createLeaveRequestHandler,
  approveLeaveRequestHandler,
  rejectLeaveRequestHandler,
  cancelLeaveRequestHandler,
  uploadAttachmentHandler,
} from './leave.controller'

const router = Router()

/** Shared middleware chain for all leave endpoints */
const baseGuard = [authenticate, resolveActiveWorkspace]

// ---------------------------------------------------------------------------
// GET /api/v1/leave-requests
// List leave requests with filters + pagination + scope.
// Requirements: 11.1, 11.2, 11.13, 16.7
// ---------------------------------------------------------------------------
router.get(
  '/leave-requests',
  ...baseGuard,
  requirePermission(PERMISSIONS.APPROVE_LEAVE),
  enforceScope,
  listLeaveRequestsHandler,
)

// ---------------------------------------------------------------------------
// GET /api/v1/leave-requests/:id
// Full leave request detail with signed attachment URL.
// Requirements: 11.1, 11.15, 17.6
// ---------------------------------------------------------------------------
router.get(
  '/leave-requests/:id',
  ...baseGuard,
  requirePermission(PERMISSIONS.APPROVE_LEAVE),
  enforceScope,
  getLeaveRequestHandler,
)

// ---------------------------------------------------------------------------
// POST /api/v1/leave-requests
// HR manual leave record creation.
// Requirements: 11.9, 11.11, 11.12
// ---------------------------------------------------------------------------
router.post(
  '/leave-requests',
  ...baseGuard,
  requirePermission(PERMISSIONS.APPROVE_LEAVE),
  enforceScope,
  createLeaveRequestHandler,
)

// ---------------------------------------------------------------------------
// PATCH /api/v1/leave-requests/:id/approve
// Approve leave request with scope check + conflict warning.
// Requirements: 11.4, 11.5, 11.6, 11.10, 11.16
// ---------------------------------------------------------------------------
router.patch(
  '/leave-requests/:id/approve',
  ...baseGuard,
  requirePermission(PERMISSIONS.APPROVE_LEAVE),
  enforceScope,
  approveLeaveRequestHandler,
)

// ---------------------------------------------------------------------------
// PATCH /api/v1/leave-requests/:id/reject
// Reject leave request (scope check).
// Requirements: 11.4, 11.5, 11.16
// ---------------------------------------------------------------------------
router.patch(
  '/leave-requests/:id/reject',
  ...baseGuard,
  requirePermission(PERMISSIONS.APPROVE_LEAVE),
  enforceScope,
  rejectLeaveRequestHandler,
)

// ---------------------------------------------------------------------------
// PATCH /api/v1/leave-requests/:id/cancel
// Cancel leave request (Pending only, R11.14).
// Requirements: 11.14, 11.16
// ---------------------------------------------------------------------------
router.patch(
  '/leave-requests/:id/cancel',
  ...baseGuard,
  requirePermission(PERMISSIONS.APPROVE_LEAVE),
  enforceScope,
  cancelLeaveRequestHandler,
)

// ---------------------------------------------------------------------------
// POST /api/v1/leave-requests/:id/attachment
// Upload attachment to private Supabase Storage bucket (R11.15).
// Accepts base64-encoded JSON: { fileBase64, fileName, mimeType }
// Requirements: 11.15, 17.6, 17.7
// ---------------------------------------------------------------------------
router.post(
  '/leave-requests/:id/attachment',
  ...baseGuard,
  requirePermission(PERMISSIONS.APPROVE_LEAVE),
  enforceScope,
  uploadAttachmentHandler,
)

export default router
