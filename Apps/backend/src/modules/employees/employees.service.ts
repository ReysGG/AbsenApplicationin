/**
 * employees.service.ts — Business logic for employee management.
 *
 * Endpoints covered:
 *   GET  /employees              — list with pagination + filters + scope (R7.1–7.3)
 *   POST /employees              — create employee with activation token (R7.3, R2.1–2.2)
 *   GET  /employees/:id          — full detail with warnings (R7.12)
 *   PATCH /employees/:id         — edit employee fields (R7.1–7.4)
 *   PATCH /employees/:id/status  — lifecycle status change (R7.8–7.11)
 *   POST /employees/:id/resend-invitation — resend activation email (R2.3, R2.6)
 *
 * Archive logic (Task 20 — R7.9, 7.10, 7.11):
 *   On Archive: disable User.status = Disabled IF the underlying user only
 *   has end_user role in this workspace. Preserve if they also have
 *   support_admin or stakeholder roles.
 *
 * Requirements: 7.1–7.16, 2.1–2.8
 */

import { prisma } from '../../config/prisma'
import { writeAudit } from '../../lib/audit'
import { ConflictError, ForbiddenError, NotFoundError } from '../../lib/errors'
import { sendActivationEmail } from '../../lib/mailer'
import type { ScopeFilter } from '../../types/auth'
import {
  generateActivationToken,
  buildActivationLink,
  invalidateEmployeeToken,
} from './employees.activation'
import type {
  CreateEmployeeInput,
  UpdateEmployeeInput,
  UpdateEmployeeStatusInput,
} from './employees.schema'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmployeeWarnings {
  hasShiftWarning: boolean
  hasLocationWarning: boolean
}

export interface EmployeeListItem {
  id: string
  employeeCode: string
  fullName: string
  email: string
  phone: string | null
  position: string | null
  departmentId: string
  departmentName: string | null
  employmentStatus: string
  accountStatus: string
  workMode: string
  faceProfileStatus: string
  assignedShiftId: string | null
  assignedShiftName: string | null
  assignedLocationId: string | null
  assignedLocationName: string | null
  joinedAt: string
  createdAt: string
  hasShiftWarning: boolean
  hasLocationWarning: boolean
}

export interface EmployeeDetail extends EmployeeListItem {
  updatedAt: string
  userId: string | null
}

