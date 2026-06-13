/**
 * notifications.events.ts
 *
 * In-process pub/sub bus for real-time notifications. `createNotification`
 * publishes here after persisting a row; the SSE endpoint
 * (`GET /api/v1/notifications/stream`) subscribes and forwards events to the
 * matching recipient's open connection.
 *
 * SINGLE-INSTANCE BY DESIGN: this only reaches clients connected to the SAME
 * backend process. AttendX runs one backend container (docker compose), so an
 * in-memory EventEmitter is sufficient. If the backend is ever scaled
 * horizontally, replace this with a shared broker (e.g. Redis pub/sub) so
 * events fan out across instances.
 */

import { EventEmitter } from 'node:events'

export interface NotificationPayload {
  id: string
  type: string
  refId: string | null
  isRead: boolean
  createdAt: string
}

export interface NotificationEvent {
  workspaceId: string
  recipientAuthUserId: string
  notification: NotificationPayload
}

const CHANNEL = 'notification'

const bus = new EventEmitter()
// One listener per open SSE connection; lift the default cap (10) so a busy
// workspace with many dashboards open doesn't trigger a MaxListeners warning.
bus.setMaxListeners(0)

/** Publish a freshly created notification to any connected recipients. */
export function publishNotification(evt: NotificationEvent): void {
  bus.emit(CHANNEL, evt)
}

/**
 * Subscribe to all notification events. Returns an unsubscribe function the
 * caller MUST invoke on disconnect to avoid leaking listeners.
 */
export function subscribeNotifications(
  listener: (evt: NotificationEvent) => void,
): () => void {
  bus.on(CHANNEL, listener)
  return () => {
    bus.off(CHANNEL, listener)
  }
}
