/**
 * attendance.service.ts — Business logic for attendance read endpoints.
 *
 * Endpoints covered:
 *   GET  /attendance              — list with filters + pagination + scope (R6.1, R6.3, R6.4, R6.5)
 *   GET  /attendance/:id          — full detail (R6.8, R6.9)
 *   POST /attendance/:id/adjustment-note — admin note only, no timestamp edits (R6.6, R6.7)
 *
 * AttendanceLogs are READ-ONLY from the dashboard except for the `notes` field
 * which HR can update via adjustment-note.
 *
 * Requirements: 6.1, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 16.2, 16.7
 */

import { prisma } from '../../config/prisma'
import { writeAudit } from '../../lib/audit'
import { NotFoundError, ValidationError } from '../../lib/errors'
import {
  faceStorageUsesVercelBlob,
  getFaceBlobObject,
  getFaceSignedUrl,
  type FaceBlobObject,
} from '../../config/faceStorage'
import type { ScopeFilter } from '../../types/auth'
import type { AdjustmentNoteInput } from './attendance.schema'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AttendanceListItem {
  id: string
  employeeId: string
  employeeName: string
  employeeCode: string
  departmentId: string | null
  departmentName: string | null
  shiftId: string | null
  shiftName: string | null
  checkInAt: string | null
  checkOutAt: string | null
  originalCheckInAt: string | null
  syncedAt: string | null
  syncStatus: string
  locationId: string | null
  locationName: string | null
  workMode: string | null
  faceCheckStatus: string | null
  geofenceStatus: string | null
  spoofingStatus: string | null
  status: string
  isDuplicate: boolean
  notes: string | null
  attendanceDate: string
  /** Presigned URLs for the captured face images (populated on detail only). */
  checkInFaceUrl: string | null
  checkOutFaceUrl: string | null
}

