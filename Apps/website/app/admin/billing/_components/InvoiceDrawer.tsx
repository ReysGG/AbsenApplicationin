import React from "react";
import { CheckCircle2, AlertCircle, Send } from "lucide-react";
import { Drawer } from "../../_components/Drawer";
import { Invoice } from "./types";

interface InvoiceDrawerProps {
  selectedInvoice: Invoice | null;
  onClose: () => void;
  onUpdateStatus: (id: string, newStatus: "Paid" | "Overdue") => void;
}

export function InvoiceDrawer({
  selectedInvoice,
  onClose,
  onUpdateStatus,
}: InvoiceDrawerProps) {
  if (!selectedInvoice) return null;

  return (
    <Drawer
      isOpen={!!selectedInvoice}
      onClose={onClose}
      title={`Invoice ${selectedInvoice.id}`}
      subtitle={`Billing breakdown for ${selectedInvoice.tenant}`}
    >
      <div className="space-y-6 text-xs text-on-surface">
        {/* Quick status */}
        <div className="flex justify-between items-center bg-surface-container-low p-4 rounded-xl border border-outline-variant/60">
          <span className="font-semibold text-on-surface">Payment Status</span>
          <span
            className={`inline-flex items-center gap-1.5 font-bold ${
              selectedInvoice.status === "Paid"
                ? "text-emerald-600"
                : selectedInvoice.status === "Pending"
                ? "text-amber-600"
                : "text-rose-600"
            }`}
          >
            {selectedInvoice.status}
          </span>
        </div>

        {/* Invoice Info Details */}
        <div className="space-y-3 border-b border-outline-variant/40 pb-4">
          <div className="flex justify-between">
            <span className="text-on-surface-variant font-medium">Issued Date</span>
            <span className="font-semibold text-on-surface">{selectedInvoice.issuedDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant font-medium">Due Date</span>
            <span className="font-semibold text-on-surface">{selectedInvoice.dueDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant font-medium">Billing Plan</span>
            <span className="font-semibold text-on-surface">{selectedInvoice.plan} Plan</span>
          </div>
        </div>

        {/* Line Items */}
        <div>
          <h4 className="font-semibold text-on-surface text-sm mb-2">Invoice Summary</h4>
          <div className="bg-surface rounded-xl border border-outline-variant overflow-hidden shadow-sm">
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center font-medium">
                <span>AttendX Subscription ({selectedInvoice.plan})</span>
                <span>${selectedInvoice.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <span>Usage overage fees</span>
                <span>$0.00</span>
              </div>
              <div className="border-t border-outline-variant/30 pt-3 flex justify-between font-bold text-sm text-on-surface">
                <span>Total Amount</span>
                <span>${selectedInvoice.amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Update Status Controls */}
        <div>
          <h4 className="font-semibold text-on-surface text-sm mb-2">Manage Status</h4>
          <div className="flex gap-2">
            <button
              onClick={() => onUpdateStatus(selectedInvoice.id, "Paid")}
              disabled={selectedInvoice.status === "Paid"}
              className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
            >
              <CheckCircle2 size={14} /> Mark Paid
            </button>
            <button
              onClick={() => onUpdateStatus(selectedInvoice.id, "Overdue")}
              disabled={selectedInvoice.status === "Overdue"}
              className="flex-1 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
            >
              <AlertCircle size={14} /> Mark Overdue
            </button>
          </div>
        </div>

        {/* Email Invoice Actions */}
        <button
          onClick={() => alert("Invoice emailed to tenant administrators.")}
          className="w-full px-4 py-2 border border-outline-variant rounded-lg text-on-surface hover:bg-surface-container-low transition-colors font-semibold flex items-center justify-center gap-1.5"
        >
          <Send size={14} />
          Resend Invoice via Email
        </button>
      </div>
    </Drawer>
  );
}
