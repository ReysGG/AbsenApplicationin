/**
 * absentJob.ts — Scheduled job that marks employees as Absent.
 *
 * Runs every 15 minutes. For each active workspace:
 *   1. Find active employees with an assigned shift whose work day includes today.
 *   2. The employee has no AttendanceLog for today (of status Present/Late/Leave/Invalid).
 *   3. The shift start + absenceCutoffMinutes has already passed (in the workspace's timezone).
 *   4. The employee has no approved LeaveRequest covering today.
 *   → Create an AttendanceLog with status = Absent.
 *
 * Effective-dated shift rule: uses the shift assigned on the attendance date.
 * Overnight shifts: attendance date = shift start date (R15.9).
 * Duplicate guard: skip if an AttendanceLog for that employee+date already exists (R15.10).
 *
 * Requirements: 15.1, 15.5, 15.6, 15.9, 15.10, 15.11
 */

import { prisma } from '../config/prisma'
import { logger } from '../lib/logger'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const JOB_INTERVAL_MS = 15 * 60 * 1000   // 15 minutes

/**
 * Map short day-of-week strings used in shift.workDays to JS Date.getDay() indices.
 * JS: 0=Sunday, 1=Monday, …, 6=Saturday
 */
const DAY_INDEX: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert a UTC Date to the current wall-clock date string (YYYY-MM-DD) in the given IANA timezone.
 */
function toLocalDateString(utcDate: Date, timezone: string): string {
  return utcDate.toLocaleDateString('en-CA', { timeZone: timezone })
  // 'en-CA' uses YYYY-MM-DD format
}

/**
 * Parse "HH:MM" local time string into hours and minutes.
 */
function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [h, m] = timeStr.split(':').map(Number)
  return { hours: h ?? 0, minutes: m ?? 0 }
}

/**
 * Build a UTC Date for a given local YYYY-MM-DD date + HH:MM time in the workspace timezone.
 * Uses the Intl.DateTimeFormat trick to compute the UTC offset.
 */
function localTimeToUtc(localDateStr: string, timeStr: string, timezone: string): Date {
  const { hours, minutes } = parseTime(timeStr)
  // Build a naive ISO-like string and ask Intl to tell us the UTC offset
  const naive = new Date(`${localDateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`)

  // Use Intl.DateTimeFormat to get what the local clock reads for this UTC instant
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(naive)

  const p: Record<string, number> = {}
  for (const part of parts) {
    if (part.type !== 'literal') p[part.type] = parseInt(part.value, 10)
  }

  const utcMs = Date.UTC(
    p['year'] ?? 0,
    (p['month'] ?? 1) - 1,
    p['day'] ?? 1,
    p['hour'] ?? 0,
    p['minute'] ?? 0,
    p['second'] ?? 0,
  )

  // Offset between what Intl says and what we intended
  const offset = naive.getTime() - utcMs
  return new Date(naive.getTime() + offset)
}

// ---------------------------------------------------------------------------
// Core absent-marking logic
// ---------------------------------------------------------------------------

