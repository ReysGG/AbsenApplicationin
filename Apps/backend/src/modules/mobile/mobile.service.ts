/**
 * mobile.service.ts — business logic + DTO mappers for the mobile API.
 *
 * All DTO field names + lowercase enum strings MUST match the Flutter
 * `ApiMappers` (Apps/app_flutter/lib/shared/data/api_mappers.dart). Mobile
 * endpoints are strictly self-scoped to the authenticated employee.
 *
 * Requirements: 1.1, 5.x, 6.x, 7.x, 11.x, 21.x
 */

import { randomUUID } from 'crypto'
import { prisma } from '../../config/prisma'
import { env } from '../../config/env'
import { ConflictError, NotFoundError, ValidationError } from '../../lib/errors'
import type { MobileEmployee } from '../../types/auth'
import type { CheckSubmissionInput, LeaveCreateInput } from './mobile.schema'
import { evaluateCheckInIntegrity, evaluateCapturedAt, isValidCoordinate } from './mobile.integrity'
import { createNotification } from '../notifications/notifications.service'
import { uploadFaceImage } from '../../config/faceStorage'
import { analyzeFaceImage } from './face.service-client'

// ---------------------------------------------------------------------------
// Time / geo helpers
// ---------------------------------------------------------------------------

const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000

/** UTC midnight of the Asia/Jakarta (UTC+7) calendar date of [d]. */
function jakartaDateOnly(d: Date): Date {
  const j = new Date(d.getTime() + JAKARTA_OFFSET_MS)
  return new Date(Date.UTC(j.getUTCFullYear(), j.getUTCMonth(), j.getUTCDate()))
}

/** Minutes since midnight in Asia/Jakarta local time. */
function jakartaMinutesOfDay(d: Date): number {
  const j = new Date(d.getTime() + JAKARTA_OFFSET_MS)
  return j.getUTCHours() * 60 + j.getUTCMinutes()
}

/** Day-of-week (0=Sun..6=Sat) in Asia/Jakarta local time. */
function jakartaWeekday(d: Date): number {
  return new Date(d.getTime() + JAKARTA_OFFSET_MS).getUTCDay()
}

function parseHmToMinutes(hm: string): number {
  const [h, m] = hm.split(':')
  return (parseInt(h, 10) || 0) * 60 + (parseInt(m ?? '0', 10) || 0)
}

function distanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000
  const toRad = (x: number) => (x * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ---------------------------------------------------------------------------
// Enum mappers (DB PascalCase → Flutter lowercase)
// ---------------------------------------------------------------------------

function mapStatus(s: string | null): string {
  switch (s) {
    case 'Present':
      return 'present'
    case 'Late':
      return 'late'
    case 'Absent':
      return 'absent'
    case 'PendingCheckout':
      return 'pendingCheckout'
    case 'MissingCheckout':
      return 'missingCheckout'
    case 'Leave':
      return 'leave'
    default:
      return 'invalid'
  }
}

function mapWorkMode(m: string | null): string {
  return m === 'WFH' ? 'wfh' : 'wfo'
}

function mapFaceStatus(s: string | null): string {
  switch (s) {
    case 'Passed':
      return 'passed'
    case 'Failed':
      return 'failed'
    default:
      return 'notRequired'
  }
}

function mapSyncStatus(s: string | null): string {
  return s === 'Pending' ? 'pending' : 'synced'
}

function mapLeaveStatus(s: string | null): string {
  switch (s) {
    case 'Approved':
      return 'approved'
    case 'Rejected':
      return 'rejected'
    case 'Cancelled':
      return 'cancelled'
    default:
      return 'pending'
  }
}

// ---------------------------------------------------------------------------
// DTO builders
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyLog = any

function attendanceDto(log: AnyLog): Record<string, unknown> {
  return {
    id: log.id,
    date: (log.attendanceDate as Date).toISOString(),
    status: mapStatus(log.status),
    workMode: mapWorkMode(log.workMode),
    shiftName: log.shift?.name ?? 'Tanpa Shift',
    checkInAt: (log.checkInAt as Date | null)?.toISOString() ?? null,
    checkOutAt: (log.checkOutAt as Date | null)?.toISOString() ?? null,
    checkInLat: log.checkInLatitude ?? null,
    checkInLng: log.checkInLongitude ?? null,
    checkOutLat: log.checkOutLatitude ?? null,
    checkOutLng: log.checkOutLongitude ?? null,
    locationName: log.location?.name ?? null,
    faceStatus: mapFaceStatus(log.faceCheckStatus),
    geofenceValid: log.geofenceStatus == null ? true : log.geofenceStatus === 'Valid',
    syncStatus: mapSyncStatus(log.syncStatus),
  }
}

function locationDto(loc: AnyLog): Record<string, unknown> {
  return {
    id: loc.id,
    name: loc.name,
    latitude: loc.latitude,
    longitude: loc.longitude,
    radiusMeters: loc.radiusMeters,
    address: loc.address ?? null,
  }
}

function shiftDto(shift: AnyLog): Record<string, unknown> {
  return {
    id: shift.id,
    name: shift.name,
    startTime: shift.startTime,
    endTime: shift.endTime,
    gracePeriodMinutes: shift.gracePeriodMinutes ?? 10,
  }
}

function leaveDto(lr: AnyLog): Record<string, unknown> {
  let attachmentName: string | null = null
  if (lr.attachmentUrl) {
    const parts = String(lr.attachmentUrl).split('/')
    attachmentName = parts[parts.length - 1] || null
  }
  return {
    id: lr.id,
    type: lr.type,
    startDate: (lr.startDate as Date).toISOString(),
    endDate: (lr.endDate as Date).toISOString(),
    reason: lr.reason ?? '',
    status: mapLeaveStatus(lr.status),
    attachmentName,
    submittedAt: (lr.createdAt as Date).toISOString(),
    reviewerNote: lr.notes ?? lr.conflictNote ?? null,
  }
}

function notificationDto(n: AnyLog): Record<string, unknown> {
  const meta = notificationMeta(n.type as string)
  return {
    id: n.id,
    title: meta.title,
    body: meta.body,
    createdAt: (n.createdAt as Date).toISOString(),
    kind: meta.kind,
    read: n.isRead ?? false,
  }
}

function notificationMeta(type: string): {
  title: string
  body: string
  kind: string
} {
  switch (type) {
    case 'leave_approved':
      return {
        title: 'Pengajuan Disetujui',
        body: 'Pengajuan izin/cuti kamu telah disetujui.',
        kind: 'approval',
      }
    case 'leave_rejected':
      return {
        title: 'Pengajuan Ditolak',
        body: 'Pengajuan izin/cuti kamu ditolak.',
        kind: 'approval',
      }
    case 'export_completed':
      return {
        title: 'Ekspor Selesai',
        body: 'Berkas ekspor kamu sudah siap.',
        kind: 'info',
      }
    default:
      return {
        title: 'Notifikasi',
        body: 'Ada pembaruan baru.',
        kind: 'info',
      }
  }
}

const attendanceInclude = {
  shift: { select: { name: true } },
  location: { select: { name: true } },
} as const

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export async function buildProfile(
  emp: MobileEmployee,
): Promise<Record<string, unknown>> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: emp.workspaceId },
    select: { name: true },
  })
  return {
    id: emp.id,
    fullName: emp.fullName,
    email: emp.email,
    employeeCode: emp.employeeCode,
    position: emp.position ?? '',
    department: emp.departmentName ?? '',
    workspaceName: workspace?.name ?? '',
    faceEnrolled: emp.faceProfileStatus === 'Registered',
  }
}

// ---------------------------------------------------------------------------
// Attendance reads
// ---------------------------------------------------------------------------

export async function getToday(
  emp: MobileEmployee,
): Promise<{ today: Record<string, unknown> | null }> {
  const today = jakartaDateOnly(new Date())
  const log = await prisma.attendanceLog.findFirst({
    where: { employeeId: emp.id, attendanceDate: today },
    include: attendanceInclude,
  })
  return { today: log ? attendanceDto(log) : null }
}

export async function getHistory(
  emp: MobileEmployee,
): Promise<Record<string, unknown>[]> {
  const logs = await prisma.attendanceLog.findMany({
    where: { employeeId: emp.id },
    include: attendanceInclude,
    orderBy: { attendanceDate: 'desc' },
    take: 60,
  })
  return logs.map(attendanceDto)
}

export async function getDetail(
  emp: MobileEmployee,
  id: string,
): Promise<Record<string, unknown>> {
  const log = await prisma.attendanceLog.findFirst({
    where: { id, employeeId: emp.id },
    include: attendanceInclude,
  })
  if (!log) throw new NotFoundError('Data presensi tidak ditemukan')
  return attendanceDto(log)
}

// ---------------------------------------------------------------------------
// Shift + schedule
// ---------------------------------------------------------------------------

export async function getTodayShift(
  emp: MobileEmployee,
): Promise<Record<string, unknown> | null> {
  if (!emp.assignedShiftId) return null
  const shift = await prisma.shift.findUnique({
    where: { id: emp.assignedShiftId },
  })
  return shift ? shiftDto(shift) : null
}

