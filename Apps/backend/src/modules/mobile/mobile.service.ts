/**
 * mobile.service.ts — self-service business logic for the mobile app.
 *
 * Every function is scoped to a single employee (the authenticated mobile
 * user). Nothing here reads or writes other employees' data.
 *
 * The DTO shapes returned here are the contract consumed by the Flutter app
 * (see Apps/app_flutter/lib/shared/models). Keep field names in sync.
 */

import { prisma } from '../../config/prisma'
import { NotFoundError, ValidationError, ConflictError } from '../../lib/errors'
import type { MobileEmployee } from '../../types/auth'

// ---------------------------------------------------------------------------
// DTO shapes (mirror Flutter models)
// ---------------------------------------------------------------------------

export interface AttendanceDto {
  id: string
  date: string // ISO date (yyyy-MM-dd)
  status: string // present | late | absent | pendingCheckout | missingCheckout | leave | invalid
  workMode: string // wfo | wfh
  shiftName: string
  checkInAt: string | null
  checkOutAt: string | null
  checkInLat: number | null
  checkInLng: number | null
  checkOutLat: number | null
  checkOutLng: number | null
  locationName: string | null
  faceStatus: string // passed | failed | pending | notRequired
  geofenceValid: boolean
  syncStatus: string // synced | pending | syncing | failed
}

export interface ShiftDto {
  id: string
  name: string
  startTime: string // HH:mm
  endTime: string // HH:mm
  gracePeriodMinutes: number
  checkoutToleranceMinutes: number
  workDays: string[]
}

export interface LocationDto {
  id: string
  name: string
  type: string
  address: string | null
  latitude: number
  longitude: number
  radiusMeters: number
}

// ---------------------------------------------------------------------------
// Enum mapping helpers (backend PascalCase → Flutter camelCase)
// ---------------------------------------------------------------------------

const STATUS_MAP: Record<string, string> = {
  Present: 'present',
  Late: 'late',
  Absent: 'absent',
  PendingCheckout: 'pendingCheckout',
  MissingCheckout: 'missingCheckout',
  Leave: 'leave',
  Invalid: 'invalid',
  Duplicate: 'invalid',
}

const WORKMODE_MAP: Record<string, string> = {
  WFO: 'wfo',
  WFH: 'wfh',
  Hybrid: 'wfo',
}

const FACE_MAP: Record<string, string> = {
  Passed: 'passed',
  Failed: 'failed',
  Skipped: 'notRequired',
}

const SYNC_MAP: Record<string, string> = {
  Synced: 'synced',
  SyncedLate: 'synced',
  Pending: 'pending',
}

interface AttendanceLogRow {
  id: string
  attendanceDate: Date
  status: string
  workMode: string | null
  checkInAt: Date | null
  checkOutAt: Date | null
  checkInLatitude: number | null
  checkInLongitude: number | null
  checkOutLatitude: number | null
  checkOutLongitude: number | null
  faceCheckStatus: string | null
  geofenceStatus: string | null
  syncStatus: string
  shift?: { name: string } | null
  location?: { name: string } | null
}

function toAttendanceDto(log: AttendanceLogRow): AttendanceDto {
  return {
    id: log.id,
    date: log.attendanceDate.toISOString().slice(0, 10),
    status: STATUS_MAP[log.status] ?? 'invalid',
    workMode: log.workMode ? WORKMODE_MAP[log.workMode] ?? 'wfo' : 'wfo',
    shiftName: log.shift?.name ?? 'Tanpa Shift',
    checkInAt: log.checkInAt?.toISOString() ?? null,
    checkOutAt: log.checkOutAt?.toISOString() ?? null,
    checkInLat: log.checkInLatitude,
    checkInLng: log.checkInLongitude,
    checkOutLat: log.checkOutLatitude,
    checkOutLng: log.checkOutLongitude,
    locationName: log.location?.name ?? null,
    faceStatus: log.faceCheckStatus ? FACE_MAP[log.faceCheckStatus] ?? 'notRequired' : 'notRequired',
    geofenceValid: log.geofenceStatus == null || log.geofenceStatus === 'Valid',
    syncStatus: SYNC_MAP[log.syncStatus] ?? 'synced',
  }
}

