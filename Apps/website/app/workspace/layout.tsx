/**
 * app/workspace/layout.tsx
 *
 * Layout utama dashboard — Server Component.
 *
 * Flow:
 * 1. Ambil session via auth.api.getSession (server-side, tanpa redirect ke client).
 * 2. Jika tidak ada session → redirect ke /login.
 * 3. Ambil profil + permission user dari endpoint /api/v1/me via BFF.
 * 4. Jika user adalah end_user saja (tidak punya akses dashboard) → redirect
 *    ke /login?error=access_denied (R3.4).
 * 5. Render layout dengan <Sidebar user={dashboardUser} /> + <main>{children}</main>.
 *
 * Requirements: 3.4, 3.11, 13.3, 19.1, 19.3
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { createServerApiClient } from "@/lib/apiClient";
import { canAccessDashboard } from "@/lib/permissionGuards";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import type { DashboardUser } from "@/types/dashboard";

export const metadata: Metadata = {
  title: "AttendX — Dashboard",
};

// ── Tipe respons dari endpoint /me ────────────────────────────────────────────

interface MeResponse {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
  workspaceId?: string;
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Validasi session server-side
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    // Tidak ada session → ke halaman login
    redirect("/login");
  }

  // 2. Ambil profil lengkap (roles + permissions) dari BFF/Express
  let dashboardUser: DashboardUser;

  try {
    const apiClient = createServerApiClient(requestHeaders);
    const meResponse = await apiClient.get<MeResponse>("v1/me");

    if (meResponse.success) {
      const me = meResponse.data;
      dashboardUser = {
        id: me.id,
        email: me.email,
        name: me.fullName,
        fullName: me.fullName,
        roles: me.roles ?? [],
        permissions: me.permissions ?? [],
        workspaceId: me.workspaceId,
      };
    } else {
      // API error → fallback ke data session minimal
      const fallbackName = session.user.name ?? session.user.email;
      dashboardUser = {
        id: session.user.id,
        email: session.user.email,
        name: fallbackName,
        fullName: fallbackName,
        roles: [],
        permissions: [],
      };
    }
  } catch {
    // Network error atau Express belum ready → fallback ke data session
    const fallbackName = session.user.name ?? session.user.email;
    dashboardUser = {
      id: session.user.id,
      email: session.user.email,
      name: fallbackName,
      fullName: fallbackName,
      roles: [],
      permissions: [],
    };
  }

  // 3. Cek hak akses dashboard (R3.4 — end_user tidak boleh akses)
  if (!canAccessDashboard(dashboardUser)) {
    redirect("/login?error=access_denied");
  }

  // 4. Render layout dengan sidebar + konten
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar navigasi (fixed, 240px) */}
      <Sidebar user={dashboardUser} />

      {/* Area konten utama */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Header top bar (mobile burger sudah ada di Sidebar component) */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 lg:px-8 sticky top-0 z-20 shadow-sm">
          {/* Spacer untuk burger di mobile (tombol burger di-render oleh Sidebar) */}
          <div className="lg:hidden w-10" aria-hidden="true" />

          <div className="flex-1 flex items-center gap-2 text-sm text-gray-500">
            <span className="text-gray-400">AttendX</span>
            <span className="text-gray-300" aria-hidden="true">
              /
            </span>
            <span className="text-gray-700 font-medium">Dashboard</span>
          </div>

          {/* Notification bell + user info */}
          <div className="flex items-center gap-3">
            <NotificationBell />

            {/* Info user singkat di kanan header */}
            <div className="hidden sm:flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-bold"
                aria-label={`Masuk sebagai ${dashboardUser.fullName}`}
                title={dashboardUser.fullName}
              >
                {dashboardUser.fullName
                  .split(" ")
                  .slice(0, 2)
                  .map((w) => w[0]?.toUpperCase() ?? "")
                  .join("") || "?"}
              </div>
              <span className="text-sm text-gray-600 font-medium max-w-[160px] truncate">
                {dashboardUser.fullName}
              </span>
            </div>
          </div>
        </header>

        {/* Konten halaman */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
