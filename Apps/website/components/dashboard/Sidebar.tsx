"use client";

/**
 * components/dashboard/Sidebar.tsx
 *
 * Sidebar navigasi dashboard AttendX.
 *
 * - Item navigasi ditampilkan sesuai permission (R13.3, R3.11)
 * - Item tanpa permission TIDAK disembunyikan, melainkan di-disable
 *   (aria-disabled, pointer-events-none, opacity-50)
 * - Active route di-highlight
 * - Nama user + role badge di bagian bawah
 * - Tombol keluar
 * - Responsive: tersembunyi di mobile (burger menu di header)
 *
 * Requirements: 3.4, 3.11, 13.3, 19.1, 19.3
 */

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  Building2,
  MapPin,
  Clock,
  FileText,
  BarChart3,
  Download,
  Settings,
  Shield,
  X,
  LogOut,
  Menu,
  UserCircle,
} from "lucide-react";

import { signOut } from "@/lib/auth-client";
import type { DashboardUser } from "@/types/dashboard";
import {
  hasPermission,
  isStakeholder,
  PERMISSIONS,
} from "@/lib/permissionGuards";

// ── Tipe nav item ─────────────────────────────────────────────────────────────

interface NavItem {
  /** Label tampilan (Bahasa Indonesia, R19.3) */
  label: string;
  href: string;
  icon: React.ElementType;
  /**
   * Permission yang dibutuhkan. Jika undefined → item selalu aktif
   * (misal untuk halaman yang hanya butuh autentikasi).
   */
  requiredPermission?: (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
  /** Khusus Stakeholder saja (tidak punya permission key eksplisit) */
  stakeholderOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Ikhtisar",
    href: "/workspace/overview",
    icon: LayoutDashboard,
    requiredPermission: PERMISSIONS.VIEW_DASHBOARD,
  },
  {
    label: "Absensi Live",
    href: "/workspace/attendance",
    icon: CalendarCheck,
    requiredPermission: PERMISSIONS.VIEW_LIVE_ATTENDANCE,
  },
  {
    label: "Karyawan",
    href: "/workspace/workforce",
    icon: Users,
    requiredPermission: PERMISSIONS.VIEW_EMPLOYEES,
  },
  {
    label: "Departemen",
    href: "/workspace/departments",
    icon: Building2,
    requiredPermission: PERMISSIONS.VIEW_EMPLOYEES,
  },
  {
    label: "Lokasi",
    href: "/workspace/locations",
    icon: MapPin,
    requiredPermission: PERMISSIONS.MANAGE_LOCATIONS,
  },
  {
    label: "Shift",
    href: "/workspace/shifts",
    icon: Clock,
    requiredPermission: PERMISSIONS.MANAGE_SHIFTS,
  },
  {
    label: "Izin & Cuti",
    href: "/workspace/leave",
    icon: FileText,
    requiredPermission: PERMISSIONS.APPROVE_LEAVE,
  },
  {
    label: "Laporan",
    href: "/workspace/reports",
    icon: BarChart3,
    requiredPermission: PERMISSIONS.VIEW_REPORTS,
  },
  {
    label: "Ekspor",
    href: "/workspace/exports",
    icon: Download,
    requiredPermission: PERMISSIONS.EXPORT_REPORTS,
  },
  {
    label: "Pengaturan",
    href: "/workspace/settings",
    icon: Settings,
    stakeholderOnly: true,
  },
  {
    label: "Audit Log",
    href: "/workspace/audit-log",
    icon: Shield,
    requiredPermission: PERMISSIONS.VIEW_AUDIT_LOGS,
  },
  {
    label: "Akun",
    href: "/workspace/account",
    icon: UserCircle,
    // Accessible to all authenticated dashboard users — no permission required
  },
];

// ── Role badge helper ─────────────────────────────────────────────────────────

