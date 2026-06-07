"use client";

/**
 * LivePreview.tsx
 *
 * Preview 5 check-in terakhir di dashboard.
 * Menampilkan: nama, divisi, waktu check-in, status badge.
 * Badge: Present=hijau, Late=oranye, Invalid=merah.
 * Empty state: "Belum ada check-in hari ini" (R5.9, R19.9).
 * Link ke halaman Live Attendance.
 *
 * Requirements: 5.3, 5.9, 19.5
 */

import Link from "next/link";
import type { LivePreviewItem, AttendanceStatus } from "@/types/overview";
import { ArrowRight, UserCircle } from "lucide-react";

interface LivePreviewProps {
  data: LivePreviewItem[] | null;
  loading?: boolean;
}

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  Present: "Hadir",
  Late: "Terlambat",
  Absent: "Tidak Hadir",
  PendingCheckout: "Belum Pulang",
  MissingCheckout: "Lupa Absen Pulang",
  Leave: "Izin/Cuti",
  Invalid: "Tidak Valid",
};

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  Present: "bg-green-100 text-green-700",
  Late: "bg-orange-100 text-orange-700",
  Absent: "bg-red-100 text-red-700",
  PendingCheckout: "bg-gray-100 text-gray-600",
  MissingCheckout: "bg-yellow-100 text-yellow-700",
  Leave: "bg-purple-100 text-purple-700",
  Invalid: "bg-red-100 text-red-800",
};

function formatTime(isoUtc: string): string {
  try {
    const d = new Date(isoUtc);
    return d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    });
  } catch {
    return "--:--";
  }
}

function SkeletonItem() {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 animate-pulse">
      <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-4 bg-gray-200 rounded w-32" />
        <div className="h-3 bg-gray-200 rounded w-20" />
      </div>
      <div className="h-6 bg-gray-200 rounded-full w-20" />
    </div>
  );
}

export default function LivePreview({ data, loading }: LivePreviewProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-700">
          Check-in Terkini
        </h2>
        <Link
          href="/workspace/attendance"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
          aria-label="Lihat semua Live Attendance"
        >
          Lihat semua
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>

      <div className="flex-1">
        {loading ? (
          <div aria-busy="true" aria-label="Memuat check-in terkini">
            {[1, 2, 3, 4, 5].map((i) => (
              <SkeletonItem key={i} />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <div
            className="py-10 flex flex-col items-center gap-2 text-gray-400"
            role="status"
            aria-label="Belum ada check-in"
          >
            <UserCircle className="w-10 h-10 text-gray-300" aria-hidden="true" />
            <span className="text-sm">Belum ada check-in hari ini</span>
          </div>
        ) : (
          <ul role="list" aria-label="Daftar check-in terkini">
            {data.map((item) => {
              const statusLabel =
                STATUS_LABELS[item.status] ?? item.status;
              const statusColor =
                STATUS_COLORS[item.status] ?? "bg-gray-100 text-gray-600";

              return (
                <li
                  key={item.attendance_id}
                  className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0"
                >
                  {/* Avatar initials */}
                  <div
                    className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-semibold shrink-0"
                    aria-hidden="true"
                  >
                    {item.employee_name
                      .split(" ")
                      .slice(0, 2)
                      .map((w) => w[0]?.toUpperCase() ?? "")
                      .join("")}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {item.employee_name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {item.department_name} · {formatTime(item.check_in_at)} WIB
                    </p>
                  </div>

                  {/* Status badge — color + teks sesuai R19.5 */}
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${statusColor}`}
                    aria-label={`Status: ${statusLabel}`}
                  >
                    {statusLabel}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
