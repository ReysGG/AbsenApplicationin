/**
 * missingCheckoutJob.ts — Scheduled job that marks PendingCheckout logs as MissingCheckout.
 *
 * Runs every 30 minutes.
 * Finds AttendanceLogs with status = PendingCheckout where:
 *   - check_in_at is set (valid check-in exists)
 *   - check_out_at is null
 *   - shift end time + checkoutToleranceMinutes has passed (in UTC)
 * Updates those logs to status = MissingCheckout.
 *
 * Overnight shifts: shift endTime may be on the following day.
 * Uses the shift's checkoutToleranceMinutes for the tolerance window.
 *
 * Requirements: 15.7, 15.9, 15.11
 */

import { prisma } from '../config/prisma'
import { logger } from '../lib/logger'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const JOB_INTERVAL_MS = 30 * 60 * 1000   // 30 minutes

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse "HH:MM" time string into hours and minutes.
 */
function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [h, m] = timeStr.split(':').map(Number)
  return { hours: h ?? 0, minutes: m ?? 0 }
}

/**
 * Build a UTC Date for a given local date string (YYYY-MM-DD) + HH:MM time string
 * in the given IANA timezone.
 */
function localTimeToUtc(localDateStr: string, timeStr: string, timezone: string): Date {
  const { hours, minutes } = parseTime(timeStr)
  const naive = new Date(
    `${localDateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`,
  )

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

  const offset = naive.getTime() - utcMs
  return new Date(naive.getTime() + offset)
}

/**
 * Add days to a YYYY-MM-DD string.
 */
function addDaysToDateStr(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00.000Z`) // noon UTC avoids DST issues
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

// ---------------------------------------------------------------------------
// Core missing-checkout logic
// ---------------------------------------------------------------------------

async function runMissingCheckoutJob(): Promise<void> {
  logger.debug('missingCheckoutJob: starting run')

  const now = new Date()

  try {
    // Find all PendingCheckout logs that have a shift
    const pendingLogs = await (prisma as any).attendanceLog.findMany({
      where: {
        status: 'PendingCheckout',
        checkInAt: { not: null },
        checkOutAt: null,
        shiftId: { not: null },
      },
      include: {
        shift: {
          select: {
            startTime: true,
            endTime: true,
            checkoutToleranceMinutes: true,
          },
        },
        workspace: {
          select: { timezone: true },
        },
      },
    })

    logger.debug(`missingCheckoutJob: evaluating ${pendingLogs.length} PendingCheckout logs`)

    let updatedCount = 0

    for (const log of pendingLogs) {
      const shift = log.shift
      const workspace = log.workspace
      if (!shift || !workspace) continue

      const timezone: string = workspace.timezone ?? 'Asia/Jakarta'
      const toleranceMinutes: number = shift.checkoutToleranceMinutes ?? 60

      // Determine the attendance date string
      const attendanceDateStr = (log.attendanceDate as Date).toISOString().slice(0, 10)

      // Check if this is an overnight shift (endTime < startTime)
      const startParsed = parseTime(shift.startTime)
      const endParsed = parseTime(shift.endTime)
      const isOvernightShift =
        endParsed.hours < startParsed.hours ||
        (endParsed.hours === startParsed.hours && endParsed.minutes < startParsed.minutes)

      // For overnight shifts, shift end is on the next day
      const shiftEndDateStr = isOvernightShift
        ? addDaysToDateStr(attendanceDateStr, 1)
        : attendanceDateStr

      // Compute shift end UTC + tolerance
      const shiftEndUtc = localTimeToUtc(shiftEndDateStr, shift.endTime, timezone)
      const deadlineUtc = new Date(shiftEndUtc.getTime() + toleranceMinutes * 60 * 1000)

      if (now >= deadlineUtc) {
        try {
          await (prisma as any).attendanceLog.update({
            where: { id: log.id },
            data: { status: 'MissingCheckout' },
          })
          updatedCount++
          logger.debug('missingCheckoutJob: updated to MissingCheckout', { logId: log.id })
        } catch (err) {
          logger.error('missingCheckoutJob: failed to update log', {
            logId: log.id,
            error: err instanceof Error ? err.message : String(err),
          })
        }
      }
    }

    if (updatedCount > 0) {
      logger.info(`missingCheckoutJob: marked ${updatedCount} log(s) as MissingCheckout`)
    }
  } catch (err) {
    logger.error('missingCheckoutJob: unhandled error', {
      error: err instanceof Error ? err.message : String(err),
    })
  }

  logger.debug('missingCheckoutJob: run complete')
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Start the missing-checkout job.
 * Runs every 30 minutes.
 * Returns a stop function for graceful shutdown.
 *
 * Requirements: 15.7
 */
export function startMissingCheckoutJob(): () => void {
  logger.info('missingCheckoutJob: starting, runs every 30 minutes')

  // Run once immediately after a short delay
  const startupTimer = setTimeout(() => void runMissingCheckoutJob(), 8_000)

  const handle = setInterval(() => void runMissingCheckoutJob(), JOB_INTERVAL_MS)

  return () => {
    clearTimeout(startupTimer)
    clearInterval(handle)
    logger.info('missingCheckoutJob: stopped')
  }
}
