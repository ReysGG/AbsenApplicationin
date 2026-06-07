"use client";

import React, { useState } from "react";
import {
  Users,
  MapPin,
  Clock,
  Compass,
  CheckCircle,
  Plus,
  Mail,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  MapPinIcon
} from "lucide-react";

export default function StakeholderDashboard() {
  const [wfhEnabled, setWfhEnabled] = useState(true);
  const [supportAdmins, setSupportAdmins] = useState([
    { name: "Andi Wijaya", email: "andi.w@acme.com", department: "HR Operations", status: "Active" },
    { name: "Siti Amelia", email: "siti.a@acme.com", department: "Recruitment", status: "Active" }
  ]);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteDept, setInviteDept] = useState("HR Operations");
  const [showInviteSuccess, setShowInviteSuccess] = useState(false);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setSupportAdmins([
      ...supportAdmins,
      { name: inviteEmail.split("@")[0], email: inviteEmail, department: inviteDept, status: "Pending Invitation" }
    ]);
    setInviteEmail("");
    setShowInviteSuccess(true);
    setTimeout(() => setShowInviteSuccess(false), 2000);
  };

  const branches = [
    { name: "HQ Jakarta (HQ)", coords: "-6.1751, 106.8272", radius: "150m", activeStaff: 124 },
    { name: "Cabang Bandung", coords: "-6.9175, 107.6191", radius: "100m", activeStaff: 48 },
    { name: "Remote WFH Area", coords: "Anywhere", radius: "N/A (GPS Verified)", activeStaff: 18 }
  ];

  const shiftTemplates = [
    { name: "Morning Shift", hours: "07:00 - 15:00", activeStaff: 110 },
    { name: "Normal Shift", hours: "08:00 - 17:00", activeStaff: 68 },
    { name: "Evening Shift", hours: "15:00 - 23:00", activeStaff: 12 }
  ];

  return (
    <div className="space-y-6">
      {/* Workspace Level Header */}
      <div className="flex items-center justify-between border-b border-violet-100 pb-3">
        <div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 uppercase tracking-wide">
            Level Workspace (Stakeholder)
          </span>
          <h2 className="font-title-xl font-bold text-on-surface mt-1">
            Workspace Owner Center
          </h2>
        </div>
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Support Admin / HR List */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 flex flex-col">
          <div className="pb-3 border-b border-outline-variant/60 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">Support Admins (HR)</h3>
              <p className="text-[10px] text-on-surface-variant font-medium">Delegate operations to HR managers</p>
            </div>
            <Users size={16} className="text-violet-500" />
          </div>

          {showInviteSuccess && (
            <div className="mt-3 p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-[10px] font-bold rounded-lg flex items-center gap-1.5">
              <CheckCircle size={12} />
              Invitation dispatched!
            </div>
          )}

          {/* Invitation Form */}
          <form onSubmit={handleInvite} className="mt-4 space-y-3 bg-surface p-3 rounded-xl border border-outline-variant/60">
            <h4 className="text-[10px] font-bold text-on-surface uppercase">Invite Support Admin</h4>
            <div className="space-y-2">
              <input
                type="email"
                required
                placeholder="Enter email address..."
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full h-8 px-2.5 border border-outline-variant rounded-lg text-xs font-semibold bg-surface focus:ring-1 focus:ring-violet-500 focus:outline-hidden"
              />
              <select
                value={inviteDept}
                onChange={(e) => setInviteDept(e.target.value)}
                className="w-full h-8 px-2.5 border border-outline-variant rounded-lg text-xs font-semibold bg-surface focus:ring-1 focus:ring-violet-500 focus:outline-hidden"
              >
                <option value="HR Operations">HR Operations</option>
                <option value="Finance & Legal">Finance & Legal</option>
                <option value="Executive Office">Executive Office</option>
              </select>
              <button type="submit" className="w-full h-8 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1 transition-colors">
                <Mail size={12} />
                Send Invite
              </button>
            </div>
          </form>

          {/* Admins List */}
          <div className="mt-4 space-y-2.5 overflow-y-auto max-h-[160px] pr-1">
            {supportAdmins.map((admin, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg border border-outline-variant/60 bg-surface/30">
                <div>
                  <p className="text-xs font-bold text-on-surface capitalize">{admin.name}</p>
                  <p className="text-[9px] text-on-surface-variant font-medium">{admin.email} • {admin.department}</p>
                </div>
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${
                  admin.status === "Active" ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-amber-100 text-amber-800 border-amber-200"
                }`}>
                  {admin.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Office Branches & Geofencing Parameters */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5">
          <div className="pb-3 border-b border-outline-variant/60 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">Office Geofencing Logs</h3>
              <p className="text-[10px] text-on-surface-variant font-medium">Verify branches and active lock metrics</p>
            </div>
            <MapPin size={16} className="text-violet-500" />
          </div>

          <div className="mt-4 space-y-3">
            {branches.map((b, idx) => (
              <div key={idx} className="p-3 border border-outline-variant/60 rounded-xl bg-surface/20 flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-on-surface">{b.name}</h4>
                  <p className="text-[9px] text-on-surface-variant font-mono mt-0.5">COORDS: {b.coords}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-violet-600 block">{b.radius}</span>
                  <span className="text-[9px] text-on-surface-variant font-medium">{b.activeStaff} Active Staff</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Global Configuration Toggles */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-outline-variant/60 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">Workspace Policies</h3>
                <p className="text-[10px] text-on-surface-variant font-medium">Configure rules and shift allowances</p>
              </div>
              <Compass size={16} className="text-violet-500" />
            </div>

            <div className="mt-4 space-y-4">
              {/* WFH Mode Switch */}
              <div className="flex items-center justify-between py-1">
                <div>
                  <h4 className="text-xs font-bold text-on-surface">Allow Remote WFH</h4>
                  <p className="text-[9px] text-on-surface-variant">Staff can check-in outside geo radius</p>
                </div>
                <button onClick={() => setWfhEnabled(!wfhEnabled)}>
                  {wfhEnabled ? (
                    <ToggleRight size={26} className="text-violet-600 cursor-pointer" />
                  ) : (
                    <ToggleLeft size={26} className="text-slate-400 cursor-pointer" />
                  )}
                </button>
              </div>

              {/* Dynamic Shift Schedule lists */}
              <div className="pt-3 border-t border-outline-variant/60">
                <h4 className="text-[10px] font-bold text-on-surface-variant uppercase mb-2">Shift Schedule Matrix</h4>
                <div className="space-y-2">
                  {shiftTemplates.map((s, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-on-surface-variant">{s.name} ({s.hours})</span>
                      <span className="text-[9px] font-bold bg-violet-100 text-violet-800 px-1.5 py-0.5 rounded">{s.activeStaff} pax</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-outline-variant/60 flex justify-between items-center text-[10px] text-on-surface-variant font-semibold">
            <span>Workspace Created: 24/05/2026</span>
            <span className="text-violet-600 font-bold">Plan: Enterprise</span>
          </div>
        </div>
      </div>
    </div>
  );
}
