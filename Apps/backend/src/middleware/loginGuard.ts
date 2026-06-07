/**
 * loginGuard.ts — Middleware to check email lockout before forwarding a login request.
 *
 * Used on POST /api/v1/auth/login-failed (BFF calls this to record a failure) and
 * on any direct login proxy route.
 *
 * When called on a "check lockout" path:
 *   1. Read email from req.body.
 *   2. If locked → return 423 with generic message + write audit log
 *      `login_failed_due_to_lockout`.
 *   3. Otherwise → call next().
 *
 * Requirements: 1.2, 1.7, 1.13, 14.1
 */

import type { Request, Response, NextFunction } from 'express'
import { isLocked, getLockRemainingMs } from '../lib/loginAttempts'
import { LockedError } from '../lib/errors'
import { logger } from '../lib/logger'

// ---------------------------------------------------------------------------
// Audit helper
// ---------------------------------------------------------------------------

/**
 * Log lockout event. AuditLog requires workspaceId (not nullable in schema),
 * so for login events before workspace context is established we fall back to
 * structured log only. The BFF-triggered login-event endpoints (which have
 * workspace context) write proper DB audit entries.
 */
function logLockout(req: Request): void {
  logger.warn('login_failed_due_to_lockout', {
    action: 'login_failed_due_to_lockout',
    entityType: 'Auth',
    ipAddress: req.ip ?? null,
    userAgent: req.headers['user-agent'] ?? null,
    requestId: (req as Request & { requestId?: string }).requestId ?? null,
    path: req.path,
  })
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

/**
 * loginGuard — rejects the request with 423 if the email is locked.
 *
 * Expects `req.body.email` to be present.
 * Generic message is returned regardless of whether the email is registered
 * (R1.2 — do not reveal user enumeration information).
 */
export function loginGuard(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const email = (req.body as Record<string, unknown>)?.email

  if (typeof email !== 'string' || !email) {
    // No email to check — pass through (validation will handle the missing field)
    return next()
  }

  if (isLocked(email)) {
    const remainingMs = getLockRemainingMs(email)
    const remainingMinutes = Math.ceil(remainingMs / 60_000)

    logLockout(req)

    return next(
      new LockedError(
        `Terlalu banyak percobaan login. Coba lagi dalam ${remainingMinutes} menit.`,
      ),
    )
  }

  return next()
}
