"use client";

/**
 * SummaryCards.tsx
 *
 * 6 kartu ringkasan kehadiran:
 * - Total Karyawan → /workspace/workforce
 * - Hadir Hari Ini → /workspace/attendance?status=Present
 * - Terlambat       → /workspace/attendance?status=Late  (R5.5)
 * - Izin/Cuti       → (no link for now, filtered from leave module)
 * - Tidak Hadir     → /workspace/attendance?status=Absent
 * - Belum Absen Pulang → /workspace/attendance?status=PendingCheckout
 *
 * Requirements: 5.1, 5.5, 19.5
 */

import Link from "next/link";
import {
  Users,
  UserCheck,
  Clock,
  CalendarOff,
  UserX,
  LogOut,
} from "lucide-react";
import type { DashboardSummary } from "@/types/overview";

interface SummaryCardsProps {
  data: DashboardSummary | null;
  loading?: boolean;
}

interface CardConfig {
  key: keyof Pick<
    DashboardSummary,
    | "total_employees"
    | "present"
    | "late"
    | "on_leave"
    | "absent"
    | "pending_checkout"
  >;
  label: string;
  href?: string;
  colorClass: string;
  bgClass: string;
  icon: React.ComponentType<{ className?: string }>;
  ariaLabel: string;
}

const CARDS: CardConfig[] = [
  {
    key: "total_employees",
    label: "Total Karyawan",
    href: "/workspace/workforce",
    colorClass: "text-blue-600",
    bgClass: "bg-blue-50",
    icon: Users,
    ariaLabel: "Total Karyawan — klik untuk ke halaman Workforce",
  },
  {
    key: "present",
    label: "Hadir Hari Ini",
    href: "/workspace/attendance?status=Present",
    colorClass: "text-green-600",
    bgClass: "bg-green-50",
    icon: UserCheck,
    ariaLabel: "Jumlah karyawan hadir hari ini",
  },
  {
    key: "late",
    label: "Terlambat",
    href: "/workspace/attendance?status=Late",
    colorClass: "text-orange-600",
    bgClass: "bg-orange-50",
    icon: Clock,
    ariaLabel: "Jumlah karyawan terlambat — klik untuk filter di Live Attendance",
  },
  {
    key: "on_leave",
    label: "Izin / Cuti",
    colorClass: "text-purple-600",
    bgClass: "bg-purple-50",
    icon: CalendarOff,
    ariaLabel: "Jumlah karyawan sedang izin atau cuti",
  },
  {
    key: "absent",
    label: "Tidak Hadir",
    href: "/workspace/attendance?status=Absent",
    colorClass: "text-red-600",
    bgClass: "bg-red-50",
    icon: UserX,
    ariaLabel: "Jumlah karyawan tidak hadir",
  },
  {
    key: "pending_checkout",
    label: "Belum Absen Pulang",
    href: "/workspace/attendance?status=PendingCheckout",
    colorClass: "text-gray-500",
    bgClass: "bg-gray-50",
    icon: LogOut,
    ariaLabel: "Jumlah karyawan belum absen pulang",
  },
];

function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 w-28 bg-gray-200 rounded" />
        <div className="h-9 w-9 bg-gray-200 rounded-lg" />
      </div>
      <div className="h-8 w-16 bg-gray-200 rounded mt-2" />
    </div>
  );
}

export default function SummaryCards({ data, loading }: SummaryCardsProps) {
  if (loading || !data) {
    return (
      <div
        className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4"
        aria-label="Memuat kartu ringkasan"
        aria-busy="true"
      >
        {CARDS.map((c) => (
          <CardSkeleton key={c.key} />
        ))}
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4"
      role="list"
      aria-label="Ringkasan kehadiran hari ini"
    >
      {CARDS.map((card) => {
        const Icon = card.icon;
        const value = data[card.key];
        const inner = (
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col gap-2 hover:shadow-md transition-shadow h-full">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">
                {card.label}
              </span>
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.bgClass}`}
                aria-hidden="true"
              >
                <Icon className={`w-5 h-5 ${card.colorClass}`} />
              </div>
            </div>
            <span
              className={`text-3xl font-bold ${card.colorClass}`}
              aria-label={`${value} ${card.label}`}
            >
              {value.toLocaleString("id-ID")}
            </span>
          </div>
        );

        return (
          <div key={card.key} role="listitem">
            {card.href ? (
              <Link
                href={card.href}
                className="block h-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-xl"
                aria-label={card.ariaLabel}
              >
                {inner}
              </Link>
            ) : (
              <div aria-label={card.ariaLabel}>{inner}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
