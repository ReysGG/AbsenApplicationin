/**
 * dailySummaryJob.ts — Nightly daily summary job.
 *
 * Runs once daily. Simplified v1: fires at the next UTC midnight, then every 24 hours.
 * For each active workspace, logs a summary of attendance stats for "yesterday" in the
 * workspace's local timezone. No DB write needed for v1 — just logs the stats.
 *
 * Production upgrade path: replace the log statement with a DB write to a
 * WorkspaceDailySummary table when pre-aggregation is required.
 *
 * Requirements: 15.8
 */

import { prisma } from '../config/prisma'
import { logger } from '../lib/logger'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DAILY_INTERVAL_MS = 24 * 60 * 60 * 1000   // 24 hours

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Return the YYYY-MM-DD date string for "yesterday" in the given IANA timezone.
 */
function getYesterdayLocal(timezone: string): string {
  const yesterday = new Date(Date.now() - DAILY_INTERVAL_MS)
  return yesterday.toLocaleDateString('en-CA', { timeZone: timezone })
}

// ---------------------------------------------------------------------------
// Core summary logic
// ---------------------------------------------------------------------------

async function computeSummaryForWorkspace(workspaceId: string, timezone: string): Promise<void> {
  const dateStr = getYesterdayLocal(timezone)
  const startOfDay = new Date(`${dateStr}T00:00:00.000Z`)
  const endOfDay = new Date(`${dateStr}T23:59:59.999Z`)

  // Count attendance statuses for the day
  const counts = await (prisma as any).attendanceLog.groupBy({
    by: ['status'],
    where: {
      workspaceId,
      attendanceDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    _count: { status: true },
  })

  const summary: Record<string, number> = {}
  for (const row of counts) {
    summary[row.status as string] = (row._count as any).status
  }

  logger.info('dailySummaryJob: daily summary', {
    workspaceId,
    date: dateStr,
    present: summary['Present'] ?? 0,
    late: summary['Late'] ?? 0,
    absent: summary['Absent'] ?? 0,
    leave: summary['Leave'] ?? 0,
    missingCheckout: summary['MissingCheckout'] ?? 0,
    pendingCheckout: summary['PendingCheckout'] ?? 0,
    invalid: summary['Invalid'] ?? 0,
    total: Object.values(summary).reduce((a, b) => a + b, 0),
  })
}

async function runDailySummaryJob(): Promise<void> {
  logger.info('dailySummaryJob: starting run')

  try {
    const workspaces = await (prisma as any).workspace.findMany({
      where: { status: 'Active' },
      select: { id: true, timezone: true },
    })

    for (const ws of workspaces) {
      try {
        await computeSummaryForWorkspace(ws.id, ws.timezone ?? 'Asia/Jakarta')
      } catch (err) {
        logger.error('dailySummaryJob: error computing summary for workspace', {
          workspaceId: ws.id,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }
  } catch (err) {
    logger.error('dailySummaryJob: unhandled error', {
      error: err instanceof Error ? err.message : String(err),
    })
  }

  logger.info('dailySummaryJob: run complete')
}

// ---------------------------------------------------------------------------
// Scheduling helpers
// ---------------------------------------------------------------------------

/**
 * Compute milliseconds until the next UTC midnight.
 */
function msUntilNextUtcMidnight(): number {
  const now = Date.now()
  const nextMidnight = new Date()
  nextMidnight.setUTCHours(24, 0, 0, 0) // set to the next day at 00:00:00.000 UTC
  return nextMidnight.getTime() - now
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Start the daily summary job.
 * Fires once at the next UTC midnight, then every 24 hours.
 * Returns a stop function for graceful shutdown.
 *
 * Requirements: 15.8
 */
export function startDailySummaryJob(): () => void {
  logger.info('dailySummaryJob: starting, first run at next UTC midnight')

  let intervalHandle: ReturnType<typeof setInterval> | null = null

  const delayMs = msUntilNextUtcMidnight()

  const initialTimer = setTimeout(() => {
    void runDailySummaryJob()
    intervalHandle = setInterval(() => void runDailySummaryJob(), DAILY_INTERVAL_MS)
  }, delayMs)

  logger.info(`dailySummaryJob: scheduled in ${Math.round(delayMs / 60_000)} minutes`)

  return () => {
    clearTimeout(initialTimer)
    if (intervalHandle) clearInterval(intervalHandle)
    logger.info('dailySummaryJob: stopped')
  }
}
