/**
 * reports.service.ts — Business logic for report queries and export.
 *
 * Endpoints covered:
 *   GET /reports/attendance-summary   — summary counts + up to 10 sample rows
 *   GET /reports/daily-detail         — paginated daily attendance records
 *   GET /reports/late                 — late attendance logs, paginated
 *   GET /reports/missing-checkout     — missing checkout logs, paginated
 *   GET /reports/export               — sync (≤5000) or async (>5000, ≤50000) export
 *
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9, 12.10,
 *               12.13, 12.14, 17.6, 17.10
 */

import { prisma } from '../../config/prisma'
import { writeAudit } from '../../lib/audit'
import { ValidationError } from '../../lib/errors'
import { generateXLSX, generateCSV } from '../../lib/excelExport'
import { getStorageClient } from '../../config/supabaseStorage'
import type { ScopeFilter } from '../../types/auth'
import type { ReportQuery, ExportQuery } from './reports.schema'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Synchronous export row limit — above this we create an async ExportJob */
const SYNC_EXPORT_LIMIT = 5000

/** Maximum exportable rows — above this we reject with 400 */
const MAX_EXPORT_LIMIT = 50_000

/** Storage bucket for export files */
const EXPORTS_BUCKET = 'exports'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AttendanceSummaryResult {
  summary: {
    total: number
    present: number
    late: number
    absent: number
    leave: number
    missingCheckout: number
  }
  sampleRows: unknown[]
  totalRows: number
}

export interface ReportListResult<T> {
  items: T[]
  pagination: {
    page: number
    page_size: number
    total: number
    total_pages: number
  }
}

export interface SyncExportResult {
  type: 'sync'
  buffer: Buffer
  mimeType: string
  fileName: string
}

export interface AsyncExportResult {
  type: 'async'
  jobId: string
  status: 'Queued'
}

export type ExportResult = SyncExportResult | AsyncExportResult

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build the Prisma `where` clause that enforces workspace isolation and
 * the OR-based scope filter (department/location, R3.10).
 */
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
    orClauses.push({ employee: { departmentId: { in: scopeFilter.departmentIds } } })
  }
  if (scopeFilter.locationIds.length > 0) {
    orClauses.push({ employee: { assignedLocationId: { in: scopeFilter.locationIds } } })
  }

  if (orClauses.length === 0) {
    return { ...base, id: '__NEVER__' }
  }

  return { ...base, OR: orClauses }
}

/**
 * Apply the common filters (date range, departmentId, locationId, shiftId, status)
 * on top of an existing where clause.
 */
function applyFilters(
  where: Record<string, unknown>,
  params: {
    startDate?: string
    endDate?: string
    departmentId?: string
    locationId?: string
    shiftId?: string
    status?: string
  },
): Record<string, unknown> {
  const result = { ...where }

  const { startDate, endDate, departmentId, locationId, shiftId, status } = params

  if (startDate || endDate) {
    result['attendanceDate'] = {
      ...(startDate ? { gte: new Date(`${startDate}T00:00:00.000Z`) } : {}),
      ...(endDate ? { lte: new Date(`${endDate}T23:59:59.999Z`) } : {}),
    }
  }

  if (status && status !== 'all') {
    result['status'] = status
  }

  if (locationId) {
    result['locationId'] = locationId
  }

  if (shiftId) {
    result['shiftId'] = shiftId
  }

  // Department filter via employee relation
  if (departmentId) {
    const existingOR = result['OR'] as Record<string, unknown>[] | undefined
    if (existingOR) {
      result['AND'] = [{ OR: existingOR }, { employee: { departmentId } }]
      delete result['OR']
    } else {
      result['employee'] = { ...((result['employee'] as Record<string, unknown>) ?? {}), departmentId }
    }
  }

  return result
}

/** The standard include block for attendance logs */
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

