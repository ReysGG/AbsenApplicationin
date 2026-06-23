/**
 * attendance.controller.ts — Request/response handlers for attendance endpoints.
 *
 * GET  /api/v1/attendance                        — list attendance (paginated + filtered)
 * GET  /api/v1/attendance/:id                    — attendance detail
 * POST /api/v1/attendance/:id/adjustment-note    — add admin note (notes field only)
 *
 * Requirements: 6.1, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 16.2, 16.7
 */

import type { Request, Response, NextFunction } from 'express'
import { pipeline } from 'node:stream/promises'
import { sendSuccess } from '../../lib/response'
import { ValidationError } from '../../lib/errors'
import { listAttendanceQuerySchema, adjustmentNoteSchema } from './attendance.schema'
import {
  listAttendance,
  getAttendanceById,
  getAttendanceFaceImage,
  addAdjustmentNote,
} from './attendance.service'

// ---------------------------------------------------------------------------
// GET /attendance
// ---------------------------------------------------------------------------

/**
 * List attendance records with filters, pagination, and scope.
 * Permission: view_live_attendance
 *
 * Requirements: 6.1, 6.3, 6.4, 6.5, 16.2, 16.7
 */
export async function listAttendanceHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parseResult = listAttendanceQuerySchema.safeParse(req.query)
    if (!parseResult.success) {
      return next(new ValidationError('Query tidak valid', parseResult.error.flatten()))
    }

    const workspaceId = req.workspaceId!
    const {
      start_date,
      end_date,
      department_id,
      location_id,
      shift_id,
      status,
      search,
      page,
      page_size,
    } = parseResult.data

    const result = await listAttendance({
      workspaceId,
      startDate: start_date,
      endDate: end_date,
      departmentId: department_id,
      locationId: location_id,
      shiftId: shift_id,
      status,
      search,
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
// GET /attendance/:id
// ---------------------------------------------------------------------------

/**
 * Get full attendance record detail.
 * Permission: view_live_attendance
 *
 * Requirements: 6.8, 6.9
 */
export async function getAttendanceHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const workspaceId = req.workspaceId!
    const id = req.params['id'] as string

    const log = await getAttendanceById(workspaceId, id, req.scopeFilter ?? null)
    sendSuccess(res, log)
  } catch (err) {
    next(err)
  }
}

// ---------------------------------------------------------------------------
// GET /attendance/:id/face/:kind
// ---------------------------------------------------------------------------

/**
 * Stream a private attendance face image after auth, permission, and scope
 * checks. This keeps Vercel Blob read tokens server-side.
 */
export async function getAttendanceFaceHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const workspaceId = req.workspaceId!
    const id = req.params['id'] as string
    const kind = req.params['kind'] as string

    if (kind !== 'check-in' && kind !== 'check-out') {
      return next(new ValidationError('Jenis foto absensi tidak valid'))
    }

    const image = await getAttendanceFaceImage(
      workspaceId,
      id,
      kind,
      req.scopeFilter ?? null,
    )

    res.status(200)
    res.setHeader('Content-Type', image.contentType)
    res.setHeader('Cache-Control', 'private, no-store')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    if (image.etag) {
      res.setHeader('ETag', image.etag)
    }
    if (typeof image.size === 'number') {
      res.setHeader('Content-Length', String(image.size))
    }

    await pipeline(image.stream, res)
  } catch (err) {
    next(err)
  }
}

// ---------------------------------------------------------------------------
// POST /attendance/:id/adjustment-note
// ---------------------------------------------------------------------------

/**
 * Add or update the admin note on an attendance record.
 * Only the `notes` field is changed — timestamps and status are immutable.
 * Permission: view_live_attendance (any HR with access can add a note)
 *
 * Requirements: 6.6, 6.7, 14.1
 */
export async function addAdjustmentNoteHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parseResult = adjustmentNoteSchema.safeParse(req.body)
    if (!parseResult.success) {
      return next(new ValidationError('Data tidak valid', parseResult.error.flatten()))
    }

    const workspaceId = req.workspaceId!
    const actorUserId = req.user!.userId
    const id = req.params['id'] as string

    const log = await addAdjustmentNote({
      workspaceId,
      attendanceId: id,
      input: parseResult.data,
      actorUserId,
      scopeFilter: req.scopeFilter ?? null,
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
      requestId: (req as Request & { requestId?: string }).requestId ?? null,
    })

    sendSuccess(res, log, 'Catatan berhasil disimpan')
  } catch (err) {
    next(err)
  }
}