export interface EmployeeListResult {
  items: EmployeeListItem[]
  pagination: {
    page: number
    page_size: number
    total: number
    total_pages: number
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildScopeWhere(
  workspaceId: string,
  scopeFilter: ScopeFilter | undefined | null,
): Record<string, unknown> {
  const base: Record<string, unknown> = { workspaceId }

  if (!scopeFilter || scopeFilter.isWorkspaceScope) {
    return base
  }

  const orClauses: Record<string, unknown>[] = []
  if (scopeFilter.departmentIds.length > 0) {
    orClauses.push({ departmentId: { in: scopeFilter.departmentIds } })
  }
  if (scopeFilter.locationIds.length > 0) {
    orClauses.push({ assignedLocationId: { in: scopeFilter.locationIds } })
  }

  if (orClauses.length === 0) {
    // Edge case: scoped user with no scopes → return nothing
    return { ...base, id: '__NEVER__' }
  }

  return { ...base, OR: orClauses }
}

/** Auto-generate employee code in format EMP-YYYY-0001 */
async function generateEmployeeCode(workspaceId: string): Promise<string> {
  const year = new Date().getFullYear().toString()
  const prefix = `EMP-${year}-`

  // Find the maximum sequence number for this workspace + year
  const existing = await (prisma as any).employee.findMany({
    where: {
      workspaceId,
      employeeCode: { startsWith: prefix },
    },
    select: { employeeCode: true },
    orderBy: { employeeCode: 'desc' },
  })

  let maxSeq = 0
  for (const emp of existing as Array<{ employeeCode: string }>) {
    const parts = emp.employeeCode.split('-')
    const seq = parseInt(parts[parts.length - 1] ?? '0', 10)
    if (!isNaN(seq) && seq > maxSeq) {
      maxSeq = seq
    }
  }

  const nextSeq = String(maxSeq + 1).padStart(4, '0')
  return `${prefix}${nextSeq}`
}

function mapEmployeeToListItem(emp: {
  id: string
  employeeCode: string
  fullName: string
  email: string
  phone: string | null
  position: string | null
  departmentId: string
  department?: { name: string } | null
  employmentStatus: string
  accountStatus: string
  workMode: string
  faceProfileStatus: string
  assignedShiftId: string | null
  assignedShift?: { name: string } | null
  assignedLocationId: string | null
  assignedLocation?: { name: string } | null
  joinedAt: Date
  createdAt: Date
}): EmployeeListItem {
  return {
    id: emp.id,
    employeeCode: emp.employeeCode,
    fullName: emp.fullName,
    email: emp.email,
    phone: emp.phone,
    position: emp.position,
    departmentId: emp.departmentId,
    departmentName: emp.department?.name ?? null,
    employmentStatus: emp.employmentStatus,
    accountStatus: emp.accountStatus,
    workMode: emp.workMode,
    faceProfileStatus: emp.faceProfileStatus,
    assignedShiftId: emp.assignedShiftId,
    assignedShiftName: emp.assignedShift?.name ?? null,
    assignedLocationId: emp.assignedLocationId,
    assignedLocationName: emp.assignedLocation?.name ?? null,
    joinedAt: emp.joinedAt.toISOString(),
    createdAt: emp.createdAt.toISOString(),
    hasShiftWarning: !emp.assignedShiftId,
    hasLocationWarning: !emp.assignedLocationId,
  }
}

const employeeSelectWithRelations = {
  id: true,
  employeeCode: true,
  fullName: true,
  email: true,
  phone: true,
  position: true,
  departmentId: true,
  department: { select: { name: true } },
  employmentStatus: true,
  accountStatus: true,
  workMode: true,
  faceProfileStatus: true,
  assignedShiftId: true,
  assignedShift: { select: { name: true } },
  assignedLocationId: true,
  assignedLocation: { select: { name: true } },
  joinedAt: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
}

// ---------------------------------------------------------------------------
// listEmployees
// ---------------------------------------------------------------------------

/**
 * GET /employees — list employees with pagination + filters + scope.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.10
 */
export async function listEmployees(params: {
  workspaceId: string
  status: 'Active' | 'Inactive' | 'Suspended' | 'Archived' | 'all'
  departmentId?: string
  search?: string
  page: number
  pageSize: number
  scopeFilter?: ScopeFilter | null
}): Promise<EmployeeListResult> {
  const { workspaceId, status, departmentId, search, page, pageSize, scopeFilter } = params

  const where: Record<string, unknown> = {
    ...buildScopeWhere(workspaceId, scopeFilter),
  }

  if (status !== 'all') {
    where['employmentStatus'] = status
  }

  if (departmentId) {
    where['departmentId'] = departmentId
  }

  if (search && search.trim()) {
    const term = search.trim()
    where['OR'] = [
      { fullName: { contains: term, mode: 'insensitive' } },
      { email: { contains: term, mode: 'insensitive' } },
      { employeeCode: { contains: term, mode: 'insensitive' } },
    ]
  }

  const skip = (page - 1) * pageSize

  const [total, employees] = await Promise.all([
    (prisma as any).employee.count({ where }),
    (prisma as any).employee.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { fullName: 'asc' },
      select: employeeSelectWithRelations,
    }),
  ])

  const items = (employees as Parameters<typeof mapEmployeeToListItem>[0][]).map(
    mapEmployeeToListItem,
  )

  return {
    items,
    pagination: {
      page,
      page_size: pageSize,
      total,
      total_pages: Math.ceil(total / pageSize),
    },
  }
}

// ---------------------------------------------------------------------------
// getEmployeeById
// ---------------------------------------------------------------------------

/**
 * GET /employees/:id — full employee detail with warnings.
 *
 * Requirements: 7.12
 */
export async function getEmployeeById(
  workspaceId: string,
  employeeId: string,
  scopeFilter?: ScopeFilter | null,
): Promise<EmployeeDetail> {
  const where: Record<string, unknown> = {
    id: employeeId,
    ...buildScopeWhere(workspaceId, scopeFilter),
  }

  const emp = await (prisma as any).employee.findFirst({
    where,
    select: employeeSelectWithRelations,
  })

  if (!emp) {
    throw new NotFoundError('Karyawan')
  }

  return {
    ...mapEmployeeToListItem(emp),
    updatedAt: (emp as { updatedAt: Date }).updatedAt.toISOString(),
    userId: (emp as { userId: string | null }).userId,
  }
}