/** Map an attendance log to a safe API-returnable shape */
function mapLog(log: Record<string, unknown>): Record<string, unknown> {
  const employee = log['employee'] as Record<string, unknown> | undefined
  const shift = log['shift'] as Record<string, unknown> | undefined
  const location = log['location'] as Record<string, unknown> | undefined
  const dept = employee?.['department'] as Record<string, unknown> | undefined

  return {
    id: log['id'],
    employeeId: log['employeeId'],
    employeeName: employee?.['fullName'] ?? '',
    employeeCode: employee?.['employeeCode'] ?? '',
    departmentId: employee?.['departmentId'] ?? null,
    departmentName: dept?.['name'] ?? null,
    shiftId: log['shiftId'],
    shiftName: shift?.['name'] ?? null,
    checkInAt: (log['checkInAt'] as Date | null)?.toISOString() ?? null,
    checkOutAt: (log['checkOutAt'] as Date | null)?.toISOString() ?? null,
    originalCheckInAt: (log['originalCheckInAt'] as Date | null)?.toISOString() ?? null,
    syncedAt: (log['syncedAt'] as Date | null)?.toISOString() ?? null,
    syncStatus: log['syncStatus'],
    locationId: log['locationId'],
    locationName: location?.['name'] ?? null,
    workMode: log['workMode'],
    faceCheckStatus: log['faceCheckStatus'],
    geofenceStatus: log['geofenceStatus'],
    spoofingStatus: log['spoofingStatus'],
    status: log['status'],
    isDuplicate: log['isDuplicate'],
    notes: log['notes'],
    attendanceDate: (log['attendanceDate'] as Date).toISOString().slice(0, 10),
  }
}

/**
 * Convert attendance logs to ReportRow format for CSV/XLSX export.
 */
function toReportRows(logs: Record<string, unknown>[]) {
  return logs.map((log) => {
    const employee = log['employee'] as Record<string, unknown> | undefined
    const shift = log['shift'] as Record<string, unknown> | undefined
    const location = log['location'] as Record<string, unknown> | undefined
    const dept = employee?.['department'] as Record<string, unknown> | undefined

    const checkInAt = log['checkInAt'] as Date | null
    const checkOutAt = log['checkOutAt'] as Date | null
    const attendanceDate = log['attendanceDate'] as Date

    return {
      employeeName: String(employee?.['fullName'] ?? ''),
      employeeCode: String(employee?.['employeeCode'] ?? ''),
      departmentName: String(dept?.['name'] ?? ''),
      date: attendanceDate.toISOString().slice(0, 10),
      shiftName: String((shift?.['name'] as string | undefined) ?? ''),
      checkIn: checkInAt ? checkInAt.toISOString() : '',
      checkOut: checkOutAt ? checkOutAt.toISOString() : '',
      status: String(log['status'] ?? ''),
      workMode: String(log['workMode'] ?? ''),
      locationName: String((location?.['name'] as string | undefined) ?? ''),
      notes: String(log['notes'] ?? ''),
    }
  })
}

// ---------------------------------------------------------------------------
// getAttendanceSummary
// ---------------------------------------------------------------------------

/**
 * GET /reports/attendance-summary
 *
 * Returns summary counts (present/late/absent/leave/missingCheckout)
 * plus up to 10 sample rows and total row count.
 *
 * Requirements: 12.1, 12.2, 12.3, 12.5, 12.6
 */
export async function getAttendanceSummary(params: {
  workspaceId: string
  query: ReportQuery
  scopeFilter?: ScopeFilter | null
}): Promise<AttendanceSummaryResult> {
  const { workspaceId, query, scopeFilter } = params

  const baseWhere = buildScopeWhere(workspaceId, scopeFilter)
  const where = applyFilters(baseWhere, {
    startDate: query.start_date,
    endDate: query.end_date,
    departmentId: query.department_id,
    locationId: query.location_id,
    shiftId: query.shift_id,
  })

  // Count per status in parallel
  const [total, present, late, absent, leave, missingCheckout, sampleRows] = await Promise.all([
    (prisma as any).attendanceLog.count({ where }),
    (prisma as any).attendanceLog.count({ where: { ...where, status: 'Present' } }),
    (prisma as any).attendanceLog.count({ where: { ...where, status: 'Late' } }),
    (prisma as any).attendanceLog.count({ where: { ...where, status: 'Absent' } }),
    (prisma as any).attendanceLog.count({ where: { ...where, status: 'Leave' } }),
    (prisma as any).attendanceLog.count({ where: { ...where, status: 'MissingCheckout' } }),
    (prisma as any).attendanceLog.findMany({
      where,
      take: 10,
      orderBy: [{ attendanceDate: 'desc' }, { checkInAt: 'asc' }],
      include: attendanceInclude,
    }),
  ])

  return {
    summary: {
      total: total as number,
      present: present as number,
      late: late as number,
      absent: absent as number,
      leave: leave as number,
      missingCheckout: missingCheckout as number,
    },
    sampleRows: (sampleRows as Record<string, unknown>[]).map(mapLog),
    totalRows: total as number,
  }
}

