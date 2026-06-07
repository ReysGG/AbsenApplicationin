"use client";

import React, { useState } from "react";
import { Users, UserCheck, Shield, HelpCircle, Plus } from "lucide-react";
import { PageHeader } from "../_components/PageHeader";
import { StatCard } from "../_components/StatCard";
import { AdminUser } from "./_components/types";
import { InviteAdminModal } from "./_components/InviteAdminModal";
import { UserTable } from "./_components/UserTable";
import { Toast } from "./_components/Toast";

const initialUsers: AdminUser[] = [
  {
    id: "1",
    name: "Sarah Jenkins",
    email: "sarah.j@attendx.com",
    role: "CS Agent",
    status: "Active",
    lastActive: "2 mins ago",
  },
  {
    id: "2",
    name: "Michael Chen",
    email: "m.chen@attendx.com",
    role: "Support",
    status: "Active",
    lastActive: "1 hour ago",
  },
  {
    id: "3",
    name: "Elena Rodriguez",
    email: "elena.r@attendx.com",
    role: "Billing",
    status: "Inactive",
    lastActive: "3 days ago",
  },
  {
    id: "4",
    name: "David K.",
    email: "david.k@attendx.com",
    role: "Super Admin",
    status: "Active",
    lastActive: "Just now",
  },
  {
    id: "5",
    name: "Jessica Taylor",
    email: "jessica.t@attendx.com",
    role: "CS Agent",
    status: "Active",
    lastActive: "4 hours ago",
  },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleInviteAdmin = (data: {
    name: string;
    email: string;
    role: AdminUser["role"];
  }) => {
    const newUser: AdminUser = {
      id: (users.length + 1).toString(),
      name: data.name,
      email: data.email,
      role: data.role,
      status: "Active",
      lastActive: "Invited",
    };

    setUsers((prev) => [newUser, ...prev]);
    setIsInviteModalOpen(false);

    setToastMessage("User invited successfully!");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDeactivate = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: u.status === "Active" ? "Inactive" : "Active" } : u))
    );
  };

  // Filter team directory
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "All" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <PageHeader
        title="Admin Users"
        description="Manage your internal platform support, success, and superadmin team."
      >
        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="px-4 py-2.5 bg-primary text-on-primary rounded-lg font-label-md text-xs font-semibold hover:bg-primary/95 transition-colors shadow-sm flex items-center gap-1.5"
        >
          <Plus size={16} />
          Invite Admin
        </button>
      </PageHeader>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={users.length}
          icon={<Users size={20} />}
          iconBgColor="bg-primary/10"
          iconColor="text-primary"
          gradientCls="bg-primary/5"
        />
        <StatCard
          title="Active Admins"
          value={users.filter((u) => u.status === "Active").length}
          icon={<UserCheck size={20} />}
          iconBgColor="bg-emerald-500/10"
          iconColor="text-emerald-600"
          gradientCls="bg-emerald-500/5"
        />
        <StatCard
          title="CS Agents"
          value={users.filter((u) => u.role === "CS Agent").length}
          icon={<Shield size={20} />}
          iconBgColor="bg-blue-500/10"
          iconColor="text-blue-600"
          gradientCls="bg-blue-500/5"
        />
        <StatCard
          title="Technical Support"
          value={users.filter((u) => u.role === "Support").length}
          icon={<HelpCircle size={20} />}
          iconBgColor="bg-purple-500/10"
          iconColor="text-purple-600"
          gradientCls="bg-purple-500/5"
        />
      </div>

      {/* Team Directory Table Card */}
      <UserTable
        filteredUsers={filteredUsers}
        search={search}
        setSearch={setSearch}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        onDeactivate={handleDeactivate}
      />

      {/* Invite Admin Modal */}
      <InviteAdminModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvite={handleInviteAdmin}
      />

      {/* Success Toast */}
      <Toast message={toastMessage} />
    </div>
  );
}
