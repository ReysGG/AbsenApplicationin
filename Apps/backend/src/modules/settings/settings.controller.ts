/**
 * settings.controller.ts — request/response handlers for settings endpoints.
 *
 * GET  /api/v1/settings/workspace        — get workspace settings
 * PATCH /api/v1/settings/workspace       — update workspace settings
 * GET  /api/v1/settings/roles            — list role assignments
 * POST /api/v1/settings/roles            — assign a role
 * DELETE /api/v1/settings/roles/:id      — remove a role assignment
 * GET  /api/v1/settings/holidays         — list holidays
 * POST /api/v1/settings/holidays         — create holiday
 * PATCH /api/v1/settings/holidays/:id    — update holiday
 * DELETE /api/v1/settings/holidays/:id   — delete holiday
 *
 * Requirements: 3.8, 3.9, 3.12, 13.1–13.12
 */

import type { Request, Response, NextFunction } from 'express'
import { sendSuccess } from '../../lib/response'
import { ValidationError } from '../../lib/errors'
import {
  updateWorkspaceSchema,
  assignRoleSchema,
  createHolidaySchema,
  updateHolidaySchema,
  listHolidaysQuerySchema,
} from './settings.schema'
import {
  getWorkspaceSettings,
  updateWorkspaceSettings,
  getRoleAssignments,
  assignRole,
  removeRole,
  listHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
} from './settings.service'

// ---------------------------------------------------------------------------
// Workspace Settings
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/settings/workspace
 * Return workspace configuration.
 *
 * Requirements: 13.1, 13.2
 */
export async function getWorkspaceSettingsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const workspaceId = req.workspaceId!
    const settings = await getWorkspaceSettings(workspaceId)
    sendSuccess(res, settings)
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /api/v1/settings/workspace
 * Update workspace configuration.
 * Requires manage_roles permission or Stakeholder role.
 *
 * Requirements: 13.1–13.9, 13.11
 */
export async function updateWorkspaceSettingsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parseResult = updateWorkspaceSchema.safeParse(req.body)
    if (!parseResult.success) {
      return next(new ValidationError('Data tidak valid', parseResult.error.flatten()))
    }

    const workspaceId = req.workspaceId!
    const actorUserId = req.user!.userId
    const actorRoles = req.user!.roles as string[]
    const actorPermissions = req.user!.permissions

    const settings = await updateWorkspaceSettings({
      workspaceId,
      input: parseResult.data,
      actorUserId,
      actorRoles,
      actorPermissions,
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
      requestId: req.requestId ?? null,
    })

    sendSuccess(res, settings, 'Pengaturan workspace berhasil diperbarui')
  } catch (err) {
    next(err)
  }
}

// ---------------------------------------------------------------------------
// Role Management
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/settings/roles
 * List all role assignments in the workspace.
 * Requires manage_roles permission.
 *
 * Requirements: 3.8, 13.10
 */
export async function getRoleAssignmentsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const workspaceId = req.workspaceId!
    const scopeFilter = {
      role: req.query['role'] as string | undefined,
      scopeType: req.query['scope_type'] as string | undefined,
    }

    const assignments = await getRoleAssignments(workspaceId, scopeFilter)
    sendSuccess(res, assignments)
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/v1/settings/roles
 * Assign a role + scope + permissions.
 * Stakeholder only (checked in service).
 *
 * Requirements: 3.8, 3.9, 13.10, 13.11
 */
export async function assignRoleHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parseResult = assignRoleSchema.safeParse(req.body)
    if (!parseResult.success) {
      return next(new ValidationError('Data tidak valid', parseResult.error.flatten()))
    }

    const workspaceId = req.workspaceId!
    const actorUserId = req.user!.userId
    const actorRoles = req.user!.roles as string[]

    const assignment = await assignRole({
      workspaceId,
      input: parseResult.data,
      actorUserId,
      actorRoles,
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
      requestId: req.requestId ?? null,
    })

    sendSuccess(res, assignment, 'Penugasan peran berhasil dibuat', 201)
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /api/v1/settings/roles/:id
 * Remove a role assignment.
 * Stakeholder only; prevents removing last Stakeholder.
 *
 * Requirements: 3.12, 13.11
 */
export async function removeRoleHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const workspaceId = req.workspaceId!
    const actorUserId = req.user!.userId
    const actorRoles = req.user!.roles as string[]
    const roleAssignmentId = req.params['id'] as string

    await removeRole({
      workspaceId,
      roleAssignmentId,
      actorUserId,
      actorRoles,
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
      requestId: req.requestId ?? null,
    })

    sendSuccess(res, null, 'Penugasan peran berhasil dihapus')
  } catch (err) {
    next(err)
  }
}

// ---------------------------------------------------------------------------
// Holiday Calendar
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/settings/holidays
 * List workspace holidays.
 *
 * Requirements: 13.12
 */
export async function listHolidaysHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parseResult = listHolidaysQuerySchema.safeParse(req.query)
    if (!parseResult.success) {
      return next(new ValidationError('Query tidak valid', parseResult.error.flatten()))
    }

    const workspaceId = req.workspaceId!
    const { year, status } = parseResult.data

    const holidays = await listHolidays(workspaceId, year, status)
    sendSuccess(res, holidays)
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/v1/settings/holidays
 * Create a new holiday.
 *
 * Requirements: 13.12
 */
export async function createHolidayHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parseResult = createHolidaySchema.safeParse(req.body)
    if (!parseResult.success) {
      return next(new ValidationError('Data tidak valid', parseResult.error.flatten()))
    }

    const workspaceId = req.workspaceId!
    const actorUserId = req.user!.userId

    const holiday = await createHoliday({
      workspaceId,
      input: parseResult.data,
      actorUserId,
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
      requestId: req.requestId ?? null,
    })

    sendSuccess(res, holiday, 'Hari libur berhasil ditambahkan', 201)
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /api/v1/settings/holidays/:id
 * Update an existing holiday.
 *
 * Requirements: 13.12
 */
export async function updateHolidayHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parseResult = updateHolidaySchema.safeParse(req.body)
    if (!parseResult.success) {
      return next(new ValidationError('Data tidak valid', parseResult.error.flatten()))
    }

    const workspaceId = req.workspaceId!
    const actorUserId = req.user!.userId
    const holidayId = req.params['id'] as string

    const holiday = await updateHoliday({
      workspaceId,
      holidayId,
      input: parseResult.data,
      actorUserId,
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
      requestId: req.requestId ?? null,
    })

    sendSuccess(res, holiday, 'Hari libur berhasil diperbarui')
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /api/v1/settings/holidays/:id
 * Delete a holiday.
 *
 * Requirements: 13.12
 */
export async function deleteHolidayHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const workspaceId = req.workspaceId!
    const actorUserId = req.user!.userId
    const holidayId = req.params['id'] as string

    await deleteHoliday({
      workspaceId,
      holidayId,
      actorUserId,
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
      requestId: req.requestId ?? null,
    })

    sendSuccess(res, null, 'Hari libur berhasil dihapus')
  } catch (err) {
    next(err)
  }
}
