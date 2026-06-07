/**
 * auth.service.ts — business logic for auth/me endpoints.
 *
 * GET /me                           : reshape AuthenticatedUser from req.user
 * GET /workspaces/current           : reshape Workspace from req.activeWorkspace
 * POST /auth/login-event            : record login_success + update last_login_at
 * POST /auth/logout-event           : record logout
 * POST /auth/login-failed           : record failed login attempt for lockout tracking
 *
 * Requirements: 1.1, 1.7, 1.12, 1.13, 3.2, 3.3, 4.7, 14.1
 */

import type { AuthenticatedUser } from '../../types/auth'
import { prisma } from '../../config/prisma'
import { writeAudit } from '../../lib/audit'
import { recordFailedAttempt, resetAttempts } from '../../lib/loginAttempts'

/**
 * Minimal workspace shape — mirrors the Workspace Prisma model fields we
 * expose.  Using a plain interface avoids the @prisma/client import until
 * prisma generate has run.
 */
interface WorkspaceRecord {
  id: string
  name: string
  timezone: string
  defaultGeofenceRadius: number
  defaultGracePeriod: number
  absenceCutoffMinutes: number
  wfhEnabled: boolean
  hybridEnabled: boolean
  status: string
}

export interface MeResponse {
  id: string
  authUserId: string
  email: string
  fullName: string
  globalRole: string
  workspaceId: string | null
  roles: string[]
  permissions: string[]
  scopeAssignments: Array<{ scopeType: string; scopeId: string | null }>
}

export interface CurrentWorkspaceResponse {
  id: string
  name: string
  timezone: string
  defaultGeofenceRadius: number
  defaultGracePeriod: number
  absenceCutoffMinutes: number
  wfhEnabled: boolean
  hybridEnabled: boolean
  status: string
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * Build the /me response payload from the already-resolved AuthenticatedUser.
 * We also fetch the User's globalRole from DB so we can include it.
 *
 * Requirements: 1.1, 3.2, 3.3
 */
export async function getMe(user: AuthenticatedUser): Promise<MeResponse> {
  // Fetch globalRole from DB — it's not carried on AuthenticatedUser
  const dbUser = await (prisma as any).user.findUnique({
    where: { id: user.userId },
    select: { globalRole: true },
  })

  return {
    id: user.userId,
    authUserId: user.authUserId,
    email: user.email,
    fullName: user.fullName,
    globalRole: dbUser?.globalRole ?? 'user',
    workspaceId: user.workspaceId ?? null,
    roles: user.roles,
    permissions: user.permissions,
    scopeAssignments: user.scopeAssignments,
  }
}

/**
 * Build the /workspaces/current response payload from the already-resolved Workspace.
 *
 * Requirements: 4.7
 */
export function getCurrentWorkspace(workspace: WorkspaceRecord): CurrentWorkspaceResponse {
  return {
    id: workspace.id,
    name: workspace.name,
    timezone: workspace.timezone,
    defaultGeofenceRadius: workspace.defaultGeofenceRadius,
    defaultGracePeriod: workspace.defaultGracePeriod,
    absenceCutoffMinutes: workspace.absenceCutoffMinutes,
    wfhEnabled: workspace.wfhEnabled,
    hybridEnabled: workspace.hybridEnabled,
    status: workspace.status,
  }
}

// ---------------------------------------------------------------------------
// Login / Logout event service functions
// ---------------------------------------------------------------------------

export interface LoginEventParams {
  user: AuthenticatedUser
  workspaceId: string
  ipAddress?: string | null
  userAgent?: string | null
  requestId?: string | null
}

export interface LoginFailedParams {
  email: string
}

export interface LogoutEventParams {
  user: AuthenticatedUser
  workspaceId: string
  ipAddress?: string | null
  userAgent?: string | null
  requestId?: string | null
}

/**
 * Record a successful login:
 *  1. Reset any accumulated failed-attempt counter for this email.
 *  2. Update User.lastLoginAt.
 *  3. Write login_success to the audit log.
 *
 * Requirements: 1.1, 1.13, 14.1
 */
export async function recordLoginSuccess(params: LoginEventParams): Promise<void> {
  const { user, workspaceId, ipAddress, userAgent, requestId } = params

  // Clear lockout counter on successful auth (R1.7)
  resetAttempts(user.email)

  // Update last_login_at (best-effort — not critical path)
  if (prisma) {
    try {
      await prisma.user.update({
        where: { id: user.userId },
        data: { lastLoginAt: new Date() },
      })
    } catch {
      // Best-effort
    }
  }

  // Audit entry
  await writeAudit({
    workspaceId,
    actorUserId: user.userId,
    action: 'login_success',
    entityType: 'Auth',
    entityId: user.userId,
    newValue: { email: user.email },
    ipAddress,
    userAgent,
    requestId,
  })
}

/**
 * Record a failed login attempt for lockout tracking.
 * The BFF calls this endpoint when better-auth returns a sign-in error.
 *
 * This is a fire-and-forget operation; no audit DB write here since workspace
 * context is unavailable at login time. The structured log in loginGuard covers
 * the lockout event audit.
 *
 * Requirements: 1.7, 1.8
 */
export function recordLoginFailed(params: LoginFailedParams): void {
  recordFailedAttempt(params.email)
}

/**
 * Record a logout event in the audit log.
 *
 * Requirements: 1.12, 1.13, 14.1
 */
export async function recordLogout(params: LogoutEventParams): Promise<void> {
  const { user, workspaceId, ipAddress, userAgent, requestId } = params

  await writeAudit({
    workspaceId,
    actorUserId: user.userId,
    action: 'logout',
    entityType: 'Auth',
    entityId: user.userId,
    newValue: { email: user.email },
    ipAddress,
    userAgent,
    requestId,
  })
}
