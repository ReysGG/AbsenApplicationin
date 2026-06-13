/**
 * system.controller.ts — handler for GET /system/health.
 */

import type { Request, Response, NextFunction } from 'express'
import { sendSuccess } from '../../lib/response'
import { getSystemHealth } from './system.service'

export async function systemHealthHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    sendSuccess(res, await getSystemHealth(new Date()))
  } catch (err) {
    next(err)
  }
}
