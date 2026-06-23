/**
 * leave.service.ts — Business logic for leave request management.
 *
 * Endpoints covered:
 *   GET  /leave-requests              — list with filters + pagination + scope
 *   GET  /leave-requests/:id          — full detail with signed URL
 *   POST /leave-requests              — HR manual leave record creation
 *   PATCH /leave-requests/:id/approve — approve with scope check + conflict warning
 *   PATCH /leave-requests/:id/reject  — reject with notes
 *   PATCH /leave-requests/:id/cancel  — cancel (Pending only)
 *   POST  /leave-requests/:id/attachment — upload attachment to Supabase Storage
 *
 * Requirements: 11.1–11.16, 17.6, 17.7
 */

import { prisma } from '../../config/prisma'
import { writeAudit } from '../../lib/audit'
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../lib/errors'
import {
  getStorageClient,
  LEAVE_ATTACHMENTS_BUCKET,
  MAX_ATTACHMENT_SIZE_BYTES,
  ALLOWED_ATTACHMENT_MIME_TYPES,
} from '../../config/supabaseStorage'
import type { ScopeFilter } from '../../types/auth'
import type { CreateLeaveInput, RejectLeaveInput, UploadAttachmentInput } from './leave.schema'
import { createNotification } from '../notifications/notifications.service'
import { sendPushToUser } from '../../lib/fcm'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LeaveRequestItem {
  id: string
  workspaceId: string
  employeeId: string
  employeeName: string
  employeeCode: string
  departmentId: string | null
  departmentName: string | null
  type: string
  startDate: string
  endDate: string
  reason: string | null
  attachmentUrl: string | null
  /** Signed URL for attachment (if attachmentUrl is set), valid 24h */
  attachmentSignedUrl?: string | null
  status: string
  approverId: string | null
  approverName: string | null
  approvedAt: string | null
  rejectedAt: string | null
  conflictNote: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface LeaveListResult {
  items: LeaveRequestItem[]
  pagination: {
    page: number
    page_size: number
    total: number
    total_pages: number
  }
}

export interface ApproveLeaveResult extends LeaveRequestItem {
  /** True if approved leave dates overlap with existing attendance records (R11.10) */
  conflictWarning: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** The Prisma include block used for list and detail queries */
const leaveInclude = {
  employee: {
    select: {
      fullName: true,
      employeeCode: true,
      departmentId: true,
      assignedLocationId: true,
      department: { select: { name: true } },
    },
  },
  approver: {
    select: { fullName: true },
  },
}

function detectAttachmentMime(buffer: Buffer): string | null {
  if (buffer.length >= 5 && buffer.subarray(0, 5).toString('ascii') === '%PDF-') {
    return 'application/pdf'
  }

  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  if (
    buffer.length >= pngSignature.length &&
    pngSignature.every((byte, index) => buffer[index] === byte)
  ) {
    return 'image/png'
  }

  if (
    buffer.length >= 4 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return 'image/jpeg'
  }

  return null
}

/** Map raw Prisma row → API shape */
function mapLeaveRequest(
  leave: {
    id: string
    workspaceId: string
    employeeId: string
    type: string
    startDate: Date
    endDate: Date
    reason: string | null
    attachmentUrl: string | null
    status: string
    approverId: string | null
    approvedAt: Date | null
    rejectedAt: Date | null
    conflictNote: string | null
    notes: string | null
    createdAt: Date
    updatedAt: Date
    employee?: {
      fullName: string
      employeeCode: string
      departmentId: string
      assignedLocationId?: string | null
      department?: { name: string } | null
    } | null
    approver?: { fullName: string } | null
  },
  attachmentSignedUrl?: string | null,
): LeaveRequestItem {
  return {
    id: leave.id,
    workspaceId: leave.workspaceId,
    employeeId: leave.employeeId,
    employeeName: leave.employee?.fullName ?? '',
    employeeCode: leave.employee?.employeeCode ?? '',
    departmentId: leave.employee?.departmentId ?? null,
    departmentName: leave.employee?.department?.name ?? null,
    type: leave.type,
    startDate: leave.startDate.toISOString().slice(0, 10),
    endDate: leave.endDate.toISOString().slice(0, 10),
    reason: leave.reason,
    attachmentUrl: leave.attachmentUrl,
    attachmentSignedUrl: attachmentSignedUrl ?? null,
    status: leave.status,
    approverId: leave.approverId,
    approverName: leave.approver?.fullName ?? null,
    approvedAt: leave.approvedAt?.toISOString() ?? null,
    rejectedAt: leave.rejectedAt?.toISOString() ?? null,
    conflictNote: leave.conflictNote,
    notes: leave.notes,
    createdAt: leave.createdAt.toISOString(),
    updatedAt: leave.updatedAt.toISOString(),
  }
}

/**
 * Build the Prisma `where` clause that enforces workspace isolation and
 * the OR-based scope filter (employee's dept/location, R3.10, R11.5).
 */
function buildLeaveScopeWhere(
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
    orClauses.push({
      employee: { assignedLocationId: { in: scopeFilter.locationIds } },
    })
  }

  if (orClauses.length === 0) {
    return { ...base, id: '__NEVER__' }
  }

  return { ...base, OR: orClauses }
}

/**
 * Checks if the requesting user's scope covers the given employee.
 * Used for approve/reject scope validation (R11.5).
 */
async function assertApproverHasScopeOverEmployee(
  workspaceId: string,
  employeeId: string,
  scopeFilter: ScopeFilter | undefined | null,
): Promise<void> {
  // Stakeholder or workspace-scoped user: no restriction
  if (!scopeFilter || scopeFilter.isWorkspaceScope) return

  // Load employee dept + location
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, workspaceId },
    select: { departmentId: true, assignedLocationId: true },
  })

  if (!employee) throw new NotFoundError('Karyawan')

  const inDept =
    scopeFilter.departmentIds.length > 0 &&
    scopeFilter.departmentIds.includes(employee.departmentId)

  const inLoc =
    scopeFilter.locationIds.length > 0 &&
    employee.assignedLocationId !== null &&
    scopeFilter.locationIds.includes(employee.assignedLocationId)

  if (!inDept && !inLoc) {
    throw new ForbiddenError(
      'Anda tidak memiliki scope atas karyawan yang mengajukan cuti ini (R11.5)',
    )
  }
}

