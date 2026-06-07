/**
 * employees.test.ts — Unit tests for Employee service.
 *
 * Requirements validated: 7.1–7.16, 2.1–2.8
 *
 * Tests:
 *   - Create employee → generates employeeCode, sets PendingActivation (R7.4, R2.1)
 *   - Create with duplicate email → 409 CONFLICT (R7.6, R7.7)
 *   - Create with duplicate employeeCode → 409 CONFLICT (R7.5)
 *   - Create with custom employeeCode → preserved (R7.4)
 *   - List with scope filter applied (R7.2, R3.10)
 *   - List with status filter (R7.10)
 *   - Get by ID with warnings (R7.12)
 *   - Get by ID — not found → 404
 *   - Get by ID — outside scope → 404 (R7.15)
 *   - Update employee fields (R7.4)
 *   - Update with duplicate employeeCode → 409 (R7.5)
 *   - Archive → disables user account if end_user only (R7.10, R7.11)
 *   - Archive → preserves account if user also has support_admin role (R7.11)
 *   - Resend invitation → invalidates old token (R2.6)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mock prisma BEFORE importing service
// vi.mock is hoisted so we cannot reference top-level variables inside factory.
// Use a pure factory with vi.fn() only.
// ---------------------------------------------------------------------------

vi.mock('../config/prisma', () => {
  const employee = {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  }
  const department = { findFirst: vi.fn() }
  const roleAssignment = { findMany: vi.fn() }
  const user = { update: vi.fn(), create: vi.fn() }
  const auditLog = { create: vi.fn() }
  return {
    prisma: { employee, department, roleAssignment, user, auditLog },
  }
})

vi.mock('../config/env', () => ({
  env: {
    NODE_ENV: 'test',
    INTERNAL_JWT_SECRET: 'test-secret-minimum-32-characters-long-ok',
  },
}))

vi.mock('../lib/mailer', () => ({
  sendActivationEmail: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../modules/employees/employees.activation', () => ({
  generateActivationToken: vi.fn().mockReturnValue('mock-token-hex-string'),
  buildActivationLink: vi.fn().mockReturnValue('http://localhost:3000/activate?token=mock'),
  invalidateEmployeeToken: vi.fn(),
  validateActivationToken: vi.fn(),
  consumeActivationToken: vi.fn(),
  _clearAllTokens: vi.fn(),
  _tokenCount: vi.fn().mockReturnValue(0),
}))

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------
import { prisma } from '../config/prisma'
import {
  listEmployees,
  createEmployee,
  getEmployeeById,
  updateEmployee,
  updateEmployeeStatus,
  resendInvitation,
} from '../modules/employees/employees.service'
import { ConflictError, NotFoundError } from '../lib/errors'
import type { ScopeFilter } from '../types/auth'

// ---------------------------------------------------------------------------
// Test constants
// ---------------------------------------------------------------------------

const WORKSPACE_ID = 'ws-test-123'
const ACTOR_ID = 'user-actor-456'
const EMP_ID = 'emp-001'
const DEPT_ID = 'dept-001'
const USER_ID = 'user-001'

const workspaceScopeFilter: ScopeFilter = {
  departmentIds: [],
  locationIds: [],
  isWorkspaceScope: true,
}

const restrictedScopeFilter: ScopeFilter = {
  departmentIds: ['dept-001'],
  locationIds: [],
  isWorkspaceScope: false,
}

const baseEmployee = {
  id: EMP_ID,
  employeeCode: 'EMP-2024-0001',
  fullName: 'John Doe',
  email: 'john.doe@example.com',
  phone: null,
  position: 'Developer',
  departmentId: DEPT_ID,
  department: { name: 'Engineering' },
  employmentStatus: 'Active',
  accountStatus: 'PendingActivation',
  workMode: 'WFO',
  faceProfileStatus: 'NotRegistered',
  assignedShiftId: 'shift-001',
  assignedShift: { name: 'Morning Shift' },
  assignedLocationId: 'loc-001',
  assignedLocation: { name: 'Head Office' },
  joinedAt: new Date('2024-01-15T00:00:00Z'),
  createdAt: new Date('2024-01-15T10:00:00Z'),
  updatedAt: new Date('2024-01-15T10:00:00Z'),
  userId: null,
}

// Helper to reset all mocks cleanly
function resetAllMocks() {
  vi.mocked(prisma.employee.findMany).mockReset()
  vi.mocked(prisma.employee.findFirst).mockReset()
  vi.mocked(prisma.employee.create).mockReset()
  vi.mocked(prisma.employee.update).mockReset()
  vi.mocked(prisma.employee.count).mockReset()
  vi.mocked(prisma.department.findFirst).mockReset()
  vi.mocked(prisma.roleAssignment.findMany).mockReset()
  vi.mocked(prisma.user.update).mockReset()
  vi.mocked(prisma.user.create).mockReset()
  vi.mocked(prisma.auditLog.create).mockReset().mockResolvedValue({} as never)
}

// ---------------------------------------------------------------------------
// listEmployees
// ---------------------------------------------------------------------------

describe('listEmployees', () => {
  beforeEach(resetAllMocks)

  it('returns paginated list of employees', async () => {
    vi.mocked(prisma.employee.count).mockResolvedValueOnce(2 as never)
    vi.mocked(prisma.employee.findMany).mockResolvedValueOnce([
      baseEmployee,
      { ...baseEmployee, id: 'emp-002', fullName: 'Jane Smith' },
    ] as never)

    const result = await listEmployees({
      workspaceId: WORKSPACE_ID,
      status: 'Active',
      page: 1,
      pageSize: 25,
      scopeFilter: workspaceScopeFilter,
    })

    expect(result.items).toHaveLength(2)
    expect(result.pagination.total).toBe(2)
    expect(result.pagination.page).toBe(1)
    expect(result.pagination.page_size).toBe(25)
  })

  it('includes shift and location warnings (R7.12)', async () => {
    const empNoShift = { ...baseEmployee, assignedShiftId: null, assignedShift: null }
    const empNoLocation = {
      ...baseEmployee,
      id: 'emp-002',
      assignedLocationId: null,
      assignedLocation: null,
    }

    vi.mocked(prisma.employee.count).mockResolvedValueOnce(2 as never)
    vi.mocked(prisma.employee.findMany).mockResolvedValueOnce([empNoShift, empNoLocation] as never)

    const result = await listEmployees({
      workspaceId: WORKSPACE_ID,
      status: 'Active',
      page: 1,
      pageSize: 25,
      scopeFilter: workspaceScopeFilter,
    })

    expect(result.items[0].hasShiftWarning).toBe(true)
    expect(result.items[0].hasLocationWarning).toBe(false)
    expect(result.items[1].hasShiftWarning).toBe(false)
    expect(result.items[1].hasLocationWarning).toBe(true)
  })

  it('applies scope filter to where clause (R7.2, R3.10)', async () => {
    vi.mocked(prisma.employee.count).mockResolvedValueOnce(0 as never)
    vi.mocked(prisma.employee.findMany).mockResolvedValueOnce([] as never)

    await listEmployees({
      workspaceId: WORKSPACE_ID,
      status: 'Active',
      page: 1,
      pageSize: 25,
      scopeFilter: restrictedScopeFilter,
    })

    const countCall = vi.mocked(prisma.employee.count).mock.calls[0]?.[0] as {
      where: Record<string, unknown>
    }
    expect(countCall.where).toHaveProperty('OR')
    expect((countCall.where['OR'] as unknown[]).length).toBeGreaterThan(0)
  })

  it('returns empty list when no employees match', async () => {
    vi.mocked(prisma.employee.count).mockResolvedValueOnce(0 as never)
    vi.mocked(prisma.employee.findMany).mockResolvedValueOnce([] as never)

    const result = await listEmployees({
      workspaceId: WORKSPACE_ID,
      status: 'Active',
      page: 1,
      pageSize: 25,
      scopeFilter: workspaceScopeFilter,
    })

    expect(result.items).toEqual([])
    expect(result.pagination.total).toBe(0)
    expect(result.pagination.total_pages).toBe(0)
  })

  it('filters by Archived status (R7.10)', async () => {
    vi.mocked(prisma.employee.count).mockResolvedValueOnce(1 as never)
    vi.mocked(prisma.employee.findMany).mockResolvedValueOnce([
      { ...baseEmployee, employmentStatus: 'Archived' },
    ] as never)

    const result = await listEmployees({
      workspaceId: WORKSPACE_ID,
      status: 'Archived',
      page: 1,
      pageSize: 25,
      scopeFilter: workspaceScopeFilter,
    })

    const findCall = vi.mocked(prisma.employee.findMany).mock.calls[0]?.[0] as {
      where: Record<string, unknown>
    }
    expect(findCall.where['employmentStatus']).toBe('Archived')
    expect(result.items[0].employmentStatus).toBe('Archived')
  })
})

// ---------------------------------------------------------------------------
// createEmployee
// ---------------------------------------------------------------------------

describe('createEmployee', () => {
  beforeEach(resetAllMocks)

  it('creates employee with auto-generated employeeCode (R7.4)', async () => {
    vi.mocked(prisma.employee.findFirst)
      .mockResolvedValueOnce(null as never)  // email check → ok
      .mockResolvedValueOnce(null as never)  // code uniqueness → ok
    vi.mocked(prisma.employee.findMany).mockResolvedValueOnce([] as never) // code gen
    vi.mocked(prisma.department.findFirst).mockResolvedValueOnce({ id: DEPT_ID } as never)
    vi.mocked(prisma.employee.create).mockResolvedValueOnce(baseEmployee as never)

    const result = await createEmployee({
      workspaceId: WORKSPACE_ID,
      input: {
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        departmentId: DEPT_ID,
        employmentStatus: 'Active',
        workMode: 'WFO',
        joinDate: '2024-01-15',
      },
      actorUserId: ACTOR_ID,
      scopeFilter: workspaceScopeFilter,
    })

    expect(result.id).toBe(EMP_ID)
    expect(vi.mocked(prisma.employee.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          accountStatus: 'PendingActivation',
          faceProfileStatus: 'NotRegistered',
        }),
      }),
    )
  })

  it('uses provided employeeCode when given (R7.4)', async () => {
    vi.mocked(prisma.employee.findFirst)
      .mockResolvedValueOnce(null as never)  // email check
      .mockResolvedValueOnce(null as never)  // code uniqueness
    vi.mocked(prisma.department.findFirst).mockResolvedValueOnce({ id: DEPT_ID } as never)
    vi.mocked(prisma.employee.create).mockResolvedValueOnce({
      ...baseEmployee,
      employeeCode: 'CUSTOM-001',
    } as never)

    await createEmployee({
      workspaceId: WORKSPACE_ID,
      input: {
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        employeeCode: 'CUSTOM-001',
        departmentId: DEPT_ID,
        employmentStatus: 'Active',
        workMode: 'WFO',
        joinDate: '2024-01-15',
      },
      actorUserId: ACTOR_ID,
      scopeFilter: workspaceScopeFilter,
    })

    expect(vi.mocked(prisma.employee.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ employeeCode: 'CUSTOM-001' }),
      }),
    )
  })

  it('throws ConflictError when email already exists in workspace (R7.6, R7.7)', async () => {
    vi.mocked(prisma.employee.findFirst).mockResolvedValueOnce({ id: 'other-emp' } as never)

    await expect(
      createEmployee({
        workspaceId: WORKSPACE_ID,
        input: {
          fullName: 'John Doe',
          email: 'john.doe@example.com',
          departmentId: DEPT_ID,
          employmentStatus: 'Active',
          workMode: 'WFO',
          joinDate: '2024-01-15',
        },
        actorUserId: ACTOR_ID,
        scopeFilter: workspaceScopeFilter,
      }),
    ).rejects.toThrow(ConflictError)
  })

  it('throws ConflictError when employeeCode already exists in workspace (R7.5)', async () => {
    vi.mocked(prisma.employee.findFirst)
      .mockResolvedValueOnce(null as never)         // email: ok
      .mockResolvedValueOnce({ id: 'other' } as never) // code: duplicate
    
    await expect(
      createEmployee({
        workspaceId: WORKSPACE_ID,
        input: {
          fullName: 'John Doe',
          email: 'john.doe@example.com',
          employeeCode: 'EMP-2024-0001',
          departmentId: DEPT_ID,
          employmentStatus: 'Active',
          workMode: 'WFO',
          joinDate: '2024-01-15',
        },
        actorUserId: ACTOR_ID,
        scopeFilter: workspaceScopeFilter,
      }),
    ).rejects.toThrow(ConflictError)
  })

  it('writes create_employee audit log on success', async () => {
    vi.mocked(prisma.employee.findFirst)
      .mockResolvedValueOnce(null as never)
      .mockResolvedValueOnce(null as never)
    vi.mocked(prisma.employee.findMany).mockResolvedValueOnce([] as never)
    vi.mocked(prisma.department.findFirst).mockResolvedValueOnce({ id: DEPT_ID } as never)
    vi.mocked(prisma.employee.create).mockResolvedValueOnce(baseEmployee as never)

    await createEmployee({
      workspaceId: WORKSPACE_ID,
      input: {
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        departmentId: DEPT_ID,
        employmentStatus: 'Active',
        workMode: 'WFO',
        joinDate: '2024-01-15',
      },
      actorUserId: ACTOR_ID,
      scopeFilter: workspaceScopeFilter,
    })

    expect(vi.mocked(prisma.auditLog.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'create_employee',
          entityType: 'Employee',
          workspaceId: WORKSPACE_ID,
          actorUserId: ACTOR_ID,
        }),
      }),
    )
  })

  it('sets accountStatus=PendingActivation and faceProfileStatus=NotRegistered (R2.1)', async () => {
    vi.mocked(prisma.employee.findFirst)
      .mockResolvedValueOnce(null as never)
      .mockResolvedValueOnce(null as never)
    vi.mocked(prisma.employee.findMany).mockResolvedValueOnce([] as never)
    vi.mocked(prisma.department.findFirst).mockResolvedValueOnce({ id: DEPT_ID } as never)
    vi.mocked(prisma.employee.create).mockResolvedValueOnce(baseEmployee as never)

    await createEmployee({
      workspaceId: WORKSPACE_ID,
      input: {
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        departmentId: DEPT_ID,
        employmentStatus: 'Active',
        workMode: 'WFO',
        joinDate: '2024-01-15',
      },
      actorUserId: ACTOR_ID,
      scopeFilter: workspaceScopeFilter,
    })

    const createCall = vi.mocked(prisma.employee.create).mock.calls[0]?.[0] as {
      data: Record<string, unknown>
    }
    expect(createCall?.data['accountStatus']).toBe('PendingActivation')
    expect(createCall?.data['faceProfileStatus']).toBe('NotRegistered')
  })
})

// ---------------------------------------------------------------------------
// getEmployeeById
// ---------------------------------------------------------------------------

describe('getEmployeeById', () => {
  beforeEach(resetAllMocks)

  it('returns employee detail', async () => {
    vi.mocked(prisma.employee.findFirst).mockResolvedValueOnce(baseEmployee as never)

    const result = await getEmployeeById(WORKSPACE_ID, EMP_ID, workspaceScopeFilter)

    expect(result.id).toBe(EMP_ID)
    expect(result.fullName).toBe('John Doe')
    expect(result.departmentName).toBe('Engineering')
    expect(result.assignedShiftName).toBe('Morning Shift')
    expect(result.assignedLocationName).toBe('Head Office')
  })

  it('returns hasShiftWarning=false and hasLocationWarning=false when both assigned', async () => {
    vi.mocked(prisma.employee.findFirst).mockResolvedValueOnce(baseEmployee as never)

    const result = await getEmployeeById(WORKSPACE_ID, EMP_ID, workspaceScopeFilter)

    expect(result.hasShiftWarning).toBe(false)
    expect(result.hasLocationWarning).toBe(false)
  })

  it('returns hasShiftWarning=true when no shift assigned (R7.12)', async () => {
    vi.mocked(prisma.employee.findFirst).mockResolvedValueOnce({
      ...baseEmployee,
      assignedShiftId: null,
      assignedShift: null,
    } as never)

    const result = await getEmployeeById(WORKSPACE_ID, EMP_ID, workspaceScopeFilter)

    expect(result.hasShiftWarning).toBe(true)
  })

  it('returns hasLocationWarning=true when no location assigned (R7.12)', async () => {
    vi.mocked(prisma.employee.findFirst).mockResolvedValueOnce({
      ...baseEmployee,
      assignedLocationId: null,
      assignedLocation: null,
    } as never)

    const result = await getEmployeeById(WORKSPACE_ID, EMP_ID, workspaceScopeFilter)

    expect(result.hasLocationWarning).toBe(true)
  })

  it('throws NotFoundError when employee does not exist', async () => {
    vi.mocked(prisma.employee.findFirst).mockResolvedValueOnce(null as never)

    await expect(
      getEmployeeById(WORKSPACE_ID, 'non-existent', workspaceScopeFilter),
    ).rejects.toThrow(NotFoundError)
  })

  it('respects scope filter — returns not found if out of scope (R7.15)', async () => {
    vi.mocked(prisma.employee.findFirst).mockResolvedValueOnce(null as never)

    const outOfScopeFilter: ScopeFilter = {
      departmentIds: ['dept-999'],
      locationIds: [],
      isWorkspaceScope: false,
    }

    await expect(
      getEmployeeById(WORKSPACE_ID, EMP_ID, outOfScopeFilter),
    ).rejects.toThrow(NotFoundError)
  })
})

// ---------------------------------------------------------------------------
// updateEmployee
// ---------------------------------------------------------------------------

describe('updateEmployee', () => {
  beforeEach(resetAllMocks)

  it('updates employee fields and writes audit', async () => {
    vi.mocked(prisma.employee.findFirst).mockResolvedValueOnce({
      id: EMP_ID,
      employeeCode: 'EMP-2024-0001',
      fullName: 'John Doe',
      email: 'john.doe@example.com',
      phone: null,
      position: 'Developer',
      departmentId: DEPT_ID,
      workMode: 'WFO',
      assignedShiftId: null,
      assignedLocationId: null,
    } as never)

    vi.mocked(prisma.employee.update).mockResolvedValueOnce({
      ...baseEmployee,
      position: 'Senior Developer',
    } as never)

    const result = await updateEmployee({
      workspaceId: WORKSPACE_ID,
      employeeId: EMP_ID,
      input: { position: 'Senior Developer' },
      actorUserId: ACTOR_ID,
      scopeFilter: workspaceScopeFilter,
    })

    expect(vi.mocked(prisma.employee.update)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ position: 'Senior Developer' }),
        where: { id: EMP_ID },
      }),
    )
    expect(vi.mocked(prisma.auditLog.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'update_employee', entityId: EMP_ID }),
      }),
    )
    expect(result.id).toBe(EMP_ID)
  })

  it('throws ConflictError when updating to a duplicate employeeCode (R7.5)', async () => {
    vi.mocked(prisma.employee.findFirst)
      .mockResolvedValueOnce({
        id: EMP_ID,
        employeeCode: 'EMP-2024-0001',
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        phone: null,
        position: null,
        departmentId: DEPT_ID,
        workMode: 'WFO',
        assignedShiftId: null,
        assignedLocationId: null,
      } as never) // existence check
      .mockResolvedValueOnce({ id: 'other-emp' } as never) // code uniqueness: duplicate

    await expect(
      updateEmployee({
        workspaceId: WORKSPACE_ID,
        employeeId: EMP_ID,
        input: { employeeCode: 'EMP-2024-0002' },
        actorUserId: ACTOR_ID,
        scopeFilter: workspaceScopeFilter,
      }),
    ).rejects.toThrow(ConflictError)
  })

  it('throws NotFoundError when employee is out of scope (R7.15)', async () => {
    vi.mocked(prisma.employee.findFirst).mockResolvedValueOnce(null as never)

    await expect(
      updateEmployee({
        workspaceId: WORKSPACE_ID,
        employeeId: EMP_ID,
        input: { fullName: 'New Name' },
        actorUserId: ACTOR_ID,
        scopeFilter: restrictedScopeFilter,
      }),
    ).rejects.toThrow(NotFoundError)
  })
})

// ---------------------------------------------------------------------------
// updateEmployeeStatus — Archive effects (Task 20, R7.9–7.11)
// ---------------------------------------------------------------------------

describe('updateEmployeeStatus — archive effects', () => {
  beforeEach(resetAllMocks)

  it('archives employee and disables login if user has only end_user role (R7.10, R7.11)', async () => {
    vi.mocked(prisma.employee.findFirst).mockResolvedValueOnce({
      id: EMP_ID,
      employmentStatus: 'Active',
      accountStatus: 'Active',
      userId: USER_ID,
      fullName: 'John Doe',
    } as never)
    vi.mocked(prisma.employee.update).mockResolvedValueOnce({
      ...baseEmployee,
      employmentStatus: 'Archived',
    } as never)
    vi.mocked(prisma.roleAssignment.findMany).mockResolvedValueOnce([{ role: 'end_user' }] as never)
    vi.mocked(prisma.user.update).mockResolvedValueOnce({} as never)

    await updateEmployeeStatus({
      workspaceId: WORKSPACE_ID,
      employeeId: EMP_ID,
      input: { status: 'Archived' },
      actorUserId: ACTOR_ID,
      scopeFilter: workspaceScopeFilter,
    })

    expect(vi.mocked(prisma.user.update)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: USER_ID },
        data: { status: 'Disabled' },
      }),
    )
  })

  it('archives employee but preserves login if user also has support_admin role (R7.11)', async () => {
    vi.mocked(prisma.employee.findFirst).mockResolvedValueOnce({
      id: EMP_ID,
      employmentStatus: 'Active',
      accountStatus: 'Active',
      userId: USER_ID,
      fullName: 'John Doe',
    } as never)
    vi.mocked(prisma.employee.update).mockResolvedValueOnce({
      ...baseEmployee,
      employmentStatus: 'Archived',
    } as never)
    vi.mocked(prisma.roleAssignment.findMany).mockResolvedValueOnce([
      { role: 'end_user' },
      { role: 'support_admin' },
    ] as never)

    await updateEmployeeStatus({
      workspaceId: WORKSPACE_ID,
      employeeId: EMP_ID,
      input: { status: 'Archived' },
      actorUserId: ACTOR_ID,
      scopeFilter: workspaceScopeFilter,
    })

    // User.status should NOT be changed
    expect(vi.mocked(prisma.user.update)).not.toHaveBeenCalled()
  })

  it('archives employee but preserves login if user also has stakeholder role (R7.11)', async () => {
    vi.mocked(prisma.employee.findFirst).mockResolvedValueOnce({
      id: EMP_ID,
      employmentStatus: 'Active',
      accountStatus: 'Active',
      userId: USER_ID,
      fullName: 'John Doe',
    } as never)
    vi.mocked(prisma.employee.update).mockResolvedValueOnce({
      ...baseEmployee,
      employmentStatus: 'Archived',
    } as never)
    vi.mocked(prisma.roleAssignment.findMany).mockResolvedValueOnce([
      { role: 'stakeholder' },
    ] as never)

    await updateEmployeeStatus({
      workspaceId: WORKSPACE_ID,
      employeeId: EMP_ID,
      input: { status: 'Archived' },
      actorUserId: ACTOR_ID,
      scopeFilter: workspaceScopeFilter,
    })

    expect(vi.mocked(prisma.user.update)).not.toHaveBeenCalled()
  })

  it('archives employee without userId — no user update needed', async () => {
    vi.mocked(prisma.employee.findFirst).mockResolvedValueOnce({
      id: EMP_ID,
      employmentStatus: 'Active',
      accountStatus: 'PendingActivation',
      userId: null,
      fullName: 'John Doe',
    } as never)
    vi.mocked(prisma.employee.update).mockResolvedValueOnce({
      ...baseEmployee,
      employmentStatus: 'Archived',
    } as never)

    await updateEmployeeStatus({
      workspaceId: WORKSPACE_ID,
      employeeId: EMP_ID,
      input: { status: 'Archived' },
      actorUserId: ACTOR_ID,
      scopeFilter: workspaceScopeFilter,
    })

    expect(vi.mocked(prisma.user.update)).not.toHaveBeenCalled()
  })

  it('writes archive_employee audit log on archive (R7.16)', async () => {
    vi.mocked(prisma.employee.findFirst).mockResolvedValueOnce({
      id: EMP_ID,
      employmentStatus: 'Active',
      accountStatus: 'Active',
      userId: null,
      fullName: 'John Doe',
    } as never)
    vi.mocked(prisma.employee.update).mockResolvedValueOnce({
      ...baseEmployee,
      employmentStatus: 'Archived',
    } as never)

    await updateEmployeeStatus({
      workspaceId: WORKSPACE_ID,
      employeeId: EMP_ID,
      input: { status: 'Archived' },
      actorUserId: ACTOR_ID,
      scopeFilter: workspaceScopeFilter,
    })

    expect(vi.mocked(prisma.auditLog.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'archive_employee',
          entityId: EMP_ID,
          workspaceId: WORKSPACE_ID,
        }),
      }),
    )
  })

  it('writes reactivate_employee audit log when reactivating from Archived (R7.16)', async () => {
    vi.mocked(prisma.employee.findFirst).mockResolvedValueOnce({
      id: EMP_ID,
      employmentStatus: 'Archived', // was archived
      accountStatus: 'Disabled',
      userId: null,
      fullName: 'John Doe',
    } as never)
    vi.mocked(prisma.employee.update).mockResolvedValueOnce({
      ...baseEmployee,
      employmentStatus: 'Active',
    } as never)

    await updateEmployeeStatus({
      workspaceId: WORKSPACE_ID,
      employeeId: EMP_ID,
      input: { status: 'Active' },
      actorUserId: ACTOR_ID,
      scopeFilter: workspaceScopeFilter,
    })

    expect(vi.mocked(prisma.auditLog.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'reactivate_employee',
          entityId: EMP_ID,
        }),
      }),
    )
  })

  it('throws NotFoundError when employee does not exist', async () => {
    vi.mocked(prisma.employee.findFirst).mockResolvedValueOnce(null as never)

    await expect(
      updateEmployeeStatus({
        workspaceId: WORKSPACE_ID,
        employeeId: 'non-existent',
        input: { status: 'Archived' },
        actorUserId: ACTOR_ID,
        scopeFilter: workspaceScopeFilter,
      }),
    ).rejects.toThrow(NotFoundError)
  })
})

// ---------------------------------------------------------------------------
// resendInvitation
// ---------------------------------------------------------------------------

describe('resendInvitation', () => {
  beforeEach(resetAllMocks)

  it('generates new token and resends email (R2.6)', async () => {
    vi.mocked(prisma.employee.findFirst).mockResolvedValueOnce({
      id: EMP_ID,
      email: 'john.doe@example.com',
      accountStatus: 'PendingActivation',
      fullName: 'John Doe',
    } as never)

    const activationMod = await import('../modules/employees/employees.activation')

    const result = await resendInvitation({
      workspaceId: WORKSPACE_ID,
      employeeId: EMP_ID,
      actorUserId: ACTOR_ID,
      scopeFilter: workspaceScopeFilter,
    })

    expect(result.message).toBeDefined()
    expect(vi.mocked(activationMod.invalidateEmployeeToken)).toHaveBeenCalledWith(EMP_ID)
    expect(vi.mocked(activationMod.generateActivationToken)).toHaveBeenCalledWith(
      expect.objectContaining({ employeeId: EMP_ID }),
    )
  })

  it('throws NotFoundError when employee not found or out of scope', async () => {
    vi.mocked(prisma.employee.findFirst).mockResolvedValueOnce(null as never)

    await expect(
      resendInvitation({
        workspaceId: WORKSPACE_ID,
        employeeId: 'non-existent',
        actorUserId: ACTOR_ID,
        scopeFilter: workspaceScopeFilter,
      }),
    ).rejects.toThrow(NotFoundError)
  })
})