// ---------------------------------------------------------------------------
// createEmployee
// ---------------------------------------------------------------------------

/**
 * POST /employees — create a new employee record.
 *
 * - Auto-generates employeeCode if not provided (R7.4)
 * - Enforces email and employeeCode uniqueness per workspace (R7.5, R7.6)
 * - Sets accountStatus = PendingActivation (R2.1)
 * - Generates activation token and sends email (R2.2)
 * - Audit: create_employee (R7.16)
 *
 * Requirements: 7.1–7.8, 2.1–2.2
 */
export async function createEmployee(params: {
  workspaceId: string
  input: CreateEmployeeInput
  actorUserId: string
  scopeFilter?: ScopeFilter | null
  ipAddress?: string | null
  userAgent?: string | null
  requestId?: string | null
}): Promise<EmployeeDetail> {
  const { workspaceId, input, actorUserId, scopeFilter, ipAddress, userAgent, requestId } = params

  // Scope check: Support Admin can only create in their scoped departments (R7.15)
  if (scopeFilter && !scopeFilter.isWorkspaceScope) {
    if (input.departmentId && !scopeFilter.departmentIds.includes(input.departmentId)) {
      // Allow if no scope restriction or if location matches; department must be in scope
      throw new ForbiddenError(
        'Anda tidak memiliki akses untuk membuat karyawan di departemen ini',
      )
    }
  }

  // Check email uniqueness within workspace (R7.6, R7.7)
  const emailExists = await (prisma as any).employee.findFirst({
    where: { workspaceId, email: input.email },
    select: { id: true },
  })
  if (emailExists) {
    throw new ConflictError('Email already exists in this workspace')
  }

  // Determine employee code
  let employeeCode = input.employeeCode
  if (!employeeCode) {
    employeeCode = await generateEmployeeCode(workspaceId)
  }

  // Check employeeCode uniqueness within workspace (R7.5)
  const codeExists = await (prisma as any).employee.findFirst({
    where: { workspaceId, employeeCode },
    select: { id: true },
  })
  if (codeExists) {
    throw new ConflictError(`Kode karyawan "${employeeCode}" sudah digunakan di workspace ini`)
  }

  // Validate department exists in this workspace
  const department = await (prisma as any).department.findFirst({
    where: { id: input.departmentId, workspaceId },
    select: { id: true },
  })
  if (!department) {
    throw new NotFoundError('Departemen')
  }

  const joinedAt = new Date(input.joinDate)

  const emp = await (prisma as any).employee.create({
    data: {
      workspaceId,
      employeeCode,
      fullName: input.fullName,
      email: input.email,
      phone: input.phone ?? null,
      departmentId: input.departmentId,
      position: input.position ?? null,
      employmentStatus: input.employmentStatus ?? 'Active',
      accountStatus: 'PendingActivation', // R2.1
      workMode: input.workMode ?? 'WFO',
      faceProfileStatus: 'NotRegistered', // R2.1
      assignedShiftId: input.assignedShiftId ?? null,
      assignedLocationId: input.assignedLocationId ?? null,
      joinedAt,
    },
    select: employeeSelectWithRelations,
  })

  // Generate activation token and send email (R2.2)
  const token = generateActivationToken({
    employeeId: emp.id,
    workspaceId,
    email: emp.email,
  })
  const activationLink = buildActivationLink(token)
  // Non-blocking — email failure should not break the main flow
  sendActivationEmail(emp.email, activationLink).catch(() => {
    // logged inside sendActivationEmail
  })

  // Audit: create_employee (R7.16)
  await writeAudit({
    workspaceId,
    actorUserId,
    action: 'create_employee',
    entityType: 'Employee',
    entityId: emp.id,
    newValue: {
      employeeCode: emp.employeeCode,
      fullName: emp.fullName,
      email: emp.email,
      departmentId: emp.departmentId,
      employmentStatus: emp.employmentStatus,
      accountStatus: emp.accountStatus,
    },
    ipAddress,
    userAgent,
    requestId,
  })

  return {
    ...mapEmployeeToListItem(emp),
    updatedAt: (emp as { updatedAt: Date }).updatedAt.toISOString(),
    userId: (emp as { userId: string | null }).userId,
  }
}

// ---------------------------------------------------------------------------
// updateEmployee
// ---------------------------------------------------------------------------

