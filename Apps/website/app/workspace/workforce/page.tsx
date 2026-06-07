"use client";

/**
 * app/workspace/workforce/page.tsx
 *
 * Halaman Manajemen Karyawan — Client Component.
 *
 * Fitur:
 * - TanStack Table dengan server-side pagination (R16.7)
 * - Filter: pencarian, status, departemen
 * - Badge status karyawan dengan warna (Active=hijau, Inactive=abu, Suspended=kuning, Archived=abu+strikethrough) (R7.10, R19.5)
 * - Warning ikon shift/lokasi belum diatur di samping nama (R7.12, R19.5)
 * - Empty state yang aman: "Belum ada karyawan" (R19.9)
 * - Form tambah karyawan (RHF + Zod) di Dialog (R7.3)
 * - Form edit karyawan (sama tapi tanpa email, pre-filled)
 * - Dialog konfirmasi ubah status (archive/reactivate/suspend)
 * - Permission guard: tombol "Tambah Karyawan" hanya muncul jika manage_employees
 *
 * Requirements: 7.10, 7.12, 16.7, 19.5, 19.9
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type PaginationState,
} from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  UserPlus,
  Search,
  AlertTriangle,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Pencil,
  MoreHorizontal,
  Users,
  AlertCircle,
  Mail,
  RefreshCw,
} from "lucide-react";

import { createClientApiClient } from "@/lib/apiClient";
import type { PaginatedData } from "@/lib/apiClient";
import { canManageEmployees } from "@/lib/permissionGuards";
import type {
  Employee,
  WorkforceFilters,
  Department,
  Shift,
  Location,
  StatusChangeTarget,
  StatusChangeAction,
  AddEmployeeFormValues,
  EditEmployeeFormValues,
  WorkMode,
} from "@/types/workforce";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";

// ---------------------------------------------------------------------------
// Helpers & constants
// ---------------------------------------------------------------------------

const PAGE_SIZE_DEFAULT = 25;

/** Map employment status → badge variant (R7.10, R19.5) */
function getStatusBadgeVariant(
  status: Employee["employmentStatus"]
): React.ComponentProps<typeof Badge>["variant"] {
  switch (status) {
    case "Active":
      return "active";
    case "Inactive":
      return "inactive";
    case "Suspended":
      return "suspended";
    case "Archived":
      return "archived";
    default:
      return "outline";
  }
}

/** Human-readable label for employment status */
function statusLabel(status: Employee["employmentStatus"]): string {
  switch (status) {
    case "Active":
      return "Aktif";
    case "Inactive":
      return "Tidak Aktif";
    case "Suspended":
      return "Ditangguhkan";
    case "Archived":
      return "Diarsipkan";
    default:
      return status;
  }
}

/** Map account status */
function accountStatusLabel(status: Employee["accountStatus"]): string {
  switch (status) {
    case "Active":
      return "Aktif";
    case "Pending_Activation":
      return "Menunggu Aktivasi";
    case "Disabled":
      return "Dinonaktifkan";
    case "No_Login_Access":
      return "Tanpa Akses Login";
    default:
      return status;
  }
}

/** Map work mode → badge variant */
function workModeBadgeVariant(
  mode: Employee["workMode"]
): React.ComponentProps<typeof Badge>["variant"] {
  switch (mode) {
    case "WFO":
      return "wfo";
    case "WFH":
      return "wfh";
    case "Hybrid":
      return "hybrid";
    default:
      return "outline";
  }
}

/** Status action options */
function getStatusActions(
  status: Employee["employmentStatus"]
): { action: StatusChangeAction; label: string }[] {
  switch (status) {
    case "Active":
      return [
        { action: "suspend", label: "Tangguhkan" },
        { action: "archive", label: "Arsipkan" },
      ];
    case "Suspended":
      return [
        { action: "activate", label: "Aktifkan" },
        { action: "archive", label: "Arsipkan" },
      ];
    case "Inactive":
      return [
        { action: "activate", label: "Aktifkan" },
        { action: "archive", label: "Arsipkan" },
      ];
    case "Archived":
      return [{ action: "reactivate", label: "Aktifkan Kembali" }];
    default:
      return [];
  }
}

