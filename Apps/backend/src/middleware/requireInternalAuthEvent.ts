import type { NextFunction, Request, Response } from 'express'
import { env } from '../config/env'
import { UnauthenticatedError, ValidationError } from '../lib/errors'
import { verifyContext } from '../lib/hmac'

type AuthEvent = 'login-check' | 'login-failed'

/**
 * Rejects direct calls to the pre-auth endpoints. The Next.js BFF signs a
 * canonical event+email value with INTERNAL_JWT_SECRET before forwarding it.
 */
export function requireInternalAuthEvent(expectedEvent: AuthEvent) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const email = (req.body as Record<string, unknown>)?.email
    if (typeof email !== 'string' || !email.trim()) {
      return next(new ValidationError('email diperlukan'))
    }

    const event = req.headers['x-internal-auth-event']
    const signature = req.headers['x-internal-auth-event-sig']
    const normalizedEmail = email.trim().toLowerCase()
    const payload = `auth-event:${expectedEvent}:${normalizedEmail}`

    if (
      event !== expectedEvent ||
      typeof signature !== 'string' ||
      !verifyContext(payload, signature, env.INTERNAL_JWT_SECRET)
    ) {
      return next(new UnauthenticatedError('Permintaan autentikasi tidak valid'))
    }

    return next()
  }
}
