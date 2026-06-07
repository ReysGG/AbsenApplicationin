/**
 * requirePermission.ts — RBAC permission guard middleware factory.
 *
 * Usage:
 *   router.get('/some-route', authenticate, resolveActiveWorkspace, requirePermission(PERMISSIONS.VIEW_REPORTS), handler)
 *
 * Logic:
 * - If user is Stakeholder → allow (implicit all permissions, R3.2).
 * - Else check req.user.permissions contains the required permission key.
 * - If denied → 403 ForbiddenError + best-effort audit log (R3.11).
 *
 * Requirements: 3.2, 3.3, 3.7, 3.11
 */

import type { Request, Response, NextFunction, RequestHandler } from 'express'
import { prisma } from '../config/prisma'
import { ForbiddenError, UnauthenticatedError } from '../lib/errors'
import { hasPermission } from '../lib/permissions'
import type { Permission } from '../lib/permissions'

/**
 * Factory that returns an Express middleware which guards a route by `permission`.
 *
 * @param permission  Permission key that the user must hold (e.g. PERMISSIONS.VIEW_REPORTS).
 */
export function requirePermission(permission: Permission): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(new UnauthenticatedError('Autentikasi diperlukan'))
      }

      // hasPermission handles the Stakeholder implicit-all grant internally
      if (hasPermission(req.user.roles, req.user.permissions, permission)) {
        return next()
      }

      // Permission denied — log audit event best-effort (R3.11)
      const workspaceId = req.workspaceId ?? req.activeWorkspace?.id
      if (workspaceId && prisma) {
        try {
          await prisma.auditLog.create({
            data: {
              workspaceId,
              actorUserId: req.user.userId,
              action: 'failed_permission_check_for_sensitive_action',
              entityType: 'Permission',
              entityId: permission,
              ipAddress: req.ip ?? null,
              userAgent: req.headers['user-agent'] ?? null,
              requestId: req.requestId ?? null,
            },
          })
        } catch {
          // Audit log failure must not block the error response
        }
      }

      return next(new ForbiddenError(`Permission required: ${permission}`))
    } catch (err) {
      return next(err)
    }
  }
}
