/**
 * reports.test.ts — Unit tests for the reports and exports services.
 *
 * Tests:
 *   - Summary report returns correct counts
 *   - Daily detail is paginated
 *   - Late report filters by status=Late
 *   - Missing checkout report filters by status=MissingCheckout
 *   - Export ≤5000 rows → returns buffer inline (sync)
 *   - Export >5000 and ≤50000 rows → creates ExportJob, returns { jobId, status: "Queued" }
 *   - Export >50000 rows → throws ValidationError (400)
 *   - listExportJobs → returns job list for user
 *   - getExportJobById → success + ownership check
 *   - getExportJobById → forbidden for different user
 *   - generateCSV → produces BOM + semicolon delimiter + header row
 *   - generateCSV → escapes fields with semicolons
 *
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9, 12.10, 12.13, 12.14
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mock prisma BEFORE importing services
// ---------------------------------------------------------------------------

vi.mock('../config/prisma', () => {
  const attendanceLog = {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
  }
  const exportJob = {
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
  }
  const auditLog = { create: vi.fn() }
  return {
    prisma: { attendanceLog, exportJob, auditLog },
  }
})

vi.mock('../config/env', () => ({
  env: {
    NODE_ENV: 'test',
    INTERNAL_JWT_SECRET: 'test-secret-minimum-32-characters-long-ok',
    SUPABASE_URL: '',
    SUPABASE_SERVICE_ROLE_KEY: '',
  },
}))

vi.mock('../config/supabaseStorage', () => ({
  getStorageClient: () => ({
    upload: vi.fn().mockResolvedValue({
      storagePath: 'exports/test.csv',
      signedUrl: 'http://localhost/dev-storage/exports/test.csv',
      devMode: true,
    }),
    getSignedUrl: vi.fn().mockResolvedValue('http://localhost/signed/test.csv'),
  }),
  LEAVE_ATTACHMENTS_BUCKET: 'leave-attachments',
  MAX_ATTACHMENT_SIZE_BYTES: 5 * 1024 * 1024,
  ALLOWED_ATTACHMENT_MIME_TYPES: ['application/pdf', 'image/jpeg', 'image/png'],
}))

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------
import { prisma } from '../config/prisma'
import {
  getAttendanceSummary,
  getDailyDetail,
  getLateReport,
  getMissingCheckoutReport,
  exportReport,
} from '../modules/reports/reports.service'
import { listExportJobs, getExportJobById } from '../modules/exports/exports.service'
import { generateCSV } from '../lib/excelExport'
import { ValidationError, ForbiddenError, NotFoundError } from '../lib/errors'
import type { ScopeFilter } from '../types/auth'

// ---------------------------------------------------------------------------
// Test constants
// ---------------------------------------------------------------------------

const WORKSPACE_ID = 'ws-test-001'
const USER_ID = 'user-001'
const OTHER_USER_ID = 'user-002'

const workspaceScopeFilter: ScopeFilter = {
  departmentIds: [],
  locationIds: [],
  isWorkspaceScope: true,
}

const baseLog = {
  id: 'att-001',
  workspaceId: WORKSPACE_ID,
  employeeId: 'emp-001',
  attendanceDate: new Date('2024-07-15T00:00:00.000Z'),
  shiftId: 'shift-001',
  checkInAt: new Date('2024-07-15T08:05:00.000Z'),
  checkOutAt: new Date('2024-07-15T17:10:00.000Z'),
  locationId: 'loc-001',
  workMode: 'WFO',
  faceCheckStatus: 'Passed',
  geofenceStatus: 'Valid',
  spoofingStatus: 'Clean',
  syncStatus: 'Synced',
  originalCheckInAt: new Date('2024-07-15T08:00:00.000Z'),
  syncedAt: new Date('2024-07-15T08:05:00.000Z'),
  status: 'Present',
  isDuplicate: false,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  employee: {
    fullName: 'Budi Santoso',
    employeeCode: 'EMP-2024-0001',
    departmentId: 'dept-001',
    department: { name: 'Engineering' },
  },
  shift: { name: 'Pagi' },
  location: { name: 'Kantor Pusat' },
}

const baseExportJob = {
  id: 'job-001',
  workspaceId: WORKSPACE_ID,
  requestedBy: USER_ID,
  reportType: 'AttendanceSummary',
  format: 'CSV',
  rowCount: 42,
  status: 'Queued',
  filePath: null,
  signedUrlExpiresAt: null,
  requestedAt: new Date(),
  completedAt: null,
  errorMessage: null,
  filtersJson: {},
  createdAt: new Date(),
  updatedAt: new Date(),
}

function resetMocks() {
  vi.mocked(prisma.attendanceLog.findMany).mockReset()
  vi.mocked(prisma.attendanceLog.findFirst).mockReset()
  vi.mocked(prisma.attendanceLog.count).mockReset()
  vi.mocked(prisma.exportJob.create).mockReset()
  vi.mocked(prisma.exportJob.findFirst).mockReset()
  vi.mocked(prisma.exportJob.findMany).mockReset()
  vi.mocked(prisma.exportJob.count).mockReset()
  vi.mocked(prisma.exportJob.update).mockReset()
  vi.mocked(prisma.auditLog.create).mockReset().mockResolvedValue({} as never)
}

// ---------------------------------------------------------------------------
// getAttendanceSummary
// ---------------------------------------------------------------------------

describe('getAttendanceSummary', () => {
  beforeEach(resetMocks)

  it('returns correct summary counts and sample rows (R12.1, R12.2, R12.3)', async () => {
    // 7 count calls: total, present, late, absent, leave, missingCheckout + findMany (sample)
    vi.mocked(prisma.attendanceLog.count)
      .mockResolvedValueOnce(20 as never) // total
      .mockResolvedValueOnce(10 as never) // present
      .mockResolvedValueOnce(5 as never)  // late
      .mockResolvedValueOnce(3 as never)  // absent
      .mockResolvedValueOnce(2 as never)  // leave
      .mockResolvedValueOnce(0 as never)  // missingCheckout
    vi.mocked(prisma.attendanceLog.findMany).mockResolvedValueOnce([baseLog] as never)

    const result = await getAttendanceSummary({
      workspaceId: WORKSPACE_ID,
      query: { page: 1, page_size: 25 },
      scopeFilter: workspaceScopeFilter,
    })

    expect(result.summary.total).toBe(20)
    expect(result.summary.present).toBe(10)
    expect(result.summary.late).toBe(5)
    expect(result.summary.absent).toBe(3)
    expect(result.summary.leave).toBe(2)
    expect(result.summary.missingCheckout).toBe(0)
    expect(result.totalRows).toBe(20)
    expect(result.sampleRows).toHaveLength(1)
    expect((result.sampleRows[0] as Record<string, unknown>)['employeeName']).toBe('Budi Santoso')
  })

  it('enforces workspace isolation (R12.6)', async () => {
    vi.mocked(prisma.attendanceLog.count).mockResolvedValue(0 as never)
    vi.mocked(prisma.attendanceLog.findMany).mockResolvedValueOnce([] as never)

    await getAttendanceSummary({
      workspaceId: WORKSPACE_ID,
      query: { page: 1, page_size: 25 },
      scopeFilter: workspaceScopeFilter,
    })

    const call = vi.mocked(prisma.attendanceLog.count).mock.calls[0]?.[0] as {
      where: Record<string, unknown>
    }
    expect(call.where['workspaceId']).toBe(WORKSPACE_ID)
  })

  it('returns empty summary when no data', async () => {
    vi.mocked(prisma.attendanceLog.count).mockResolvedValue(0 as never)
    vi.mocked(prisma.attendanceLog.findMany).mockResolvedValueOnce([] as never)

    const result = await getAttendanceSummary({
      workspaceId: WORKSPACE_ID,
      query: { page: 1, page_size: 25 },
      scopeFilter: workspaceScopeFilter,
    })

    expect(result.summary.total).toBe(0)
    expect(result.sampleRows).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// getDailyDetail
// ---------------------------------------------------------------------------

describe('getDailyDetail', () => {
  beforeEach(resetMocks)

  it('returns paginated list with correct pagination (R12.5)', async () => {
    vi.mocked(prisma.attendanceLog.count).mockResolvedValueOnce(50 as never)
    vi.mocked(prisma.attendanceLog.findMany).mockResolvedValueOnce([baseLog] as never)

    const result = await getDailyDetail({
      workspaceId: WORKSPACE_ID,
      query: { page: 2, page_size: 25 },
      scopeFilter: workspaceScopeFilter,
    })

    expect(result.pagination.page).toBe(2)
    expect(result.pagination.page_size).toBe(25)
    expect(result.pagination.total).toBe(50)
    expect(result.pagination.total_pages).toBe(2)
    expect(result.items).toHaveLength(1)
  })

  it('applies skip based on page number', async () => {
    vi.mocked(prisma.attendanceLog.count).mockResolvedValueOnce(100 as never)
    vi.mocked(prisma.attendanceLog.findMany).mockResolvedValueOnce([] as never)

    await getDailyDetail({
      workspaceId: WORKSPACE_ID,
      query: { page: 3, page_size: 10 },
      scopeFilter: workspaceScopeFilter,
    })

    const findCall = vi.mocked(prisma.attendanceLog.findMany).mock.calls[0]?.[0] as {
      skip: number
      take: number
    }
    expect(findCall.skip).toBe(20) // (3-1) * 10
    expect(findCall.take).toBe(10)
  })

  it('enforces workspace isolation', async () => {
    vi.mocked(prisma.attendanceLog.count).mockResolvedValueOnce(0 as never)
    vi.mocked(prisma.attendanceLog.findMany).mockResolvedValueOnce([] as never)

    await getDailyDetail({
      workspaceId: WORKSPACE_ID,
      query: { page: 1, page_size: 25 },
      scopeFilter: workspaceScopeFilter,
    })

    const countCall = vi.mocked(prisma.attendanceLog.count).mock.calls[0]?.[0] as {
      where: Record<string, unknown>
    }
    expect(countCall.where['workspaceId']).toBe(WORKSPACE_ID)
  })
})

// ---------------------------------------------------------------------------
// getLateReport
// ---------------------------------------------------------------------------

describe('getLateReport', () => {
  beforeEach(resetMocks)

  it('filters by status=Late (R12.1)', async () => {
    vi.mocked(prisma.attendanceLog.count).mockResolvedValueOnce(3 as never)
    vi.mocked(prisma.attendanceLog.findMany).mockResolvedValueOnce([
      { ...baseLog, status: 'Late' },
    ] as never)

    const result = await getLateReport({
      workspaceId: WORKSPACE_ID,
      query: { page: 1, page_size: 25 },
      scopeFilter: workspaceScopeFilter,
    })

    const countCall = vi.mocked(prisma.attendanceLog.count).mock.calls[0]?.[0] as {
      where: Record<string, unknown>
    }
    expect(countCall.where['status']).toBe('Late')
    expect(result.items).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// getMissingCheckoutReport
// ---------------------------------------------------------------------------

describe('getMissingCheckoutReport', () => {
  beforeEach(resetMocks)

  it('filters by status=MissingCheckout (R12.1)', async () => {
    vi.mocked(prisma.attendanceLog.count).mockResolvedValueOnce(2 as never)
    vi.mocked(prisma.attendanceLog.findMany).mockResolvedValueOnce([
      { ...baseLog, status: 'MissingCheckout', checkOutAt: null },
    ] as never)

    const result = await getMissingCheckoutReport({
      workspaceId: WORKSPACE_ID,
      query: { page: 1, page_size: 25 },
      scopeFilter: workspaceScopeFilter,
    })

    const countCall = vi.mocked(prisma.attendanceLog.count).mock.calls[0]?.[0] as {
      where: Record<string, unknown>
    }
    expect(countCall.where['status']).toBe('MissingCheckout')
    expect(result.items).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// exportReport
// ---------------------------------------------------------------------------

describe('exportReport', () => {
  beforeEach(resetMocks)

  it('sync export (≤5000 rows) → returns buffer inline (R12.4, R12.7, R12.9)', async () => {
    const TOTAL = 100
    vi.mocked(prisma.attendanceLog.count).mockResolvedValueOnce(TOTAL as never)
    vi.mocked(prisma.attendanceLog.findMany).mockResolvedValueOnce([baseLog] as never)
    vi.mocked(prisma.exportJob.create).mockResolvedValueOnce(baseExportJob as never)

    const result = await exportReport({
      workspaceId: WORKSPACE_ID,
      query: {
        format: 'csv',
        report_type: 'AttendanceSummary',
        start_date: '2024-07-01',
        end_date: '2024-07-31',
      },
      actorUserId: USER_ID,
      scopeFilter: workspaceScopeFilter,
    })

    expect(result.type).toBe('sync')
    if (result.type === 'sync') {
      expect(result.buffer).toBeInstanceOf(Buffer)
      expect(result.mimeType).toContain('csv')
      expect(result.fileName).toMatch(/\.csv$/)
    }
  })

  it('async export (>5000 rows) → creates ExportJob, returns jobId (R12.4, R12.8)', async () => {
    const TOTAL = 7500
    vi.mocked(prisma.attendanceLog.count).mockResolvedValueOnce(TOTAL as never)
    vi.mocked(prisma.exportJob.create).mockResolvedValueOnce({
      ...baseExportJob,
      id: 'job-async-001',
      status: 'Queued',
      rowCount: TOTAL,
    } as never)

    const result = await exportReport({
      workspaceId: WORKSPACE_ID,
      query: {
        format: 'xlsx',
        report_type: 'DailyDetail',
      },
      actorUserId: USER_ID,
      scopeFilter: workspaceScopeFilter,
    })

    expect(result.type).toBe('async')
    if (result.type === 'async') {
      expect(result.jobId).toBe('job-async-001')
      expect(result.status).toBe('Queued')
    }

    // Verify ExportJob was created with Queued status
    expect(vi.mocked(prisma.exportJob.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          workspaceId: WORKSPACE_ID,
          requestedBy: USER_ID,
          status: 'Queued',
          rowCount: TOTAL,
        }),
      }),
    )
  })

  it('export >50000 rows → throws ValidationError (R12.8)', async () => {
    vi.mocked(prisma.attendanceLog.count).mockResolvedValueOnce(55000 as never)

    await expect(
      exportReport({
        workspaceId: WORKSPACE_ID,
        query: {
          format: 'csv',
          report_type: 'AttendanceSummary',
        },
        actorUserId: USER_ID,
        scopeFilter: workspaceScopeFilter,
      }),
    ).rejects.toThrow(ValidationError)
  })

  it('sync export writes audit log with export_report action (R12.13, R14.1)', async () => {
    vi.mocked(prisma.attendanceLog.count).mockResolvedValueOnce(10 as never)
    vi.mocked(prisma.attendanceLog.findMany).mockResolvedValueOnce([baseLog] as never)
    vi.mocked(prisma.exportJob.create).mockResolvedValueOnce({
      ...baseExportJob,
      id: 'job-audit-001',
    } as never)

    await exportReport({
      workspaceId: WORKSPACE_ID,
      query: { format: 'csv', report_type: 'AttendanceSummary' },
      actorUserId: USER_ID,
      scopeFilter: workspaceScopeFilter,
      requestId: 'req-123',
    })

    expect(vi.mocked(prisma.auditLog.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'export_report',
          workspaceId: WORKSPACE_ID,
          actorUserId: USER_ID,
        }),
      }),
    )
  })

  it('scope filter enforces cross-workspace isolation (R12.6)', async () => {
    vi.mocked(prisma.attendanceLog.count).mockResolvedValueOnce(0 as never)
    vi.mocked(prisma.attendanceLog.findMany).mockResolvedValueOnce([] as never)
    vi.mocked(prisma.exportJob.create).mockResolvedValueOnce(baseExportJob as never)

    await exportReport({
      workspaceId: WORKSPACE_ID,
      query: { format: 'csv', report_type: 'AttendanceSummary' },
      actorUserId: USER_ID,
      scopeFilter: workspaceScopeFilter,
    })

    const countCall = vi.mocked(prisma.attendanceLog.count).mock.calls[0]?.[0] as {
      where: Record<string, unknown>
    }
    expect(countCall.where['workspaceId']).toBe(WORKSPACE_ID)
  })
})

// ---------------------------------------------------------------------------
// listExportJobs
// ---------------------------------------------------------------------------

describe('listExportJobs', () => {
  beforeEach(resetMocks)

  it('returns paginated list of export jobs for the user (R12.10, R12.13)', async () => {
    vi.mocked(prisma.exportJob.count).mockResolvedValueOnce(2 as never)
    vi.mocked(prisma.exportJob.findMany).mockResolvedValueOnce([
      baseExportJob,
      { ...baseExportJob, id: 'job-002' },
    ] as never)

    const result = await listExportJobs({
      workspaceId: WORKSPACE_ID,
      userId: USER_ID,
      page: 1,
      pageSize: 30,
    })

    expect(result.items).toHaveLength(2)
    expect(result.pagination.total).toBe(2)
  })

  it('passes userId filter to query (R12.13 — only own jobs)', async () => {
    vi.mocked(prisma.exportJob.count).mockResolvedValueOnce(0 as never)
    vi.mocked(prisma.exportJob.findMany).mockResolvedValueOnce([] as never)

    await listExportJobs({
      workspaceId: WORKSPACE_ID,
      userId: USER_ID,
      page: 1,
      pageSize: 30,
    })

    const countCall = vi.mocked(prisma.exportJob.count).mock.calls[0]?.[0] as {
      where: Record<string, unknown>
    }
    expect(countCall.where['requestedBy']).toBe(USER_ID)
    expect(countCall.where['workspaceId']).toBe(WORKSPACE_ID)
  })
})

// ---------------------------------------------------------------------------
// getExportJobById
// ---------------------------------------------------------------------------

describe('getExportJobById', () => {
  beforeEach(resetMocks)

  it('returns job with status (R12.14)', async () => {
    vi.mocked(prisma.exportJob.findFirst).mockResolvedValueOnce(baseExportJob as never)

    const result = await getExportJobById({
      workspaceId: WORKSPACE_ID,
      jobId: 'job-001',
      userId: USER_ID,
    })

    expect(result.id).toBe('job-001')
    expect(result.status).toBe('Queued')
    expect(result.signedUrl).toBeNull() // Queued, no filePath
  })

  it('returns signed URL when job is Completed and filePath is set (R12.10, R17.6)', async () => {
    const completedJob = {
      ...baseExportJob,
      status: 'Completed',
      filePath: `${WORKSPACE_ID}/report.csv`,
      completedAt: new Date(),
    }
    vi.mocked(prisma.exportJob.findFirst).mockResolvedValueOnce(completedJob as never)
    vi.mocked(prisma.exportJob.update).mockResolvedValueOnce(completedJob as never)

    const result = await getExportJobById({
      workspaceId: WORKSPACE_ID,
      jobId: 'job-001',
      userId: USER_ID,
    })

    expect(result.status).toBe('Completed')
    expect(result.signedUrl).toBeTruthy()
    expect(result.signedUrl).toContain('signed')
  })

  it('throws ForbiddenError when user is not the owner (R17.6)', async () => {
    vi.mocked(prisma.exportJob.findFirst).mockResolvedValueOnce(baseExportJob as never)

    await expect(
      getExportJobById({
        workspaceId: WORKSPACE_ID,
        jobId: 'job-001',
        userId: OTHER_USER_ID, // Different user
      }),
    ).rejects.toThrow(ForbiddenError)
  })

  it('throws NotFoundError when job does not exist', async () => {
    vi.mocked(prisma.exportJob.findFirst).mockResolvedValueOnce(null as never)

    await expect(
      getExportJobById({
        workspaceId: WORKSPACE_ID,
        jobId: 'job-nonexistent',
        userId: USER_ID,
      }),
    ).rejects.toThrow(NotFoundError)
  })
})

// ---------------------------------------------------------------------------
// generateCSV
// ---------------------------------------------------------------------------

describe('generateCSV', () => {
  it('produces a UTF-8 BOM header', () => {
    const buf = generateCSV([])
    const str = buf.toString('utf-8')
    // UTF-8 BOM is \uFEFF
    expect(str.startsWith('\uFEFF')).toBe(true)
  })

  it('produces semicolon-delimited header row', () => {
    const buf = generateCSV([])
    const str = buf.toString('utf-8')
    const firstLine = str.replace('\uFEFF', '').split('\r\n')[0]!
    expect(firstLine).toContain(';')
    expect(firstLine).toContain('Nama Karyawan')
    expect(firstLine).toContain('Kode Karyawan')
    expect(firstLine).toContain('Tanggal')
    expect(firstLine).toContain('Status')
  })

  it('produces correct data row with all fields', () => {
    const row = {
      employeeName: 'Budi Santoso',
      employeeCode: 'EMP-2024-0001',
      departmentName: 'Engineering',
      date: '2024-07-15',
      shiftName: 'Pagi',
      checkIn: '2024-07-15T08:05:00.000Z',
      checkOut: '2024-07-15T17:10:00.000Z',
      status: 'Present',
      workMode: 'WFO',
      locationName: 'Kantor Pusat',
      notes: '',
    }
    const buf = generateCSV([row])
    const str = buf.toString('utf-8')
    expect(str).toContain('Budi Santoso')
    expect(str).toContain('EMP-2024-0001')
    expect(str).toContain('Present')
  })

  it('escapes fields containing semicolons', () => {
    const row = {
      employeeName: 'Budi; Santoso',
      employeeCode: 'EMP-001',
      departmentName: 'Eng',
      date: '2024-07-15',
      shiftName: 'Pagi',
      checkIn: '',
      checkOut: '',
      status: 'Present',
      workMode: 'WFO',
      locationName: 'Office',
      notes: '',
    }
    const buf = generateCSV([row])
    const str = buf.toString('utf-8')
    expect(str).toContain('"Budi; Santoso"')
  })

  it('escapes fields containing double-quotes', () => {
    const row = {
      employeeName: 'Budi "Si" Santoso',
      employeeCode: 'EMP-001',
      departmentName: 'Eng',
      date: '2024-07-15',
      shiftName: 'Pagi',
      checkIn: '',
      checkOut: '',
      status: 'Present',
      workMode: 'WFO',
      locationName: 'Office',
      notes: '',
    }
    const buf = generateCSV([row])
    const str = buf.toString('utf-8')
    // Double-quotes inside quoted field should be doubled
    expect(str).toContain('"Budi ""Si"" Santoso"')
  })

  it('returns Buffer instance', () => {
    const buf = generateCSV([])
    expect(buf).toBeInstanceOf(Buffer)
  })
})
