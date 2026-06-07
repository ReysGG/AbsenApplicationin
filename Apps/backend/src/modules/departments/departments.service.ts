/**
 * departments.service.ts — business logic for department endpoints.
 *
 * Endpoints covered:
 *   GET  /departments           — list departments with status filter (R8.1)
 *   POST /departments           — create department (R8.1, R8.5, R8.6)
 *   GET  /departments/:id       — department detail + active employees (R8.2)
 *   PATCH /departments/:id      — update name/status + deactivate (R8.4, R8.6)
 *
 * Business rules:
 *   - Name must be unique within a workspace (case-insensitive) → 409 CONFLICT
 *   - Single-level only (no parent_department_id) per R8.3
 *   - No hard delete; lifecycle via status (R8.4)
 *   - Audit: create_department, update_department, deactivate_department (R8.6)
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */

import { prisma } from '../../config/prisma'
import { writeAudit } from '../../lib/audit'
import { ConflictError, NotFoundError } from '../../lib/errors'
import type { CreateDeptInput, UpdateDeptInput } from './departments.schema'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DepartmentListItem {
  id: string
  name: string
  status: string
  createdAt: string
  employeeCount: number
}

export interface EmployeeInDept {
  id: string
  employeeCode: string
  fullName: string
  position: string | null
  employmentStatus: string
}

