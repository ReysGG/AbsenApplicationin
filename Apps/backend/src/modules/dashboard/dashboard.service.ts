/**
 * dashboard.service.ts — business logic for all dashboard endpoints.
 *
 * Endpoints covered:
 *   GET /dashboard/summary            — summary cards (R5.1, R5.6, R5.7, R5.8)
 *   GET /dashboard/attendance-trend   — 30-day trend (R5.2)
 *   GET /dashboard/department-breakdown — per-dept breakdown (R5.3)
 *   GET /dashboard/live-preview       — latest check-ins (R5.3)
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.6, 5.7, 5.8, 5.9, 5.10
 */

import { prisma } from '../../config/prisma'
import type { ScopeFilter } from '../../types/auth'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SummaryParams {
  workspaceId: string
  date: string // YYYY-MM-DD
  departmentId?: string
  locationId?: string
  scopeFilter?: ScopeFilter
}

export interface SummaryResult {
  date: string
  totalEmployees: number
  presentToday: number
  lateToday: number
  onLeave: number
  absent: number
  unassignedShift: number
  pendingCheckout: number
}

export interface TrendParams {
  workspaceId: string
  days: number
  departmentId?: string
  locationId?: string
  scopeFilter?: ScopeFilter
}

export interface TrendResult {
  period: string
  labels: string[]
  series: {
    present: number[]
    late: number[]
    absent: number[]
    leave: number[]
  }
}

export interface DepartmentBreakdownParams {
  workspaceId: string
  date: string // YYYY-MM-DD
  departmentId?: string
  locationId?: string
  scopeFilter?: ScopeFilter
}

export interface DepartmentBreakdownItem {
  departmentId: string
  departmentName: string
  totalEmployees: number
  present: number
  late: number
  absent: number
}

export interface LivePreviewParams {
  workspaceId: string
  limit: number
  departmentId?: string
  locationId?: string
  scopeFilter?: ScopeFilter
}

