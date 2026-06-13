/**
 * system.service.ts — real system-health probe for the platform console.
 *
 * Replaces the hardcoded uptime/latency figures on /admin/system-health with
 * measurable signals: a live DB connectivity check (+ round-trip latency),
 * the API process uptime, and a few real counts. Metrics we cannot truly
 * measure here (per-service uptime %, push delivery) are intentionally NOT
 * fabricated — the frontend labels those as illustrative.
 *
 * Requirements: audit §4 (system-health), §11.
 */

import { prisma } from '../../config/prisma'

export interface SystemHealthDto {
  status: 'ok' | 'degraded' | 'down'
  uptimeSeconds: number
  timestamp: string
  database: {
    status: 'up' | 'down'
    latencyMs: number | null
  }
  counts: {
    workspaces: number
    employees: number
    attendanceToday: number
    openTickets: number
  }
}

/** UTC midnight of the Asia/Jakarta calendar date of [d]. */
function jakartaDateOnly(d: Date): Date {
  const j = new Date(d.getTime() + 7 * 60 * 60 * 1000)
  return new Date(Date.UTC(j.getUTCFullYear(), j.getUTCMonth(), j.getUTCDate()))
}

export async function getSystemHealth(now: Date): Promise<SystemHealthDto> {
  // 1. Live DB connectivity check with round-trip latency.
  let dbStatus: 'up' | 'down' = 'down'
  let latencyMs: number | null = null
  try {
    const start = Date.now()
    await prisma.$queryRaw`SELECT 1`
    latencyMs = Date.now() - start
    dbStatus = 'up'
  } catch {
    dbStatus = 'down'
  }

  // 2. Real counts (best-effort; default to 0 if the DB is unreachable).
  let workspaces = 0
  let employees = 0
  let attendanceToday = 0
  let openTickets = 0
  if (dbStatus === 'up') {
    const today = jakartaDateOnly(now)
    try {
      ;[workspaces, employees, attendanceToday, openTickets] = await Promise.all([
        prisma.workspace.count(),
        prisma.employee.count(),
        prisma.attendanceLog.count({ where: { attendanceDate: today } }),
        prisma.supportTicket.count({ where: { status: { in: ['Open', 'InProgress'] } } }),
      ])
    } catch {
      // leave defaults
    }
  }

  const status: SystemHealthDto['status'] = dbStatus === 'up' ? 'ok' : 'down'

  return {
    status,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: now.toISOString(),
    database: { status: dbStatus, latencyMs },
    counts: { workspaces, employees, attendanceToday, openTickets },
  }
}
