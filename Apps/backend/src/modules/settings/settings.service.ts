/**
 * settings.service.ts — business logic for settings endpoints.
 *
 * Endpoints covered:
 *   GET  /settings/workspace       — workspace settings
 *   PATCH /settings/workspace      — update workspace settings
 *   GET  /settings/roles           — list role assignments
 *   POST /settings/roles           — assign a role (Stakeholder only)
 *   DELETE /settings/roles/:id     — remove a role (Stakeholder only, prevent last Stakeholder)
 *   GET  /settings/holidays        — list holidays
 *   POST /settings/holidays        — create holiday
 *   PATCH /settings/holidays/:id   — update holiday
 *   DELETE /settings/holidays/:id  — delete holiday
 *
 * Requirements: 3.8, 3.9, 3.12, 13.1–13.12
 */

import { prisma } from '../../config/prisma'
import { writeAudit } from '../../lib/audit'
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../lib/errors'
import { isStakeholder } from '../../lib/permissions'
import type {
  UpdateWorkspaceInput,
  AssignRoleInput,
  CreateHolidayInput,
  UpdateHolidayInput,
} from './settings.schema'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WorkspaceSettingsData {
  id: string
  name: string
  timezone: string
  defaultGeofenceRadius: number
  defaultGracePeriod: number
  absenceCutoffMinutes: number
  wfhEnabled: boolean
  hybridEnabled: boolean
  latePolicy: unknown
  missingCheckoutPolicy: unknown
  exportPermissions: unknown
  status: string
  createdAt: string
  updatedAt: string
}

export interface RoleAssignmentData {
  id: string
  workspaceId: string
  userId: string
  role: string
  scopeType: string
  scopeId: string | null
  permissions: string[]
  user: {
    id: string
    email: string
    fullName: string
  }
  createdAt: string
  updatedAt: string
}

export interface HolidayData {
  id: string
  workspaceId: string
  date: string
  name: string
  recurringYearly: boolean
  status: string
  createdAt: string
  updatedAt: string
}

// ---------------------------------------------------------------------------
// Workspace Settings
// ---------------------------------------------------------------------------

/**
 * GET /settings/workspace
 * Return workspace settings fields.
 *
 * Requirements: 13.1, 13.2
 */
