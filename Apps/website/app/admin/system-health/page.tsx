"use client";

import React, { useState, useEffect } from "react";
import { Activity, ShieldCheck, Server, Database, Key, Cloud, BellRing, Info, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { PageHeader } from "../_components/PageHeader";
import { createClientApiClient } from "@/lib/apiClient";

interface Incident {
  id: string;
  date: string;
  service: string;
  description: string;
  duration: string;
  status: "Resolved" | "Investigating" | "Monitoring";
}

interface AuditLog {
  id: string;
  action: string;
  actorEmail: string;
  targetType: string;
  targetId: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

const fallbackIncidents: Incident[] = [
  {
    id: "1",
    date: "June 4, 2026",
    service: "Database",
    description: "Brief connection timeout during primary failover.",
    duration: "4 mins",
    status: "Resolved",
  },
  {
    id: "2",
    date: "May 28, 2026",
    service: "API Server",
    description: "Elevated latency observed on reporting endpoints.",
    duration: "15 mins",
    status: "Resolved",
  },
  {
    id: "3",
    date: "May 15, 2026",
    service: "Storage API",
    description: "Intermittent S3 storage bucket read failures.",
    duration: "32 mins",
    status: "Resolved",
  },
];

function formatAuditDate(isoString: string): string {
  try {
    return new Date(isoString).toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

export default function SystemHealthPage() {
  const [lastUpdated, setLastUpdated] = useState("Just now");
  const [incidents, setIncidents] = useState<Incident[]>(fallbackIncidents);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [usingLiveAudit, setUsingLiveAudit] = useState(false);
  const [latencyPoints, setLatencyPoints] = useState<number[]>([
    42, 45, 40, 48, 50, 78, 44, 43, 41, 44, 46, 42, 45, 48, 75, 43, 40, 42,
  ]);

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    setAuditError(null);
    try {
      const api = createClientApiClient();
      const response = await api.get<AuditLog[]>("v1/audit", { limit: "10" });
      if (response.success && response.data.length > 0) {
        const mapped: Incident[] = response.data.map((log) => ({
          id: log.id,
          date: formatAuditDate(log.createdAt),
          service: log.targetType ?? "System",
          description: log.action,
          duration: "—",
          status: "Resolved",
        }));
        setIncidents(mapped);
        setUsingLiveAudit(true);
      } else if (!response.success) {
        setAuditError(response.error?.message ?? "Failed to load audit logs.");
        setIncidents(fallbackIncidents);
        setUsingLiveAudit(false);
      } else {
        // success but empty — keep fallback
        setIncidents(fallbackIncidents);
        setUsingLiveAudit(false);
      }
    } catch {
      setAuditError("Unable to connect to audit log service.");
      setIncidents(fallbackIncidents);
      setUsingLiveAudit(false);
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAuditLogs().finally(() => {
      setIsRefreshing(false);
      const now = new Date();
      setLastUpdated(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      // Randomize last latency point to simulate real-time updates
      setLatencyPoints((prev) => {
        const next = [...prev.slice(1)];
        next.push(Math.floor(Math.random() * 20) + 35);
        return next;
      });
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <PageHeader
        title="System Health"
        description="Monitor real-time system performance, uptime, and incident logs."
      >
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="px-4 py-2 border border-outline-variant hover:bg-surface-container-low rounded-lg text-xs font-semibold text-on-surface transition-colors flex items-center gap-1.5 disabled:opacity-50"
        >
          <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
          Refresh Status
        </button>
      </PageHeader>

      {/* Health Status Banner */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 flex items-center gap-4 shadow-sm">
        <CheckCircle className="text-emerald-600 shrink-0" size={32} />
        <div>
          <h3 className="font-title-lg text-emerald-800 font-bold">
            All Systems Operational
          </h3>
          <p className="text-xs text-emerald-700/80 mt-0.5">
            Last updated: {lastUpdated}
          </p>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* API Server */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">API Server</span>
            <Server size={18} className="text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-on-surface">99.98%</p>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            Operational
          </div>
        </div>

        {/* Database */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Database</span>
            <Database size={18} className="text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-on-surface">99.99%</p>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            Operational
          </div>
        </div>

        {/* Auth Provider */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Authentication</span>
            <Key size={18} className="text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-on-surface">100.00%</p>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            Operational
          </div>
        </div>

        {/* Storage */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Storage</span>
            <Cloud size={18} className="text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-on-surface">99.95%</p>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            Operational
          </div>
        </div>

        {/* Push Notifications (Degraded) */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm relative overflow-hidden group bg-linear-to-br from-surface-container-lowest to-amber-500/5">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">Push Notifs</span>
            <BellRing size={18} className="text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-on-surface">99.80%</p>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-amber-600 font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Degraded
          </div>
        </div>
      </div>

      {/* Response Time and Performance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Line Chart */}
        <div className="lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-title-lg text-on-surface font-semibold">
              System Response Time (Last 24h)
            </h3>
            <div className="flex items-center gap-4 text-xs font-medium text-on-surface-variant/80">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" /> API
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> DB
              </span>
            </div>
          </div>

          <div className="h-64 w-full relative border-l border-b border-outline-variant/60">
            {/* Grid Line Marks */}
            <div className="absolute left-0 top-0 w-full border-t border-outline-variant/20 border-dashed" />
            <div className="absolute left-0 top-1/2 w-full border-t border-outline-variant/20 border-dashed" />
            
            {/* Custom SVG Line Chart */}
            <svg className="w-full h-full absolute inset-0" preserveAspectRatio="none" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Fill Area */}
              <polygon
                fill="url(#latencyGrad)"
                points={`0,100 ${latencyPoints
                  .map((p, i) => `${(i / (latencyPoints.length - 1)) * 100},${100 - p}`)
                  .join(" ")} 100,100`}
              />
              {/* Line */}
              <polyline
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={latencyPoints
                  .map((p, i) => `${(i / (latencyPoints.length - 1)) * 100},${100 - p}`)
                  .join(" ")}
              />
            </svg>
          </div>
          <div className="flex justify-between mt-3 text-xs text-on-surface-variant/80">
            <span>24h ago</span>
            <span>12h ago</span>
            <span>Now</span>
          </div>
        </div>

        {/* Stats Bento Summary */}
        <div className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <h3 className="font-title-lg text-on-surface font-semibold mb-4">
            Metrics Summary
          </h3>
          <div className="grid grid-cols-2 gap-4 flex-1">
            <div className="bg-surface rounded-xl border border-outline-variant/50 p-4 flex flex-col justify-center items-center text-center">
              <span className="text-3xl font-bold text-primary">12</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant/70 mt-2">
                Days Outage Free
              </span>
            </div>
            <div className="bg-surface rounded-xl border border-outline-variant/50 p-4 flex flex-col justify-center items-center text-center">
              <span className="text-3xl font-bold text-on-surface">43ms</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant/70 mt-2">
                Avg Latency
              </span>
            </div>
            <div className="bg-surface rounded-xl border border-outline-variant/50 p-4 flex flex-col justify-center items-center text-center col-span-2">
              <span className="text-3xl font-bold text-amber-600">1</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant/70 mt-2 flex items-center gap-1">
                <AlertTriangle size={10} /> Active Incident (Push Notifs)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Incident History Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-outline-variant bg-surface flex justify-between items-center">
          <div>
            <h3 className="font-title-lg text-on-surface font-semibold">
              Incident History
            </h3>
            {!auditLoading && !auditError && usingLiveAudit && (
              <p className="text-[10px] text-on-surface-variant/60 mt-0.5">Sourced from real audit logs</p>
            )}
            {!auditLoading && !usingLiveAudit && (
              <p className="text-[10px] text-amber-600 mt-0.5">⚠️ Showing sample data — audit log unavailable</p>
            )}
          </div>
          <button className="text-primary text-xs font-semibold hover:underline">
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          {auditLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-on-surface-variant/60">
              <RefreshCw size={20} className="animate-spin" />
              <span className="text-xs">Loading audit logs…</span>
            </div>
          ) : auditError ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <AlertTriangle size={20} className="text-amber-500" />
              <span className="text-xs text-on-surface-variant/70">{auditError}</span>
              <span className="text-[10px] text-on-surface-variant/50">Displaying sample incident data</span>
            </div>
          ) : incidents.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-on-surface-variant/60">
              <CheckCircle size={20} className="text-emerald-500" />
              <span className="text-xs">No incidents recorded</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant text-xs font-semibold uppercase tracking-wider text-on-surface-variant/80">
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6">Service</th>
                  <th className="py-3 px-6">Description</th>
                  <th className="py-3 px-6">Duration</th>
                  <th className="py-3 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 text-xs">
                {incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-surface-container-low/30 transition-colors">
                    <td className="py-4 px-6 text-on-surface-variant font-medium">{inc.date}</td>
                    <td className="py-4 px-6 font-bold text-on-surface">{inc.service}</td>
                    <td className="py-4 px-6 text-on-surface-variant/90">{inc.description}</td>
                    <td className="py-4 px-6 text-on-surface-variant">{inc.duration}</td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                        <CheckCircle size={10} /> {inc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