export interface AttendanceListResult {
  items: AttendanceListItem[]
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

/**
 * Build the Prisma `where` clause that enforces workspace isolation and
 * the OR-based scope filter (R6.3, R6.4).
 *
 * AttendanceLog links to Employee; scope is enforced via the employee's
 * departmentId and assignedLocationId.
 */
function buildAttendanceScopeWhere(
  workspaceId: string,
  scopeFilter: ScopeFilter | undefined | null,
): Record<string, unknown> {
  const base: Record<string, unknown> = { workspaceId }

  if (!scopeFilter || scopeFilter.isWorkspaceScope) {
    return base
  }

  const orClauses: Record<string, unknown>[] = []
  if (scopeFilter.departmentIds.length > 0) {
    orClauses.push({ employee: { departmentId: { in: scopeFilter.departmentIds } } })
  }
  if (scopeFilter.locationIds.length > 0) {
    orClauses.push({ employee: { assignedLocationId: { in: scopeFilter.locationIds } } })
  }

  if (orClauses.length === 0) {
    // Edge case: scoped user with no scopes → return nothing
    return { ...base, id: '__NEVER__' }
  }

  return { ...base, OR: orClauses }
}

/**
 * Map a raw Prisma attendance log row to the API shape.
 */
function mapAttendanceLog(log: {
  id: string
  workspaceId: string
  employeeId: string
  attendanceDate: Date
  shiftId: string | null
  checkInAt: Date | null
  checkOutAt: Date | null
  locationId: string | null
  workMode: string | null
  faceCheckStatus: string | null
  geofenceStatus: string | null
  spoofingStatus: string | null
  syncStatus: string
  originalCheckInAt: Date | null
  syncedAt: Date | null
  status: string
  isDuplicate: boolean
  notes: string | null
  employee?: {
    fullName: string
    employeeCode: string
    departmentId: string
    department?: { name: string } | null
  } | null
  shift?: { name: string } | null
  location?: { name: string } | null
}): AttendanceListItem {
  return {
    id: log.id,
    employeeId: log.employeeId,
    employeeName: log.employee?.fullName ?? '',
    employeeCode: log.employee?.employeeCode ?? '',
    departmentId: log.employee?.departmentId ?? null,
    departmentName: log.employee?.department?.name ?? null,
    shiftId: log.shiftId,
    shiftName: log.shift?.name ?? null,
    checkInAt: log.checkInAt?.toISOString() ?? null,
    checkOutAt: log.checkOutAt?.toISOString() ?? null,
    originalCheckInAt: log.originalCheckInAt?.toISOString() ?? null,
    syncedAt: log.syncedAt?.toISOString() ?? null,
    syncStatus: log.syncStatus,
    locationId: log.locationId,
    locationName: log.location?.name ?? null,
    workMode: log.workMode,
    faceCheckStatus: log.faceCheckStatus,
    geofenceStatus: log.geofenceStatus,
    spoofingStatus: log.spoofingStatus,
    status: log.status,
    isDuplicate: log.isDuplicate,
    notes: log.notes,
    attendanceDate: log.attendanceDate.toISOString().slice(0, 10),
    checkInFaceUrl: null,
    checkOutFaceUrl: null,
  }
}

/** The Prisma include/select used for list and detail queries */
const attendanceInclude = {
  employee: {
    select: {
      fullName: true,
      employeeCode: true,
      departmentId: true,
      department: { select: { name: true } },
    },
  },
  shift: { select: { name: true } },
  location: { select: { name: true } },
}

// ---------------------------------------------------------------------------
// listAttendance
// ---------------------------------------------------------------------------

/**
 * GET /attendance — paginated list with filters + scope.
 *
 * Business rules:
 * - Date range: attendanceDate >= start_date AND <= end_date (defaults to today)
 * - If end_date < start_date → ValidationError
 * - Status filter: 'all' means no filter on status
 * - Scope filter applied via OR union of department/location
 * - Workspace isolation always enforced
 *
 * Requirements: 6.1, 6.3, 6.4, 6.5, 16.2, 16.7
 */
export async function listAttendance(params: {
  workspaceId: string
  startDate?: string
  endDate?: string
  departmentId?: string
  locationId?: string
  shiftId?: string
  status?: string
  search?: string
  page: number
  pageSize: number
  scopeFilter?: ScopeFilter | null
}): Promise<AttendanceListResult> {
  const {
    workspaceId,
    startDate,
    endDate,
    departmentId,
    locationId,
    shiftId,
    status,
    search,
    page,
    pageSize,
    scopeFilter,
  } = params

  // Default to today
  const today = new Date().toISOString().slice(0, 10)
  const effectiveStart = startDate ?? today
  const effectiveEnd = endDate ?? today

  // Validate date range
  if (effectiveEnd < effectiveStart) {
    throw new ValidationError('end_date tidak boleh lebih awal dari start_date')
  }

  // Parse date strings into UTC midnight boundaries
  const startUtc = new Date(`${effectiveStart}T00:00:00.000Z`)
  const endUtc = new Date(`${effectiveEnd}T23:59:59.999Z`)

  // Base where from scope + workspace isolation
  const where: Record<string, unknown> = {
    ...buildAttendanceScopeWhere(workspaceId, scopeFilter),
    attendanceDate: {
      gte: startUtc,
      lte: endUtc,
    },
  }

  // Status filter
  if (status && status !== 'all') {
    where['status'] = status
  }

  // Location filter (on the attendance log itself)
  if (locationId) {
    where['locationId'] = locationId
  }

  // Shift filter
  if (shiftId) {
    where['shiftId'] = shiftId
  }

  // Department filter — via employee relation
  // Must merge with any existing OR from scope filter carefully
  if (departmentId) {
    // When there is already an OR (scope), we nest the department condition inside each OR clause
    // Simpler approach: add it as a top-level AND condition alongside OR
    const existingOR = where['OR'] as Record<string, unknown>[] | undefined
    if (existingOR) {
      // Wrap existing OR + departmentId together in AND
      where['AND'] = [
        { OR: existingOR },
        { employee: { departmentId } },
      ]
      delete where['OR']
    } else {
      where['employee'] = { ...((where['employee'] as Record<string, unknown>) ?? {}), departmentId }
    }
  }

  // Search by employee name / code
  if (search && search.trim()) {
    const term = search.trim()
    const searchOr = [
      { employee: { fullName: { contains: term, mode: 'insensitive' as const } } },
      { employee: { employeeCode: { contains: term, mode: 'insensitive' as const } } },
    ]
    // Merge with existing OR if present
    const existingOR = where['OR'] as Record<string, unknown>[] | undefined
    const existingAND = where['AND'] as Record<string, unknown>[] | undefined

    if (existingAND) {
      ;(where['AND'] as Record<string, unknown>[]).push({ OR: searchOr })
    } else if (existingOR) {
      where['AND'] = [{ OR: existingOR }, { OR: searchOr }]
      delete where['OR']
    } else {
      where['OR'] = searchOr
    }
  }

  const skip = (page - 1) * pageSize

  const [total, logs] = await Promise.all([
    (prisma as any).attendanceLog.count({ where }),
    (prisma as any).attendanceLog.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [{ attendanceDate: 'desc' }, { checkInAt: 'asc' }],
      include: attendanceInclude,
    }),
  ])

  const items = (logs as Parameters<typeof mapAttendanceLog>[0][]).map(mapAttendanceLog)

  return {
    items,
    pagination: {
      page,
      page_size: pageSize,
      total: total as number,
      total_pages: Math.ceil((total as number) / pageSize),
    },
  }
}

