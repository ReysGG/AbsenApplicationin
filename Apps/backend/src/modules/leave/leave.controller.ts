/**
 * leave.controller.ts — Request/response handlers for leave request endpoints.
 *
 * GET  /api/v1/leave-requests                     — list (paginated + filtered)
 * GET  /api/v1/leave-requests/:id                 — detail with signed URL
 * POST /api/v1/leave-requests                     — HR manual create
 * PATCH /api/v1/leave-requests/:id/approve        — approve (scope check)
 * PATCH /api/v1/leave-requests/:id/reject         — reject
 * PATCH /api/v1/leave-requests/:id/cancel         — cancel (Pending only)
 * POST  /api/v1/leave-requests/:id/attachment     — upload attachment (R11.15)
 *
 * Requirements: 11.1–11.16, 17.6, 17.7
 */

import type { Request, Response, NextFunction } from 'express'
import { sendSuccess } from '../../lib/response'
import { ValidationError } from '../../lib/errors'
import {
  listLeaveQuerySchema,
  createLeaveSchema,
  rejectLeaveSchema,
  uploadAttachmentSchema,
} from './leave.schema'
import {
  listLeaveRequests,
  getLeaveRequestById,
  createLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  cancelLeaveRequest,
  uploadLeaveAttachment,
} from './leave.service'

// ---------------------------------------------------------------------------
// GET /leave-requests
// ---------------------------------------------------------------------------

/**
 * List leave requests with filters, pagination, and scope.
 * Permission: approve_leave
 *
 * Requirements: 11.1, 11.2, 11.13
 */
export async function listLeaveRequestsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parseResult = listLeaveQuerySchema.safeParse(req.query)
    if (!parseResult.success) {
      return next(new ValidationError('Query tidak valid', parseResult.error.flatten()))
    }

    const workspaceId = req.workspaceId!
    const { status, employee_id, start_date, end_date, page, page_size } = parseResult.data

    const result = await listLeaveRequests({
      workspaceId,
      status,
      employeeId: employee_id,
      startDate: start_date,
      endDate: end_date,
      page,
      pageSize: page_size,
      scopeFilter: req.scopeFilter ?? null,
    })

    res.status(200).json({
      success: true,
      data: result.items,
      pagination: result.pagination,
      message: 'OK',
    })
  } catch (err) {
    next(err)
  }
}

// ---------------------------------------------------------------------------
// GET /leave-requests/:id
// ---------------------------------------------------------------------------

/**
 * Get leave request detail with signed attachment URL.
 * Permission: approve_leave
 *
 * Requirements: 11.1, 11.15, 17.6
 */
export async function getLeaveRequestHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const workspaceId = req.workspaceId!
    const id = req.params['id'] as string

    const leave = await getLeaveRequestById(workspaceId, id, req.scopeFilter ?? null)
    sendSuccess(res, leave)
  } catch (err) {
    next(err)
  }
}

// ---------------------------------------------------------------------------
// POST /leave-requests
// ---------------------------------------------------------------------------

/**
 * HR manual leave record creation.
 * Permission: approve_leave
 *
 * Requirements: 11.9, 11.11, 11.12
 */
export async function createLeaveRequestHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parseResult = createLeaveSchema.safeParse(req.body)
    if (!parseResult.success) {
      return next(new ValidationError('Data tidak valid', parseResult.error.flatten()))
    }

    const workspaceId = req.workspaceId!
    const actorUserId = req.user!.userId

    const leave = await createLeaveRequest({
      workspaceId,
      input: parseResult.data,
      actorUserId,
      scopeFilter: req.scopeFilter ?? null,
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
      requestId: req.requestId ?? null,
    })

    sendSuccess(res, leave, 'Permintaan cuti berhasil dibuat', 201)
  } catch (err) {
    next(err)
  }
}

// ---------------------------------------------------------------------------
// PATCH /leave-requests/:id/approve
// ---------------------------------------------------------------------------

