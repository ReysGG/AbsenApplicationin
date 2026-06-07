"use client";

/**
 * app/workspace/reports/page.tsx
 *
 * Halaman Reports & Export History — Client Component.
 *
 * Tab 1: Laporan
 *   - Filter: tipe laporan, rentang tanggal, departemen, format (CSV/Excel)
 *   - Tombol "Pratinjau" → memanggil GET /api/v1/reports/attendance-summary
 *   - Kartu ringkasan + tabel sample rows (maks 10)
 *   - Tombol "Export {format}" → GET /api/v1/reports/export
 *     • sync (≤5000 baris)  : unduh file langsung
 *     • async (>5000 baris) : tampilkan toast
 *     • >50000              : tampilkan error
 *
 * Tab 2: Riwayat Export
 *   - GET /api/v1/exports — daftar ExportJob milik user
 *   - Badge status: Queued/Processing/Completed/Failed/Expired
 *   - Tombol Unduh (jika Completed + signedUrl)
 *   - Tombol "Perbarui Link" → GET /api/v1/exports/:id (regenerate signed URL)
 *   - Auto-refresh polling 15 detik jika ada job Queued/Processing
 *   - Empty state: "Belum ada riwayat export"
 *
 * Requirements: 12.3, 12.8, 12.11
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Download,
  RefreshCw,
  Eye,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  RotateCcw,
  ExternalLink,
} from "lucide-react";

import { createClientApiClient } from "@/lib/apiClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ReportType,
  ExportFormat,
  ExportStatus,
  ExportJob,
  AttendanceSummary,
  SampleRow,
} from "@/types/reports";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REPORT_TYPES: { value: ReportType; label: string; endpoint: string }[] = [
  {
    value: "AttendanceSummary",
    label: "Ringkasan Kehadiran",
    endpoint: "v1/reports/attendance-summary",
  },
  {
    value: "DailyDetail",
    label: "Detail Harian",
    endpoint: "v1/reports/daily-detail",
  },
  {
    value: "Late",
    label: "Karyawan Terlambat",
    endpoint: "v1/reports/late",
  },
  {
    value: "MissingCheckout",
    label: "Lupa Absen Pulang",
    endpoint: "v1/reports/missing-checkout",
  },
];

const REPORT_TYPE_ENDPOINT_MAP: Record<ReportType, string> = {
  AttendanceSummary: "v1/reports/attendance-summary",
  DailyDetail: "v1/reports/daily-detail",
  Late: "v1/reports/late",
  MissingCheckout: "v1/reports/missing-checkout",
  LeaveAndPermit: "v1/reports/leave",
  DepartmentAttendance: "v1/reports/department",
};

const STATUS_POLLING_INTERVAL = 15_000; // 15 seconds

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDefaultDateRange(): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 29); // last 30 days inclusive
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return iso;
  }
}

function reportTypeLabel(rt: string): string {
  return (
    REPORT_TYPES.find((r) => r.value === rt)?.label ?? rt
  );
}

// ---------------------------------------------------------------------------
// Export Status Badge
// ---------------------------------------------------------------------------

function ExportStatusBadge({ status }: { status: ExportStatus }) {
  const config: Record<
    ExportStatus,
    { label: string; className: string; icon: React.ReactNode }
  > = {
    Queued: {
      label: "Menunggu",
      className:
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-amber-100 text-amber-800",
      icon: <Clock className="w-3 h-3" />,
    },
    Processing: {
      label: "Memproses",
      className:
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-blue-100 text-blue-800",
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
    },
    Completed: {
      label: "Selesai",
      className:
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-green-100 text-green-800",
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    Failed: {
      label: "Gagal",
      className:
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-red-100 text-red-800",
      icon: <XCircle className="w-3 h-3" />,
    },
    Expired: {
      label: "Kedaluwarsa",
      className:
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-gray-100 text-gray-500",
      icon: <AlertTriangle className="w-3 h-3" />,
    },
  };

  const cfg = config[status] ?? {
    label: status,
    className:
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-gray-100 text-gray-600",
    icon: null,
  };

  return (
    <span className={cfg.className} aria-label={`Status: ${cfg.label}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Summary Cards
// ---------------------------------------------------------------------------

interface SummaryCardsProps {
  summary: AttendanceSummary["summary"];
}

function SummaryCards({ summary }: SummaryCardsProps) {
  const items = [
    {
      key: "total",
      label: "Total",
      value: summary.total,
      className: "text-on-surface",
      bg: "bg-surface-container",
    },
    {
      key: "present",
      label: "Hadir",
      value: summary.present,
      className: "text-green-700",
      bg: "bg-green-50",
    },
    {
      key: "late",
      label: "Terlambat",
      value: summary.late,
      className: "text-amber-700",
      bg: "bg-amber-50",
    },
    {
      key: "absent",
      label: "Tidak Hadir",
      value: summary.absent,
      className: "text-red-700",
      bg: "bg-red-50",
    },
    {
      key: "leave",
      label: "Izin/Cuti",
      value: summary.leave,
      className: "text-blue-700",
      bg: "bg-blue-50",
    },
    {
      key: "missingCheckout",
      label: "Belum Pulang",
      value: summary.missingCheckout,
      className: "text-purple-700",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map((item) => (
        <div
          key={item.key}
          className={`${item.bg} border border-outline-variant rounded-xl p-3 text-center`}
        >
          <p className={`text-xl font-bold ${item.className}`}>{item.value}</p>
          <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sample Rows Table
// ---------------------------------------------------------------------------

interface SampleTableProps {
  rows: SampleRow[];
  totalRows: number;
}

function SampleTable({ rows, totalRows }: SampleTableProps) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant">
        <FileText className="w-10 h-10 mb-3 opacity-30" aria-hidden="true" />
        <p className="text-sm font-medium">Tidak ada data untuk filter ini</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-outline-variant">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container/60 border-b border-outline-variant text-[11px] font-bold text-on-surface-variant tracking-wider uppercase">
              <th className="py-2.5 px-3">Nama</th>
              <th className="py-2.5 px-3">Divisi</th>
              <th className="py-2.5 px-3">Tanggal</th>
              <th className="py-2.5 px-3">Shift</th>
              <th className="py-2.5 px-3">Check-in</th>
              <th className="py-2.5 px-3">Check-out</th>
              <th className="py-2.5 px-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/60">
            {rows.slice(0, 10).map((row, idx) => (
              <tr
                key={`${row.employeeCode}-${row.date}-${idx}`}
                className="text-xs hover:bg-surface-container-low/20 transition-colors"
              >
                <td className="py-2.5 px-3 font-semibold text-on-surface">
                  <div>
                    <p>{row.employeeName}</p>
                    <p className="text-[10px] font-mono text-on-surface-variant">
                      {row.employeeCode}
                    </p>
                  </div>
                </td>
                <td className="py-2.5 px-3 text-on-surface-variant">
                  {row.departmentName || "—"}
                </td>
                <td className="py-2.5 px-3">{formatDate(row.date)}</td>
                <td className="py-2.5 px-3 text-on-surface-variant">
                  {row.shiftName || "—"}
                </td>
                <td className="py-2.5 px-3 font-mono">
                  {row.checkIn || "—"}
                </td>
                <td className="py-2.5 px-3 font-mono">
                  {row.checkOut || "—"}
                </td>
                <td className="py-2.5 px-3">
                  <AttendanceStatusBadge status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-on-surface-variant mt-2 pl-1">
        Total{" "}
        <span className="font-semibold text-on-surface">{totalRows}</span> baris
        data tersedia
        {totalRows > 10 && " (menampilkan 10 baris pertama)"}
      </p>
    </div>
  );
}

function AttendanceStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Present:
      "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold border-transparent bg-green-100 text-green-800",
    Late: "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold border-transparent bg-amber-100 text-amber-800",
    Absent:
      "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold border-transparent bg-red-100 text-red-800",
    Leave:
      "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold border-transparent bg-blue-100 text-blue-800",
    MissingCheckout:
      "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold border-transparent bg-purple-100 text-purple-800",
    PendingCheckout:
      "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold border-transparent bg-gray-100 text-gray-600",
    Invalid:
      "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold border-gray-300 bg-gray-50 text-gray-500",
  };

  const className =
    map[status] ??
    "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold border-gray-200 bg-gray-100 text-gray-600";

  return <span className={className}>{status || "—"}</span>;
}

// ---------------------------------------------------------------------------
// Toast / Alert banner (inline)
// ---------------------------------------------------------------------------

type ToastType = "success" | "error" | "info";

interface ToastBannerProps {
  type: ToastType;
  message: string;
  onDismiss: () => void;
}

function ToastBanner({ type, message, onDismiss }: ToastBannerProps) {
  const config: Record<ToastType, string> = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 border rounded-xl px-4 py-3 text-sm ${config[type]}`}
    >
      <span className="flex-1">{message}</span>
      <button
        onClick={onDismiss}
        className="shrink-0 opacity-60 hover:opacity-100 focus:outline-none"
        aria-label="Tutup notifikasi"
      >
        ×
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 1: Laporan
// ---------------------------------------------------------------------------

function LaporanTab() {
  const defaults = getDefaultDateRange();
  const [reportType, setReportType] = useState<ReportType>("AttendanceSummary");
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate] = useState(defaults.end);
  const [department, setDepartment] = useState("");
  const [format, setFormat] = useState<ExportFormat>("xlsx");

  const [previewData, setPreviewData] = useState<AttendanceSummary | null>(
    null
  );
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [exportLoading, setExportLoading] = useState(false);
  const [toast, setToast] = useState<{
    type: ToastType;
    message: string;
  } | null>(null);

  function dismissToast() {
    setToast(null);
  }

  // Build filter params
  function buildParams(): Record<string, string> {
    const p: Record<string, string> = {
      start_date: startDate,
      end_date: endDate,
      format,
    };
    if (department) p.department_id = department;
    return p;
  }

  // Preview handler
  async function handlePreview() {
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewData(null);
    setToast(null);

    const api = createClientApiClient();
    const endpoint = REPORT_TYPE_ENDPOINT_MAP[reportType];

    try {
      const res = await api.get<AttendanceSummary>(endpoint, buildParams());
      if (res.success) {
        // Normalize response — backend may return flat data or nested AttendanceSummary shape
        const raw = res.data as unknown;
        const normalised = normalisePreviewResponse(raw);
        setPreviewData(normalised);
      } else {
        setPreviewError(
          (res as { success: false; error: { message: string } }).error
            .message ?? "Gagal memuat pratinjau."
        );
      }
    } catch {
      setPreviewError("Terjadi kesalahan jaringan. Coba lagi.");
    } finally {
      setPreviewLoading(false);
    }
  }

  // Export handler
  async function handleExport() {
    setExportLoading(true);
    setToast(null);

    try {
      const params = buildParams();

      // Use native fetch so we can handle blob downloads
      const query = new URLSearchParams(params).toString();
      const url = `/api/v1/reports/export?${query}`;

      const resp = await fetch(url, { method: "GET" });

      if (resp.status === 400 || resp.status === 422) {
        // Likely >50000 rows rejection
        const json = (await resp.json()) as {
          error?: { message?: string };
        };
        const msg =
          json.error?.message ?? "Terlalu banyak data. Persempit filter.";
        setToast({ type: "error", message: msg });
        return;
      }

      if (!resp.ok) {
        const json = (await resp.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        const msg = json.error?.message ?? "Gagal mengekspor laporan.";
        setToast({ type: "error", message: msg });
        return;
      }

      const contentType = resp.headers.get("content-type") ?? "";
      const disposition = resp.headers.get("content-disposition") ?? "";

      // Async job response: JSON with ExportJob
      if (contentType.includes("application/json")) {
        setToast({
          type: "info",
          message:
            "Export sedang diproses. Lihat Riwayat Export untuk mengunduh.",
        });
        return;
      }

      // Sync response: binary file
      const blob = await resp.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;

      // Extract filename from Content-Disposition header
      const filenameMatch = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      anchor.download = filenameMatch?.[1]?.replace(/['"]/g, "") ??
        `laporan-${reportType.toLowerCase()}-${startDate}.${format}`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(objectUrl);

      setToast({ type: "success", message: "File berhasil diunduh." });
    } catch {
      setToast({ type: "error", message: "Terjadi kesalahan saat mengekspor." });
    } finally {
      setExportLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Filter Bar */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 space-y-4">
        <h3 className="text-sm font-semibold text-on-surface">Filter Laporan</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Report Type */}
          <div className="space-y-1.5">
            <label
              htmlFor="report-type-select"
              className="text-xs font-semibold text-on-surface-variant"
            >
              Tipe Laporan
            </label>
            <Select
              value={reportType}
              onValueChange={(v) => {
                setReportType(v as ReportType);
                setPreviewData(null);
              }}
            >
              <SelectTrigger id="report-type-select" className="text-xs h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((rt) => (
                  <SelectItem key={rt.value} value={rt.value}>
                    {rt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div className="space-y-1.5">
            <label
              htmlFor="report-start-date"
              className="text-xs font-semibold text-on-surface-variant"
            >
              Dari Tanggal
            </label>
            <Input
              id="report-start-date"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPreviewData(null);
              }}
              className="text-xs h-9"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1.5">
            <label
              htmlFor="report-end-date"
              className="text-xs font-semibold text-on-surface-variant"
            >
              Sampai Tanggal
            </label>
            <Input
              id="report-end-date"
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPreviewData(null);
              }}
              className="text-xs h-9"
            />
          </div>

          {/* Format */}
          <div className="space-y-1.5">
            <label
              htmlFor="report-format-select"
              className="text-xs font-semibold text-on-surface-variant"
            >
              Format
            </label>
            <Select
              value={format}
              onValueChange={(v) => setFormat(v as ExportFormat)}
            >
              <SelectTrigger id="report-format-select" className="text-xs h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                <SelectItem value="csv">CSV (.csv)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <Button
            onClick={handlePreview}
            disabled={previewLoading || !startDate || !endDate}
            variant="outline"
            className="gap-2"
          >
            {previewLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            {previewLoading ? "Memuat..." : "Pratinjau"}
          </Button>

          <Button
            onClick={handleExport}
            disabled={exportLoading || !startDate || !endDate}
            className="gap-2"
          >
            {exportLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {exportLoading
              ? "Mengekspor..."
              : `Export ${format.toUpperCase()}`}
          </Button>
        </div>
      </div>

      {/* Toast / Alert */}
      {toast && (
        <ToastBanner
          type={toast.type}
          message={toast.message}
          onDismiss={dismissToast}
        />
      )}

      {/* Preview Error */}
      {previewError && (
        <div
          role="alert"
          className="flex items-start gap-3 border border-red-200 bg-red-50 rounded-xl px-4 py-3 text-sm text-red-800"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          {previewError}
        </div>
      )}

      {/* Preview Results */}
      {previewData && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-on-surface">
              Pratinjau —{" "}
              {REPORT_TYPES.find((r) => r.value === reportType)?.label ??
                reportType}
            </h3>
            <span className="text-[11px] text-on-surface-variant">
              {formatDate(startDate)} s/d {formatDate(endDate)}
            </span>
          </div>

          <SummaryCards summary={previewData.summary} />

          <SampleTable
            rows={previewData.sampleRows}
            totalRows={previewData.totalRows}
          />
        </div>
      )}

      {/* Initial state — no preview yet */}
      {!previewData && !previewLoading && !previewError && (
        <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant bg-surface-container-lowest border border-outline-variant border-dashed rounded-2xl">
          <Eye
            className="w-10 h-10 mb-3 opacity-20"
            aria-hidden="true"
          />
          <p className="text-sm font-medium">
            Atur filter lalu klik &ldquo;Pratinjau&rdquo; untuk melihat data
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2: Riwayat Export
// ---------------------------------------------------------------------------

function RiwayatExportTab() {
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchJobs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    const api = createClientApiClient();
    try {
      const res = await api.get<ExportJob[]>("v1/exports");
      if (res.success) {
        const raw = res.data as unknown;
        const list = normaliseExportJobList(raw);
        setJobs(list);
      } else {
        if (!silent) {
          setError(
            (res as { success: false; error: { message: string } }).error
              .message ?? "Gagal memuat riwayat export."
          );
        }
      }
    } catch {
      if (!silent) setError("Terjadi kesalahan jaringan. Coba lagi.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Polling: active when there are Queued or Processing jobs
  useEffect(() => {
    const hasActiveJobs = jobs.some(
      (j) => j.status === "Queued" || j.status === "Processing"
    );

    if (hasActiveJobs) {
      pollingRef.current = setInterval(() => {
        fetchJobs(true);
      }, STATUS_POLLING_INTERVAL);
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [jobs, fetchJobs]);

  async function handleRefreshLink(jobId: string) {
    setRefreshingId(jobId);
    const api = createClientApiClient();
    try {
      const res = await api.get<ExportJob>(`v1/exports/${jobId}`);
      if (res.success) {
        const updated = res.data as ExportJob;
        setJobs((prev) =>
          prev.map((j) =>
            j.id === jobId ? { ...j, ...updated } : j
          )
        );
      }
    } catch {
      // silent fail — user can retry
    } finally {
      setRefreshingId(null);
    }
  }

  function handleDownload(signedUrl: string) {
    window.open(signedUrl, "_blank", "noopener,noreferrer");
  }

  const hasActiveJobs = jobs.some(
    (j) => j.status === "Queued" || j.status === "Processing"
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-on-surface-variant">
            Daftar permintaan export Anda. File tersedia selama 7 hari.
          </p>
          {hasActiveJobs && (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-blue-700 font-medium mt-1">
              <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
              Memperbarui otomatis setiap 15 detik
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchJobs()}
          disabled={loading}
          className="gap-1.5 text-xs"
          aria-label="Muat ulang riwayat export"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Muat Ulang
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 border border-red-200 bg-red-50 rounded-xl px-4 py-3 text-sm text-red-800"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && jobs.length === 0 && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 bg-surface-container animate-pulse rounded-xl"
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && jobs.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant bg-surface-container-lowest border border-outline-variant border-dashed rounded-2xl">
          <FileText
            className="w-10 h-10 mb-3 opacity-20"
            aria-hidden="true"
          />
          <p className="text-sm font-medium">Belum ada riwayat export</p>
        </div>
      )}

      {/* Jobs table */}
      {jobs.length > 0 && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container/60 border-b border-outline-variant text-[11px] font-bold text-on-surface-variant tracking-wider uppercase">
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4">Tipe Laporan</th>
                  <th className="py-3 px-4">Tanggal Request</th>
                  <th className="py-3 px-4">Jumlah Baris</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Unduh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60">
                {jobs.map((job) => {
                  const canDownload =
                    job.status === "Completed" && !!job.signedUrl;
                  const isRefreshing = refreshingId === job.id;

                  return (
                    <tr
                      key={job.id}
                      className="text-xs hover:bg-surface-container-low/20 transition-colors"
                    >
                      {/* Format */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center rounded border border-outline-variant px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">
                          {job.format}
                        </span>
                      </td>

                      {/* Report Type */}
                      <td className="py-3 px-4 font-medium text-on-surface">
                        {reportTypeLabel(job.reportType)}
                      </td>

                      {/* Requested At */}
                      <td className="py-3 px-4 text-on-surface-variant">
                        {formatDateTime(job.requestedAt)}
                      </td>

                      {/* Row Count */}
                      <td className="py-3 px-4 text-on-surface-variant font-mono">
                        {job.rowCount != null
                          ? job.rowCount.toLocaleString("id-ID")
                          : "—"}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <ExportStatusBadge status={job.status} />
                          {job.status === "Failed" && job.errorMessage && (
                            <p
                              className="text-[10px] text-red-600 max-w-[180px] truncate"
                              title={job.errorMessage}
                            >
                              {job.errorMessage}
                            </p>
                          )}
                          {job.status === "Completed" && job.completedAt && (
                            <p className="text-[10px] text-on-surface-variant">
                              Selesai: {formatDateTime(job.completedAt)}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* Download */}
                          <Button
                            size="sm"
                            variant={canDownload ? "default" : "outline"}
                            disabled={!canDownload}
                            onClick={() =>
                              canDownload && handleDownload(job.signedUrl!)
                            }
                            className="gap-1.5 text-xs h-7 px-2.5"
                            aria-label={
                              canDownload
                                ? `Unduh file ${job.format.toUpperCase()} laporan ${reportTypeLabel(job.reportType)}`
                                : "Unduh tidak tersedia"
                            }
                          >
                            <ExternalLink className="w-3 h-3" />
                            Unduh
                          </Button>

                          {/* Refresh signed URL */}
                          {job.status === "Completed" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRefreshLink(job.id)}
                              disabled={isRefreshing}
                              className="gap-1.5 text-xs h-7 px-2.5"
                              aria-label={`Perbarui link unduhan untuk job ${job.id}`}
                            >
                              {isRefreshing ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <RotateCcw className="w-3 h-3" />
                              )}
                              Perbarui Link
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Normalisation helpers (backend may return different shapes)
// ---------------------------------------------------------------------------

function normalisePreviewResponse(raw: unknown): AttendanceSummary {
  if (raw == null) {
    return {
      summary: {
        total: 0,
        present: 0,
        late: 0,
        absent: 0,
        leave: 0,
        missingCheckout: 0,
      },
      sampleRows: [],
      totalRows: 0,
    };
  }

  const r = raw as Record<string, unknown>;

  // Already AttendanceSummary shape
  if (r.summary && typeof r.summary === "object" && r.sampleRows !== undefined) {
    return raw as AttendanceSummary;
  }

  // Backend returns { data: SampleRow[], pagination: {...}, summary: {...} }
  const summary = (r.summary as AttendanceSummary["summary"]) ?? {
    total: 0,
    present: 0,
    late: 0,
    absent: 0,
    leave: 0,
    missingCheckout: 0,
  };

  const paginationData = r.pagination as
    | { total?: number }
    | undefined;

  let sampleRows: SampleRow[] = [];
  if (Array.isArray(r.data)) {
    sampleRows = r.data as SampleRow[];
  } else if (Array.isArray(r.sampleRows)) {
    sampleRows = r.sampleRows as SampleRow[];
  }

  const totalRows =
    (paginationData?.total as number | undefined) ??
    (r.totalRows as number | undefined) ??
    sampleRows.length;

  return { summary, sampleRows, totalRows };
}

function normaliseExportJobList(raw: unknown): ExportJob[] {
  if (Array.isArray(raw)) return raw as ExportJob[];
  const r = raw as Record<string, unknown> | null;
  if (r && Array.isArray(r.data)) return r.data as ExportJob[];
  return [];
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

type Tab = "laporan" | "riwayat";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("laporan");

  const tabs: { id: Tab; label: string }[] = [
    { id: "laporan", label: "Laporan" },
    { id: "riwayat", label: "Riwayat Export" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
        <h2 className="font-title-xxl text-primary font-bold tracking-tight">
          Laporan &amp; Export
        </h2>
        <p className="text-xs text-on-surface-variant font-medium mt-0.5">
          Buat pratinjau laporan, ekspor data kehadiran, dan pantau status
          ekspor.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-outline-variant">
        <div className="flex gap-2 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2.5 px-4 font-semibold text-xs border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
              aria-selected={activeTab === tab.id}
              role="tab"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div role="tabpanel">
        {activeTab === "laporan" && <LaporanTab />}
        {activeTab === "riwayat" && <RiwayatExportTab />}
      </div>
    </div>
  );
}