export async function getWorkspaceSettings(workspaceId: string): Promise<WorkspaceSettingsData> {
  const workspace = await (prisma as any).workspace.findUnique({
    where: { id: workspaceId },
    select: {
      id: true,
      name: true,
      timezone: true,
      defaultGeofenceRadius: true,
      defaultGracePeriod: true,
      absenceCutoffMinutes: true,
      wfhEnabled: true,
      hybridEnabled: true,
      latePolicy: true,
      missingCheckoutPolicy: true,
      exportPermissions: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!workspace) {
    throw new NotFoundError('Workspace')
  }

  return {
    id: workspace.id,
    name: workspace.name,
    timezone: workspace.timezone,
    defaultGeofenceRadius: workspace.defaultGeofenceRadius,
    defaultGracePeriod: workspace.defaultGracePeriod,
    absenceCutoffMinutes: workspace.absenceCutoffMinutes,
    wfhEnabled: workspace.wfhEnabled,
    hybridEnabled: workspace.hybridEnabled,
    latePolicy: workspace.latePolicy,
    missingCheckoutPolicy: workspace.missingCheckoutPolicy,
    exportPermissions: workspace.exportPermissions,
    status: workspace.status,
    createdAt: workspace.createdAt.toISOString(),
    updatedAt: workspace.updatedAt.toISOString(),
  }
}

/**
 * PATCH /settings/workspace
 * Update workspace settings; only changed fields are recorded in the audit log.
 * Stakeholder or user with manage_roles permission required.
 *
 * Requirements: 13.1–13.9, 13.11, 14.1
 */
export async function updateWorkspaceSettings(params: {
  workspaceId: string
  input: UpdateWorkspaceInput
  actorUserId: string
  actorRoles: string[]
  actorPermissions: string[]
  ipAddress?: string | null
  userAgent?: string | null
  requestId?: string | null
}): Promise<WorkspaceSettingsData> {
  const {
    workspaceId,
    input,
    actorUserId,
    actorRoles,
    actorPermissions,
    ipAddress,
    userAgent,
    requestId,
  } = params

  // Permission check: Stakeholder or has manage_roles
  if (!isStakeholder(actorRoles) && !actorPermissions.includes('manage_roles')) {
    throw new ForbiddenError('Hanya Stakeholder atau pengguna dengan manage_roles yang dapat mengubah pengaturan workspace')
  }

  const existing = await (prisma as any).workspace.findUnique({
    where: { id: workspaceId },
  })

  if (!existing) {
    throw new NotFoundError('Workspace')
  }

  // Build update data (only provided fields)
  const updateData: Record<string, unknown> = {}
  const oldValue: Record<string, unknown> = {}
  const newValue: Record<string, unknown> = {}

  const fields: (keyof UpdateWorkspaceInput)[] = [
    'name',
    'timezone',
    'defaultGeofenceRadius',
    'defaultGracePeriod',
    'absenceCutoffMinutes',
    'wfhEnabled',
    'hybridEnabled',
    'latePolicy',
    'missingCheckoutPolicy',
    'exportPermissions',
  ]

  for (const field of fields) {
    if (input[field] !== undefined) {
      // Map camelCase to prisma field name (they match for the current schema)
      updateData[field] = input[field]
      if (input[field] !== existing[field]) {
        oldValue[field] = existing[field]
        newValue[field] = input[field]
      }
    }
  }

  const updated = await (prisma as any).workspace.update({
    where: { id: workspaceId },
    data: updateData,
    select: {
      id: true,
      name: true,
      timezone: true,
      defaultGeofenceRadius: true,
      defaultGracePeriod: true,
      absenceCutoffMinutes: true,
      wfhEnabled: true,
      hybridEnabled: true,
      latePolicy: true,
      missingCheckoutPolicy: true,
      exportPermissions: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  // Audit (R14.1) — only changed fields, no sensitive data (R14.3)
  await writeAudit({
    workspaceId,
    actorUserId,
    action: 'update_workspace_setting',
    entityType: 'Workspace',
    entityId: workspaceId,
    oldValue: Object.keys(oldValue).length > 0 ? oldValue : undefined,
    newValue: Object.keys(newValue).length > 0 ? newValue : undefined,
    ipAddress,
    userAgent,
    requestId,
  })

  return {
    id: updated.id,
    name: updated.name,
    timezone: updated.timezone,
    defaultGeofenceRadius: updated.defaultGeofenceRadius,
    defaultGracePeriod: updated.defaultGracePeriod,
    absenceCutoffMinutes: updated.absenceCutoffMinutes,
    wfhEnabled: updated.wfhEnabled,
    hybridEnabled: updated.hybridEnabled,
    latePolicy: updated.latePolicy,
    missingCheckoutPolicy: updated.missingCheckoutPolicy,
    exportPermissions: updated.exportPermissions,
    status: updated.status,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Role Management (Stakeholder only — R3.8, R13.10, R13.11)
// ---------------------------------------------------------------------------

/**
 * GET /settings/roles
 * List all RoleAssignment records + their permissions.
 * Requires manage_roles permission.
 *
 * Requirements: 3.8, 13.10
 */
export async function getRoleAssignments(
  workspaceId: string,
  scopeFilter?: { role?: string; scopeType?: string },
): Promise<RoleAssignmentData[]> {
  const where: Record<string, unknown> = { workspaceId }
  if (scopeFilter?.role) {
    where['role'] = scopeFilter.role
  }
  if (scopeFilter?.scopeType) {
    where['scopeType'] = scopeFilter.scopeType
  }

  const assignments = await (prisma as any).roleAssignment.findMany({
    where,
    include: {
      user: {
        select: { id: true, email: true, fullName: true },
      },
      permissions: {
        include: {
          permission: { select: { key: true } },
        },
      },
    },
    orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
  })

  return (
    assignments as Array<{
      id: string
      workspaceId: string
      userId: string
      role: string
      scopeType: string
      scopeId: string | null
      createdAt: Date
      updatedAt: Date
      user: { id: string; email: string; fullName: string }
      permissions: Array<{ permission: { key: string } }>
    }>
  ).map((a) => ({
    id: a.id,
    workspaceId: a.workspaceId,
    userId: a.userId,
    role: a.role,
    scopeType: a.scopeType,
    scopeId: a.scopeId,
    permissions: a.permissions.map((p) => p.permission.key),
    user: a.user,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }))
}

/**
 * POST /settings/roles
 * Assign a role + scope + permissions. Stakeholder only (R3.8, R3.12).
 * Audit: update_role_permission
 *
 * Requirements: 3.8, 3.9, 13.10, 13.11
 */
async function assertTargetUserInWorkspace(
  workspaceId: string,
  userId: string,
): Promise<void> {
  const employee = await (prisma as any).employee.findFirst({
    where: { workspaceId, userId },
    select: { id: true },
  })

  if (employee) return

  const existingMembership = await (prisma as any).roleAssignment.findFirst({
    where: { workspaceId, userId },
    select: { id: true },
  })

  if (!existingMembership) {
    throw new ForbiddenError('User tidak terdaftar di workspace ini')
  }
}

async function validateRoleScope(
  workspaceId: string,
  input: AssignRoleInput,
): Promise<{ scopeType: AssignRoleInput['scopeType']; scopeId: string | null }> {
  const scopeId = input.scopeId?.trim() || null

  if (input.scopeType === 'workspace') {
    if (scopeId !== null) {
      throw new ValidationError('Scope workspace tidak boleh memiliki scopeId')
    }
    return { scopeType: 'workspace', scopeId: null }
  }

  if (input.scopeType === 'department') {
    if (!scopeId) {
      throw new ValidationError('scopeId department wajib diisi')
    }
    const department = await (prisma as any).department.findFirst({
      where: { id: scopeId, workspaceId },
      select: { id: true },
    })
    if (!department) {
      throw new NotFoundError('Department')
    }
    return { scopeType: 'department', scopeId }
  }

  if (input.scopeType === 'location') {
    if (!scopeId) {
      throw new ValidationError('scopeId lokasi wajib diisi')
    }
    const location = await (prisma as any).location.findFirst({
      where: { id: scopeId, workspaceId },
      select: { id: true },
    })
    if (!location) {
      throw new NotFoundError('Lokasi')
    }
    return { scopeType: 'location', scopeId }
  }

  throw new ValidationError('Scope role tidak valid')
}

async function resolvePermissionIds(
  permissions: string[] | undefined,
): Promise<{ ids: string[]; keys: string[] }> {
  const requestedKeys = [...new Set((permissions ?? []).map((key) => key.trim()).filter(Boolean))]
  if (requestedKeys.length === 0) {
    return { ids: [], keys: [] }
  }

  const perms = await (prisma as any).permission.findMany({
    where: { key: { in: requestedKeys } },
    select: { id: true, key: true },
  })
  const rows = perms as Array<{ id: string; key: string }>
  const foundKeys = new Set(rows.map((p) => p.key))
  const missingKeys = requestedKeys.filter((key) => !foundKeys.has(key))

  if (missingKeys.length > 0) {
    throw new ValidationError('Permission tidak dikenal', { permissions: missingKeys })
  }

  return { ids: rows.map((p) => p.id), keys: requestedKeys }
}

export async function assignRole(params: {
  workspaceId: string
  input: AssignRoleInput
  actorUserId: string
  actorRoles: string[]
  ipAddress?: string | null
  userAgent?: string | null
  requestId?: string | null
}): Promise<RoleAssignmentData> {
  const { workspaceId, input, actorUserId, actorRoles, ipAddress, userAgent, requestId } = params

  // Stakeholder-only (R3.8, R13.10)
  if (!isStakeholder(actorRoles)) {
    throw new ForbiddenError('Hanya Stakeholder yang dapat mengelola peran dan izin')
  }

  // Verify the target user exists
  const targetUser = await (prisma as any).user.findUnique({
    where: { id: input.userId },
    select: { id: true, email: true, fullName: true },
  })

  if (!targetUser) {
    throw new NotFoundError('User')
  }

  await assertTargetUserInWorkspace(workspaceId, input.userId)
  const normalizedScope = await validateRoleScope(workspaceId, input)

  // Check if this exact role assignment already exists
  const existingAssignment = await (prisma as any).roleAssignment.findFirst({
    where: {
      workspaceId,
      userId: input.userId,
      role: input.role,
      scopeType: normalizedScope.scopeType,
      scopeId: normalizedScope.scopeId,
    },
  })

  if (existingAssignment) {
    throw new ConflictError('Penugasan peran dengan kombinasi yang sama sudah ada')
  }

  const resolvedPermissions = await resolvePermissionIds(input.permissions)

  // Create RoleAssignment + RoleAssignmentPermission records
  const assignment = await (prisma as any).roleAssignment.create({
    data: {
      workspaceId,
      userId: input.userId,
      role: input.role,
      scopeType: normalizedScope.scopeType,
      scopeId: normalizedScope.scopeId,
      permissions: {
        create: resolvedPermissions.ids.map((permId) => ({
          permissionId: permId,
        })),
      },
    },
    include: {
      user: { select: { id: true, email: true, fullName: true } },
      permissions: {
        include: { permission: { select: { key: true } } },
      },
    },
  })

  // Audit (R14.1)
  await writeAudit({
    workspaceId,
    actorUserId,
    action: 'update_role_permission',
    entityType: 'RoleAssignment',
    entityId: assignment.id,
    newValue: {
      userId: input.userId,
      role: input.role,
      scopeType: normalizedScope.scopeType,
      scopeId: normalizedScope.scopeId,
      permissions: resolvedPermissions.keys,
    },
    ipAddress,
    userAgent,
    requestId,
  })

  return {
    id: assignment.id,
    workspaceId: assignment.workspaceId,
    userId: assignment.userId,
    role: assignment.role,
    scopeType: assignment.scopeType,
    scopeId: assignment.scopeId,
    permissions: (
      assignment.permissions as Array<{ permission: { key: string } }>
    ).map((p) => p.permission.key),
    user: assignment.user,
    createdAt: assignment.createdAt.toISOString(),
    updatedAt: assignment.updatedAt.toISOString(),
  }
}

/**
 * DELETE /settings/roles/:id
 * Remove a role assignment. Stakeholder only.
 * Prevents deleting the last Stakeholder (R3.12).
 * Audit: update_role_permission
 *
 * Requirements: 3.12, 13.11
 */
export async function removeRole(params: {
  workspaceId: string
  roleAssignmentId: string
  actorUserId: string
  actorRoles: string[]
  ipAddress?: string | null
  userAgent?: string | null
  requestId?: string | null
}): Promise<void> {
  const { workspaceId, roleAssignmentId, actorUserId, actorRoles, ipAddress, userAgent, requestId } =
    params

  // Stakeholder-only (R3.8)
  if (!isStakeholder(actorRoles)) {
    throw new ForbiddenError('Hanya Stakeholder yang dapat menghapus penugasan peran')
  }

  const assignment = await (prisma as any).roleAssignment.findFirst({
    where: { id: roleAssignmentId, workspaceId },
  })

  if (!assignment) {
    throw new NotFoundError('Penugasan peran')
  }

  // Prevent deleting the last Stakeholder (R3.12)
  if (assignment.role === 'stakeholder') {
    const stakeholderCount = await (prisma as any).roleAssignment.count({
      where: { workspaceId, role: 'stakeholder' },
    })

    if (stakeholderCount <= 1) {
      throw new ConflictError(
        'Tidak dapat menghapus Stakeholder terakhir di workspace ini. Tambahkan Stakeholder lain terlebih dahulu.',
      )
    }
  }

  // Delete the role assignment (cascades to RoleAssignmentPermission)
  await (prisma as any).roleAssignment.delete({
    where: { id: roleAssignmentId },
  })

  // Audit (R14.1)
  await writeAudit({
    workspaceId,
    actorUserId,
    action: 'update_role_permission',
    entityType: 'RoleAssignment',
    entityId: roleAssignmentId,
    oldValue: {
      userId: assignment.userId,
      role: assignment.role,
      scopeType: assignment.scopeType,
      scopeId: assignment.scopeId ?? null,
    },
    newValue: null,
    ipAddress,
    userAgent,
    requestId,
  })
}

// ---------------------------------------------------------------------------
// Holiday Calendar (R13.12)
// ---------------------------------------------------------------------------

/**
 * GET /settings/holidays
 * List holidays for the workspace, optionally filtered by year and status.
 *
 * Requirements: 13.12
 */
export async function listHolidays(
  workspaceId: string,
  year?: number,
  status: 'Active' | 'Inactive' | 'all' = 'Active',
): Promise<HolidayData[]> {
  const where: Record<string, unknown> = { workspaceId }

  if (status !== 'all') {
    where['status'] = status
  }

  if (year !== undefined) {
    const startDate = new Date(`${year}-01-01T00:00:00.000Z`)
    const endDate = new Date(`${year + 1}-01-01T00:00:00.000Z`)
    where['date'] = { gte: startDate, lt: endDate }
  }

  const holidays = await (prisma as any).holidayCalendar.findMany({
    where,
    orderBy: { date: 'asc' },
  })

  return (
    holidays as Array<{
      id: string
      workspaceId: string
      date: Date
      name: string
      recurringYearly: boolean
      status: string
      createdAt: Date
      updatedAt: Date
    }>
  ).map((h) => ({
    id: h.id,
    workspaceId: h.workspaceId,
    date: h.date.toISOString().slice(0, 10),
    name: h.name,
    recurringYearly: h.recurringYearly,
    status: h.status,
    createdAt: h.createdAt.toISOString(),
    updatedAt: h.updatedAt.toISOString(),
  }))
}

/**
 * POST /settings/holidays
 * Create a holiday in the workspace calendar.
 *
 * Requirements: 13.12
 */
export async function createHoliday(params: {
  workspaceId: string
  input: CreateHolidayInput
  actorUserId: string
  ipAddress?: string | null
  userAgent?: string | null
  requestId?: string | null
}): Promise<HolidayData> {
  const { workspaceId, input, actorUserId, ipAddress, userAgent, requestId } = params

  // Check for duplicate on the same date with same name (best-effort uniqueness)
  const existing = await (prisma as any).holidayCalendar.findFirst({
    where: {
      workspaceId,
      date: new Date(`${input.date}T00:00:00.000Z`),
      name: { equals: input.name, mode: 'insensitive' },
    },
  })

  if (existing) {
    throw new ConflictError(`Hari libur "${input.name}" pada tanggal ${input.date} sudah ada`)
  }

  const holiday = await (prisma as any).holidayCalendar.create({
    data: {
      workspaceId,
      date: new Date(`${input.date}T00:00:00.000Z`),
      name: input.name,
      recurringYearly: input.recurringYearly ?? false,
      status: input.status ?? 'Active',
    },
  })

  await writeAudit({
    workspaceId,
    actorUserId,
    action: 'create_holiday',
    entityType: 'HolidayCalendar',
    entityId: holiday.id,
    newValue: { date: input.date, name: input.name, recurringYearly: input.recurringYearly },
    ipAddress,
    userAgent,
    requestId,
  })

  return {
    id: holiday.id,
    workspaceId: holiday.workspaceId,
    date: holiday.date.toISOString().slice(0, 10),
    name: holiday.name,
    recurringYearly: holiday.recurringYearly,
    status: holiday.status,
    createdAt: holiday.createdAt.toISOString(),
    updatedAt: holiday.updatedAt.toISOString(),
  }
}

/**
 * PATCH /settings/holidays/:id
 * Update an existing holiday.
 *
 * Requirements: 13.12
 */
export async function updateHoliday(params: {
  workspaceId: string
  holidayId: string
  input: UpdateHolidayInput
  actorUserId: string
  ipAddress?: string | null
  userAgent?: string | null
  requestId?: string | null
}): Promise<HolidayData> {
  const { workspaceId, holidayId, input, actorUserId, ipAddress, userAgent, requestId } = params

  const existing = await (prisma as any).holidayCalendar.findFirst({
    where: { id: holidayId, workspaceId },
  })

  if (!existing) {
    throw new NotFoundError('Hari libur')
  }

  const updateData: Record<string, unknown> = {}
  const oldValue: Record<string, unknown> = {}
  const newValue: Record<string, unknown> = {}

  if (input.date !== undefined) {
    const newDate = new Date(`${input.date}T00:00:00.000Z`)
    updateData['date'] = newDate
    if (input.date !== existing.date.toISOString().slice(0, 10)) {
      oldValue['date'] = existing.date.toISOString().slice(0, 10)
      newValue['date'] = input.date
    }
  }

  if (input.name !== undefined) {
    updateData['name'] = input.name
    if (input.name !== existing.name) {
      oldValue['name'] = existing.name
      newValue['name'] = input.name
    }
  }

  if (input.recurringYearly !== undefined) {
    updateData['recurringYearly'] = input.recurringYearly
    if (input.recurringYearly !== existing.recurringYearly) {
      oldValue['recurringYearly'] = existing.recurringYearly
      newValue['recurringYearly'] = input.recurringYearly
    }
  }

  if (input.status !== undefined) {
    updateData['status'] = input.status
    if (input.status !== existing.status) {
      oldValue['status'] = existing.status
      newValue['status'] = input.status
    }
  }

  const updated = await (prisma as any).holidayCalendar.update({
    where: { id: holidayId },
    data: updateData,
  })

  await writeAudit({
    workspaceId,
    actorUserId,
    action: 'update_holiday',
    entityType: 'HolidayCalendar',
    entityId: holidayId,
    oldValue: Object.keys(oldValue).length > 0 ? oldValue : undefined,
    newValue: Object.keys(newValue).length > 0 ? newValue : undefined,
    ipAddress,
    userAgent,
    requestId,
  })

  return {
    id: updated.id,
    workspaceId: updated.workspaceId,
    date: updated.date.toISOString().slice(0, 10),
    name: updated.name,
    recurringYearly: updated.recurringYearly,
    status: updated.status,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  }
}

/**
 * DELETE /settings/holidays/:id
 * Delete a holiday (holidays are assignments, can be deleted — R13.12).
 *
 * Requirements: 13.12
 */
export async function deleteHoliday(params: {
  workspaceId: string
  holidayId: string
  actorUserId: string
  ipAddress?: string | null
  userAgent?: string | null
  requestId?: string | null
}): Promise<void> {
  const { workspaceId, holidayId, actorUserId, ipAddress, userAgent, requestId } = params

  const existing = await (prisma as any).holidayCalendar.findFirst({
    where: { id: holidayId, workspaceId },
  })

  if (!existing) {
    throw new NotFoundError('Hari libur')
  }

  await (prisma as any).holidayCalendar.delete({
    where: { id: holidayId },
  })

  await writeAudit({
    workspaceId,
    actorUserId,
    action: 'delete_holiday',
    entityType: 'HolidayCalendar',
    entityId: holidayId,
    oldValue: {
      date: existing.date.toISOString().slice(0, 10),
      name: existing.name,
    },
    ipAddress,
    userAgent,
    requestId,
  })
}
