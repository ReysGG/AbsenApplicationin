/**
 * mobile.routes.ts — mobile API surface, mounted at /api/v1/mobile.
 *
 * Auth model: better-auth bearer token (Authorization: Bearer <token>),
 * NOT the HMAC BFF headers used by the web dashboard. See authenticateMobile.
 *
 *   POST /mobile/auth/login           (public)
 *   POST /mobile/auth/logout          (bearer)
 *   GET  /mobile/me                   (bearer)
 *   GET  /mobile/me/today             (bearer)
 *   GET  /mobile/me/attendance        (bearer)
 *   GET  /mobile/me/attendance/:id    (bearer)
 *   POST /mobile/check-in             (bearer)
 *   POST /mobile/check-out            (bearer)
 *   GET  /mobile/me/shift             (bearer)
 *   GET  /mobile/me/locations         (bearer)
 *   GET  /mobile/me/leave-requests    (bearer)
 *   POST /mobile/me/leave-requests    (bearer)
 *   GET  /mobile/me/schedule          (bearer)
 *   GET  /mobile/me/notifications     (bearer)
 */

import { Router } from 'express'
import { authenticateMobile } from '../../middleware/authenticateMobile'
import { authRateLimit } from '../../middleware/rateLimiter'
import {
  mobileLoginHandler,
  mobileLogoutHandler,
  mobileMeHandler,
} from './mobile.auth'
import {
  todayHandler,
  historyHandler,
  attendanceDetailHandler,
  shiftHandler,
  locationsHandler,
  checkInHandler,
  checkOutHandler,
  leaveListHandler,
  createLeaveHandler,
  cancelLeaveHandler,
  scheduleHandler,
  notificationsHandler,
  markNotificationReadHandler,
  markAllNotificationsReadHandler,
  registerDeviceTokenHandler,
  deleteDeviceTokenHandler,
} from './mobile.controller'

const router = Router()

// Public
router.post('/mobile/auth/login', authRateLimit, mobileLoginHandler)

// Authenticated (bearer)
const guard = [authenticateMobile]

router.post('/mobile/auth/logout', ...guard, mobileLogoutHandler)
router.get('/mobile/me', ...guard, mobileMeHandler)
router.get('/mobile/me/today', ...guard, todayHandler)
router.get('/mobile/me/attendance', ...guard, historyHandler)
router.get('/mobile/me/attendance/:id', ...guard, attendanceDetailHandler)
router.post('/mobile/check-in', ...guard, checkInHandler)
router.post('/mobile/check-out', ...guard, checkOutHandler)
router.get('/mobile/me/shift', ...guard, shiftHandler)
router.get('/mobile/me/locations', ...guard, locationsHandler)
router.get('/mobile/me/leave-requests', ...guard, leaveListHandler)
router.post('/mobile/me/leave-requests', ...guard, createLeaveHandler)
router.post('/mobile/me/leave-requests/:id/cancel', ...guard, cancelLeaveHandler)
router.get('/mobile/me/schedule', ...guard, scheduleHandler)
router.get('/mobile/me/notifications', ...guard, notificationsHandler)
router.post('/mobile/me/notifications/read-all', ...guard, markAllNotificationsReadHandler)
router.post('/mobile/me/notifications/:id/read', ...guard, markNotificationReadHandler)
router.post('/mobile/me/device-token', ...guard, registerDeviceTokenHandler)
router.delete('/mobile/me/device-token', ...guard, deleteDeviceTokenHandler)

export default router
