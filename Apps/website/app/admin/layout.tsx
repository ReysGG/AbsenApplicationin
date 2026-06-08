import "./admin.css";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AdminShell from "./_components/AdminShell";

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
  // Validasi session server-side (R3.4)
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login?callbackUrl=/admin");
  }

  const user = {
    name: session.user.name || session.user.email,
    email: session.user.email,
    initials: getInitials(session.user.name || "", session.user.email),
  };

  return <AdminShell user={user}>{children}</AdminShell>;
}
