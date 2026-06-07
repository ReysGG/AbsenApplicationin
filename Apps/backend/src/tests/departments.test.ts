/**
 * departments.test.ts — Unit tests for Department CRUD service.
 *
 * Requirements validated: 8.1, 8.2, 8.4, 8.5, 8.6
 *
 * Tests:
 *   - Create with valid name → success (R8.1, R8.6)
 *   - Create with duplicate name (case-insensitive) → 409 CONFLICT (R8.5)
 *   - List departments with status filter (R8.1)
 *   - Get by ID with active employees (R8.2)
 *   - Get by ID — not found → 404 (R8.2)
 *   - Update name → success + update_department audit (R8.6)
 *   - Deactivate → success + deactivate_department audit (R8.4, R8.6)
 *   - Update with duplicate name → 409 CONFLICT (R8.5)
 *   - Deactivation allowed even if employees exist (R8.4)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mock prisma BEFORE importing service
// ---------------------------------------------------------------------------
vi.mock('../config/prisma', () => ({
  prisma: {
    department: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}))

vi.mock('../config/env', () => ({
  env: {
    NODE_ENV: 'test',
    INTERNAL_JWT_SECRET: 'test-secret-minimum-32-characters-long-ok',
  },
}))

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------
import { prisma } from '../config/prisma'
import {
  listDepartments,
  createDepartment,
  getDepartmentById,
  updateDepartment,
} from '../modules/departments/departments.service'
import { ConflictError, NotFoundError } from '../lib/errors'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const WORKSPACE_ID = 'ws-test-123'
const ACTOR_ID = 'user-actor-456'
const DEPT_ID = 'dept-001'

const mockDeptRecord = {
  id: DEPT_ID,
  name: 'Engineering',
  status: 'Active',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  employees: [],
  _count: { employees: 0 },
}

const mockEmployee = {
  id: 'emp-001',
  employeeCode: 'EMP-2024-0001',
  fullName: 'John Doe',
  position: 'Developer',
  employmentStatus: 'Active',
}

// ---------------------------------------------------------------------------
// listDepartments
// ---------------------------------------------------------------------------

describe('listDepartments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns list of Active departments by default', async () => {
    const deptA = { ...mockDeptRecord, id: 'dept-1', name: 'Engineering', _count: { employees: 3 } }
    const deptB = { ...mockDeptRecord, id: 'dept-2', name: 'HR', _count: { employees: 1 } }

    vi.mocked(prisma.department.findMany).mockResolvedValueOnce([deptA, deptB] as never)

    const result = await listDepartments(WORKSPACE_ID, 'Active')

    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('Engineering')
    expect(result[0].employeeCount).toBe(3)
    expect(result[1].name).toBe('HR')
    expect(result[1].employeeCount).toBe(1)

    // Verify the where clause includes status filter
    expect(prisma.department.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ workspaceId: WORKSPACE_ID, status: 'Active' }),
      }),
    )
  })

  it('returns Inactive departments when status=Inactive', async () => {
    const inactiveDept = { ...mockDeptRecord, status: 'Inactive', _count: { employees: 0 } }
    vi.mocked(prisma.department.findMany).mockResolvedValueOnce([inactiveDept] as never)

    const result = await listDepartments(WORKSPACE_ID, 'Inactive')

    expect(result).toHaveLength(1)
    expect(result[0].status).toBe('Inactive')
    expect(prisma.department.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'Inactive' }),
      }),
    )
  })

  it('returns all departments when status=all (no status filter)', async () => {
    vi.mocked(prisma.department.findMany).mockResolvedValueOnce([mockDeptRecord] as never)

    await listDepartments(WORKSPACE_ID, 'all')

    // When 'all', the where clause should NOT include a status field
    const callArg = vi.mocked(prisma.department.findMany).mock.calls[0][0] as {
      where: Record<string, unknown>
    }
    expect(callArg.where).not.toHaveProperty('status')
  })

  it('returns empty array when no departments exist', async () => {
    vi.mocked(prisma.department.findMany).mockResolvedValueOnce([] as never)

    const result = await listDepartments(WORKSPACE_ID, 'Active')

    expect(result).toEqual([])
  })

  it('maps createdAt to ISO string', async () => {
    vi.mocked(prisma.department.findMany).mockResolvedValueOnce([mockDeptRecord] as never)

    const result = await listDepartments(WORKSPACE_ID, 'Active')

    expect(result[0].createdAt).toBe('2024-01-01T00:00:00.000Z')
  })
})

// ---------------------------------------------------------------------------
// createDepartment
// ---------------------------------------------------------------------------

describe('createDepartment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never)
  })

  it('creates department with valid name and returns it', async () => {
    // No duplicate found
    vi.mocked(prisma.department.findFirst).mockResolvedValueOnce(null as never)
    // Create succeeds
    vi.mocked(prisma.department.create).mockResolvedValueOnce({
      id: DEPT_ID,
      name: 'Engineering',
      status: 'Active',
      createdAt: new Date('2024-01-01T00:00:00Z'),
    } as never)

    const result = await createDepartment({
      workspaceId: WORKSPACE_ID,
      input: { name: 'Engineering' },
      actorUserId: ACTOR_ID,
    })

    expect(result.id).toBe(DEPT_ID)
    expect(result.name).toBe('Engineering')
    expect(result.status).toBe('Active')
    expect(result.employeeCount).toBe(0)
  })

  it('throws ConflictError (409) when department name already exists', async () => {
    // Simulate duplicate found (case-insensitive check)
    vi.mocked(prisma.department.findFirst).mockResolvedValueOnce({ id: 'existing-dept' } as never)

    await expect(
      createDepartment({
        workspaceId: WORKSPACE_ID,
        input: { name: 'Engineering' },
        actorUserId: ACTOR_ID,
      }),
    ).rejects.toThrow(ConflictError)
  })

  it('throws ConflictError even for case-insensitive duplicate (ENGINEERING vs engineering)', async () => {
    // Prisma mode: 'insensitive' is handled at DB level; we simulate finding a result
    vi.mocked(prisma.department.findFirst).mockResolvedValueOnce({ id: 'existing-dept' } as never)

    await expect(
      createDepartment({
        workspaceId: WORKSPACE_ID,
        input: { name: 'ENGINEERING' },
        actorUserId: ACTOR_ID,
      }),
    ).rejects.toThrow(ConflictError)
  })

  it('writes create_department audit log on success', async () => {
    vi.mocked(prisma.department.findFirst).mockResolvedValueOnce(null as never)
    vi.mocked(prisma.department.create).mockResolvedValueOnce({
      id: DEPT_ID,
      name: 'HR',
      status: 'Active',
      createdAt: new Date(),
    } as never)

    await createDepartment({
      workspaceId: WORKSPACE_ID,
      input: { name: 'HR' },
      actorUserId: ACTOR_ID,
      requestId: 'req-123',
    })

    expect(prisma.auditLog.create).toHaveBeenCalledOnce()
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'create_department',
          entityType: 'Department',
          actorUserId: ACTOR_ID,
          workspaceId: WORKSPACE_ID,
        }),
      }),
    )
  })

  it('sets status to Active by default', async () => {
    vi.mocked(prisma.department.findFirst).mockResolvedValueOnce(null as never)
    vi.mocked(prisma.department.create).mockResolvedValueOnce({
      id: DEPT_ID,
      name: 'Finance',
      status: 'Active',
      createdAt: new Date(),
    } as never)

    const result = await createDepartment({
      workspaceId: WORKSPACE_ID,
      input: { name: 'Finance' },
      actorUserId: ACTOR_ID,
    })

    expect(result.status).toBe('Active')
    // Verify data passed to create includes status: 'Active'
    expect(prisma.department.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'Active' }),
      }),
    )
  })
})

// ---------------------------------------------------------------------------
// getDepartmentById
// ---------------------------------------------------------------------------

describe('getDepartmentById', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns department detail with active employee list', async () => {
    vi.mocked(prisma.department.findFirst).mockResolvedValueOnce({
      ...mockDeptRecord,
      employees: [mockEmployee],
    } as never)

    const result = await getDepartmentById(WORKSPACE_ID, DEPT_ID)

    expect(result.id).toBe(DEPT_ID)
    expect(result.name).toBe('Engineering')
    expect(result.employees).toHaveLength(1)
    expect(result.employees[0].employeeCode).toBe('EMP-2024-0001')
    expect(result.employees[0].fullName).toBe('John Doe')
    expect(result.employeeCount).toBe(1)
  })

  it('returns department with empty employee list', async () => {
    vi.mocked(prisma.department.findFirst).mockResolvedValueOnce({
      ...mockDeptRecord,
      employees: [],
    } as never)

    const result = await getDepartmentById(WORKSPACE_ID, DEPT_ID)

    expect(result.employees).toEqual([])
    expect(result.employeeCount).toBe(0)
  })

  it('throws NotFoundError when department does not exist', async () => {
    vi.mocked(prisma.department.findFirst).mockResolvedValueOnce(null as never)

    await expect(getDepartmentById(WORKSPACE_ID, 'non-existent')).rejects.toThrow(NotFoundError)
  })

  it('queries with both id and workspaceId for isolation', async () => {
    vi.mocked(prisma.department.findFirst).mockResolvedValueOnce({
      ...mockDeptRecord,
      employees: [],
    } as never)

    await getDepartmentById(WORKSPACE_ID, DEPT_ID)

    expect(prisma.department.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: DEPT_ID, workspaceId: WORKSPACE_ID },
      }),
    )
  })

  it('maps updatedAt to ISO string', async () => {
    vi.mocked(prisma.department.findFirst).mockResolvedValueOnce({
      ...mockDeptRecord,
      updatedAt: new Date('2024-06-15T10:00:00Z'),
      employees: [],
    } as never)

    const result = await getDepartmentById(WORKSPACE_ID, DEPT_ID)

    expect(result.updatedAt).toBe('2024-06-15T10:00:00.000Z')
  })
})

// ---------------------------------------------------------------------------
// updateDepartment
// ---------------------------------------------------------------------------

describe('updateDepartment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never)
  })

  it('updates department name and writes update_department audit', async () => {
    // findFirst for existence check
    vi.mocked(prisma.department.findFirst)
      .mockResolvedValueOnce({ ...mockDeptRecord } as never) // existence check
      .mockResolvedValueOnce(null as never) // name uniqueness check (no duplicate)

    vi.mocked(prisma.department.update).mockResolvedValueOnce({
      ...mockDeptRecord,
      name: 'Platform Engineering',
      employees: [],
    } as never)

    const result = await updateDepartment({
      workspaceId: WORKSPACE_ID,
      departmentId: DEPT_ID,
      input: { name: 'Platform Engineering' },
      actorUserId: ACTOR_ID,
    })

    expect(result.name).toBe('Platform Engineering')
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'update_department',
          entityType: 'Department',
          entityId: DEPT_ID,
        }),
      }),
    )
  })

  it('deactivates department and writes deactivate_department audit', async () => {
    vi.mocked(prisma.department.findFirst).mockResolvedValueOnce({
      ...mockDeptRecord,
      status: 'Active',
    } as never)

    vi.mocked(prisma.department.update).mockResolvedValueOnce({
      ...mockDeptRecord,
      status: 'Inactive',
      employees: [],
    } as never)

    const result = await updateDepartment({
      workspaceId: WORKSPACE_ID,
      departmentId: DEPT_ID,
      input: { status: 'Inactive' },
      actorUserId: ACTOR_ID,
    })

    expect(result.status).toBe('Inactive')
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'deactivate_department',
        }),
      }),
    )
  })

  it('deactivation is allowed even when department has active employees (R8.4)', async () => {
    const deptWithEmployees = {
      ...mockDeptRecord,
      status: 'Active',
    }

    vi.mocked(prisma.department.findFirst).mockResolvedValueOnce(deptWithEmployees as never)

    vi.mocked(prisma.department.update).mockResolvedValueOnce({
      ...mockDeptRecord,
      status: 'Inactive',
      employees: [mockEmployee], // still has employees — deactivation not blocked
    } as never)

    // Should not throw
    const result = await updateDepartment({
      workspaceId: WORKSPACE_ID,
      departmentId: DEPT_ID,
      input: { status: 'Inactive' },
      actorUserId: ACTOR_ID,
    })

    expect(result.status).toBe('Inactive')
    // Employees still listed in the response (they keep their dept assignment)
    expect(result.employees).toHaveLength(1)
  })

  it('throws NotFoundError when department does not exist', async () => {
    vi.mocked(prisma.department.findFirst).mockResolvedValueOnce(null as never)

    await expect(
      updateDepartment({
        workspaceId: WORKSPACE_ID,
        departmentId: 'non-existent',
        input: { name: 'New Name' },
        actorUserId: ACTOR_ID,
      }),
    ).rejects.toThrow(NotFoundError)
  })

  it('throws ConflictError when updating to a duplicate name', async () => {
    vi.mocked(prisma.department.findFirst)
      .mockResolvedValueOnce({ ...mockDeptRecord } as never) // existence check
      .mockResolvedValueOnce({ id: 'other-dept' } as never) // uniqueness check finds duplicate

    await expect(
      updateDepartment({
        workspaceId: WORKSPACE_ID,
        departmentId: DEPT_ID,
        input: { name: 'HR' }, // already exists
        actorUserId: ACTOR_ID,
      }),
    ).rejects.toThrow(ConflictError)
  })

  it('re-activating a department writes update_department audit (not deactivate)', async () => {
    vi.mocked(prisma.department.findFirst).mockResolvedValueOnce({
      ...mockDeptRecord,
      status: 'Inactive',
    } as never)

    vi.mocked(prisma.department.update).mockResolvedValueOnce({
      ...mockDeptRecord,
      status: 'Active',
      employees: [],
    } as never)

    await updateDepartment({
      workspaceId: WORKSPACE_ID,
      departmentId: DEPT_ID,
      input: { status: 'Active' },
      actorUserId: ACTOR_ID,
    })

    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'update_department',
        }),
      }),
    )
  })

  it('does not write audit with oldValue/newValue when nothing actually changed', async () => {
    // Same name → no change
    vi.mocked(prisma.department.findFirst)
      .mockResolvedValueOnce({ ...mockDeptRecord, name: 'Engineering' } as never) // existence
      .mockResolvedValueOnce(null as never) // name uniqueness (no conflict with self excluded)

    vi.mocked(prisma.department.update).mockResolvedValueOnce({
      ...mockDeptRecord,
      name: 'Engineering',
      employees: [],
    } as never)

    await updateDepartment({
      workspaceId: WORKSPACE_ID,
      departmentId: DEPT_ID,
      input: { name: 'Engineering' },
      actorUserId: ACTOR_ID,
    })

    // Audit should have been written, but old/new value may be empty
    expect(prisma.auditLog.create).toHaveBeenCalledOnce()
    const callArg = vi.mocked(prisma.auditLog.create).mock.calls[0][0] as {
      data: Record<string, unknown>
    }
    // oldValue and newValue should both be undefined (no actual change)
    expect(callArg.data['oldValue']).toBeUndefined()
    expect(callArg.data['newValue']).toBeUndefined()
  })
})
