/**
 * exportWorker.ts — In-process worker that processes queued async ExportJobs.
 *
 * Polls the DB every 30 seconds for ExportJob records with status=Queued.
 * For each job:
 *   1. Set status = Processing
 *   2. Fetch all attendance logs matching the stored filtersJson
 *   3. Generate CSV or XLSX buffer
 *   4. Upload to Supabase Storage bucket "exports" at path: {workspaceId}/{jobId}.{format}
 *   5. Update ExportJob: status=Completed, filePath, completedAt
 *   6. On error: set status=Failed, errorMessage
 *
 * Requirements: 12.8, 12.9, 12.10
 */

import { prisma } from '../config/prisma'
import { getStorageClient } from '../config/supabaseStorage'
import { generateCSV, generateXLSX } from '../lib/excelExport'
import { logger } from '../lib/logger'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const POLL_INTERVAL_MS = 30_000
const EXPORTS_BUCKET = 'exports'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** The standard include block for attendance log fetches */
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

/** Build Prisma where clause from stored filtersJson */
function buildWhereFromFilters(
  workspaceId: string,
  filters: Record<string, unknown>,
): Record<string, unknown> {
  const where: Record<string, unknown> = { workspaceId }

  const { startDate, endDate, departmentId, locationId, shiftId } = filters as {
    startDate?: string
    endDate?: string
    departmentId?: string
    locationId?: string
    shiftId?: string
  }

  if (startDate || endDate) {
    where['attendanceDate'] = {
      ...(startDate ? { gte: new Date(`${startDate}T00:00:00.000Z`) } : {}),
      ...(endDate ? { lte: new Date(`${endDate}T23:59:59.999Z`) } : {}),
    }
  }

  if (locationId) {
    where['locationId'] = locationId
  }

  if (shiftId) {
    where['shiftId'] = shiftId
  }

  if (departmentId) {
    where['employee'] = { departmentId }
  }

  return where
}

/** Convert attendance logs to report rows for CSV/XLSX generation */
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
// Core processing logic
// ---------------------------------------------------------------------------

/**
 * Processes a single ExportJob record.
 * Errors are caught and stored on the job record (status=Failed).
 */
async function processJob(job: {
  id: string
  workspaceId: string
  format: string
  filtersJson: unknown
}): Promise<void> {
  const { id: jobId, workspaceId, format, filtersJson } = job

  logger.info('exportWorker: processing job', { jobId, workspaceId, format })

  try {
    // 1. Set status = Processing
    await (prisma as any).exportJob.update({
      where: { id: jobId },
      data: { status: 'Processing' },
    })

    // 2. Fetch all attendance logs matching the stored filtersJson
    const filters = (filtersJson ?? {}) as Record<string, unknown>
    const where = buildWhereFromFilters(workspaceId, filters)

    const logs = await (prisma as any).attendanceLog.findMany({
      where,
      orderBy: [{ attendanceDate: 'desc' }, { checkInAt: 'asc' }],
      include: attendanceInclude,
    })

    const rows = toReportRows(logs as Record<string, unknown>[])

    // 3. Generate CSV or XLSX buffer
    const isXlsx = format === 'XLSX' || format === 'xlsx'
    let buffer: Buffer
    let mimeType: string
    let fileExt: string

    if (isXlsx) {
      buffer = await generateXLSX(rows, 'Laporan Absensi')
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      fileExt = 'xlsx'
    } else {
      buffer = generateCSV(rows)
      mimeType = 'text/csv; charset=utf-8'
      fileExt = 'csv'
    }

    // 4. Upload to Supabase Storage bucket "exports" at path: {workspaceId}/{jobId}.{format}
    const storagePath = `${workspaceId}/${jobId}.${fileExt}`
    const storage = getStorageClient()
    await storage.upload(EXPORTS_BUCKET, storagePath, buffer, mimeType)

    // 5. Update ExportJob: status=Completed, filePath, rowCount, completedAt
    const completedAt = new Date()
    await (prisma as any).exportJob.update({
      where: { id: jobId },
      data: {
        status: 'Completed',
        filePath: storagePath,
        rowCount: rows.length,
        completedAt,
      },
    })

    logger.info('exportWorker: job completed', { jobId, rowCount: rows.length, storagePath })
  } catch (err) {
    // 6. On error: set status=Failed, errorMessage
    const errorMessage =
      err instanceof Error ? err.message : String(err)

    logger.error('exportWorker: job failed', { jobId, error: errorMessage })

    try {
      await (prisma as any).exportJob.update({
        where: { id: jobId },
        data: {
          status: 'Failed',
          errorMessage,
          completedAt: new Date(),
        },
      })
    } catch (updateErr) {
      // Non-critical — log and move on
      logger.error('exportWorker: failed to update job status to Failed', {
        jobId,
        error: updateErr instanceof Error ? updateErr.message : String(updateErr),
      })
    }
  }
}

// ---------------------------------------------------------------------------
// Polling loop
// ---------------------------------------------------------------------------

/**
 * Pick one Queued job and process it (one job per polling cycle, no parallelism).
 */
async function pollOnce(): Promise<void> {
  try {
    const job = await (prisma as any).exportJob.findFirst({
      where: { status: 'Queued' },
      orderBy: { requestedAt: 'asc' },
    })

    if (!job) {
      return
    }

    await processJob(job as { id: string; workspaceId: string; format: string; filtersJson: unknown })
  } catch (err) {
    // Do not crash the worker on unexpected errors
    logger.error('exportWorker: unhandled error during poll', {
      error: err instanceof Error ? err.message : String(err),
    })
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Start the export worker.
 * Returns a cleanup function that stops the polling interval (for graceful shutdown).
 *
 * Requirements: 12.8, 12.9, 12.10
 */
export function startExportWorker(): () => void {
  logger.info('exportWorker: starting, polling every 30 seconds')

  // Run once immediately, then on interval
  void pollOnce()
  const handle = setInterval(() => void pollOnce(), POLL_INTERVAL_MS)

  return () => {
    clearInterval(handle)
    logger.info('exportWorker: stopped')
  }
}
