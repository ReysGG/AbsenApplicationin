"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "../_components/PageHeader";
import { Tenant } from "./_components/types";
import { TenantTable } from "./_components/TenantTable";
import { TenantDrawer } from "./_components/TenantDrawer";
import { AddTenantModal } from "./_components/AddTenantModal";
import { createClientApiClient } from "@/lib/apiClient";

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("All");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const api = createClientApiClient();
      const res = await api.get<Tenant[]>("v1/platform/tenants");
      if (res.success) {
        setTenants(res.data);
      } else {
        setError(res.error.message ?? "Gagal memuat tenant.");
      }
    } catch {
      setError("Terjadi kesalahan jaringan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredTenants.map((t) => t.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const handleAddTenant = async (data: {
    name: string;
    domain: string;
    plan: "Enterprise" | "Pro" | "Basic";
  }) => {
    try {
      const api = createClientApiClient();
      // domain may be "acme" or "acme.attendx.io" — slug is the first label.
      const slug = data.domain.split(".")[0] || undefined;
      const res = await api.post("v1/platform/tenants", {
        name: data.name,
        slug,
        plan: data.plan,
      });
      if (res.success) {
        setIsAddModalOpen(false);
        fetchTenants();
      } else {
        setError(res.error.message ?? "Gagal menambah tenant.");
      }
    } catch {
      setError("Gagal menambah tenant.");
    }
  };

  async function bulkStatus(status: "Suspended" | "Inactive") {
    const api = createClientApiClient();
    await Promise.all(
      selectedIds.map((id) =>
        api.patch(`v1/platform/tenants/${id}/status`, { status }).catch(() => null)
      )
    );
    setSelectedIds([]);
    fetchTenants();
  }

  // Tenants own data, so they are never hard-deleted — "delete" deactivates.
  const handleDeleteSelected = () => bulkStatus("Inactive");
  const handleSuspendSelected = () => bulkStatus("Suspended");

  // Filters
  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.domain.toLowerCase().includes(search.toLowerCase());
    const matchesPlan = planFilter === "All" || t.plan === planFilter;
    return matchesSearch && matchesPlan;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <PageHeader
        title="Tenants"
        description="Manage, monitor, and provision organizations on the AttendX platform."
      >
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary hover:bg-primary/95 text-on-primary px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Plus size={18} />
          Add New Tenant
        </button>
      </PageHeader>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-xs font-medium">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-500 py-12 text-center">Memuat tenant…</div>
      ) : (
        <>
          {/* Main Table Component */}
          <TenantTable
            tenants={tenants}
            filteredTenants={filteredTenants}
            search={search}
            setSearch={setSearch}
            planFilter={planFilter}
            setPlanFilter={setPlanFilter}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelectRow={handleSelectRow}
            onSuspendSelected={handleSuspendSelected}
            onDeleteSelected={handleDeleteSelected}
            onSelectTenant={setSelectedTenant}
          />

          {/* Drawer */}
          <TenantDrawer
            selectedTenant={selectedTenant}
            onClose={() => setSelectedTenant(null)}
          />

          {/* Modal */}
          <AddTenantModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onAddTenant={handleAddTenant}
          />
        </>
      )}
    </div>
  );
}
