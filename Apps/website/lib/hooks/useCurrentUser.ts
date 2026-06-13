"use client";

/**
 * lib/hooks/useCurrentUser.ts
 *
 * Client hook that loads the authenticated user's profile (roles + permissions)
 * from the `/me` endpoint via the BFF. This replaces hardcoded `currentUser`
 * objects in client pages (audit §11 — the workforce page previously assumed
 * `roles: ["stakeholder"]`, making permission guards cosmetic and misleading).
 *
 * Permission enforcement is always done server-side; this hook only powers
 * UX (show/hide/disable controls) based on the real session.
 */

import { useEffect, useState } from "react";
import { createClientApiClient } from "@/lib/apiClient";
import type { SessionUser } from "@/lib/permissionGuards";

interface MeResponse {
  id: string;
  email: string;
  fullName: string;
  globalRole: string;
  workspaceId?: string | null;
  roles: string[];
  permissions: string[];
}

export interface UseCurrentUserResult {
  user: SessionUser | null;
  loading: boolean;
  error: boolean;
}

export function useCurrentUser(): UseCurrentUserResult {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const api = createClientApiClient();

    api
      .get<MeResponse>("v1/me")
      .then((res) => {
        if (cancelled) return;
        if (res.success) {
          const me = res.data;
          setUser({
            id: me.id,
            email: me.email,
            name: me.fullName,
            roles: me.roles ?? [],
            permissions: me.permissions ?? [],
            workspaceId: me.workspaceId ?? undefined,
          });
        } else {
          setError(true);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { user, loading, error };
}