/**
 * Check if there are any attendance records for the employee
 * in the given date range (R11.10).
 *
 * Returns true if a conflict exists.
 */
async function hasAttendanceConflict(
  workspaceId: string,
  employeeId: string,
  startDate: Date,
  endDate: Date,
): Promise<boolean> {
  const count = await prisma.attendanceLog.count({
    where: {
      workspaceId,
      employeeId,
      attendanceDate: {
        gte: startDate,
        lte: endDate,
      },
    },
  })
  return count > 0
}

/**
 * Check for overlapping Pending or Approved leave requests (R11.9).
 * Throws ConflictError if overlap found.
 */
async function assertNoOverlap(
  workspaceId: string,
  employeeId: string,
  startDate: Date,
  endDate: Date,
  excludeLeaveId?: string,
): Promise<void> {
  const where: Record<string, unknown> = {
    workspaceId,
    employeeId,
    status: { in: ['Pending', 'Approved'] },
    // Overlap: existing.startDate <= newEndDate AND existing.endDate >= newStartDate
    startDate: { lte: endDate },
    endDate: { gte: startDate },
  }

  if (excludeLeaveId) {
    where['id'] = { not: excludeLeaveId }
  }

  const existing = await prisma.leaveRequest.findFirst({ where })
  if (existing) {
    throw new ConflictError(
      'Permintaan cuti tumpang tindih dengan permintaan Pending atau Approved yang sudah ada (R11.9)',
    )
  }
}

/**
 * Notify the employee that their leave request was approved/rejected.
 *
 * id mapping (see schema): LeaveRequest.employeeId → Employee.id; the employee
 * links to the app User via Employee.userId → User.id; that User carries both
 * `id` (used by sendPushToUser) and `authUserId` (used by createNotification's
 * recipientAuthUserId). Best-effort — never blocks the approve/reject op.
 */
