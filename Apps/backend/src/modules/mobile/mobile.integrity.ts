/**
 * mobile.integrity.ts — server-side attendance integrity primitives.
 *
 * Context (audit §14, P0): the server previously trusted the client booleans
 * `faceVerified` / `livenessPassed` / `isMocked` verbatim, so a modified client
 * or a hand-crafted request could pass check-in without a real face/location.
 *
 * This module makes the SERVER the decision authority. Pure, side-effect-free
 * functions (easy to unit test) that:
 *   - validate GPS coordinate sanity,
 *   - reject future-dated captures (basic anti-replay) and flag large clock skew,
 *   - derive the face/liveness verdict from richer signals (challenge counts /
 *     match score) using a server-side threshold rather than a single boolean.
 *
 * Full server-side face-embedding matching is intentionally out of scope here
 * (documented as the remaining hardening step). When richer signals are absent
 * (older clients / offline captures) the decision falls back to the asserted
 * booleans but is tagged `clientAttestedOnly` so it can be audited/flagged.
 */

/** Minimum number of distinct liveness challenges that must be passed. */
export const MIN_LIVENESS_CHALLENGES = 2

/** Minimum face-match score (0..1) enforced only when a score is provided. */
export const MIN_FACE_MATCH_SCORE = 0.6

/** capturedAt may not be more than this far in the FUTURE (hard reject). */
export const MAX_FUTURE_SKEW_MS = 2 * 60 * 1000

/** Clock skew beyond this (past or future) is flagged as an anomaly. */
export const SUSPICIOUS_SKEW_MS = 30 * 60 * 1000

// ---------------------------------------------------------------------------
// Coordinates
// ---------------------------------------------------------------------------

/** True when lat/lng are finite and within valid WGS84 ranges. */
export function isValidCoordinate(lat: number, lng: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false
  if (lat < -90 || lat > 90) return false
  if (lng < -180 || lng > 180) return false
  return true
}

/**
 * "Null Island" (0,0) — almost always a failed/placeholder GPS fix. Rejected
 * for WFO check-ins where a real on-site fix is required.
 */
export function isNullIsland(lat: number, lng: number): boolean {
  return Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001
}

// ---------------------------------------------------------------------------
// Capture time (anti-replay)
// ---------------------------------------------------------------------------

export interface CapturedAtEval {
  capturedAt: Date
  /** capturedAt is in the future beyond the allowed skew → always invalid. */
  futureInvalid: boolean
  /** serverNow - capturedAt, ms (positive = in the past). */
  skewMs: number
  /** |skew| exceeds the suspicious threshold (flag, not necessarily reject). */
  suspicious: boolean
  /** capturedAt could not be parsed. */
  malformed: boolean
}

/**
 * Evaluate the client-reported capture time against the server clock. Future
 * timestamps are invalid (a capture cannot happen later than the server
 * receives it, modulo a small skew). Large past skew is allowed (offline
 * sync) but flagged.
 */
export function evaluateCapturedAt(
  capturedAtIso: string | undefined,
  serverNow: Date,
): CapturedAtEval {
  if (!capturedAtIso) {
    return { capturedAt: serverNow, futureInvalid: false, skewMs: 0, suspicious: false, malformed: false }
  }
  const capturedAt = new Date(capturedAtIso)
  if (Number.isNaN(capturedAt.getTime())) {
    return { capturedAt: serverNow, futureInvalid: false, skewMs: 0, suspicious: true, malformed: true }
  }
  const skewMs = serverNow.getTime() - capturedAt.getTime()
  return {
    capturedAt,
    futureInvalid: skewMs < -MAX_FUTURE_SKEW_MS,
    skewMs,
    suspicious: Math.abs(skewMs) > SUSPICIOUS_SKEW_MS,
    malformed: false,
  }
}

// ---------------------------------------------------------------------------
// Face / liveness verdict (server is the authority)
// ---------------------------------------------------------------------------

export interface FaceDecisionInput {
  faceVerified: boolean
  livenessPassed: boolean
  livenessChecksPassed?: number
  livenessChecksTotal?: number
  faceMatchScore?: number
}

export interface FaceDecision {
  passed: boolean
  reason: string | null
  /** No richer signals present — decision relied on asserted booleans. */
  clientAttestedOnly: boolean
}

/**
 * Decide whether face + liveness pass. When challenge counts are present the
 * server enforces a policy (>= MIN challenges, all passed, and — if a match
 * score is supplied — above the match threshold). Otherwise it falls back to
 * the asserted booleans and marks the verdict clientAttestedOnly.
 */
