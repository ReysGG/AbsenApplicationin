/**
 * shifts.service.ts — business logic for shift endpoints.
 *
 * Endpoints covered:
 *   GET  /shifts              — list shifts with status filter (R10.1, R10.2)
 *   POST /shifts              — create shift (R10.2–R10.6, R10.13)
 *   GET  /shifts/:id          — shift detail (R10.2)
 *   PATCH /shifts/:id         — update/deactivate shift (R10.9, R10.10, R10.12, R10.13)
 *   POST /shifts/:id/assign   — assign shift to employees (R10.8, R10.13)
 *   GET  /employees/without-shift — list employees without assigned shift (R10.11)
 *
 * Business rules:
 *   - startTime !== endTime (R10.6) → 400 VALIDATION_ERROR
 *   - Midnight-crossing shift: endTime < startTime in local time (R10.7)
 *   - Default grace=10, checkoutTolerance=60, absenceCutoff=120 (R10.4, R10.5)
 *   - effectiveFrom defaults to today (R10.9)
 *   - No hard delete; lifecycle Active→Inactive (R10.10)
 *   - Changing gracePeriodMinutes requires manage_grace_period (R10.12)
 *   - Audit: create_shift, update_shift, deactivate_shift, assign_shift (R10.13)
 *
 * Requirements: 10.1–10.13
 */

import { prisma } from '../../config/prisma'
import { writeAudit } from '../../lib/audit'
import { ForbiddenError, NotFoundError, ValidationError } from '../../lib/errors'
import type { CreateShiftInput, UpdateShiftInput, AssignShiftInput } from './shifts.schema'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ShiftListItem {
  id: string
  name: string
  startTime: string
  endTime: string
  gracePeriodMinutes: number
  checkoutToleranceMinutes: number
  absenceCutoffMinutes: number
  breakMinutes: number
  workDays: string[]
  effectiveFrom: string
  status: string
  isMidnightCrossing: boolean
  assignedEmployeeCount: number
  createdAt: string
}

export interface ShiftDetail extends ShiftListItem {
  updatedAt: string
}

export interface EmployeeWithoutShift {
  id: string
  employeeCode: string
  fullName: string
  email: string
  position: string | null
  departmentId: string
  departmentName: string
  employmentStatus: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Determine if a shift crosses midnight.
 * A shift crosses midnight when endTime < startTime (local time comparison as HH:MM strings).
 * R10.7
 */
function isMidnightCrossing(startTime: string, endTime: string): boolean {
  return endTime < startTime
}

/**
 * Get today's date as YYYY-MM-DD string.
 */
function todayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * GET /shifts
 * List all shifts in the workspace filtered by status.
 * Includes assigned employee count per shift.
 *
 * Requirements: 10.1, 10.2
 */
export async function listShifts(
  workspaceId: string,
  status: 'Active' | 'Inactive' | 'all',
): Promise<ShiftListItem[]> {
  const where: Record<string, unknown> = { workspaceId }
  if (status !== 'all') {
    where['status'] = status
  }

  const shifts = await (prisma as any).shift.findMany({
    where,
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      startTime: true,
      endTime: true,
      gracePeriodMinutes: true,
      checkoutToleranceMinutes: true,
      absenceCutoffMinutes: true,
      breakMinutes: true,
      workDays: true,
      effectiveFrom: true,
      status: true,
      createdAt: true,
      _count: {
        select: {
          employees: {
            where: { employmentStatus: 'Active' },
          },
        },
      },
    },
  })

  return (
    shifts as Array<{
      id: string
      name: string
      startTime: string
      endTime: string
      gracePeriodMinutes: number
      checkoutToleranceMinutes: number
      absenceCutoffMinutes: number
      breakMinutes: number
      workDays: string[]
      effectiveFrom: Date
      status: string
      createdAt: Date
      _count: { employees: number }
    }>
  ).map((s) => ({
    id: s.id,
    name: s.name,
    startTime: s.startTime,
    endTime: s.endTime,
    gracePeriodMinutes: s.gracePeriodMinutes,
    checkoutToleranceMinutes: s.checkoutToleranceMinutes,
    absenceCutoffMinutes: s.absenceCutoffMinutes,
    breakMinutes: s.breakMinutes,
    workDays: s.workDays,
    effectiveFrom: s.effectiveFrom instanceof Date
      ? s.effectiveFrom.toISOString().slice(0, 10)
      : String(s.effectiveFrom),
    status: s.status,
    isMidnightCrossing: isMidnightCrossing(s.startTime, s.endTime),
    assignedEmployeeCount: s._count.employees,
    createdAt: s.createdAt.toISOString(),
  }))
}

