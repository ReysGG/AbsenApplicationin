"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Clock,
  Plus,
  Search,
  Edit2,
  PowerOff,
  Users,
  UserCheck,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Moon,
  Sun,
  Loader2,
} from "lucide-react";
import { createClientApiClient } from "@/lib/apiClient";
import type { PaginatedData } from "@/lib/apiClient";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type WorkDay =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  gracePeriodMinutes: number;
  checkoutToleranceMinutes: number;
  absenceCutoffMinutes: number;
  breakMinutes: number;
  workDays: WorkDay[];
  effectiveFrom: string;
  status: "Active" | "Inactive";
  isMidnightCrossing: boolean;
  assignedEmployeeCount: number;
}

interface EmployeeWithoutShift {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  position: string | null;
  departmentName: string;
}

// ---------------------------------------------------------------------------
// Zod schema (mirrors backend createShiftSchema)
// ---------------------------------------------------------------------------

const dayEnum = z.enum([
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
]);

const shiftFormSchema = z
  .object({
    name: z
      .string({ required_error: "Nama shift wajib diisi" })
      .min(2, "Minimal 2 karakter")
      .max(100, "Maksimal 100 karakter")
      .trim(),
    startTime: z
      .string({ required_error: "Jam masuk wajib diisi" })
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format HH:MM"),
    endTime: z
      .string({ required_error: "Jam keluar wajib diisi" })
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format HH:MM"),
    breakMinutes: z
      .number({ invalid_type_error: "Harus angka" })
      .int()
      .min(0)
      .max(480),
    gracePeriodMinutes: z
      .number({ invalid_type_error: "Harus angka" })
      .int()
      .min(0)
      .max(120),
    checkoutToleranceMinutes: z
      .number({ invalid_type_error: "Harus angka" })
      .int()
      .min(0)
      .max(240),
    absenceCutoffMinutes: z
      .number({ invalid_type_error: "Harus angka" })
      .int()
      .min(30)
      .max(480),
    workDays: z.array(dayEnum).min(1, "Minimal 1 hari kerja"),
    effectiveFrom: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD")
      .optional()
      .or(z.literal("")),
  })
  .refine((d) => d.startTime !== d.endTime, {
    message: "Jam masuk dan jam keluar tidak boleh sama",
    path: ["endTime"],
  });

type ShiftFormValues = z.infer<typeof shiftFormSchema>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALL_DAYS: { key: WorkDay; label: string; short: string }[] = [
  { key: "MONDAY", label: "Senin", short: "Sen" },
  { key: "TUESDAY", label: "Selasa", short: "Sel" },
  { key: "WEDNESDAY", label: "Rabu", short: "Rab" },
  { key: "THURSDAY", label: "Kamis", short: "Kam" },
  { key: "FRIDAY", label: "Jumat", short: "Jum" },
  { key: "SATURDAY", label: "Sabtu", short: "Sab" },
  { key: "SUNDAY", label: "Minggu", short: "Min" },
];

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function formatWorkDays(workDays: WorkDay[]): string {
  if (workDays.length === 5 && !workDays.includes("SATURDAY") && !workDays.includes("SUNDAY")) {
    return "Senin – Jumat";
  }
  if (workDays.length === 7) return "Setiap Hari";
  return workDays.map((d) => ALL_DAYS.find((x) => x.key === d)?.short ?? d).join(", ");
}

