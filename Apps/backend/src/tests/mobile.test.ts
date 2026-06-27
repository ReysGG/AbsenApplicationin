/**
 * mobile.test.ts — Unit tests for the mobile self-service module.
 *
 * Covers the security-critical paths added for the mobile API:
 *   - check-in: server-side geofence (reject outside radius, accept inside)
 *   - check-in: face/liveness gate
 *   - check-in: double check-in conflict + updates an existing same-day
 *     placeholder (absentJob) instead of duplicating
 *   - check-out: requires a prior check-in; rejects double check-out
 *   - leave: overlap rejection; cancel only own Pending request
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mock prisma BEFORE importing the service
// ---------------------------------------------------------------------------

vi.mock('../config/prisma', () => {
  const attendanceLog = {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  }
  const shift = { findUnique: vi.fn() }
  const location = { findFirst: vi.fn() }
  const employeeWfhLocation = { findMany: vi.fn() }
  const leaveRequest = {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  }
  const base = { attendanceLog, shift, location, employeeWfhLocation, leaveRequest }
  return {
    // `$transaction(fn)` executes the callback with the same mocked client so
    // unit tests don't need a real DB; isolation-level options are ignored.
    prisma: {
      ...base,
      $transaction: vi.fn(async (fn: (tx: typeof base) => unknown) => fn(base)),
    },
  }
})

vi.mock('../config/env', () => ({
  env: {
    NODE_ENV: 'test',
    INTERNAL_JWT_SECRET: 'test-secret-minimum-32-characters-long-ok',
  },
}))

// ---------------------------------------------------------------------------
import { prisma } from '../config/prisma'
import { checkIn, checkOut, createMyLeaveRequest, cancelMyLeaveRequest } from '../modules/mobile/mobile.service'
import { ValidationError, ConflictError, NotFoundError } from '../lib/errors'
import type { MobileEmployee } from '../types/auth'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const WORKSPACE_ID = 'ws-1'
const EMPLOYEE_ID = 'emp-1'
const SHIFT_ID = 'shift-1'
const LOCATION_ID = 'loc-1'

const employee: MobileEmployee = {
  id: EMPLOYEE_ID,
  workspaceId: WORKSPACE_ID,
  userId: 'user-1',
  employeeCode: 'EMP-0001',
  fullName: 'Test User',
  email: 'test@attendx.dev',
  position: 'Engineer',
  departmentId: 'dept-1',
  departmentName: 'Engineering',
  workMode: 'WFO',
  faceProfileStatus: 'Registered',
  assignedLocationId: LOCATION_ID,
  assignedShiftId: SHIFT_ID,
}

// Office at Jakarta, 100m radius
const officeLocation = {
  id: LOCATION_ID,
  workspaceId: WORKSPACE_ID,
  name: 'Kantor Jakarta',
  type: 'Office',
  address: 'Jl. Sudirman',
  latitude: -6.2088,
  longitude: 106.8456,
  radiusMeters: 100,
  status: 'Active',
}

const shiftRow = {
  id: SHIFT_ID,
  name: 'Shift Pagi',
  startTime: '08:00',
  endTime: '17:00',
  gracePeriodMinutes: 10,
  checkoutToleranceMinutes: 60,
  workDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
}

const createdRow = {
  id: 'att-1',
  attendanceDate: new Date('2026-06-09'),
  status: 'Present',
  workMode: 'WFO',
  checkInAt: new Date('2026-06-09T01:00:00Z'),
  checkOutAt: null,
  checkInLatitude: -6.2088,
  checkInLongitude: 106.8456,
  checkOutLatitude: null,
  checkOutLongitude: null,
  faceCheckStatus: 'Passed',
  geofenceStatus: 'Valid',
  syncStatus: 'Synced',
  shift: { name: 'Shift Pagi' },
  location: { name: 'Kantor Jakarta' },
}

const validInput = {
  workMode: 'wfo' as const,
  latitude: -6.2088,
  longitude: 106.8456,
  faceVerified: true,
  livenessPassed: true,
  isMocked: false,
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// check-in
// ---------------------------------------------------------------------------

describe('checkIn — geofence', () => {
  it('rejects a location outside the geofence radius', async () => {
    ;(prisma.attendanceLog.findFirst as any).mockResolvedValue(null) // no existing
    ;(prisma.shift.findUnique as any).mockResolvedValue(shiftRow)
    ;(prisma.location.findFirst as any).mockResolvedValue(officeLocation)

    // Valid coordinates but ~440km away (Central Java) — exercises the geofence
    // check specifically (not coordinate-sanity rejection).
    await expect(
      checkIn(employee, { ...validInput, latitude: -7.5, longitude: 110.5 }),
    ).rejects.toBeInstanceOf(ValidationError)
    expect(prisma.attendanceLog.create).not.toHaveBeenCalled()
  })

  it('accepts a location inside the geofence radius', async () => {
    ;(prisma.attendanceLog.findFirst as any).mockResolvedValue(null)
    ;(prisma.shift.findUnique as any).mockResolvedValue(shiftRow)
    ;(prisma.location.findFirst as any).mockResolvedValue(officeLocation)
    ;(prisma.attendanceLog.create as any).mockResolvedValue(createdRow)

    const result = await checkIn(employee, validInput)
    expect(result.id).toBe('att-1')
    expect(prisma.attendanceLog.create).toHaveBeenCalledOnce()
  })

  it('rejects when face/liveness fails', async () => {
    ;(prisma.attendanceLog.findFirst as any).mockResolvedValue(null)
    ;(prisma.shift.findUnique as any).mockResolvedValue(shiftRow)
    ;(prisma.location.findFirst as any).mockResolvedValue(officeLocation)

    await expect(
      checkIn(employee, { ...validInput, faceVerified: false }),
    ).rejects.toBeInstanceOf(ValidationError)
  })
})

describe('checkIn — same-day handling', () => {
  it('rejects a second check-in when one already has checkInAt', async () => {
    ;(prisma.attendanceLog.findFirst as any).mockResolvedValue({
      id: 'att-existing',
      checkInAt: new Date('2026-06-09T01:00:00Z'),
    })

    await expect(checkIn(employee, validInput)).rejects.toBeInstanceOf(ConflictError)
  })

  it('updates an existing placeholder (absentJob) instead of creating a duplicate', async () => {
    // Placeholder row exists for today with no checkInAt.
    ;(prisma.attendanceLog.findFirst as any).mockResolvedValue({
      id: 'att-placeholder',
      checkInAt: null,
    })
    ;(prisma.shift.findUnique as any).mockResolvedValue(shiftRow)
    ;(prisma.location.findFirst as any).mockResolvedValue(officeLocation)
    ;(prisma.attendanceLog.update as any).mockResolvedValue({ ...createdRow, id: 'att-placeholder' })

    const result = await checkIn(employee, validInput)
    expect(result.id).toBe('att-placeholder')
    expect(prisma.attendanceLog.update).toHaveBeenCalledOnce()
    expect(prisma.attendanceLog.create).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// check-out
// ---------------------------------------------------------------------------

describe('checkOut', () => {
  it('rejects when there is no prior check-in', async () => {
    ;(prisma.attendanceLog.findFirst as any).mockResolvedValue(null)
    await expect(checkOut(employee, validInput)).rejects.toBeInstanceOf(ValidationError)
  })

  it('rejects a second check-out', async () => {
    ;(prisma.attendanceLog.findFirst as any).mockResolvedValue({
      id: 'att-1',
      checkInAt: new Date('2026-06-09T01:00:00Z'),
      checkOutAt: new Date('2026-06-09T09:00:00Z'),
    })
    await expect(checkOut(employee, validInput)).rejects.toBeInstanceOf(ConflictError)
  })

  it('succeeds for an open record', async () => {
    ;(prisma.attendanceLog.findFirst as any).mockResolvedValue({
      id: 'att-1',
      checkInAt: new Date('2026-06-09T01:00:00Z'),
      checkOutAt: null,
    })
    ;(prisma.attendanceLog.update as any).mockResolvedValue({
      ...createdRow,
      checkOutAt: new Date('2026-06-09T09:00:00Z'),
    })
    const result = await checkOut(employee, validInput)
    expect(result.checkOutAt).not.toBeNull()
    expect(prisma.attendanceLog.update).toHaveBeenCalledOnce()
  })
})

// ---------------------------------------------------------------------------
// leave
// ---------------------------------------------------------------------------

describe('leave requests', () => {
  it('rejects an overlapping leave request', async () => {
    ;(prisma.leaveRequest.findFirst as any).mockResolvedValue({ id: 'lv-existing' })
    await expect(
      createMyLeaveRequest(employee, {
        type: 'annual',
        startDate: '2026-06-20',
        endDate: '2026-06-21',
        reason: 'x',
      }),
    ).rejects.toBeInstanceOf(ConflictError)
  })

  it('creates a Pending request when there is no overlap', async () => {
    ;(prisma.leaveRequest.findFirst as any).mockResolvedValue(null)
    ;(prisma.leaveRequest.create as any).mockResolvedValue({
      id: 'lv-1',
      type: 'annual',
      startDate: new Date('2026-06-20'),
      endDate: new Date('2026-06-21'),
      reason: 'Liburan',
      status: 'Pending',
      attachmentUrl: null,
      notes: null,
      createdAt: new Date('2026-06-09'),
    })
    const result = await createMyLeaveRequest(employee, {
      type: 'annual',
      startDate: '2026-06-20',
      endDate: '2026-06-21',
      reason: 'Liburan',
    })
    expect(result.status).toBe('pending')
  })

  it('rejects cancelling a non-Pending request', async () => {
    ;(prisma.leaveRequest.findFirst as any).mockResolvedValue({
      id: 'lv-1',
      status: 'Approved',
    })
    await expect(cancelMyLeaveRequest(employee, 'lv-1')).rejects.toBeInstanceOf(ConflictError)
  })

  it('404s when cancelling a request that is not the employee’s', async () => {
    ;(prisma.leaveRequest.findFirst as any).mockResolvedValue(null)
    await expect(cancelMyLeaveRequest(employee, 'lv-x')).rejects.toBeInstanceOf(NotFoundError)
  })
})
