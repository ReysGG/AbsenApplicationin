/**
 * lib/requirePermissionServer.ts
 *
 * Server-side route guard for dashboard pages. Unlike the cosmetic helpers in
 * permissionGuards.ts (which only hide/disable UI), this runs in a Server
 * Component layout and redirects users who lack the required permission BEFORE
 * the page renders. Backend already 403s the data; this prevents an empty
 * shell from rendering and tightens defense-in-depth.
 *
 * Fail-closed: any error fetching /me → redirect away.
 *
 * Usage (in a route's layout.tsx):
 *   export default async function Layout({ children }) {
 *     await requirePermissionServer(PERMISSIONS.VIEW_AUDIT_LOGS);
 *     return children;
 *   }
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { createServerApiClient } from "@/lib/apiClient";
import {
  hasPermission,
  type Permission,
  type SessionUser,
} from "@/lib/permissionGuards";

interface MeResponse {
  id: string;
  email: string;
  fullName: string;
  globalRole: string;
  roles: string[];
  permissions: string[];
  workspaceId?: string;
}

/**
 * Redirects to /login?error=access_denied unless the current user holds the
 * given permission (Stakeholder implicitly passes). Returns the resolved user
 * on success so callers can reuse it.
 */
export async function requirePermissionServer(
  permission: Permission,
): Promise<SessionUser> {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) {
    redirect("/login");
  }

  let user: SessionUser;
  try {
    const apiClient = createServerApiClient(requestHeaders);
    const meResponse = await apiClient.get<MeResponse>("v1/me");
    if (!meResponse.success) {
      redirect("/login?error=access_denied");
    }
    const me = meResponse.data;
    user = {
      id: me.id,
      email: me.email,
      name: me.fullName,
      roles: me.roles ?? [],
      permissions: me.permissions ?? [],
      workspaceId: me.workspaceId,
    };
  } catch {
    redirect("/login?error=access_denied");
  }

  if (!hasPermission(user, permission)) {
    redirect("/workspace/overview?error=forbidden");
  }

  return user;
}
