/**
 * notifications.service.ts
 *
 * Endpoints:
 *   GET  /notifications        — list unread + recent notifications for current user (R21)
 *   POST /notifications/:id/read — mark a notification as read
 *
 * Requirements: 21.1, 21.2, 21.3
 */

import { prisma } from '../../config/prisma'
import { NotFoundError } from '../../lib/errors'
import { publishNotification } from './notifications.events'

export interface NotificationData {
  id: string
  workspaceId: string
  type: string
  refId: string | null
  isRead: boolean
  createdAt: string
}

/**
 * List notifications for the current user scoped to the active workspace.
 * Returns up to 50 most recent, unread first.
 *
 * Requirements: 21.1, 21.2, 21.3
 */
export async function listNotifications(params: {
  workspaceId: string
  authUserId: string
  unreadOnly?: boolean
}): Promise<{ notifications: NotificationData[]; unreadCount: number }> {
  const { workspaceId, authUserId, unreadOnly } = params

  const where: Record<string, unknown> = {
    workspaceId,
    recipientAuthUserId: authUserId,
  }

  if (unreadOnly) {
    where['isRead'] = false
  }

  const [notifications, unreadCount] = await Promise.all([
    (prisma as any).notification.findMany({
      where,
      orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
      take: 50,
    }),
    (prisma as any).notification.count({
      where: { workspaceId, recipientAuthUserId: authUserId, isRead: false },
    }),
  ])

  return {
    notifications: (
      notifications as Array<{
        id: string
        workspaceId: string
        type: string
        refId: string | null
        isRead: boolean
        createdAt: Date
      }>
    ).map((n) => ({
      id: n.id,
      workspaceId: n.workspaceId,
      type: n.type,
      refId: n.refId,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    })),
    unreadCount,
  }
}

/**
 * Mark a single notification as read.
 * Only the recipient can mark their own notification.
 *
 * Requirements: 21.1
 */
export async function markNotificationRead(params: {
  workspaceId: string
  notificationId: string
  authUserId: string
}): Promise<NotificationData> {
  const { workspaceId, notificationId, authUserId } = params

  const notification = await (prisma as any).notification.findFirst({
    where: {
      id: notificationId,
      workspaceId,
      recipientAuthUserId: authUserId,
    },
  })

  if (!notification) {
    throw new NotFoundError('Notifikasi')
  }

  const updated = await (prisma as any).notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  })

  return {
    id: updated.id,
    workspaceId: updated.workspaceId,
    type: updated.type,
    refId: updated.refId,
    isRead: updated.isRead,
    createdAt: updated.createdAt.toISOString(),
  }
}

/**
 * Mark all notifications as read for the current user in the active workspace.
 */
export async function markAllNotificationsRead(params: {
  workspaceId: string
  authUserId: string
}): Promise<{ count: number }> {
  const { workspaceId, authUserId } = params

  const result = await (prisma as any).notification.updateMany({
    where: {
      workspaceId,
      recipientAuthUserId: authUserId,
      isRead: false,
    },
    data: { isRead: true },
  })

  return { count: result.count }
}

/**
 * Create a notification — called internally by other services (leave, export).
 *
 * Requirements: 21.1, 21.2
 */
export async function createNotification(params: {
  workspaceId: string
  recipientAuthUserId: string
  type: 'leave_request_new' | 'export_completed' | 'leave_approved' | 'leave_rejected'
  refId?: string
}): Promise<void> {
  const created = await (prisma as any).notification.create({
    data: {
      workspaceId: params.workspaceId,
      recipientAuthUserId: params.recipientAuthUserId,
      type: params.type,
      refId: params.refId ?? null,
      isRead: false,
    },
  })

  // Fan out to any open SSE connection for this recipient (real-time badge).
  publishNotification({
    workspaceId: params.workspaceId,
    recipientAuthUserId: params.recipientAuthUserId,
    notification: {
      id: created.id,
      type: created.type,
      refId: created.refId ?? null,
      isRead: created.isRead,
      createdAt:
        created.createdAt instanceof Date
          ? created.createdAt.toISOString()
          : String(created.createdAt),
    },
  })
}