const ATTENDANCE_INCLUDE = {
  shift: { select: { name: true } },
  location: { select: { name: true } },
} as const

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/** Parse "HH:mm" into minutes since midnight. */
function parseHm(hm: string): number {
  const [h, m] = hm.split(':').map((x) => parseInt(x, 10))
  return (h || 0) * 60 + (m || 0)
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/** Today's attendance log for this employee (or null). */
export async function getToday(employee: MobileEmployee): Promise<{ today: AttendanceDto | null }> {
  const todayStart = startOfDay(new Date())
  const tomorrow = new Date(todayStart)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const log = (await prisma.attendanceLog.findFirst({
    where: {
      employeeId: employee.id,
      workspaceId: employee.workspaceId,
      attendanceDate: { gte: todayStart, lt: tomorrow },
    },
    include: ATTENDANCE_INCLUDE,
    orderBy: { checkInAt: 'desc' },
  })) as AttendanceLogRow | null

  return { today: log ? toAttendanceDto(log) : null }
}

/** Attendance history (most recent first, capped). */
export async function getHistory(
  employee: MobileEmployee,
  limit = 60,
): Promise<AttendanceDto[]> {
  const logs = (await prisma.attendanceLog.findMany({
    where: { employeeId: employee.id, workspaceId: employee.workspaceId },
    include: ATTENDANCE_INCLUDE,
    orderBy: { attendanceDate: 'desc' },
    take: limit,
  })) as AttendanceLogRow[]
  return logs.map(toAttendanceDto)
}

/** A single attendance record by id (must belong to this employee). */
export async function getAttendanceDetail(
  employee: MobileEmployee,
  id: string,
): Promise<AttendanceDto> {
  const log = (await prisma.attendanceLog.findFirst({
    where: { id, employeeId: employee.id, workspaceId: employee.workspaceId },
    include: ATTENDANCE_INCLUDE,
  })) as AttendanceLogRow | null
  if (!log) throw new NotFoundError('Data presensi')
  return toAttendanceDto(log)
}

/** The employee's assigned shift (or null). */
export async function getMyShift(employee: MobileEmployee): Promise<ShiftDto | null> {
  if (!employee.assignedShiftId) return null
  const shift = await prisma.shift.findFirst({
    where: { id: employee.assignedShiftId, workspaceId: employee.workspaceId },
  })
  if (!shift) return null
  return {
    id: shift.id,
    name: shift.name,
    startTime: shift.startTime,
    endTime: shift.endTime,
    gracePeriodMinutes: shift.gracePeriodMinutes,
    checkoutToleranceMinutes: shift.checkoutToleranceMinutes,
    workDays: shift.workDays,
  }
}

/**
 * Locations the employee may check in at: their assigned office plus any
 * WFH-approved locations linked to them.
 */
export async function getMyLocations(employee: MobileEmployee): Promise<LocationDto[]> {
  const wfh = await prisma.employeeWfhLocation.findMany({
    where: { employeeId: employee.id },
    select: { locationId: true },
  })
  const ids = [
    ...(employee.assignedLocationId ? [employee.assignedLocationId] : []),
    ...wfh.map((w) => w.locationId),
  ]
  if (ids.length === 0) return []

  const locations = await prisma.location.findMany({
    where: { id: { in: ids }, workspaceId: employee.workspaceId, status: 'Active' },
  })
  return locations.map((l) => ({
    id: l.id,
    name: l.name,
    type: l.type as string,
    address: l.address ?? null,
    latitude: l.latitude,
    longitude: l.longitude,
    radiusMeters: l.radiusMeters,
  }))
}

// ---------------------------------------------------------------------------
// Check-in / Check-out
// ---------------------------------------------------------------------------

export interface CheckInput {
  workMode: 'wfo' | 'wfh'
  latitude: number
  longitude: number
  faceVerified: boolean
  livenessPassed: boolean
  locationId?: string | null
  capturedAt?: string | null
}

function workModeToDb(mode: string): 'WFO' | 'WFH' {
  return mode === 'wfh' ? 'WFH' : 'WFO'
}

/**
 * Submit a check-in. Computes Present/Late from the assigned shift's grace
 * period. Rejects a second check-in on the same day.
 */
export async function checkIn(
  employee: MobileEmployee,
  input: CheckInput,
): Promise<AttendanceDto> {
  const now = input.capturedAt ? new Date(input.capturedAt) : new Date()
  const todayStart = startOfDay(now)
  const tomorrow = new Date(todayStart)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const existing = await prisma.attendanceLog.findFirst({
    where: {
      employeeId: employee.id,
      workspaceId: employee.workspaceId,
      attendanceDate: { gte: todayStart, lt: tomorrow },
    },
  })
  if (existing?.checkInAt) {
    throw new ConflictError('Anda sudah check-in hari ini')
  }

  // Determine status from shift grace period.
  let status: 'Present' | 'Late' = 'Present'
  let shiftId: string | null = employee.assignedShiftId
  if (employee.assignedShiftId) {
    const shift = await prisma.shift.findUnique({ where: { id: employee.assignedShiftId } })
    if (shift) {
      const nowMinutes = now.getHours() * 60 + now.getMinutes()
      const lateThreshold = parseHm(shift.startTime) + shift.gracePeriodMinutes
      if (nowMinutes > lateThreshold) status = 'Late'
    }
  }

  const geofenceStatus = input.workMode === 'wfh' ? null : 'Valid'
  const faceCheckStatus = input.faceVerified && input.livenessPassed ? 'Passed' : 'Failed'

  const created = (await prisma.attendanceLog.create({
    data: {
      workspaceId: employee.workspaceId,
      employeeId: employee.id,
      attendanceDate: todayStart,
      shiftId,
      checkInAt: now,
      checkInLatitude: input.latitude,
      checkInLongitude: input.longitude,
      locationId: input.locationId ?? employee.assignedLocationId ?? null,
      workMode: workModeToDb(input.workMode),
      faceCheckStatus,
      geofenceStatus,
      spoofingStatus: 'Clean',
      syncStatus: 'Synced',
      originalCheckInAt: now,
      syncedAt: now,
      status,
    },
    include: ATTENDANCE_INCLUDE,
  })) as AttendanceLogRow
  return toAttendanceDto(created)
}

/** Submit a check-out for today's open record. */
export async function checkOut(
  employee: MobileEmployee,
  input: CheckInput,
): Promise<AttendanceDto> {
  const now = input.capturedAt ? new Date(input.capturedAt) : new Date()
  const todayStart = startOfDay(now)
  const tomorrow = new Date(todayStart)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const open = await prisma.attendanceLog.findFirst({
    where: {
      employeeId: employee.id,
      workspaceId: employee.workspaceId,
      attendanceDate: { gte: todayStart, lt: tomorrow },
    },
  })
  if (!open || !open.checkInAt) {
    throw new ValidationError('Belum ada check-in hari ini')
  }
  if (open.checkOutAt) {
    throw new ConflictError('Anda sudah check-out hari ini')
  }

  const updated = (await prisma.attendanceLog.update({
    where: { id: open.id },
    data: {
      checkOutAt: now,
      checkOutLatitude: input.latitude,
      checkOutLongitude: input.longitude,
    },
    include: ATTENDANCE_INCLUDE,
  })) as AttendanceLogRow
  return toAttendanceDto(updated)
}

// ---------------------------------------------------------------------------
// Leave requests (self-service)
// ---------------------------------------------------------------------------

export interface LeaveDto {
  id: string
  type: string // annual | sick | personal | other
  startDate: string // yyyy-MM-dd
  endDate: string // yyyy-MM-dd
  reason: string
  status: string // pending | approved | rejected | cancelled
  attachmentName: string | null
  submittedAt: string | null
  reviewerNote: string | null
}

// The dashboard stores leave `type` as a free string seeded from LeaveType.
// Mobile uses a small enum; map both directions with a passthrough fallback.
const LEAVE_TYPE_TO_MOBILE: Record<string, string> = {
  annual: 'annual',
  'cuti tahunan': 'annual',
  sick: 'sick',
  sakit: 'sick',
  personal: 'personal',
  'izin pribadi': 'personal',
}
const LEAVE_STATUS_MAP: Record<string, string> = {
  Pending: 'pending',
  Approved: 'approved',
  Rejected: 'rejected',
  Cancelled: 'cancelled',
}

interface LeaveRow {
  id: string
  type: string
  startDate: Date
  endDate: Date
  reason: string | null
  status: string
  attachmentUrl: string | null
  notes: string | null
  createdAt: Date
}

function toLeaveDto(row: LeaveRow): LeaveDto {
  return {
    id: row.id,
    type: LEAVE_TYPE_TO_MOBILE[row.type.toLowerCase()] ?? 'other',
    startDate: row.startDate.toISOString().slice(0, 10),
    endDate: row.endDate.toISOString().slice(0, 10),
    reason: row.reason ?? '',
    status: LEAVE_STATUS_MAP[row.status] ?? 'pending',
    attachmentName: row.attachmentUrl ? row.attachmentUrl.split('/').pop() ?? null : null,
    submittedAt: row.createdAt.toISOString(),
    reviewerNote: row.notes ?? null,
  }
}

export async function getMyLeaveRequests(employee: MobileEmployee): Promise<LeaveDto[]> {
  const rows = (await prisma.leaveRequest.findMany({
    where: { employeeId: employee.id, workspaceId: employee.workspaceId },
    orderBy: { createdAt: 'desc' },
    take: 60,
  })) as LeaveRow[]
  return rows.map(toLeaveDto)
}

export interface CreateLeaveInput {
  type: string // annual | sick | personal | other
  startDate: string // yyyy-MM-dd
  endDate: string // yyyy-MM-dd
  reason: string
}

export async function createMyLeaveRequest(
  employee: MobileEmployee,
  input: CreateLeaveInput,
): Promise<LeaveDto> {
  const start = new Date(`${input.startDate}T00:00:00.000Z`)
  const end = new Date(`${input.endDate}T00:00:00.000Z`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new ValidationError('Tanggal tidak valid')
  }
  if (end < start) {
    throw new ValidationError('Tanggal selesai tidak boleh sebelum tanggal mulai')
  }

  // Reject overlap with an existing Pending/Approved request (R11.9).
  const overlap = await prisma.leaveRequest.findFirst({
    where: {
      employeeId: employee.id,
      workspaceId: employee.workspaceId,
      status: { in: ['Pending', 'Approved'] },
      startDate: { lte: end },
      endDate: { gte: start },
    },
  })
  if (overlap) {
    throw new ConflictError('Sudah ada pengajuan pada rentang tanggal tersebut')
  }

  const created = (await prisma.leaveRequest.create({
    data: {
      workspaceId: employee.workspaceId,
      employeeId: employee.id,
      type: input.type,
      startDate: start,
      endDate: end,
      reason: input.reason || null,
      status: 'Pending',
    },
  })) as LeaveRow
  return toLeaveDto(created)
}

// ---------------------------------------------------------------------------
// Schedule (upcoming shift days derived from the assigned shift)
// ---------------------------------------------------------------------------

export interface ScheduleDayDto {
  id: string
  name: string
  date: string // yyyy-MM-dd
  startTime: string // HH:mm
  endTime: string // HH:mm
  workMode: string // wfo | wfh
  gracePeriodMinutes: number
  isDayOff: boolean
}

const WEEKDAY_NAMES = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
]

