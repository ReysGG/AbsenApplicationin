/**
 * loginAttempts.test.ts — Unit tests for the in-memory login lockout tracker.
 *
 * Requirements validated: 1.7, 1.8
 *
 * Rules:
 *  - 5 failed attempts within 15 minutes → account locked for 15 minutes
 *  - 4 or fewer failed attempts → NOT locked
 *  - After 15-minute lockout expires → unlocked automatically
 *  - resetAttempts() clears lock immediately
 *  - Attempt window resets if first attempt is > 15 minutes ago
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  recordFailedAttempt,
  resetAttempts,
  isLocked,
  getLockRemainingMs,
  _clearAll,
  _setNow,
  _resetNow,
} from '../lib/loginAttempts'

const WINDOW_MS = 15 * 60 * 1000  // 15 minutes in ms
const LOCKOUT_MS = 15 * 60 * 1000 // 15 minutes in ms

const TEST_EMAIL = 'user@example.com'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Simulate N failed attempts at a fixed point in time */
function failNTimes(email: string, n: number): void {
  for (let i = 0; i < n; i++) {
    recordFailedAttempt(email)
  }
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  _clearAll()
  _resetNow()
})

afterEach(() => {
  _clearAll()
  _resetNow()
})

// ---------------------------------------------------------------------------
// Core lockout behaviour
// ---------------------------------------------------------------------------

describe('loginAttempts — lockout logic (R1.7)', () => {
  it('1 failed attempt → NOT locked', () => {
    recordFailedAttempt(TEST_EMAIL)
    expect(isLocked(TEST_EMAIL)).toBe(false)
  })

  it('4 failed attempts → NOT locked', () => {
    failNTimes(TEST_EMAIL, 4)
    expect(isLocked(TEST_EMAIL)).toBe(false)
  })

  it('5 failed attempts → locked', () => {
    failNTimes(TEST_EMAIL, 5)
    expect(isLocked(TEST_EMAIL)).toBe(true)
  })

  it('6 failed attempts → still locked (count beyond max does not unlock)', () => {
    failNTimes(TEST_EMAIL, 6)
    expect(isLocked(TEST_EMAIL)).toBe(true)
  })

  it('locked account → getLockRemainingMs returns positive value', () => {
    failNTimes(TEST_EMAIL, 5)
    const remaining = getLockRemainingMs(TEST_EMAIL)
    expect(remaining).toBeGreaterThan(0)
    expect(remaining).toBeLessThanOrEqual(LOCKOUT_MS)
  })

  it('not locked account → getLockRemainingMs returns 0', () => {
    failNTimes(TEST_EMAIL, 3)
    expect(getLockRemainingMs(TEST_EMAIL)).toBe(0)
  })

  it('unknown email → not locked', () => {
    expect(isLocked('nobody@example.com')).toBe(false)
  })

  it('unknown email → getLockRemainingMs returns 0', () => {
    expect(getLockRemainingMs('nobody@example.com')).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// resetAttempts
// ---------------------------------------------------------------------------

describe('loginAttempts — resetAttempts', () => {
  it('resetAttempts after 4 failures → still not locked, count cleared', () => {
    failNTimes(TEST_EMAIL, 4)
    resetAttempts(TEST_EMAIL)
    expect(isLocked(TEST_EMAIL)).toBe(false)
    // New attempt after reset should not carry over old count
    recordFailedAttempt(TEST_EMAIL)
    expect(isLocked(TEST_EMAIL)).toBe(false)
  })

  it('resetAttempts after lockout → no longer locked', () => {
    failNTimes(TEST_EMAIL, 5)
    expect(isLocked(TEST_EMAIL)).toBe(true)

    resetAttempts(TEST_EMAIL)
    expect(isLocked(TEST_EMAIL)).toBe(false)
    expect(getLockRemainingMs(TEST_EMAIL)).toBe(0)
  })

  it('after reset, 5 new failures re-lock the account', () => {
    failNTimes(TEST_EMAIL, 5)
    resetAttempts(TEST_EMAIL)
    failNTimes(TEST_EMAIL, 5)
    expect(isLocked(TEST_EMAIL)).toBe(true)
  })

  it('resetAttempts on email that never failed → no error', () => {
    expect(() => resetAttempts('never@example.com')).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// Time-based expiry
// ---------------------------------------------------------------------------

describe('loginAttempts — time window and lockout expiry', () => {
  it('5 attempts within window → locked; 15 minutes later → unlocked', () => {
    let currentTime = Date.now()
    _setNow(() => currentTime)

    failNTimes(TEST_EMAIL, 5)
    expect(isLocked(TEST_EMAIL)).toBe(true)

    // Advance time past the lockout duration
    currentTime += LOCKOUT_MS + 1
    expect(isLocked(TEST_EMAIL)).toBe(false)
  })

  it('lockout remaining decreases as time advances', () => {
    let currentTime = Date.now()
    _setNow(() => currentTime)

    failNTimes(TEST_EMAIL, 5)
    const initialRemaining = getLockRemainingMs(TEST_EMAIL)

    // Advance by 5 minutes
    currentTime += 5 * 60 * 1000
    const laterRemaining = getLockRemainingMs(TEST_EMAIL)

    expect(laterRemaining).toBeLessThan(initialRemaining)
    expect(laterRemaining).toBeGreaterThan(0)
  })

  it('attempts outside the 15-minute window do not accumulate', () => {
    let currentTime = Date.now()
    _setNow(() => currentTime)

    // 4 attempts in window
    failNTimes(TEST_EMAIL, 4)

    // Advance past the 15-minute window
    currentTime += WINDOW_MS + 1

    // One more attempt in the new window
    recordFailedAttempt(TEST_EMAIL)
    // Count should have reset; only 1 attempt in new window
    expect(isLocked(TEST_EMAIL)).toBe(false)
  })

  it('5 attempts just inside the 15-minute window → locked', () => {
    let currentTime = Date.now()
    _setNow(() => currentTime)

    // 4 attempts
    failNTimes(TEST_EMAIL, 4)

    // Advance to just before window expiry
    currentTime += WINDOW_MS - 1000

    // 5th attempt
    recordFailedAttempt(TEST_EMAIL)
    expect(isLocked(TEST_EMAIL)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Email case-insensitivity
// ---------------------------------------------------------------------------

describe('loginAttempts — email normalisation', () => {
  it('email is case-insensitive — UPPERCASE and lowercase same account', () => {
    failNTimes(TEST_EMAIL.toUpperCase(), 5)
    expect(isLocked(TEST_EMAIL)).toBe(true)
  })

  it('resetAttempts with different case clears the lock', () => {
    failNTimes(TEST_EMAIL, 5)
    resetAttempts(TEST_EMAIL.toUpperCase())
    expect(isLocked(TEST_EMAIL)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Multiple accounts are tracked independently
// ---------------------------------------------------------------------------

describe('loginAttempts — multiple accounts', () => {
  it('locking one email does not affect another', () => {
    const emailA = 'a@example.com'
    const emailB = 'b@example.com'

    failNTimes(emailA, 5)

    expect(isLocked(emailA)).toBe(true)
    expect(isLocked(emailB)).toBe(false)
  })

  it('resetting one email does not affect another', () => {
    const emailA = 'a@example.com'
    const emailB = 'b@example.com'

    failNTimes(emailA, 5)
    failNTimes(emailB, 5)

    resetAttempts(emailA)

    expect(isLocked(emailA)).toBe(false)
    expect(isLocked(emailB)).toBe(true)
  })
})