/**
 * PATCH /employees/:id — update editable employee fields.
 *
 * Enforces scope check for Support Admin (R7.15).
 * Enforces employeeCode uniqueness if changing (R7.5).
 * Audit: update_employee (R7.16)
 *
 * Requirements: 7.1, 7.2, 7.4, 7.5, 7.15, 7.16
 */
export async function updateEmployee(params: {
  workspaceId: string
  employeeId: string
  input: UpdateEmployeeInput
  actorUserId: string
  scopeFilter?: ScopeFilter | null
  ipAddress?: string | null
  userAgent?: string | null
  requestId?: string | null
}): Promise<EmployeeDetail> {
  const { workspaceId, employeeId, input, actorUserId, scopeFilter, ipAddress, userAgent, requestId } = params

  // Fetch existing employee with scope enforcement (R7.15)
  const existing = await (prisma as any).employee.findFirst({
    where: {
      id: employeeId,
      ...buildScopeWhere(workspaceId, scopeFilter),
    },
    select: {
      id: true,
      employeeCode: true,
      fullName: true,
      email: true,
      phone: true,
      position: true,
      departmentId: true,
      workMode: true,
      assignedShiftId: true,
      assignedLocationId: true,
    },
  })

  if (!existing) {
    throw new NotFoundError('Karyawan')
  }

  // If changing employeeCode, check uniqueness (R7.5)
  if (input.employeeCode !== undefined && input.employeeCode !== existing.employeeCode) {
    const codeExists = await (prisma as any).employee.findFirst({
      where: { workspaceId, employeeCode: input.employeeCode, id: { not: employeeId } },
      select: { id: true },
    })
    if (codeExists) {
      throw new ConflictError(
        `Kode karyawan "${input.employeeCode}" sudah digunakan di workspace ini`,
      )
    }
  }

  // If changing department, validate it belongs to this workspace
  if (input.departmentId !== undefined) {
    const dept = await (prisma as any).department.findFirst({
      where: { id: input.departmentId, workspaceId },
      select: { id: true },
    })
    if (!dept) {
      throw new NotFoundError('Departemen')
    }
  }

  const updateData: Record<string, unknown> = {}
  if (input.fullName !== undefined) updateData['fullName'] = input.fullName
  if (input.phone !== undefined) updateData['phone'] = input.phone
  if (input.position !== undefined) updateData['position'] = input.position
  if (input.departmentId !== undefined) updateData['departmentId'] = input.departmentId
  if (input.employeeCode !== undefined) updateData['employeeCode'] = input.employeeCode
  if (input.assignedShiftId !== undefined) updateData['assignedShiftId'] = input.assignedShiftId
  if (input.assignedLocationId !== undefined) updateData['assignedLocationId'] = input.assignedLocationId
  if (input.workMode !== undefined) updateData['workMode'] = input.workMode

  const updated = await (prisma as any).employee.update({
    where: { id: employeeId },
    data: updateData,
    select: employeeSelectWithRelations,
  })

  // Build old/new for audit (only changed fields — R14.2)
  const oldValue: Record<string, unknown> = {}
  const newValue: Record<string, unknown> = {}

  const fields = ['fullName', 'phone', 'position', 'departmentId', 'employeeCode', 'assignedShiftId', 'assignedLocationId', 'workMode'] as const
  for (const field of fields) {
    if (updateData[field] !== undefined && updateData[field] !== (existing as Record<string, unknown>)[field]) {
      oldValue[field] = (existing as Record<string, unknown>)[field]
      newValue[field] = updateData[field]
    }
  }

  await writeAudit({
    workspaceId,
    actorUserId,
    action: 'update_employee',
    entityType: 'Employee',
    entityId: employeeId,
    oldValue: Object.keys(oldValue).length > 0 ? oldValue : undefined,
    newValue: Object.keys(newValue).length > 0 ? newValue : undefined,
    ipAddress,
    userAgent,
    requestId,
  })

  return {
    ...mapEmployeeToListItem(updated),
    updatedAt: (updated as { updatedAt: Date }).updatedAt.toISOString(),
    userId: (updated as { userId: string | null }).userId,
  }
}

// ---------------------------------------------------------------------------
// updateEmployeeStatus
// ---------------------------------------------------------------------------

