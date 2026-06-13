/**
 * system.routes.ts — platform system-health API, mounted at /api/v1.
 *
 *   GET /system/health — real DB/uptime/counts probe (platform admin only)
 */

import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate'
import { requirePlatformAdmin } from '../../middleware/requirePlatformAdmin'
import { systemHealthHandler } from './system.controller'

const router = Router()

router.get(
  '/system/health',
  authenticate,
  requirePlatformAdmin(),
  systemHealthHandler,
)

export default router
