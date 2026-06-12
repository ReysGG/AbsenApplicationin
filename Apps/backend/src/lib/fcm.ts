/**
 * fcm.ts — Firebase Cloud Messaging push sender (guarded).
 *
 * This module NEVER throws at import or init time. If no Firebase credentials
 * are configured it logs a single warning and turns sendPushToUser into a
 * silent no-op. This keeps the backend bootable in environments without FCM
 * (local dev, CI) while still delivering pushes in production when configured.
 *
 * Credentials are read from one of:
 *   - FIREBASE_SERVICE_ACCOUNT_JSON : the service-account JSON as a string
 *   - FIREBASE_SERVICE_ACCOUNT_PATH : a path to the service-account JSON file
 */

import { readFileSync } from 'node:fs'
import type * as admin from 'firebase-admin'
import { prisma } from '../config/prisma'
import { logger } from './logger'

// ---------------------------------------------------------------------------
// Lazy init state
// ---------------------------------------------------------------------------

type Messaging = admin.messaging.Messaging

let initialized = false
let messaging: Messaging | null = null
let warnedDisabled = false

function warnDisabledOnce(): void {
  if (!warnedDisabled) {
    warnedDisabled = true
    logger.warn('FCM disabled: no credentials')
  }
}

/**
 * Resolve a service-account object from env, or null if not configured /
 * unparseable. Never throws.
 */
function loadServiceAccount(): Record<string, unknown> | null {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH

  try {
    if (json && json.trim()) {
      return JSON.parse(json) as Record<string, unknown>
    }
    if (path && path.trim()) {
      return JSON.parse(readFileSync(path, 'utf-8')) as Record<string, unknown>
    }
  } catch (err) {
    logger.warn('FCM disabled: failed to parse service account credentials', {
      error: err instanceof Error ? err.message : String(err),
    })
    return null
  }
  return null
}

/**
 * Lazily initialise firebase-admin. Returns the Messaging instance, or null if
 * FCM is disabled. Never throws.
 */
async function getMessaging(): Promise<Messaging | null> {
  if (initialized) return messaging
  initialized = true

  const serviceAccount = loadServiceAccount()
  if (!serviceAccount) {
    warnDisabledOnce()
    return null
  }

  try {
    const adminModule = (await import('firebase-admin')).default
    const app = adminModule.apps.length
      ? adminModule.app()
      : adminModule.initializeApp({
          credential: adminModule.credential.cert(
            serviceAccount as admin.ServiceAccount,
          ),
        })
    messaging = adminModule.messaging(app)
    return messaging
  } catch (err) {
    logger.warn('FCM disabled: firebase-admin init failed', {
      error: err instanceof Error ? err.message : String(err),
    })
    messaging = null
    return null
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Send a push notification to every device registered for the given user.
 *
 * Looks up DeviceToken rows for `userId`, sends a multicast message, and prunes
 * any tokens that come back as unregistered. Returns true if at least one
 * message was accepted, false otherwise (including when FCM is disabled).
 */
export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<boolean> {
  const msg = await getMessaging()
  if (!msg) return false

  try {
    const tokens = (await (prisma as any).deviceToken.findMany({
      where: { userId },
      select: { token: true },
    })) as Array<{ token: string }>

    if (tokens.length === 0) return false

    const tokenList = tokens.map((t) => t.token)

    const response = await msg.sendEachForMulticast({
      tokens: tokenList,
      notification: { title, body },
      ...(data ? { data } : {}),
    })

    // Prune tokens that are no longer registered.
    const staleTokens: string[] = []
    response.responses.forEach((r, idx) => {
      if (!r.success) {
        const code = r.error?.code
        if (
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token'
        ) {
          staleTokens.push(tokenList[idx]!)
        }
      }
    })

    if (staleTokens.length > 0) {
      await (prisma as any).deviceToken.deleteMany({
        where: { token: { in: staleTokens } },
      })
    }

    return response.successCount > 0
  } catch (err) {
    logger.warn('FCM send failed', {
      error: err instanceof Error ? err.message : String(err),
    })
    return false
  }
}