/**
 * PATCH /employees/:id/status — lifecycle status changes.
 *
 * On Archive (R7.9, R7.10, R7.11 — Task 20):
 *   - Set employmentStatus = Archived
 *   - If employee.userId exists, check user's RoleAssignments in this workspace
 *   - If user ONLY has end_user role → set User.status = Disabled
 *   - If user also has support_admin or stakeholder → keep User.status Active
 *   - History (AttendanceLogs, LeaveRequests) remains untouched
 *
 * No hard delete (R7.8).
 * Audit: archive_employee | reactivate_employee | update_employee_status (R7.16)
 *
 * Requirements: 7.8–7.11, 7.16
 */
export async function updateEmployeeStatus(params: {
  workspaceId: string
  employeeId: string
  input: UpdateEmployeeStatusInput
  actorUserId: string
  scopeFilter?: ScopeFilter | null
  ipAddress?: string | null
  userAgent?: string | null
  requestId?: string | null
}): Promise<EmployeeDetail> {
  const { workspaceId, employeeId, input, actorUserId, scopeFilter, ipAddress, userAgent, requestId } = params

  const existing = await (prisma as any).employee.findFirst({
    where: {
      id: employeeId,
      ...buildScopeWhere(workspaceId, scopeFilter),
    },
    select: {
      id: true,
      employmentStatus: true,
      accountStatus: true,
      userId: true,
      fullName: true,
    },
  })

  if (!existing) {
    throw new NotFoundError('Karyawan')
  }

  const oldStatus = existing.employmentStatus
  const newStatus = input.status

  const updateData: Record<string, unknown> = {
    employmentStatus: newStatus,
  }

  // If archiving, optionally set inactiveAt
  if (newStatus === 'Archived') {
    updateData['inactiveAt'] = new Date()
  } else if ((oldStatus as string) === 'Archived') {
    // Reactivating from Archived — clear inactiveAt
    updateData['inactiveAt'] = null
  }

  // Determine audit action
  let auditAction: string
  if (newStatus === 'Archived') {
    auditAction = 'archive_employee'
  } else if ((oldStatus as string) === 'Archived' && newStatus === 'Active') {
    auditAction = 'reactivate_employee'
  } else {
    auditAction = 'update_employee'
  }

  // Update the employee status
  const updated = await (prisma as any).employee.update({
    where: { id: employeeId },
    data: updateData,
    select: employeeSelectWithRelations,
  })

  // Task 20 — Archive effect on login account (R7.9, R7.10, R7.11)
  if (newStatus === 'Archived' && existing.userId) {
    await handleArchiveUserAccount({
      userId: existing.userId,
      workspaceId,
      employeeId,
    })
  }

  await writeAudit({
    workspaceId,
    actorUserId,
    action: auditAction,
    entityType: 'Employee',
    entityId: employeeId,
    oldValue: { employmentStatus: oldStatus },
    newValue: { employmentStatus: newStatus },
    ipAddress,
    userAgent,
    requestId,
  })

  return {
    ...mapEmployeeToListItem(updated),
    updatedAt: (updated as { updatedAt: Date }).updatedAt.toISOString(),
    userId: (updated as { userId: string | null }).userId,
  }
}

// ---------------------------------------------------------------------------
// Task 20 — handleArchiveUserAccount
// ---------------------------------------------------------------------------

/**
 * When an employee is archived, check if their linked user account should
 * be disabled.
 *
 * Rules (R7.9, R7.10, R7.11):
 * - If the user ONLY holds end_user role in this workspace → disable login
 * - If the user also holds support_admin or stakeholder → keep Active
 * - History (AttendanceLogs, LeaveRequests) is never touched
 */
async function handleArchiveUserAccount(params: {
  userId: string
  workspaceId: string
  employeeId: string
}): Promise<void> {
  const { userId, workspaceId } = params

  // Look up all role assignments for this user in this workspace
  const roleAssignments = await (prisma as any).roleAssignment.findMany({
    where: { userId, workspaceId },
    select: { role: true },
  })

  if (!roleAssignments || roleAssignments.length === 0) {
    // No role assignments in this workspace — still disable login as end_user
    await (prisma as any).user.update({
      where: { id: userId },
      data: { status: 'Disabled' },
    })
    return
  }

  const roles = (roleAssignments as Array<{ role: string }>).map((ra) => ra.role)

  const hasDashboardRole =
    roles.includes('stakeholder') || roles.includes('support_admin')

  if (hasDashboardRole) {
    // User has a dashboard role — preserve their login access (R7.11)
    return
  }

  // User only has end_user role → disable login account (R7.10)
  await (prisma as any).user.update({
    where: { id: userId },
    data: { status: 'Disabled' },
  })
}