export function evaluateFaceLiveness(input: FaceDecisionInput): FaceDecision {
  const hasSignals =
    typeof input.livenessChecksPassed === 'number' &&
    typeof input.livenessChecksTotal === 'number'

  if (hasSignals) {
    const passed = input.livenessChecksPassed as number
    const total = input.livenessChecksTotal as number

    if (total < MIN_LIVENESS_CHALLENGES) {
      return { passed: false, reason: 'Tantangan liveness tidak memadai.', clientAttestedOnly: false }
    }
    if (passed < total) {
      return { passed: false, reason: 'Verifikasi liveness belum lengkap.', clientAttestedOnly: false }
    }
    if (typeof input.faceMatchScore === 'number' && input.faceMatchScore < MIN_FACE_MATCH_SCORE) {
      return { passed: false, reason: 'Wajah tidak cocok dengan data terdaftar.', clientAttestedOnly: false }
    }
    if (!input.faceVerified) {
      return { passed: false, reason: 'Verifikasi wajah gagal.', clientAttestedOnly: false }
    }
    return { passed: true, reason: null, clientAttestedOnly: false }
  }

  // Fallback: no richer signals (older client / offline capture).
  if (!input.faceVerified || !input.livenessPassed) {
    return { passed: false, reason: 'Verifikasi wajah gagal.', clientAttestedOnly: true }
  }
  return { passed: true, reason: null, clientAttestedOnly: true }
}

// ---------------------------------------------------------------------------
// Combined pre-persist integrity gate
// ---------------------------------------------------------------------------

export interface IntegrityInput {
  workMode: 'WFO' | 'WFH'
  latitude: number
  longitude: number
  isMocked: boolean
  faceVerified: boolean
  livenessPassed: boolean
  livenessChecksPassed?: number
  livenessChecksTotal?: number
  faceMatchScore?: number
  capturedAtIso?: string
}

export interface IntegrityResult {
  /** Whether the submission may proceed to persistence. */
  ok: boolean
  /** Rejection reason when ok=false (user-facing). */
  reason: string | null
  capturedAt: Date
  spoofingResult: 'Clean' | 'Detected' | 'Suspected'
  faceResult: 'Passed' | 'Failed'
  clockSkewMs: number
  /** Machine-readable anomaly tags recorded to the raw log for audit. */
  anomalies: string[]
}

/**
 * Run the full server-side integrity gate for a check-in. Returns a verdict
 * plus structured anomaly tags. The caller persists an AttendanceRawLog with
 * these results for every attempt (success or rejection).
 */
export function evaluateCheckInIntegrity(
  input: IntegrityInput,
  serverNow: Date,
): IntegrityResult {
  const anomalies: string[] = []

  const cap = evaluateCapturedAt(input.capturedAtIso, serverNow)
  if (cap.malformed) anomalies.push('captured_at_malformed')
  if (cap.suspicious) anomalies.push('clock_skew_suspicious')

  // 1. Mock GPS — explicit spoof signal from the OS.
  if (input.isMocked) {
    anomalies.push('mock_gps')
    return {
      ok: false,
      reason: 'Lokasi palsu (mock GPS) terdeteksi. Check-in dibatalkan.',
      capturedAt: cap.capturedAt,
      spoofingResult: 'Detected',
      faceResult: input.faceVerified ? 'Passed' : 'Failed',
      clockSkewMs: cap.skewMs,
      anomalies,
    }
  }

  // 2. Future-dated capture — impossible, basic anti-replay.
  if (cap.futureInvalid) {
    anomalies.push('captured_at_future')
    return {
      ok: false,
      reason: 'Waktu pengambilan tidak valid (di masa depan).',
      capturedAt: cap.capturedAt,
      spoofingResult: 'Suspected',
      faceResult: 'Failed',
      clockSkewMs: cap.skewMs,
      anomalies,
    }
  }

  // 3. Coordinate sanity.
  if (!isValidCoordinate(input.latitude, input.longitude)) {
    anomalies.push('coordinates_invalid')
    return {
      ok: false,
      reason: 'Koordinat lokasi tidak valid.',
      capturedAt: cap.capturedAt,
      spoofingResult: 'Suspected',
      faceResult: 'Failed',
      clockSkewMs: cap.skewMs,
      anomalies,
    }
  }
  if (input.workMode === 'WFO' && isNullIsland(input.latitude, input.longitude)) {
    anomalies.push('coordinates_null_island')
    return {
      ok: false,
      reason: 'Koordinat lokasi tidak valid (0,0).',
      capturedAt: cap.capturedAt,
      spoofingResult: 'Suspected',
      faceResult: 'Failed',
      clockSkewMs: cap.skewMs,
      anomalies,
    }
  }

  // 4. Face + liveness — server-evaluated from signals.
  const face = evaluateFaceLiveness(input)
  if (face.clientAttestedOnly) anomalies.push('face_client_attested_only')
  if (!face.passed) {
    return {
      ok: false,
      reason: face.reason ?? 'Verifikasi wajah gagal. Coba lagi.',
      capturedAt: cap.capturedAt,
      spoofingResult: cap.suspicious ? 'Suspected' : 'Clean',
      faceResult: 'Failed',
      clockSkewMs: cap.skewMs,
      anomalies,
    }
  }

  return {
    ok: true,
    reason: null,
    capturedAt: cap.capturedAt,
    spoofingResult: cap.suspicious ? 'Suspected' : 'Clean',
    faceResult: 'Passed',
    clockSkewMs: cap.skewMs,
    anomalies,
  }
}
