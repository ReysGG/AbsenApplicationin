"use client";

import React, { useState } from "react";
import {
  Building2,
  CreditCard,
  Activity,
  Ticket,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Server,
  ArrowUpRight,
  UserX,
  Search,
  MessageSquare
} from "lucide-react";

export default function PlatformAdminDashboard() {
  const [tenantQuery, setTenantQuery] = useState("");

  const stats = [
    { title: "Total Tenant", value: "84", desc: "+3 new this week", icon: Building2, color: "text-rose-600 bg-rose-50 border-rose-200" },
    { title: "SaaS Revenue", value: "$12,480", desc: "+8.2% vs last month", icon: CreditCard, color: "text-violet-600 bg-violet-50 border-violet-200" },
    { title: "Platform Health", value: "99.98%", desc: "All servers operational", icon: Activity, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
    { title: "CS Tickets", value: "7 Pending", desc: "Avg response: 12m", icon: Ticket, color: "text-amber-600 bg-amber-50 border-amber-200" }
  ];

  const initialTenants = [
    { id: "TEN-001", name: "PT Inovasi Kerja Digital", owner: "David Boy", plan: "Enterprise", status: "Active", users: 154, billing: "$350/mo" },
    { id: "TEN-002", name: "Acme Corp Indonesia", owner: "Sarah Jenkins", plan: "Pro", status: "Active", users: 92, billing: "$199/mo" },
    { id: "TEN-003", name: "Nusantara Tech", owner: "Riky Pratama", plan: "Basic", status: "Inactive", users: 12, billing: "$49/mo" },
    { id: "TEN-004", name: "Global Logistik Utama", owner: "Dewi Puspita", plan: "Pro", status: "Active", users: 84, billing: "$199/mo" }
  ];

  const [tenants, setTenants] = useState(initialTenants);

  const toggleTenantStatus = (id: string) => {
    setTenants(tenants.map(t => t.id === id ? { ...t, status: t.status === "Active" ? "Inactive" : "Active" } : t));
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(tenantQuery.toLowerCase()) || 
    t.owner.toLowerCase().includes(tenantQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Platform Level Header */}
      <div className="flex items-center justify-between border-b border-rose-100 pb-3">
        <div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 uppercase tracking-wide">
            Level Platform
          </span>
          <h2 className="font-title-xl font-bold text-on-surface mt-1">
            Global Platform Administration
          </h2>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={idx} className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-xs">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{s.title}</p>
                  <h3 className="text-xl font-bold text-on-surface mt-1">{s.value}</h3>
                </div>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${s.color}`}>
                  <Icon size={16} />
                </div>
              </div>
              <p className="text-[10px] text-on-surface-variant font-semibold mt-3 pt-2 border-t border-outline-variant/40">
                {s.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Main split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tenant Management */}
        <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-outline-variant/60">
            <div>
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">Tenant Subscription Registry</h3>
              <p className="text-[10px] text-on-surface-variant font-medium">Manage corporate workspaces and subscription status</p>
            </div>
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-2.5 top-2 text-on-surface-variant" size={13} />
              <input
                type="text"
                placeholder="Search tenant..."
                value={tenantQuery}
                onChange={(e) => setTenantQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-3 border border-outline-variant rounded-lg text-[11px] font-semibold bg-surface focus:ring-1 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="overflow-x-auto flex-1 mt-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  <th className="py-2.5 px-2">Company</th>
                  <th className="py-2.5 px-2">Owner</th>
                  <th className="py-2.5 px-2">Plan</th>
                  <th className="py-2.5 px-2 text-right">Users</th>
                  <th className="py-2.5 px-2 text-right">Billing</th>
                  <th className="py-2.5 px-2 text-center">Status</th>
                  <th className="py-2.5 px-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40 text-xs">
                {filteredTenants.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-2 font-bold text-on-surface">{t.name}</td>
                    <td className="py-3 px-2 text-on-surface-variant">{t.owner}</td>
                    <td className="py-3 px-2">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                        t.plan === "Enterprise" ? "bg-purple-100 text-purple-800 border-purple-200" :
                        t.plan === "Pro" ? "bg-blue-100 text-blue-800 border-blue-200" :
                        "bg-slate-100 text-slate-800 border-slate-200"
                      }`}>
                        {t.plan}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right font-semibold text-on-surface-variant">{t.users}</td>
                    <td className="py-3 px-2 text-right font-mono font-bold text-on-surface">{t.billing}</td>
                    <td className="py-3 px-2 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                        t.status === "Active" ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-red-100 text-red-800 border-red-200"
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <button 
                        onClick={() => toggleTenantStatus(t.id)}
                        className={`h-6 px-2.5 font-bold text-[9px] rounded-lg transition-colors border ${
                          t.status === "Active" 
                            ? "bg-red-50 hover:bg-red-100 text-red-700 border-red-200" 
                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {t.status === "Active" ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global Server Health & Ticket */}
        <div className="space-y-6">
          {/* Server status */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5">
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider pb-3 border-b border-outline-variant/60">
              System Infrastructure
            </h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
                  <Server size={14} className="text-rose-500" />
                  API Gateway (Node.js)
                </span>
                <span className="text-[10px] font-bold text-emerald-600">Online</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
                  <Activity size={14} className="text-purple-500" />
                  PostgreSQL DB Instance
                </span>
                <span className="text-[10px] font-bold text-emerald-600">Optimal</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
                  <Server size={14} className="text-blue-500" />
                  Prisma Engine Cache
                </span>
                <span className="text-[10px] font-bold text-emerald-600">Hit (94%)</span>
              </div>

              <div className="pt-3 border-t border-outline-variant/60">
                <div className="flex justify-between text-[10px] font-bold text-on-surface-variant mb-1">
                  <span>Server Memory Usage</span>
                  <span>41%</span>
                </div>
                <div className="h-1.5 rounded-full bg-surface-container overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: "41%" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Pending support ticket queue */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5">
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider pb-3 border-b border-outline-variant/60 flex items-center justify-between">
              Support Ticket Queue
              <span className="text-[9px] font-bold px-1.5 bg-rose-100 text-rose-800 rounded-md">3 Urgent</span>
            </h3>
            <div className="mt-4 space-y-3">
              {[
                { name: "PT Inovasi Kerja Digital", title: "GPS Drift on iOS device", time: "5 mins ago", p: "High" },
                { name: "Acme Corp", title: "Reset face vector for employee", time: "18 mins ago", p: "Medium" }
              ].map((ticket, idx) => (
                <div key={idx} className="p-2.5 border border-outline-variant/60 rounded-xl bg-surface hover:bg-surface-container-low transition-colors">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-bold text-on-surface-variant">{ticket.name}</span>
                    <span className={`text-[8px] font-bold px-1.5 rounded ${
                      ticket.p === "High" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                    }`}>{ticket.p}</span>
                  </div>
                  <h4 className="text-xs font-bold text-on-surface mt-1 truncate">{ticket.title}</h4>
                  <p className="text-[9px] text-on-surface-variant/80 mt-1 flex items-center gap-1">
                    <MessageSquare size={10} />
                    {ticket.time}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
