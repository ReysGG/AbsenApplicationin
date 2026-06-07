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
  // Temporary bypass for local development/testing:
  /*
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const user = {
    name: session.user.name || session.user.email,
    email: session.user.email,
    initials: getInitials(session.user.name || "", session.user.email),
  };
  */

  // Mock admin session details
  const user = {
    name: "Super Admin",
    email: "admin@attendx.com",
    initials: "SA",
  };

  return <AdminShell user={user}>{children}</AdminShell>;
}
