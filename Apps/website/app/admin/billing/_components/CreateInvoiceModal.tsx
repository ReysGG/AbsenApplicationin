import React, { useState } from "react";
import { Modal } from "../../_components/Modal";

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateInvoice: (data: {
    tenant: string;
    plan: "Enterprise" | "Pro" | "Basic";
    amount: number;
    dueDate: string;
  }) => void;
}

export function CreateInvoiceModal({
  isOpen,
  onClose,
  onCreateInvoice,
}: CreateInvoiceModalProps) {
  const [tenantName, setTenantName] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<"Enterprise" | "Pro" | "Basic">("Pro");
  const [customAmount, setCustomAmount] = useState("199.00");
  const [dueDateInput, setDueDateInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantName || !customAmount || !dueDateInput) return;

    onCreateInvoice({
      tenant: tenantName,
      plan: selectedPlan,
      amount: parseFloat(customAmount),
      dueDate: dueDateInput,
    });

    // Reset Form
    setTenantName("");
    setSelectedPlan("Pro");
    setCustomAmount("199.00");
    setDueDateInput("");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Invoice"
      description="Issue an invoice manually for a tenant."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1.5">
            Tenant Organization
          </label>
          <input
            type="text"
            required
            value={tenantName}
            onChange={(e) => setTenantName(e.target.value)}
            placeholder="e.g. Globex Inc."
            className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-sm text-on-surface focus:ring-2 focus:ring-navy focus:outline-none transition-all"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1.5">
              Billing Plan
            </label>
            <select
              value={selectedPlan}
              onChange={(e) => {
                const plan = e.target.value as "Enterprise" | "Pro" | "Basic";
                setSelectedPlan(plan);
                setCustomAmount(
                  plan === "Enterprise" ? "499.00" : plan === "Pro" ? "199.00" : "49.00"
                );
              }}
              className="w-full px-3 py-2 bg-surface border border-navy/30 rounded-lg text-sm text-on-surface focus:ring-2 focus:ring-navy focus:outline-none transition-all"
            >
              <option value="Basic">Basic ($49/mo)</option>
              <option value="Pro">Pro ($199/mo)</option>
              <option value="Enterprise">Enterprise ($499/mo)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-navy mb-1.5">
              Invoice Amount ($)
            </label>
            <input
              type="number"
              required
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="199.00"
              className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-sm text-on-surface focus:ring-2 focus:ring-navy focus:outline-none transition-all"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1.5">
            Due Date
          </label>
          <input
            type="text"
            required
            value={dueDateInput}
            onChange={(e) => setDueDateInput(e.target.value)}
            placeholder="e.g. June 25, 2026"
            className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-sm text-on-surface focus:ring-2 focus:ring-navy focus:outline-none transition-all"
          />
        </div>
        <div className="pt-4 flex justify-end gap-3 border-t border-outline-variant mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-outline-variant rounded-lg text-on-surface hover:bg-surface-container-low transition-colors text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-navy text-white hover:bg-navy/90 rounded-lg transition-colors text-xs font-semibold"
          >
            Issue Invoice
          </button>
        </div>
      </form>
    </Modal>
  );
}
