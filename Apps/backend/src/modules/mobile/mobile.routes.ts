/**
 * mobile.routes.ts — route definitions for the Flutter mobile app.
 *
 * Auth model: bearer token (better-auth bearer plugin). Login is throttled by
 * `authRateLimit`; everything else requires `authenticateMobile` which attaches
 * `req.employee` (self-scope).
 *
 * Base mount: /api/v1
 */

import { Router } from 'express'
import { authenticateMobile } from '../../middleware/authenticateMobile'
import { authRateLimit } from '../../middleware/rateLimiter'
import {
  loginHandler,
  logoutHandler,
  meHandler,
  todayHandler,
  historyHandler,
  detailHandler,
  shiftHandler,
  scheduleHandler,
  locationsHandler,
  checkInHandler,
  checkOutHandler,
  leaveListHandler,
  leaveCreateHandler,
  leaveCancelHandler,
  notificationsHandler,
  notificationReadHandler,
  registerDeviceHandler,
  deleteDeviceHandler,
} from './mobile.controller'

const router = Router()

// --- Auth ---
router.post('/mobile/auth/login', authRateLimit, loginHandler)
router.post('/mobile/auth/logout', authenticateMobile, logoutHandler)

// --- Profile ---
router.get('/mobile/me', authenticateMobile, meHandler)

// --- Attendance (self) ---
router.get('/mobile/me/today', authenticateMobile, todayHandler)
router.get('/mobile/me/attendance', authenticateMobile, historyHandler)
router.get('/mobile/me/attendance/:id', authenticateMobile, detailHandler)
router.post('/mobile/check-in', authenticateMobile, checkInHandler)
router.post('/mobile/check-out', authenticateMobile, checkOutHandler)

// --- Shift / schedule / locations ---
router.get('/mobile/me/shift', authenticateMobile, shiftHandler)
router.get('/mobile/me/schedule', authenticateMobile, scheduleHandler)
router.get('/mobile/me/locations', authenticateMobile, locationsHandler)

// --- Leave ---
router.get('/mobile/me/leave-requests', authenticateMobile, leaveListHandler)
router.post('/mobile/me/leave-requests', authenticateMobile, leaveCreateHandler)
router.post(
  '/mobile/me/leave-requests/:id/cancel',
  authenticateMobile,
  leaveCancelHandler,
)

// --- Notifications ---
router.get('/mobile/me/notifications', authenticateMobile, notificationsHandler)
router.post(
  '/mobile/me/notifications/:id/read',
  authenticateMobile,
  notificationReadHandler,
)

// --- Device tokens (FCM) ---
router.post('/mobile/me/device-token', authenticateMobile, registerDeviceHandler)
router.delete('/mobile/me/device-token', authenticateMobile, deleteDeviceHandler)

export default router
