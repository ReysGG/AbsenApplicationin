/**
 * mobile.integrity.test.ts — unit tests for the server-side attendance
 * integrity primitives (audit §14, P0).
 *
 * These specifically exercise the bypass attempts the audit flagged: the
 * server must NOT simply trust client booleans, must reject impossible
 * coordinates / future timestamps, and must enforce a liveness policy when
 * richer signals are present.
 */

import { describe, it, expect } from 'vitest'
import {
  isValidCoordinate,
  isNullIsland,
  evaluateCapturedAt,
  evaluateFaceLiveness,
  evaluateCheckInIntegrity,
  MIN_LIVENESS_CHALLENGES,
} from '../modules/mobile/mobile.integrity'

const NOW = new Date('2026-06-13T03:00:00.000Z')

describe('isValidCoordinate', () => {
  it('accepts valid WGS84 coordinates', () => {
    expect(isValidCoordinate(-6.2088, 106.8456)).toBe(true)
  })
  it('rejects out-of-range / non-finite coordinates', () => {
    expect(isValidCoordinate(91, 0)).toBe(false)
    expect(isValidCoordinate(0, 181)).toBe(false)
    expect(isValidCoordinate(Number.NaN, 0)).toBe(false)
    expect(isValidCoordinate(0, Infinity)).toBe(false)
  })
})

describe('isNullIsland', () => {
  it('flags (0,0)', () => {
    expect(isNullIsland(0, 0)).toBe(true)
    expect(isNullIsland(0.00001, -0.00001)).toBe(true)
  })
  it('does not flag real coordinates', () => {
    expect(isNullIsland(-6.2088, 106.8456)).toBe(false)
  })
})

describe('evaluateCapturedAt', () => {
  it('treats a missing timestamp as now (no skew)', () => {
    const r = evaluateCapturedAt(undefined, NOW)
    expect(r.futureInvalid).toBe(false)
    expect(r.skewMs).toBe(0)
  })
  it('rejects a future timestamp beyond the allowed skew', () => {
    const future = new Date(NOW.getTime() + 10 * 60 * 1000).toISOString()
    const r = evaluateCapturedAt(future, NOW)
    expect(r.futureInvalid).toBe(true)
  })
  it('allows large past skew (offline sync) but flags it suspicious', () => {
    const old = new Date(NOW.getTime() - 60 * 60 * 1000).toISOString()
    const r = evaluateCapturedAt(old, NOW)
    expect(r.futureInvalid).toBe(false)
    expect(r.suspicious).toBe(true)
  })
  it('flags a malformed timestamp', () => {
    const r = evaluateCapturedAt('not-a-date', NOW)
    expect(r.malformed).toBe(true)
  })
})

describe('evaluateFaceLiveness — server is the authority', () => {
  it('falls back to booleans when no signals are present, marking clientAttestedOnly', () => {
    const r = evaluateFaceLiveness({ faceVerified: true, livenessPassed: true })
    expect(r.passed).toBe(true)
    expect(r.clientAttestedOnly).toBe(true)
  })

  it('rejects when fallback booleans are false', () => {
    const r = evaluateFaceLiveness({ faceVerified: false, livenessPassed: true })
    expect(r.passed).toBe(false)
  })

  it('rejects forged faceVerified=true when liveness challenges are incomplete', () => {
    // A modified client claims faceVerified=true but reports only 1/2 challenges.
    const r = evaluateFaceLiveness({
      faceVerified: true,
      livenessPassed: true,
      livenessChecksPassed: 1,
      livenessChecksTotal: 2,
    })
    expect(r.passed).toBe(false)
    expect(r.clientAttestedOnly).toBe(false)
  })

  it('rejects when total challenges below the minimum', () => {
    const r = evaluateFaceLiveness({
      faceVerified: true,
      livenessPassed: true,
      livenessChecksPassed: 1,
      livenessChecksTotal: 1,
    })
    expect(r.passed).toBe(false)
  })

  it('passes when all (>= MIN) challenges pass', () => {
    const r = evaluateFaceLiveness({
      faceVerified: true,
      livenessPassed: true,
      livenessChecksPassed: MIN_LIVENESS_CHALLENGES,
      livenessChecksTotal: MIN_LIVENESS_CHALLENGES,
    })
    expect(r.passed).toBe(true)
    expect(r.clientAttestedOnly).toBe(false)
  })

  it('rejects a low face-match score when provided', () => {
    const r = evaluateFaceLiveness({
      faceVerified: true,
      livenessPassed: true,
      livenessChecksPassed: 2,
      livenessChecksTotal: 2,
      faceMatchScore: 0.2,
    })
    expect(r.passed).toBe(false)
  })
})

describe('evaluateCheckInIntegrity — combined gate', () => {
  const base = {
    workMode: 'WFO' as const,
    latitude: -6.2088,
    longitude: 106.8456,
    isMocked: false,
    faceVerified: true,
    livenessPassed: true,
    livenessChecksPassed: 2,
    livenessChecksTotal: 2,
  }

  it('passes a clean WFO submission', () => {
    const r = evaluateCheckInIntegrity(base, NOW)
    expect(r.ok).toBe(true)
    expect(r.faceResult).toBe('Passed')
    expect(r.spoofingResult).toBe('Clean')
  })

  it('rejects mock GPS with a Detected spoof result', () => {
    const r = evaluateCheckInIntegrity({ ...base, isMocked: true }, NOW)
    expect(r.ok).toBe(false)
    expect(r.spoofingResult).toBe('Detected')
    expect(r.anomalies).toContain('mock_gps')
  })

  it('rejects null-island (0,0) for WFO', () => {
    const r = evaluateCheckInIntegrity({ ...base, latitude: 0, longitude: 0 }, NOW)
    expect(r.ok).toBe(false)
    expect(r.anomalies).toContain('coordinates_null_island')
  })

  it('rejects out-of-range coordinates', () => {
    const r = evaluateCheckInIntegrity({ ...base, latitude: 999, longitude: 0 }, NOW)
    expect(r.ok).toBe(false)
    expect(r.anomalies).toContain('coordinates_invalid')
  })

  it('rejects a future-dated capture', () => {
    const future = new Date(NOW.getTime() + 10 * 60 * 1000).toISOString()
    const r = evaluateCheckInIntegrity({ ...base, capturedAtIso: future }, NOW)
    expect(r.ok).toBe(false)
    expect(r.anomalies).toContain('captured_at_future')
  })

  it('rejects forged face boolean when liveness signals are incomplete', () => {
    const r = evaluateCheckInIntegrity(
      { ...base, livenessChecksPassed: 0, livenessChecksTotal: 2 },
      NOW,
    )
    expect(r.ok).toBe(false)
    expect(r.faceResult).toBe('Failed')
  })

  it('allows (0,0) for WFH (geofence not required) but still needs a face pass', () => {
    const r = evaluateCheckInIntegrity(
      { ...base, workMode: 'WFH', latitude: 0, longitude: 0 },
      NOW,
    )
    expect(r.ok).toBe(true)
  })
})
