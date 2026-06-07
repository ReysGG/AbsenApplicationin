/**
 * departments.controller.ts — request/response handlers for department endpoints.
 *
 * GET  /api/v1/departments          — list departments
 * POST /api/v1/departments          — create department
 * GET  /api/v1/departments/:id      — get department detail + employees
 * PATCH /api/v1/departments/:id     — update/deactivate department
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */

import type { Request, Response, NextFunction } from 'express'
import { sendSuccess } from '../../lib/response'
import { ValidationError } from '../../lib/errors'
import {
  createDeptSchema,
  updateDeptSchema,
  listDeptQuerySchema,
} from './departments.schema'
import {
  listDepartments,
  createDepartment,
  getDepartmentById,
  updateDepartment,
} from './departments.service'

/**
 * GET /api/v1/departments
 * List departments with optional status filter.
 * Permission: view_employees
 *
 * Requirements: 8.1
 */
export async function listDepartmentsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parseResult = listDeptQuerySchema.safeParse(req.query)
    if (!parseResult.success) {
      return next(new ValidationError('Query tidak valid', parseResult.error.flatten()))
    }

    const workspaceId = req.workspaceId!
    const departments = await listDepartments(workspaceId, parseResult.data.status)
    sendSuccess(res, departments)
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/v1/departments
 * Create a new department.
 * Permission: manage_employees
 *
 * Requirements: 8.1, 8.5, 8.6
 */
export async function createDepartmentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parseResult = createDeptSchema.safeParse(req.body)
    if (!parseResult.success) {
      return next(new ValidationError('Data tidak valid', parseResult.error.flatten()))
    }

    const workspaceId = req.workspaceId!
    const actorUserId = req.user!.userId

    const dept = await createDepartment({
      workspaceId,
      input: parseResult.data,
      actorUserId,
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
      requestId: (req as Request & { requestId?: string }).requestId ?? null,
    })

    sendSuccess(res, dept, 'Departemen berhasil dibuat', 201)
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/v1/departments/:id
 * Department detail with list of active employees.
 * Permission: view_employees
 *
 * Requirements: 8.2
 */
export async function getDepartmentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const workspaceId = req.workspaceId!
    const id = req.params['id'] as string

    const dept = await getDepartmentById(workspaceId, id)
    sendSuccess(res, dept)
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /api/v1/departments/:id
 * Update department name and/or status (including deactivation).
 * Permission: manage_employees
 *
 * Requirements: 8.4, 8.6
 */
export async function updateDepartmentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parseResult = updateDeptSchema.safeParse(req.body)
    if (!parseResult.success) {
      return next(new ValidationError('Data tidak valid', parseResult.error.flatten()))
    }

    const workspaceId = req.workspaceId!
    const actorUserId = req.user!.userId
    const id = req.params['id'] as string

    const dept = await updateDepartment({
      workspaceId,
      departmentId: id,
      input: parseResult.data,
      actorUserId,
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
      requestId: (req as Request & { requestId?: string }).requestId ?? null,
    })

    sendSuccess(res, dept, 'Departemen berhasil diperbarui')
  } catch (err) {
    next(err)
  }
}
