/**
 * permissions.ts — permission resolution helpers for RBAC.
 *
 * Stakeholder has ALL permissions implicitly (Requirement 3.2).
 * Support Admin holds only explicitly assigned permissions (Requirement 3.3).
 *
 * Requirements: 3.1, 3.2, 3.3, 3.5, 3.6
 */

// ---------------------------------------------------------------------------
// Permission catalogue (15 keys, seeded in the Permission table)
// ---------------------------------------------------------------------------

export const PERMISSIONS = {
  // Action permissions
  MANAGE_EMPLOYEES: 'manage_employees',
  MANAGE_LOCATIONS: 'manage_locations',
  MANAGE_SHIFTS: 'manage_shifts',
  MANAGE_GEOFENCE: 'manage_geofence',
  MANAGE_WFH_MODE: 'manage_wfh_mode',
  MANAGE_GRACE_PERIOD: 'manage_grace_period',
  MANAGE_ATTENDANCE_POLICY: 'manage_attendance_policy',
  APPROVE_LEAVE: 'approve_leave',
  EXPORT_REPORTS: 'export_reports',
  MANAGE_ROLES: 'manage_roles',
  // View permissions
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_LIVE_ATTENDANCE: 'view_live_attendance',
  VIEW_REPORTS: 'view_reports',
  VIEW_EMPLOYEES: 'view_employees',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

/** Flat array of all permission values — used to populate Stakeholder's permission list */
export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS) as Permission[]

/** Legacy alias — kept for backwards compat with existing imports */
export type PermissionKey = Permission

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns `true` if the user's roles include `'stakeholder'`.
 *
 * Stakeholder always has all permissions implicitly (R3.2).
 */
export function isStakeholder(roles: string[]): boolean {
  return roles.includes('stakeholder')
}

/**
 * Stakeholder implicit permission check — always returns `true`.
 *
 * Satisfies the requirement that Stakeholder has all permissions without
 * explicit assignment in the DB (R3.2).
 */
export function stakeholderHasAllPermissions(): true {
  return true
}

/**
 * Check if a user has a specific permission, accounting for the Stakeholder
 * implicit-all-grant.
 *
 * @param roles        The user's workspace roles (e.g. ['support_admin']).
 * @param permissions  The user's explicitly assigned permission keys.
 * @param permission   The permission key being checked.
 * @returns            `true` if the user holds the permission.
 */
export function hasPermission(
  roles: string[],
  permissions: string[],
  permission: Permission,
): boolean {
  if (isStakeholder(roles)) return true
  return permissions.includes(permission)
}

/**
 * Returns `true` if the supplied `userPermissions` array contains `required`.
 *
 * Legacy helper used in places that have already resolved that the user is not
 * a Stakeholder, or where stakeholder handling is done by the caller.
 *
 * @deprecated Prefer `hasPermission(roles, permissions, permission)` for new code.
 */
export function checkPermission(
  userPermissions: string[],
  required: string,
): boolean {
  return userPermissions.includes(required)
}

