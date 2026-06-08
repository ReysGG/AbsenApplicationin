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
