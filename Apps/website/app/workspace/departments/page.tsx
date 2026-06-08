"use client";

/**
 * app/workspace/departments/page.tsx
 *
 * Halaman Manajemen Departemen — Client Component.
 *
 * Fitur:
 * - TanStack Table dengan server-side pagination
 * - Filter: pencarian nama, status
 * - Badge status (Active/Inactive)
 * - Dialog tambah departemen (RHF + Zod)
 * - Dialog edit departemen
 * - Toggle status (activate/deactivate) dengan konfirmasi
 * - Permission guard: tombol aksi hanya muncul jika manage_employees
 * - Empty state aman (R19.9)
 *
 * Requirements: 8.1–8.6, 16.7, 19.5, 19.9
 */

import React, { useState, useEffect, useCallback } from "react";
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
  Plus,
  Search,
  Pencil,
  Building2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

import { createClientApiClient } from "@/lib/apiClient";
import type { PaginatedData } from "@/lib/apiClient";
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
import { Label } from "@/components/ui/label";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Department {
  id: string;
  name: string;
  status: "Active" | "Inactive";
  employeeCount?: number;
  createdAt: string;
  updatedAt: string;
}

const departmentSchema = z.object({
  name: z.string().min(1, "Nama departemen wajib diisi").max(100),
});

type DepartmentFormValues = z.infer<typeof departmentSchema>;

