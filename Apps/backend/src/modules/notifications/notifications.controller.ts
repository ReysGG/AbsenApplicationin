/**
 * notifications.controller.ts
 *
 * Requirements: 21.1, 21.2, 21.3
 */

import type { Request, Response, NextFunction } from 'express'
import { sendSuccess } from '../../lib/response'
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from './notifications.service'
import { subscribeNotifications } from './notifications.events'

/**
 * GET /api/v1/notifications
 * Query params: unread_only=true|false (default false)
 */
export async function listNotificationsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { authUserId, workspaceId } = req.user!
    const unreadOnly = req.query['unread_only'] === 'true'

    const result = await listNotifications({ workspaceId, authUserId, unreadOnly })
    sendSuccess(res, result)
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/v1/notifications/:id/read
 * Mark a single notification as read.
 */
export async function markNotificationReadHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { authUserId, workspaceId } = req.user!
    const notificationId = String(req.params['id'])

    const notification = await markNotificationRead({ workspaceId, notificationId, authUserId })
    sendSuccess(res, notification)
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/v1/notifications/read-all
 * Mark all notifications as read.
 */
export async function markAllNotificationsReadHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { authUserId, workspaceId } = req.user!

    const result = await markAllNotificationsRead({ workspaceId, authUserId })
    sendSuccess(res, result)
  } catch (err) {
    next(err)
  }
}


/**
 * GET /api/v1/notifications/stream
 *
 * Server-Sent Events. Emits:
 *   - `ready`        once on connect, with the current unread count.
 *   - `notification` whenever a new notification is created for this user.
 *   - `: ping`       heartbeat comment every 25s to keep the connection alive.
 *
 * Self-scoped: only streams events whose recipient + workspace match the
 * authenticated user (same rule as the list endpoint).
 */
export function notificationsStreamHandler(req: Request, res: Response): void {
  const { authUserId, workspaceId } = req.user!

  // SSE headers — disable caching/proxy buffering so events flush immediately.
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  const write = (chunk: string): void => {
    if (!res.writableEnded) res.write(chunk)
  }

  // Greet with the current unread count so the badge is correct on connect.
  listNotifications({ workspaceId, authUserId, unreadOnly: true })
    .then(({ unreadCount }) => {
      write(`event: ready\ndata: ${JSON.stringify({ unreadCount })}\n\n`)
    })
    .catch(() => {
      write(`event: ready\ndata: ${JSON.stringify({ unreadCount: 0 })}\n\n`)
    })

  const unsubscribe = subscribeNotifications((evt) => {
    if (evt.workspaceId !== workspaceId || evt.recipientAuthUserId !== authUserId) {
      return
    }
    write(`event: notification\ndata: ${JSON.stringify(evt.notification)}\n\n`)
  })

  // Heartbeat: keeps intermediaries (and the BFF's fetch bodyTimeout) from
  // dropping an otherwise idle connection.
  const heartbeat = setInterval(() => write(': ping\n\n'), 25000)

  req.on('close', () => {
    clearInterval(heartbeat)
    unsubscribe()
  })
}