export interface DepartmentDetail {
  id: string
  name: string
  status: string
  createdAt: string
  updatedAt: string
  employeeCount: number
  employees: EmployeeInDept[]
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * GET /departments
 * List all departments in the workspace filtered by status.
 * Includes active employee count per department.
 *
 * Requirements: 8.1
 */
export async function listDepartments(
  workspaceId: string,
  status: 'Active' | 'Inactive' | 'all',
): Promise<DepartmentListItem[]> {
  const where: Record<string, unknown> = { workspaceId }
  if (status !== 'all') {
    where['status'] = status
  }

  const departments = await (prisma as any).department.findMany({
    where,
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
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
    departments as Array<{
      id: string
      name: string
      status: string
      createdAt: Date
      _count: { employees: number }
    }>
  ).map((dept) => ({
    id: dept.id,
    name: dept.name,
    status: dept.status,
    createdAt: dept.createdAt.toISOString(),
    employeeCount: dept._count.employees,
  }))
}

/**
 * POST /departments
 * Create a new department.
 *
 * Requirements: 8.1, 8.5, 8.6
 */
export async function createDepartment(params: {
  workspaceId: string
  input: CreateDeptInput
  actorUserId: string
  ipAddress?: string | null
  userAgent?: string | null
  requestId?: string | null
}): Promise<DepartmentListItem> {
  const { workspaceId, input, actorUserId, ipAddress, userAgent, requestId } = params

  // Check uniqueness — case-insensitive within workspace (R8.5)
  await assertNameUnique(workspaceId, input.name)

  const dept = await (prisma as any).department.create({
    data: {
      workspaceId,
      name: input.name,
      status: 'Active',
    },
    select: {
      id: true,
      name: true,
      status: true,
      createdAt: true,
    },
  })

  // Audit (R8.6)
  await writeAudit({
    workspaceId,
    actorUserId,
    action: 'create_department',
    entityType: 'Department',
    entityId: dept.id,
    newValue: { name: dept.name, status: dept.status },
    ipAddress,
    userAgent,
    requestId,
  })

  return {
    id: dept.id,
    name: dept.name,
    status: dept.status,
    createdAt: dept.createdAt.toISOString(),
    employeeCount: 0,
  }
}

/**
 * GET /departments/:id
 * Department detail with list of active employees.
 *
 * Requirements: 8.2
 */
export async function getDepartmentById(
  workspaceId: string,
  departmentId: string,
): Promise<DepartmentDetail> {
  const dept = await (prisma as any).department.findFirst({
    where: { id: departmentId, workspaceId },
    select: {
      id: true,
      name: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      employees: {
        where: { employmentStatus: 'Active' },
        select: {
          id: true,
          employeeCode: true,
          fullName: true,
          position: true,
          employmentStatus: true,
        },
        orderBy: { fullName: 'asc' },
      },
    },
  })

  if (!dept) {
    throw new NotFoundError('Departemen')
  }

  const employees = (
    dept.employees as Array<{
      id: string
      employeeCode: string
      fullName: string
      position: string | null
      employmentStatus: string
    }>
  ).map((emp) => ({
    id: emp.id,
    employeeCode: emp.employeeCode,
    fullName: emp.fullName,
    position: emp.position,
    employmentStatus: emp.employmentStatus,
  }))

  return {
    id: dept.id,
    name: dept.name,
    status: dept.status,
    createdAt: dept.createdAt.toISOString(),
    updatedAt: dept.updatedAt.toISOString(),
    employeeCount: employees.length,
    employees,
  }
}

/**
 * PATCH /departments/:id
 * Update department name and/or status.
 * Deactivating a department is allowed even if it has employees (R8.4).
 *
 * Requirements: 8.4, 8.6
 */
export async function updateDepartment(params: {
  workspaceId: string
  departmentId: string
  input: UpdateDeptInput
  actorUserId: string
  ipAddress?: string | null
  userAgent?: string | null
  requestId?: string | null
}): Promise<DepartmentDetail> {
  const { workspaceId, departmentId, input, actorUserId, ipAddress, userAgent, requestId } = params

  const existing = await (prisma as any).department.findFirst({
    where: { id: departmentId, workspaceId },
  })

  if (!existing) {
    throw new NotFoundError('Departemen')
  }

  // If renaming, check for name conflict (case-insensitive), excluding self
  if (input.name !== undefined) {
    await assertNameUnique(workspaceId, input.name, departmentId)
  }

  const updateData: Record<string, unknown> = {}
  if (input.name !== undefined) updateData['name'] = input.name
  if (input.status !== undefined) updateData['status'] = input.status

  const updated = await (prisma as any).department.update({
    where: { id: departmentId },
    data: updateData,
    select: {
      id: true,
      name: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      employees: {
        where: { employmentStatus: 'Active' },
        select: {
          id: true,
          employeeCode: true,
          fullName: true,
          position: true,
          employmentStatus: true,
        },
        orderBy: { fullName: 'asc' },
      },
    },
  })

  // Determine audit action (R8.6)
  let auditAction: string
  if (input.status === 'Inactive' && existing.status !== 'Inactive') {
    auditAction = 'deactivate_department'
  } else {
    auditAction = 'update_department'
  }

  // Build old/new value objects (only changed fields — R14.3)
  const oldValue: Record<string, unknown> = {}
  const newValue: Record<string, unknown> = {}

  if (input.name !== undefined && input.name !== existing.name) {
    oldValue['name'] = existing.name
    newValue['name'] = input.name
  }
  if (input.status !== undefined && input.status !== existing.status) {
    oldValue['status'] = existing.status
    newValue['status'] = input.status
  }

  await writeAudit({
    workspaceId,
    actorUserId,
    action: auditAction,
    entityType: 'Department',
    entityId: departmentId,
    oldValue: Object.keys(oldValue).length > 0 ? oldValue : undefined,
    newValue: Object.keys(newValue).length > 0 ? newValue : undefined,
    ipAddress,
    userAgent,
    requestId,
  })

  const employees = (
    updated.employees as Array<{
      id: string
      employeeCode: string
      fullName: string
      position: string | null
      employmentStatus: string
    }>
  ).map((emp) => ({
    id: emp.id,
    employeeCode: emp.employeeCode,
    fullName: emp.fullName,
    position: emp.position,
    employmentStatus: emp.employmentStatus,
  }))

  return {
    id: updated.id,
    name: updated.name,
    status: updated.status,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
    employeeCount: employees.length,
    employees,
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Assert that a department name is unique within the workspace (case-insensitive).
 * Optionally exclude an existing department ID (for updates).
 * Throws ConflictError if a duplicate is found.
 */
async function assertNameUnique(
  workspaceId: string,
  name: string,
  excludeId?: string,
): Promise<void> {
  const existing = await (prisma as any).department.findFirst({
    where: {
      workspaceId,
      name: { equals: name, mode: 'insensitive' },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  })

  if (existing) {
    throw new ConflictError(
      `Departemen dengan nama "${name}" sudah ada di workspace ini`,
    )
  }
}