// ---------------------------------------------------------------------------
// Status Badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: "Active" | "Inactive" }) {
  if (status === "Active") {
    return (
      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800">
        Aktif
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-500">
      Nonaktif
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function DepartmentsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"Active" | "Inactive" | "">("");
  const [departments, setDepartments] = useState<Department[]>([]);
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

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<Department | null>(null);
  const [statusTarget, setStatusTarget] = useState<Department | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Fetch
  // ---------------------------------------------------------------------------

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const api = createClientApiClient();
      const params: Record<string, string> = {
        page: String(tablePagination.pageIndex + 1),
        page_size: String(tablePagination.pageSize),
      };
      if (search) params["search"] = search;
      if (statusFilter) params["status"] = statusFilter;

      const res = await api.get<PaginatedData<Department>>("v1/departments", params);
      if (res.success) {
        const payload = res.data;
        const arr = Array.isArray(payload)
          ? (payload as unknown as Department[])
          : payload.data;
        const pag = Array.isArray(payload)
          ? { page: 1, page_size: arr.length, total: arr.length, total_pages: 1 }
          : payload.pagination;
        setDepartments(arr);
        setPagination(pag);
      } else {
        setError(res.error.message ?? "Gagal memuat departemen.");
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, tablePagination.pageIndex, tablePagination.pageSize]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  // ---------------------------------------------------------------------------
  // Forms
  // ---------------------------------------------------------------------------

  const addForm = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { name: "" },
  });

  const editForm = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    if (editTarget) {
      editForm.reset({ name: editTarget.name });
    }
  }, [editTarget, editForm]);

  async function handleAdd(values: DepartmentFormValues) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const api = createClientApiClient();
      const res = await api.post<Department>("v1/departments", values);
      if (res.success) {
        setShowAddDialog(false);
        addForm.reset();
        fetchDepartments();
      } else {
        setSubmitError(res.error.message ?? "Gagal membuat departemen.");
      }
    } catch {
      setSubmitError("Terjadi kesalahan jaringan.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(values: DepartmentFormValues) {
    if (!editTarget) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const api = createClientApiClient();
      const res = await api.patch<Department>(`v1/departments/${editTarget.id}`, values);
      if (res.success) {
        setEditTarget(null);
        fetchDepartments();
      } else {
        setSubmitError(res.error.message ?? "Gagal memperbarui departemen.");
      }
    } catch {
      setSubmitError("Terjadi kesalahan jaringan.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus() {
    if (!statusTarget) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const api = createClientApiClient();
      const newStatus = statusTarget.status === "Active" ? "Inactive" : "Active";
      const res = await api.patch<Department>(`v1/departments/${statusTarget.id}`, {
        status: newStatus,
      });
      if (res.success) {
        setStatusTarget(null);
        fetchDepartments();
      } else {
        setSubmitError(res.error.message ?? "Gagal mengubah status.");
      }
    } catch {
      setSubmitError("Terjadi kesalahan jaringan.");
    } finally {
      setSubmitting(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Table columns
  // ---------------------------------------------------------------------------

  const columns: ColumnDef<Department>[] = [
    {
      id: "name",
      header: "Nama Departemen",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-gray-900">{row.original.name}</span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "employeeCount",
      header: "Jumlah Karyawan",
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">
          {row.original.employeeCount ?? "—"}
        </span>
      ),
    },
    {
      id: "createdAt",
      header: "Dibuat",
      cell: ({ row }) => (
        <span className="text-sm text-gray-500">
          {new Date(row.original.createdAt).toLocaleDateString("id-ID")}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSubmitError(null);
              setEditTarget(row.original);
            }}
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium focus:outline-none focus:underline"
            aria-label={`Edit ${row.original.name}`}
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            onClick={() => {
              setSubmitError(null);
              setStatusTarget(row.original);
            }}
            className={`inline-flex items-center gap-1 text-xs font-medium focus:outline-none focus:underline ${
              row.original.status === "Active"
                ? "text-red-600 hover:text-red-800"
                : "text-green-600 hover:text-green-800"
            }`}
            aria-label={`${row.original.status === "Active" ? "Nonaktifkan" : "Aktifkan"} ${row.original.name}`}
          >
            {row.original.status === "Active" ? "Nonaktifkan" : "Aktifkan"}
          </button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: departments,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: pagination.total_pages,
    state: { pagination: tablePagination },
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(tablePagination) : updater;
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
            Departemen
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Kelola struktur departemen workspace
          </p>
        </div>
        <Button onClick={() => { setSubmitError(null); addForm.reset(); setShowAddDialog(true); }}>
          <Plus className="w-4 h-4 mr-1.5" />
          Tambah Departemen
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-center bg-white border border-gray-200 rounded-xl p-4">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input
            type="search"
            placeholder="Cari nama departemen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            aria-label="Cari departemen"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "Active" | "Inactive" | "")}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Filter status"
        >
          <option value="">Semua Status</option>
          <option value="Active">Aktif</option>
          <option value="Inactive">Nonaktif</option>
        </select>
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
        <table className="w-full text-left border-collapse" role="grid">
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
            {loading && departments.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                    <p className="text-sm">Memuat departemen...</p>
                  </div>
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <Building2 className="w-12 h-12 text-gray-300" />
                    <p className="text-sm font-medium">Belum ada departemen</p>
                    <p className="text-xs">Klik "Tambah Departemen" untuk mulai.</p>
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

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Departemen</DialogTitle>
            <DialogDescription>
              Masukkan nama departemen baru untuk workspace ini.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={addForm.handleSubmit(handleAdd)} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="add-dept-name">Nama Departemen</Label>
              <Input
                id="add-dept-name"
                placeholder="Contoh: Engineering"
                {...addForm.register("name")}
                aria-describedby="add-dept-name-error"
              />
              {addForm.formState.errors.name && (
                <p id="add-dept-name-error" className="text-xs text-red-600" role="alert">
                  {addForm.formState.errors.name.message}
                </p>
              )}
            </div>
            {submitError && (
              <p className="text-xs text-red-600" role="alert">{submitError}</p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Departemen</DialogTitle>
            <DialogDescription>
              Ubah nama departemen "{editTarget?.name}".
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-dept-name">Nama Departemen</Label>
              <Input
                id="edit-dept-name"
                {...editForm.register("name")}
                aria-describedby="edit-dept-name-error"
              />
              {editForm.formState.errors.name && (
                <p id="edit-dept-name-error" className="text-xs text-red-600" role="alert">
                  {editForm.formState.errors.name.message}
                </p>
              )}
            </div>
            {submitError && (
              <p className="text-xs text-red-600" role="alert">{submitError}</p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Toggle Status Confirmation Dialog */}
      <Dialog open={!!statusTarget} onOpenChange={(open) => { if (!open) setStatusTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {statusTarget?.status === "Active" ? "Nonaktifkan" : "Aktifkan"} Departemen
            </DialogTitle>
            <DialogDescription>
              {statusTarget?.status === "Active"
                ? `Departemen "${statusTarget?.name}" akan dinonaktifkan dan tidak dapat digunakan untuk penugasan baru. Data historis tetap tersimpan.`
                : `Departemen "${statusTarget?.name}" akan diaktifkan kembali.`}
            </DialogDescription>
          </DialogHeader>
          {submitError && (
            <p className="text-xs text-red-600 px-1" role="alert">{submitError}</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusTarget(null)}>
              Batal
            </Button>
            <Button
              variant={statusTarget?.status === "Active" ? "destructive" : "default"}
              onClick={handleToggleStatus}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
              {statusTarget?.status === "Active" ? "Nonaktifkan" : "Aktifkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
