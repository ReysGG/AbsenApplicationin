/**
 * shifts.controller.ts — request/response handlers for shift endpoints.
 *
 * GET  /api/v1/shifts                     — list shifts
 * POST /api/v1/shifts                     — create shift
 * GET  /api/v1/shifts/:id                 — get shift detail
 * PATCH /api/v1/shifts/:id                — update/deactivate shift
 * POST /api/v1/shifts/:id/assign          — assign shift to employees
 * GET  /api/v1/employees/without-shift    — list employees without shift
 *
 * Requirements: 10.1–10.13
 */

import type { Request, Response, NextFunction } from 'express'
import { sendSuccess } from '../../lib/response'
import { ValidationError } from '../../lib/errors'
import { PERMISSIONS } from '../../lib/permissions'
import { hasPermission } from '../../lib/permissions'
import {
  createShiftSchema,
  updateShiftSchema,
  assignShiftSchema,
  listShiftsQuerySchema,
} from './shifts.schema'
import {
  listShifts,
  createShift,
  getShiftById,
  updateShift,
  assignShiftToEmployees,
  listEmployeesWithoutShift,
} from './shifts.service'

/**
 * GET /api/v1/shifts
 * List shifts with optional status filter.
 * Permission: view_employees
 *
 * Requirements: 10.1, 10.2
 */
export async function listShiftsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parseResult = listShiftsQuerySchema.safeParse(req.query)
    if (!parseResult.success) {
      return next(new ValidationError('Query tidak valid', parseResult.error.flatten()))
    }

    const workspaceId = req.workspaceId!
    const shifts = await listShifts(workspaceId, parseResult.data.status)
    sendSuccess(res, shifts)
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/v1/shifts
 * Create a new shift.
 * Permission: manage_shifts
 * Grace period requires: manage_grace_period (R10.12)
 *
 * Requirements: 10.2–10.6, 10.9, 10.12, 10.13
 */
export async function createShiftHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parseResult = createShiftSchema.safeParse(req.body)
    if (!parseResult.success) {
      return next(new ValidationError('Data tidak valid', parseResult.error.flatten()))
    }

    const workspaceId = req.workspaceId!
    const user = req.user!
    const hasManageGracePeriod = hasPermission(user.roles, user.permissions, PERMISSIONS.MANAGE_GRACE_PERIOD)

    const shift = await createShift({
      workspaceId,
      input: parseResult.data,
      actorUserId: user.userId,
      hasManageGracePeriod,
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
      requestId: (req as Request & { requestId?: string }).requestId ?? null,
    })

    sendSuccess(res, shift, 'Shift berhasil dibuat', 201)
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/v1/shifts/:id
 * Shift detail.
 * Permission: view_employees
 *
 * Requirements: 10.2
 */
export async function getShiftHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const workspaceId = req.workspaceId!
    const id = req.params['id'] as string

    const shift = await getShiftById(workspaceId, id)
    sendSuccess(res, shift)
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /api/v1/shifts/:id
 * Update shift fields or deactivate.
 * Permission: manage_shifts
 * Grace period change requires: manage_grace_period (R10.12)
 *
 * Requirements: 10.9, 10.10, 10.12, 10.13
 */
export async function updateShiftHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parseResult = updateShiftSchema.safeParse(req.body)
    if (!parseResult.success) {
      return next(new ValidationError('Data tidak valid', parseResult.error.flatten()))
    }

    const workspaceId = req.workspaceId!
    const user = req.user!
    const id = req.params['id'] as string
    const hasManageGracePeriod = hasPermission(user.roles, user.permissions, PERMISSIONS.MANAGE_GRACE_PERIOD)

    const shift = await updateShift({
      workspaceId,
      shiftId: id,
      input: parseResult.data,
      actorUserId: user.userId,
      hasManageGracePeriod,
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
      requestId: (req as Request & { requestId?: string }).requestId ?? null,
    })

    sendSuccess(res, shift, 'Shift berhasil diperbarui')
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/v1/shifts/:id/assign
 * Assign shift to multiple employees.
 * Permission: manage_shifts
 *
 * Requirements: 10.8, 10.13
 */
export async function assignShiftHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parseResult = assignShiftSchema.safeParse(req.body)
    if (!parseResult.success) {
      return next(new ValidationError('Data tidak valid', parseResult.error.flatten()))
    }

    const workspaceId = req.workspaceId!
    const user = req.user!
    const id = req.params['id'] as string

    const result = await assignShiftToEmployees({
      workspaceId,
      shiftId: id,
      input: parseResult.data,
      actorUserId: user.userId,
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
      requestId: (req as Request & { requestId?: string }).requestId ?? null,
    })

    sendSuccess(res, result, `Shift berhasil ditetapkan ke ${result.assignedCount} karyawan`)
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/v1/employees/without-shift
 * List active employees with no assigned shift.
 * Permission: view_employees
 *
 * Requirements: 10.11
 */
export async function listEmployeesWithoutShiftHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const workspaceId = req.workspaceId!
    // scopeFilter injected by enforceScope middleware if applicable
    const scopeFilter = (req as Request & { scopeFilter?: Record<string, unknown> }).scopeFilter

    const employees = await listEmployeesWithoutShift(workspaceId, scopeFilter)
    sendSuccess(res, employees)
  } catch (err) {
    next(err)
  }
}