export interface LivePreviewItem {
  employeeId: string
  employeeName: string
  department: string
  checkInAt: string
  status: string
  workMode: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Converts a YYYY-MM-DD string to a Date range [start, end) for UTC day.
 */
function dateToUtcRange(dateStr: string): { start: Date; end: Date } {
  const start = new Date(`${dateStr}T00:00:00.000Z`)
  const end = new Date(`${dateStr}T23:59:59.999Z`)
  return { start, end }
}

/**
 * Formats a Date as YYYY-MM-DD (UTC).
 */
function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/**
 * Build an employee where clause respecting scope filter (R5.10).
 * Only Active employees are counted (R5.8).
 */
function buildEmployeeWhere(
  workspaceId: string,
  scopeFilter?: ScopeFilter,
  departmentId?: string,
  locationId?: string,
): object {
  const base: Record<string, unknown> = {
    workspaceId,
    employmentStatus: 'Active',
  }

  const andClauses: object[] = []

  // Explicit query filter from request
  if (departmentId && departmentId !== 'all') {
    andClauses.push({ departmentId })
  }
  if (locationId && locationId !== 'all') {
    andClauses.push({ assignedLocationId: locationId })
  }

  // Scope filter injected by enforceScope middleware (R5.4, R5.10)
  if (scopeFilter && !scopeFilter.isWorkspaceScope) {
    const scopeOr: object[] = []
    if (scopeFilter.departmentIds.length > 0) {
      scopeOr.push({ departmentId: { in: scopeFilter.departmentIds } })
    }
    if (scopeFilter.locationIds.length > 0) {
      scopeOr.push({ assignedLocationId: { in: scopeFilter.locationIds } })
    }
    if (scopeOr.length > 0) {
      andClauses.push({ OR: scopeOr })
    }
  }

  if (andClauses.length > 0) {
    base['AND'] = andClauses
  }

  return base
}

/**
 * Build an attendance log where clause respecting scope filter (R5.10).
 */
function buildAttendanceWhere(
  workspaceId: string,
  dateStart: Date,
  dateEnd: Date,
  scopeFilter?: ScopeFilter,
  departmentId?: string,
  locationId?: string,
  extraStatus?: unknown,
): object {
  const base: Record<string, unknown> = {
    workspaceId,
    attendanceDate: { gte: dateStart, lte: dateEnd },
    employee: { employmentStatus: 'Active' },
  }

  if (extraStatus !== undefined) {
    base['status'] = extraStatus
  }

  const andClauses: object[] = []

  if (departmentId && departmentId !== 'all') {
    andClauses.push({ employee: { departmentId } })
  }
  if (locationId && locationId !== 'all') {
    andClauses.push({ employee: { assignedLocationId: locationId } })
  }

  if (scopeFilter && !scopeFilter.isWorkspaceScope) {
    const scopeOr: object[] = []
    if (scopeFilter.departmentIds.length > 0) {
      scopeOr.push({ employee: { departmentId: { in: scopeFilter.departmentIds } } })
    }
    if (scopeFilter.locationIds.length > 0) {
      scopeOr.push({ employee: { assignedLocationId: { in: scopeFilter.locationIds } } })
    }
    if (scopeOr.length > 0) {
      andClauses.push({ OR: scopeOr })
    }
  }

  if (andClauses.length > 0) {
    base['AND'] = andClauses
  }

  return base
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * GET /dashboard/summary
 *
 * Returns summary cards for the given date.
 * Requirements: 5.1, 5.6, 5.7, 5.8, 5.10
 */
export async function getDashboardSummary(params: SummaryParams): Promise<SummaryResult> {
  const { workspaceId, date, departmentId, locationId, scopeFilter } = params
  const { start, end } = dateToUtcRange(date)

  const empWhere = buildEmployeeWhere(workspaceId, scopeFilter, departmentId, locationId)

  // Run all 7 counts in parallel — no data dependency between them
  const [
    totalEmployees,
    presentToday,
    lateToday,
    onLeave,
    absent,
    unassignedShift,
    pendingCheckout,
  ] = await Promise.all([
    (prisma as any).employee.count({ where: empWhere }),
    (prisma as any).attendanceLog.count({
      where: buildAttendanceWhere(workspaceId, start, end, scopeFilter, departmentId, locationId, { in: ['Present', 'Late'] }),
    }),
    (prisma as any).attendanceLog.count({
      where: buildAttendanceWhere(workspaceId, start, end, scopeFilter, departmentId, locationId, 'Late'),
    }),
    (prisma as any).attendanceLog.count({
      where: buildAttendanceWhere(workspaceId, start, end, scopeFilter, departmentId, locationId, 'Leave'),
    }),
    (prisma as any).attendanceLog.count({
      where: buildAttendanceWhere(workspaceId, start, end, scopeFilter, departmentId, locationId, 'Absent'),
    }),
    (prisma as any).employee.count({
      where: { ...(empWhere as Record<string, unknown>), assignedShiftId: null },
    }),
    (prisma as any).attendanceLog.count({
      where: buildAttendanceWhere(workspaceId, start, end, scopeFilter, departmentId, locationId, 'PendingCheckout'),
    }),
  ])

  return {
    date,
    totalEmployees,
    presentToday,
    lateToday,
    onLeave,
    absent,
    unassignedShift,
    pendingCheckout,
  }
}

/**
 * GET /dashboard/attendance-trend
 *
 * Returns N-day attendance trend (default 30, max 90).
 * Requirements: 5.2, 5.4, 5.9, 5.10
 */
export async function getAttendanceTrend(params: TrendParams): Promise<TrendResult> {
  const { workspaceId, days, departmentId, locationId, scopeFilter } = params
  const clampedDays = Math.min(Math.max(days, 1), 90)

  // Generate date labels (last N days, oldest first)
  const labels: string[] = []
  const now = new Date()
  for (let i = clampedDays - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setUTCDate(d.getUTCDate() - i)
    labels.push(formatDate(d))
  }

  const rangeStart = new Date(`${labels[0]}T00:00:00.000Z`)
  const rangeEnd = new Date(`${labels[labels.length - 1]}T23:59:59.999Z`)

  // Fetch all relevant attendance logs in range in one query
  const whereBase = buildAttendanceWhere(
    workspaceId,
    rangeStart,
    rangeEnd,
    scopeFilter,
    departmentId,
    locationId,
  ) as Record<string, unknown>

  const logs = await (prisma as any).attendanceLog.findMany({
    where: whereBase,
    select: {
      attendanceDate: true,
      status: true,
    },
  })

  // Build a map: date → { present, late, absent, leave }
  const map = new Map<string, { present: number; late: number; absent: number; leave: number }>()
  for (const label of labels) {
    map.set(label, { present: 0, late: 0, absent: 0, leave: 0 })
  }

  for (const log of logs as Array<{ attendanceDate: Date; status: string }>) {
    const dateKey = formatDate(log.attendanceDate)
    const entry = map.get(dateKey)
    if (!entry) continue
    if (log.status === 'Present') entry.present++
    else if (log.status === 'Late') entry.late++
    else if (log.status === 'Absent') entry.absent++
    else if (log.status === 'Leave') entry.leave++
  }

  const series = {
    present: labels.map((l) => map.get(l)!.present),
    late: labels.map((l) => map.get(l)!.late),
    absent: labels.map((l) => map.get(l)!.absent),
    leave: labels.map((l) => map.get(l)!.leave),
  }

  return {
    period: `${clampedDays}d`,
    labels,
    series,
  }
}

/**
 * GET /dashboard/department-breakdown
 *
 * Returns attendance breakdown per department.
 * Requirements: 5.3, 5.4, 5.8, 5.10
 */
export async function getDepartmentBreakdown(
  params: DepartmentBreakdownParams,
): Promise<DepartmentBreakdownItem[]> {
  const { workspaceId, date, departmentId, locationId, scopeFilter } = params
  const { start, end } = dateToUtcRange(date)

  // Get active departments within scope
  const deptWhere: Record<string, unknown> = { workspaceId, status: 'Active' }

  if (departmentId && departmentId !== 'all') {
    deptWhere['id'] = departmentId
  }

  if (scopeFilter && !scopeFilter.isWorkspaceScope && scopeFilter.departmentIds.length > 0) {
    if (departmentId && departmentId !== 'all') {
      if (!scopeFilter.departmentIds.includes(departmentId)) return []
    } else {
      deptWhere['id'] = { in: scopeFilter.departmentIds }
    }
  }

  const departments = await (prisma as any).department.findMany({
    where: deptWhere,
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  if (departments.length === 0) return []

  const deptIds = (departments as Array<{ id: string }>).map((d) => d.id)

  // Build shared employee filter for location scope
  const empLocationFilter: Record<string, unknown> = {}
  if (locationId && locationId !== 'all') {
    empLocationFilter['assignedLocationId'] = locationId
  }
  if (scopeFilter && !scopeFilter.isWorkspaceScope && scopeFilter.locationIds.length > 0) {
    empLocationFilter['assignedLocationId'] = { in: scopeFilter.locationIds }
  }

  // Run 3 parallel queries instead of 4 per department
  const [empCounts, attendanceLogs] = await Promise.all([
    // Employee count grouped by departmentId
    (prisma as any).employee.groupBy({
      by: ['departmentId'],
      where: {
        workspaceId,
        departmentId: { in: deptIds },
        employmentStatus: 'Active',
        ...empLocationFilter,
      },
      _count: { id: true },
    }),
    // All attendance logs for these departments in one query
    (prisma as any).attendanceLog.findMany({
      where: {
        workspaceId,
        attendanceDate: { gte: start, lte: end },
        status: { in: ['Present', 'Late', 'Absent'] },
        employee: {
          departmentId: { in: deptIds },
          employmentStatus: 'Active',
          ...empLocationFilter,
        },
      },
      select: {
        status: true,
        employee: { select: { departmentId: true } },
      },
    }),
  ])

  // Build lookup maps from query results
  const empCountMap = new Map<string, number>()
  for (const row of empCounts as Array<{ departmentId: string; _count: { id: number } }>) {
    empCountMap.set(row.departmentId, row._count.id)
  }

  const attendanceMap = new Map<string, { present: number; late: number; absent: number }>()
  for (const deptId of deptIds) {
    attendanceMap.set(deptId, { present: 0, late: 0, absent: 0 })
  }
  for (const log of attendanceLogs as Array<{ status: string; employee: { departmentId: string } }>) {
    const entry = attendanceMap.get(log.employee.departmentId)
    if (!entry) continue
    if (log.status === 'Present' || log.status === 'Late') entry.present++
    if (log.status === 'Late') entry.late++
    if (log.status === 'Absent') entry.absent++
  }

  return (departments as Array<{ id: string; name: string }>).map((dept) => ({
    departmentId: dept.id,
    departmentName: dept.name,
    totalEmployees: empCountMap.get(dept.id) ?? 0,
    present: attendanceMap.get(dept.id)?.present ?? 0,
    late: attendanceMap.get(dept.id)?.late ?? 0,
    absent: attendanceMap.get(dept.id)?.absent ?? 0,
  }))
}

/**
 * GET /dashboard/live-preview
 *
 * Returns latest N check-ins for today.
 * Requirements: 5.3, 5.4, 5.8, 5.10
 */
export async function getLivePreview(params: LivePreviewParams): Promise<LivePreviewItem[]> {
  const { workspaceId, limit, departmentId, locationId, scopeFilter } = params
  const clampedLimit = Math.min(Math.max(limit, 1), 20)

  const today = formatDate(new Date())
  const { start, end } = dateToUtcRange(today)

  const where = buildAttendanceWhere(
    workspaceId,
    start,
    end,
    scopeFilter,
    departmentId,
    locationId,
  ) as Record<string, unknown>

  // Only include logs where check-in happened
  where['checkInAt'] = { not: null }

  const logs = await (prisma as any).attendanceLog.findMany({
    where,
    orderBy: { checkInAt: 'desc' },
    take: clampedLimit,
    select: {
      employeeId: true,
      checkInAt: true,
      status: true,
      workMode: true,
      employee: {
        select: {
          fullName: true,
          department: {
            select: { name: true },
          },
        },
      },
    },
  })

  return (
    logs as Array<{
      employeeId: string
      checkInAt: Date
      status: string
      workMode: string | null
      employee: { fullName: string; department: { name: string } }
    }>
  ).map((log) => ({
    employeeId: log.employeeId,
    employeeName: log.employee.fullName,
    department: log.employee.department.name,
    checkInAt: log.checkInAt.toISOString(),
    status: log.status,
    workMode: log.workMode ?? 'WFO',
  }))
}
