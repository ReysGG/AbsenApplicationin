/**
 * lib/permissionGuards.ts
 *
 * Frontend permission helpers — mirrors the backend PERMISSIONS catalogue.
 *
 * These helpers are used in UI components to show/disable/hide elements based
 * on the current user's role and assigned permissions. The data comes from the
 * `/me` endpoint (loaded via the API client and stored in session context).
 *
 * Important: permission enforcement is always done server-side (Express).
 * Frontend guards are purely cosmetic / UX helpers and MUST NOT be relied
 * upon for security.
 *
 * Requirements: 3.4, 3.11, 13.3, 18.7
 */

// ---------------------------------------------------------------------------
// Permission catalogue (mirrors Apps/backend/src/lib/permissions.ts exactly)
// ---------------------------------------------------------------------------

export const PERMISSIONS = {
  // Action permissions
  MANAGE_EMPLOYEES: "manage_employees",
  MANAGE_LOCATIONS: "manage_locations",
  MANAGE_SHIFTS: "manage_shifts",
  MANAGE_GEOFENCE: "manage_geofence",
  MANAGE_WFH_MODE: "manage_wfh_mode",
  MANAGE_GRACE_PERIOD: "manage_grace_period",
  MANAGE_ATTENDANCE_POLICY: "manage_attendance_policy",
  APPROVE_LEAVE: "approve_leave",
  EXPORT_REPORTS: "export_reports",
  MANAGE_ROLES: "manage_roles",
  // View permissions
  VIEW_DASHBOARD: "view_dashboard",
  VIEW_LIVE_ATTENDANCE: "view_live_attendance",
  VIEW_REPORTS: "view_reports",
  VIEW_EMPLOYEES: "view_employees",
  VIEW_AUDIT_LOGS: "view_audit_logs",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ---------------------------------------------------------------------------
// Session user shape (subset of what /me endpoint returns)
// ---------------------------------------------------------------------------

/**
 * Minimal representation of the authenticated user carried by the session /
 * fetched from the /me endpoint.
 *
 * `roles` and `permissions` are populated from the backend response and
 * injected into client state (e.g. a React context or Zustand store).
 */
export interface SessionUser {
  /** better-auth user id */
  id: string;
  email: string;
  name: string;
  /** Workspace roles, e.g. ['stakeholder'] or ['support_admin'] */
  roles: string[];
  /**
   * Explicitly assigned permission keys (empty for Stakeholder — they get
   * implicit all via isStakeholder()).
   */
  permissions: string[];
  /** Active workspace id */
  workspaceId?: string;
}

// ---------------------------------------------------------------------------
// Core helpers
// ---------------------------------------------------------------------------

/**
 * Returns `true` if the user holds the `stakeholder` role in their active
 * workspace.
 *
 * Stakeholder has all permissions implicitly (R3.2).
 */
export function isStakeholder(user: SessionUser | null): boolean {
  if (!user) return false;
  return user.roles.includes("stakeholder");
}

/**
 * Check if the current user has a specific permission.
 *
 * Stakeholders always return `true`.
 * Support Admins are checked against their explicit permissions array.
 * Users with no relevant role return `false`.
 *
 * @param user       The current session user (null if not logged in).
 * @param permission The permission key to check.
 */
export function hasPermission(
  user: SessionUser | null,
  permission: Permission
): boolean {
  if (!user) return false;
  // Stakeholder — implicit all permissions (R3.2)
  if (isStakeholder(user)) return true;
  return user.permissions.includes(permission);
}

/**
 * Returns `true` if the user has ALL of the supplied permissions.
 *
 * Useful for guarding elements that require multiple permissions simultaneously.
 */
export function hasAllPermissions(
  user: SessionUser | null,
  permissions: Permission[]
): boolean {
  return permissions.every((p) => hasPermission(user, p));
}

/**
 * Returns `true` if the user has ANY of the supplied permissions.
 *
 * Useful for sidebar items that are accessible with at least one of several
 * permissions.
 */
export function hasAnyPermission(
  user: SessionUser | null,
  permissions: Permission[]
): boolean {
  return permissions.some((p) => hasPermission(user, p));
}

/**
 * Returns `true` if the user can access the web dashboard at all.
 *
 * End-users (role `end_user` only) SHALL NOT access the web dashboard (R3.4).
 */
export function canAccessDashboard(user: SessionUser | null): boolean {
  if (!user) return false;
  return user.roles.some((r) => r === "stakeholder" || r === "support_admin");
}

// ---------------------------------------------------------------------------
// Convenience guards for common UI scenarios
// ---------------------------------------------------------------------------

/** Can manage employees (create/edit/archive) */
export const canManageEmployees = (user: SessionUser | null) =>
  hasPermission(user, PERMISSIONS.MANAGE_EMPLOYEES);

/** Can view employee list */
export const canViewEmployees = (user: SessionUser | null) =>
  hasPermission(user, PERMISSIONS.VIEW_EMPLOYEES);

/** Can manage locations / geofence radius */
export const canManageLocations = (user: SessionUser | null) =>
  hasPermission(user, PERMISSIONS.MANAGE_LOCATIONS);

export const canManageGeofence = (user: SessionUser | null) =>
  hasPermission(user, PERMISSIONS.MANAGE_GEOFENCE);

/** Can manage shifts / grace period */
export const canManageShifts = (user: SessionUser | null) =>
  hasPermission(user, PERMISSIONS.MANAGE_SHIFTS);

export const canManageGracePeriod = (user: SessionUser | null) =>
  hasPermission(user, PERMISSIONS.MANAGE_GRACE_PERIOD);

/** Can approve / reject leave requests */
export const canApproveLeave = (user: SessionUser | null) =>
  hasPermission(user, PERMISSIONS.APPROVE_LEAVE);

/** Can export reports */
export const canExportReports = (user: SessionUser | null) =>
  hasPermission(user, PERMISSIONS.EXPORT_REPORTS);

/** Can view audit logs */
export const canViewAuditLogs = (user: SessionUser | null) =>
  hasPermission(user, PERMISSIONS.VIEW_AUDIT_LOGS);

/** Can view overview dashboard */
export const canViewDashboard = (user: SessionUser | null) =>
  hasPermission(user, PERMISSIONS.VIEW_DASHBOARD);

/** Can view live attendance table */
export const canViewLiveAttendance = (user: SessionUser | null) =>
  hasPermission(user, PERMISSIONS.VIEW_LIVE_ATTENDANCE);

/** Can view reports */
export const canViewReports = (user: SessionUser | null) =>
  hasPermission(user, PERMISSIONS.VIEW_REPORTS);

/** Only Stakeholder may manage roles/permissions (R3.8) */
export const canManageRoles = (user: SessionUser | null) =>
  isStakeholder(user);
