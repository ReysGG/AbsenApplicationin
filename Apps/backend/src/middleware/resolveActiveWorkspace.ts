/**
 * resolveActiveWorkspace.ts — loads and validates the Active Workspace,
 * enforces workspace isolation, and detects cross-workspace access attempts.
 *
 * Must run AFTER `authenticate` (req.user and req.workspaceId must be set).
 *
 * Steps:
 * 1. Load the Workspace record from DB using req.workspaceId.
 * 2. Reject if the workspace is not found or not Active.
 * 3. Verify the requesting user has a RoleAssignment in this workspace
 *    (cross-workspace attempt detection).
 * 4. Attach the workspace to req.activeWorkspace.
 *
 * Requirements: 4.2, 4.6, 4.8
 */

import type { Request, Response, NextFunction } from 'express'
import { prisma } from '../config/prisma'
import { ForbiddenError, UnauthenticatedError } from '../lib/errors'

export async function resolveActiveWorkspace(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user || !req.workspaceId) {
      return next(new UnauthenticatedError('Autentikasi diperlukan sebelum resolve workspace'))
    }

    // 1. Load workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: req.workspaceId },
    })

    // 2. Reject if not found or not Active
    if (!workspace || workspace.status !== 'Active') {
      return next(new ForbiddenError('Workspace tidak aktif atau tidak ditemukan'))
    }

    // 3. Cross-workspace check — user must have a role assignment in this workspace
    const assignment = await prisma.roleAssignment.findFirst({
      where: {
        workspaceId: req.workspaceId,
        userId: req.user.userId,
      },
    })

    if (!assignment) {
      // Log security event — cross-workspace access attempt (R4.6)
      try {
        await prisma.auditLog.create({
          data: {
            workspaceId: req.workspaceId,
            actorUserId: req.user.userId,
            action: 'unauthorized_cross_workspace_access_attempt',
            entityType: 'Workspace',
            entityId: req.workspaceId,
            ipAddress: req.ip ?? null,
            userAgent: req.headers['user-agent'] ?? null,
            requestId: req.requestId ?? null,
          },
        })
      } catch {
        // Audit log failure must not block the error response
      }

      return next(new ForbiddenError('Akses ke workspace ini tidak diizinkan'))
    }

    // 4. Attach workspace to request
    req.activeWorkspace = workspace

    return next()
  } catch (err) {
    return next(err)
  }
}