/**
 * Approve a leave request (scope check + conflict warning).
 * Permission: approve_leave + scope over employee (R11.5)
 *
 * Requirements: 11.4, 11.5, 11.6, 11.10, 11.16
 */
export async function approveLeaveRequestHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const workspaceId = req.workspaceId!
    const actorUserId = req.user!.userId
    const id = req.params['id'] as string

    const result = await approveLeaveRequest({
      workspaceId,
      leaveId: id,
      actorUserId,
      scopeFilter: req.scopeFilter ?? null,
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
      requestId: req.requestId ?? null,
    })

    const message = result.conflictWarning
      ? 'Permintaan cuti disetujui. Peringatan: ada konflik dengan data absensi yang sudah ada.'
      : 'Permintaan cuti berhasil disetujui'

    sendSuccess(res, result, message)
  } catch (err) {
    next(err)
  }
}

// ---------------------------------------------------------------------------
// PATCH /leave-requests/:id/reject
// ---------------------------------------------------------------------------

/**
 * Reject a leave request.
 * Permission: approve_leave + scope over employee (R11.5)
 *
 * Requirements: 11.4, 11.5, 11.16
 */
export async function rejectLeaveRequestHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parseResult = rejectLeaveSchema.safeParse(req.body)
    if (!parseResult.success) {
      return next(new ValidationError('Data tidak valid', parseResult.error.flatten()))
    }

    const workspaceId = req.workspaceId!
    const actorUserId = req.user!.userId
    const id = req.params['id'] as string

    const result = await rejectLeaveRequest({
      workspaceId,
      leaveId: id,
      actorUserId,
      input: parseResult.data,
      scopeFilter: req.scopeFilter ?? null,
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
      requestId: req.requestId ?? null,
    })

    sendSuccess(res, result, 'Permintaan cuti berhasil ditolak')
  } catch (err) {
    next(err)
  }
}

// ---------------------------------------------------------------------------
// PATCH /leave-requests/:id/cancel
// ---------------------------------------------------------------------------

/**
 * Cancel a leave request (Pending only).
 * Permission: approve_leave
 *
 * Requirements: 11.14, 11.16
 */
export async function cancelLeaveRequestHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const workspaceId = req.workspaceId!
    const actorUserId = req.user!.userId
    const id = req.params['id'] as string

    const result = await cancelLeaveRequest({
      workspaceId,
      leaveId: id,
      actorUserId,
      scopeFilter: req.scopeFilter ?? null,
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
      requestId: req.requestId ?? null,
    })

    sendSuccess(res, result, 'Permintaan cuti berhasil dibatalkan')
  } catch (err) {
    next(err)
  }
}

// ---------------------------------------------------------------------------
// POST /leave-requests/:id/attachment
// ---------------------------------------------------------------------------

/**
 * Upload attachment to private Supabase Storage bucket.
 * Permission: approve_leave
 *
 * Accepts base64-encoded file in JSON body:
 *   { fileBase64, fileName, mimeType }
 *
 * Returns signed URL valid for 24 hours.
 *
 * Requirements: 11.15, 17.6, 17.7
 */
export async function uploadAttachmentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parseResult = uploadAttachmentSchema.safeParse(req.body)
    if (!parseResult.success) {
      return next(new ValidationError('Data tidak valid', parseResult.error.flatten()))
    }

    const workspaceId = req.workspaceId!
    const actorUserId = req.user!.userId
    const id = req.params['id'] as string

    const result = await uploadLeaveAttachment({
      workspaceId,
      leaveId: id,
      input: parseResult.data,
      actorUserId,
      scopeFilter: req.scopeFilter ?? null,
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
      requestId: req.requestId ?? null,
    })

    sendSuccess(res, result, 'Lampiran berhasil diunggah', 201)
  } catch (err) {
    next(err)
  }
}
