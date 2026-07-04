/**
 * auth.ts — shared auth types for the Express request context.
 *
 * `AuthenticatedUser` is populated by the `authenticate` middleware (Task 6)
 * after verifying the HMAC-signed user context sent by the Next.js BFF.
 *
 * Requirements: 3.2, 3.3, 3.10, 4.2
 */

// ---------------------------------------------------------------------------
// Scope assignment
// ---------------------------------------------------------------------------

/**
 * A single scope assignment from RoleAssignment — indicates what portion of
 * the workspace data a user can access.
 *
 * - `workspace`: full workspace access (no restriction).
 * - `department`: limited to a specific department.
 * - `location`: limited to a specific location.
 */
export interface ScopeAssignment {
  scopeType: 'workspace' | 'department' | 'location'
  /** The department or location id; `null` for workspace-wide scope. */
  scopeId: string | null
}

// ---------------------------------------------------------------------------
// Scope filtering
// ---------------------------------------------------------------------------

/**
 * Scope filter injected by `enforceScope` middleware.
 *
 * For a Stakeholder (workspace-scope) this is `undefined` — no filtering is
 * applied.  For a Support Admin the filter carries the union of their assigned
 * department / location scopes (OR logic — R3.10).
 */
export interface ScopeFilter {
  /** Department IDs the user has scope over. Empty = no department scope. */
  departmentIds: string[]
  /** Location IDs the user has scope over. Empty = no location scope. */
  locationIds: string[]
  /**
   * `true` when the user has at least one workspace-wide scope entry,
   * meaning all data in the workspace is accessible.
   */
  isWorkspaceScope: boolean
}

// ---------------------------------------------------------------------------
// Platform admin context
// ---------------------------------------------------------------------------

export type PlatformGlobalRole = 'super_admin' | 'admin_platform'

export interface PlatformActor {
  userId: string
  globalRole: PlatformGlobalRole
}

// ---------------------------------------------------------------------------
// Authenticated user context
// ---------------------------------------------------------------------------

export interface AuthenticatedUser {
  /** better-auth internal user id — matches User.auth_user_id */
  authUserId: string
  /** Application-level User id (PK of the `users` table) */
  userId: string
  /** Full name from the User record */
  fullName: string
  /** Email from the User record */
  email: string
  /** Roles assigned to this user in the active workspace */
  roles: ('stakeholder' | 'support_admin' | 'end_user')[]
  /**
   * Explicit permissions the user holds in the active workspace.
   * For Stakeholders this is populated with ALL_PERMISSIONS implicitly by
   * the middleware; for Support Admins it reflects their
   * `RoleAssignmentPermission` rows.
   */
  permissions: string[]
  /**
   * Raw scope assignments from RoleAssignment rows in the active workspace.
   * Used by `enforceScope` to build the Prisma query filter.
   */
  scopeAssignments: ScopeAssignment[]
  /**
   * Scope filter derived by `enforceScope` and carried on the user object
   * for convenience.  `undefined` means full-workspace access (Stakeholder).
   */
  scopeFilter?: ScopeFilter
  /** Active workspace id — duplicated here for convenience */
  workspaceId: string
}

// ---------------------------------------------------------------------------
// Mobile employee context
// ---------------------------------------------------------------------------

/**
 * The Employee record for an authenticated mobile user, attached to
 * `req.employee` by `authenticateMobile`. Mobile self-service endpoints read
 * only this employee's own data — never cross-employee or HR-wide data.
 */
export interface MobileEmployee {
  id: string
  workspaceId: string
  userId: string | null
  employeeCode: string
  fullName: string
  email: string
  position: string | null
  departmentId: string
  departmentName: string | null
  workMode: 'WFO' | 'WFH' | 'Hybrid'
  faceProfileStatus: string
  assignedLocationId: string | null
  assignedShiftId: string | null
}
