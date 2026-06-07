/**
 * audit.ts — Reusable helpers for writing to the AuditLog table.
 *
 * All writes are best-effort (errors are swallowed + logged) so that audit
 * failures never break the primary request flow.
 *
 * Requirements: 14.1, 14.2, 14.3, 14.7
 */

import { prisma } from '../config/prisma'
import { logger } from './logger'

export interface AuditEventParams {
  workspaceId: string
  actorUserId?: string | null
  action: string
  entityType?: string | null
  entityId?: string | null
  oldValue?: unknown
  newValue?: unknown
  ipAddress?: string | null
  userAgent?: string | null
  requestId?: string | null
}

/**
 * Write a single audit log entry to the database (best-effort).
 * On failure, logs the error to the structured logger without throwing.
 */
export async function writeAudit(params: AuditEventParams): Promise<void> {
  if (!prisma) return // Prisma not yet generated (dev bootstrap)
  try {
    await prisma.auditLog.create({
      data: {
        workspaceId: params.workspaceId,
        actorUserId: params.actorUserId ?? null,
        action: params.action,
        entityType: params.entityType ?? null,
        entityId: params.entityId ?? null,
        oldValue: params.oldValue !== undefined ? (params.oldValue as object) : undefined,
        newValue: params.newValue !== undefined ? (params.newValue as object) : undefined,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
        requestId: params.requestId ?? null,
      },
    })
  } catch (err) {
    logger.error('Failed to write audit log', {
      action: params.action,
      workspaceId: params.workspaceId,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}
