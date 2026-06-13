/**
 * notifications.routes.ts
 *
 * GET  /api/v1/notifications           — list notifications (authenticated)
 * POST /api/v1/notifications/read-all  — mark all as read
 * POST /api/v1/notifications/:id/read  — mark one as read
 *
 * SELF-SCOPE BY DESIGN (audit §14): these routes intentionally omit
 * `requirePermission`. Notifications are personal to the recipient — every
 * authenticated workspace member may read/clear ONLY their own. The scope is
 * enforced server-side in the service layer, which filters strictly by
 * `recipientAuthUserId = req.user.authUserId` (derived from the cryptographically
 * verified user context, never from client input). A permission gate would be
 * inappropriate here because there is no cross-user access to guard.
 *
 * Requirements: 21.1, 21.2, 21.3
 */

import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate'
import { resolveActiveWorkspace } from '../../middleware/resolveActiveWorkspace'
import {
  listNotificationsHandler,
  notificationsStreamHandler,
  markNotificationReadHandler,
  markAllNotificationsReadHandler,
} from './notifications.controller'

const router = Router()

const baseGuard = [authenticate, resolveActiveWorkspace]

router.get('/notifications', ...baseGuard, listNotificationsHandler)

// Real-time SSE stream (same self-scope guard as the list endpoint).
router.get('/notifications/stream', ...baseGuard, notificationsStreamHandler)

// read-all must be before /:id/read to avoid route conflict
router.post('/notifications/read-all', ...baseGuard, markAllNotificationsReadHandler)

router.post('/notifications/:id/read', ...baseGuard, markNotificationReadHandler)

export default router
