"use client";

/**
 * app/workspace/leave/page.tsx
 *
 * Halaman Izin & Cuti — Client Component.
 *
 * Fitur:
 * - Filter bar: status (default Pending), pencarian teks, rentang tanggal
 * - TanStack Table dengan server-side pagination
 * - Panel detail (side drawer) — info karyawan, tipe, tanggal, lampiran,
 *   peringatan konflik (R11.10), catatan approver
 * - Approve/Reject jika status = Pending:
 *     • Approve → PATCH /leave-requests/:id/approve
 *       – Jika conflictWarning=true → tampilkan dialog konfirmasi konflik dulu
 *     • Reject  → dialog meminta catatan penolakan
 * - HR manual create (dialog form)
 * - Empty state
 *
 * Requirements: 11.1, 11.10
 */

import React, {
  useState,
  useEffect,
  useCallback,
  Suspense,
} from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type PaginationState,
} from "@tanstack/react-table";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  Eye,
  CheckCircle2,
  XCircle,
  Plus,
  Loader2,
  CalendarDays,
  User,
  FileText,
  Paperclip,
  Clock,
} from "lucide-react";

import { createClientApiClient } from "@/lib/apiClient";
import type { PaginatedData } from "@/lib/apiClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type {
  LeaveRequest,
  LeaveFilters,
  LeaveStatus,
  LeaveTypeOption,
  EmployeeOption,
  ApproveLeaveResponse,
} from "@/types/leave";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LEAVE_TYPES_DEFAULT = [
  "Sakit",
  "Cuti Tahunan",
  "Izin Pribadi",
  "Dinas Luar",
  "WFH Request",
  "Lainnya",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatDateTime(iso: string | null): string {
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

function calcDuration(startDate: string, endDate: string): number {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.round(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diff + 1; // inclusive
  } catch {
    return 1;
  }
}

// ---------------------------------------------------------------------------
// Status Badge
// ---------------------------------------------------------------------------

function LeaveStatusBadge({ status }: { status: LeaveStatus }) {
  const config: Record<LeaveStatus, { label: string; className: string }> = {
    Pending: {
      label: "Menunggu",
      className:
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-amber-100 text-amber-800",
    },
    Approved: {
      label: "Disetujui",
      className:
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-green-100 text-green-800",
    },
    Rejected: {
      label: "Ditolak",
      className:
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-red-100 text-red-800",
    },
    Cancelled: {
      label: "Dibatalkan",
      className:
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-gray-100 text-gray-500",
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
// Reject Dialog
// ---------------------------------------------------------------------------

interface RejectDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (notes: string) => Promise<void>;
  loading: boolean;
}

function RejectDialog({ open, onClose, onConfirm, loading }: RejectDialogProps) {
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    setNotes("");
    setError(null);
    onClose();
  }

  async function handleConfirm() {
    if (!notes.trim()) {
      setError("Catatan penolakan wajib diisi.");
      return;
    }
    setError(null);
    await onConfirm(notes.trim());
    setNotes("");
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tolak Pengajuan</DialogTitle>
          <DialogDescription>
            Masukkan alasan penolakan yang akan dikirimkan ke karyawan.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="reject-notes">
            Catatan Penolakan <span className="text-red-500">*</span>
          </Label>
          <textarea
            id="reject-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Tuliskan alasan penolakan..."
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
            aria-required="true"
          />
          {error && (
            <p className="text-xs text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Batal
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Menolak...
              </>
            ) : (
              "Tolak Pengajuan"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Conflict Warning Dialog (R11.10)
// ---------------------------------------------------------------------------

interface ConflictDialogProps {
  open: boolean;
  conflictNote: string | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading: boolean;
}

function ConflictDialog({
  open,
  conflictNote,
  onClose,
  onConfirm,
  loading,
}: ConflictDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Konflik Absensi Terdeteksi
          </DialogTitle>
          <DialogDescription>
            Karyawan ini sudah memiliki data absensi pada periode yang diminta.
          </DialogDescription>
        </DialogHeader>
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 my-2">
          <p className="font-medium mb-1">Catatan konflik:</p>
          <p>{conflictNote ?? "Data absensi sudah ada pada rentang tanggal ini."}</p>
        </div>
        <p className="text-sm text-gray-600">
          Jika Anda tetap menyetujui, catatan konflik akan disimpan dan absensi
          yang ada{" "}
          <strong>tidak akan diubah secara otomatis</strong>.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button onClick={onConfirm} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Menyetujui...
              </>
            ) : (
              "Setujui Tetap"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Create Leave Dialog (HR manual)
// ---------------------------------------------------------------------------

interface CreateLeaveDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  leaveTypes: string[];
}

function CreateLeaveDialog({
  open,
  onClose,
  onSuccess,
  leaveTypes,
}: CreateLeaveDialogProps) {
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");

  const [form, setForm] = useState({
    employeeId: "",
    type: "",
    startDate: "",
    endDate: "",
    reason: "",
    status: "Pending" as "Pending" | "Approved",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Load employees for the select
  useEffect(() => {
    if (!open) return;
    setLoadingEmployees(true);
    const api = createClientApiClient();
    api
      .get<{ data: EmployeeOption[] }>("v1/employees", {
        status: "Active",
        page_size: "100",
        search: employeeSearch,
      })
      .then((res) => {
        if (res.success) {
          const payload = res.data as unknown;
          const arr = Array.isArray(payload)
            ? (payload as EmployeeOption[])
            : ((payload as { data?: EmployeeOption[] }).data ?? []);
          setEmployees(arr);
        }
      })
      .finally(() => setLoadingEmployees(false));
  }, [open, employeeSearch]);

  function handleClose() {
    setForm({
      employeeId: "",
      type: "",
      startDate: "",
      endDate: "",
      reason: "",
      status: "Pending",
    });
    setError(null);
    setFieldErrors({});
    setEmployeeSearch("");
    onClose();
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.employeeId) errs.employeeId = "Karyawan wajib dipilih.";
    if (!form.type) errs.type = "Tipe izin/cuti wajib dipilih.";
    if (!form.startDate) errs.startDate = "Tanggal mulai wajib diisi.";
    if (!form.endDate) errs.endDate = "Tanggal selesai wajib diisi.";
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      errs.endDate = "Tanggal selesai tidak boleh sebelum tanggal mulai.";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    setError(null);
    try {
      const api = createClientApiClient();
      const res = await api.post("v1/leave-requests", {
        employeeId: form.employeeId,
        type: form.type,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason || undefined,
        status: form.status,
      });
      if (res.success) {
        onSuccess();
        handleClose();
      } else {
        setError(
          (res as { success: false; error: { message: string } }).error.message ??
            "Gagal membuat pengajuan."
        );
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Buat Pengajuan Izin/Cuti</DialogTitle>
          <DialogDescription>
            Buat pengajuan secara manual oleh HR untuk keperluan operasional.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Employee */}
          <div className="space-y-1.5">
            <Label htmlFor="create-employee">
              Karyawan <span className="text-red-500">*</span>
            </Label>
            <div className="space-y-1.5">
              <Input
                placeholder="Cari nama karyawan..."
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                className="text-sm"
              />
              <Select
                value={form.employeeId}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, employeeId: v }))
                }
              >
                <SelectTrigger id="create-employee">
                  <SelectValue
                    placeholder={
                      loadingEmployees ? "Memuat..." : "Pilih karyawan"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.employeeCode})
                    </SelectItem>
                  ))}
                  {employees.length === 0 && !loadingEmployees && (
                    <div className="px-2 py-3 text-xs text-gray-400 text-center">
                      Tidak ada karyawan ditemukan
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            {fieldErrors.employeeId && (
              <p className="text-xs text-red-600">{fieldErrors.employeeId}</p>
            )}
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <Label htmlFor="create-type">
              Tipe Izin/Cuti <span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.type}
              onValueChange={(v) => setForm((prev) => ({ ...prev, type: v }))}
            >
              <SelectTrigger id="create-type">
                <SelectValue placeholder="Pilih tipe" />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.type && (
              <p className="text-xs text-red-600">{fieldErrors.type}</p>
            )}
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="create-start">
                Tanggal Mulai <span className="text-red-500">*</span>
              </Label>
              <Input
                id="create-start"
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, startDate: e.target.value }))
                }
                className="text-sm"
              />
              {fieldErrors.startDate && (
                <p className="text-xs text-red-600">{fieldErrors.startDate}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-end">
                Tanggal Selesai <span className="text-red-500">*</span>
              </Label>
              <Input
                id="create-end"
                type="date"
                value={form.endDate}
                min={form.startDate}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, endDate: e.target.value }))
                }
                className="text-sm"
              />
              {fieldErrors.endDate && (
                <p className="text-xs text-red-600">{fieldErrors.endDate}</p>
              )}
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <Label htmlFor="create-reason">Keterangan (opsional)</Label>
            <textarea
              id="create-reason"
              value={form.reason}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, reason: e.target.value }))
              }
              rows={2}
              placeholder="Alasan pengajuan..."
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
            />
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label htmlFor="create-status">Status Awal</Label>
            <Select
              value={form.status}
              onValueChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  status: v as "Pending" | "Approved",
                }))
              }
            >
              <SelectTrigger id="create-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending">Menunggu (Pending)</SelectItem>
                <SelectItem value="Approved">
                  Disetujui — untuk data historis
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-sm text-red-700"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Buat Pengajuan"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Detail Panel (side drawer)
// ---------------------------------------------------------------------------