export async function getSchedule(
  emp: MobileEmployee,
): Promise<Record<string, unknown>[]> {
  const shift = emp.assignedShiftId
    ? await prisma.shift.findUnique({ where: { id: emp.assignedShiftId } })
    : null

  // Build Monday..Sunday for the current Jakarta week.
  const now = new Date()
  const todayJakarta = jakartaDateOnly(now)
  const weekday = jakartaWeekday(now) // 0=Sun..6=Sat
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday
  const monday = new Date(
    todayJakarta.getTime() + mondayOffset * 24 * 60 * 60 * 1000,
  )

  const dayWorkMode = mapWorkMode(emp.workMode === 'WFH' ? 'WFH' : 'WFO')
  const workDays: string[] = (shift?.workDays as string[] | undefined) ?? []

  const days: Record<string, unknown>[] = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday.getTime() + i * 24 * 60 * 60 * 1000)
    const dow = date.getUTCDay() // monday-based array but real weekday
    const isWeekend = dow === 0 || dow === 6
    // If the shift declares workDays, treat days outside it as day-off.
    const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dow]
    const outsideWorkDays =
      workDays.length > 0 && !workDays.includes(dayName)
    const isDayOff = isWeekend || outsideWorkDays || shift == null

    days.push({
      id: `${emp.id}-${date.toISOString().slice(0, 10)}`,
      name: isDayOff ? 'Libur' : (shift?.name ?? 'Tanpa Shift'),
      date: date.toISOString(),
      startTime: shift?.startTime ?? '08:00',
      endTime: shift?.endTime ?? '17:00',
      workMode: dayWorkMode,
      gracePeriodMinutes: shift?.gracePeriodMinutes ?? 10,
      isDayOff,
    })
  }
  return days
}

// ---------------------------------------------------------------------------
// Locations
// ---------------------------------------------------------------------------

export async function getAssignedLocations(
  emp: MobileEmployee,
): Promise<Record<string, unknown>[]> {
  const out: Record<string, unknown>[] = []
  const seen = new Set<string>()

  if (emp.assignedLocationId) {
    const office = await prisma.location.findUnique({
      where: { id: emp.assignedLocationId },
    })
    if (office && office.status === 'Active') {
      out.push(locationDto(office))
      seen.add(office.id)
    }
  }

  const wfh = await prisma.employeeWfhLocation.findMany({
    where: { employeeId: emp.id },
    include: { location: true },
  })
  for (const row of wfh) {
    const loc = (row as { location?: AnyLog }).location
    if (loc && !seen.has(loc.id)) {
      out.push(locationDto(loc))
      seen.add(loc.id)
    }
  }

  return out
}

// ---------------------------------------------------------------------------
// Check-in / Check-out
// ---------------------------------------------------------------------------

async function loadGeofenceCandidates(emp: MobileEmployee): Promise<AnyLog[]> {
  const candidates: AnyLog[] = []
  const seen = new Set<string>()
  if (emp.assignedLocationId) {
    const office = await prisma.location.findFirst({
      where: { id: emp.assignedLocationId, status: 'Active' },
    })
    if (office) {
      candidates.push(office)
      seen.add(office.id)
    }
  }
  // Fall back to any active workspace location if none assigned.
  if (candidates.length === 0) {
    const fallback = await prisma.location.findFirst({
      where: { workspaceId: emp.workspaceId, status: 'Active' },
    })
    if (fallback && !seen.has(fallback.id)) {
      candidates.push(fallback)
      seen.add(fallback.id)
    }
  }
  return candidates
}

async function writeRawLog(
  emp: MobileEmployee,
  eventType: 'check_in' | 'check_out',
  body: CheckSubmissionInput,
  now: Date,
  extra: {
    faceResult?: string
    geofenceResult?: string
    spoofingResult?: string
    resultingAttendanceLogId?: string | null
    isDuplicate?: boolean
    isInvalidSequence?: boolean
    /** Server-side evaluation details persisted for audit/anomaly review. */
    evaluation?: Record<string, unknown>
  },
): Promise<void> {
  try {
    const { faceImageBase64, ...safePayload } = body
    await prisma.attendanceRawLog.create({
      data: {
        workspaceId: emp.workspaceId,
        employeeId: emp.id,
        eventType,
        // Persist raw client metadata plus the server evaluation. The face
        // image itself is sensitive biometric material and belongs only in
        // object storage via attendance_logs.checkInFaceKey/checkOutFaceKey.
        rawPayloadJson: {
          ...(safePayload as unknown as Record<string, unknown>),
          faceImageProvided: typeof faceImageBase64 === 'string' && faceImageBase64.length > 0,
          faceImageBase64Length:
            typeof faceImageBase64 === 'string' ? faceImageBase64.length : undefined,
          _serverEvaluation: extra.evaluation ?? null,
        } as unknown as object,
        deviceTime: now,
        faceResult: extra.faceResult ?? null,
        geofenceResult: extra.geofenceResult ?? null,
        spoofingResult: extra.spoofingResult ?? null,
        isDuplicate: extra.isDuplicate ?? false,
        isInvalidSequence: extra.isInvalidSequence ?? false,
        resultingAttendanceLogId: extra.resultingAttendanceLogId ?? null,
      },
    })
  } catch {
    // best-effort
  }
}

