/**
 * authenticate.ts — validates the HMAC-signed user context forwarded by the
 * Next.js BFF and attaches `req.user` + `req.workspaceId`.
 *
 * Header contract (set by BFF):
 *   x-user-context     : base64-encoded JSON { userId, authUserId, email, fullName, workspaceId }
 *   x-user-context-sig : HMAC-SHA256 hex digest of the raw base64 string
 *
 * The middleware:
 * 1. Reads both headers.
 * 2. Verifies the HMAC signature using INTERNAL_JWT_SECRET.
 * 3. Decodes the JSON payload.
 * 4. Looks up the User + RoleAssignments + Permissions from DB (via Prisma).
 * 5. Builds AuthenticatedUser and attaches it to req.user / req.workspaceId.
 * 6. On any failure → throws UnauthenticatedError.
 * 7. Records failed auth attempts as audit log entry `unauthorized_access`
 *    (best-effort — does not fail the request if audit write fails).
 *
 * Requirements: 3.1, 3.2, 3.3, 17.1, 17.2
 */

import type { Request, Response, NextFunction } from 'express'
import { prisma } from '../config/prisma'
import { env } from '../config/env'
import { verifyContext } from '../lib/hmac'
import { isStakeholder, ALL_PERMISSIONS } from '../lib/permissions'
import { UnauthenticatedError } from '../lib/errors'
import type { AuthenticatedUser, ScopeAssignment } from '../types/auth'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Shape of the JSON payload encoded inside x-user-context */
interface UserContextPayload {
  userId?: string      // App DB User.id — optional; resolved from authUserId if absent
  authUserId: string
  email: string
  fullName?: string
  workspaceId?: string // Optional; resolved from first active workspace if absent
}

// ---------------------------------------------------------------------------
// Audit helper
// ---------------------------------------------------------------------------