// ---------------------------------------------------------------------------
// getDailyDetail
// ---------------------------------------------------------------------------

/**
 * GET /reports/daily-detail
 *
 * Paginated daily attendance records with full detail.
 *
 * Requirements: 12.1, 12.2, 12.5, 12.6
 */
export async function getDailyDetail(params: {
  workspaceId: string
  query: ReportQuery
  scopeFilter?: ScopeFilter | null
}): Promise<ReportListResult<Record<string, unknown>>> {
  const { workspaceId, query, scopeFilter } = params

  const baseWhere = buildScopeWhere(workspaceId, scopeFilter)
  const where = applyFilters(baseWhere, {
    startDate: query.start_date,
    endDate: query.end_date,
    departmentId: query.department_id,
    locationId: query.location_id,
    shiftId: query.shift_id,
    status: query.status,
  })

  const page = query.page
  const pageSize = query.page_size
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

  return {
    items: (logs as Record<string, unknown>[]).map(mapLog),
    pagination: {
      page,
      page_size: pageSize,
      total: total as number,
      total_pages: Math.ceil((total as number) / pageSize),
    },
  }
}

// ---------------------------------------------------------------------------
// getLateReport
// ---------------------------------------------------------------------------

/**
 * GET /reports/late
 *
 * Paginated attendance logs with status=Late.
 *
 * Requirements: 12.1, 12.2, 12.5, 12.6
 */
export async function getLateReport(params: {
  workspaceId: string
  query: ReportQuery
  scopeFilter?: ScopeFilter | null
}): Promise<ReportListResult<Record<string, unknown>>> {
  const { workspaceId, query, scopeFilter } = params

  const baseWhere = buildScopeWhere(workspaceId, scopeFilter)
  const where = applyFilters(
    { ...baseWhere, status: 'Late' },
    {
      startDate: query.start_date,
      endDate: query.end_date,
      departmentId: query.department_id,
      locationId: query.location_id,
      shiftId: query.shift_id,
    },
  )

  const page = query.page
  const pageSize = query.page_size
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

  return {
    items: (logs as Record<string, unknown>[]).map(mapLog),
    pagination: {
      page,
      page_size: pageSize,
      total: total as number,
      total_pages: Math.ceil((total as number) / pageSize),
    },
  }
}

// ---------------------------------------------------------------------------
// getMissingCheckoutReport
// ---------------------------------------------------------------------------

/**
 * GET /reports/missing-checkout
 *
 * Paginated attendance logs with status=MissingCheckout.
 *
 * Requirements: 12.1, 12.2, 12.5, 12.6
 */
export async function getMissingCheckoutReport(params: {
  workspaceId: string
  query: ReportQuery
  scopeFilter?: ScopeFilter | null
}): Promise<ReportListResult<Record<string, unknown>>> {
  const { workspaceId, query, scopeFilter } = params

  const baseWhere = buildScopeWhere(workspaceId, scopeFilter)
  const where = applyFilters(
    { ...baseWhere, status: 'MissingCheckout' },
    {
      startDate: query.start_date,
      endDate: query.end_date,
      departmentId: query.department_id,
      locationId: query.location_id,
      shiftId: query.shift_id,
    },
  )

  const page = query.page
  const pageSize = query.page_size
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

  return {
    items: (logs as Record<string, unknown>[]).map(mapLog),
    pagination: {
      page,
      page_size: pageSize,
      total: total as number,
      total_pages: Math.ceil((total as number) / pageSize),
    },
  }
}

// ---------------------------------------------------------------------------
// exportReport  (Task 34)
// ---------------------------------------------------------------------------

/**
 * GET /reports/export
 *
 * Sync/async export based on row count:
 *   - ≤ 5000 rows  → generate file inline, return buffer
 *   - > 5000, ≤ 50000 → create ExportJob, return { jobId, status: "Queued" }
 *   - > 50000 → 400 ValidationError
 *
 * Permission: export_reports (enforced in middleware)
 * Audit: export_report
 *
 * Requirements: 12.4, 12.6, 12.7, 12.8, 12.9, 12.10, 12.13, 12.14, 17.6, 17.10
 */