/**
 * Best-effort face-capture upload to S3 storage. Returns the stored object key
 * or null (never throws) so attendance is never blocked by a storage hiccup.
 */
function isJpegBuffer(buffer: Buffer): boolean {
  return (
    buffer.length >= 4 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  )
}

async function maybeUploadFace(
  b64: string | undefined,
  key: string,
): Promise<string | null> {
  if (!b64) return null
  try {
    const comma = b64.indexOf(',')
    const raw =
      b64.startsWith('data:') && comma >= 0 ? b64.slice(comma + 1) : b64
    const buf = Buffer.from(raw, 'base64')
    if (buf.length === 0 || buf.length > 6 * 1024 * 1024) return null
    if (!isJpegBuffer(buf)) return null
    return await uploadFaceImage(key, buf, 'image/jpeg')
  } catch {
    return null
  }
}

interface ActiveFaceProfileRow {
  embedding: unknown
  matchThreshold: number
  embeddingModel: string
}

interface FaceVerificationResult {
  score: number
  threshold: number
  model: string
  qualityScore: number
}

function parseEmbedding(value: unknown): number[] {
  const raw = typeof value === 'string' ? JSON.parse(value) : value
  if (!Array.isArray(raw)) {
    throw new ValidationError('Template wajah terdaftar tidak valid.')
  }
  const vector = raw.map((v) => Number(v))
  if (vector.length === 0 || vector.some((v) => !Number.isFinite(v))) {
    throw new ValidationError('Template wajah terdaftar tidak valid.')
  }
  return vector
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) {
    throw new ValidationError('Dimensi template wajah tidak cocok.')
  }
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  if (normA <= 0 || normB <= 0) {
    throw new ValidationError('Template wajah tidak valid.')
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

async function verifyEmployeeFace(
  emp: MobileEmployee,
  faceImageBase64: string | undefined,
): Promise<FaceVerificationResult> {
  if (!faceImageBase64) {
    throw new ValidationError('Foto wajah wajib dikirim untuk absensi.')
  }

  const profiles = await prisma.$queryRaw<ActiveFaceProfileRow[]>`
    SELECT
      embedding,
      match_threshold AS "matchThreshold",
      embedding_model AS "embeddingModel"
    FROM employee_face_profiles
    WHERE employee_id = ${emp.id}
      AND workspace_id = ${emp.workspaceId}
      AND is_active = true
    ORDER BY enrolled_at DESC
    LIMIT 1
  `
  const profile = profiles[0]
  if (!profile) {
    throw new ValidationError('Wajah belum terdaftar. Daftarkan wajah terlebih dahulu.')
  }

  const live = await analyzeFaceImage(faceImageBase64, 'verify')
  const storedEmbedding = parseEmbedding(profile.embedding)
  const score = cosineSimilarity(storedEmbedding, live.embedding)
  const threshold = Number(profile.matchThreshold || env.FACE_MATCH_THRESHOLD)

  if (score < threshold) {
    throw new ValidationError('Wajah tidak cocok dengan data terdaftar.', {
      faceMatchScore: Number(score.toFixed(4)),
      threshold,
    })
  }

  return {
    score,
    threshold,
    model: live.model || profile.embeddingModel,
    qualityScore: live.quality.score,
  }
}

export async function checkIn(
  emp: MobileEmployee,
  body: CheckSubmissionInput,
): Promise<Record<string, unknown>> {
  const serverNow = new Date()
  const workMode: 'WFO' | 'WFH' = body.workMode === 'wfh' ? 'WFH' : 'WFO'
  let faceVerification: FaceVerificationResult
  try {
    faceVerification = await verifyEmployeeFace(emp, body.faceImageBase64)
  } catch (err) {
    const cap = evaluateCapturedAt(body.capturedAt, serverNow)
    await writeRawLog(emp, 'check_in', body, cap.capturedAt, {
      faceResult: 'Failed',
      spoofingResult: cap.suspicious ? 'Suspected' : 'Clean',
      evaluation: {
        clockSkewMs: cap.skewMs,
        anomalies: ['face_match_failed'],
        rejected: true,
        reason: err instanceof Error ? err.message : 'Verifikasi wajah gagal.',
      },
    })
    throw err
  }

  // 1. Server-side integrity gate (audit §14): the server — not the client —
  //    decides face/liveness/spoof from the provided signals, validates the
  //    coordinates, and applies basic anti-replay on capturedAt. Every attempt
  //    (pass or reject) is recorded to AttendanceRawLog for audit.
  const integrity = evaluateCheckInIntegrity(
    {
      workMode,
      latitude: body.latitude,
      longitude: body.longitude,
      isMocked: body.isMocked,
      faceVerified: true,
      livenessPassed: body.livenessPassed,
      livenessChecksPassed: body.livenessChecksPassed,
      livenessChecksTotal: body.livenessChecksTotal,
      faceMatchScore: faceVerification.score,
      capturedAtIso: body.capturedAt,
    },
    serverNow,
  )
  const now = integrity.capturedAt
  const attendanceDate = jakartaDateOnly(now)

  if (!integrity.ok) {
    await writeRawLog(emp, 'check_in', body, now, {
      faceResult: integrity.faceResult,
      spoofingResult: integrity.spoofingResult,
      evaluation: {
        clockSkewMs: integrity.clockSkewMs,
        anomalies: integrity.anomalies,
        faceMatchScore: Number(faceVerification.score.toFixed(4)),
        faceMatchThreshold: faceVerification.threshold,
        rejected: true,
        reason: integrity.reason,
      },
    })
    throw new ValidationError(integrity.reason ?? 'Check-in ditolak.')
  }

  // 3. Same-day handling: reject a real duplicate, but reuse an absentJob
  //    placeholder (a row for today that has no checkInAt yet).
  const existing = await prisma.attendanceLog.findFirst({
    where: { employeeId: emp.id, attendanceDate },
  })
  if (existing && existing.checkInAt) {
    await writeRawLog(emp, 'check_in', body, now, {
      faceResult: integrity.faceResult,
      spoofingResult: integrity.spoofingResult,
      isDuplicate: true,
      resultingAttendanceLogId: existing.id,
      evaluation: {
        clockSkewMs: integrity.clockSkewMs,
        anomalies: [...integrity.anomalies, 'duplicate_check_in'],
        faceMatchScore: Number(faceVerification.score.toFixed(4)),
        faceMatchThreshold: faceVerification.threshold,
        rejected: true,
        reason: 'Sudah check-in hari ini.',
      },
    })
    throw new ConflictError('Kamu sudah check-in hari ini.')
  }

  // 4. Geofence (WFO only).
  let geofenceStatus: 'Valid' | 'Outside' = 'Valid'
  let locationId: string | null = body.locationId ?? null

  if (workMode === 'WFO') {
    const candidates = await loadGeofenceCandidates(emp)
    if (candidates.length > 0) {
      let nearest = candidates[0]
      let nearestDist = distanceMeters(
        body.latitude,
        body.longitude,
        nearest.latitude,
        nearest.longitude,
      )
      for (const c of candidates.slice(1)) {
        const d = distanceMeters(
          body.latitude,
          body.longitude,
          c.latitude,
          c.longitude,
        )
        if (d < nearestDist) {
          nearest = c
          nearestDist = d
        }
      }
      if (nearestDist > nearest.radiusMeters) {
        await writeRawLog(emp, 'check_in', body, now, {
          faceResult: integrity.faceResult,
          geofenceResult: 'Outside',
          spoofingResult: integrity.spoofingResult,
          evaluation: {
            clockSkewMs: integrity.clockSkewMs,
            anomalies: [...integrity.anomalies, 'geofence_outside'],
            faceMatchScore: Number(faceVerification.score.toFixed(4)),
            faceMatchThreshold: faceVerification.threshold,
            rejected: true,
            distanceMeters: Math.round(nearestDist),
            radiusMeters: nearest.radiusMeters,
          },
        })
        throw new ValidationError('Kamu berada di luar radius lokasi kerja.')
      }
      locationId = nearest.id
      geofenceStatus = 'Valid'
    }
  }

  // 5. Shift + late calculation.
  const shift = emp.assignedShiftId
    ? await prisma.shift.findUnique({ where: { id: emp.assignedShiftId } })
    : null
  let status: 'Present' | 'Late' = 'Present'
  if (shift) {
    const threshold =
      parseHmToMinutes(shift.startTime) + (shift.gracePeriodMinutes ?? 10)
    if (jakartaMinutesOfDay(now) > threshold) status = 'Late'
  }

  // Best-effort: store the verified face capture for HR review.
  const checkInFaceKey = await maybeUploadFace(
    body.faceImageBase64,
    `${emp.workspaceId}/${emp.id}/${attendanceDate
      .toISOString()
      .slice(0, 10)}-checkin-${now.getTime()}.jpg`,
  )

  // 6. Persist — update a placeholder row if present, otherwise create.
  const data = {
    shiftId: shift?.id ?? null,
    checkInAt: now,
    checkInLatitude: body.latitude,
    checkInLongitude: body.longitude,
    locationId,
    workMode,
    faceCheckStatus: 'Passed' as const,
    geofenceStatus,
    spoofingStatus: 'Clean' as const,
    syncStatus: 'Synced' as const,
    originalCheckInAt: now,
    syncedAt: now,
    status,
    checkInFaceKey,
  }

  const saved = existing
    ? await prisma.attendanceLog.update({
        where: { id: existing.id },
        data,
        include: attendanceInclude,
      })
    : await prisma.attendanceLog.create({
        data: {
          workspaceId: emp.workspaceId,
          employeeId: emp.id,
          attendanceDate,
          ...data,
        },
        include: attendanceInclude,
      })

  await writeRawLog(emp, 'check_in', body, now, {
    faceResult: integrity.faceResult,
    geofenceResult: geofenceStatus,
    spoofingResult: integrity.spoofingResult,
    resultingAttendanceLogId: saved.id,
    evaluation: {
      clockSkewMs: integrity.clockSkewMs,
      anomalies: integrity.anomalies,
      faceMatchScore: Number(faceVerification.score.toFixed(4)),
      faceMatchThreshold: faceVerification.threshold,
      faceQualityScore: faceVerification.qualityScore,
      faceModel: faceVerification.model,
      rejected: false,
    },
  })

  return attendanceDto(saved)
}

export async function checkOut(
  emp: MobileEmployee,
  body: CheckSubmissionInput,
): Promise<Record<string, unknown>> {
  const serverNow = new Date()
  const cap = evaluateCapturedAt(body.capturedAt, serverNow)
  const now = cap.capturedAt
  const attendanceDate = jakartaDateOnly(now)
  const skewAnomalies: string[] = []
  if (cap.malformed) skewAnomalies.push('captured_at_malformed')
  if (cap.suspicious) skewAnomalies.push('clock_skew_suspicious')

  if (body.isMocked) {
    await writeRawLog(emp, 'check_out', body, now, {
      spoofingResult: 'Detected',
      evaluation: { anomalies: [...skewAnomalies, 'mock_gps'], rejected: true },
    })
    throw new ValidationError(
      'Lokasi palsu (mock GPS) terdeteksi. Check-out dibatalkan.',
    )
  }

  if (cap.futureInvalid) {
    await writeRawLog(emp, 'check_out', body, now, {
      spoofingResult: 'Suspected',
      evaluation: { anomalies: [...skewAnomalies, 'captured_at_future'], rejected: true },
    })
    throw new ValidationError('Waktu pengambilan tidak valid (di masa depan).')
  }

  if (!isValidCoordinate(body.latitude, body.longitude)) {
    await writeRawLog(emp, 'check_out', body, now, {
      spoofingResult: 'Suspected',
      evaluation: { anomalies: [...skewAnomalies, 'coordinates_invalid'], rejected: true },
    })
    throw new ValidationError('Koordinat lokasi tidak valid.')
  }

  let faceVerification: FaceVerificationResult
  try {
    faceVerification = await verifyEmployeeFace(emp, body.faceImageBase64)
  } catch (err) {
    await writeRawLog(emp, 'check_out', body, now, {
      faceResult: 'Failed',
      spoofingResult: cap.suspicious ? 'Suspected' : 'Clean',
      evaluation: {
        clockSkewMs: cap.skewMs,
        anomalies: [...skewAnomalies, 'face_match_failed'],
        rejected: true,
        reason: err instanceof Error ? err.message : 'Verifikasi wajah gagal.',
      },
    })
    throw err
  }

  const log = await prisma.attendanceLog.findFirst({
    where: { employeeId: emp.id, attendanceDate },
  })
  if (!log || !log.checkInAt) {
    // Out-of-order event: check-out without a prior check-in → flag anomaly.
    await writeRawLog(emp, 'check_out', body, now, {
      spoofingResult: cap.suspicious ? 'Suspected' : 'Clean',
      isInvalidSequence: true,
      evaluation: { anomalies: [...skewAnomalies, 'checkout_without_checkin'], rejected: true },
    })
    throw new ValidationError('Belum ada check-in hari ini.')
  }
  if (log.checkOutAt) {
    await writeRawLog(emp, 'check_out', body, now, {
      spoofingResult: cap.suspicious ? 'Suspected' : 'Clean',
      isDuplicate: true,
      resultingAttendanceLogId: log.id,
      evaluation: { anomalies: [...skewAnomalies, 'duplicate_check_out'], rejected: true },
    })
    throw new ConflictError('Kamu sudah check-out hari ini.')
  }

  const checkOutFaceKey = await maybeUploadFace(
    body.faceImageBase64,
    `${emp.workspaceId}/${emp.id}/${attendanceDate
      .toISOString()
      .slice(0, 10)}-checkout-${now.getTime()}.jpg`,
  )

  const updated = await prisma.attendanceLog.update({
    where: { id: log.id },
    data: {
      checkOutAt: now,
      checkOutLatitude: body.latitude,
      checkOutLongitude: body.longitude,
      checkOutFaceKey,
    },
    include: attendanceInclude,
  })

  await writeRawLog(emp, 'check_out', body, now, {
    faceResult: 'Passed',
    spoofingResult: cap.suspicious ? 'Suspected' : 'Clean',
    resultingAttendanceLogId: updated.id,
    evaluation: {
      clockSkewMs: cap.skewMs,
      anomalies: skewAnomalies,
      faceMatchScore: Number(faceVerification.score.toFixed(4)),
      faceMatchThreshold: faceVerification.threshold,
      faceQualityScore: faceVerification.qualityScore,
      faceModel: faceVerification.model,
      rejected: false,
    },
  })

  return attendanceDto(updated)
}

// ---------------------------------------------------------------------------
// Leave
// ---------------------------------------------------------------------------

export async function getLeaveRequests(
  emp: MobileEmployee,
): Promise<Record<string, unknown>[]> {
  const items = await prisma.leaveRequest.findMany({
    where: { employeeId: emp.id },
    orderBy: { startDate: 'desc' },
    take: 60,
  })
  return items.map(leaveDto)
}

export async function createMyLeaveRequest(
  emp: MobileEmployee,
  input: LeaveCreateInput,
): Promise<Record<string, unknown>> {
  const start = new Date(input.startDate)
  const end = new Date(input.endDate)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new ValidationError('Format tanggal tidak valid.')
  }
  if (end < start) {
    throw new ValidationError('Tanggal selesai tidak boleh sebelum tanggal mulai.')
  }

  // Reject overlap with an existing Pending/Approved request (R11).
  const overlap = await prisma.leaveRequest.findFirst({
    where: {
      employeeId: emp.id,
      status: { in: ['Pending', 'Approved'] },
      startDate: { lte: end },
      endDate: { gte: start },
    },
  })
  if (overlap) {
    throw new ConflictError(
      'Sudah ada pengajuan pada rentang tanggal tersebut.',
    )
  }

  const created = await prisma.leaveRequest.create({
    data: {
      workspaceId: emp.workspaceId,
      employeeId: emp.id,
      type: input.type,
      startDate: start,
      endDate: end,
      reason: input.reason,
      status: 'Pending',
    },
  })

  // Best-effort: notify workspace HR (stakeholder / support_admin) of the new
  // request so the dashboard updates in real time (via the notification bus).
  try {
    const hrAssignments = await prisma.roleAssignment.findMany({
      where: {
        workspaceId: emp.workspaceId,
        role: { in: ['stakeholder', 'support_admin'] },
      },
      include: { user: { select: { authUserId: true } } },
    })
    const recipients = new Set<string>()
    for (const ra of hrAssignments) {
      const authId = (ra as { user?: { authUserId?: string } }).user?.authUserId
      if (authId) recipients.add(authId)
    }
    for (const authUserId of recipients) {
      await createNotification({
        workspaceId: emp.workspaceId,
        recipientAuthUserId: authUserId,
        type: 'leave_request_new',
        refId: created.id,
      })
    }
  } catch {
    // best-effort
  }

  return leaveDto(created)
}

