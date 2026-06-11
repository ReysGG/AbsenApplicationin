import "./admin.css";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { createServerApiClient } from "@/lib/apiClient";
import AdminShell from "./_components/AdminShell";

/** Global roles allowed into the platform admin console. */
const PLATFORM_ROLES = ["super_admin", "admin_platform"];

interface MeResponse {
  id: string;
  email: string;
  fullName: string;
  globalRole: string;
  roles: string[];
  permissions: string[];
}

function getInitials(name: string, email: string) {
  const source = name.trim() || email.trim();
  const parts = source.split(/[\s@.]+/).filter(Boolean);

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "AD";
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Validasi session server-side (R3.4)
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    redirect("/login?callbackUrl=/admin");
  }

  // 2. Platform admin console hanya untuk global role super_admin / admin_platform.
  //    Fail-closed: jika /me gagal atau role tidak cocok → tolak akses.
  //    Tanpa gerbang ini, semua user yang login (termasuk karyawan biasa) bisa
  //    membuka /admin.
  let globalRole = "user";
  try {
    const apiClient = createServerApiClient(requestHeaders);
    const meResponse = await apiClient.get<MeResponse>("v1/me");
    if (meResponse.success) {
      globalRole = meResponse.data.globalRole ?? "user";
    } else {
      redirect("/login?error=access_denied");
    }
  } catch {
    redirect("/login?error=access_denied");
  }

  if (!PLATFORM_ROLES.includes(globalRole)) {
    redirect("/login?error=access_denied");
  }

  const user = {
    name: session.user.name || session.user.email,
    email: session.user.email,
    initials: getInitials(session.user.name || "", session.user.email),
  };

  return <AdminShell user={user}>{children}</AdminShell>;
}
