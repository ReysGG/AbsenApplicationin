/**
 * audit.service.ts — business logic for audit log endpoints.
 *
 * Endpoints covered:
 *   GET /audit-logs        — paginated list with filters (R14.5, R14.6)
 *   GET /audit-logs/:id    — single log detail (R14.2)
 *
 * Business rules:
 *   - Append-only: no POST/PATCH/DELETE (R14.4)
 *   - Scope-limited: Support Admin only sees logs within their scope (R14.7)
 *   - Filter by date/actor/action (R14.5)
 *   - Old/new values contain only changed fields, no sensitive data (R14.3)
 *
 * Requirements: 14.1–14.7
 */

import { prisma } from '../../config/prisma'
import { ForbiddenError, NotFoundError } from '../../lib/errors'
import { isStakeholder } from '../../lib/permissions'
import type { ScopeFilter } from '../../types/auth'
import type { ListAuditQuery } from './audit.schema'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuditLogItem {
  id: string
  workspaceId: string
  actorUserId: string | null
  action: string
  entityType: string | null
  entityId: string | null
  oldValue: unknown
  newValue: unknown
  ipAddress: string | null
  userAgent: string | null
  requestId: string | null
  createdAt: string
}

export interface PaginatedAuditLogs {
  items: AuditLogItem[]
  pagination: {
    page: number
    page_size: number
    total: number
    total_pages: number
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a Prisma where clause for the scope filter.
 * Support Admins can only see logs within their scope (by entity type and workspace).
 * R14.7: scope-limited access.
 */
function buildScopeWhere(
  workspaceId: string,
  actorRoles: string[],
  scopeFilter?: ScopeFilter,
): Record<string, unknown> {
  const base: Record<string, unknown> = { workspaceId }

  // Stakeholder sees all (workspace scope implicit)
  if (isStakeholder(actorRoles)) {
    return base
  }

  // Full workspace scope
  if (!scopeFilter || scopeFilter.isWorkspaceScope) {
    return base
  }

  // Support Admin with limited scope: show logs related to their scope
  // We restrict by entityId matching their department/location ids OR workspace-level actions
  const scopeIds = [
    ...scopeFilter.departmentIds,
    ...scopeFilter.locationIds,
  ]

  if (scopeIds.length === 0) {
    // No scope assigned — show no logs (empty result)
    return { ...base, id: 'NEVER_MATCHES' }
  }

  return {
    ...base,
    OR: [
      // Logs for entities in their scope
      { entityId: { in: scopeIds } },
      // Workspace-level logs (entity type Workspace)
      { entityType: 'Workspace' },
      // Logs they themselves created
      // (actorUserId filter added in the main query if needed)
    ],
  }
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * GET /audit-logs
 * Paginated, filtered audit log list.
 * Support Admins see only logs in their scope.
 *
 * Requirements: 14.2, 14.5, 14.6, 14.7
 */
export async function listAuditLogs(params: {
  workspaceId: string
  query: ListAuditQuery
  actorRoles: string[]
  scopeFilter?: ScopeFilter
}): Promise<PaginatedAuditLogs> {
  const { workspaceId, query, actorRoles, scopeFilter } = params

  const { page, page_size: pageSize, start_date, end_date, actor, action, entity_type } = query

  // Build where clause
  const scopeWhere = buildScopeWhere(workspaceId, actorRoles, scopeFilter)

  // Additional filters
  const extraFilters: Record<string, unknown>[] = []

  if (start_date || end_date) {
    const dateFilter: Record<string, unknown> = {}
    if (start_date) {
      dateFilter['gte'] = new Date(`${start_date}T00:00:00.000Z`)
    }
    if (end_date) {
      dateFilter['lte'] = new Date(`${end_date}T23:59:59.999Z`)
    }
    extraFilters.push({ createdAt: dateFilter })
  }

  if (actor) {
    extraFilters.push({ actorUserId: actor })
  }

  if (action) {
    extraFilters.push({ action: { contains: action, mode: 'insensitive' } })
  }

  if (entity_type) {
    extraFilters.push({ entityType: entity_type })
  }

  const where =
    extraFilters.length > 0
      ? { AND: [scopeWhere, ...extraFilters] }
      : scopeWhere

  const skip = (page - 1) * pageSize

  const [total, logs] = await Promise.all([
    (prisma as any).auditLog.count({ where }),
    (prisma as any).auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      select: {
        id: true,
        workspaceId: true,
        actorUserId: true,
        action: true,
        entityType: true,
        entityId: true,
        oldValue: true,
        newValue: true,
        ipAddress: true,
        userAgent: true,
        requestId: true,
        createdAt: true,
      },
    }),
  ])

  const items = (
    logs as Array<{
      id: string
      workspaceId: string
      actorUserId: string | null
      action: string
      entityType: string | null
      entityId: string | null
      oldValue: unknown
      newValue: unknown
      ipAddress: string | null
      userAgent: string | null
      requestId: string | null
      createdAt: Date
    }>
  ).map((log) => ({
    id: log.id,
    workspaceId: log.workspaceId,
    actorUserId: log.actorUserId,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    oldValue: log.oldValue,
    newValue: log.newValue,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    requestId: log.requestId,
    createdAt: log.createdAt.toISOString(),
  }))

  return {
    items,
    pagination: {
      page,
      page_size: pageSize,
      total,
      total_pages: Math.ceil(total / pageSize),
    },
  }
}

/**
 * GET /audit-logs/:id
 * Single audit log detail.
 * Scope-limited: Support Admin must have access to the log's entityId.
 *
 * Requirements: 14.2, 14.7
 */
export async function getAuditLogById(params: {
  workspaceId: string
  auditId: string
  actorRoles: string[]
  scopeFilter?: ScopeFilter
}): Promise<AuditLogItem> {
  const { workspaceId, auditId, actorRoles, scopeFilter } = params

  const log = await (prisma as any).auditLog.findFirst({
    where: { id: auditId, workspaceId },
  })

  if (!log) {
    throw new NotFoundError('Audit log')
  }

  // Scope check for non-Stakeholder (R14.7)
  if (!isStakeholder(actorRoles) && scopeFilter && !scopeFilter.isWorkspaceScope) {
    const scopeIds = [...scopeFilter.departmentIds, ...scopeFilter.locationIds]

    // Allow if the log entity is in scope, or it's a workspace-level log
    const isInScope =
      scopeIds.length === 0
        ? false
        : log.entityId === null ||
          log.entityType === 'Workspace' ||
          scopeIds.includes(log.entityId)

    if (!isInScope) {
      throw new ForbiddenError('Anda tidak memiliki akses ke audit log ini')
    }
  }

  return {
    id: log.id,
    workspaceId: log.workspaceId,
    actorUserId: log.actorUserId,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    oldValue: log.oldValue,
    newValue: log.newValue,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    requestId: log.requestId,
    createdAt: log.createdAt.toISOString(),
  }
}