/**
 * POST /shifts
 * Create a new shift.
 *
 * R10.2: capture all shift fields
 * R10.4: grace=10, checkoutTolerance=60 defaults (handled by Zod schema)
 * R10.5: absenceCutoff=120 default (handled by Zod schema)
 * R10.6: startTime !== endTime (enforced by Zod schema + guard)
 * R10.9: effectiveFrom defaults to today
 * R10.12: creating with custom grace requires manage_grace_period
 * R10.13: audit create_shift
 */
export async function createShift(params: {
  workspaceId: string
  input: CreateShiftInput
  actorUserId: string
  hasManageGracePeriod: boolean
  ipAddress?: string | null
  userAgent?: string | null
  requestId?: string | null
}): Promise<ShiftDetail> {
  const { workspaceId, input, actorUserId, hasManageGracePeriod, ipAddress, userAgent, requestId } = params

  // R10.6: startTime !== endTime (also enforced in schema, guard here for safety)
  if (input.startTime === input.endTime) {
    throw new ValidationError('Jam masuk dan jam keluar tidak boleh sama')
  }

  // R10.12: setting custom grace period requires manage_grace_period permission
  // Default grace is 10; if the provided grace is non-default, permission is required
  const isCustomGrace = input.gracePeriodMinutes !== 10
  if (isCustomGrace && !hasManageGracePeriod) {
    throw new ForbiddenError(
      'Permission manage_grace_period diperlukan untuk mengubah grace period',
    )
  }

  const effectiveFrom = input.effectiveFrom ?? todayDateString()

  const shift = await (prisma as any).shift.create({
    data: {
      workspaceId,
      name: input.name,
      startTime: input.startTime,
      endTime: input.endTime,
      breakMinutes: input.breakMinutes,
      gracePeriodMinutes: input.gracePeriodMinutes,
      checkoutToleranceMinutes: input.checkoutToleranceMinutes,
      absenceCutoffMinutes: input.absenceCutoffMinutes,
      workDays: input.workDays,
      effectiveFrom: new Date(effectiveFrom),
      status: 'Active',
    },
    select: {
      id: true,
      name: true,
      startTime: true,
      endTime: true,
      gracePeriodMinutes: true,
      checkoutToleranceMinutes: true,
      absenceCutoffMinutes: true,
      breakMinutes: true,
      workDays: true,
      effectiveFrom: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { employees: { where: { employmentStatus: 'Active' } } },
      },
    },
  })

  // R10.13: audit create_shift
  await writeAudit({
    workspaceId,
    actorUserId,
    action: 'create_shift',
    entityType: 'Shift',
    entityId: shift.id,
    newValue: {
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      gracePeriodMinutes: shift.gracePeriodMinutes,
      workDays: shift.workDays,
      effectiveFrom: effectiveFrom,
    },
    ipAddress,
    userAgent,
    requestId,
  })

  return mapShiftDetail(shift)
}

/**
 * GET /shifts/:id
 * Shift detail.
 *
 * Requirements: 10.2
 */
export async function getShiftById(workspaceId: string, shiftId: string): Promise<ShiftDetail> {
  const shift = await (prisma as any).shift.findFirst({
    where: { id: shiftId, workspaceId },
    select: {
      id: true,
      name: true,
      startTime: true,
      endTime: true,
      gracePeriodMinutes: true,
      checkoutToleranceMinutes: true,
      absenceCutoffMinutes: true,
      breakMinutes: true,
      workDays: true,
      effectiveFrom: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { employees: { where: { employmentStatus: 'Active' } } },
      },
    },
  })

  if (!shift) {
    throw new NotFoundError('Shift')
  }

  return mapShiftDetail(shift)
}

/**
 * PATCH /shifts/:id
 * Update shift fields or deactivate.
 *
 * R10.9: changes apply from effectiveFrom forward; historical attendance not altered
 * R10.10: no hard delete; Active → Inactive lifecycle only
 * R10.12: gracePeriodMinutes change requires manage_grace_period
 * R10.13: audit update_shift or deactivate_shift
 */