async function notifyLeaveDecision(params: {
  workspaceId: string
  employeeId: string
  leaveId: string
  decision: 'leave_approved' | 'leave_rejected'
}): Promise<void> {
  try {
    const employee = await prisma.employee.findFirst({
      where: { id: params.employeeId, workspaceId: params.workspaceId },
      select: { userId: true, user: { select: { id: true, authUserId: true } } },
    })
    const appUser = employee?.user
    if (!appUser) return

    await createNotification({
      workspaceId: params.workspaceId,
      recipientAuthUserId: appUser.authUserId,
      type: params.decision,
      refId: params.leaveId,
    })

    const approved = params.decision === 'leave_approved'
    await sendPushToUser(
      appUser.id,
      approved ? 'Cuti Disetujui' : 'Cuti Ditolak',
      approved
        ? 'Pengajuan cuti/izin Anda telah disetujui.'
        : 'Pengajuan cuti/izin Anda ditolak.',
      { type: params.decision, leaveRequestId: params.leaveId },
    )
  } catch {
    // Non-critical — notification/push failures must not break the decision.
  }
}

// ---------------------------------------------------------------------------
// listLeaveRequests
// ---------------------------------------------------------------------------

/**
 * GET /leave-requests — paginated list with filters + scope.
 *
 * Requirements: 11.1, 11.2, 11.13, 16.7
 */
export async function listLeaveRequests(params: {
  workspaceId: string
  status?: string
  employeeId?: string
  startDate?: string
  endDate?: string
  page: number
  pageSize: number
  scopeFilter?: ScopeFilter | null
}): Promise<LeaveListResult> {
  const { workspaceId, status, employeeId, startDate, endDate, page, pageSize, scopeFilter } =
    params

  const where: Record<string, unknown> = {
    ...buildLeaveScopeWhere(workspaceId, scopeFilter),
  }

  if (status && status !== 'all') {
    where['status'] = status
  }

  if (employeeId) {
    where['employeeId'] = employeeId
  }

  if (startDate) {
    where['startDate'] = {
      ...(where['startDate'] as object ?? {}),
      gte: new Date(`${startDate}T00:00:00.000Z`),
    }
  }

  if (endDate) {
    where['endDate'] = {
      ...(where['endDate'] as object ?? {}),
      lte: new Date(`${endDate}T23:59:59.999Z`),
    }
  }

  const skip = (page - 1) * pageSize

  const [total, records] = await Promise.all([
    prisma.leaveRequest.count({ where }),
    prisma.leaveRequest.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [{ createdAt: 'desc' }],
      include: leaveInclude,
    }),
  ])

  const items = (records as Parameters<typeof mapLeaveRequest>[0][]).map((r) => mapLeaveRequest(r))

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
// getLeaveRequestById
// ---------------------------------------------------------------------------

/**
 * GET /leave-requests/:id — full detail with signed attachment URL.
 *
 * Requirements: 11.1, 11.15, 17.6
 */
export async function getLeaveRequestById(
  workspaceId: string,
  leaveId: string,
  scopeFilter?: ScopeFilter | null,
): Promise<LeaveRequestItem> {
  const where = {
    id: leaveId,
    ...buildLeaveScopeWhere(workspaceId, scopeFilter),
  }

  const leave = await prisma.leaveRequest.findFirst({
    where,
    include: leaveInclude,
  })

  if (!leave) throw new NotFoundError('Permintaan cuti')

  let signedUrl: string | null = null
  if (leave.attachmentUrl) {
    try {
      const storage = getStorageClient()
      signedUrl = await storage.getSignedUrl(
        LEAVE_ATTACHMENTS_BUCKET,
        leave.attachmentUrl,
        60 * 60 * 24,
      )
    } catch {
      // Non-critical — just omit the signed URL
      signedUrl = null
    }
  }

  return mapLeaveRequest(leave as Parameters<typeof mapLeaveRequest>[0], signedUrl)
}

// ---------------------------------------------------------------------------
// createLeaveRequest (HR manual — R11.12)
// ---------------------------------------------------------------------------

/**
 * POST /leave-requests — HR manual leave record creation.
 *
 * Business rules:
 * - HR can create backdated records for operational needs (R11.12)
 * - Normal requests: startDate must be >= today (R11.11) — but this
 *   endpoint is HR-only (approve_leave permission), so backdating is allowed
 * - Overlap check with Pending/Approved (R11.9)
 *
 * Requirements: 11.9, 11.11, 11.12
 */