/** Normalise the backend list response — handles both `data.data[]` and `data[]` */
function extractShiftList(data: unknown): Shift[] {
  if (!data) return [];
  // Paginated shape: { data: Shift[], pagination: {...} }
  if (
    typeof data === "object" &&
    data !== null &&
    "data" in data &&
    Array.isArray((data as PaginatedData<Shift>).data)
  ) {
    return (data as PaginatedData<Shift>).data;
  }
  // Flat array shape
  if (Array.isArray(data)) return data as Shift[];
  return [];
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ShiftsPage() {
  // Data state
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employeesWithoutShift, setEmployeesWithoutShift] = useState<EmployeeWithoutShift[]>([]);

  // Loading / error state
  const [shiftsLoading, setShiftsLoading] = useState(true);
  const [shiftsError, setShiftsError] = useState<string | null>(null);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Active" | "Inactive">("Active");
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assignTargetShift, setAssignTargetShift] = useState<Shift | null>(null);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);

  // Form
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ShiftFormValues>({
    resolver: zodResolver(shiftFormSchema),
    defaultValues: {
      breakMinutes: 0,
      gracePeriodMinutes: 10,
      checkoutToleranceMinutes: 60,
      absenceCutoffMinutes: 120,
      workDays: [],
    },
  });

  const watchedWorkDays = watch("workDays") ?? [];
  const watchedStart = watch("startTime");
  const watchedEnd = watch("endTime");
  const isFormMidnightCrossing =
    watchedStart && watchedEnd && watchedEnd < watchedStart;

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchShifts = useCallback(async (filter: "all" | "Active" | "Inactive") => {
    setShiftsLoading(true);
    setShiftsError(null);
    try {
      const api = createClientApiClient();
      const params = filter !== "all" ? { status: filter } : { status: "all" };
      const res = await api.get<PaginatedData<Shift> | Shift[]>("v1/shifts", params);
      if (res.success) {
        setShifts(extractShiftList(res.data));
      } else {
        setShiftsError(res.error.message ?? "Gagal memuat data shift.");
      }
    } catch {
      setShiftsError("Terjadi kesalahan jaringan. Coba lagi.");
    } finally {
      setShiftsLoading(false);
    }
  }, []);

  const fetchEmployeesWithoutShift = useCallback(async () => {
    setEmployeesLoading(true);
    try {
      const api = createClientApiClient();
      const res = await api.get<PaginatedData<EmployeeWithoutShift> | EmployeeWithoutShift[]>(
        "v1/employees/without-shift"
      );
      if (res.success) {
        const list = extractShiftList(res.data as unknown) as EmployeeWithoutShift[];
        setEmployeesWithoutShift(list);
      }
      // Silently ignore errors — the section just shows empty state
    } catch {
      // noop
    } finally {
      setEmployeesLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchShifts(statusFilter);
    fetchEmployeesWithoutShift();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch when filter changes
  useEffect(() => {
    fetchShifts(statusFilter);
  }, [statusFilter, fetchShifts]);

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------

  // Client-side search filter (status is already applied server-side)
  const filteredShifts = useMemo(() => {
    return shifts.filter((s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [shifts, searchQuery]);

  const stats = useMemo(
    () => ({
      total: shifts.length,
      active: shifts.filter((s) => s.status === "Active").length,
      totalAssigned: shifts.reduce((sum, s) => sum + s.assignedEmployeeCount, 0),
    }),
    [shifts]
  );

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function openCreateDialog() {
    setEditingShift(null);
    setFormError(null);
    reset({
      breakMinutes: 0,
      gracePeriodMinutes: 10,
      checkoutToleranceMinutes: 60,
      absenceCutoffMinutes: 120,
      workDays: [],
    });
    setShowFormDialog(true);
  }

  function openEditDialog(shift: Shift) {
    setEditingShift(shift);
    setFormError(null);
    reset({
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      breakMinutes: shift.breakMinutes,
      gracePeriodMinutes: shift.gracePeriodMinutes,
      checkoutToleranceMinutes: shift.checkoutToleranceMinutes,
      absenceCutoffMinutes: shift.absenceCutoffMinutes,
      workDays: shift.workDays,
      effectiveFrom: shift.effectiveFrom,
    });
    setShowFormDialog(true);
  }

  async function onFormSubmit(data: ShiftFormValues) {
    setFormSubmitting(true);
    setFormError(null);

    const payload = {
      name: data.name,
      startTime: data.startTime,
      endTime: data.endTime,
      breakMinutes: data.breakMinutes ?? 0,
      gracePeriodMinutes: data.gracePeriodMinutes ?? 10,
      checkoutToleranceMinutes: data.checkoutToleranceMinutes ?? 60,
      absenceCutoffMinutes: data.absenceCutoffMinutes ?? 120,
      workDays: data.workDays,
      effectiveFrom: data.effectiveFrom || new Date().toISOString().slice(0, 10),
    };

    try {
      const api = createClientApiClient();
      let res;

      if (editingShift) {
        res = await api.patch<Shift>(`v1/shifts/${editingShift.id}`, payload);
      } else {
        res = await api.post<Shift>("v1/shifts", payload);
      }

      if (res.success) {
        setShowFormDialog(false);
        await fetchShifts(statusFilter);
      } else {
        setFormError(res.error.message ?? "Gagal menyimpan shift.");
      }
    } catch {
      setFormError("Terjadi kesalahan jaringan. Coba lagi.");
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleDeactivate(shift: Shift) {
    const newStatus = shift.status === "Active" ? "Inactive" : "Active";
    try {
      const api = createClientApiClient();
      const res = await api.patch<Shift>(`v1/shifts/${shift.id}`, { status: newStatus });
      if (res.success) {
        await fetchShifts(statusFilter);
      }
      // Silently ignore toggle errors — UI stays consistent via refetch
    } catch {
      // noop
    }
  }

  function openAssignDialog(shift: Shift) {
    setAssignTargetShift(shift);
    setSelectedEmployeeIds([]);
    setAssignError(null);
    setShowAssignDialog(true);
  }

  async function handleAssignSubmit() {
    if (!assignTargetShift || selectedEmployeeIds.length === 0) return;
    setAssignSubmitting(true);
    setAssignError(null);

    try {
      const api = createClientApiClient();
      const res = await api.post(`v1/shifts/${assignTargetShift.id}/assign`, {
        employeeIds: selectedEmployeeIds,
      });

      if (res.success) {
        setShowAssignDialog(false);
        setSelectedEmployeeIds([]);
        // Refresh both lists so counts and without-shift section update
        await Promise.all([fetchShifts(statusFilter), fetchEmployeesWithoutShift()]);
      } else {
        setAssignError(res.error.message ?? "Gagal menetapkan shift.");
      }
    } catch {
      setAssignError("Terjadi kesalahan jaringan. Coba lagi.");
    } finally {
      setAssignSubmitting(false);
    }
  }

  function toggleDaySelection(day: WorkDay) {
    const current = watch("workDays") ?? [];
    if (current.includes(day)) {
      setValue(
        "workDays",
        current.filter((d) => d !== day) as WorkDay[]
      );
    } else {
      setValue("workDays", [...current, day] as WorkDay[]);
    }
  }

  function toggleEmployeeSelection(empId: string) {
    setSelectedEmployeeIds((prev) =>
      prev.includes(empId)
        ? prev.filter((id) => id !== empId)
        : [...prev, empId]
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-title-xxl text-primary font-bold tracking-tight">
            Manajemen Shift
          </h2>
          <p className="text-xs text-on-surface-variant font-medium">
            Atur jadwal shift kerja, hari aktif, dan penetapan ke karyawan.
          </p>
        </div>
        <button
          onClick={openCreateDialog}
          className="h-9 px-4 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/95 transition-colors flex items-center gap-2"
          aria-label="Tambah Shift baru"
        >
          <Plus size={14} />
          Tambah Shift
        </button>
      </div>

      {/* ── Summary Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-on-surface-variant uppercase font-semibold">
              Total Shift
            </span>
            <p className="text-xl font-bold text-on-surface">{stats.total}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Clock size={16} className="text-primary" />
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-on-surface-variant uppercase font-semibold">
              Shift Aktif
            </span>
            <p className="text-xl font-bold text-emerald-600">{stats.active}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Sun size={16} className="text-emerald-600" />
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-on-surface-variant uppercase font-semibold">
              Tanpa Shift
            </span>
            <p className="text-xl font-bold text-amber-600">
              {employeesWithoutShift.length}
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <AlertCircle size={16} className="text-amber-600" />
          </div>
        </div>
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative w-full sm:w-64">
          <Search
            className="absolute left-3 top-2.5 text-on-surface-variant"
            size={15}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama shift..."
            aria-label="Cari shift"
            className="w-full h-9 pl-9 pr-4 border border-outline-variant rounded-lg text-xs font-semibold bg-surface focus:ring-1 focus:ring-primary focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto sm:ml-auto">
          <span className="text-[11px] font-semibold text-on-surface-variant">
            Status:
          </span>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | "Active" | "Inactive")
            }
            aria-label="Filter status shift"
            className="h-9 px-3 border border-outline-variant rounded-lg text-xs font-semibold bg-surface focus:ring-1 focus:ring-primary focus:outline-hidden"
          >
            <option value="Active">Aktif</option>
            <option value="Inactive">Nonaktif</option>
            <option value="all">Semua</option>
          </select>
        </div>
      </div>

      {/* ── Shifts Table ────────────────────────────────────────────── */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container/60 border-b border-outline-variant text-[11px] font-bold text-on-surface-variant tracking-wider uppercase">
                <th className="py-3 px-4">Nama Shift</th>
                <th className="py-3 px-4">Jam Masuk</th>
                <th className="py-3 px-4">Jam Keluar</th>
                <th className="py-3 px-4">Grace Period</th>
                <th className="py-3 px-4">Hari Kerja</th>
                <th className="py-3 px-4">Karyawan</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/60">
              {shiftsLoading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center">
                    <div className="flex items-center justify-center gap-2 text-on-surface-variant">
                      <Loader2 size={16} className="animate-spin" />
                      <span className="text-xs font-semibold">Memuat data shift...</span>
                    </div>
                  </td>
                </tr>
              ) : shiftsError ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle size={20} className="text-error" />
                      <p className="text-xs font-semibold text-error">{shiftsError}</p>
                      <button
                        onClick={() => fetchShifts(statusFilter)}
                        className="mt-1 text-xs font-semibold text-primary hover:underline"
                      >
                        Coba lagi
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredShifts.length > 0 ? (
                filteredShifts.map((shift) => (
                  <tr
                    key={shift.id}
                    className="text-xs hover:bg-surface-container-low/20 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                          {shift.isMidnightCrossing ? (
                            <Moon size={12} className="text-indigo-500" />
                          ) : (
                            <Sun size={12} className="text-amber-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-on-surface">
                            {shift.name}
                          </p>
                          {shift.isMidnightCrossing && (
                            <p className="text-[10px] text-indigo-500 font-semibold">
                              Lintas tengah malam
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-on-surface">
                      {shift.startTime}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-on-surface">
                      {shift.endTime}
                    </td>
                    <td className="py-3 px-4 text-on-surface-variant">
                      {shift.gracePeriodMinutes} menit
                    </td>
                    <td className="py-3 px-4 text-on-surface-variant">
                      {formatWorkDays(shift.workDays)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-on-surface font-semibold">
                        <Users size={12} className="text-on-surface-variant" />
                        <span>{shift.assignedEmployeeCount}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          shift.status === "Active"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                        role="status"
                        aria-label={`Status: ${shift.status}`}
                      >
                        {shift.status === "Active" ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => openAssignDialog(shift)}
                          title="Tetapkan ke karyawan"
                          aria-label={`Tetapkan shift ${shift.name} ke karyawan`}
                          className="h-7 w-7 rounded-md border border-outline-variant hover:bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"
                        >
                          <UserCheck size={12} />
                        </button>
                        <button
                          onClick={() => openEditDialog(shift)}
                          title="Edit shift"
                          aria-label={`Edit shift ${shift.name}`}
                          className="h-7 w-7 rounded-md border border-outline-variant hover:bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleDeactivate(shift)}
                          title={shift.status === "Active" ? "Nonaktifkan" : "Aktifkan"}
                          aria-label={`${shift.status === "Active" ? "Nonaktifkan" : "Aktifkan"} shift ${shift.name}`}
                          className={`h-7 w-7 rounded-md border border-outline-variant hover:bg-surface-container flex items-center justify-center transition-colors ${
                            shift.status === "Active"
                              ? "text-on-surface-variant hover:text-error"
                              : "text-on-surface-variant hover:text-emerald-600"
                          }`}
                        >
                          <PowerOff size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="py-10 text-center text-on-surface-variant font-semibold"
                  >
                    Tidak ada shift yang sesuai kriteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="bg-surface-container/30 border-t border-outline-variant px-4 py-3 flex items-center justify-between">
          <span className="text-[11px] font-bold text-on-surface-variant">
            Menampilkan {filteredShifts.length} dari {shifts.length} shift
          </span>
          <div className="flex gap-1">
            <button
              aria-label="Halaman sebelumnya"
              className="h-8 w-8 flex items-center justify-center border border-outline-variant rounded-md hover:bg-surface-container transition-colors disabled:opacity-50"
              disabled
            >
              <ChevronLeft size={16} />
            </button>
            <button className="h-8 w-8 flex items-center justify-center bg-primary text-white font-bold text-xs rounded-md">
              1
            </button>
            <button
              aria-label="Halaman berikutnya"
              className="h-8 w-8 flex items-center justify-center border border-outline-variant rounded-md hover:bg-surface-container transition-colors disabled:opacity-50"
              disabled
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Employees Without Shift ─────────────────────────────────── */}
      <div className="bg-surface-container-lowest border border-amber-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-amber-600" />
            <div>
              <h3 className="text-sm font-bold text-amber-900">
                Karyawan Tanpa Shift ({employeesWithoutShift.length})
              </h3>
              <p className="text-[11px] text-amber-700">
                Karyawan aktif yang belum memiliki shift kerja — tetapkan shift
                untuk memastikan absensi tercatat dengan benar.
              </p>
            </div>
          </div>
        </div>

        {employeesLoading ? (
          <div className="py-8 flex items-center justify-center gap-2 text-on-surface-variant">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-xs font-semibold">Memuat data karyawan...</span>
          </div>
        ) : employeesWithoutShift.length === 0 ? (
          <div className="py-8 text-center">
            <Check size={24} className="mx-auto text-emerald-500 mb-2" />
            <p className="text-sm font-semibold text-on-surface-variant">
              Semua karyawan sudah memiliki shift.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container/40 border-b border-outline-variant text-[11px] font-bold text-on-surface-variant tracking-wider uppercase">
                  <th className="py-3 px-4">Karyawan</th>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Departemen</th>
                  <th className="py-3 px-4">Jabatan</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60">
                {employeesWithoutShift.map((emp) => (
                  <tr
                    key={emp.id}
                    className="text-xs hover:bg-surface-container-low/20 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-bold text-on-surface">
                          {emp.fullName}
                        </p>
                        <p className="text-[10px] text-on-surface-variant">
                          {emp.email}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-on-surface-variant">
                      {emp.employeeCode}
                    </td>
                    <td className="py-3 px-4 text-on-surface-variant">
                      {emp.departmentName}
                    </td>
                    <td className="py-3 px-4 text-on-surface-variant">
                      {emp.position ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          const firstActive = shifts.find(
                            (s) => s.status === "Active"
                          );
                          if (firstActive) openAssignDialog(firstActive);
                        }}
                        aria-label={`Tetapkan shift ke ${emp.fullName}`}
                        className="h-7 px-3 rounded-md border border-outline-variant hover:bg-surface-container text-[11px] font-semibold text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 ml-auto"
                      >
                        <UserCheck size={11} />
                        Tetapkan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add / Edit Shift Dialog ──────────────────────────────────── */}
      {showFormDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="shift-dialog-title"
        >
          <div className="bg-surface w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Dialog Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface-container/40">
              <h3
                id="shift-dialog-title"
                className="text-sm font-bold text-on-surface"
              >
                {editingShift ? "Edit Shift" : "Tambah Shift Baru"}
              </h3>
              <button
                onClick={() => setShowFormDialog(false)}
                aria-label="Tutup dialog"
                className="h-7 w-7 rounded-md hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Dialog Body */}
            <form
              onSubmit={handleSubmit(onFormSubmit)}
              className="overflow-y-auto"
              noValidate
            >
              <div className="px-6 py-5 space-y-4">
                {/* Form-level error */}
                {formError && (
                  <div
                    role="alert"
                    className="flex items-center gap-2 text-[11px] text-error bg-error/5 border border-error/20 rounded-lg px-3 py-2"
                  >
                    <AlertCircle size={13} />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Name */}
                <div>
                  <label
                    htmlFor="shift-name"
                    className="block text-[11px] font-bold text-on-surface-variant mb-1.5 uppercase tracking-wide"
                  >
                    Nama Shift <span aria-hidden="true" className="text-error">*</span>
                  </label>
                  <input
                    id="shift-name"
                    {...register("name")}
                    placeholder="mis. Pagi, Sore, Malam"
                    className="w-full h-9 px-3 border border-outline-variant rounded-lg text-xs bg-surface focus:ring-1 focus:ring-primary focus:outline-hidden"
                    aria-required="true"
                    aria-describedby={errors.name ? "name-error" : undefined}
                  />
                  {errors.name && (
                    <p id="name-error" role="alert" className="text-[11px] text-error mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Time row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="shift-start"
                      className="block text-[11px] font-bold text-on-surface-variant mb-1.5 uppercase tracking-wide"
                    >
                      Jam Masuk <span aria-hidden="true" className="text-error">*</span>
                    </label>
                    <input
                      id="shift-start"
                      type="time"
                      {...register("startTime")}
                      className="w-full h-9 px-3 border border-outline-variant rounded-lg text-xs bg-surface focus:ring-1 focus:ring-primary focus:outline-hidden"
                      aria-required="true"
                      aria-describedby={errors.startTime ? "start-error" : undefined}
                    />
                    {errors.startTime && (
                      <p id="start-error" role="alert" className="text-[11px] text-error mt-1">
                        {errors.startTime.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="shift-end"
                      className="block text-[11px] font-bold text-on-surface-variant mb-1.5 uppercase tracking-wide"
                    >
                      Jam Keluar <span aria-hidden="true" className="text-error">*</span>
                    </label>
                    <input
                      id="shift-end"
                      type="time"
                      {...register("endTime")}
                      className="w-full h-9 px-3 border border-outline-variant rounded-lg text-xs bg-surface focus:ring-1 focus:ring-primary focus:outline-hidden"
                      aria-required="true"
                      aria-describedby={errors.endTime ? "end-error" : undefined}
                    />
                    {errors.endTime && (
                      <p id="end-error" role="alert" className="text-[11px] text-error mt-1">
                        {errors.endTime.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Midnight crossing hint */}
                {isFormMidnightCrossing && (
                  <div className="flex items-center gap-2 text-[11px] text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
                    <Moon size={13} />
                    <span>Shift ini lintas tengah malam — karyawan dapat checkout keesokan harinya.</span>
                  </div>
                )}

                {/* Tolerance fields */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label
                      htmlFor="grace-period"
                      className="block text-[11px] font-bold text-on-surface-variant mb-1.5 uppercase tracking-wide"
                    >
                      Grace Period (menit)
                    </label>
                    <input
                      id="grace-period"
                      type="number"
                      min={0}
                      max={120}
                      {...register("gracePeriodMinutes", { valueAsNumber: true })}
                      className="w-full h-9 px-3 border border-outline-variant rounded-lg text-xs bg-surface focus:ring-1 focus:ring-primary focus:outline-hidden"
                      aria-describedby={errors.gracePeriodMinutes ? "grace-error" : undefined}
                    />
                    {errors.gracePeriodMinutes && (
                      <p id="grace-error" role="alert" className="text-[11px] text-error mt-1">
                        {errors.gracePeriodMinutes.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="checkout-tolerance"
                      className="block text-[11px] font-bold text-on-surface-variant mb-1.5 uppercase tracking-wide"
                    >
                      Toleransi CO (menit)
                    </label>
                    <input
                      id="checkout-tolerance"
                      type="number"
                      min={0}
                      max={240}
                      {...register("checkoutToleranceMinutes", { valueAsNumber: true })}
                      className="w-full h-9 px-3 border border-outline-variant rounded-lg text-xs bg-surface focus:ring-1 focus:ring-primary focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="break-minutes"
                      className="block text-[11px] font-bold text-on-surface-variant mb-1.5 uppercase tracking-wide"
                    >
                      Istirahat (menit)
                    </label>
                    <input
                      id="break-minutes"
                      type="number"
                      min={0}
                      max={480}
                      {...register("breakMinutes", { valueAsNumber: true })}
                      className="w-full h-9 px-3 border border-outline-variant rounded-lg text-xs bg-surface focus:ring-1 focus:ring-primary focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Work Days */}
                <div>
                  <p className="text-[11px] font-bold text-on-surface-variant mb-2 uppercase tracking-wide">
                    Hari Kerja <span aria-hidden="true" className="text-error">*</span>
                  </p>
                  <div className="flex flex-wrap gap-2" role="group" aria-label="Pilih hari kerja">
                    {ALL_DAYS.map((day) => {
                      const isSelected = watchedWorkDays.includes(day.key);
                      return (
                        <button
                          key={day.key}
                          type="button"
                          onClick={() => toggleDaySelection(day.key)}
                          aria-pressed={isSelected}
                          className={`h-8 px-3 rounded-lg text-[11px] font-bold border transition-colors ${
                            isSelected
                              ? "bg-primary text-white border-primary"
                              : "bg-surface text-on-surface-variant border-outline-variant hover:border-primary hover:text-primary"
                          }`}
                        >
                          {day.short}
                        </button>
                      );
                    })}
                  </div>
                  {errors.workDays && (
                    <p role="alert" className="text-[11px] text-error mt-1">
                      {errors.workDays.message}
                    </p>
                  )}
                </div>

                {/* Effective From */}
                <div>
                  <label
                    htmlFor="effective-from"
                    className="block text-[11px] font-bold text-on-surface-variant mb-1.5 uppercase tracking-wide"
                  >
                    Berlaku Mulai
                  </label>
                  <input
                    id="effective-from"
                    type="date"
                    {...register("effectiveFrom")}
                    className="w-full h-9 px-3 border border-outline-variant rounded-lg text-xs bg-surface focus:ring-1 focus:ring-primary focus:outline-hidden"
                  />
                  <p className="text-[10px] text-on-surface-variant mt-1">
                    Kosongkan untuk menggunakan tanggal hari ini. Perubahan tidak mempengaruhi histori absensi.
                  </p>
                </div>
              </div>

              {/* Dialog Footer */}
              <div className="px-6 py-4 border-t border-outline-variant bg-surface-container/30 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowFormDialog(false)}
                  disabled={formSubmitting}
                  className="h-9 px-4 border border-outline-variant rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="h-9 px-5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/95 transition-colors disabled:opacity-70 flex items-center gap-2"
                >
                  {formSubmitting && <Loader2 size={13} className="animate-spin" />}
                  {editingShift ? "Simpan Perubahan" : "Buat Shift"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Assign Shift Dialog ──────────────────────────────────────── */}
      {showAssignDialog && assignTargetShift && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="assign-dialog-title"
        >
          <div className="bg-surface w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
            {/* Dialog Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface-container/40">
              <div>
                <h3
                  id="assign-dialog-title"
                  className="text-sm font-bold text-on-surface"
                >
                  Tetapkan Shift
                </h3>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  Shift: <strong>{assignTargetShift.name}</strong> (
                  {assignTargetShift.startTime} – {assignTargetShift.endTime})
                </p>
              </div>
              <button
                onClick={() => setShowAssignDialog(false)}
                aria-label="Tutup dialog"
                className="h-7 w-7 rounded-md hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Employee list */}
            <div className="overflow-y-auto flex-1 px-6 py-4">
              {assignError && (
                <div
                  role="alert"
                  className="flex items-center gap-2 text-[11px] text-error bg-error/5 border border-error/20 rounded-lg px-3 py-2 mb-3"
                >
                  <AlertCircle size={13} />
                  <span>{assignError}</span>
                </div>
              )}

              <p className="text-[11px] text-on-surface-variant mb-3">
                Pilih karyawan yang akan ditetapkan ke shift ini:
              </p>

              {employeesLoading ? (
                <div className="py-6 flex items-center justify-center gap-2 text-on-surface-variant">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-xs font-semibold">Memuat...</span>
                </div>
              ) : employeesWithoutShift.length === 0 ? (
                <div className="py-6 text-center">
                  <Check size={20} className="mx-auto text-emerald-500 mb-2" />
                  <p className="text-xs font-semibold text-on-surface-variant">
                    Semua karyawan sudah memiliki shift.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {employeesWithoutShift.map((emp) => {
                    const isSelected = selectedEmployeeIds.includes(emp.id);
                    return (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => toggleEmployeeSelection(emp.id)}
                        aria-pressed={isSelected}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-colors ${
                          isSelected
                            ? "bg-primary/5 border-primary ring-1 ring-primary/20"
                            : "border-outline-variant hover:border-outline-variant-high hover:bg-surface-container-low/20"
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold text-on-surface">
                            {emp.fullName}
                          </p>
                          <p className="text-[10px] text-on-surface-variant">
                            {emp.employeeCode} • {emp.departmentName}
                          </p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "bg-primary border-primary text-white"
                              : "border-outline-variant"
                          }`}
                          aria-hidden="true"
                        >
                          {isSelected && <Check size={12} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Dialog Footer */}
            <div className="px-6 py-4 border-t border-outline-variant bg-surface-container/30 flex items-center justify-between gap-3">
              <p className="text-[11px] text-on-surface-variant">
                {selectedEmployeeIds.length} karyawan dipilih
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAssignDialog(false)}
                  disabled={assignSubmitting}
                  className="h-9 px-4 border border-outline-variant rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleAssignSubmit}
                  disabled={selectedEmployeeIds.length === 0 || assignSubmitting}
                  className="h-9 px-5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/95 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  aria-disabled={selectedEmployeeIds.length === 0 || assignSubmitting}
                >
                  {assignSubmitting && <Loader2 size={13} className="animate-spin" />}
                  Tetapkan Shift
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
