import React, { useState } from "react";
import { Modal } from "../../_components/Modal";
import { Send } from "lucide-react";
import { AdminUser } from "./types";

interface InviteAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (data: {
    name: string;
    email: string;
    role: AdminUser["role"];
  }) => void;
}

export function InviteAdminModal({ isOpen, onClose, onInvite }: InviteAdminModalProps) {
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AdminUser["role"]>("Platform Admin");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    onInvite({
      name: inviteName,
      email: inviteEmail,
      role: inviteRole,
    });

    setInviteName("");
    setInviteEmail("");
    setInviteRole("Platform Admin");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invite New Admin"
      description="Send an invitation email to add a new team member."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1.5">Full Name</label>
          <input
            type="text"
            required
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
            placeholder="e.g. Sarah Jenkins"
            className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-sm text-on-surface focus:ring-2 focus:ring-navy focus:outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1.5">Email Address</label>
          <input
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="sarah.j@attendx.com"
            className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-sm text-on-surface focus:ring-2 focus:ring-navy focus:outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-navy mb-1.5">Role Assignment</label>
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as AdminUser["role"])}
            className="w-full px-3 py-2 bg-surface border border-navy/30 rounded-lg text-sm text-on-surface focus:ring-2 focus:ring-navy focus:outline-none transition-all"
          >
            <option value="Platform Admin">Platform Admin</option>
            <option value="Super Admin">Super Admin</option>
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
            className="px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy/90 transition-colors text-xs font-semibold flex items-center gap-1.5"
          >
            <Send size={14} /> Send Invite
          </button>
        </div>
      </form>
    </Modal>
  );
}