export async function updateShift(params: {
  workspaceId: string
  shiftId: string
  input: UpdateShiftInput
  actorUserId: string
  hasManageGracePeriod: boolean
  ipAddress?: string | null
  userAgent?: string | null
  requestId?: string | null
}): Promise<ShiftDetail> {
  const { workspaceId, shiftId, input, actorUserId, hasManageGracePeriod, ipAddress, userAgent, requestId } = params

  const existing = await (prisma as any).shift.findFirst({
    where: { id: shiftId, workspaceId },
  })

  if (!existing) {
    throw new NotFoundError('Shift')
  }

  // R10.12: changing grace period requires manage_grace_period
  if (input.gracePeriodMinutes !== undefined && input.gracePeriodMinutes !== existing.gracePeriodMinutes) {
    if (!hasManageGracePeriod) {
      throw new ForbiddenError(
        'Permission manage_grace_period diperlukan untuk mengubah grace period',
      )
    }
  }

  // R10.6: if both times provided, validate they're different
  const newStart = input.startTime ?? existing.startTime
  const newEnd = input.endTime ?? existing.endTime
  if (newStart === newEnd) {
    throw new ValidationError('Jam masuk dan jam keluar tidak boleh sama')
  }

  // Build update data
  const updateData: Record<string, unknown> = {}
  if (input.name !== undefined) updateData['name'] = input.name
  if (input.startTime !== undefined) updateData['startTime'] = input.startTime
  if (input.endTime !== undefined) updateData['endTime'] = input.endTime
  if (input.breakMinutes !== undefined) updateData['breakMinutes'] = input.breakMinutes
  if (input.gracePeriodMinutes !== undefined) updateData['gracePeriodMinutes'] = input.gracePeriodMinutes
  if (input.checkoutToleranceMinutes !== undefined) updateData['checkoutToleranceMinutes'] = input.checkoutToleranceMinutes
  if (input.absenceCutoffMinutes !== undefined) updateData['absenceCutoffMinutes'] = input.absenceCutoffMinutes
  if (input.workDays !== undefined) updateData['workDays'] = input.workDays
  if (input.effectiveFrom !== undefined) updateData['effectiveFrom'] = new Date(input.effectiveFrom)
  if (input.status !== undefined) updateData['status'] = input.status

  const updated = await (prisma as any).shift.update({
    where: { id: shiftId },
    data: updateData,
    select: {
      id: true,
      name: true,
      startTime: true,
      endTime: true,
      gracePeriodMinutes: true,
      checkoutToleranceMinutes: true,
      absenceCutoffMinutes: true,
      breakMinutes: true,
      workDays: true,
      effectiveFrom: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { employees: { where: { employmentStatus: 'Active' } } },
      },
    },
  })

  // Determine audit action (R10.13)
  const isDeactivating = input.status === 'Inactive' && existing.status !== 'Inactive'
  const auditAction = isDeactivating ? 'deactivate_shift' : 'update_shift'

  // Build old/new values (only changed fields — R14.2)
  const oldValue: Record<string, unknown> = {}
  const newValue: Record<string, unknown> = {}

  const fields: Array<string> = [
    'name', 'startTime', 'endTime', 'breakMinutes',
    'gracePeriodMinutes', 'checkoutToleranceMinutes', 'absenceCutoffMinutes',
    'workDays', 'status',
  ]
  for (const field of fields) {
    const inputVal = (input as Record<string, unknown>)[field]
    const existingVal = (existing as Record<string, unknown>)[field]
    if (inputVal !== undefined && inputVal !== existingVal) {
      oldValue[field] = existingVal
      newValue[field] = inputVal
    }
  }

  await writeAudit({
    workspaceId,
    actorUserId,
    action: auditAction,
    entityType: 'Shift',
    entityId: shiftId,
    oldValue: Object.keys(oldValue).length > 0 ? oldValue : undefined,
    newValue: Object.keys(newValue).length > 0 ? newValue : undefined,
    ipAddress,
    userAgent,
    requestId,
  })

  return mapShiftDetail(updated)
}

/**
 * POST /shifts/:id/assign
 * Assign a shift to multiple employees.
 *
 * R10.8: sets Employee.assignedShiftId for each given employeeId
 * R10.13: audit assign_shift per employee
 */