/** Confirmation message per action */
function statusConfirmMessage(
  action: StatusChangeAction,
  name: string
): string {
  switch (action) {
    case "archive":
      return `Apakah Anda yakin ingin mengarsipkan karyawan ${name}? Karyawan tidak akan bisa absen tetapi data histori tetap tersimpan.`;
    case "reactivate":
      return `Aktifkan kembali karyawan ${name}?`;
    case "suspend":
      return `Tangguhkan akun karyawan ${name}?`;
    case "activate":
      return `Aktifkan karyawan ${name}?`;
    default:
      return "Konfirmasi perubahan status?";
  }
}

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const addEmployeeSchema = z.object({
  fullName: z.string().min(1, "Nama lengkap wajib diisi"),
  email: z.string().email("Format email tidak valid"),
  employeeCode: z.string().optional(),
  phone: z.string().optional(),
  departmentId: z.string().min(1, "Departemen wajib dipilih"),
  position: z.string().optional(),
  workMode: z.enum(["WFO", "WFH", "Hybrid"] as const),
  assignedShiftId: z.string().optional(),
  assignedLocationId: z.string().min(1, "Lokasi wajib dipilih"),
  joinedAt: z.string().min(1, "Tanggal bergabung wajib diisi"),
});

const editEmployeeSchema = z.object({
  fullName: z.string().min(1, "Nama lengkap wajib diisi"),
  employeeCode: z.string().optional(),
  phone: z.string().optional(),
  departmentId: z.string().min(1, "Departemen wajib dipilih"),
  position: z.string().optional(),
  workMode: z.enum(["WFO", "WFH", "Hybrid"] as const),
  assignedShiftId: z.string().optional(),
  assignedLocationId: z.string().min(1, "Lokasi wajib dipilih"),
  joinedAt: z.string().min(1, "Tanggal bergabung wajib diisi"),
});

// ---------------------------------------------------------------------------
// Warning icon component (R7.12, R19.5 — not color-only)
// ---------------------------------------------------------------------------

function ShiftWarning() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="inline-flex items-center text-amber-500 ml-1"
          aria-label="Shift belum diatur"
        >
          <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="sr-only">Shift belum diatur</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p>Shift belum diatur</p>
      </TooltipContent>
    </Tooltip>
  );
}

function LocationWarning() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="inline-flex items-center text-red-500 ml-1"
          aria-label="Lokasi belum diatur"
        >
          <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="sr-only">Lokasi belum diatur</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p>Lokasi belum diatur</p>
      </TooltipContent>
    </Tooltip>
  );
}

// ---------------------------------------------------------------------------
// Status action dropdown
// ---------------------------------------------------------------------------