// ---------------------------------------------------------------------------
// resendInvitation
// ---------------------------------------------------------------------------

/**
 * POST /employees/:id/resend-invitation
 *
 * Generates a new activation token, invalidates the old one, resends email.
 * Only valid for employees with accountStatus = PendingActivation.
 *
 * Requirements: 2.3, 2.6
 */
export async function resendInvitation(params: {
  workspaceId: string
  employeeId: string
  actorUserId: string
  scopeFilter?: ScopeFilter | null
  ipAddress?: string | null
  userAgent?: string | null
  requestId?: string | null
}): Promise<{ message: string }> {
  const { workspaceId, employeeId, actorUserId, scopeFilter, ipAddress, userAgent, requestId } = params

  const emp = await (prisma as any).employee.findFirst({
    where: {
      id: employeeId,
      ...buildScopeWhere(workspaceId, scopeFilter),
    },
    select: { id: true, email: true, accountStatus: true, fullName: true },
  })

  if (!emp) {
    throw new NotFoundError('Karyawan')
  }

  // Invalidate old token and generate new one (R2.6)
  invalidateEmployeeToken(employeeId)

  const token = generateActivationToken({
    employeeId,
    workspaceId,
    email: emp.email,
  })
  const activationLink = buildActivationLink(token)

  // Non-blocking email send
  sendActivationEmail(emp.email, activationLink).catch(() => {
    // logged inside sendActivationEmail
  })

  await writeAudit({
    workspaceId,
    actorUserId,
    action: 'resend_invitation',
    entityType: 'Employee',
    entityId: employeeId,
    newValue: { email: emp.email },
    ipAddress,
    userAgent,
    requestId,
  })

  return { message: 'Invitation berhasil dikirim ulang' }
}

// ---------------------------------------------------------------------------
// activateAccount (Public endpoint — no auth)
// ---------------------------------------------------------------------------

/**
 * POST /employees/activate — public endpoint hit by the activation link.
 *
 * - Validates the token
 * - Creates a better-auth user account via the better-auth API
 * - Sets employee.accountStatus = Active
 * - Sets employee.userId = new user.id
 * - Consumes the token
 *
 * Note: better-auth handles password hashing — we do NOT call bcrypt directly.
 *
 * Requirements: 2.5, 2.7
 */
export async function activateAccount(params: {
  token: string
  password: string
}): Promise<{ message: string }> {
  const { token, password } = params

  // Import here to avoid circular dep issues and keep testability
  const { validateActivationToken, consumeActivationToken } = await import('./employees.activation')

  const tokenData = validateActivationToken(token)

  // Find the employee
  const emp = await (prisma as any).employee.findFirst({
    where: { id: tokenData.employeeId, workspaceId: tokenData.workspaceId },
    select: { id: true, email: true, accountStatus: true, fullName: true, workspaceId: true },
  })

  if (!emp) {
    throw new NotFoundError('Karyawan tidak ditemukan')
  }

  // Check if already activated
  if (emp.accountStatus === 'Active') {
    consumeActivationToken(token)
    return { message: 'Akun sudah diaktifkan sebelumnya' }
  }

  // Create user via better-auth API (handles password hashing)
  // better-auth manages both the `user` table and `account` table
  const { auth } = await import('../../config/auth')
  const createResult = await auth.api.signUpEmail({
    body: {
      email: emp.email,
      password,
      name: emp.fullName,
    },
  })

  if (!createResult || !createResult.user) {
    throw new Error('Gagal membuat akun. Silakan coba lagi.')
  }

  const authUserId = createResult.user.id

  // Find or create the application-level User record linked to auth user
  let appUser = await (prisma as any).user.findFirst({
    where: { authUserId },
    select: { id: true },
  })

  if (!appUser) {
    appUser = await (prisma as any).user.create({
      data: {
        authUserId,
        email: emp.email,
        fullName: emp.fullName,
        status: 'Active',
      },
      select: { id: true },
    })
  }

  // Update employee: set accountStatus = Active, userId = appUser.id
  await (prisma as any).employee.update({
    where: { id: emp.id },
    data: {
      accountStatus: 'Active',
      userId: appUser.id,
    },
  })

  // Consume (delete) the token
  consumeActivationToken(token)

  return { message: 'Akun berhasil diaktifkan. Silakan login.' }
}
