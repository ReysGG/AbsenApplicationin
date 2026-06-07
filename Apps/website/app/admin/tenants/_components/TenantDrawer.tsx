import React, { useState } from "react";
import { Drawer } from "../../_components/Drawer";
import { Tenant } from "./types";

interface TenantDrawerProps {
  selectedTenant: Tenant | null;
  onClose: () => void;
}

export function TenantDrawer({ selectedTenant, onClose }: TenantDrawerProps) {
  const [drawerTab, setDrawerTab] = useState<"Overview" | "Billing" | "Users" | "Activity">(
    "Overview"
  );

  if (!selectedTenant) return null;

  return (
    <Drawer
      isOpen={!!selectedTenant}
      onClose={onClose}
      title={selectedTenant.name}
      subtitle={selectedTenant.domain}
    >
      {/* Tabs */}
      <div className="border-b border-outline-variant flex gap-4 mb-4">
        {(["Overview", "Billing", "Users", "Activity"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setDrawerTab(tab)}
            className={`py-2 border-b-2 text-xs font-semibold transition-all ${
              drawerTab === tab
                ? "border-navy text-navy"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {drawerTab === "Overview" && (
        <div className="space-y-6 text-xs text-on-surface">
          {/* Plan Status Card */}
          <div className="bg-surface border border-outline-variant rounded-xl p-4 flex justify-between items-center shadow-sm">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-on-surface-variant font-semibold">
                Current Plan
              </p>
              <p className="text-xs font-bold text-on-surface mt-0.5">
                {selectedTenant.plan}{" "}
                <span className="text-[10px] text-on-surface-variant/80 font-normal">
                  (${selectedTenant.mrr}/mo)
                </span>
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                selectedTenant.status === "Active"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-700"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  selectedTenant.status === "Active" ? "bg-emerald-600" : "bg-rose-600"
                }`}
              />
              {selectedTenant.status}
            </span>
          </div>

          {/* Usage Metrics */}
          <div>
            <h4 className="font-semibold text-on-surface text-xs mb-3">
              Usage Metrics (This Month)
            </h4>
            <div className="bg-surface rounded-xl border border-outline-variant p-4 shadow-sm space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-on-surface-variant font-medium">API Calls</span>
                  <span className="text-on-surface font-semibold">845k / 1M</span>
                </div>
                <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-navy rounded-full w-[84%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-on-surface-variant font-medium">Storage Used</span>
                  <span className="text-on-surface font-semibold">42GB / 50GB</span>
                </div>
                <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full w-[84%]" />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Actions */}
          <div>
            <h4 className="font-semibold text-on-surface text-xs mb-3">Recent Activity</h4>
            <div className="bg-surface rounded-xl border border-outline-variant p-4 shadow-sm">
              <div className="relative pl-5 border-l border-outline-variant/60 ml-2 space-y-4 text-xs">
                <div className="relative">
                  <div className="absolute left-[-26px] top-1 w-2.5 h-2.5 bg-navy rounded-full border-2 border-surface" />
                  <p className="font-semibold text-on-surface">New admin user added (Jane Doe)</p>
                  <p className="text-on-surface-variant/80 mt-0.5">Today, 10:42 AM</p>
                </div>
                <div className="relative">
                  <div className="absolute left-[-26px] top-1 w-2.5 h-2.5 bg-outline-variant rounded-full border-2 border-surface" />
                  <p className="font-semibold text-on-surface">
                    Plan upgraded to {selectedTenant.plan}
                  </p>
                  <p className="text-on-surface-variant/80 mt-0.5">Oct 12, 2023</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {drawerTab === "Billing" && (
        <div className="space-y-4 text-xs">
          <h4 className="font-semibold text-on-surface text-xs mb-3">Billing Invoices</h4>
          <div className="divide-y divide-outline-variant/30">
            {[
              { id: "INV-001", amount: selectedTenant.mrr, date: "June 1, 2026", status: "Paid" },
              { id: "INV-002", amount: selectedTenant.mrr, date: "May 1, 2026", status: "Paid" },
              { id: "INV-003", amount: selectedTenant.mrr, date: "Apr 1, 2026", status: "Paid" },
            ].map((inv) => (
              <div key={inv.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-on-surface">{inv.id}</p>
                  <p className="text-on-surface-variant/80 mt-0.5">{inv.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-on-surface">${inv.amount}</p>
                  <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 font-semibold rounded-full mt-0.5 scale-90">
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {drawerTab === "Users" && (
        <div className="space-y-4 text-xs">
          <h4 className="font-semibold text-on-surface text-xs mb-3">Admin Staff</h4>
          <div className="space-y-3">
            {[
              { name: "John Doe", email: "john@acme.com", role: "Owner" },
              { name: "Jane Doe", email: "jane@acme.com", role: "Admin" },
            ].map((user) => (
              <div
                key={user.email}
                className="flex justify-between items-center p-2 border border-outline-variant/40 rounded-lg"
              >
                <div>
                  <p className="font-semibold text-on-surface">{user.name}</p>
                  <p className="text-on-surface-variant/80">{user.email}</p>
                </div>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded-full">
                  {user.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {drawerTab === "Activity" && (
        <div className="space-y-4 text-xs">
          <h4 className="font-semibold text-on-surface text-xs mb-3">System Logs</h4>
          <div className="space-y-2.5 font-mono text-[10px] bg-slate-900 text-slate-300 p-3 rounded-lg max-h-60 overflow-y-auto">
            <p>[2026-06-06 14:02:11] API call: GET /api/v1/employees (200 OK)</p>
            <p>[2026-06-06 13:58:04] User Check-in: Budi Santoso via Mobile</p>
            <p>[2026-06-06 13:42:01] Settings updated: Enable geofencing</p>
            <p>[2026-06-06 12:30:45] API call: POST /api/v1/auth/session (201 Created)</p>
          </div>
        </div>
      )}

      {/* Drawer Actions */}
      <div className="pt-4 mt-6 border-t border-outline-variant/30 flex justify-end gap-2">
        <button className="px-4 py-2 border border-outline-variant rounded-lg text-on-surface hover:bg-surface-container-low transition-colors text-xs font-semibold">
          Edit Settings
        </button>
        <button
          onClick={() => alert(`Impersonating ${selectedTenant.name}...`)}
          className="px-4 py-2 bg-navy text-white hover:bg-navy/90 rounded-lg transition-colors text-xs font-semibold"
        >
          Impersonate
        </button>
      </div>
    </Drawer>
  );
}
