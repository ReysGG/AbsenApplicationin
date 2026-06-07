import React from "react";
import { Search, CheckCircle2, Clock, AlertCircle, FileText } from "lucide-react";
import { Invoice } from "./types";

interface InvoiceTableProps {
  invoices: Invoice[];
  filteredInvoices: Invoice[];
  search: string;
  setSearch: (s: string) => void;
  statusTab: "All" | "Paid" | "Pending" | "Overdue";
  setStatusTab: (s: "All" | "Paid" | "Pending" | "Overdue") => void;
  onSelectInvoice: (inv: Invoice) => void;
}

export function InvoiceTable({
  invoices,
  filteredInvoices,
  search,
  setSearch,
  statusTab,
  setStatusTab,
  onSelectInvoice,
}: InvoiceTableProps) {
  return (
    <div className="lg:col-span-12 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col justify-between">
      <div className="p-6 pb-0">
        <h3 className="font-headline-md font-semibold mb-4 text-xs uppercase tracking-wider text-slate-500">
          Recent Invoices
        </h3>
        {/* Filters Tabs */}
        <div className="flex flex-wrap gap-4 sm:gap-6 border-b border-outline-variant/60">
          {(["All", "Paid", "Pending", "Overdue"] as const).map((tab) => {
            const count = invoices.filter((i) => i.status === tab).length;
            return (
              <button
                key={tab}
                onClick={() => setStatusTab(tab)}
                className={`pb-3 px-1 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                  statusTab === tab
                    ? "border-navy text-navy"
                    : "border-transparent text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {tab} Invoices
                {tab !== "All" && count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      tab === "Paid"
                        ? "bg-emerald-50 text-emerald-700"
                        : tab === "Pending"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/70" size={16} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Invoice ID or Tenant..."
            className="w-full pl-9 pr-4 py-2 bg-surface border border-outline-variant rounded-lg text-xs font-medium focus:ring-2 focus:ring-navy focus:outline-none transition-all"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-6">Invoice ID</th>
              <th className="py-3 px-6">Tenant</th>
              <th className="py-3 px-6">Plan</th>
              <th className="py-3 px-6">Amount</th>
              <th className="py-3 px-6">Status</th>
              <th className="py-3 px-6">Due Date</th>
              <th className="py-3 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30 text-xs">
            {filteredInvoices.length > 0 ? (
              filteredInvoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => onSelectInvoice(invoice)}
                >
                  <td className="py-4 px-6 font-semibold text-xs text-on-surface">{invoice.id}</td>
                  <td className="py-4 px-6 font-semibold text-xs text-on-surface">{invoice.tenant}</td>
                  <td className="py-4 px-6 text-xs text-on-surface-variant/80">{invoice.plan}</td>
                  <td className="py-4 px-6 font-semibold text-xs">${invoice.amount.toFixed(2)}</td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                        invoice.status === "Paid"
                          ? "text-emerald-600"
                          : invoice.status === "Pending"
                          ? "text-amber-600"
                          : "text-rose-600"
                      }`}
                    >
                      {invoice.status === "Paid" ? (
                        <CheckCircle2 size={12} />
                      ) : invoice.status === "Pending" ? (
                        <Clock size={12} />
                      ) : (
                        <AlertCircle size={12} />
                      )}
                      {invoice.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-xs text-on-surface-variant/80">{invoice.dueDate}</td>
                  <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onSelectInvoice(invoice)}
                        className="p-1.5 text-on-surface-variant hover:text-navy hover:bg-emerald-50 rounded-md transition-colors"
                      >
                        <FileText size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-on-surface-variant/70 text-xs">
                  No invoices found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
