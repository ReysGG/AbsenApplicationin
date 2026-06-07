/**
 * employees.controller.ts — Request/response handlers for employee endpoints.
 *
 * GET  /api/v1/employees                    — list employees (paginated + filtered)
 * POST /api/v1/employees                    — create employee
 * GET  /api/v1/employees/:id                — employee detail
 * PATCH /api/v1/employees/:id               — update employee fields
 * PATCH /api/v1/employees/:id/status        — lifecycle status change
 * POST /api/v1/employees/:id/resend-invitation — resend activation email
 * POST /api/v1/employees/activate           — public: activate account with token
 *
 * Requirements: 7.1–7.16, 2.1–2.8
 */

import type { Request, Response, NextFunction } from 'express'
import { sendSuccess } from '../../lib/response'
import { ValidationError } from '../../lib/errors'
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  updateEmployeeStatusSchema,
  listEmployeesQuerySchema,
  activateAccountSchema,
} from './employees.schema'
import {
  listEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  updateEmployeeStatus,
  resendInvitation,
  activateAccount,
} from './employees.service'

// ---------------------------------------------------------------------------
// GET /employees
// ---------------------------------------------------------------------------

/**
 * List employees with pagination, filters, and scope.
 * Permission: view_employees
 *
 * Requirements: 7.1, 7.2, 7.10
 */
export async function listEmployeesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parseResult = listEmployeesQuerySchema.safeParse(req.query)
    if (!parseResult.success) {
      return next(new ValidationError('Query tidak valid', parseResult.error.flatten()))
    }

    const workspaceId = req.workspaceId!
    const { status, department_id, search, page, page_size } = parseResult.data

    const result = await listEmployees({
      workspaceId,
      status,
      departmentId: department_id,
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
// POST /employees
// ---------------------------------------------------------------------------

/**
 * Create a new employee.
 * Permission: manage_employees
 *
 * Requirements: 7.3, 7.4, 7.5, 7.6, 2.1, 2.2
 */
export async function createEmployeeHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parseResult = createEmployeeSchema.safeParse(req.body)
    if (!parseResult.success) {
      return next(new ValidationError('Data tidak valid', parseResult.error.flatten()))
    }

    const workspaceId = req.workspaceId!
    const actorUserId = req.user!.userId

    const emp = await createEmployee({
      workspaceId,
      input: parseResult.data,
      actorUserId,
      scopeFilter: req.scopeFilter ?? null,
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
      requestId: (req as Request & { requestId?: string }).requestId ?? null,
    })

    sendSuccess(res, emp, 'Karyawan berhasil dibuat', 201)
  } catch (err) {
    next(err)
  }
}

// ---------------------------------------------------------------------------
// GET /employees/:id
// ---------------------------------------------------------------------------

/**
 * Get employee detail.
 * Permission: view_employees
 *
 * Requirements: 7.12
 */
export async function getEmployeeHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const workspaceId = req.workspaceId!
    const id = req.params['id'] as string

    const emp = await getEmployeeById(workspaceId, id, req.scopeFilter ?? null)
    sendSuccess(res, emp)
  } catch (err) {
    next(err)
  }
}

// ---------------------------------------------------------------------------
// PATCH /employees/:id
// ---------------------------------------------------------------------------

/**
 * Update employee fields.
 * Permission: manage_employees + scope check
 *
 * Requirements: 7.4, 7.5, 7.15, 7.16
 */
export async function updateEmployeeHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parseResult = updateEmployeeSchema.safeParse(req.body)
    if (!parseResult.success) {
      return next(new ValidationError('Data tidak valid', parseResult.error.flatten()))
    }

    const workspaceId = req.workspaceId!
    const actorUserId = req.user!.userId
    const id = req.params['id'] as string

    const emp = await updateEmployee({
      workspaceId,
      employeeId: id,
      input: parseResult.data,
      actorUserId,
      scopeFilter: req.scopeFilter ?? null,
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
      requestId: (req as Request & { requestId?: string }).requestId ?? null,
    })

    sendSuccess(res, emp, 'Karyawan berhasil diperbarui')
  } catch (err) {
    next(err)
  }
}

// ---------------------------------------------------------------------------
// PATCH /employees/:id/status
// ---------------------------------------------------------------------------

/**
 * Change employment status (lifecycle — no hard delete).
 * Permission: manage_employees + scope check
 *
 * Requirements: 7.8–7.11, 7.16
 */
export async function updateEmployeeStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parseResult = updateEmployeeStatusSchema.safeParse(req.body)
    if (!parseResult.success) {
      return next(new ValidationError('Data tidak valid', parseResult.error.flatten()))
    }

    const workspaceId = req.workspaceId!
    const actorUserId = req.user!.userId
    const id = req.params['id'] as string

    const emp = await updateEmployeeStatus({
      workspaceId,
      employeeId: id,
      input: parseResult.data,
      actorUserId,
      scopeFilter: req.scopeFilter ?? null,
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
      requestId: (req as Request & { requestId?: string }).requestId ?? null,
    })

    sendSuccess(res, emp, 'Status karyawan berhasil diperbarui')
  } catch (err) {
    next(err)
  }
}

// ---------------------------------------------------------------------------
// POST /employees/:id/resend-invitation
// ---------------------------------------------------------------------------

/**
 * Resend activation invitation email.
 * Permission: manage_employees
 *
 * Requirements: 2.3, 2.6
 */
export async function resendInvitationHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const workspaceId = req.workspaceId!
    const actorUserId = req.user!.userId
    const id = req.params['id'] as string

    const result = await resendInvitation({
      workspaceId,
      employeeId: id,
      actorUserId,
      scopeFilter: req.scopeFilter ?? null,
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
      requestId: (req as Request & { requestId?: string }).requestId ?? null,
    })

    sendSuccess(res, result, result.message)
  } catch (err) {
    next(err)
  }
}

// ---------------------------------------------------------------------------
// POST /employees/activate (PUBLIC — no auth)
// ---------------------------------------------------------------------------

/**
 * Activate employee account from the invitation link.
 * Public endpoint — does NOT require authentication.
 *
 * Requirements: 2.5, 2.7
 */
export async function activateAccountHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parseResult = activateAccountSchema.safeParse(req.body)
    if (!parseResult.success) {
      return next(new ValidationError('Data tidak valid', parseResult.error.flatten()))
    }

    const result = await activateAccount({
      token: parseResult.data.token,
      password: parseResult.data.password,
    })

    sendSuccess(res, result, result.message)
  } catch (err) {
    next(err)
  }
}