export async function createLeaveRequest(params: {
  workspaceId: string
  input: CreateLeaveInput
  actorUserId: string
  scopeFilter?: ScopeFilter | null
  ipAddress?: string | null
  userAgent?: string | null
  requestId?: string | null
}): Promise<LeaveRequestItem> {
  const { workspaceId, input, actorUserId, scopeFilter, ipAddress, userAgent, requestId } = params

  const startDate = new Date(`${input.startDate}T00:00:00.000Z`)
  const endDate = new Date(`${input.endDate}T23:59:59.999Z`)

  // Verify employee belongs to this workspace
  const employee = await prisma.employee.findFirst({
    where: { id: input.employeeId, workspaceId },
    select: { id: true },
  })
  if (!employee) throw new NotFoundError('Karyawan')

  await assertApproverHasScopeOverEmployee(workspaceId, input.employeeId, scopeFilter)

  // Overlap check (R11.9)
  await assertNoOverlap(workspaceId, input.employeeId, startDate, endDate)

  const leave = await prisma.leaveRequest.create({
    data: {
      workspaceId,
      employeeId: input.employeeId,
      type: input.type,
      startDate: new Date(`${input.startDate}T00:00:00.000Z`),
      endDate: new Date(`${input.endDate}T00:00:00.000Z`),
      reason: input.reason ?? null,
      notes: input.notes ?? null,
      status: input.status ?? 'Pending',
    },
    include: leaveInclude,
  })

  await writeAudit({
    workspaceId,
    actorUserId,
    action: 'create_leave',
    entityType: 'LeaveRequest',
    entityId: leave.id,
    newValue: {
      employeeId: leave.employeeId,
      type: leave.type,
      startDate: input.startDate,
      endDate: input.endDate,
      status: leave.status,
    },
    ipAddress,
    userAgent,
    requestId,
  })

  return mapLeaveRequest(leave as Parameters<typeof mapLeaveRequest>[0])
}

// ---------------------------------------------------------------------------
// approveLeaveRequest
// ---------------------------------------------------------------------------

/**
 * PATCH /leave-requests/:id/approve
 *
 * Business rules:
 * - Permission: approve_leave (enforced in middleware)
 * - Scope: approver must have scope over employee's dept/location (R11.5)
 * - Conflict check: if attendance exists in range → conflictWarning=true (R11.10)
 * - Audit: approve_leave (R11.16)
 *
 * Requirements: 11.4, 11.5, 11.6, 11.10, 11.16
 */
export async function approveLeaveRequest(params: {
  workspaceId: string
  leaveId: string
  actorUserId: string
  scopeFilter?: ScopeFilter | null
  ipAddress?: string | null
  userAgent?: string | null
  requestId?: string | null
}): Promise<ApproveLeaveResult> {
  const { workspaceId, leaveId, actorUserId, scopeFilter, ipAddress, userAgent, requestId } = params

  // Fetch leave — workspace-scoped but NOT scope-filtered here
  // (scope check is about the employee, not the leave record visibility)
  const leave = await prisma.leaveRequest.findFirst({
    where: { id: leaveId, workspaceId },
    include: leaveInclude,
  })
  if (!leave) throw new NotFoundError('Permintaan cuti')

  if (leave.status !== 'Pending') {
    throw new ValidationError(
      `Permintaan cuti berstatus '${leave.status}' tidak dapat disetujui. Hanya status Pending yang dapat disetujui.`,
    )
  }

  // Scope check (R11.5) — approver must have scope over the employee
  await assertApproverHasScopeOverEmployee(workspaceId, leave.employeeId, scopeFilter)

  const now = new Date()

  // Attendance conflict check (R11.10)
  const hasConflict = await hasAttendanceConflict(
    workspaceId,
    leave.employeeId,
    leave.startDate,
    leave.endDate,
  )

  const conflictNote = hasConflict
    ? 'Peringatan: karyawan sudah memiliki data absensi pada rentang tanggal cuti ini.'
    : null

  const updated = await prisma.leaveRequest.update({
    where: { id: leaveId },
    data: {
      status: 'Approved',
      approverId: actorUserId,
      approvedAt: now,
      conflictNote,
    },
    include: leaveInclude,
  })

  await writeAudit({
    workspaceId,
    actorUserId,
    action: 'approve_leave',
    entityType: 'LeaveRequest',
    entityId: leaveId,
    oldValue: { status: 'Pending' },
    newValue: {
      status: 'Approved',
      approverId: actorUserId,
      approvedAt: now.toISOString(),
      conflictNote,
    },
    ipAddress,
    userAgent,
    requestId,
  })

  const item = mapLeaveRequest(updated as Parameters<typeof mapLeaveRequest>[0])

  await notifyLeaveDecision({
    workspaceId,
    employeeId: leave.employeeId,
    leaveId,
    decision: 'leave_approved',
  })

  return { ...item, conflictWarning: hasConflict }
}