// ---------------------------------------------------------------------------
// getAttendanceById
// ---------------------------------------------------------------------------

/**
 * GET /attendance/:id — full detail.
 *
 * Workspace isolation is always enforced (workspaceId in where clause).
 * If record exists in a different workspace → treated as 404 (R6.9).
 *
 * Requirements: 6.8, 6.9
 */
export async function getAttendanceById(
  workspaceId: string,
  attendanceId: string,
  scopeFilter?: ScopeFilter | null,
): Promise<AttendanceListItem> {
  const where: Record<string, unknown> = {
    id: attendanceId,
    ...buildAttendanceScopeWhere(workspaceId, scopeFilter),
  }

  const log = await (prisma as any).attendanceLog.findFirst({
    where,
    include: attendanceInclude,
  })

  if (!log) {
    throw new NotFoundError('Data absensi')
  }

  const item = mapAttendanceLog(log)
  if (faceStorageUsesVercelBlob()) {
    item.checkInFaceUrl = log.checkInFaceKey
      ? `/api/v1/attendance/${log.id}/face/check-in`
      : null
    item.checkOutFaceUrl = log.checkOutFaceKey
      ? `/api/v1/attendance/${log.id}/face/check-out`
      : null
  } else {
    item.checkInFaceUrl = await getFaceSignedUrl(log.checkInFaceKey)
    item.checkOutFaceUrl = await getFaceSignedUrl(log.checkOutFaceKey)
  }
  return item
}

// ---------------------------------------------------------------------------
// getAttendanceFaceImage
// ---------------------------------------------------------------------------

/**
 * Fetch a private attendance face image after workspace and scope checks.
 */
export async function getAttendanceFaceImage(
  workspaceId: string,
  attendanceId: string,
  kind: 'check-in' | 'check-out',
  scopeFilter?: ScopeFilter | null,
): Promise<FaceBlobObject> {
  const where: Record<string, unknown> = {
    id: attendanceId,
    ...buildAttendanceScopeWhere(workspaceId, scopeFilter),
  }

  const log = await (prisma as any).attendanceLog.findFirst({
    where,
    select: {
      id: true,
      checkInFaceKey: true,
      checkOutFaceKey: true,
    },
  })

  if (!log) {
    throw new NotFoundError('Data absensi')
  }

  const key = kind === 'check-in' ? log.checkInFaceKey : log.checkOutFaceKey
  if (!key) {
    throw new NotFoundError('Foto absensi')
  }

  const image = await getFaceBlobObject(key)
  if (!image) {
    throw new NotFoundError('Foto absensi')
  }

  return image
}

// ---------------------------------------------------------------------------
// addAdjustmentNote
// ---------------------------------------------------------------------------

/**
 * POST /attendance/:id/adjustment-note
 *
 * Updates ONLY the `notes` field.
 * ALL other fields (timestamps, status, etc.) are immutable (R6.6).
 * Writes an audit log entry with action `admin_note_attendance` (R6.7, R14.1).
 *
 * Requirements: 6.6, 6.7, 14.1
 */
export async function addAdjustmentNote(params: {
  workspaceId: string
  attendanceId: string
  input: AdjustmentNoteInput
  actorUserId: string
  scopeFilter?: ScopeFilter | null
  ipAddress?: string | null
  userAgent?: string | null
  requestId?: string | null
}): Promise<AttendanceListItem> {
  const {
    workspaceId,
    attendanceId,
    input,
    actorUserId,
    scopeFilter,
    ipAddress,
    userAgent,
    requestId,
  } = params

  // Fetch existing record with scope enforcement (workspace isolation always)
  const existing = await (prisma as any).attendanceLog.findFirst({
    where: {
      id: attendanceId,
      ...buildAttendanceScopeWhere(workspaceId, scopeFilter),
    },
    select: { id: true, notes: true, workspaceId: true },
  })

  if (!existing) {
    throw new NotFoundError('Data absensi')
  }

  const oldNote: string | null = (existing as { notes: string | null }).notes

  // Update ONLY the notes field — all other fields are immutable (R6.6)
  await (prisma as any).attendanceLog.update({
    where: { id: attendanceId },
    data: { notes: input.note },
  })

  // Audit log: admin_note_attendance (R6.7, R14.1)
  await writeAudit({
    workspaceId,
    actorUserId,
    action: 'admin_note_attendance',
    entityType: 'AttendanceLog',
    entityId: attendanceId,
    oldValue: { notes: oldNote },
    newValue: { notes: input.note },
    ipAddress,
    userAgent,
    requestId,
  })

  // Return the updated record
  const updated = await (prisma as any).attendanceLog.findFirst({
    where: { id: attendanceId, workspaceId },
    include: attendanceInclude,
  })

  return mapAttendanceLog(updated)
}