function getRoleBadgeLabel(roles: string[]): string {
  if (roles.includes("stakeholder")) return "Stakeholder";
  if (roles.includes("support_admin")) return "Support Admin";
  return "User";
}

function getRoleInitials(fullName: string): string {
  return fullName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface SidebarProps {
  user: DashboardUser;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  /**
   * Tentukan apakah user punya akses ke item navigasi.
   * Stakeholder selalu bisa (implicit all permission, R3.2).
   */
  function canAccess(item: NavItem): boolean {
    if (item.stakeholderOnly) return isStakeholder(user);
    if (!item.requiredPermission) return true;
    return hasPermission(user, item.requiredPermission);
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push("/login");
            router.refresh();
          },
        },
      });
    } finally {
      setSigningOut(false);
    }
  }

  const roleBadge = getRoleBadgeLabel(user.roles);
  const initials = getRoleInitials(user.fullName);

  // ── Render nav items ────────────────────────────────────────────────────────

  function renderNavItems() {
    return NAV_ITEMS.map((item) => {
      const accessible = canAccess(item);
      const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
      const Icon = item.icon;

      if (accessible) {
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={[
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-white/15 text-white"
                : "text-slate-300 hover:bg-white/10 hover:text-white",
            ].join(" ")}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon size={18} aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      }

      // Item tidak punya permission: tampil disabled (R13.3, R3.11)
      return (
        <span
          key={item.href}
          role="link"
          aria-disabled="true"
          aria-label={`${item.label} (tidak tersedia)`}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium opacity-40 cursor-not-allowed select-none text-slate-400"
          title="Anda tidak memiliki izin untuk mengakses menu ini"
        >
          <Icon size={18} aria-hidden="true" />
          <span>{item.label}</span>
        </span>
      );
    });
  }

  // ── Sidebar isi ─────────────────────────────────────────────────────────────

  function SidebarContent() {
    return (
      <div className="flex flex-col h-full">
        {/* Logo / Brand */}
        <div className="px-4 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold tracking-tight">AX</span>
            </div>
            <span className="text-white text-base font-bold tracking-tight">
              AttendX
            </span>
          </div>
        </div>

        {/* Navigasi */}
        <nav
          className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto"
          aria-label="Navigasi utama"
        >
          {renderNavItems()}
        </nav>

        {/* User info + sign out */}
        <div className="px-3 py-4 border-t border-white/10 space-y-2">
          {/* User profile card */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5">
            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center shrink-0 text-white text-xs font-bold"
              aria-hidden="true"
            >
              {initials || "?"}
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate" title={user.fullName}>
                {user.fullName}
              </p>
              <p className="text-xs text-slate-400 truncate">{roleBadge}</p>
            </div>
          </div>

          {/* Tombol Keluar */}
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-red-500/15 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Keluar dari akun"
          >
            <LogOut size={18} aria-hidden="true" />
            <span>{signingOut ? "Keluar..." : "Keluar"}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Desktop sidebar (fixed, 240px) ─────────────────────────────────── */}
      <aside
        className="hidden lg:flex w-60 bg-slate-900 fixed left-0 top-0 h-full z-40 flex-col"
        aria-label="Sidebar navigasi"
      >
        <SidebarContent />
      </aside>

      {/* ── Mobile: burger button (ditampilkan di header, di luar sidebar) ─── */}
      {/* Tombol burger dirender di layout, di sini hanya drawer */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-30 p-2 rounded-lg bg-slate-900 text-white shadow-md"
        aria-label="Buka menu navigasi"
        aria-expanded={mobileOpen}
      >
        <Menu size={20} />
      </button>

      {/* ── Mobile drawer overlay ────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer */}
          <aside
            className="relative w-60 bg-slate-900 h-full flex flex-col shadow-2xl z-50"
            aria-label="Menu navigasi mobile"
          >
            {/* Tombol tutup */}
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Tutup menu navigasi"
            >
              <X size={16} />
            </button>

            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
