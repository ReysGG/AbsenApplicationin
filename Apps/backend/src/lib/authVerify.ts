/**
 * authVerify — session token verification utility.
 *
 * Called by the authenticate middleware (Task 6) to resolve a browser session
 * cookie/token into the better-auth user id (`authUserId`). The returned id
 * is then used to look up the application-level User record via
 * `User.auth_user_id`.
 *
 * Requirements: 1.1, 17.4
 */
import type { IncomingMessage } from 'http'
import { auth } from '../config/auth'

export interface VerifiedSession {
  /** The better-auth internal user id — matches User.auth_user_id in the app DB */
  authUserId: string
  /** The better-auth session id */
  sessionId: string
  /** Session expiry timestamp */
  expiresAt: Date
  /** The email registered in better-auth */
  email: string
}

/**
 * Verifies a session from a raw HTTP request (headers + cookies) and returns
 * the resolved session data.
 *
 * Returns `null` when:
 * - no session cookie / bearer token is present
 * - the session token is invalid or expired
 * - better-auth raises any verification error
 *
 * @param req - Node.js IncomingMessage (compatible with Express's req)
 */
export async function verifySession(
  req: IncomingMessage,
): Promise<VerifiedSession | null> {
  try {
    const result = await auth.api.getSession({
      headers: req.headers as Record<string, string>,
    })

    if (!result?.session || !result?.user) {
      return null
    }

    return {
      authUserId: result.user.id,
      sessionId: result.session.id,
      expiresAt: result.session.expiresAt,
      email: result.user.email,
    }
  } catch {
    // Any error (malformed token, DB unavailable, etc.) is treated as
    // unauthenticated — the authenticate middleware will return 401.
    return null
  }
}
