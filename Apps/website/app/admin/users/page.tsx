"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Users, UserCheck, Shield, HelpCircle, Plus } from "lucide-react";
import { PageHeader } from "../_components/PageHeader";
import { StatCard } from "../_components/StatCard";
import { AdminUser } from "./_components/types";
import { InviteAdminModal } from "./_components/InviteAdminModal";
import { UserTable } from "./_components/UserTable";
import { Toast } from "./_components/Toast";
import { createClientApiClient } from "@/lib/apiClient";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const api = createClientApiClient();
      const res = await api.get<AdminUser[]>("v1/platform/admin-users");
      if (res.success) {
        setUsers(res.data);
      } else {
        setError(res.error.message ?? "Gagal memuat admin users.");
      }
    } catch {
      setError("Terjadi kesalahan jaringan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleInviteAdmin = async (data: {
    name: string;
    email: string;
    role: AdminUser["role"];
  }) => {
    try {
      const api = createClientApiClient();
      // Backend promotes an EXISTING app user (by email) to a platform role.
      const res = await api.post("v1/platform/admin-users/invite", {
        email: data.email,
        role: data.role,
      });
      if (res.success) {
        setIsInviteModalOpen(false);
        setToastMessage("Admin role granted successfully!");
        setTimeout(() => setToastMessage(null), 3000);
        fetchUsers();
      } else {
        setError(res.error.message ?? "Gagal mengundang admin.");
      }
    } catch {
      setError("Gagal mengundang admin.");
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      const api = createClientApiClient();
      const res = await api.post(`v1/platform/admin-users/${id}/deactivate`, {});
      if (res.success) {
        fetchUsers();
      } else {
        setError(res.error.message ?? "Gagal mencabut akses.");
      }
    } catch {
      setError("Gagal mencabut akses.");
    }
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

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-xs font-medium">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

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
          title="Super Admins"
          value={users.filter((u) => u.role === "Super Admin").length}
          icon={<Shield size={20} />}
          iconBgColor="bg-blue-500/10"
          iconColor="text-blue-600"
          gradientCls="bg-blue-500/5"
        />
        <StatCard
          title="Platform Admins"
          value={users.filter((u) => u.role !== "Super Admin").length}
          icon={<HelpCircle size={20} />}
          iconBgColor="bg-purple-500/10"
          iconColor="text-purple-600"
          gradientCls="bg-purple-500/5"
        />
      </div>

      {loading ? (
        <div className="text-sm text-gray-500 py-12 text-center">Memuat admin users…</div>
      ) : (
        <UserTable
          filteredUsers={filteredUsers}
          search={search}
          setSearch={setSearch}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          onDeactivate={handleDeactivate}
        />
      )}

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
