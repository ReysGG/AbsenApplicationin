/**
 * audit.controller.ts — request/response handlers for audit log endpoints.
 *
 * GET /api/v1/audit-logs       — paginated, filtered list (read-only)
 * GET /api/v1/audit-logs/:id   — single entry detail (read-only)
 *
 * No POST/PATCH/DELETE — audit logs are append-only (R14.4).
 *
 * Requirements: 14.1–14.7
 */

import type { Request, Response, NextFunction } from 'express'
import { sendSuccess } from '../../lib/response'
import { ValidationError } from '../../lib/errors'
import { listAuditQuerySchema } from './audit.schema'
import { listAuditLogs, getAuditLogById } from './audit.service'

/**
 * GET /api/v1/audit-logs
 * Paginated list of audit logs with optional filters.
 * Scope-limited for Support Admin.
 *
 * Requirements: 14.2, 14.5, 14.6, 14.7
 */
export async function listAuditLogsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parseResult = listAuditQuerySchema.safeParse(req.query)
    if (!parseResult.success) {
      return next(new ValidationError('Query tidak valid', parseResult.error.flatten()))
    }

    const workspaceId = req.workspaceId!
    const actorRoles = req.user!.roles as string[]
    const scopeFilter = req.user!.scopeFilter

    const result = await listAuditLogs({
      workspaceId,
      query: parseResult.data,
      actorRoles,
      scopeFilter,
    })

    sendSuccess(res, result)
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/v1/audit-logs/:id
 * Single audit log detail.
 *
 * Requirements: 14.2, 14.7
 */
export async function getAuditLogByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const workspaceId = req.workspaceId!
    const actorRoles = req.user!.roles as string[]
    const scopeFilter = req.user!.scopeFilter
    const auditId = req.params['id'] as string

    const log = await getAuditLogById({
      workspaceId,
      auditId,
      actorRoles,
      scopeFilter,
    })

    sendSuccess(res, log)
  } catch (err) {
    next(err)
  }
}
