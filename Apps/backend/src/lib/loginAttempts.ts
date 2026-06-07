/**
 * loginAttempts.ts — In-memory login attempt tracker for account lockout.
 *
 * Rule (R1.7): 5 failed login attempts within 15 minutes → lock for 15 minutes.
 *
 * This is a simple Map-based store sufficient for a single-instance v1 deployment.
 * For multi-instance deployments (v2), this should be replaced with a Redis-backed store.
 *
 * NOTE: This tracks *failed* attempts reported by the BFF after better-auth rejects
 * a sign-in. The BFF calls POST /api/v1/auth/login-event (success) or records
 * failures here via POST /api/v1/auth/login-failed.
 *
 * Requirements: 1.7, 1.8
 */

const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000  // 15 minutes
const LOCKOUT_MS = 15 * 60 * 1000 // 15 minutes

interface AttemptRecord {
  count: number
  firstAttemptAt: number
  lockedUntil: number | null
}

// Exported for testing purposes — allows controlling the clock in tests.
let _now = (): number => Date.now()

/** Override the clock function (used in tests). */
export function _setNow(fn: () => number): void {
  _now = fn
}

/** Reset clock back to real Date.now() */
export function _resetNow(): void {
  _now = () => Date.now()
}

const store = new Map<string, AttemptRecord>()

/**
 * Record a failed login attempt for the given email.
 * If this is the 5th failure within the window, the account is locked.
 */
export function recordFailedAttempt(email: string): void {
  const key = email.toLowerCase()
  const now = _now()

  const existing = store.get(key)

  if (!existing) {
    // First failure
    store.set(key, { count: 1, firstAttemptAt: now, lockedUntil: null })
    return
  }

  // If the previous window has expired, reset
  if (now - existing.firstAttemptAt > WINDOW_MS) {
    store.set(key, { count: 1, firstAttemptAt: now, lockedUntil: null })
    return
  }

  // If already locked, don't increment further
  if (existing.lockedUntil !== null && now < existing.lockedUntil) {
    return
  }

  const newCount = existing.count + 1

  if (newCount >= MAX_ATTEMPTS) {
    store.set(key, {
      count: newCount,
      firstAttemptAt: existing.firstAttemptAt,
      lockedUntil: now + LOCKOUT_MS,
    })
  } else {
    store.set(key, {
      count: newCount,
      firstAttemptAt: existing.firstAttemptAt,
      lockedUntil: null,
    })
  }
}

/**
 * Reset all failed attempts for the given email (e.g., on successful login).
 */
export function resetAttempts(email: string): void {
  store.delete(email.toLowerCase())
}

/**
 * Check whether the given email is currently locked out.
 */
export function isLocked(email: string): boolean {
  const key = email.toLowerCase()
  const record = store.get(key)
  if (!record || record.lockedUntil === null) return false

  const now = _now()
  if (now >= record.lockedUntil) {
    // Lock has expired — clean up automatically
    store.delete(key)
    return false
  }
  return true
}

/**
 * Returns the number of milliseconds remaining in the lockout.
 * Returns 0 if the account is not locked.
 */
export function getLockRemainingMs(email: string): number {
  const key = email.toLowerCase()
  const record = store.get(key)
  if (!record || record.lockedUntil === null) return 0

  const now = _now()
  const remaining = record.lockedUntil - now
  return remaining > 0 ? remaining : 0
}

/**
 * Clear all stored attempts (useful in tests for isolation).
 * @internal
 */
export function _clearAll(): void {
  store.clear()
}
