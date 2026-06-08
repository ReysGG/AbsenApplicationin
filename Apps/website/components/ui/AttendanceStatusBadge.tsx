"use client";

/**
 * components/ui/AttendanceStatusBadge.tsx
 *
 * Shared badge untuk AttendanceStatus — dipakai di attendance page,
 * overview live preview, reports, dll.
 *
 * Requirements: 19.5 — tidak hanya warna, tapi juga teks label.
 */

export type AttendanceStatus =
  | "Present"
  | "Late"
  | "Absent"
  | "PendingCheckout"
  | "MissingCheckout"
  | "Leave"
  | "Invalid"
  | "Duplicate";

const STATUS_CONFIG: Record<
  AttendanceStatus,
  { label: string; className: string }
> = {
  Present: {
    label: "Hadir",
    className: "bg-green-100 text-green-800",
  },
  Late: {
    label: "Terlambat",
    className: "bg-orange-100 text-orange-800",
  },
  Absent: {
    label: "Tidak Hadir",
    className: "bg-red-100 text-red-800",
  },
  PendingCheckout: {
    label: "Belum Pulang",
    className: "bg-gray-100 text-gray-600",
  },
  MissingCheckout: {
    label: "Lupa Absen Pulang",
    className: "bg-amber-100 text-amber-800",
  },
  Leave: {
    label: "Izin/Cuti",
    className: "bg-purple-100 text-purple-800",
  },
  Invalid: {
    label: "Tidak Valid",
    className: "bg-red-600 text-white",
  },
  Duplicate: {
    label: "Duplikat",
    className: "bg-gray-200 text-gray-600",
  },
};

interface AttendanceStatusBadgeProps {
  status: AttendanceStatus | string;
}

export function AttendanceStatusBadge({ status }: AttendanceStatusBadgeProps) {
  const config = STATUS_CONFIG[status as AttendanceStatus] ?? {
    label: status,
    className: "bg-gray-100 text-gray-600",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border border-transparent ${config.className}`}
    >
      {config.label}
    </span>
  );
}
