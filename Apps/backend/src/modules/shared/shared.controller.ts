/**
 * shared.controller.ts — request handlers for shared reference data.
 *
 * All handlers run behind authenticate + resolveActiveWorkspace and a
 * permission guard (see shared.routes.ts).
 *
 * Requirements: 11.3
 */

import type { Request, Response, NextFunction } from 'express'
import { sendSuccess } from '../../lib/response'
import { UnauthenticatedError, ValidationError } from '../../lib/errors'
import * as service from './shared.service'

function requireWorkspaceId(req: Request): string {
  const workspaceId = req.workspaceId ?? req.activeWorkspace?.id
  if (!workspaceId) {
    throw new UnauthenticatedError('Workspace aktif tidak ditemukan')
  }
  return workspaceId
}

export async function listLeaveTypesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await service.listLeaveTypes(requireWorkspaceId(req))
    sendSuccess(res, data)
  } catch (err) {
    next(err)
  }
}

export async function createLeaveTypeHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const b = (req.body ?? {}) as Record<string, unknown>
    if (typeof b.name !== 'string') throw new ValidationError('name diperlukan')
    const data = await service.createLeaveType(requireWorkspaceId(req), {
      name: b.name,
      requiresAttachment:
        typeof b.requiresAttachment === 'boolean' ? b.requiresAttachment : undefined,
    })
    sendSuccess(res, data, 'Tipe izin dibuat', 201)
  } catch (err) {
    next(err)
  }
}

export async function updateLeaveTypeHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const b = (req.body ?? {}) as Record<string, unknown>
    const status =
      b.status === 'Active' || b.status === 'Inactive' ? b.status : undefined
    const data = await service.updateLeaveType(
      requireWorkspaceId(req),
      String(req.params.id),
      {
        name: typeof b.name === 'string' ? b.name : undefined,
        requiresAttachment:
          typeof b.requiresAttachment === 'boolean' ? b.requiresAttachment : undefined,
        status,
      },
    )
    sendSuccess(res, data, 'Tipe izin diperbarui')
  } catch (err) {
    next(err)
  }
}
