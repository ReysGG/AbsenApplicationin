"use client";

/**
 * app/workspace/audit-log/page.tsx
 *
 * Halaman Audit Log — Client Component.
 *
 * Fitur:
 * - TanStack Table dengan server-side pagination
 * - Filter: tanggal, aktor, aksi
 * - Detail panel (read-only) slide-in
 * - Empty state aman (R19.9)
 * - Append-only — tidak ada aksi edit/delete (R14.4)
 *
 * Requirements: 14.5, 14.6, 14.7, 16.7, 19.9
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type PaginationState,
} from "@tanstack/react-table";
import {
  Search,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ClipboardList,
  X,
  AlertCircle,
  Eye,
} from "lucide-react";

import { createClientApiClient } from "@/lib/apiClient";
import type { PaginatedData } from "@/lib/apiClient";
import { formatDateTime, todayDateString } from "@/lib/formatters";
import { Input } from "@/components/ui/input";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuditLog {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  actorUserId: string | null;
  actorEmail?: string | null;
  actorName?: string | null;
  oldValue: unknown;
  newValue: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function actionLabel(action: string): string {
  const map: Record<string, string> = {
    login_success: "Login Berhasil",
    login_failed_due_to_lockout: "Login Gagal (Terkunci)",
    logout: "Logout",
    create_employee: "Buat Karyawan",
    update_employee: "Ubah Karyawan",
    archive_employee: "Arsipkan Karyawan",
    reactivate_employee: "Aktifkan Kembali Karyawan",
    create_department: "Buat Departemen",
    update_department: "Ubah Departemen",
    deactivate_department: "Nonaktifkan Departemen",
    create_location: "Buat Lokasi",
    update_location: "Ubah Lokasi",
    change_geofence_radius: "Ubah Radius Geofence",
    deactivate_location: "Nonaktifkan Lokasi",
    create_shift: "Buat Shift",
    update_shift: "Ubah Shift",
    deactivate_shift: "Nonaktifkan Shift",
    assign_shift: "Tugaskan Shift",
    assign_location: "Tugaskan Lokasi",
    approve_leave: "Setujui Izin/Cuti",
    reject_leave: "Tolak Izin/Cuti",
    cancel_leave: "Batalkan Izin/Cuti",
    export_report: "Ekspor Laporan",
    update_workspace_setting: "Ubah Pengaturan Workspace",
    update_role_permission: "Ubah Peran/Izin",
    unauthorized_cross_workspace_access_attempt: "Akses Lintas Workspace",
    failed_permission_check_for_sensitive_action: "Cek Izin Gagal",
  };
  return map[action] ?? action;
}

// ---------------------------------------------------------------------------
// Detail Panel
// ---------------------------------------------------------------------------

function DetailPanel({
  log,
  onClose,
}: {
  log: AuditLog | null;
  onClose: () => void;
}) {
  if (!log) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Detail Audit Log"
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-base font-semibold text-gray-900">Detail Audit Log</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Tutup panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 px-5 py-4 space-y-5 text-sm">
          <Row label="ID" value={log.id} mono />
          <Row label="Aksi" value={actionLabel(log.action)} />
          <Row label="Waktu" value={formatDateTime(log.createdAt)} />
          {log.actorName && <Row label="Aktor" value={`${log.actorName} (${log.actorEmail ?? ""})`} />}
          {log.actorUserId && !log.actorName && <Row label="Aktor ID" value={log.actorUserId} mono />}
          {log.entityType && <Row label="Entitas" value={log.entityType} />}
          {log.entityId && <Row label="Entitas ID" value={log.entityId} mono />}
          {log.ipAddress && <Row label="IP Address" value={log.ipAddress} mono />}
          {log.requestId && <Row label="Request ID" value={log.requestId} mono />}

          {log.oldValue != null && (
            <section>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Nilai Lama
              </p>
              <pre className="text-xs bg-gray-50 rounded-lg p-3 overflow-x-auto border border-gray-200 whitespace-pre-wrap break-all">
                {JSON.stringify(log.oldValue, null, 2)}
              </pre>
            </section>
          )}

          {log.newValue != null && (
            <section>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Nilai Baru
              </p>
              <pre className="text-xs bg-gray-50 rounded-lg p-3 overflow-x-auto border border-gray-200 whitespace-pre-wrap break-all">
                {JSON.stringify(log.newValue, null, 2)}
              </pre>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`text-sm text-gray-900 ${mono ? "font-mono break-all" : ""}`}>
        {value}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function AuditLogPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState(todayDateString());
  const [actorSearch, setActorSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 25,
    total: 0,
    total_pages: 1,
  });
  const [tablePagination, setTablePagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const api = createClientApiClient();
      const params: Record<string, string> = {
        page: String(tablePagination.pageIndex + 1),
        page_size: String(tablePagination.pageSize),
      };
      if (startDate) params["start_date"] = startDate;
      if (endDate) params["end_date"] = endDate;
      if (actorSearch) params["actor"] = actorSearch;
      if (actionFilter) params["action"] = actionFilter;

      const res = await api.get<PaginatedData<AuditLog>>("v1/audit-logs", params);
      if (res.success) {
        const payload = res.data;
        const arr = Array.isArray(payload)
          ? (payload as unknown as AuditLog[])
          : payload.data;
        const pag = Array.isArray(payload)
          ? { page: 1, page_size: arr.length, total: arr.length, total_pages: 1 }
          : payload.pagination;
        setLogs(arr);
        setPagination(pag);
      } else {
        setError(res.error.message ?? "Gagal memuat audit log.");
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, actorSearch, actionFilter, tablePagination.pageIndex, tablePagination.pageSize]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // ---------------------------------------------------------------------------
  // Table columns
  // ---------------------------------------------------------------------------

  const columns: ColumnDef<AuditLog>[] = [
    {
      id: "createdAt",
      header: "Waktu",
      cell: ({ row }) => (
        <span className="text-xs text-gray-500 tabular-nums whitespace-nowrap">
          {formatDateTime(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: "actor",
      header: "Aktor",
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">
          {row.original.actorName ?? row.original.actorUserId ?? "—"}
        </span>
      ),
    },
    {
      id: "action",
      header: "Aksi",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-gray-900">
          {actionLabel(row.original.action)}
        </span>
      ),
    },
    {
      id: "entity",
      header: "Entitas",
      cell: ({ row }) => (
        <span className="text-xs text-gray-500">
          {row.original.entityType
            ? `${row.original.entityType}${row.original.entityId ? ` #${row.original.entityId.slice(0, 8)}` : ""}`
            : "—"}
        </span>
      ),
    },
    {
      id: "ip",
      header: "IP",
      cell: ({ row }) => (
        <span className="text-xs font-mono text-gray-500">
          {row.original.ipAddress ?? "—"}
        </span>
      ),
    },
    {
      id: "detail",
      header: "",
      cell: ({ row }) => (
        <button
          onClick={() => setSelectedLog(row.original)}
          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium focus:outline-none focus:underline"
          aria-label={`Lihat detail log ${row.original.action}`}
        >
          <Eye className="w-3.5 h-3.5" />
          Detail
        </button>
      ),
    },
  ];

  const table = useReactTable({
    data: logs,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: pagination.total_pages,
    state: { pagination: tablePagination },
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater(tablePagination) : updater;
      setTablePagination(next);
    },
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Audit Log</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Riwayat aktivitas sensitif di workspace ini (read-only)
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-center bg-white border border-gray-200 rounded-xl p-4">
        {/* Start date */}
        <div className="relative flex items-center">
          <CalendarDays className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="date"
            value={startDate}
            max={endDate || todayDateString()}
            onChange={(e) => setStartDate(e.target.value)}
            className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Tanggal mulai"
          />
        </div>

        {/* End date */}
        <div className="relative flex items-center">
          <CalendarDays className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="date"
            value={endDate}
            max={todayDateString()}
            onChange={(e) => setEndDate(e.target.value)}
            className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Tanggal akhir"
          />
        </div>

        {/* Actor search */}
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input
            type="search"
            placeholder="Cari aktor..."
            value={actorSearch}
            onChange={(e) => setActorSearch(e.target.value)}
            className="pl-9"
            aria-label="Cari aktor"
          />
        </div>

        {/* Action filter */}
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input
            type="search"
            placeholder="Filter aksi..."
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="pl-9"
            aria-label="Filter aksi"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div role="alert" className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-800 rounded-lg px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="w-full overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left border-collapse min-w-[700px]" role="grid">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-gray-200 bg-gray-50">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    scope="col"
                    className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && logs.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                    <p className="text-sm">Memuat audit log...</p>
                  </div>
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <ClipboardList className="w-12 h-12 text-gray-300" />
                    <p className="text-sm font-medium">Tidak ada data audit log</p>
                    <p className="text-xs">Coba ubah filter atau rentang tanggal.</p>
                  </div>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                  onClick={() => setSelectedLog(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-sm whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-gray-500 px-1">
        <span>
          {pagination.total === 0
            ? "Tidak ada data"
            : `Menampilkan ${(pagination.page - 1) * pagination.page_size + 1}–${Math.min(
                pagination.page * pagination.page_size,
                pagination.total
              )} dari ${pagination.total} data`}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-1.5 rounded border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Halaman sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-1.5 rounded border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Halaman berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedLog && (
        <DetailPanel log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  );
}