export async function exportReport(params: {
  workspaceId: string
  query: ExportQuery
  actorUserId: string
  scopeFilter?: ScopeFilter | null
  ipAddress?: string | null
  userAgent?: string | null
  requestId?: string | null
}): Promise<ExportResult> {
  const { workspaceId, query, actorUserId, scopeFilter, ipAddress, userAgent, requestId } = params

  // Build where clause with scope + filters
  const baseWhere = buildScopeWhere(workspaceId, scopeFilter)
  const where = applyFilters(baseWhere, {
    startDate: query.start_date,
    endDate: query.end_date,
    departmentId: query.department_id,
    locationId: query.location_id,
    shiftId: query.shift_id,
  })

  // 1. Count total rows
  const total = (await (prisma as any).attendanceLog.count({ where })) as number

  // 2. Reject if > 50000
  if (total > MAX_EXPORT_LIMIT) {
    throw new ValidationError(
      `Terlalu banyak data untuk diekspor (${total} baris). Maksimum ${MAX_EXPORT_LIMIT} baris. Silakan persempit filter tanggal atau departemen.`,
    )
  }

  const format = query.format
  const reportType = query.report_type

  // 3. Map format to Prisma enum value
  const prismaFormat = format === 'xlsx' ? 'XLSX' : 'CSV'
  // 4. Map report_type string to Prisma enum value
  const prismaReportType = reportType as
    | 'AttendanceSummary'
    | 'DailyDetail'
    | 'Late'
    | 'MissingCheckout'
    | 'LeaveAndPermit'
    | 'DepartmentAttendance'

  // 5. Async path: > 5000 rows → create ExportJob
  if (total > SYNC_EXPORT_LIMIT) {
    const job = await prisma.exportJob.create({
      data: {
        workspaceId,
        requestedBy: actorUserId,
        reportType: prismaReportType,
        filtersJson: {
          startDate: query.start_date,
          endDate: query.end_date,
          departmentId: query.department_id,
          locationId: query.location_id,
          shiftId: query.shift_id,
        },
        format: prismaFormat,
        rowCount: total,
        status: 'Queued',
      },
    })

    await writeAudit({
      workspaceId,
      actorUserId,
      action: 'export_report',
      entityType: 'ExportJob',
      entityId: job.id,
      newValue: {
        reportType,
        format,
        rowCount: total,
        status: 'Queued',
        async: true,
      },
      ipAddress,
      userAgent,
      requestId,
    })

    return { type: 'async', jobId: job.id, status: 'Queued' }
  }

  // 6. Sync path: ≤ 5000 rows → fetch all, generate file
  const logs = await (prisma as any).attendanceLog.findMany({
    where,
    orderBy: [{ attendanceDate: 'desc' }, { checkInAt: 'asc' }],
    include: attendanceInclude,
  })

  const rows = toReportRows(logs as Record<string, unknown>[])

  // Generate file buffer
  let buffer: Buffer
  let mimeType: string
  let fileExt: string

  if (format === 'xlsx') {
    buffer = await generateXLSX(rows, 'Laporan Absensi')
    mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    fileExt = 'xlsx'
  } else {
    buffer = generateCSV(rows)
    mimeType = 'text/csv; charset=utf-8'
    fileExt = 'csv'
  }

  const dateTag = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const fileName = `laporan-absensi-${dateTag}.${fileExt}`

  // Upload to storage for audit trail (best-effort)
  try {
    const storage = getStorageClient()
    const storagePath = `${workspaceId}/${actorUserId}/${fileName}`
    await storage.upload(EXPORTS_BUCKET, storagePath, buffer, mimeType)
  } catch (err) {
    // Non-critical — log and continue
    import('../../lib/logger').then(({ logger }) =>
      logger.warn('Failed to upload sync export to storage', {
        error: err instanceof Error ? err.message : String(err),
      }),
    )
  }

  // Record ExportJob for history (Completed immediately)
  try {
    const job = await prisma.exportJob.create({
      data: {
        workspaceId,
        requestedBy: actorUserId,
        reportType: prismaReportType,
        filtersJson: {
          startDate: query.start_date,
          endDate: query.end_date,
          departmentId: query.department_id,
          locationId: query.location_id,
          shiftId: query.shift_id,
        },
        format: prismaFormat,
        rowCount: total,
        status: 'Completed',
        completedAt: new Date(),
      },
    })

    await writeAudit({
      workspaceId,
      actorUserId,
      action: 'export_report',
      entityType: 'ExportJob',
      entityId: job.id,
      newValue: {
        reportType,
        format,
        rowCount: total,
        status: 'Completed',
        async: false,
      },
      ipAddress,
      userAgent,
      requestId,
    })
  } catch {
    // Non-critical — history write failure should not break the download
  }

  return { type: 'sync', buffer, mimeType, fileName }
}