async function recordUnauthorizedAccess(
  req: Request,
  workspaceId: string | null,
  reason: string,
): Promise<void> {
  if (!prisma || !workspaceId) return
  try {
    await prisma.auditLog.create({
      data: {
        workspaceId,
        actorUserId: null,
        action: 'unauthorized_access',
        entityType: 'Auth',
        entityId: null,
        newValue: { reason, path: req.path },
        ipAddress: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
        requestId: (req as Request & { requestId?: string }).requestId ?? null,
      },
    })
  } catch {
    // Best-effort — do not fail the request on audit log write failure
  }
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const contextHeader = req.headers['x-user-context'] as string | undefined
  const sigHeader = req.headers['x-user-context-sig'] as string | undefined

  // 1. Require both headers
  if (!contextHeader || !sigHeader) {
    await recordUnauthorizedAccess(req, null, 'Missing x-user-context or x-user-context-sig header')
    return next(new UnauthenticatedError('Header autentikasi tidak ditemukan'))
  }

  // 2. Verify HMAC signature
  const isValid = verifyContext(contextHeader, sigHeader, env.INTERNAL_JWT_SECRET)
  if (!isValid) {
    await recordUnauthorizedAccess(req, null, 'Invalid HMAC signature')
    return next(new UnauthenticatedError('Signature header tidak valid'))
  }

  // 3. Decode base64 → JSON
  let payload: UserContextPayload
  try {
    const decoded = Buffer.from(contextHeader, 'base64').toString('utf-8')
    payload = JSON.parse(decoded) as UserContextPayload
  } catch {
    await recordUnauthorizedAccess(req, null, 'Failed to decode user context payload')
    return next(new UnauthenticatedError('User context tidak dapat didekode'))
  }

  if (!payload.authUserId) {
    await recordUnauthorizedAccess(req, null, 'Incomplete user context payload — missing authUserId')
    return next(new UnauthenticatedError('User context tidak lengkap'))
  }

  // 4. Look up User by userId or authUserId, then resolve workspaceId
  try {
    // 4a. Resolve the app User record
    //     Priority: userId > authUserId > email (fallback for seed users with placeholder authUserId)
    let userRecord = payload.userId
      ? await prisma.user.findUnique({ where: { id: payload.userId } })
      : await prisma.user.findUnique({ where: { authUserId: payload.authUserId } })

    // Fallback: look up by email (dev seed users have placeholder authUserId)
    if (!userRecord && payload.email) {
      userRecord = await prisma.user.findUnique({ where: { email: payload.email } })
      // NOTE: intentionally NOT updating authUserId here — mutating authUserId
      // from a request middleware would allow account takeover if the shared
      // INTERNAL_JWT_SECRET is ever compromised. authUserId sync must be done
      // via a separate trusted admin operation.
    }

    if (!userRecord) {
      await recordUnauthorizedAccess(req, null, `User not found: authUserId=${payload.authUserId}, email=${payload.email}`)
      return next(new UnauthenticatedError('User tidak ditemukan'))
    }

    // 4b. Resolve workspaceId — use cookie value or fall back to first active workspace
    let resolvedWorkspaceId = payload.workspaceId ?? ''
    if (!resolvedWorkspaceId) {
      const firstAssignment = await prisma.roleAssignment.findFirst({
        where: { userId: userRecord.id },
        include: { workspace: { select: { id: true, status: true } } },
        orderBy: { createdAt: 'asc' },
      })
      const ws = firstAssignment?.workspace as { id: string; status: string } | undefined
      if (ws && ws.status === 'Active') {
        resolvedWorkspaceId = ws.id
      } else {
        await recordUnauthorizedAccess(req, null, `No active workspace for user: ${userRecord.id}`)
        return next(new UnauthenticatedError('User tidak memiliki workspace aktif'))
      }
    }

    // 4c. Load RoleAssignments + Permissions for the resolved workspace
    const user = await prisma.user.findUnique({
      where: { id: userRecord.id },
      include: {
        roleAssignments: {
          where: { workspaceId: resolvedWorkspaceId },
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    })

    if (!user) {
      await recordUnauthorizedAccess(req, resolvedWorkspaceId, `User not found: ${userRecord.id}`)
      return next(new UnauthenticatedError('User tidak ditemukan'))
    }

    // Replace payload references below with resolved values
    payload.userId = userRecord.id
    payload.workspaceId = resolvedWorkspaceId

    // 5. Derive roles (de-duplicated)
    const roles = [
      ...new Set(
        (user.roleAssignments as Array<{ role: 'stakeholder' | 'support_admin' | 'end_user' }>).map(
          (ra) => ra.role,
        ),
      ),
    ] as ('stakeholder' | 'support_admin' | 'end_user')[]

    // 6. Derive permissions
    // Stakeholder: implicit all permissions (R3.2)
    // Support Admin: union of all explicitly assigned permission keys (R3.3)
    let permissions: string[]
    if (isStakeholder(roles)) {
      permissions = [...ALL_PERMISSIONS]
    } else {
      const permSet = new Set<string>()
      for (const ra of user.roleAssignments as Array<{
        permissions: Array<{ permission: { key: string } }>
      }>) {
        for (const rap of ra.permissions) {
          permSet.add(rap.permission.key)
        }
      }
      permissions = [...permSet]
    }

    // 7. Build scope assignments (one per RoleAssignment row)
    const scopeAssignments: ScopeAssignment[] = (
      user.roleAssignments as Array<{
        scopeType: 'workspace' | 'department' | 'location'
        scopeId: string | null
      }>
    ).map((ra) => ({
      scopeType: ra.scopeType,
      scopeId: ra.scopeId,
    }))

    // 8. Build and attach AuthenticatedUser
    const authenticatedUser: AuthenticatedUser = {
      userId: user.id,
      authUserId: user.authUserId,
      fullName: payload.fullName ?? (user as { fullName: string }).fullName,
      email: user.email,
      roles,
      permissions,
      scopeAssignments,
      workspaceId: payload.workspaceId,
    }

    req.user = authenticatedUser
    req.workspaceId = payload.workspaceId

    // Expose resolved workspaceId to the BFF via response header so it can
    // persist the ACTIVE_WORKSPACE_ID cookie on the client side.
    // The BFF (Next.js route.ts) reads this header and sets the cookie.
    res.setHeader('x-resolved-workspace-id', payload.workspaceId)

    return next()
  } catch (err) {
    return next(err)
  }
}
