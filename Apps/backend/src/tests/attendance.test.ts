/**
 * attendance.test.ts — Unit tests for the Attendance service.
 *
 * Requirements validated: 6.1, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 16.2, 16.7
 *
 * Tests:
 *   - List with date filter → correct results
 *   - List with status filter
 *   - List with scope filter applied
 *   - Get by ID → success
 *   - Get by ID — out of scope → 404
 *   - Admin note → updates notes, preserves all timestamps
 *   - Admin note → too long → 400 (via Zod schema)
 *   - Admin note → not found → 404
 *   - Admin note → writes audit log (admin_note_attendance)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mock prisma BEFORE importing service
// ---------------------------------------------------------------------------

vi.mock('../config/prisma', () => {
  const attendanceLog = {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  }
  const auditLog = { create: vi.fn() }
  return {
    prisma: { attendanceLog, auditLog },
  }
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
import { listAttendance, getAttendanceById, addAdjustmentNote } from '../modules/attendance/attendance.service'
import { NotFoundError, ValidationError } from '../lib/errors'
import { adjustmentNoteSchema } from '../modules/attendance/attendance.schema'
import type { ScopeFilter } from '../types/auth'

// ---------------------------------------------------------------------------
// Test constants
// ---------------------------------------------------------------------------

const WORKSPACE_ID = 'ws-test-123'
const ACTOR_ID = 'user-actor-456'
const ATTENDANCE_ID = 'att-001'
const EMPLOYEE_ID = 'emp-001'
const DEPT_ID = 'dept-001'
const LOC_ID = 'loc-001'
const SHIFT_ID = 'shift-001'

const workspaceScopeFilter: ScopeFilter = {
  departmentIds: [],
  locationIds: [],
  isWorkspaceScope: true,
}

const restrictedScopeFilter: ScopeFilter = {
  departmentIds: [DEPT_ID],
  locationIds: [],
  isWorkspaceScope: false,
}

const baseLog = {
  id: ATTENDANCE_ID,
  workspaceId: WORKSPACE_ID,
  employeeId: EMPLOYEE_ID,
  attendanceDate: new Date('2024-07-01T00:00:00.000Z'),
  shiftId: SHIFT_ID,
  checkInAt: new Date('2024-07-01T08:05:00.000Z'),
  checkOutAt: new Date('2024-07-01T17:10:00.000Z'),
  checkInLatitude: -6.2,
  checkInLongitude: 106.8,
  checkOutLatitude: -6.2,
  checkOutLongitude: 106.8,
  locationId: LOC_ID,
  workMode: 'WFO',
  faceCheckStatus: 'Passed',
  geofenceStatus: 'Valid',
  spoofingStatus: 'Clean',
  syncStatus: 'Synced',
  originalCheckInAt: new Date('2024-07-01T08:00:00.000Z'),
  syncedAt: new Date('2024-07-01T08:05:00.000Z'),
  status: 'Present',
  isDuplicate: false,
  notes: null,
  createdAt: new Date('2024-07-01T08:05:00.000Z'),
  updatedAt: new Date('2024-07-01T08:05:00.000Z'),
  employee: {
    fullName: 'John Doe',
    employeeCode: 'EMP-2024-0001',
    departmentId: DEPT_ID,
    department: { name: 'Engineering' },
  },
  shift: { name: 'Morning Shift' },
  location: { name: 'Head Office' },
}

// Helper to reset all mocks cleanly
function resetAllMocks() {
  vi.mocked(prisma.attendanceLog.findMany).mockReset()
  vi.mocked(prisma.attendanceLog.findFirst).mockReset()
  vi.mocked(prisma.attendanceLog.update).mockReset()
  vi.mocked(prisma.attendanceLog.count).mockReset()
  vi.mocked(prisma.auditLog.create).mockReset().mockResolvedValue({} as never)
}

// ---------------------------------------------------------------------------
// listAttendance
// ---------------------------------------------------------------------------

describe('listAttendance', () => {
  beforeEach(resetAllMocks)

  it('returns paginated list with correct fields (R6.1, R6.5)', async () => {
    vi.mocked(prisma.attendanceLog.count).mockResolvedValueOnce(1 as never)
    vi.mocked(prisma.attendanceLog.findMany).mockResolvedValueOnce([baseLog] as never)

    const result = await listAttendance({
      workspaceId: WORKSPACE_ID,
      page: 1,
      pageSize: 25,
      scopeFilter: workspaceScopeFilter,
    })

    expect(result.items).toHaveLength(1)
    expect(result.items[0].id).toBe(ATTENDANCE_ID)
    expect(result.items[0].employeeName).toBe('John Doe')
    expect(result.items[0].employeeCode).toBe('EMP-2024-0001')
    expect(result.items[0].departmentName).toBe('Engineering')
    expect(result.items[0].shiftName).toBe('Morning Shift')
    expect(result.items[0].locationName).toBe('Head Office')
    // R6.5 — original vs sync time
    expect(result.items[0].originalCheckInAt).toBe('2024-07-01T08:00:00.000Z')
    expect(result.items[0].syncedAt).toBe('2024-07-01T08:05:00.000Z')
    expect(result.items[0].syncStatus).toBe('Synced')
    expect(result.pagination.total).toBe(1)
    expect(result.pagination.page).toBe(1)
    expect(result.pagination.page_size).toBe(25)
  })

  it('applies date range filter (R6.3)', async () => {
    vi.mocked(prisma.attendanceLog.count).mockResolvedValueOnce(0 as never)
    vi.mocked(prisma.attendanceLog.findMany).mockResolvedValueOnce([] as never)

    await listAttendance({
      workspaceId: WORKSPACE_ID,
      startDate: '2024-07-01',
      endDate: '2024-07-07',
      page: 1,
      pageSize: 25,
      scopeFilter: workspaceScopeFilter,
    })

    const countCall = vi.mocked(prisma.attendanceLog.count).mock.calls[0]?.[0] as {
      where: Record<string, unknown>
    }
    const dateFilter = countCall.where['attendanceDate'] as { gte: Date; lte: Date }
    expect(dateFilter.gte).toEqual(new Date('2024-07-01T00:00:00.000Z'))
    expect(dateFilter.lte).toEqual(new Date('2024-07-07T23:59:59.999Z'))
  })

  it('throws ValidationError when end_date < start_date', async () => {
    await expect(
      listAttendance({
        workspaceId: WORKSPACE_ID,
        startDate: '2024-07-10',
        endDate: '2024-07-01',
        page: 1,
        pageSize: 25,
        scopeFilter: workspaceScopeFilter,
      }),
    ).rejects.toThrow(ValidationError)
  })

  it('filters by status (R6.4)', async () => {
    vi.mocked(prisma.attendanceLog.count).mockResolvedValueOnce(2 as never)
    vi.mocked(prisma.attendanceLog.findMany).mockResolvedValueOnce([
      { ...baseLog, status: 'Late' },
      { ...baseLog, id: 'att-002', status: 'Late' },
    ] as never)

    await listAttendance({
      workspaceId: WORKSPACE_ID,
      status: 'Late',
      page: 1,
      pageSize: 25,
      scopeFilter: workspaceScopeFilter,
    })

    const countCall = vi.mocked(prisma.attendanceLog.count).mock.calls[0]?.[0] as {
      where: Record<string, unknown>
    }
    expect(countCall.where['status']).toBe('Late')
  })

  it('does not filter by status when status is "all" (R6.4)', async () => {
    vi.mocked(prisma.attendanceLog.count).mockResolvedValueOnce(0 as never)
    vi.mocked(prisma.attendanceLog.findMany).mockResolvedValueOnce([] as never)

    await listAttendance({
      workspaceId: WORKSPACE_ID,
      status: 'all',
      page: 1,
      pageSize: 25,
      scopeFilter: workspaceScopeFilter,
    })

    const countCall = vi.mocked(prisma.attendanceLog.count).mock.calls[0]?.[0] as {
      where: Record<string, unknown>
    }
    expect(countCall.where['status']).toBeUndefined()
  })

  it('applies scope filter via employee relation (R6.3)', async () => {
    vi.mocked(prisma.attendanceLog.count).mockResolvedValueOnce(0 as never)
    vi.mocked(prisma.attendanceLog.findMany).mockResolvedValueOnce([] as never)

    await listAttendance({
      workspaceId: WORKSPACE_ID,
      page: 1,
      pageSize: 25,
      scopeFilter: restrictedScopeFilter,
    })

    const countCall = vi.mocked(prisma.attendanceLog.count).mock.calls[0]?.[0] as {
      where: Record<string, unknown>
    }
    // Should have OR with employee departmentId condition
    expect(countCall.where).toHaveProperty('OR')
    const orClauses = countCall.where['OR'] as Record<string, unknown>[]
    expect(orClauses.some(c => 
      (c['employee'] as Record<string, unknown>)?.['departmentId'] !== undefined
    )).toBe(true)
  })

  it('enforces workspace isolation (R6.9)', async () => {
    vi.mocked(prisma.attendanceLog.count).mockResolvedValueOnce(0 as never)
    vi.mocked(prisma.attendanceLog.findMany).mockResolvedValueOnce([] as never)

    await listAttendance({
      workspaceId: WORKSPACE_ID,
      page: 1,
      pageSize: 25,
      scopeFilter: workspaceScopeFilter,
    })

    const countCall = vi.mocked(prisma.attendanceLog.count).mock.calls[0]?.[0] as {
      where: Record<string, unknown>
    }
    expect(countCall.where['workspaceId']).toBe(WORKSPACE_ID)
  })

  it('returns empty list when no records match', async () => {
    vi.mocked(prisma.attendanceLog.count).mockResolvedValueOnce(0 as never)
    vi.mocked(prisma.attendanceLog.findMany).mockResolvedValueOnce([] as never)

    const result = await listAttendance({
      workspaceId: WORKSPACE_ID,
      page: 1,
      pageSize: 25,
      scopeFilter: workspaceScopeFilter,
    })

    expect(result.items).toEqual([])
    expect(result.pagination.total).toBe(0)
    expect(result.pagination.total_pages).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// getAttendanceById
// ---------------------------------------------------------------------------

describe('getAttendanceById', () => {
  beforeEach(resetAllMocks)

  it('returns attendance detail (R6.8, R6.9)', async () => {
    vi.mocked(prisma.attendanceLog.findFirst).mockResolvedValueOnce(baseLog as never)

    const result = await getAttendanceById(WORKSPACE_ID, ATTENDANCE_ID, workspaceScopeFilter)

    expect(result.id).toBe(ATTENDANCE_ID)
    expect(result.employeeName).toBe('John Doe')
    expect(result.status).toBe('Present')
    expect(result.checkInAt).toBe('2024-07-01T08:05:00.000Z')
    expect(result.originalCheckInAt).toBe('2024-07-01T08:00:00.000Z')
    expect(result.syncedAt).toBe('2024-07-01T08:05:00.000Z')
  })

  it('throws NotFoundError when record does not exist', async () => {
    vi.mocked(prisma.attendanceLog.findFirst).mockResolvedValueOnce(null as never)

    await expect(
      getAttendanceById(WORKSPACE_ID, 'non-existent', workspaceScopeFilter),
    ).rejects.toThrow(NotFoundError)
  })

  it('throws NotFoundError when record is out of scope (R6.9)', async () => {
    // findFirst returns null because scope filter excludes the record
    vi.mocked(prisma.attendanceLog.findFirst).mockResolvedValueOnce(null as never)

    const outOfScopeFilter: ScopeFilter = {
      departmentIds: ['dept-999'],
      locationIds: [],
      isWorkspaceScope: false,
    }

    await expect(
      getAttendanceById(WORKSPACE_ID, ATTENDANCE_ID, outOfScopeFilter),
    ).rejects.toThrow(NotFoundError)
  })

  it('always includes workspaceId in query (workspace isolation)', async () => {
    vi.mocked(prisma.attendanceLog.findFirst).mockResolvedValueOnce(baseLog as never)

    await getAttendanceById(WORKSPACE_ID, ATTENDANCE_ID)

    const call = vi.mocked(prisma.attendanceLog.findFirst).mock.calls[0]?.[0] as {
      where: Record<string, unknown>
    }
    expect(call.where['workspaceId']).toBe(WORKSPACE_ID)
  })
})

// ---------------------------------------------------------------------------
// addAdjustmentNote
// ---------------------------------------------------------------------------

describe('addAdjustmentNote', () => {
  beforeEach(resetAllMocks)

  it('updates only the notes field and preserves all timestamps (R6.6)', async () => {
    vi.mocked(prisma.attendanceLog.findFirst)
      .mockResolvedValueOnce({ id: ATTENDANCE_ID, notes: null, workspaceId: WORKSPACE_ID } as never)
      .mockResolvedValueOnce({ ...baseLog, notes: 'Admin correction' } as never)
    vi.mocked(prisma.attendanceLog.update).mockResolvedValueOnce({
      ...baseLog,
      notes: 'Admin correction',
    } as never)

    const result = await addAdjustmentNote({
      workspaceId: WORKSPACE_ID,
      attendanceId: ATTENDANCE_ID,
      input: { note: 'Admin correction' },
      actorUserId: ACTOR_ID,
      scopeFilter: workspaceScopeFilter,
    })

    // Update was called with ONLY notes — no timestamps or status changed (R6.6)
    const updateCall = vi.mocked(prisma.attendanceLog.update).mock.calls[0]?.[0] as {
      where: Record<string, unknown>
      data: Record<string, unknown>
    }
    expect(updateCall.data).toEqual({ notes: 'Admin correction' })
    expect(updateCall.data['checkInAt']).toBeUndefined()
    expect(updateCall.data['checkOutAt']).toBeUndefined()
    expect(updateCall.data['status']).toBeUndefined()
    expect(result.notes).toBe('Admin correction')
  })

  it('writes admin_note_attendance audit log (R6.7, R14.1)', async () => {
    vi.mocked(prisma.attendanceLog.findFirst)
      .mockResolvedValueOnce({ id: ATTENDANCE_ID, notes: null, workspaceId: WORKSPACE_ID } as never)
      .mockResolvedValueOnce({ ...baseLog, notes: 'Note text' } as never)
    vi.mocked(prisma.attendanceLog.update).mockResolvedValueOnce({} as never)

    await addAdjustmentNote({
      workspaceId: WORKSPACE_ID,
      attendanceId: ATTENDANCE_ID,
      input: { note: 'Note text' },
      actorUserId: ACTOR_ID,
      scopeFilter: workspaceScopeFilter,
    })

    expect(vi.mocked(prisma.auditLog.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'admin_note_attendance',
          entityType: 'AttendanceLog',
          entityId: ATTENDANCE_ID,
          workspaceId: WORKSPACE_ID,
          actorUserId: ACTOR_ID,
          newValue: { notes: 'Note text' },
          oldValue: { notes: null },
        }),
      }),
    )
  })

  it('throws NotFoundError when attendance record not found', async () => {
    vi.mocked(prisma.attendanceLog.findFirst).mockResolvedValueOnce(null as never)

    await expect(
      addAdjustmentNote({
        workspaceId: WORKSPACE_ID,
        attendanceId: 'non-existent',
        input: { note: 'Some note' },
        actorUserId: ACTOR_ID,
        scopeFilter: workspaceScopeFilter,
      }),
    ).rejects.toThrow(NotFoundError)
  })

  it('throws NotFoundError when record is out of scope', async () => {
    vi.mocked(prisma.attendanceLog.findFirst).mockResolvedValueOnce(null as never)

    const outOfScopeFilter: ScopeFilter = {
      departmentIds: ['dept-999'],
      locationIds: [],
      isWorkspaceScope: false,
    }

    await expect(
      addAdjustmentNote({
        workspaceId: WORKSPACE_ID,
        attendanceId: ATTENDANCE_ID,
        input: { note: 'Some note' },
        actorUserId: ACTOR_ID,
        scopeFilter: outOfScopeFilter,
      }),
    ).rejects.toThrow(NotFoundError)
  })
})

// ---------------------------------------------------------------------------
// adjustmentNoteSchema — Zod validation
// ---------------------------------------------------------------------------

describe('adjustmentNoteSchema', () => {
  it('accepts valid note', () => {
    const result = adjustmentNoteSchema.safeParse({ note: 'Valid note text' })
    expect(result.success).toBe(true)
  })

  it('rejects empty note (min 1 char)', () => {
    const result = adjustmentNoteSchema.safeParse({ note: '' })
    expect(result.success).toBe(false)
  })

  it('rejects note that is too long (max 1000 chars)', () => {
    const result = adjustmentNoteSchema.safeParse({ note: 'a'.repeat(1001) })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/1000/)
    }
  })

  it('accepts note at exactly 1000 chars', () => {
    const result = adjustmentNoteSchema.safeParse({ note: 'a'.repeat(1000) })
    expect(result.success).toBe(true)
  })

  it('trims whitespace', () => {
    const result = adjustmentNoteSchema.safeParse({ note: '  trimmed  ' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.note).toBe('trimmed')
    }
  })

  it('rejects whitespace-only note (becomes empty after trim)', () => {
    const result = adjustmentNoteSchema.safeParse({ note: '   ' })
    expect(result.success).toBe(false)
  })
})
