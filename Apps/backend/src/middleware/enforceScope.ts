/**
 * enforceScope.ts — injects a Prisma-compatible scope filter into the request
 * based on the authenticated user's scope assignments.
 *
 * Must run AFTER `authenticate` (req.user must be set).
 *
 * Scope resolution rules:
 * - Stakeholder → no filter (workspace-wide access, R3.2).
 * - User has a `workspace` scope entry → no filter (workspace-wide access).
 * - Otherwise → build filter as OR union across all department/location scopes
 *   (R3.10): { departmentIds: [...], locationIds: [...], isWorkspaceScope: false }
 *
 * The resulting ScopeFilter is attached to both `req.scopeFilter` and
 * `req.user.scopeFilter` for convenience.
 *
 * Query usage example:
 *   const filter = req.scopeFilter
 *   if (!filter || filter.isWorkspaceScope) {
 *     // full access — query with workspace_id only
 *   } else {
 *     where: {
 *       workspaceId,
 *       OR: [
 *         ...(filter.departmentIds.length ? [{ departmentId: { in: filter.departmentIds } }] : []),
 *         ...(filter.locationIds.length ? [{ assignedLocationId: { in: filter.locationIds } }] : []),
 *       ]
 *     }
 *   }
 *
 * Requirements: 3.10, 4.2, 4.6
 */

import type { Request, Response, NextFunction } from 'express'
import { UnauthenticatedError } from '../lib/errors'
import { isStakeholder } from '../lib/permissions'
import type { ScopeFilter } from '../types/auth'

export function enforceScope(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    return next(new UnauthenticatedError('Autentikasi diperlukan sebelum enforce scope'))
  }

  const { roles, scopeAssignments } = req.user

  // Stakeholder: implicit workspace-wide access — no filter needed (R3.2)
  if (isStakeholder(roles)) {
    req.scopeFilter = undefined
    req.user.scopeFilter = undefined
    return next()
  }

  // Check if any scope assignment grants workspace-wide access
  const hasWorkspaceScope = scopeAssignments.some((sa) => sa.scopeType === 'workspace')
  if (hasWorkspaceScope) {
    const filter: ScopeFilter = {
      departmentIds: [],
      locationIds: [],
      isWorkspaceScope: true,
    }
    req.scopeFilter = filter
    req.user.scopeFilter = filter
    return next()
  }

  // Build OR union across department and location scopes
  const departmentIds: string[] = []
  const locationIds: string[] = []

  for (const sa of scopeAssignments) {
    if (sa.scopeId === null) continue
    if (sa.scopeType === 'department') {
      departmentIds.push(sa.scopeId)
    } else if (sa.scopeType === 'location') {
      locationIds.push(sa.scopeId)
    }
  }

  const filter: ScopeFilter = {
    departmentIds,
    locationIds,
    isWorkspaceScope: false,
  }

  req.scopeFilter = filter
  req.user.scopeFilter = filter

  return next()
}