export async function assignShiftToEmployees(params: {
  workspaceId: string
  shiftId: string
  input: AssignShiftInput
  actorUserId: string
  ipAddress?: string | null
  userAgent?: string | null
  requestId?: string | null
}): Promise<{ assignedCount: number }> {
  const { workspaceId, shiftId, input, actorUserId, ipAddress, userAgent, requestId } = params

  // Verify shift exists and belongs to workspace
  const shift = await (prisma as any).shift.findFirst({
    where: { id: shiftId, workspaceId },
    select: { id: true, name: true, status: true },
  })

  if (!shift) {
    throw new NotFoundError('Shift')
  }

  // Verify all employees exist in this workspace
  const employees = await (prisma as any).employee.findMany({
    where: {
      id: { in: input.employeeIds },
      workspaceId,
      employmentStatus: 'Active',
    },
    select: { id: true, fullName: true, assignedShiftId: true },
  })

  if (employees.length === 0) {
    throw new ValidationError('Tidak ada karyawan aktif yang ditemukan dengan ID yang diberikan')
  }

  // Update each employee's assignedShiftId
  const updateResults = await (prisma as any).employee.updateMany({
    where: {
      id: { in: employees.map((e: { id: string }) => e.id) },
      workspaceId,
    },
    data: { assignedShiftId: shiftId },
  })

  // Audit assign_shift per employee (R10.13)
  for (const emp of employees as Array<{ id: string; fullName: string; assignedShiftId: string | null }>) {
    await writeAudit({
      workspaceId,
      actorUserId,
      action: 'assign_shift',
      entityType: 'Employee',
      entityId: emp.id,
      oldValue: { assignedShiftId: emp.assignedShiftId },
      newValue: { assignedShiftId: shiftId, shiftName: shift.name },
      ipAddress,
      userAgent,
      requestId,
    })
  }

  return { assignedCount: updateResults.count }
}

/**
 * GET /employees/without-shift
 * List active employees with no assigned shift.
 *
 * R10.11
 */
export async function listEmployeesWithoutShift(
  workspaceId: string,
  scopeFilter?: Record<string, unknown>,
): Promise<EmployeeWithoutShift[]> {
  const where: Record<string, unknown> = {
    workspaceId,
    assignedShiftId: null,
    employmentStatus: 'Active',
    ...(scopeFilter ?? {}),
  }

  const employees = await (prisma as any).employee.findMany({
    where,
    orderBy: { fullName: 'asc' },
    select: {
      id: true,
      employeeCode: true,
      fullName: true,
      email: true,
      position: true,
      departmentId: true,
      employmentStatus: true,
      department: {
        select: { name: true },
      },
    },
  })

  return (
    employees as Array<{
      id: string
      employeeCode: string
      fullName: string
      email: string
      position: string | null
      departmentId: string
      employmentStatus: string
      department: { name: string }
    }>
  ).map((emp) => ({
    id: emp.id,
    employeeCode: emp.employeeCode,
    fullName: emp.fullName,
    email: emp.email,
    position: emp.position,
    departmentId: emp.departmentId,
    departmentName: emp.department.name,
    employmentStatus: emp.employmentStatus,
  }))
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

type ShiftRow = {
  id: string
  name: string
  startTime: string
  endTime: string
  gracePeriodMinutes: number
  checkoutToleranceMinutes: number
  absenceCutoffMinutes: number
  breakMinutes: number
  workDays: string[]
  effectiveFrom: Date | string
  status: string
  createdAt: Date
  updatedAt: Date
  _count: { employees: number }
}

function mapShiftDetail(s: ShiftRow): ShiftDetail {
  return {
    id: s.id,
    name: s.name,
    startTime: s.startTime,
    endTime: s.endTime,
    gracePeriodMinutes: s.gracePeriodMinutes,
    checkoutToleranceMinutes: s.checkoutToleranceMinutes,
    absenceCutoffMinutes: s.absenceCutoffMinutes,
    breakMinutes: s.breakMinutes,
    workDays: s.workDays,
    effectiveFrom: s.effectiveFrom instanceof Date
      ? s.effectiveFrom.toISOString().slice(0, 10)
      : String(s.effectiveFrom),
    status: s.status,
    isMidnightCrossing: isMidnightCrossing(s.startTime, s.endTime),
    assignedEmployeeCount: s._count.employees,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }
}
