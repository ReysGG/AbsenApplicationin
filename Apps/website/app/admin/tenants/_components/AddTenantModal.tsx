import React, { useState } from "react";
import { Modal } from "../../_components/Modal";

interface AddTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTenant: (data: {
    name: string;
    domain: string;
    plan: "Enterprise" | "Pro" | "Basic";
  }) => void;
}

export function AddTenantModal({ isOpen, onClose, onAddTenant }: AddTenantModalProps) {
  const [newName, setNewName] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [newPlan, setNewPlan] = useState<"Enterprise" | "Pro" | "Basic">("Pro");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newDomain) return;

    onAddTenant({
      name: newName,
      domain: newDomain,
      plan: newPlan,
    });

    setNewName("");
    setNewDomain("");
    setNewPlan("Pro");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Tenant"
      description="Register a new organization on the AttendX platform."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1.5">
            Company Name
          </label>
          <input
            type="text"
            required
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Acme Corp"
            className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-sm text-on-surface focus:ring-2 focus:ring-navy focus:outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1.5">
            Custom Domain
          </label>
          <div className="flex">
            <input
              type="text"
              required
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="acme"
              className="flex-1 min-w-0 px-3 py-2 bg-surface border border-outline-variant rounded-l-lg text-sm text-on-surface focus:ring-2 focus:ring-navy focus:outline-none transition-all"
            />
            <span className="inline-flex items-center px-3 rounded-r-lg border border-l-0 border-outline-variant bg-surface-container-low text-on-surface-variant text-sm select-none">
              .attendx.io
            </span>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-navy mb-1.5">
            Plan Level
          </label>
          <select
            value={newPlan}
            onChange={(e) => setNewPlan(e.target.value as "Enterprise" | "Pro" | "Basic")}
            className="w-full px-3 py-2 bg-surface border border-navy/30 rounded-lg text-sm text-on-surface focus:ring-2 focus:ring-navy focus:outline-none transition-all"
          >
            <option value="Basic">Basic ($49/mo)</option>
            <option value="Pro">Pro ($199/mo)</option>
            <option value="Enterprise">Enterprise ($499/mo)</option>
          </select>
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
            Add Tenant
          </button>
        </div>
      </form>
    </Modal>
  );
}
