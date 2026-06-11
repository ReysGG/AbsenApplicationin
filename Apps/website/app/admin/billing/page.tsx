"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CreditCard, Plus, Receipt, BarChart3 } from "lucide-react";
import { PageHeader } from "../_components/PageHeader";
import { StatCard } from "../_components/StatCard";
import { Invoice } from "./_components/types";
import { RevenueChart } from "./_components/RevenueChart";
import { InvoiceTable } from "./_components/InvoiceTable";
import { InvoiceDrawer } from "./_components/InvoiceDrawer";
import { CreateInvoiceModal } from "./_components/CreateInvoiceModal";
import { createClientApiClient } from "@/lib/apiClient";

interface TenantLite {
  id: string;
  name: string;
}

const currency = (n: number) =>
  `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tenants, setTenants] = useState<TenantLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<"All" | "Paid" | "Pending" | "Overdue">("All");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const api = createClientApiClient();
      const [invRes, tenRes] = await Promise.all([
        api.get<Invoice[]>("v1/platform/invoices"),
        api.get<TenantLite[]>("v1/platform/tenants"),
      ]);
      if (invRes.success) setInvoices(invRes.data);
      else setError(invRes.error.message ?? "Gagal memuat invoice.");
      if (tenRes.success) setTenants(tenRes.data.map((t) => ({ id: t.id, name: t.name })));
    } catch {
      setError("Terjadi kesalahan jaringan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateInvoice = async (data: {
    tenant: string;
    plan: "Enterprise" | "Pro" | "Basic";
    amount: number;
    dueDate: string;
  }) => {
    const tenant = tenants.find(
      (t) => t.name.toLowerCase() === data.tenant.trim().toLowerCase()
    );
    if (!tenant) {
      setError(`Tenant "${data.tenant}" tidak ditemukan. Pilih nama tenant yang ada.`);
      return;
    }
    try {
      const api = createClientApiClient();
      const res = await api.post("v1/platform/invoices", {
        tenantId: tenant.id,
        plan: data.plan,
        amount: data.amount,
        dueDate: data.dueDate || undefined,
      });
      if (res.success) {
        setIsCreateModalOpen(false);
        fetchData();
      } else {
        setError(res.error.message ?? "Gagal membuat invoice.");
      }
    } catch {
      setError("Gagal membuat invoice.");
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: "Paid" | "Pending" | "Overdue") => {
    try {
      const api = createClientApiClient();
      const res = await api.patch<Invoice>(`v1/platform/invoices/${id}/status`, {
        status: newStatus,
      });
      if (res.success) {
        setInvoices((prev) => prev.map((inv) => (inv.id === id ? res.data : inv)));
        if (selectedInvoice?.id === id) setSelectedInvoice(res.data);
      } else {
        setError(res.error.message ?? "Gagal memperbarui status.");
      }
    } catch {
      setError("Gagal memperbarui status.");
    }
  };

  // Filter invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.tenant.toLowerCase().includes(search.toLowerCase()) ||
      inv.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusTab === "All" || inv.status === statusTab;
    return matchesSearch && matchesStatus;
  });

  // Derive stats from real invoices.
  const mrr = invoices
    .filter((i) => i.status === "Paid")
    .reduce((sum, i) => sum + i.amount, 0);
  const outstanding = invoices
    .filter((i) => i.status !== "Paid")
    .reduce((sum, i) => sum + i.amount, 0);
  const pendingCount = invoices.filter((i) => i.status !== "Paid").length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <PageHeader
        title="Financial Overview"
        description="Monitor revenue, track MRR, and manage outstanding invoices."
      >
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-xs font-semibold hover:bg-primary/95 transition-colors shadow-sm flex items-center gap-1.5"
        >
          <Plus size={16} />
          Create Invoice
        </button>
      </PageHeader>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-xs font-medium">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Stats Cards — derived from real invoices */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Paid Revenue (MRR)"
          value={currency(mrr)}
          changeLabel="from paid invoices"
          icon={<CreditCard size={20} />}
          iconBgColor="bg-primary/10"
          iconColor="text-primary"
          gradientCls="bg-primary/5"
        />
        <StatCard
          title="Total Outstanding"
          value={currency(outstanding)}
          change={pendingCount}
          changeLabel="invoices pending"
          isPositive={false}
          icon={<Receipt size={20} />}
          iconBgColor="bg-amber-500/10"
          iconColor="text-amber-600"
          gradientCls="bg-amber-500/5"
        />
        <StatCard
          title="Annual Run Rate (ARR)"
          value={currency(mrr * 12)}
          changeLabel="MRR × 12"
          icon={<BarChart3 size={20} />}
          iconBgColor="bg-emerald-500/10"
          iconColor="text-emerald-600"
          gradientCls="bg-emerald-500/5"
        />
      </div>

      {loading ? (
        <div className="text-sm text-gray-500 py-12 text-center">Memuat invoice…</div>
      ) : (
        <>
          {/* Charts & Table Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <RevenueChart />
            <InvoiceTable
              invoices={invoices}
              filteredInvoices={filteredInvoices}
              search={search}
              setSearch={setSearch}
              statusTab={statusTab}
              setStatusTab={setStatusTab}
              onSelectInvoice={setSelectedInvoice}
            />
          </div>

          {/* Drawer */}
          <InvoiceDrawer
            selectedInvoice={selectedInvoice}
            onClose={() => setSelectedInvoice(null)}
            onUpdateStatus={handleUpdateStatus}
          />

          {/* Modal */}
          <CreateInvoiceModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onCreateInvoice={handleCreateInvoice}
          />
        </>
      )}
    </div>
  );
}