// ---------------------------------------------------------------------------
// rejectLeaveRequest
// ---------------------------------------------------------------------------

/**
 * PATCH /leave-requests/:id/reject
 *
 * Business rules:
 * - Permission: approve_leave (enforced in middleware)
 * - Scope: approver must have scope over employee (R11.5)
 * - Audit: reject_leave (R11.16)
 *
 * Requirements: 11.4, 11.5, 11.16
 */
export async function rejectLeaveRequest(params: {
  workspaceId: string
  leaveId: string
  actorUserId: string
  input: RejectLeaveInput
  scopeFilter?: ScopeFilter | null
  ipAddress?: string | null
  userAgent?: string | null
  requestId?: string | null
}): Promise<LeaveRequestItem> {
  const {
    workspaceId,
    leaveId,
    actorUserId,
    input,
    scopeFilter,
    ipAddress,
    userAgent,
    requestId,
  } = params

  const leave = await prisma.leaveRequest.findFirst({
    where: { id: leaveId, workspaceId },
    include: leaveInclude,
  })
  if (!leave) throw new NotFoundError('Permintaan cuti')

  if (leave.status !== 'Pending') {
    throw new ValidationError(
      `Permintaan cuti berstatus '${leave.status}' tidak dapat ditolak. Hanya status Pending yang dapat ditolak.`,
    )
  }

  // Scope check (R11.5)
  await assertApproverHasScopeOverEmployee(workspaceId, leave.employeeId, scopeFilter)

  const now = new Date()

  const updated = await prisma.leaveRequest.update({
    where: { id: leaveId },
    data: {
      status: 'Rejected',
      approverId: actorUserId,
      rejectedAt: now,
      notes: input.notes ?? leave.notes,
    },
    include: leaveInclude,
  })

  await writeAudit({
    workspaceId,
    actorUserId,
    action: 'reject_leave',
    entityType: 'LeaveRequest',
    entityId: leaveId,
    oldValue: { status: 'Pending' },
    newValue: {
      status: 'Rejected',
      approverId: actorUserId,
      rejectedAt: now.toISOString(),
      notes: input.notes,
    },
    ipAddress,
    userAgent,
    requestId,
  })

  await notifyLeaveDecision({
    workspaceId,
    employeeId: leave.employeeId,
    leaveId,
    decision: 'leave_rejected',
  })

  return mapLeaveRequest(updated as Parameters<typeof mapLeaveRequest>[0])
}

// ---------------------------------------------------------------------------
// cancelLeaveRequest
// ---------------------------------------------------------------------------

/**
 * PATCH /leave-requests/:id/cancel
 *
 * Business rules:
 * - Only Pending requests can be cancelled (R11.14)
 * - Approved requests CANNOT be cancelled via this endpoint
 * - Audit: cancel_leave (R11.16)
 *
 * Requirements: 11.14, 11.16
 */
export async function cancelLeaveRequest(params: {
  workspaceId: string
  leaveId: string
  actorUserId: string
  scopeFilter?: ScopeFilter | null
  ipAddress?: string | null
  userAgent?: string | null
  requestId?: string | null
}): Promise<LeaveRequestItem> {
  const { workspaceId, leaveId, actorUserId, scopeFilter, ipAddress, userAgent, requestId } = params

  const leave = await prisma.leaveRequest.findFirst({
    where: {
      id: leaveId,
      ...buildLeaveScopeWhere(workspaceId, scopeFilter),
    },
    include: leaveInclude,
  })
  if (!leave) throw new NotFoundError('Permintaan cuti')

  if (leave.status !== 'Pending') {
    throw new ValidationError(
      `Permintaan cuti berstatus '${leave.status}' tidak dapat dibatalkan. Hanya status Pending yang dapat dibatalkan (R11.14).`,
    )
  }

  const updated = await prisma.leaveRequest.update({
    where: { id: leaveId },
    data: { status: 'Cancelled' },
    include: leaveInclude,
  })

  await writeAudit({
    workspaceId,
    actorUserId,
    action: 'cancel_leave',
    entityType: 'LeaveRequest',
    entityId: leaveId,
    oldValue: { status: 'Pending' },
    newValue: { status: 'Cancelled' },
    ipAddress,
    userAgent,
    requestId,
  })

  return mapLeaveRequest(updated as Parameters<typeof mapLeaveRequest>[0])
}

