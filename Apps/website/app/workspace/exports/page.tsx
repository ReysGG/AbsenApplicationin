"use client";

/**
 * app/workspace/exports/page.tsx
 *
 * Halaman Export History — Client Component.
 *
 * Fitur:
 * - TanStack Table dengan server-side pagination
 * - List export jobs: tipe, format, status, jumlah baris, waktu, download
 * - Badge status (Queued/Processing/Completed/Failed/Expired)
 * - Tombol download (signed URL, hanya jika Completed + belum expired)
 * - Tombol retry jika status Failed
 * - Empty state aman (R19.9)
 * - Polling setiap 15 detik untuk update status job yang sedang berjalan
 *
 * Requirements: 12.8–12.12, 16.7, 17.6, 19.9
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type PaginationState,
} from "@tanstack/react-table";
import {
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileArchive,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from "lucide-react";

import { createClientApiClient } from "@/lib/apiClient";
import type { PaginatedData } from "@/lib/apiClient";
import { formatDateTime } from "@/lib/formatters";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ExportStatus = "Queued" | "Processing" | "Completed" | "Failed" | "Expired";
type ExportFormat = "XLSX" | "CSV" | "PDF";

interface ExportJob {
  id: string;
  reportType: string;
  format: ExportFormat;
  status: ExportStatus;
  rowCount: number | null;
  filtersJson: unknown;
  requestedAt: string;
  completedAt: string | null;
  errorMessage: string | null;
  signedUrl?: string | null;
  signedUrlExpiresAt?: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function reportTypeLabel(type: string): string {
  const map: Record<string, string> = {
    AttendanceSummary: "Ringkasan Kehadiran",
    DailyDetail: "Detail Harian",
    Late: "Karyawan Terlambat",
    MissingCheckout: "Lupa Absen Pulang",
    LeaveAndPermit: "Izin & Cuti",
    DepartmentAttendance: "Kehadiran per Departemen",
  };
  return map[type] ?? type;
}

function isExpiredUrl(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return true;
  return new Date(expiresAt) < new Date();
}

function hasActiveJobs(jobs: ExportJob[]): boolean {
  return jobs.some((j) => j.status === "Queued" || j.status === "Processing");
}

// ---------------------------------------------------------------------------
// Status Badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: ExportStatus }) {
  const config: Record<ExportStatus, { label: string; className: string; icon: React.ReactNode }> = {
    Queued: {
      label: "Antrian",
      className: "bg-gray-100 text-gray-600",
      icon: <Clock className="w-3 h-3" />,
    },
    Processing: {
      label: "Diproses",
      className: "bg-blue-100 text-blue-700",
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
    },
    Completed: {
      label: "Selesai",
      className: "bg-green-100 text-green-700",
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    Failed: {
      label: "Gagal",
      className: "bg-red-100 text-red-700",
      icon: <XCircle className="w-3 h-3" />,
    },
    Expired: {
      label: "Kedaluwarsa",
      className: "bg-amber-100 text-amber-700",
      icon: <Clock className="w-3 h-3" />,
    },
  };

  const { label, className, icon } = config[status] ?? {
    label: status,
    className: "bg-gray-100 text-gray-600",
    icon: null,
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>
      {icon}
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ExportsPage() {
  const [jobs, setJobs] = useState<ExportJob[]>([]);
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
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const api = createClientApiClient();
      const params: Record<string, string> = {
        page: String(tablePagination.pageIndex + 1),
        page_size: String(tablePagination.pageSize),
      };

      const res = await api.get<PaginatedData<ExportJob>>("v1/exports", params);
      if (res.success) {
        const payload = res.data;
        const arr = Array.isArray(payload)
          ? (payload as unknown as ExportJob[])
          : payload.data;
        const pag = Array.isArray(payload)
          ? { page: 1, page_size: arr.length, total: arr.length, total_pages: 1 }
          : payload.pagination;
        setJobs(arr);
        setPagination(pag);
        setLastUpdated(new Date());
      } else {
        setError(res.error.message ?? "Gagal memuat riwayat ekspor.");
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  }, [tablePagination.pageIndex, tablePagination.pageSize]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Poll setiap 15 detik jika ada job aktif
  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    if (hasActiveJobs(jobs)) {
      pollingRef.current = setInterval(() => {
        fetchJobs();
      }, 15000);
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [jobs, fetchJobs]);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  async function handleDownload(job: ExportJob) {
    // Fetch fresh signed URL from detail endpoint
    try {
      const api = createClientApiClient();
      const res = await api.get<ExportJob>(`v1/exports/${job.id}`);
      if (res.success && res.data.signedUrl) {
        window.open(res.data.signedUrl, "_blank", "noopener,noreferrer");
      } else {
        alert("URL unduhan tidak tersedia atau sudah kedaluwarsa.");
      }
    } catch {
      alert("Gagal mendapatkan URL unduhan.");
    }
  }

  // ---------------------------------------------------------------------------
  // Table columns
  // ---------------------------------------------------------------------------

  const columns: ColumnDef<ExportJob>[] = [
    {
      id: "reportType",
      header: "Tipe Laporan",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-gray-900">
          {reportTypeLabel(row.original.reportType)}
        </span>
      ),
    },
    {
      id: "format",
      header: "Format",
      cell: ({ row }) => (
        <span className="text-xs font-mono font-semibold text-gray-600">
          {row.original.format}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "rowCount",
      header: "Baris",
      cell: ({ row }) => (
        <span className="text-sm text-gray-600 tabular-nums">
          {row.original.rowCount != null
            ? row.original.rowCount.toLocaleString("id-ID")
            : "—"}
        </span>
      ),
    },
    {
      id: "requestedAt",
      header: "Diminta",
      cell: ({ row }) => (
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {formatDateTime(row.original.requestedAt)}
        </span>
      ),
    },
    {
      id: "completedAt",
      header: "Selesai",
      cell: ({ row }) => (
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {formatDateTime(row.original.completedAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const job = row.original;

        if (job.status === "Completed" && !isExpiredUrl(job.signedUrlExpiresAt)) {
          return (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDownload(job)}
              className="gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Unduh
            </Button>
          );
        }

        if (job.status === "Failed") {
          return (
            <span className="text-xs text-red-600 max-w-[160px] truncate" title={job.errorMessage ?? ""}>
              {job.errorMessage ?? "Gagal"}
            </span>
          );
        }

        if (job.status === "Expired") {
          return (
            <span className="text-xs text-amber-600">File dihapus</span>
          );
        }

        return null;
      },
    },
  ];

  const table = useReactTable({
    data: jobs,
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

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Riwayat Ekspor
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            File tersimpan selama 7 hari, riwayat selama 30 hari
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5 text-green-500" />
          )}
          <span>
            {lastUpdated
              ? `Diperbarui: ${lastUpdated.toLocaleTimeString("id-ID")}`
              : "Memuat..."}
          </span>
          <button
            onClick={() => fetchJobs()}
            disabled={loading}
            className="ml-1 p-1 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            aria-label="Perbarui daftar ekspor"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div role="alert" className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-800 rounded-lg px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Active jobs notice */}
      {hasActiveJobs(jobs) && (
        <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg px-4 py-3 text-sm">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>Ada ekspor yang sedang diproses. Halaman akan diperbarui otomatis.</span>
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
            {loading && jobs.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                    <p className="text-sm">Memuat riwayat ekspor...</p>
                  </div>
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <FileArchive className="w-12 h-12 text-gray-300" />
                    <p className="text-sm font-medium">Belum ada riwayat ekspor</p>
                    <p className="text-xs">Ekspor laporan dari halaman Laporan.</p>
                  </div>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-blue-50/40 transition-colors">
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
    </div>
  );
}
