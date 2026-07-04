/**
 * requirePlatformAdmin.ts — guard for the platform-admin console (/admin).
 *
 * Unlike requirePermission (workspace-scoped RBAC), this gates on the user's
 * GLOBAL role. Only `super_admin` and `admin_platform` may operate the
 * cross-tenant platform console. Platform routes are intentionally NOT
 * workspace-scoped — they span all tenants.
 *
 * Must run AFTER `authenticate` (req.user.userId must be set). The user's
 * globalRole is not carried on AuthenticatedUser, so it's loaded from the DB.
 */

import type { Request, Response, NextFunction, RequestHandler } from 'express'
import { prisma } from '../config/prisma'
import { ForbiddenError, UnauthenticatedError } from '../lib/errors'
import type { PlatformGlobalRole } from '../types/auth'

const PLATFORM_ROLES: PlatformGlobalRole[] = ['super_admin', 'admin_platform']

export function requirePlatformAdmin(): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(new UnauthenticatedError('Autentikasi diperlukan'))
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { globalRole: true },
      })

      const globalRole = dbUser?.globalRole as PlatformGlobalRole | undefined
      if (!globalRole || !PLATFORM_ROLES.includes(globalRole)) {
        return next(new ForbiddenError('Akses platform admin diperlukan'))
      }

      req.platformActor = {
        userId: req.user.userId,
        globalRole,
      }

      return next()
    } catch (err) {
      return next(err)
    }
  }
}
