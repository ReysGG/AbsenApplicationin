"use client";

import React from "react";
import { Shield, ShieldAlert, Key, User } from "lucide-react";

export type UserRole = "superadmin" | "stakeholder" | "support_admin" | "end_user";

interface RoleSelectorProps {
  activeRole: UserRole;
  onChange: (role: UserRole) => void;
}

export default function RoleSelector({ activeRole, onChange }: RoleSelectorProps) {
  const roles = [
    {
      id: "superadmin" as UserRole,
      name: "Platform Admin",
      desc: "Super Admin",
      icon: ShieldAlert,
      color: "border-rose-500 text-rose-600 bg-rose-50/50"
    },
    {
      id: "stakeholder" as UserRole,
      name: "Stakeholder",
      desc: "Company Owner",
      icon: Shield,
      color: "border-violet-500 text-violet-600 bg-violet-50/50"
    },
    {
      id: "support_admin" as UserRole,
      name: "Support Admin",
      desc: "HR Manager",
      icon: Key,
      color: "border-primary text-primary bg-primary/5"
    },
    {
      id: "end_user" as UserRole,
      name: "End User",
      desc: "Karyawan / Staff",
      icon: User,
      color: "border-emerald-500 text-emerald-600 bg-emerald-50/50"
    }
  ];

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 space-y-3 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">
            Simulasi Hierarki Role
          </h3>
          <p className="text-[10px] text-on-surface-variant font-medium">
            Pilih role untuk memantau visualisasi dashboard dan kapabilitas fungsional yang sesuai.
          </p>
        </div>
        <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-800 border border-amber-500/20 uppercase tracking-wide shrink-0">
          Semua Fitur Aktif
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {roles.map((role) => {
          const Icon = role.icon;
          const isActive = activeRole === role.id;
          return (
            <button
              key={role.id}
              onClick={() => onChange(role.id)}
              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                isActive
                  ? `${role.color} border-2 shadow-sm font-semibold scale-[1.01]`
                  : "border-outline-variant bg-surface hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isActive ? "bg-white shadow-xs" : "bg-surface-container"
                }`}
              >
                <Icon size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate leading-none mb-0.5">
                  {role.name}
                </p>
                <p className="text-[9px] font-medium opacity-80 leading-none">
                  {role.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
