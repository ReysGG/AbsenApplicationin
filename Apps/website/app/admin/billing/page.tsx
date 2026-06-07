"use client";

import React, { useState } from "react";
import { CreditCard, Download, Plus, Receipt, BarChart3 } from "lucide-react";
import { PageHeader } from "../_components/PageHeader";
import { StatCard } from "../_components/StatCard";
import { Invoice } from "./_components/types";
import { RevenueChart } from "./_components/RevenueChart";
import { InvoiceTable } from "./_components/InvoiceTable";
import { InvoiceDrawer } from "./_components/InvoiceDrawer";
import { CreateInvoiceModal } from "./_components/CreateInvoiceModal";

const initialInvoices: Invoice[] = [
  {
    id: "INV-2026-001",
    tenant: "Acme Corp",
    plan: "Enterprise",
    amount: 499.0,
    status: "Paid",
    dueDate: "June 15, 2026",
    issuedDate: "June 1, 2026",
  },
  {
    id: "INV-2026-002",
    tenant: "Globex Inc.",
    plan: "Pro",
    amount: 199.0,
    status: "Pending",
    dueDate: "June 20, 2026",
    issuedDate: "June 1, 2026",
  },
  {
    id: "INV-2026-003",
    tenant: "Stark Industries",
    plan: "Enterprise",
    amount: 499.0,
    status: "Overdue",
    dueDate: "June 5, 2026",
    issuedDate: "May 20, 2026",
  },
  {
    id: "INV-2026-004",
    tenant: "Initech",
    plan: "Pro",
    amount: 199.0,
    status: "Paid",
    dueDate: "June 10, 2026",
    issuedDate: "May 25, 2026",
  },
  {
    id: "INV-2026-005",
    tenant: "Umbrella Corp",
    plan: "Basic",
    amount: 49.0,
    status: "Overdue",
    dueDate: "June 1, 2026",
    issuedDate: "May 15, 2026",
  },
  {
    id: "INV-2026-006",
    tenant: "Cyberdyne Systems",
    plan: "Enterprise",
    amount: 499.0,
    status: "Paid",
    dueDate: "June 12, 2026",
    issuedDate: "May 28, 2026",
  },
];

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<"All" | "Paid" | "Pending" | "Overdue">("All");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleCreateInvoice = (data: {
    tenant: string;
    plan: "Enterprise" | "Pro" | "Basic";
    amount: number;
    dueDate: string;
  }) => {
    const newInvoice: Invoice = {
      id: `INV-2026-0${invoices.length + 1}`,
      tenant: data.tenant,
      plan: data.plan,
      amount: data.amount,
      status: "Pending",
      dueDate: data.dueDate || "July 1, 2026",
      issuedDate: "June 6, 2026",
    };

    setInvoices((prev) => [newInvoice, ...prev]);
    setIsCreateModalOpen(false);
  };

  const handleUpdateStatus = (id: string, newStatus: "Paid" | "Pending" | "Overdue") => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status: newStatus } : inv))
    );
    if (selectedInvoice && selectedInvoice.id === id) {
      setSelectedInvoice((prev) => (prev ? { ...prev, status: newStatus } : null));
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <PageHeader
        title="Financial Overview"
        description="Monitor revenue, track MRR, and manage outstanding invoices."
      >
        <button className="px-4 py-2 bg-surface-container-lowest border border-outline-variant hover:bg-surface-container-low rounded-lg font-label-md text-xs font-semibold text-on-surface transition-colors flex items-center gap-2">
          <Download size={16} />
          Export Report
        </button>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-xs font-semibold hover:bg-primary/95 transition-colors shadow-sm flex items-center gap-1.5"
        >
          <Plus size={16} />
          Create Invoice
        </button>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Monthly Recurring Revenue"
          value="$124,500"
          change="12.5"
          changeLabel="vs last month"
          icon={<CreditCard size={20} />}
          iconBgColor="bg-primary/10"
          iconColor="text-primary"
          gradientCls="bg-primary/5"
        />
        <StatCard
          title="Total Outstanding"
          value="$18,240"
          change={14}
          changeLabel="invoices pending"
          isPositive={false}
          icon={<Receipt size={20} />}
          iconBgColor="bg-amber-500/10"
          iconColor="text-amber-600"
          gradientCls="bg-amber-500/5"
        />
        <StatCard
          title="Annual Run Rate (ARR)"
          value="$1.49M"
          change="8.2"
          changeLabel="YoY Growth"
          icon={<BarChart3 size={20} />}
          iconBgColor="bg-emerald-500/10"
          iconColor="text-emerald-600"
          gradientCls="bg-emerald-500/5"
        />
      </div>

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
    </div>
  );
}