async function markAbsentForWorkspace(
  workspaceId: string,
  timezone: string,
  workspaceAbsenceCutoff: number,
): Promise<void> {
  const now = new Date()
  const todayLocal = toLocalDateString(now, timezone) // e.g. "2025-07-10"
  const todayDate = new Date(`${todayLocal}T00:00:00.000Z`) // inclusive start of attendance_date range

  // Day-of-week for today in workspace timezone (0=Sun … 6=Sat)
  const todayDayIndex = new Date(
    now.toLocaleString('en-US', { timeZone: timezone }),
  ).getDay()

  // Find employees who might be absent today
  const employees = await (prisma as any).employee.findMany({
    where: {
      workspaceId,
      employmentStatus: 'Active',
      assignedShiftId: { not: null },
    },
    include: {
      assignedShift: true,
    },
  })

  for (const employee of employees) {
    const shift = employee.assignedShift
    if (!shift || shift.status !== 'Active') continue

    // Check if today is a work day for this shift
    const shiftWorkDays: string[] = shift.workDays ?? []
    const isWorkDay = shiftWorkDays.some(
      (d: string) => DAY_INDEX[d.toUpperCase()] === todayDayIndex,
    )
    if (!isWorkDay) continue

    // Determine the effective absence cutoff for this shift
    const cutoffMinutes: number =
      shift.absenceCutoffMinutes ?? workspaceAbsenceCutoff

    // Compute shift start UTC + cutoff
    const shiftStartUtc = localTimeToUtc(todayLocal, shift.startTime, timezone)
    const cutoffUtc = new Date(shiftStartUtc.getTime() + cutoffMinutes * 60 * 1000)

    // Only proceed if we are past the cutoff
    if (now < cutoffUtc) continue

    // Check if an AttendanceLog already exists for this employee today
    const existingLog = await (prisma as any).attendanceLog.findFirst({
      where: {
        workspaceId,
        employeeId: employee.id,
        attendanceDate: {
          gte: todayDate,
          lt: new Date(todayDate.getTime() + 24 * 60 * 60 * 1000),
        },
        status: {
          in: ['Present', 'Late', 'Leave', 'Invalid', 'Absent', 'PendingCheckout', 'MissingCheckout'],
        },
      },
    })
    if (existingLog) continue

    // Check if the employee has an approved leave request covering today
    const approvedLeave = await (prisma as any).leaveRequest.findFirst({
      where: {
        workspaceId,
        employeeId: employee.id,
        status: 'Approved',
        startDate: { lte: todayDate },
        endDate: { gte: todayDate },
      },
    })
    if (approvedLeave) continue

    // Check for a holiday on today in this workspace
    const holiday = await (prisma as any).holidayCalendar.findFirst({
      where: {
        workspaceId,
        status: 'Active',
        OR: [
          // Exact date match
          {
            date: {
              gte: todayDate,
              lt: new Date(todayDate.getTime() + 24 * 60 * 60 * 1000),
            },
          },
        ],
      },
    })
    if (holiday) continue

    // Create Absent log
    try {
      await (prisma as any).attendanceLog.create({
        data: {
          workspaceId,
          employeeId: employee.id,
          attendanceDate: todayDate,
          shiftId: shift.id,
          status: 'Absent',
          syncStatus: 'Synced',
          notes: 'Auto-marked Absent by scheduled job',
        },
      })
      logger.info('absentJob: marked employee as Absent', {
        employeeId: employee.id,
        date: todayLocal,
        workspaceId,
      })
    } catch (err) {
      // Unique constraint violation means a log was created concurrently — skip
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('Unique constraint') || msg.includes('unique constraint')) {
        logger.debug('absentJob: concurrent log created, skipping', { employeeId: employee.id })
      } else {
        logger.error('absentJob: failed to create Absent log', {
          employeeId: employee.id,
          error: msg,
        })
      }
    }
  }
}

async function runAbsentJob(): Promise<void> {
  logger.debug('absentJob: starting run')

  try {
    const workspaces = await (prisma as any).workspace.findMany({
      where: { status: 'Active' },
      select: { id: true, timezone: true, absenceCutoffMinutes: true },
    })

    for (const ws of workspaces) {
      try {
        await markAbsentForWorkspace(ws.id, ws.timezone ?? 'Asia/Jakarta', ws.absenceCutoffMinutes ?? 120)
      } catch (err) {
        logger.error('absentJob: error processing workspace', {
          workspaceId: ws.id,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }
  } catch (err) {
    logger.error('absentJob: unhandled error', {
      error: err instanceof Error ? err.message : String(err),
    })
  }

  logger.debug('absentJob: run complete')
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Start the absent-marking job.
 * Runs every 15 minutes.
 * Returns a stop function for graceful shutdown.
 *
 * Requirements: 15.6
 */
export function startAbsentJob(): () => void {
  logger.info('absentJob: starting, runs every 15 minutes')

  // Run once immediately (after a short delay to let the server fully start)
  const startupTimer = setTimeout(() => void runAbsentJob(), 5_000)

  const handle = setInterval(() => void runAbsentJob(), JOB_INTERVAL_MS)

  return () => {
    clearTimeout(startupTimer)
    clearInterval(handle)
    logger.info('absentJob: stopped')
  }
}
