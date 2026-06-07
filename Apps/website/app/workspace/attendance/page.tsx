"use client";

/**
 * app/workspace/attendance/page.tsx
 *
 * Halaman Live Attendance — Client Component.
 *
 * Fitur:
 * - Filter bar: tanggal, status, departemen, shift, pencarian teks
 * - Filter pre-populasi dari URL searchParams (?status=Late&date=...) (R6.4)
 * - TanStack Table dengan server-side pagination (R16.4, R16.7)
 * - Kolom: Nama+Kode, Departemen, Shift, Check-in, Check-out, Lokasi, Mode,
 *           Face, Geofence, Status, Aksi
 * - Polling otomatis setiap 10 detik (R6.2)
 * - Indikator polling (timestamp terakhir diperbarui)
 * - Panel detail (slide-in/dialog) dengan informasi lengkap: face, geofence,
 *   spoofing, sync status, isDuplicate, notes, form catatan admin (R6.6, R6.7)
 * - Empty state: "Tidak ada data absensi" dengan ikon (R19.9)
 * - Status badge teks + warna (R19.5)
 *
 * Requirements: 6.1, 6.2, 6.4, 16.4, 19.5
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  Suspense,
} from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type PaginationState,
} from "@tanstack/react-table";
import { useSearchParams } from "next/navigation";
import {
  CalendarDays,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Clock,
  User,
  MapPin,
  ShieldCheck,
  ShieldX,
  Eye,
  X,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MinusCircle,
  CloudUpload,
  ClockIcon,
  Loader2,
  CalendarSearch,
  ScanFace,
  Navigation,
  ClipboardEdit,
} from "lucide-react";

import { createClientApiClient } from "@/lib/apiClient";
import type { PaginatedData } from "@/lib/apiClient";
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
  AttendanceRecord,
  AttendanceFilters,
  AttendanceStatus,
  DepartmentOption,
  ShiftOption,
} from "@/types/attendance";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayDateString(): string {
  return new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return iso;
  }
}

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return iso;
  }
}

function formatLastUpdated(date: Date | null): string {
  if (!date) return "—";
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

// ---------------------------------------------------------------------------
// Status Badge (R19.5 — text + color, not color-only)
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: AttendanceStatus }) {
  const config: Record<
    AttendanceStatus,
    { label: string; className: string }
  > = {
    Present: {
      label: "Hadir",
      className:
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-green-100 text-green-800",
    },
    Late: {
      label: "Terlambat",
      className:
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-orange-100 text-orange-800",
    },
    Absent: {
      label: "Tidak Hadir",
      className:
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-red-100 text-red-800",
    },
    PendingCheckout: {
      label: "Belum Pulang",
      className:
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-gray-100 text-gray-600",
    },
    MissingCheckout: {
      label: "Lupa Absen Pulang",
      className:
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-amber-100 text-amber-800",
    },
    Leave: {
      label: "Izin/Cuti",
      className:
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-purple-100 text-purple-800",
    },
    Invalid: {
      label: "Tidak Valid",
      className:
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-destructive bg-red-600 text-white",
    },
  };

  const { label, className } = config[status] ?? {
    label: status,
    className:
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-gray-100 text-gray-600",
  };

  return <span className={className}>{label}</span>;
}

// ---------------------------------------------------------------------------
// Face / Geofence / Spoofing indicator (R19.5 — dot + text)
// ---------------------------------------------------------------------------

function FaceStatusIndicator({
  status,
}: {
  status: string | null;
}) {
  if (!status) return <span className="text-gray-400 text-xs">—</span>;

  const lower = status.toLowerCase();
  if (lower === "passed" || lower === "verified") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium">
        <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" aria-hidden="true" />
        Lulus
      </span>
    );
  }
  if (lower === "failed") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-red-700 font-medium">
        <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" aria-hidden="true" />
        Gagal
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-500 font-medium">
      <span className="w-2 h-2 rounded-full bg-gray-300 shrink-0" aria-hidden="true" />
      Dilewati
    </span>
  );
}

function GeofenceStatusIndicator({ status }: { status: string | null }) {
  if (!status) return <span className="text-gray-400 text-xs">—</span>;

  const lower = status.toLowerCase();
  if (lower === "valid" || lower === "inside") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium">
        <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" aria-hidden="true" />
        Valid
      </span>
    );
  }
  if (lower === "outside" || lower === "invalid") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-red-700 font-medium">
        <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" aria-hidden="true" />
        Di Luar
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-500 font-medium">
      <span className="w-2 h-2 rounded-full bg-gray-300 shrink-0" aria-hidden="true" />
      {status}
    </span>
  );
}

function SpoofingStatusIndicator({ status }: { status: string | null }) {
  if (!status) return <span className="text-gray-400 text-xs">—</span>;

  const lower = status.toLowerCase();
  if (lower === "clean") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium">
        <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" aria-hidden="true" />
        Bersih
      </span>
    );
  }
  if (lower === "detected") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-red-700 font-medium">
        <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" aria-hidden="true" />
        Terdeteksi
      </span>
    );
  }
  if (lower === "suspected") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-amber-700 font-medium">
        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" aria-hidden="true" />
        Dicurigai
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-500 font-medium">
      <span className="w-2 h-2 rounded-full bg-gray-300 shrink-0" aria-hidden="true" />
      {status}
    </span>
  );
}

function SyncStatusIndicator({ status }: { status: string }) {
  const lower = (status ?? "").toLowerCase();
  if (lower === "synced") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium">
        <CloudUpload className="w-3.5 h-3.5" aria-hidden="true" />
        Tersinkron
      </span>
    );
  }
  if (lower === "syncedlate" || lower === "synced_late") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-amber-700 font-medium">
        <CloudUpload className="w-3.5 h-3.5" aria-hidden="true" />
        Terlambat Sync
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-500 font-medium">
      <ClockIcon className="w-3.5 h-3.5" aria-hidden="true" />
      Menunggu
    </span>
  );
}

function WorkModeLabel({ mode }: { mode: string | null }) {
  if (!mode) return <span className="text-gray-400 text-xs">—</span>;
  const map: Record<string, string> = {
    WFO: "Kantor",
    WFH: "WFH",
    Hybrid: "Hybrid",
  };
  return (
    <span className="text-xs font-medium text-gray-700">
      {map[mode] ?? mode}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Detail Panel
// ---------------------------------------------------------------------------

interface DetailPanelProps {
  record: AttendanceRecord | null;
  onClose: () => void;
}

function DetailPanel({ record, onClose }: DetailPanelProps) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (record) {
      setNote(record.notes ?? "");
      setSaveError(null);
      setSaveSuccess(false);
    }
  }, [record]);

  if (!record) return null;

  const showSyncNote =
    record.originalCheckInAt &&
    record.checkInAt &&
    record.originalCheckInAt !== record.checkInAt;

  async function handleSaveNote() {
    if (!record) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const api = createClientApiClient();
      const res = await api.post(`v1/attendance/${record.id}/adjustment-note`, {
        note,
      });
      if (res.success) {
        setSaveSuccess(true);
      } else {
        setSaveError(res.error.message ?? "Gagal menyimpan catatan.");
      }
    } catch {
      setSaveError("Terjadi kesalahan jaringan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={`Detail absensi ${record.employeeName}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-base font-semibold text-gray-900">
            Detail Absensi
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Tutup panel detail"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 px-5 py-4 space-y-5">
          {/* Employee Info */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Karyawan
            </h3>
            <div className="space-y-1.5">
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {record.employeeName}
                  </p>
                  <p className="text-xs text-gray-500 font-mono">
                    {record.employeeCode}
                  </p>
                </div>
              </div>
              {record.departmentName && (
                <p className="text-sm text-gray-700 ml-6">
                  {record.departmentName}
                </p>
              )}
              {record.shiftName && (
                <p className="text-sm text-gray-700 ml-6">
                  Shift: {record.shiftName}
                </p>
              )}
            </div>
          </section>

          {/* Check-in / Check-out */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Waktu Kehadiran
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                <div>
                  <span className="text-xs text-gray-500">Check-in:</span>{" "}
                  <span className="text-sm font-medium text-gray-900">
                    {formatDateTime(record.checkInAt)}
                  </span>
                  {showSyncNote && (
                    <p className="text-xs text-amber-600 mt-0.5">
                      Waktu asli: {formatDateTime(record.originalCheckInAt)} — disinkronkan
                      {record.syncedAt
                        ? ` pada ${formatDateTime(record.syncedAt)}`
                        : ""}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                <div>
                  <span className="text-xs text-gray-500">Check-out:</span>{" "}
                  <span className="text-sm font-medium text-gray-900">
                    {formatDateTime(record.checkOutAt)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-xs text-gray-500">Tanggal:</span>{" "}
                <span className="text-sm font-medium text-gray-900">
                  {record.attendanceDate}
                </span>
              </div>
            </div>
          </section>

          {/* Location & Work Mode */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Lokasi & Mode Kerja
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-700">
                  {record.locationName ?? "—"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-gray-400 shrink-0" />
                <WorkModeLabel mode={record.workMode} />
              </div>
            </div>
          </section>

          {/* Verification Statuses */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Verifikasi
            </h3>
            <div className="space-y-2 bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ScanFace className="w-4 h-4 text-gray-400" aria-hidden="true" />
                  <span className="text-xs text-gray-600">Verifikasi Wajah</span>
                </div>
                <FaceStatusIndicator status={record.faceCheckStatus} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-gray-400" aria-hidden="true" />
                  <span className="text-xs text-gray-600">Geofence</span>
                </div>
                <GeofenceStatusIndicator status={record.geofenceStatus} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-gray-400" aria-hidden="true" />
                  <span className="text-xs text-gray-600">Spoofing</span>
                </div>
                <SpoofingStatusIndicator status={record.spoofingStatus} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <CloudUpload className="w-4 h-4 text-gray-400" aria-hidden="true" />
                  <span className="text-xs text-gray-600">Status Sinkron</span>
                </div>
                <SyncStatusIndicator status={record.syncStatus} />
              </div>
            </div>
          </section>

          {/* Duplicate warning */}
          {record.isDuplicate && (
            <div
              role="alert"
              className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 font-medium">
                Absensi duplikat terdeteksi — data ini mungkin merupakan percobaan ganda.
              </p>
            </div>
          )}

          {/* Status */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Status Absensi
            </h3>
            <StatusBadge status={record.status} />
          </section>

          {/* Admin Note */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <ClipboardEdit className="w-3.5 h-3.5" aria-hidden="true" />
              Catatan Admin
            </h3>
            <div className="space-y-2">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Tambahkan catatan admin..."
                rows={3}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
                aria-label="Catatan admin untuk absensi ini"
              />
              {saveError && (
                <p className="text-xs text-red-600" role="alert">
                  {saveError}
                </p>
              )}
              {saveSuccess && (
                <p className="text-xs text-green-700 font-medium" role="status">
                  Catatan berhasil disimpan.
                </p>
              )}
              <Button
                onClick={handleSaveNote}
                disabled={saving}
                size="sm"
                className="w-full"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Catatan"
                )}
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inner page (uses useSearchParams — must be wrapped in Suspense)
// ---------------------------------------------------------------------------

function AttendancePageInner() {
  const searchParams = useSearchParams();

  // Pre-populate from URL params (R6.4)
  const initialStatus =
    (searchParams.get("status") as AttendanceStatus | null) ?? "";
  const initialDate = searchParams.get("date") ?? todayDateString();

  const [filters, setFilters] = useState<AttendanceFilters>({
    date: initialDate,
    status: initialStatus,
    departmentId: "",
    shiftId: "",
    search: "",
    page: 1,
    pageSize: 25,
  });

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 25,
    total: 0,
    total_pages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Reference data for filter selects
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [shifts, setShifts] = useState<ShiftOption[]>([]);

  // Detail panel
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(
    null
  );

  // TanStack Table pagination state
  const [tablePagination, setTablePagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });

  // ---------------------------------------------------------------------------
  // Fetch reference data (departments, shifts) on mount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const api = createClientApiClient();
    Promise.allSettled([
      api.get<{ data: DepartmentOption[] }>("v1/departments", { status: "Active" }),
      api.get<{ data: ShiftOption[] }>("v1/shifts", { status: "Active" }),
    ]).then(([deptRes, shiftRes]) => {
      if (deptRes.status === "fulfilled" && deptRes.value.success) {
        const payload = deptRes.value.data as unknown;
        const arr = Array.isArray(payload)
          ? (payload as DepartmentOption[])
          : ((payload as { data?: DepartmentOption[] }).data ?? []);
        setDepartments(arr);
      }
      if (shiftRes.status === "fulfilled" && shiftRes.value.success) {
        const payload = shiftRes.value.data as unknown;
        const arr = Array.isArray(payload)
          ? (payload as ShiftOption[])
          : ((payload as { data?: ShiftOption[] }).data ?? []);
        setShifts(arr);
      }
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Fetch attendance data
  // ---------------------------------------------------------------------------

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const api = createClientApiClient();
      const params: Record<string, string> = {
        date: filters.date,
        page: String(filters.page),
        page_size: String(filters.pageSize),
      };
      if (filters.status) params.status = filters.status;
      if (filters.departmentId) params.department_id = filters.departmentId;
      if (filters.shiftId) params.shift_id = filters.shiftId;
      if (filters.search) params.search = filters.search;

      const res = await api.get<PaginatedData<AttendanceRecord>>(
        "v1/attendance",
        params
      );
      if (res.success) {
        const paginatedData = res.data;
        setRecords(paginatedData.data);
        setPagination(paginatedData.pagination);
        setLastUpdated(new Date());
      } else {
        setError(res.error.message ?? "Gagal memuat data absensi.");
        setRecords([]);
      }
    } catch {
      setError("Terjadi kesalahan jaringan. Coba lagi.");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Initial fetch + refetch when filters change
  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // Polling 10 seconds (R6.2)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAttendance();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchAttendance]);

  // ---------------------------------------------------------------------------
  // TanStack Table columns
  // ---------------------------------------------------------------------------

  const columns: ColumnDef<AttendanceRecord>[] = [
    {
      id: "employee",
      header: "Karyawan",
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-semibold text-gray-900 leading-tight">
            {row.original.employeeName}
          </p>
          <p className="text-xs font-mono text-gray-500 mt-0.5">
            {row.original.employeeCode}
          </p>
        </div>
      ),
    },
    {
      id: "department",
      header: "Departemen",
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">
          {row.original.departmentName ?? "—"}
        </span>
      ),
    },
    {
      id: "shift",
      header: "Shift",
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">
          {row.original.shiftName ?? "—"}
        </span>
      ),
    },
    {
      id: "checkIn",
      header: "Check-in",
      cell: ({ row }) => (
        <span className="text-sm text-gray-900 tabular-nums">
          {formatTime(row.original.checkInAt)}
        </span>
      ),
    },
    {
      id: "checkOut",
      header: "Check-out",
      cell: ({ row }) => (
        <span className="text-sm text-gray-900 tabular-nums">
          {formatTime(row.original.checkOutAt)}
        </span>
      ),
    },
    {
      id: "location",
      header: "Lokasi",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" aria-hidden="true" />
          <span className="text-sm text-gray-700">
            {row.original.locationName ?? "—"}
          </span>
        </div>
      ),
    },
    {
      id: "workMode",
      header: "Mode",
      cell: ({ row }) => <WorkModeLabel mode={row.original.workMode} />,
    },
    {
      id: "face",
      header: "Face",
      cell: ({ row }) => (
        <FaceStatusIndicator status={row.original.faceCheckStatus} />
      ),
    },
    {
      id: "geofence",
      header: "Geofence",
      cell: ({ row }) => (
        <GeofenceStatusIndicator status={row.original.geofenceStatus} />
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "action",
      header: "Aksi",
      cell: ({ row }) => (
        <button
          onClick={() => setSelectedRecord(row.original)}
          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium focus:outline-none focus:underline"
          aria-label={`Lihat detail absensi ${row.original.employeeName}`}
        >
          <Eye className="w-3.5 h-3.5" aria-hidden="true" />
          Detail
        </button>
      ),
    },
  ];

  const table = useReactTable({
    data: records,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: pagination.total_pages,
    state: {
      pagination: tablePagination,
    },
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(tablePagination) : updater;
      setTablePagination(next);
      setFilters((prev) => ({
        ...prev,
        page: next.pageIndex + 1,
        pageSize: next.pageSize,
      }));
    },
  });

  // ---------------------------------------------------------------------------
  // Filter helpers
  // ---------------------------------------------------------------------------

  function updateFilter<K extends keyof AttendanceFilters>(
    key: K,
    value: AttendanceFilters[K]
  ) {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
    setTablePagination((prev) => ({ ...prev, pageIndex: 0 }));
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Absensi Live
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Pantau kehadiran karyawan secara real-time
          </p>
        </div>

        {/* Polling indicator */}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" aria-hidden="true" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5 text-green-500" aria-hidden="true" />
          )}
          <span aria-live="polite" aria-atomic="true">
            {loading
              ? "Memperbarui..."
              : lastUpdated
              ? `Diperbarui: ${formatLastUpdated(lastUpdated)}`
              : "Memuat..."}
          </span>
          <button
            onClick={() => fetchAttendance()}
            disabled={loading}
            className="ml-1 p-1 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            aria-label="Perbarui data sekarang"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center bg-white border border-gray-200 rounded-xl p-4">
        {/* Date */}
        <div className="relative flex items-center">
          <CalendarDays
            className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="date"
            value={filters.date}
            max={todayDateString()}
            onChange={(e) => {
              if (e.target.value) updateFilter("date", e.target.value);
            }}
            className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            aria-label="Filter tanggal absensi"
          />
        </div>

        {/* Status */}
        <Select
          value={filters.status || "all"}
          onValueChange={(v) =>
            updateFilter("status", v === "all" ? "" : (v as AttendanceStatus))
          }
        >
          <SelectTrigger className="w-44 text-sm" aria-label="Filter status absensi">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="Present">Hadir</SelectItem>
            <SelectItem value="Late">Terlambat</SelectItem>
            <SelectItem value="Absent">Tidak Hadir</SelectItem>
            <SelectItem value="PendingCheckout">Belum Pulang</SelectItem>
            <SelectItem value="MissingCheckout">Lupa Absen Pulang</SelectItem>
            <SelectItem value="Leave">Izin/Cuti</SelectItem>
            <SelectItem value="Invalid">Tidak Valid</SelectItem>
          </SelectContent>
        </Select>

        {/* Department */}
        <Select
          value={filters.departmentId || "all"}
          onValueChange={(v) =>
            updateFilter("departmentId", v === "all" ? "" : v)
          }
        >
          <SelectTrigger className="w-44 text-sm" aria-label="Filter departemen">
            <SelectValue placeholder="Semua Departemen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Departemen</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Shift */}
        <Select
          value={filters.shiftId || "all"}
          onValueChange={(v) =>
            updateFilter("shiftId", v === "all" ? "" : v)
          }
        >
          <SelectTrigger className="w-40 text-sm" aria-label="Filter shift">
            <SelectValue placeholder="Semua Shift" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Shift</SelectItem>
            {shifts.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Cari nama atau kode karyawan..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            aria-label="Cari karyawan"
          />
        </div>
      </div>

      {/* Error state */}
      {error && !loading && (
        <div
          role="alert"
          className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-800 rounded-lg px-4 py-3 text-sm"
        >
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="w-full overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left border-collapse min-w-[900px]" role="grid">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b border-gray-200 bg-gray-50"
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                    scope="col"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && records.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-16 text-center"
                >
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-400" aria-hidden="true" />
                    <p className="text-sm">Memuat data absensi...</p>
                  </div>
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-16 text-center"
                >
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <CalendarSearch
                      className="w-12 h-12 text-gray-300"
                      aria-hidden="true"
                    />
                    <p className="text-sm font-medium">
                      Tidak ada data absensi
                    </p>
                    <p className="text-xs">
                      Coba ubah filter atau pilih tanggal lain.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                  onClick={() => setSelectedRecord(row.original)}
                  role="row"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-3 whitespace-nowrap text-sm"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
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

          {/* Page numbers */}
          {Array.from(
            { length: Math.min(pagination.total_pages, 5) },
            (_, i) => {
              const pageNum = i + 1;
              const isActive = pageNum === pagination.page;
              return (
                <button
                  key={pageNum}
                  onClick={() => {
                    setTablePagination((prev) => ({
                      ...prev,
                      pageIndex: pageNum - 1,
                    }));
                    setFilters((prev) => ({ ...prev, page: pageNum }));
                  }}
                  className={`w-8 h-8 rounded text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "border border-gray-200 hover:bg-gray-100 text-gray-700"
                  }`}
                  aria-label={`Halaman ${pageNum}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {pageNum}
                </button>
              );
            }
          )}

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
      {selectedRecord && (
        <DetailPanel
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Default export — wrapped in Suspense for useSearchParams
// ---------------------------------------------------------------------------

export default function AttendancePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-64 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Memuat...</span>
        </div>
      }
    >
      <AttendancePageInner />
    </Suspense>
  );
}
