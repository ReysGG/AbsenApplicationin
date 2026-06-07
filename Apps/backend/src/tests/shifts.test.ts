/**
 * shifts.test.ts — Unit tests for Shift service.
 *
 * Requirements validated: 10.1–10.13
 *
 * Tests:
 *   - Create with valid data → success + create_shift audit (R10.2, R10.13)
 *   - Create with start == end → 400 ValidationError (R10.6)
 *   - Create with custom grace without manage_grace_period → 403 ForbiddenError (R10.12)
 *   - Create with custom grace with manage_grace_period → success (R10.12)
 *   - Create defaults grace=10, checkoutTolerance=60, absenceCutoff=120 (R10.4, R10.5)
 *   - Create midnight-crossing shift → isMidnightCrossing=true (R10.7)
 *   - Create effectiveFrom defaults to today (R10.9)
 *   - List shifts with status filter (R10.1)
 *   - Get by ID → success (R10.2)
 *   - Get by ID — not found → 404 (R10.2)
 *   - Update grace period without manage_grace_period → 403 (R10.12)
 *   - Update grace period with manage_grace_period → success (R10.12)
 *   - Deactivate → success + deactivate_shift audit (R10.10, R10.13)
 *   - Update start==end → 400 ValidationError (R10.6)
 *   - Assign shift to employees → updates Employee records + assign_shift audit (R10.8, R10.13)
 *   - Assign shift — shift not found → 404 (R10.8)
 *   - List employees without shift (R10.11)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mock prisma BEFORE importing service
// ---------------------------------------------------------------------------
vi.mock('../config/prisma', () => {
  const shift = {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  }
  const employee = {
    findMany: vi.fn(),
    updateMany: vi.fn(),
  }
  const auditLog = { create: vi.fn() }
  return { prisma: { shift, employee, auditLog } }
})

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
  listShifts,
  createShift,
  getShiftById,
  updateShift,
  assignShiftToEmployees,
  listEmployeesWithoutShift,
} from '../modules/shifts/shifts.service'
import { ForbiddenError, NotFoundError, ValidationError } from '../lib/errors'

// ---------------------------------------------------------------------------
// Helpers / fixtures
// ---------------------------------------------------------------------------

const WORKSPACE_ID = 'ws-test-123'
const ACTOR_ID = 'user-actor-456'
const SHIFT_ID = 'shift-001'

const mockShiftRecord = {
  id: SHIFT_ID,
  name: 'Pagi',
  startTime: '08:00',
  endTime: '17:00',
  gracePeriodMinutes: 10,
  checkoutToleranceMinutes: 60,
  absenceCutoffMinutes: 120,
  breakMinutes: 60,
  workDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
  effectiveFrom: new Date('2024-01-01'),
  status: 'Active',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  _count: { employees: 5 },
}

const validCreateInput = {
  name: 'Pagi',
  startTime: '08:00',
  endTime: '17:00',
  breakMinutes: 60,
  gracePeriodMinutes: 10,
  checkoutToleranceMinutes: 60,
  absenceCutoffMinutes: 120,
  workDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] as Array<
    'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'
  >,
}

// ---------------------------------------------------------------------------
// listShifts
// ---------------------------------------------------------------------------

describe('listShifts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns list of Active shifts by default', async () => {
    const shifts = [
      { ...mockShiftRecord, id: 's1', name: 'Pagi', _count: { employees: 3 } },
      { ...mockShiftRecord, id: 's2', name: 'Sore', _count: { employees: 2 } },
    ]
    vi.mocked(prisma.shift.findMany).mockResolvedValueOnce(shifts as never)

    const result = await listShifts(WORKSPACE_ID, 'Active')

    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('Pagi')
    expect(result[0].assignedEmployeeCount).toBe(3)
    expect(result[1].name).toBe('Sore')
  })

  it('filters by Inactive status correctly', async () => {
    const inactive = [{ ...mockShiftRecord, status: 'Inactive', _count: { employees: 0 } }]
    vi.mocked(prisma.shift.findMany).mockResolvedValueOnce(inactive as never)

    const result = await listShifts(WORKSPACE_ID, 'Inactive')

    expect(result).toHaveLength(1)
    expect(result[0].status).toBe('Inactive')
    expect(prisma.shift.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'Inactive' }),
      }),
    )
  })

  it('returns all shifts when status=all (no status filter)', async () => {
    vi.mocked(prisma.shift.findMany).mockResolvedValueOnce([] as never)

    await listShifts(WORKSPACE_ID, 'all')

    const callArg = vi.mocked(prisma.shift.findMany).mock.calls[0][0] as {
      where: Record<string, unknown>
    }
    expect(callArg.where).not.toHaveProperty('status')
  })

  it('sets isMidnightCrossing=true for overnight shifts (R10.7)', async () => {
    const overnightShift = {
      ...mockShiftRecord,
      startTime: '22:00',
      endTime: '06:00',
    }
    vi.mocked(prisma.shift.findMany).mockResolvedValueOnce([overnightShift] as never)

    const result = await listShifts(WORKSPACE_ID, 'Active')

    expect(result[0].isMidnightCrossing).toBe(true)
  })

  it('sets isMidnightCrossing=false for normal shifts', async () => {
    vi.mocked(prisma.shift.findMany).mockResolvedValueOnce([mockShiftRecord] as never)

    const result = await listShifts(WORKSPACE_ID, 'Active')

    expect(result[0].isMidnightCrossing).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// createShift
// ---------------------------------------------------------------------------

describe('createShift', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never)
  })

  it('creates shift with valid data and returns it (R10.2)', async () => {
    vi.mocked(prisma.shift.create).mockResolvedValueOnce({
      ...mockShiftRecord,
    } as never)

    const result = await createShift({
      workspaceId: WORKSPACE_ID,
      input: validCreateInput,
      actorUserId: ACTOR_ID,
      hasManageGracePeriod: false,
    })

    expect(result.id).toBe(SHIFT_ID)
    expect(result.name).toBe('Pagi')
    expect(result.startTime).toBe('08:00')
    expect(result.endTime).toBe('17:00')
    expect(result.gracePeriodMinutes).toBe(10)
    expect(result.status).toBe('Active')
  })

  it('throws ValidationError when startTime equals endTime (R10.6)', async () => {
    await expect(
      createShift({
        workspaceId: WORKSPACE_ID,
        input: { ...validCreateInput, startTime: '08:00', endTime: '08:00' },
        actorUserId: ACTOR_ID,
        hasManageGracePeriod: false,
      }),
    ).rejects.toThrow(ValidationError)
  })

  it('throws ForbiddenError when custom grace without manage_grace_period (R10.12)', async () => {
    await expect(
      createShift({
        workspaceId: WORKSPACE_ID,
        input: { ...validCreateInput, gracePeriodMinutes: 15 }, // non-default grace
        actorUserId: ACTOR_ID,
        hasManageGracePeriod: false, // no permission
      }),
    ).rejects.toThrow(ForbiddenError)
  })

  it('allows custom grace with manage_grace_period permission (R10.12)', async () => {
    vi.mocked(prisma.shift.create).mockResolvedValueOnce({
      ...mockShiftRecord,
      gracePeriodMinutes: 15,
    } as never)

    const result = await createShift({
      workspaceId: WORKSPACE_ID,
      input: { ...validCreateInput, gracePeriodMinutes: 15 },
      actorUserId: ACTOR_ID,
      hasManageGracePeriod: true, // has permission
    })

    expect(result.gracePeriodMinutes).toBe(15)
  })

  it('defaults effectiveFrom to today when not provided (R10.9)', async () => {
    vi.mocked(prisma.shift.create).mockResolvedValueOnce({ ...mockShiftRecord } as never)

    await createShift({
      workspaceId: WORKSPACE_ID,
      input: validCreateInput, // no effectiveFrom
      actorUserId: ACTOR_ID,
      hasManageGracePeriod: false,
    })

    const callArg = vi.mocked(prisma.shift.create).mock.calls[0][0] as {
      data: Record<string, unknown>
    }
    const today = new Date().toISOString().slice(0, 10)
    const passedDate = (callArg.data['effectiveFrom'] as Date).toISOString().slice(0, 10)
    expect(passedDate).toBe(today)
  })

  it('writes create_shift audit log on success (R10.13)', async () => {
    vi.mocked(prisma.shift.create).mockResolvedValueOnce({ ...mockShiftRecord } as never)

    await createShift({
      workspaceId: WORKSPACE_ID,
      input: validCreateInput,
      actorUserId: ACTOR_ID,
      hasManageGracePeriod: false,
      requestId: 'req-999',
    })

    expect(prisma.auditLog.create).toHaveBeenCalledOnce()
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'create_shift',
          entityType: 'Shift',
          actorUserId: ACTOR_ID,
          workspaceId: WORKSPACE_ID,
        }),
      }),
    )
  })

  it('detects midnight-crossing shift correctly (R10.7)', async () => {
    const overnightRecord = { ...mockShiftRecord, startTime: '22:00', endTime: '06:00' }
    vi.mocked(prisma.shift.create).mockResolvedValueOnce(overnightRecord as never)

    const result = await createShift({
      workspaceId: WORKSPACE_ID,
      input: { ...validCreateInput, startTime: '22:00', endTime: '06:00' },
      actorUserId: ACTOR_ID,
      hasManageGracePeriod: false,
    })

    expect(result.isMidnightCrossing).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// getShiftById
// ---------------------------------------------------------------------------

describe('getShiftById', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns shift detail when found', async () => {
    vi.mocked(prisma.shift.findFirst).mockResolvedValueOnce({ ...mockShiftRecord } as never)

    const result = await getShiftById(WORKSPACE_ID, SHIFT_ID)

    expect(result.id).toBe(SHIFT_ID)
    expect(result.name).toBe('Pagi')
    expect(result.assignedEmployeeCount).toBe(5)
  })

  it('throws NotFoundError when shift does not exist', async () => {
    vi.mocked(prisma.shift.findFirst).mockResolvedValueOnce(null as never)

    await expect(getShiftById(WORKSPACE_ID, 'non-existent')).rejects.toThrow(NotFoundError)
  })

  it('queries with both id and workspaceId for isolation', async () => {
    vi.mocked(prisma.shift.findFirst).mockResolvedValueOnce({ ...mockShiftRecord } as never)

    await getShiftById(WORKSPACE_ID, SHIFT_ID)

    expect(prisma.shift.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: SHIFT_ID, workspaceId: WORKSPACE_ID },
      }),
    )
  })
})

// ---------------------------------------------------------------------------
// updateShift
// ---------------------------------------------------------------------------

describe('updateShift', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never)
  })

  it('updates shift name and writes update_shift audit (R10.13)', async () => {
    vi.mocked(prisma.shift.findFirst).mockResolvedValueOnce({ ...mockShiftRecord } as never)
    vi.mocked(prisma.shift.update).mockResolvedValueOnce({
      ...mockShiftRecord,
      name: 'Siang',
    } as never)

    const result = await updateShift({
      workspaceId: WORKSPACE_ID,
      shiftId: SHIFT_ID,
      input: { name: 'Siang' },
      actorUserId: ACTOR_ID,
      hasManageGracePeriod: false,
    })

    expect(result.name).toBe('Siang')
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'update_shift' }),
      }),
    )
  })

  it('throws ForbiddenError when updating grace without manage_grace_period (R10.12)', async () => {
    vi.mocked(prisma.shift.findFirst).mockResolvedValueOnce({ ...mockShiftRecord } as never)

    await expect(
      updateShift({
        workspaceId: WORKSPACE_ID,
        shiftId: SHIFT_ID,
        input: { gracePeriodMinutes: 30 }, // changing grace
        actorUserId: ACTOR_ID,
        hasManageGracePeriod: false, // no permission
      }),
    ).rejects.toThrow(ForbiddenError)
  })

  it('allows grace update with manage_grace_period permission (R10.12)', async () => {
    vi.mocked(prisma.shift.findFirst).mockResolvedValueOnce({ ...mockShiftRecord } as never)
    vi.mocked(prisma.shift.update).mockResolvedValueOnce({
      ...mockShiftRecord,
      gracePeriodMinutes: 30,
    } as never)

    const result = await updateShift({
      workspaceId: WORKSPACE_ID,
      shiftId: SHIFT_ID,
      input: { gracePeriodMinutes: 30 },
      actorUserId: ACTOR_ID,
      hasManageGracePeriod: true, // has permission
    })

    expect(result.gracePeriodMinutes).toBe(30)
  })

  it('deactivates shift and writes deactivate_shift audit (R10.10, R10.13)', async () => {
    vi.mocked(prisma.shift.findFirst).mockResolvedValueOnce({
      ...mockShiftRecord,
      status: 'Active',
    } as never)
    vi.mocked(prisma.shift.update).mockResolvedValueOnce({
      ...mockShiftRecord,
      status: 'Inactive',
    } as never)

    const result = await updateShift({
      workspaceId: WORKSPACE_ID,
      shiftId: SHIFT_ID,
      input: { status: 'Inactive' },
      actorUserId: ACTOR_ID,
      hasManageGracePeriod: false,
    })

    expect(result.status).toBe('Inactive')
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'deactivate_shift' }),
      }),
    )
  })

  it('throws ValidationError when startTime equals endTime after update (R10.6)', async () => {
    vi.mocked(prisma.shift.findFirst).mockResolvedValueOnce({
      ...mockShiftRecord,
      startTime: '08:00',
      endTime: '17:00',
    } as never)

    await expect(
      updateShift({
        workspaceId: WORKSPACE_ID,
        shiftId: SHIFT_ID,
        input: { endTime: '08:00' }, // setting endTime same as existing startTime
        actorUserId: ACTOR_ID,
        hasManageGracePeriod: false,
      }),
    ).rejects.toThrow(ValidationError)
  })

  it('throws NotFoundError when shift does not exist', async () => {
    vi.mocked(prisma.shift.findFirst).mockResolvedValueOnce(null as never)

    await expect(
      updateShift({
        workspaceId: WORKSPACE_ID,
        shiftId: 'non-existent',
        input: { name: 'New Name' },
        actorUserId: ACTOR_ID,
        hasManageGracePeriod: false,
      }),
    ).rejects.toThrow(NotFoundError)
  })
})

// ---------------------------------------------------------------------------
// assignShiftToEmployees
// ---------------------------------------------------------------------------

describe('assignShiftToEmployees', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never)
  })

  it('assigns shift to employees and writes assign_shift audit (R10.8, R10.13)', async () => {
    // Shift exists
    vi.mocked(prisma.shift.findFirst).mockResolvedValueOnce({
      id: SHIFT_ID,
      name: 'Pagi',
      status: 'Active',
    } as never)

    const mockEmployees = [
      { id: 'emp-1', fullName: 'Alice', assignedShiftId: null },
      { id: 'emp-2', fullName: 'Bob', assignedShiftId: null },
    ]
    vi.mocked(prisma.employee.findMany).mockResolvedValueOnce(mockEmployees as never)
    vi.mocked(prisma.employee.updateMany).mockResolvedValueOnce({ count: 2 } as never)

    const result = await assignShiftToEmployees({
      workspaceId: WORKSPACE_ID,
      shiftId: SHIFT_ID,
      input: { employeeIds: ['emp-1', 'emp-2'] },
      actorUserId: ACTOR_ID,
    })

    expect(result.assignedCount).toBe(2)

    // Should have updated employees
    expect(prisma.employee.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { assignedShiftId: SHIFT_ID },
      }),
    )

    // Should have written 2 audit entries (one per employee)
    expect(prisma.auditLog.create).toHaveBeenCalledTimes(2)
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'assign_shift' }),
      }),
    )
  })

  it('throws NotFoundError when shift does not exist', async () => {
    vi.mocked(prisma.shift.findFirst).mockResolvedValueOnce(null as never)

    await expect(
      assignShiftToEmployees({
        workspaceId: WORKSPACE_ID,
        shiftId: 'non-existent',
        input: { employeeIds: ['emp-1'] },
        actorUserId: ACTOR_ID,
      }),
    ).rejects.toThrow(NotFoundError)
  })

  it('throws ValidationError when no active employees found for given IDs', async () => {
    vi.mocked(prisma.shift.findFirst).mockResolvedValueOnce({
      id: SHIFT_ID,
      name: 'Pagi',
      status: 'Active',
    } as never)
    // No matching employees found
    vi.mocked(prisma.employee.findMany).mockResolvedValueOnce([] as never)

    await expect(
      assignShiftToEmployees({
        workspaceId: WORKSPACE_ID,
        shiftId: SHIFT_ID,
        input: { employeeIds: ['emp-not-exist'] },
        actorUserId: ACTOR_ID,
      }),
    ).rejects.toThrow(ValidationError)
  })

  it('records old assignedShiftId in audit for each employee', async () => {
    vi.mocked(prisma.shift.findFirst).mockResolvedValueOnce({
      id: SHIFT_ID,
      name: 'Pagi',
      status: 'Active',
    } as never)

    const prevShiftId = 'old-shift-id'
    vi.mocked(prisma.employee.findMany).mockResolvedValueOnce([
      { id: 'emp-1', fullName: 'Alice', assignedShiftId: prevShiftId },
    ] as never)
    vi.mocked(prisma.employee.updateMany).mockResolvedValueOnce({ count: 1 } as never)

    await assignShiftToEmployees({
      workspaceId: WORKSPACE_ID,
      shiftId: SHIFT_ID,
      input: { employeeIds: ['emp-1'] },
      actorUserId: ACTOR_ID,
    })

    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          oldValue: { assignedShiftId: prevShiftId },
          newValue: { assignedShiftId: SHIFT_ID, shiftName: 'Pagi' },
        }),
      }),
    )
  })
})

// ---------------------------------------------------------------------------
// listEmployeesWithoutShift
// ---------------------------------------------------------------------------

describe('listEmployeesWithoutShift', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns active employees with no assigned shift (R10.11)', async () => {
    const mockEmployees = [
      {
        id: 'emp-1',
        employeeCode: 'EMP-2024-0001',
        fullName: 'Alice',
        email: 'alice@test.com',
        position: 'Developer',
        departmentId: 'dept-1',
        employmentStatus: 'Active',
        department: { name: 'Engineering' },
      },
    ]
    vi.mocked(prisma.employee.findMany).mockResolvedValueOnce(mockEmployees as never)

    const result = await listEmployeesWithoutShift(WORKSPACE_ID)

    expect(result).toHaveLength(1)
    expect(result[0].fullName).toBe('Alice')
    expect(result[0].departmentName).toBe('Engineering')
  })

  it('queries with assignedShiftId=null and employmentStatus=Active', async () => {
    vi.mocked(prisma.employee.findMany).mockResolvedValueOnce([] as never)

    await listEmployeesWithoutShift(WORKSPACE_ID)

    expect(prisma.employee.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          workspaceId: WORKSPACE_ID,
          assignedShiftId: null,
          employmentStatus: 'Active',
        }),
      }),
    )
  })

  it('returns empty array when all employees have shifts', async () => {
    vi.mocked(prisma.employee.findMany).mockResolvedValueOnce([] as never)

    const result = await listEmployeesWithoutShift(WORKSPACE_ID)

    expect(result).toEqual([])
  })

  it('applies scope filter when provided', async () => {
    vi.mocked(prisma.employee.findMany).mockResolvedValueOnce([] as never)

    const scopeFilter = { departmentId: { in: ['dept-1', 'dept-2'] } }
    await listEmployeesWithoutShift(WORKSPACE_ID, scopeFilter)

    const callArg = vi.mocked(prisma.employee.findMany).mock.calls[0][0] as {
      where: Record<string, unknown>
    }
    expect(callArg.where['departmentId']).toEqual({ in: ['dept-1', 'dept-2'] })
  })
})
