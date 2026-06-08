"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "../_components/PageHeader";
import { Tenant } from "./_components/types";
import { TenantTable } from "./_components/TenantTable";
import { TenantDrawer } from "./_components/TenantDrawer";
import { AddTenantModal } from "./_components/AddTenantModal";

const initialTenants: Tenant[] = [
  {
    id: "1",
    name: "Acme Corp",
    domain: "acme.attendx.io",
    plan: "Enterprise",
    users: 1245,
    status: "Active",
    lastActive: "2 hours ago",
    mrr: 499,
  },
  {
    id: "2",
    name: "Globex Inc.",
    domain: "globex.attendx.io",
    plan: "Pro",
    users: 342,
    status: "Active",
    lastActive: "5 hours ago",
    mrr: 199,
  },
  {
    id: "3",
    name: "Stark Industries",
    domain: "stark.attendx.io",
    plan: "Basic",
    users: 45,
    status: "Suspended",
    lastActive: "2 days ago",
    mrr: 49,
  },
  {
    id: "4",
    name: "Initech",
    domain: "initech.attendx.io",
    plan: "Pro",
    users: 620,
    status: "Active",
    lastActive: "1 day ago",
    mrr: 199,
  },
  {
    id: "5",
    name: "Umbrella Corp",
    domain: "umbrella.attendx.io",
    plan: "Basic",
    users: 410,
    status: "Active",
    lastActive: "3 days ago",
    mrr: 49,
  },
];

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>(initialTenants);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("All");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

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

  const handleAddTenant = (data: {
    name: string;
    domain: string;
    plan: "Enterprise" | "Pro" | "Basic";
  }) => {
    const newTenant: Tenant = {
      id: (tenants.length + 1).toString(),
      name: data.name,
      domain: data.domain.includes(".") ? data.domain : `${data.domain}.attendx.io`,
      plan: data.plan,
      users: 0,
      status: "Active",
      lastActive: "Just now",
      mrr: data.plan === "Enterprise" ? 499 : data.plan === "Pro" ? 199 : 49,
    };

    setTenants((prev) => [newTenant, ...prev]);
    setIsAddModalOpen(false);
  };

  const handleDeleteSelected = () => {
    setTenants((prev) => prev.filter((t) => !selectedIds.includes(t.id)));
    setSelectedIds([]);
  };

  const handleSuspendSelected = () => {
    setTenants((prev) =>
      prev.map((t) =>
        selectedIds.includes(t.id) ? { ...t, status: "Suspended" as const } : t
      )
    );
    setSelectedIds([]);
  };

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

      {/* Demo Mode Banner */}
      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-2.5 text-xs font-medium">
        <span>⚠️</span>
        <span>Data yang ditampilkan adalah contoh demonstrasi. Integrasi backend untuk fitur ini akan tersedia di versi mendatang.</span>
      </div>

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
    </div>
  );
}
