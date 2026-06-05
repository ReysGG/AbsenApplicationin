"use client";

import { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

type AdminUser = {
  name: string;
  email: string;
  initials: string;
};

export default function AdminShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: AdminUser;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="admin-shell" data-sidebar={sidebarOpen ? "open" : "closed"}>
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />
      <div className="admin-main">
        <AdminTopbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} user={user} />
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