/** The next `days` calendar days, marking off-days when not in the shift's workDays. */
export async function getMySchedule(
  employee: MobileEmployee,
  days = 14,
): Promise<ScheduleDayDto[]> {
  if (!employee.assignedShiftId) return []
  const shift = await prisma.shift.findUnique({ where: { id: employee.assignedShiftId } })
  if (!shift) return []

  const workMode = WORKMODE_MAP[employee.workMode] ?? 'wfo'
  const result: ScheduleDayDto[] = []
  const base = startOfDay(new Date())
  for (let i = 0; i < days; i++) {
    const date = new Date(base)
    date.setDate(base.getDate() + i)
    const dayName = WEEKDAY_NAMES[date.getDay()]
    const isDayOff = !shift.workDays.includes(dayName)
    result.push({
      id: `${shift.id}-${date.toISOString().slice(0, 10)}`,
      name: shift.name,
      date: date.toISOString().slice(0, 10),
      startTime: shift.startTime,
      endTime: shift.endTime,
      workMode,
      gracePeriodMinutes: shift.gracePeriodMinutes,
      isDayOff,
    })
  }
  return result
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export interface NotificationDto {
  id: string
  title: string
  body: string
  createdAt: string
  kind: string // reminder | approval | sync | info
  read: boolean
}

const NOTIF_PRESENTATION: Record<string, { title: string; body: string; kind: string }> = {
  leave_request_new: {
    title: 'Pengajuan diterima',
    body: 'Pengajuan izin/cuti Anda sedang diproses.',
    kind: 'approval',
  },
  export_completed: {
    title: 'Laporan siap',
    body: 'Ekspor laporan Anda telah selesai.',
    kind: 'info',
  },
}

export async function getMyNotifications(
  employee: MobileEmployee,
  authUserId: string,
): Promise<NotificationDto[]> {
  const rows = (await prisma.notification.findMany({
    where: {
      workspaceId: employee.workspaceId,
      recipientAuthUserId: authUserId,
    },
    orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
    take: 50,
  })) as Array<{ id: string; type: string; isRead: boolean; createdAt: Date }>

  return rows.map((n) => {
    const p = NOTIF_PRESENTATION[n.type] ?? {
      title: 'Notifikasi',
      body: '',
      kind: 'info',
    }
    return {
      id: n.id,
      title: p.title,
      body: p.body,
      kind: p.kind,
      read: n.isRead,
      createdAt: n.createdAt.toISOString(),
    }
  })
}