/** Cancels the employee's own Pending leave request. */
export async function cancelMyLeaveRequest(
  emp: MobileEmployee,
  id: string,
): Promise<Record<string, unknown>> {
  const existing = await prisma.leaveRequest.findFirst({
    where: { id, employeeId: emp.id },
  })
  if (!existing) {
    throw new NotFoundError('Pengajuan tidak ditemukan')
  }
  if (existing.status !== 'Pending') {
    throw new ConflictError('Hanya pengajuan berstatus menunggu yang bisa dibatalkan.')
  }
  const updated = await prisma.leaveRequest.update({
    where: { id: existing.id },
    data: { status: 'Cancelled' },
  })
  return leaveDto(updated)
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

async function resolveAuthUserId(emp: MobileEmployee): Promise<string | null> {
  if (!emp.userId) return null
  const user = await prisma.user.findUnique({
    where: { id: emp.userId },
    select: { authUserId: true },
  })
  return user?.authUserId ?? null
}

export async function getNotifications(
  emp: MobileEmployee,
): Promise<Record<string, unknown>[]> {
  const authUserId = await resolveAuthUserId(emp)
  if (!authUserId) return []
  const items = await prisma.notification.findMany({
    where: { workspaceId: emp.workspaceId, recipientAuthUserId: authUserId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return items.map(notificationDto)
}

export async function markNotificationRead(
  emp: MobileEmployee,
  id: string,
): Promise<void> {
  const authUserId = await resolveAuthUserId(emp)
  if (!authUserId) return
  await prisma.notification.updateMany({
    where: { id, recipientAuthUserId: authUserId },
    data: { isRead: true },
  })
}

// ---------------------------------------------------------------------------
// Device tokens (FCM)
// ---------------------------------------------------------------------------

export async function registerDeviceToken(
  emp: MobileEmployee,
  token: string,
  platform: string,
): Promise<void> {
  if (!emp.userId) throw new ValidationError('Akun tidak memiliki user id.')
  await prisma.deviceToken.upsert({
    where: { token },
    create: { userId: emp.userId, token, platform },
    update: { userId: emp.userId, platform },
  })
}

export async function deleteDeviceToken(token: string): Promise<void> {
  try {
    await prisma.deviceToken.deleteMany({ where: { token } })
  } catch {
    // best-effort
  }
}

// ---------------------------------------------------------------------------
// Face enrollment
// ---------------------------------------------------------------------------

/**
 * Marks the employee's face profile as Registered (first-time enrollment).
 *
 * v1 scope: HR creates the account (faceProfileStatus=NotRegistered), then the
 * employee enrolls their face from the mobile app. This records that the
 * enrollment step was completed and flips the status to `Registered` so the
 * dashboard reflects it and check-in can require an enrolled profile.
 *
 * Enrollment stores a server-generated embedding from the Python face service.
 * Check-in/check-out compare live captures against this active employee
 * template before the attendance mutation is allowed.
 */
export async function enrollFace(
  emp: MobileEmployee,
  faceImageBase64: string,
): Promise<Record<string, unknown>> {
  const analysis = await analyzeFaceImage(faceImageBase64, 'enroll')
  const embeddingJson = JSON.stringify(analysis.embedding)
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      UPDATE employee_face_profiles
      SET is_active = false, updated_at = now()
      WHERE employee_id = ${emp.id} AND is_active = true
    `
    await tx.$executeRaw`
      INSERT INTO employee_face_profiles (
        id,
        employee_id,
        workspace_id,
        embedding,
        embedding_model,
        embedding_dim,
        match_threshold,
        quality_score,
        reference_image_key,
        is_active,
        enrolled_at,
        created_at,
        updated_at
      ) VALUES (
        ${randomUUID()},
        ${emp.id},
        ${emp.workspaceId},
        CAST(${embeddingJson} AS jsonb),
        ${analysis.model},
        ${analysis.embeddingDim},
        ${env.FACE_MATCH_THRESHOLD},
        ${analysis.quality.score},
        ${null},
        true,
        now(),
        now(),
        now()
      )
    `
    await tx.employee.update({
      where: { id: emp.id },
      data: { faceProfileStatus: 'Registered' },
    })
  })
  return buildProfile({ ...emp, faceProfileStatus: 'Registered' })
}

/** Resets the face profile so the employee must re-enroll. */
export async function resetFaceEnrollment(
  emp: MobileEmployee,
): Promise<Record<string, unknown>> {
  await prisma.employee.update({
    where: { id: emp.id },
    data: { faceProfileStatus: 'NeedReEnrollment' },
  })
  return buildProfile({ ...emp, faceProfileStatus: 'NeedReEnrollment' })
}