interface DetailPanelProps {
  request: LeaveRequest | null;
  onClose: () => void;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => void;
  actionLoading: boolean;
}

function DetailPanel({
  request,
  onClose,
  onApprove,
  onReject,
  actionLoading,
}: DetailPanelProps) {
  if (!request) return null;

  const duration = calcDuration(request.startDate, request.endDate);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={`Detail pengajuan ${request.employeeName}`}
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
            Detail Pengajuan
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
                    {request.employeeName}
                  </p>
                  <p className="text-xs font-mono text-gray-500">
                    {request.employeeCode}
                  </p>
                </div>
              </div>
              {request.departmentName && (
                <p className="text-sm text-gray-700 ml-6">
                  {request.departmentName}
                </p>
              )}
            </div>
          </section>

          {/* Leave Type + Dates */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Detail Pengajuan
            </h3>
            <div className="space-y-2 bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                <div>
                  <span className="text-xs text-gray-500">Tipe:</span>{" "}
                  <span className="text-sm font-medium text-gray-900">
                    {request.type}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
                <div>
                  <span className="text-xs text-gray-500">Tanggal:</span>{" "}
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(request.startDate)}
                    {request.startDate !== request.endDate
                      ? ` — ${formatDate(request.endDate)}`
                      : ""}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                <div>
                  <span className="text-xs text-gray-500">Durasi:</span>{" "}
                  <span className="text-sm font-medium text-gray-900">
                    {duration} hari
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Reason */}
          {request.reason && (
            <section>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Keterangan
              </h3>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2.5">
                {request.reason}
              </p>
            </section>
          )}

          {/* Attachment */}
          {request.attachmentSignedUrl && (
            <section>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Lampiran
              </h3>
              <a
                href={request.attachmentSignedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                <Paperclip className="w-4 h-4" aria-hidden="true" />
                Unduh Lampiran
              </a>
            </section>
          )}

          {/* Conflict Warning (R11.10) */}
          {request.conflictNote && (
            <div
              role="alert"
              className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-3"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-800 mb-0.5">
                  Konflik Absensi
                </p>
                <p className="text-xs text-amber-700">{request.conflictNote}</p>
              </div>
            </div>
          )}

          {/* Status */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Status
            </h3>
            <div className="space-y-2">
              <div>
                <LeaveStatusBadge status={request.status} />
              </div>
              {request.approverName && (
                <p className="text-xs text-gray-500">
                  Diproses oleh:{" "}
                  <span className="font-medium text-gray-700">
                    {request.approverName}
                  </span>
                </p>
              )}
              {request.approvedAt && (
                <p className="text-xs text-gray-500">
                  Disetujui:{" "}
                  <span className="font-medium text-gray-700">
                    {formatDateTime(request.approvedAt)}
                  </span>
                </p>
              )}
              {request.rejectedAt && (
                <p className="text-xs text-gray-500">
                  Ditolak:{" "}
                  <span className="font-medium text-gray-700">
                    {formatDateTime(request.rejectedAt)}
                  </span>
                </p>
              )}
            </div>
          </section>

          {/* Approver Notes */}
          {request.notes && (
            <section>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Catatan Approver
              </h3>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2.5">
                {request.notes}
              </p>
            </section>
          )}

          {/* Diajukan */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Diajukan
            </h3>
            <p className="text-sm text-gray-700">
              {formatDateTime(request.createdAt)}
            </p>
          </section>
        </div>

        {/* Approve / Reject footer — only if Pending */}
        {request.status === "Pending" && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-5 py-4 flex gap-3">
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => onReject(request.id)}
              disabled={actionLoading}
            >
              <XCircle className="w-4 h-4" />
              Tolak
            </Button>
            <Button
              className="flex-1"
              onClick={() => onApprove(request.id)}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Setujui
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page inner (no router deps needing Suspense here)
// ---------------------------------------------------------------------------

function LeavePageInner() {
  const [filters, setFilters] = useState<LeaveFilters>({
    status: "Pending",
    search: "",
    startDate: "",
    endDate: "",
    page: 1,
    pageSize: 25,
  });

  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 25,
    total: 0,
    total_pages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Leave types from server (fallback to default)
  const [leaveTypes, setLeaveTypes] = useState<string[]>(LEAVE_TYPES_DEFAULT);

  // Detail panel
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(
    null
  );

  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [conflictInfo, setConflictInfo] = useState<{
    id: string;
    note: string | null;
  } | null>(null);

  // Action loading
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // TanStack Table pagination state
  const [tablePagination, setTablePagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });

  // ---------------------------------------------------------------------------
  // Fetch leave types on mount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const api = createClientApiClient();
    api
      .get<LeaveTypeOption[]>("v1/shared/leave-types")
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          const names = (res.data as LeaveTypeOption[]).map((t) => t.name);
          if (names.length > 0) setLeaveTypes(names);
        }
      })
      .catch(() => {
        // keep default
      });
  }, []);

  // ---------------------------------------------------------------------------
  // Fetch leave requests
  // ---------------------------------------------------------------------------

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const api = createClientApiClient();
      const params: Record<string, string> = {
        page: String(filters.page),
        page_size: String(filters.pageSize),
      };
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      if (filters.startDate) params.start_date = filters.startDate;
      if (filters.endDate) params.end_date = filters.endDate;

      const res = await api.get<PaginatedData<LeaveRequest>>(
        "v1/leave-requests",
        params
      );
      if (res.success) {
        const paginatedData = res.data;
        setRequests(paginatedData.data);
        setPagination(paginatedData.pagination);
      } else {
        setError(
          (res as { success: false; error: { message: string } }).error
            .message ?? "Gagal memuat data."
        );
        setRequests([]);
      }
    } catch {
      setError("Terjadi kesalahan jaringan. Coba lagi.");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // ---------------------------------------------------------------------------
  // Approve action
  // ---------------------------------------------------------------------------

  async function handleApprove(id: string) {
    setActionLoading(true);
    setActionError(null);
    try {
      const api = createClientApiClient();
      const res = await api.patch<ApproveLeaveResponse>(
        `v1/leave-requests/${id}/approve`,
        {}
      );
      if (res.success) {
        const data = res.data as ApproveLeaveResponse;
        if (data.conflictWarning) {
          // Show conflict confirmation dialog (R11.10)
          setConflictInfo({ id, note: data.conflictNote ?? null });
          setShowConflictDialog(true);
          setActionLoading(false);
          return;
        }
        // Success without conflict
        await fetchRequests();
        // Update selected panel if open
        if (selectedRequest?.id === id) {
          setSelectedRequest(null);
        }
      } else {
        setActionError(
          (res as { success: false; error: { message: string } }).error
            .message ?? "Gagal menyetujui pengajuan."
        );
      }
    } catch {
      setActionError("Terjadi kesalahan jaringan.");
    } finally {
      setActionLoading(false);
    }
  }

  // Confirm approval despite conflict
  async function handleConflictConfirm() {
    if (!conflictInfo) return;
    setActionLoading(true);
    try {
      const api = createClientApiClient();
      const res = await api.patch<ApproveLeaveResponse>(
        `v1/leave-requests/${conflictInfo.id}/approve`,
        { forceApprove: true }
      );
      if (res.success) {
        setShowConflictDialog(false);
        setConflictInfo(null);
        await fetchRequests();
        if (selectedRequest?.id === conflictInfo.id) {
          setSelectedRequest(null);
        }
      } else {
        setActionError(
          (res as { success: false; error: { message: string } }).error
            .message ?? "Gagal menyetujui pengajuan."
        );
        setShowConflictDialog(false);
      }
    } catch {
      setActionError("Terjadi kesalahan jaringan.");
      setShowConflictDialog(false);
    } finally {
      setActionLoading(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Reject action
  // ---------------------------------------------------------------------------

  function openRejectDialog(id: string) {
    setRejectTargetId(id);
    setShowRejectDialog(true);
  }

  async function handleRejectConfirm(notes: string) {
    if (!rejectTargetId) return;
    setActionLoading(true);
    try {
      const api = createClientApiClient();
      const res = await api.patch(`v1/leave-requests/${rejectTargetId}/reject`, {
        notes,
      });
      if (res.success) {
        setShowRejectDialog(false);
        setRejectTargetId(null);
        await fetchRequests();
        if (selectedRequest?.id === rejectTargetId) {
          setSelectedRequest(null);
        }
      } else {
        setActionError(
          (res as { success: false; error: { message: string } }).error
            .message ?? "Gagal menolak pengajuan."
        );
        setShowRejectDialog(false);
      }
    } catch {
      setActionError("Terjadi kesalahan jaringan.");
      setShowRejectDialog(false);
    } finally {
      setActionLoading(false);
    }
  }

  // ---------------------------------------------------------------------------
  // TanStack Table columns
  // ---------------------------------------------------------------------------

  const columns: ColumnDef<LeaveRequest>[] = [
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
      id: "type",
      header: "Tipe",
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">{row.original.type}</span>
      ),
    },
    {
      id: "dates",
      header: "Tanggal",
      cell: ({ row }) => (
        <div className="text-sm text-gray-900">
          <span>{formatDate(row.original.startDate)}</span>
          {row.original.startDate !== row.original.endDate && (
            <>
              <br />
              <span className="text-gray-500 text-xs">
                s/d {formatDate(row.original.endDate)}
              </span>
            </>
          )}
        </div>
      ),
    },
    {
      id: "duration",
      header: "Durasi",
      cell: ({ row }) => (
        <span className="text-sm text-gray-700 tabular-nums">
          {calcDuration(row.original.startDate, row.original.endDate)} hari
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => <LeaveStatusBadge status={row.original.status} />,
    },
    {
      id: "createdAt",
      header: "Diajukan",
      cell: ({ row }) => (
        <span className="text-xs text-gray-500 tabular-nums">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: "action",
      header: "Aksi",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedRequest(row.original)}
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium focus:outline-none focus:underline"
            aria-label={`Lihat detail pengajuan ${row.original.employeeName}`}
          >
            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
            Detail
          </button>
          {row.original.status === "Pending" && (
            <>
              <button
                onClick={() => handleApprove(row.original.id)}
                disabled={actionLoading}
                className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-medium focus:outline-none focus:underline disabled:opacity-50"
                aria-label={`Setujui pengajuan ${row.original.employeeName}`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                Setujui
              </button>
              <button
                onClick={() => openRejectDialog(row.original.id)}
                disabled={actionLoading}
                className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800 font-medium focus:outline-none focus:underline disabled:opacity-50"
                aria-label={`Tolak pengajuan ${row.original.employeeName}`}
              >
                <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                Tolak
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: requests,
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

  function updateFilter<K extends keyof LeaveFilters>(
    key: K,
    value: LeaveFilters[K]
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
            Izin &amp; Cuti
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Kelola pengajuan izin dan cuti karyawan
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="shrink-0"
          aria-label="Buat pengajuan izin/cuti baru"
        >
          <Plus className="w-4 h-4" />
          Buat Pengajuan
        </Button>
      </div>

      {/* Action error banner */}
      {actionError && (
        <div
          role="alert"
          className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700"
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
          <button
            onClick={() => setActionError(null)}
            className="ml-auto p-0.5 rounded hover:bg-red-100"
            aria-label="Tutup pesan error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
        {/* Status filter */}
        <div className="w-full sm:w-44">
          <Select
            value={filters.status || "_all"}
            onValueChange={(v) =>
              updateFilter("status", v === "_all" ? "" : (v as LeaveStatus))
            }
          >
            <SelectTrigger aria-label="Filter status">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Semua Status</SelectItem>
              <SelectItem value="Pending">Menunggu</SelectItem>
              <SelectItem value="Approved">Disetujui</SelectItem>
              <SelectItem value="Rejected">Ditolak</SelectItem>
              <SelectItem value="Cancelled">Dibatalkan</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Cari nama karyawan..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="pl-9 text-sm"
            aria-label="Cari pengajuan"
          />
        </div>

        {/* Date range */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 shrink-0">Dari</label>
          <Input
            type="date"
            value={filters.startDate}
            onChange={(e) => updateFilter("startDate", e.target.value)}
            className="text-sm w-36"
            aria-label="Tanggal mulai filter"
          />
          <label className="text-xs text-gray-500 shrink-0">s/d</label>
          <Input
            type="date"
            value={filters.endDate}
            min={filters.startDate}
            onChange={(e) => updateFilter("endDate", e.target.value)}
            className="text-sm w-36"
            aria-label="Tanggal selesai filter"
          />
        </div>

        {/* Page size */}
        <div className="w-full sm:w-28">
          <Select
            value={String(filters.pageSize)}
            onValueChange={(v) => {
              const ps = Number(v);
              setFilters((prev) => ({ ...prev, pageSize: ps, page: 1 }));
              setTablePagination({ pageIndex: 0, pageSize: ps });
            }}
          >
            <SelectTrigger aria-label="Baris per halaman">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50, 100].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} baris
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700"
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-gray-200 overflow-x-auto bg-white">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b border-gray-200 bg-gray-50"
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center"
                >
                  <Loader2
                    className="w-6 h-6 animate-spin text-gray-400 mx-auto"
                    aria-hidden="true"
                  />
                  <p className="mt-2 text-sm text-gray-400">Memuat data...</p>
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-16 text-center"
                >
                  <FileText
                    className="w-10 h-10 text-gray-300 mx-auto"
                    aria-hidden="true"
                  />
                  <p className="mt-3 text-sm font-medium text-gray-500">
                    Tidak ada pengajuan izin/cuti
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Coba ubah filter atau buat pengajuan baru
                  </p>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-3 align-middle"
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
      {!loading && requests.length > 0 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-gray-500">
            Menampilkan{" "}
            {(pagination.page - 1) * pagination.page_size + 1}–
            {Math.min(
              pagination.page * pagination.page_size,
              pagination.total
            )}{" "}
            dari {pagination.total} pengajuan
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs text-gray-600 px-2 tabular-nums">
              {pagination.page} / {pagination.total_pages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Halaman berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Panel */}
      {selectedRequest && (
        <DetailPanel
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onApprove={handleApprove}
          onReject={openRejectDialog}
          actionLoading={actionLoading}
        />
      )}

      {/* Reject Dialog */}
      <RejectDialog
        open={showRejectDialog}
        onClose={() => {
          setShowRejectDialog(false);
          setRejectTargetId(null);
        }}
        onConfirm={handleRejectConfirm}
        loading={actionLoading}
      />

      {/* Conflict Warning Dialog (R11.10) */}
      <ConflictDialog
        open={showConflictDialog}
        conflictNote={conflictInfo?.note ?? null}
        onClose={() => {
          setShowConflictDialog(false);
          setConflictInfo(null);
        }}
        onConfirm={handleConflictConfirm}
        loading={actionLoading}
      />

      {/* Create Leave Dialog */}
      <CreateLeaveDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={fetchRequests}
        leaveTypes={leaveTypes}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Default export — wrap in Suspense (safe for future router hooks usage)
// ---------------------------------------------------------------------------

export default function LeavePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Memuat...</div>}>
      <LeavePageInner />
    </Suspense>
  );
}
