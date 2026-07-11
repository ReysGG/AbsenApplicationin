/**
 * leave.test.ts — Unit tests for Leave service.
 *
 * Requirements validated: 11.1–11.16, 17.6, 17.7
 *
 * Tests:
 *   - listLeaveRequests: returns paginated list, applies scope filter
 *   - createLeaveRequest: success
 *   - createLeaveRequest: overlap → 409 ConflictError
 *   - approveLeaveRequest: success + audit log written
 *   - approveLeaveRequest: approver out of scope → ForbiddenError (R11.5)
 *   - approveLeaveRequest: conflict with attendance → conflictWarning=true (R11.10)
 *   - rejectLeaveRequest: success + audit log
 *   - cancelLeaveRequest: Pending → success + audit log
 *   - cancelLeaveRequest: Approved → ValidationError (R11.14)
 *   - uploadLeaveAttachment: file too large → ValidationError (R17.7)
 *   - uploadLeaveAttachment: invalid MIME → ValidationError (R17.7)
 *   - Zod schemas: createLeaveSchema, rejectLeaveSchema, uploadAttachmentSchema
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mock prisma + storage BEFORE importing service
// ---------------------------------------------------------------------------

vi.mock('../config/prisma', () => {
  return {
    prisma: {
      leaveRequest: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      employee: {
        findFirst: vi.fn(),
      },
      attendanceLog: {
        count: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
    },
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
  getStorageClient: vi.fn(),
  LEAVE_ATTACHMENTS_BUCKET: 'leave-attachments',
  MAX_ATTACHMENT_SIZE_BYTES: 5 * 1024 * 1024,
  ALLOWED_ATTACHMENT_MIME_TYPES: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
  _resetStorageClient: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------
import { prisma } from '../config/prisma'
import { getStorageClient } from '../config/supabaseStorage'
import {
  listLeaveRequests,
  createLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  cancelLeaveRequest,
  uploadLeaveAttachment,
} from '../modules/leave/leave.service'
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../lib/errors'
import {
  createLeaveSchema,
  rejectLeaveSchema,
  uploadAttachmentSchema,
} from '../modules/leave/leave.schema'
import type { ScopeFilter } from '../types/auth'

// ---------------------------------------------------------------------------
// Test constants
// ---------------------------------------------------------------------------

const WORKSPACE_ID = 'ws-test-leave'
const EMPLOYEE_ID = 'emp-leave-001'
const LEAVE_ID = 'leave-001'
const ACTOR_ID = 'user-actor-001'
const DEPT_ID = 'dept-001'
const LOC_ID = 'loc-001'

const workspaceScopeFilter: ScopeFilter = {
  departmentIds: [],
  locationIds: [],
  isWorkspaceScope: true,
}

const restrictedScopeFilter: ScopeFilter = {
  departmentIds: [DEPT_ID],
  locationIds: [],
  isWorkspaceScope: false,
}

const outOfScopeFilter: ScopeFilter = {
  departmentIds: ['dept-other'],
  locationIds: [],
  isWorkspaceScope: false,
}

const baseLeave = {
  id: LEAVE_ID,
  workspaceId: WORKSPACE_ID,
  employeeId: EMPLOYEE_ID,
  type: 'Sakit',
  startDate: new Date('2025-08-01T00:00:00.000Z'),
  endDate: new Date('2025-08-03T00:00:00.000Z'),
  reason: 'Demam',
  attachmentUrl: null,
  status: 'Pending',
  approverId: null,
  approvedAt: null,
  rejectedAt: null,
  conflictNote: null,
  notes: null,
  createdAt: new Date('2025-07-25T10:00:00.000Z'),
  updatedAt: new Date('2025-07-25T10:00:00.000Z'),
  employee: {
    fullName: 'Budi Santoso',
    employeeCode: 'EMP-2025-0001',
    departmentId: DEPT_ID,
    assignedLocationId: LOC_ID,
    department: { name: 'Engineering' },
  },
  approver: null,
}

const baseEmployee = {
  id: EMPLOYEE_ID,
  departmentId: DEPT_ID,
  assignedLocationId: LOC_ID,
}

function resetAllMocks() {
  vi.mocked(prisma.leaveRequest.findFirst).mockReset()
  vi.mocked(prisma.leaveRequest.findMany).mockReset()
  vi.mocked(prisma.leaveRequest.count).mockReset()
  vi.mocked(prisma.leaveRequest.create).mockReset()
  vi.mocked(prisma.leaveRequest.update).mockReset()
  vi.mocked(prisma.employee.findFirst).mockReset()
  vi.mocked(prisma.attendanceLog.count).mockReset()
  vi.mocked(prisma.auditLog.create).mockReset().mockResolvedValue({} as never)
}

// ---------------------------------------------------------------------------
// listLeaveRequests
// ---------------------------------------------------------------------------

describe('listLeaveRequests', () => {
  beforeEach(resetAllMocks)

  it('returns paginated list with correct fields (R11.1)', async () => {
    vi.mocked(prisma.leaveRequest.count).mockResolvedValueOnce(1 as never)
    vi.mocked(prisma.leaveRequest.findMany).mockResolvedValueOnce([baseLeave] as never)

    const result = await listLeaveRequests({
      workspaceId: WORKSPACE_ID,
      page: 1,
      pageSize: 25,
      scopeFilter: workspaceScopeFilter,
    })

    expect(result.items).toHaveLength(1)
    expect(result.items[0].id).toBe(LEAVE_ID)
    expect(result.items[0].employeeName).toBe('Budi Santoso')
    expect(result.items[0].type).toBe('Sakit')
    expect(result.items[0].status).toBe('Pending')
    expect(result.pagination.total).toBe(1)
    expect(result.pagination.page).toBe(1)
  })

  it('filters by status (R11.2)', async () => {
    vi.mocked(prisma.leaveRequest.count).mockResolvedValueOnce(0 as never)
    vi.mocked(prisma.leaveRequest.findMany).mockResolvedValueOnce([] as never)

    await listLeaveRequests({
      workspaceId: WORKSPACE_ID,
      status: 'Pending',
      page: 1,
      pageSize: 25,
      scopeFilter: workspaceScopeFilter,
    })

    const countCall = vi.mocked(prisma.leaveRequest.count).mock.calls[0]?.[0] as {
      where: Record<string, unknown>
    }
    expect(countCall.where['status']).toBe('Pending')
  })

  it('applies scope filter via employee relation (R3.10)', async () => {
    vi.mocked(prisma.leaveRequest.count).mockResolvedValueOnce(0 as never)
    vi.mocked(prisma.leaveRequest.findMany).mockResolvedValueOnce([] as never)

    await listLeaveRequests({
      workspaceId: WORKSPACE_ID,
      page: 1,
      pageSize: 25,
      scopeFilter: restrictedScopeFilter,
    })

    const countCall = vi.mocked(prisma.leaveRequest.count).mock.calls[0]?.[0] as {
      where: Record<string, unknown>
    }
    expect(countCall.where).toHaveProperty('OR')
  })

  it('enforces workspace isolation (R4.2)', async () => {
    vi.mocked(prisma.leaveRequest.count).mockResolvedValueOnce(0 as never)
    vi.mocked(prisma.leaveRequest.findMany).mockResolvedValueOnce([] as never)

    await listLeaveRequests({
      workspaceId: WORKSPACE_ID,
      page: 1,
      pageSize: 25,
    })

    const countCall = vi.mocked(prisma.leaveRequest.count).mock.calls[0]?.[0] as {
      where: Record<string, unknown>
    }
    expect(countCall.where['workspaceId']).toBe(WORKSPACE_ID)
  })
})

// ---------------------------------------------------------------------------
// createLeaveRequest
// ---------------------------------------------------------------------------

describe('createLeaveRequest', () => {
  beforeEach(resetAllMocks)

  it('creates leave successfully (R11.12)', async () => {
    vi.mocked(prisma.employee.findFirst).mockResolvedValueOnce(baseEmployee as never)
    vi.mocked(prisma.leaveRequest.findFirst).mockResolvedValueOnce(null as never) // no overlap
    vi.mocked(prisma.leaveRequest.create).mockResolvedValueOnce(baseLeave as never)

    const result = await createLeaveRequest({
      workspaceId: WORKSPACE_ID,
      input: {
        employeeId: EMPLOYEE_ID,
        type: 'Sakit',
        startDate: '2025-08-01',
        endDate: '2025-08-03',
        reason: 'Demam',
      },
      actorUserId: ACTOR_ID,
      scopeFilter: workspaceScopeFilter,
    })

    expect(result.id).toBe(LEAVE_ID)
    expect(result.status).toBe('Pending')
  })

  it('rejects when employee not found (NotFoundError)', async () => {
    vi.mocked(prisma.employee.findFirst).mockResolvedValueOnce(null as never)

    await expect(
      createLeaveRequest({
        workspaceId: WORKSPACE_ID,
        input: {
          employeeId: 'non-existent',
          type: 'Sakit',
          startDate: '2025-08-01',
          endDate: '2025-08-03',
        },
        actorUserId: ACTOR_ID,
      }),
    ).rejects.toThrow(NotFoundError)
  })

  it('rejects overlapping leave with 409 ConflictError (R11.9)', async () => {
    vi.mocked(prisma.employee.findFirst).mockResolvedValueOnce(baseEmployee as never)
    // Overlap found
    vi.mocked(prisma.leaveRequest.findFirst).mockResolvedValueOnce(baseLeave as never)

    await expect(
      createLeaveRequest({
        workspaceId: WORKSPACE_ID,
        input: {
          employeeId: EMPLOYEE_ID,
          type: 'Sakit',
          startDate: '2025-08-02',
          endDate: '2025-08-04',
        },
        actorUserId: ACTOR_ID,
      }),
    ).rejects.toThrow(ConflictError)
  })

  it('writes audit log on success', async () => {
    vi.mocked(prisma.employee.findFirst).mockResolvedValueOnce(baseEmployee as never)
    vi.mocked(prisma.leaveRequest.findFirst).mockResolvedValueOnce(null as never)
    vi.mocked(prisma.leaveRequest.create).mockResolvedValueOnce(baseLeave as never)

    await createLeaveRequest({
      workspaceId: WORKSPACE_ID,
      input: {
        employeeId: EMPLOYEE_ID,
        type: 'Sakit',
        startDate: '2025-08-01',
        endDate: '2025-08-03',
      },
      actorUserId: ACTOR_ID,
    })

    expect(vi.mocked(prisma.auditLog.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'create_leave',
          entityType: 'LeaveRequest',
        }),
      }),
    )
  })
})

// ---------------------------------------------------------------------------
// approveLeaveRequest
// ---------------------------------------------------------------------------

describe('approveLeaveRequest', () => {
  beforeEach(resetAllMocks)

  it('approves successfully and writes audit log (R11.6, R11.16)', async () => {
    vi.mocked(prisma.leaveRequest.findFirst).mockResolvedValueOnce(baseLeave as never)
    // scope check: employee loaded
    vi.mocked(prisma.employee.findFirst).mockResolvedValueOnce(baseEmployee as never)
    // no attendance conflict
    vi.mocked(prisma.attendanceLog.count).mockResolvedValueOnce(0 as never)
    const approvedLeave = {
      ...baseLeave,
      status: 'Approved',
      approverId: ACTOR_ID,
      approvedAt: new Date(),
      conflictNote: null,
    }
    vi.mocked(prisma.leaveRequest.update).mockResolvedValueOnce(approvedLeave as never)

    const result = await approveLeaveRequest({
      workspaceId: WORKSPACE_ID,
      leaveId: LEAVE_ID,
      actorUserId: ACTOR_ID,
      scopeFilter: restrictedScopeFilter,
    })

    expect(result.status).toBe('Approved')
    expect(result.approverId).toBe(ACTOR_ID)
    expect(result.conflictWarning).toBe(false)

    expect(vi.mocked(prisma.auditLog.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'approve_leave',
          entityType: 'LeaveRequest',
          entityId: LEAVE_ID,
          actorUserId: ACTOR_ID,
        }),
      }),
    )
  })

  it('throws ForbiddenError when approver lacks scope (R11.5)', async () => {
    vi.mocked(prisma.leaveRequest.findFirst).mockResolvedValueOnce(baseLeave as never)
    // Employee is in dept-001, but approver scope is dept-other
    vi.mocked(prisma.employee.findFirst).mockResolvedValueOnce(baseEmployee as never)

    await expect(
      approveLeaveRequest({
        workspaceId: WORKSPACE_ID,
        leaveId: LEAVE_ID,
        actorUserId: ACTOR_ID,
        scopeFilter: outOfScopeFilter,
      }),
    ).rejects.toThrow(ForbiddenError)
  })

  it('sets conflictWarning=true when attendance exists in date range (R11.10)', async () => {
    vi.mocked(prisma.leaveRequest.findFirst).mockResolvedValueOnce(baseLeave as never)
    vi.mocked(prisma.employee.findFirst).mockResolvedValueOnce(baseEmployee as never)
    // Attendance conflict exists
    vi.mocked(prisma.attendanceLog.count).mockResolvedValueOnce(2 as never)

    const approvedLeave = {
      ...baseLeave,
      status: 'Approved',
      approverId: ACTOR_ID,
      approvedAt: new Date(),
      conflictNote: 'Peringatan: karyawan sudah memiliki data absensi pada rentang tanggal cuti ini.',
    }
    vi.mocked(prisma.leaveRequest.update).mockResolvedValueOnce(approvedLeave as never)

    const result = await approveLeaveRequest({
      workspaceId: WORKSPACE_ID,
      leaveId: LEAVE_ID,
      actorUserId: ACTOR_ID,
      scopeFilter: workspaceScopeFilter,
    })

    expect(result.conflictWarning).toBe(true)
    expect(result.conflictNote).toContain('Peringatan')
  })

  it('throws ValidationError when leave is not Pending', async () => {
    const approvedLeave = { ...baseLeave, status: 'Approved' }
    vi.mocked(prisma.leaveRequest.findFirst).mockResolvedValueOnce(approvedLeave as never)

    await expect(
      approveLeaveRequest({
        workspaceId: WORKSPACE_ID,
        leaveId: LEAVE_ID,
        actorUserId: ACTOR_ID,
        scopeFilter: workspaceScopeFilter,
      }),
    ).rejects.toThrow(ValidationError)
  })

  it('throws NotFoundError when leave not found', async () => {
    vi.mocked(prisma.leaveRequest.findFirst).mockResolvedValueOnce(null as never)

    await expect(
      approveLeaveRequest({
        workspaceId: WORKSPACE_ID,
        leaveId: 'non-existent',
        actorUserId: ACTOR_ID,
        scopeFilter: workspaceScopeFilter,
      }),
    ).rejects.toThrow(NotFoundError)
  })
})

// ---------------------------------------------------------------------------
// rejectLeaveRequest
// ---------------------------------------------------------------------------

describe('rejectLeaveRequest', () => {
  beforeEach(resetAllMocks)

  it('rejects successfully and writes audit log (R11.16)', async () => {
    vi.mocked(prisma.leaveRequest.findFirst).mockResolvedValueOnce(baseLeave as never)
    vi.mocked(prisma.employee.findFirst).mockResolvedValueOnce(baseEmployee as never)

    const rejectedLeave = {
      ...baseLeave,
      status: 'Rejected',
      approverId: ACTOR_ID,
      rejectedAt: new Date(),
      notes: 'Stok cuti habis',
    }
    vi.mocked(prisma.leaveRequest.update).mockResolvedValueOnce(rejectedLeave as never)

    const result = await rejectLeaveRequest({
      workspaceId: WORKSPACE_ID,
      leaveId: LEAVE_ID,
      actorUserId: ACTOR_ID,
      input: { notes: 'Stok cuti habis' },
      scopeFilter: workspaceScopeFilter,
    })

    expect(result.status).toBe('Rejected')
    expect(vi.mocked(prisma.auditLog.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'reject_leave',
        }),
      }),
    )
  })

  it('throws ForbiddenError when approver lacks scope (R11.5)', async () => {
    vi.mocked(prisma.leaveRequest.findFirst).mockResolvedValueOnce(baseLeave as never)
    vi.mocked(prisma.employee.findFirst).mockResolvedValueOnce(baseEmployee as never)

    await expect(
      rejectLeaveRequest({
        workspaceId: WORKSPACE_ID,
        leaveId: LEAVE_ID,
        actorUserId: ACTOR_ID,
        input: {},
        scopeFilter: outOfScopeFilter,
      }),
    ).rejects.toThrow(ForbiddenError)
  })
})

// ---------------------------------------------------------------------------
// cancelLeaveRequest
// ---------------------------------------------------------------------------

describe('cancelLeaveRequest', () => {
  beforeEach(resetAllMocks)

  it('cancels Pending leave successfully + writes audit log (R11.14, R11.16)', async () => {
    vi.mocked(prisma.leaveRequest.findFirst).mockResolvedValueOnce(baseLeave as never)

    const cancelledLeave = { ...baseLeave, status: 'Cancelled' }
    vi.mocked(prisma.leaveRequest.update).mockResolvedValueOnce(cancelledLeave as never)

    const result = await cancelLeaveRequest({
      workspaceId: WORKSPACE_ID,
      leaveId: LEAVE_ID,
      actorUserId: ACTOR_ID,
      scopeFilter: workspaceScopeFilter,
    })

    expect(result.status).toBe('Cancelled')

    expect(vi.mocked(prisma.auditLog.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'cancel_leave',
          entityType: 'LeaveRequest',
          entityId: LEAVE_ID,
          actorUserId: ACTOR_ID,
        }),
      }),
    )
  })

  it('throws ValidationError when cancelling Approved leave (R11.14)', async () => {
    const approvedLeave = { ...baseLeave, status: 'Approved' }
    vi.mocked(prisma.leaveRequest.findFirst).mockResolvedValueOnce(approvedLeave as never)

    await expect(
      cancelLeaveRequest({
        workspaceId: WORKSPACE_ID,
        leaveId: LEAVE_ID,
        actorUserId: ACTOR_ID,
        scopeFilter: workspaceScopeFilter,
      }),
    ).rejects.toThrow(ValidationError)
  })

  it('throws ValidationError when cancelling Rejected leave', async () => {
    const rejectedLeave = { ...baseLeave, status: 'Rejected' }
    vi.mocked(prisma.leaveRequest.findFirst).mockResolvedValueOnce(rejectedLeave as never)

    await expect(
      cancelLeaveRequest({
        workspaceId: WORKSPACE_ID,
        leaveId: LEAVE_ID,
        actorUserId: ACTOR_ID,
      }),
    ).rejects.toThrow(ValidationError)
  })

  it('throws NotFoundError when leave not found', async () => {
    vi.mocked(prisma.leaveRequest.findFirst).mockResolvedValueOnce(null as never)

    await expect(
      cancelLeaveRequest({
        workspaceId: WORKSPACE_ID,
        leaveId: 'non-existent',
        actorUserId: ACTOR_ID,
      }),
    ).rejects.toThrow(NotFoundError)
  })
})

// ---------------------------------------------------------------------------
// uploadLeaveAttachment (Task 31 — R11.15, R17.7)
// ---------------------------------------------------------------------------

describe('uploadLeaveAttachment', () => {
  beforeEach(() => {
    resetAllMocks()
    vi.mocked(getStorageClient).mockReturnValue({
      upload: vi.fn().mockResolvedValue({
        storagePath: `${WORKSPACE_ID}/${LEAVE_ID}/test.pdf`,
        signedUrl: 'https://example.com/signed?token=abc',
        devMode: false,
      }),
      getSignedUrl: vi.fn().mockResolvedValue('https://example.com/signed?token=abc'),
    } as never)
  })

  it('rejects file exceeding 5MB (R17.7)', async () => {
    const bigBase64 = Buffer.alloc(6 * 1024 * 1024).toString('base64')

    await expect(
      uploadLeaveAttachment({
        workspaceId: WORKSPACE_ID,
        leaveId: LEAVE_ID,
        input: {
          fileBase64: bigBase64,
          fileName: 'big.pdf',
          mimeType: 'application/pdf',
        },
        actorUserId: ACTOR_ID,
      }),
    ).rejects.toThrow(ValidationError)
  })

  it('rejects invalid MIME type (R17.7)', async () => {
    await expect(
      uploadLeaveAttachment({
        workspaceId: WORKSPACE_ID,
        leaveId: LEAVE_ID,
        input: {
          fileBase64: 'dGVzdA==',
          fileName: 'file.gif',
          // @ts-expect-error intentionally invalid mimeType
          mimeType: 'image/gif',
        },
        actorUserId: ACTOR_ID,
      }),
    ).rejects.toThrow(ValidationError)
  })

  it('uploads successfully and returns signed URL (R11.15, R17.6)', async () => {
    vi.mocked(prisma.leaveRequest.findFirst).mockResolvedValueOnce(baseLeave as never)
    vi.mocked(prisma.leaveRequest.update).mockResolvedValueOnce({
      ...baseLeave,
      attachmentUrl: `${WORKSPACE_ID}/${LEAVE_ID}/test.pdf`,
    } as never)

    const result = await uploadLeaveAttachment({
      workspaceId: WORKSPACE_ID,
      leaveId: LEAVE_ID,
      input: {
        fileBase64: Buffer.from('%PDF-1.7\n% test pdf content').toString('base64'),
        fileName: 'test.pdf',
        mimeType: 'application/pdf',
      },
      actorUserId: ACTOR_ID,
      scopeFilter: workspaceScopeFilter,
    })

    expect(result.signedUrl).toContain('https://example.com/signed')
    expect(result.attachmentUrl).toContain(WORKSPACE_ID)

    expect(vi.mocked(prisma.auditLog.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'upload_leave_attachment',
        }),
      }),
    )
  })

  it('throws NotFoundError when leave not in scope', async () => {
    vi.mocked(prisma.leaveRequest.findFirst).mockResolvedValueOnce(null as never)

    await expect(
      uploadLeaveAttachment({
        workspaceId: WORKSPACE_ID,
        leaveId: 'non-existent',
        input: {
          fileBase64: Buffer.from('%PDF-1.7\n% test pdf content').toString('base64'),
          fileName: 'doc.pdf',
          mimeType: 'application/pdf',
        },
        actorUserId: ACTOR_ID,
        scopeFilter: workspaceScopeFilter,
      }),
    ).rejects.toThrow(NotFoundError)
  })
})

// ---------------------------------------------------------------------------
// Zod Schema validation
// ---------------------------------------------------------------------------

describe('createLeaveSchema', () => {
  it('accepts valid input', () => {
    const result = createLeaveSchema.safeParse({
      employeeId: 'emp-001',
      type: 'Sakit',
      startDate: '2025-08-01',
      endDate: '2025-08-03',
      reason: 'Demam',
    })
    expect(result.success).toBe(true)
  })

  it('rejects when endDate < startDate', () => {
    const result = createLeaveSchema.safeParse({
      employeeId: 'emp-001',
      type: 'Sakit',
      startDate: '2025-08-05',
      endDate: '2025-08-01',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('endDate')
    }
  })

  it('rejects invalid date format', () => {
    const result = createLeaveSchema.safeParse({
      employeeId: 'emp-001',
      type: 'Sakit',
      startDate: '01-08-2025',
      endDate: '03-08-2025',
    })
    expect(result.success).toBe(false)
  })

  it('rejects impossible calendar dates', () => {
    const result = createLeaveSchema.safeParse({
      employeeId: 'emp-001',
      type: 'Sakit',
      startDate: '2026-02-30',
      endDate: '2026-03-01',
    })
    expect(result.success).toBe(false)
  })

  it('accepts single-day leave (startDate == endDate)', () => {
    const result = createLeaveSchema.safeParse({
      employeeId: 'emp-001',
      type: 'Cuti Tahunan',
      startDate: '2025-08-01',
      endDate: '2025-08-01',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty employeeId', () => {
    const result = createLeaveSchema.safeParse({
      employeeId: '',
      type: 'Sakit',
      startDate: '2025-08-01',
      endDate: '2025-08-02',
    })
    expect(result.success).toBe(false)
  })

  it('rejects type exceeding 100 characters', () => {
    const result = createLeaveSchema.safeParse({
      employeeId: 'emp-001',
      type: 'a'.repeat(101),
      startDate: '2025-08-01',
      endDate: '2025-08-02',
    })
    expect(result.success).toBe(false)
  })
})

describe('rejectLeaveSchema', () => {
  it('accepts empty body (notes optional)', () => {
    const result = rejectLeaveSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts notes within limit', () => {
    const result = rejectLeaveSchema.safeParse({ notes: 'Alasan penolakan' })
    expect(result.success).toBe(true)
  })

  it('rejects notes > 1000 chars', () => {
    const result = rejectLeaveSchema.safeParse({ notes: 'a'.repeat(1001) })
    expect(result.success).toBe(false)
  })

  it('trims notes whitespace', () => {
    const result = rejectLeaveSchema.safeParse({ notes: '  trimmed  ' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.notes).toBe('trimmed')
    }
  })
})

describe('uploadAttachmentSchema', () => {
  it('accepts valid PDF input', () => {
    const result = uploadAttachmentSchema.safeParse({
      fileBase64: 'dGVzdA==',
      fileName: 'doc.pdf',
      mimeType: 'application/pdf',
    })
    expect(result.success).toBe(true)
  })

  it('accepts valid JPG input', () => {
    const result = uploadAttachmentSchema.safeParse({
      fileBase64: 'dGVzdA==',
      fileName: 'photo.jpg',
      mimeType: 'image/jpeg',
    })
    expect(result.success).toBe(true)
  })

  it('rejects GIF mimeType', () => {
    const result = uploadAttachmentSchema.safeParse({
      fileBase64: 'dGVzdA==',
      fileName: 'image.gif',
      mimeType: 'image/gif',
    })
    expect(result.success).toBe(false)
  })

  it('rejects fileName with disallowed extension', () => {
    const result = uploadAttachmentSchema.safeParse({
      fileBase64: 'dGVzdA==',
      fileName: 'script.exe',
      mimeType: 'application/pdf',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty fileBase64', () => {
    const result = uploadAttachmentSchema.safeParse({
      fileBase64: '',
      fileName: 'doc.pdf',
      mimeType: 'application/pdf',
    })
    expect(result.success).toBe(false)
  })
})
