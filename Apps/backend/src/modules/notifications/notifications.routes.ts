/**
 * notifications.routes.ts
 *
 * GET  /api/v1/notifications           — list notifications (authenticated)
 * POST /api/v1/notifications/read-all  — mark all as read
 * POST /api/v1/notifications/:id/read  — mark one as read
 *
 * Requirements: 21.1, 21.2, 21.3
 */

import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate'
import { resolveActiveWorkspace } from '../../middleware/resolveActiveWorkspace'
import {
  listNotificationsHandler,
  markNotificationReadHandler,
  markAllNotificationsReadHandler,
} from './notifications.controller'

const router = Router()

const baseGuard = [authenticate, resolveActiveWorkspace]

router.get('/notifications', ...baseGuard, listNotificationsHandler)

// read-all must be before /:id/read to avoid route conflict
router.post('/notifications/read-all', ...baseGuard, markAllNotificationsReadHandler)

router.post('/notifications/:id/read', ...baseGuard, markNotificationReadHandler)

export default router