// ---------------------------------------------------------------------------
// uploadLeaveAttachment (Task 31 — R11.15, R17.6, R17.7)
// ---------------------------------------------------------------------------

/**
 * POST /leave-requests/:id/attachment
 *
 * Business rules:
 * - File: PDF/JPG/PNG ≤ 5MB, base64-encoded in JSON body (R17.7)
 * - Upload to Supabase private bucket `leave-attachments`
 * - Update LeaveRequest.attachmentUrl
 * - Return signed URL valid for 24 hours (R17.6)
 *
 * Requirements: 11.15, 17.6, 17.7
 */
export async function uploadLeaveAttachment(params: {
  workspaceId: string
  leaveId: string
  input: UploadAttachmentInput
  actorUserId: string
  scopeFilter?: ScopeFilter | null
  ipAddress?: string | null
  userAgent?: string | null
  requestId?: string | null
}): Promise<{ attachmentUrl: string; signedUrl: string }> {
  const {
    workspaceId,
    leaveId,
    input,
    actorUserId,
    scopeFilter,
    ipAddress,
    userAgent,
    requestId,
  } = params

  // Verify MIME type is allowed (R17.7)
  const allowedMimeSet = new Set(ALLOWED_ATTACHMENT_MIME_TYPES as readonly string[])
  if (!allowedMimeSet.has(input.mimeType)) {
    throw new ValidationError(
      'Tipe file tidak didukung. Gunakan PDF, JPG, atau PNG (R17.7)',
    )
  }

  // Decode base64
  let fileBuffer: Buffer
  try {
    fileBuffer = Buffer.from(input.fileBase64, 'base64')
  } catch {
    throw new ValidationError('fileBase64 tidak valid, gagal mendekode')
  }

  // Validate size (R17.7 — ≤ 5 MB)
  if (fileBuffer.length > MAX_ATTACHMENT_SIZE_BYTES) {
    throw new ValidationError(
      `Ukuran file melebihi 5 MB. Ukuran aktual: ${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB (R17.7)`,
    )
  }

  const detectedMime = detectAttachmentMime(fileBuffer)
  if (detectedMime !== input.mimeType) {
    throw new ValidationError(
      'Isi file tidak sesuai dengan tipe file yang dikirim. Gunakan PDF, JPG, atau PNG yang valid.',
    )
  }

  // Fetch leave request — apply scope filter for visibility
  const whereBase = buildLeaveScopeWhere(workspaceId, scopeFilter)
  const leave = await prisma.leaveRequest.findFirst({
    where: { id: leaveId, ...whereBase },
    select: { id: true, employeeId: true, attachmentUrl: true },
  })
  if (!leave) throw new NotFoundError('Permintaan cuti')

  // Build storage path: leave-attachments/{workspaceId}/{leaveId}/{sanitized filename}
  const sanitizedFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `${workspaceId}/${leaveId}/${sanitizedFileName}`

  // Upload to Supabase Storage (or dev mode)
  const storage = getStorageClient()
  const { signedUrl, storagePath: savedPath } = await storage.upload(
    LEAVE_ATTACHMENTS_BUCKET,
    storagePath,
    fileBuffer,
    input.mimeType,
  )

  // Update LeaveRequest.attachmentUrl with the storage path
  await prisma.leaveRequest.update({
    where: { id: leaveId },
    data: { attachmentUrl: savedPath },
  })

  await writeAudit({
    workspaceId,
    actorUserId,
    action: 'upload_leave_attachment',
    entityType: 'LeaveRequest',
    entityId: leaveId,
    newValue: { attachmentUrl: savedPath, fileName: input.fileName, mimeType: input.mimeType },
    ipAddress,
    userAgent,
    requestId,
  })

  return { attachmentUrl: savedPath, signedUrl }
}