function StatusActionMenu({
  employee,
  onAction,
  canManage,
}: {
  employee: Employee;
  onAction: (target: StatusChangeTarget) => void;
  canManage: boolean;
}) {
  const [open, setOpen] = useState(false);
  const actions = getStatusActions(employee.employmentStatus);

  if (!canManage || actions.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-7 w-7 rounded-md border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
        aria-label="Opsi status"
        aria-expanded={open}
      >
        <MoreHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]">
            {actions.map(({ action, label }) => (
              <button
                key={action}
                onClick={() => {
                  setOpen(false);
                  onAction({ employee, action });
                }}
                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors ${
                  action === "archive"
                    ? "text-red-600 hover:bg-red-50"
                    : action === "suspend"
                    ? "text-amber-600 hover:bg-amber-50"
                    : "text-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Employee form (shared between Add and Edit)
// ---------------------------------------------------------------------------

interface EmployeeFormFieldsProps {
  form: ReturnType<typeof useForm<AddEmployeeFormValues>> | ReturnType<typeof useForm<EditEmployeeFormValues>>;
  isEdit?: boolean;
  departments: Department[];
  shifts: Shift[];
  locations: Location[];
}

function EmployeeFormFields({
  form,
  isEdit = false,
  departments,
  shifts,
  locations,
}: EmployeeFormFieldsProps) {
  const addForm = form as ReturnType<typeof useForm<AddEmployeeFormValues>>;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* Nama Lengkap */}
      <FormField
        control={addForm.control}
        name="fullName"
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>
              Nama Lengkap <span className="text-red-500">*</span>
            </FormLabel>
            <FormControl>
              <Input placeholder="Contoh: Budi Santoso" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Email (hanya pada form Tambah) */}
      {!isEdit && (
        <FormField
          control={addForm.control}
          name={"email" as keyof AddEmployeeFormValues}
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>
                Email <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="email@perusahaan.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Kode Karyawan */}
      <FormField
        control={addForm.control}
        name="employeeCode"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Kode Karyawan</FormLabel>
            <FormControl>
              <Input placeholder="EMP-2024-0001" {...field} value={field.value ?? ""} />
            </FormControl>
            <FormDescription>
              Kosongkan untuk auto-generate
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* No. Telepon */}
      <FormField
        control={addForm.control}
        name="phone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>No. Telepon</FormLabel>
            <FormControl>
              <Input placeholder="08xxxxxxxxxx" {...field} value={field.value ?? ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Departemen */}
      <FormField
        control={addForm.control}
        name="departmentId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Departemen <span className="text-red-500">*</span>
            </FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih departemen" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {departments
                  .filter((d) => d.status === "Active")
                  .map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Jabatan */}
      <FormField
        control={addForm.control}
        name="position"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Jabatan</FormLabel>
            <FormControl>
              <Input placeholder="Contoh: Staff HR" {...field} value={field.value ?? ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Mode Kerja */}
      <FormField
        control={addForm.control}
        name="workMode"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Mode Kerja <span className="text-red-500">*</span>
            </FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih mode kerja" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="WFO">WFO (Work from Office)</SelectItem>
                <SelectItem value="WFH">WFH (Work from Home)</SelectItem>
                <SelectItem value="Hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Shift */}
      <FormField
        control={addForm.control}
        name="assignedShiftId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Shift</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value ?? ""}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih shift" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {shifts
                  .filter((s) => s.status === "Active")
                  .map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.startTime}–{s.endTime})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Lokasi */}
      <FormField
        control={addForm.control}
        name="assignedLocationId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Lokasi <span className="text-red-500">*</span>
            </FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih lokasi" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {locations
                  .filter((l) => l.status === "Active")
                  .map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name} ({l.type})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Tanggal Bergabung */}
      <FormField
        control={addForm.control}
        name="joinedAt"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Tanggal Bergabung <span className="text-red-500">*</span>
            </FormLabel>
            <FormControl>
              <Input type="date" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function WorkforcePage() {
  // --- Permission (naive: we assume user loaded in layout has permissions)
  // In a real app, use a context/store. We check manage_employees from the
  // window's user object or default to true for Stakeholder.
  const [currentUser] = useState(() => ({
    id: "",
    email: "",
    name: "",
    roles: ["stakeholder"],
    permissions: [] as string[],
  }));
  const canManage = canManageEmployees(currentUser);

  // --- Employees data state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // --- Reference data
  const [departments, setDepartments] = useState<Department[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  // --- Filters & pagination
  const [filters, setFilters] = useState<WorkforceFilters>({
    search: "",
    status: "",
    departmentId: "",
    page: 1,
    pageSize: PAGE_SIZE_DEFAULT,
  });

  // TanStack Table pagination state (controlled externally)
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE_DEFAULT,
  });

  // --- Dialog state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<Employee | null>(null);
  const [statusTarget, setStatusTarget] = useState<StatusChangeTarget | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // --- Forms
  const addForm = useForm<AddEmployeeFormValues>({
    resolver: zodResolver(addEmployeeSchema),
    defaultValues: {
      fullName: "",
      email: "",
      employeeCode: "",
      phone: "",
      departmentId: "",
      position: "",
      workMode: "WFO",
      assignedShiftId: "",
      assignedLocationId: "",
      joinedAt: "",
    },
  });

  const editForm = useForm<EditEmployeeFormValues>({
    resolver: zodResolver(editEmployeeSchema),
    defaultValues: {
      fullName: "",
      employeeCode: "",
      phone: "",
      departmentId: "",
      position: "",
      workMode: "WFO",
      assignedShiftId: "",
      assignedLocationId: "",
      joinedAt: "",
    },
  });

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchEmployees = useCallback(async (f: WorkforceFilters) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const api = createClientApiClient();
      const params: Record<string, string> = {
        page: String(f.page),
        page_size: String(f.pageSize),
      };
      if (f.search) params.search = f.search;
      if (f.status) params.status = f.status;
      if (f.departmentId) params.department_id = f.departmentId;

      const res = await api.get<PaginatedData<Employee>>(
        "v1/employees",
        params
      );
      if (res.success) {
        setEmployees(res.data.data ?? []);
        setTotalCount(res.data.pagination?.total ?? 0);
      } else {
        setLoadError(res.error.message || "Gagal memuat data karyawan");
        setEmployees([]);
      }
    } catch {
      setLoadError("Gagal memuat data karyawan");
      setEmployees([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchRefData = useCallback(async () => {
    const api = createClientApiClient();
    const [deptRes, shiftRes, locRes] = await Promise.allSettled([
      api.get<{ data: Department[] }>("v1/departments", { page_size: "100" }),
      api.get<{ data: Shift[] }>("v1/shifts", { page_size: "100" }),
      api.get<{ data: Location[] }>("v1/locations", { page_size: "100" }),
    ]);

    if (deptRes.status === "fulfilled" && deptRes.value.success) {
      const d = deptRes.value.data;
      setDepartments((d as unknown as { data: Department[] }).data ?? (d as unknown as Department[]));
    }
    if (shiftRes.status === "fulfilled" && shiftRes.value.success) {
      const s = shiftRes.value.data;
      setShifts((s as unknown as { data: Shift[] }).data ?? (s as unknown as Shift[]));
    }
    if (locRes.status === "fulfilled" && locRes.value.success) {
      const l = locRes.value.data;
      setLocations((l as unknown as { data: Location[] }).data ?? (l as unknown as Location[]));
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchEmployees(filters);
  }, [filters, fetchEmployees]);

  useEffect(() => {
    fetchRefData();
  }, [fetchRefData]);

  // Sync TanStack pagination → filters
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
    }));
  }, [pagination]);

  // ---------------------------------------------------------------------------
  // Table column definitions
  // ---------------------------------------------------------------------------

  const columns = useMemo<ColumnDef<Employee>[]>(
    () => [
      {
        id: "fullName",
        header: "Nama",
        cell: ({ row }) => {
          const emp = row.original;
          return (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0 border border-blue-200">
                {emp.fullName
                  .split(" ")
                  .slice(0, 2)
                  .map((w) => w[0]?.toUpperCase() ?? "")
                  .join("")}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-0.5">
                  <span className="font-medium text-gray-900 text-sm leading-tight">
                    {emp.fullName}
                  </span>
                  {/* Warning icons (R7.12, R19.5 — not color-only) */}
                  {emp.hasShiftWarning && <ShiftWarning />}
                  {emp.hasLocationWarning && <LocationWarning />}
                </div>
                <p className="text-xs text-gray-500 truncate max-w-[180px]">
                  {emp.email}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        id: "employeeCode",
        header: "Kode Karyawan",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-gray-600">
            {row.original.employeeCode || "—"}
          </span>
        ),
      },
      {
        id: "departmentName",
        header: "Divisi",
        cell: ({ row }) => (
          <span className="text-sm text-gray-700">
            {row.original.departmentName || "—"}
          </span>
        ),
      },
      {
        id: "position",
        header: "Jabatan",
        cell: ({ row }) => (
          <span className="text-sm text-gray-600">
            {row.original.position || "—"}
          </span>
        ),
      },
      {
        id: "workMode",
        header: "Mode Kerja",
        cell: ({ row }) => (
          <Badge variant={workModeBadgeVariant(row.original.workMode)}>
            {row.original.workMode}
          </Badge>
        ),
      },
      {
        id: "employmentStatus",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.employmentStatus;
          return (
            <Badge variant={getStatusBadgeVariant(status)}>
              {statusLabel(status)}
            </Badge>
          );
        },
      },
      {
        id: "accountStatus",
        header: "Status Akun",
        cell: ({ row }) => {
          const s = row.original.accountStatus;
          const variant =
            s === "Active"
              ? "active"
              : s === "Pending_Activation"
              ? "pending"
              : "inactive";
          return (
            <Badge variant={variant}>
              {accountStatusLabel(s)}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Aksi</span>,
        cell: ({ row }) => {
          const emp = row.original;
          return (
            <div className="flex items-center justify-end gap-1.5">
              {/* Edit button */}
              {canManage && (
                <button
                  onClick={() => handleEditOpen(emp)}
                  className="h-7 w-7 rounded-md border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-500 hover:text-blue-600 transition-colors"
                  aria-label={`Edit karyawan ${emp.fullName}`}
                >
                  <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}

              {/* Resend invitation (R7 — if PendingActivation) */}
              {canManage &&
                emp.accountStatus === "Pending_Activation" && (
                  <button
                    onClick={() => handleResendInvitation(emp)}
                    className="h-7 w-7 rounded-md border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-500 hover:text-green-600 transition-colors"
                    aria-label={`Kirim ulang undangan untuk ${emp.fullName}`}
                    title="Kirim Ulang Undangan"
                  >
                    <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                )}

              {/* Status change menu */}
              <StatusActionMenu
                employee={emp}
                onAction={setStatusTarget}
                canManage={canManage}
              />
            </div>
          );
        },
      },
    ],
    [canManage]
  );

  // ---------------------------------------------------------------------------
  // Table instance
  // ---------------------------------------------------------------------------

  const pageCount = Math.ceil(totalCount / filters.pageSize);

  const table = useReactTable({
    data: employees,
    columns,
    pageCount,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }));
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }

  function handleStatusFilterChange(value: string) {
    setFilters((prev) => ({
      ...prev,
      status: value === "ALL" ? "" : (value as WorkforceFilters["status"]),
      page: 1,
    }));
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }

  function handleDepartmentFilterChange(value: string) {
    setFilters((prev) => ({
      ...prev,
      departmentId: value === "ALL" ? "" : value,
      page: 1,
    }));
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }

  function handleEditOpen(emp: Employee) {
    editForm.reset({
      fullName: emp.fullName,
      employeeCode: emp.employeeCode || "",
      phone: emp.phone || "",
      departmentId: emp.departmentId || "",
      position: emp.position || "",
      workMode: emp.workMode,
      assignedShiftId: emp.assignedShiftId || "",
      assignedLocationId: emp.assignedLocationId || "",
      joinedAt: emp.joinedAt ? emp.joinedAt.split("T")[0] : "",
    });
    setEditTarget(emp);
  }

  async function handleResendInvitation(emp: Employee) {
    try {
      const api = createClientApiClient();
      await api.post(`v1/employees/${emp.id}/resend-invite`, {});
    } catch {
      // silently fail — in a real app, show a toast
    }
  }

  async function handleAddSubmit(values: AddEmployeeFormValues) {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const api = createClientApiClient();
      const payload = {
        fullName: values.fullName,
        email: values.email,
        employeeCode: values.employeeCode || undefined,
        phone: values.phone || undefined,
        departmentId: values.departmentId,
        position: values.position || undefined,
        workMode: values.workMode,
        assignedShiftId: values.assignedShiftId || undefined,
        assignedLocationId: values.assignedLocationId,
        joinedAt: values.joinedAt,
      };
      const res = await api.post("v1/employees", payload);
      if (res.success) {
        setShowAddDialog(false);
        addForm.reset();
        fetchEmployees(filters);
      } else {
        setSubmitError(res.error.message || "Gagal menambah karyawan");
      }
    } catch {
      setSubmitError("Gagal menambah karyawan");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEditSubmit(values: EditEmployeeFormValues) {
    if (!editTarget) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const api = createClientApiClient();
      const payload = {
        fullName: values.fullName,
        employeeCode: values.employeeCode || undefined,
        phone: values.phone || undefined,
        departmentId: values.departmentId,
        position: values.position || undefined,
        workMode: values.workMode,
        assignedShiftId: values.assignedShiftId || undefined,
        assignedLocationId: values.assignedLocationId,
        joinedAt: values.joinedAt,
      };
      const res = await api.patch(`v1/employees/${editTarget.id}`, payload);
      if (res.success) {
        setEditTarget(null);
        fetchEmployees(filters);
      } else {
        setSubmitError(res.error.message || "Gagal menyimpan perubahan");
      }
    } catch {
      setSubmitError("Gagal menyimpan perubahan");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStatusChange() {
    if (!statusTarget) return;
    setIsSubmitting(true);
    try {
      const api = createClientApiClient();
      const { employee, action } = statusTarget;

      let newStatus: string;
      switch (action) {
        case "archive":
          newStatus = "Archived";
          break;
        case "reactivate":
        case "activate":
          newStatus = "Active";
          break;
        case "suspend":
          newStatus = "Suspended";
          break;
        default:
          newStatus = "Active";
      }

      const res = await api.patch(`v1/employees/${employee.id}/status`, {
        status: newStatus,
      });
      if (res.success) {
        setStatusTarget(null);
        fetchEmployees(filters);
      }
    } catch {
      // silently — in a real app, show a toast
    } finally {
      setIsSubmitting(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const hasRows = employees.length > 0;
  const totalPages = pageCount;
  const currentPage = pagination.pageIndex + 1;

  return (
    <TooltipProvider>
      <div className="space-y-6 max-w-screen-xl mx-auto">
        {/* ── Page header ───────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Manajemen Karyawan
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Kelola data, status, dan penugasan karyawan workspace ini.
            </p>
          </div>
          {canManage && (
            <Button
              onClick={() => {
                addForm.reset();
                setSubmitError(null);
                setShowAddDialog(true);
              }}
              className="gap-2"
              aria-label="Tambah karyawan baru"
            >
              <UserPlus className="w-4 h-4" aria-hidden="true" />
              Tambah Karyawan
            </Button>
          )}
        </div>

        {/* ── Filter bar ────────────────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Cari nama, kode, atau email..."
              value={filters.search}
              onChange={handleSearchChange}
              className="pl-9"
              aria-label="Cari karyawan"
            />
          </div>

          <div className="flex flex-wrap gap-2 sm:ml-auto">
            {/* Status filter */}
            <Select
              value={filters.status || "ALL"}
              onValueChange={handleStatusFilterChange}
            >
              <SelectTrigger className="w-44" aria-label="Filter status karyawan">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>
                <SelectItem value="Active">Aktif</SelectItem>
                <SelectItem value="Inactive">Tidak Aktif</SelectItem>
                <SelectItem value="Suspended">Ditangguhkan</SelectItem>
                <SelectItem value="Archived">Diarsipkan</SelectItem>
              </SelectContent>
            </Select>

            {/* Department filter */}
            <Select
              value={filters.departmentId || "ALL"}
              onValueChange={handleDepartmentFilterChange}
            >
              <SelectTrigger
                className="w-44"
                aria-label="Filter departemen karyawan"
              >
                <SelectValue placeholder="Semua Divisi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Divisi</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Refresh */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => fetchEmployees(filters)}
              disabled={isLoading}
              aria-label="Perbarui data"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
            </Button>
          </div>
        </div>

        {/* ── Error notice ──────────────────────────────────────────────── */}
        {loadError && !isLoading && (
          <div
            role="alert"
            className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-sm"
          >
            <AlertCircle
              className="w-4 h-4 mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <span>{loadError}</span>
          </div>
        )}

        {/* ── Employee table ────────────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table
              className="w-full text-left border-collapse"
              aria-label="Daftar karyawan"
              aria-busy={isLoading}
            >
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr
                    key={headerGroup.id}
                    className="bg-gray-50 border-b border-gray-200"
                  >
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        scope="col"
                        className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
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
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  /* Loading skeleton */
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {columns.map((_, ci) => (
                        <td key={ci} className="py-3 px-4">
                          <div className="h-4 bg-gray-100 rounded w-24" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : hasRows ? (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="py-3 px-4 text-sm text-gray-700"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  /* Empty state (R19.9) */
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="py-16 text-center"
                    >
                      <div className="flex flex-col items-center gap-3 text-gray-400">
                        <Users
                          className="w-12 h-12 text-gray-200"
                          aria-hidden="true"
                        />
                        <p className="text-base font-medium text-gray-500">
                          Belum ada karyawan
                        </p>
                        <p className="text-sm text-gray-400">
                          {filters.search || filters.status || filters.departmentId
                            ? "Tidak ada karyawan yang cocok dengan filter saat ini."
                            : "Mulai dengan menambahkan karyawan pertama."}
                        </p>
                        {canManage &&
                          !filters.search &&
                          !filters.status &&
                          !filters.departmentId && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowAddDialog(true)}
                              className="mt-1 gap-2"
                            >
                              <UserPlus className="w-4 h-4" aria-hidden="true" />
                              Tambah Karyawan
                            </Button>
                          )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ── Pagination controls ──────────────────────────────────────── */}
          {(hasRows || isLoading) && (
            <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p className="text-xs text-gray-500">
                {isLoading ? (
                  "Memuat..."
                ) : (
                  <>
                    Menampilkan{" "}
                    <strong>
                      {(currentPage - 1) * filters.pageSize + 1}–
                      {Math.min(currentPage * filters.pageSize, totalCount)}
                    </strong>{" "}
                    dari <strong>{totalCount}</strong> karyawan
                  </>
                )}
              </p>

              <div className="flex items-center gap-1.5">
                {/* Page size selector */}
                <Select
                  value={String(pagination.pageSize)}
                  onValueChange={(v) =>
                    setPagination({ pageIndex: 0, pageSize: Number(v) })
                  }
                >
                  <SelectTrigger
                    className="h-8 w-20 text-xs"
                    aria-label="Jumlah baris per halaman"
                  >
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

                <button
                  onClick={() =>
                    setPagination((p) => ({
                      ...p,
                      pageIndex: Math.max(0, p.pageIndex - 1),
                    }))
                  }
                  disabled={!table.getCanPreviousPage() || isLoading}
                  className="h-8 w-8 flex items-center justify-center border border-gray-200 rounded-md hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Halaman sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                </button>

                {/* Page buttons */}
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const p =
                    totalPages <= 5
                      ? i + 1
                      : currentPage <= 3
                      ? i + 1
                      : currentPage >= totalPages - 2
                      ? totalPages - 4 + i
                      : currentPage - 2 + i;
                  if (p < 1 || p > totalPages) return null;
                  return (
                    <button
                      key={p}
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          pageIndex: p - 1,
                        }))
                      }
                      disabled={isLoading}
                      className={`h-8 w-8 flex items-center justify-center text-xs rounded-md border transition-colors ${
                        p === currentPage
                          ? "bg-blue-600 text-white border-blue-600 font-semibold"
                          : "border-gray-200 hover:bg-white text-gray-600"
                      } disabled:cursor-not-allowed`}
                      aria-label={`Halaman ${p}`}
                      aria-current={p === currentPage ? "page" : undefined}
                    >
                      {p}
                    </button>
                  );
                })}

                <button
                  onClick={() =>
                    setPagination((p) => ({
                      ...p,
                      pageIndex: Math.min(totalPages - 1, p.pageIndex + 1),
                    }))
                  }
                  disabled={!table.getCanNextPage() || isLoading}
                  className="h-8 w-8 flex items-center justify-center border border-gray-200 rounded-md hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Halaman selanjutnya"
                >
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Add Employee Dialog ────────────────────────────────────────── */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tambah Karyawan</DialogTitle>
              <DialogDescription>
                Isi data karyawan baru. Bidang bertanda{" "}
                <span className="text-red-500">*</span> wajib diisi.
              </DialogDescription>
            </DialogHeader>

            <Form {...addForm}>
              <form
                onSubmit={addForm.handleSubmit(handleAddSubmit)}
                className="space-y-4"
              >
                <EmployeeFormFields
                  form={addForm}
                  isEdit={false}
                  departments={departments}
                  shifts={shifts}
                  locations={locations}
                />

                {submitError && (
                  <p role="alert" className="text-sm text-red-600">
                    {submitError}
                  </p>
                )}

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddDialog(false)}
                    disabled={isSubmitting}
                  >
                    Batal
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Menyimpan..." : "Tambah Karyawan"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* ── Edit Employee Dialog ───────────────────────────────────────── */}
        <Dialog
          open={!!editTarget}
          onOpenChange={(open) => {
            if (!open) setEditTarget(null);
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Karyawan</DialogTitle>
              <DialogDescription>
                Perbarui data karyawan. Email tidak dapat diubah. Bidang
                bertanda <span className="text-red-500">*</span> wajib diisi.
              </DialogDescription>
            </DialogHeader>

            <Form {...editForm}>
              <form
                onSubmit={editForm.handleSubmit(handleEditSubmit)}
                className="space-y-4"
              >
                {/* Show email read-only for context */}
                {editTarget && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-email-display">Email</Label>
                    <Input
                      id="edit-email-display"
                      value={editTarget.email}
                      disabled
                      className="bg-gray-50 text-gray-500"
                      aria-readonly="true"
                    />
                  </div>
                )}

                <EmployeeFormFields
                  form={editForm}
                  isEdit={true}
                  departments={departments}
                  shifts={shifts}
                  locations={locations}
                />

                {submitError && (
                  <p role="alert" className="text-sm text-red-600">
                    {submitError}
                  </p>
                )}

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditTarget(null)}
                    disabled={isSubmitting}
                  >
                    Batal
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* ── Status Change Confirmation Dialog ─────────────────────────── */}
        <Dialog
          open={!!statusTarget}
          onOpenChange={(open) => {
            if (!open) setStatusTarget(null);
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {statusTarget?.action === "archive"
                  ? "Arsipkan Karyawan"
                  : statusTarget?.action === "suspend"
                  ? "Tangguhkan Karyawan"
                  : statusTarget?.action === "reactivate" ||
                    statusTarget?.action === "activate"
                  ? "Aktifkan Karyawan"
                  : "Ubah Status Karyawan"}
              </DialogTitle>
              <DialogDescription>
                {statusTarget
                  ? statusConfirmMessage(
                      statusTarget.action,
                      statusTarget.employee.fullName
                    )
                  : ""}
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStatusTarget(null)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                variant={
                  statusTarget?.action === "archive" ||
                  statusTarget?.action === "suspend"
                    ? "destructive"
                    : "default"
                }
                onClick={handleStatusChange}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Memproses..."
                  : statusTarget?.action === "archive"
                  ? "Ya, Arsipkan"
                  : statusTarget?.action === "suspend"
                  ? "Ya, Tangguhkan"
                  : "Ya, Aktifkan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
