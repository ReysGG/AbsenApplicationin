"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Server,
  Database,
  Key,
  Cloud,
  BellRing,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Building2,
  Users,
  CalendarCheck,
  Ticket,
} from "lucide-react";
import { PageHeader } from "../_components/PageHeader";
import { createClientApiClient } from "@/lib/apiClient";
import type { PaginatedData } from "@/lib/apiClient";

interface SystemHealth {
  status: "ok" | "degraded" | "down";
  uptimeSeconds: number;
  timestamp: string;
  database: { status: "up" | "down"; latencyMs: number | null };
  counts: {
    workspaces: number;
    employees: number;
    attendanceToday: number;
    openTickets: number;
  };
}

interface AuditLog {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  createdAt: string;
}

interface IncidentRow {
  id: string;
  date: string;
  service: string;
  description: string;
}

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

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// Illustrative 24h latency series — clearly labelled as a sample in the UI.
// (Real per-minute history would require a time-series store / APM.)
const SAMPLE_LATENCY = [
  42, 45, 40, 48, 50, 78, 44, 43, 41, 44, 46, 42, 45, 48, 75, 43, 40, 42,
];

export default function SystemHealthPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [healthError, setHealthError] = useState(false);
  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");

  const fetchHealth = useCallback(async () => {
    const api = createClientApiClient();
    try {
      const res = await api.get<SystemHealth>("v1/system/health");
      if (res.success) {
        setHealth(res.data);
        setHealthError(false);
      } else {
        setHealthError(true);
      }
    } catch {
      setHealthError(true);
    }
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    setAuditError(null);
    const api = createClientApiClient();
    try {
      // Correct path is /audit-logs (paginated); the BFF normalizes the
      // nested { items, pagination } shape to res.data.data + res.data.pagination.
      const res = await api.get<PaginatedData<AuditLog>>("v1/audit-logs", {
        page: "1",
        page_size: "8",
      });
      if (res.success && Array.isArray(res.data.data)) {
        setIncidents(
          res.data.data.map((log) => ({
            id: log.id,
            date: formatAuditDate(log.createdAt),
            service: log.entityType ?? "System",
            description: log.action,
          }))
        );
      } else if (!res.success) {
        setAuditError(res.error?.message ?? "Gagal memuat log audit.");
      }
    } catch {
      setAuditError("Tidak dapat terhubung ke layanan log audit.");
    } finally {
      setAuditLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchHealth(), fetchAuditLogs()]);
    setIsRefreshing(false);
    setLastUpdated(
      new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    );
  }, [fetchHealth, fetchAuditLogs]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const dbUp = health?.database.status === "up";
  const apiUp = health != null && !healthError;
  const overallOk = health?.status === "ok";

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="System Health"
        description="Live database, API uptime, and audit activity."
      >
        <button
          onClick={refresh}
          disabled={isRefreshing}
          className="px-4 py-2 border border-outline-variant hover:bg-surface-container-low rounded-lg text-xs font-semibold text-on-surface transition-colors flex items-center gap-1.5 disabled:opacity-50"
        >
          <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
          Refresh Status
        </button>
      </PageHeader>

      {/* Health Status Banner — driven by the real probe */}
      <div
        className={`rounded-xl p-6 flex items-center gap-4 shadow-sm border ${
          overallOk
            ? "bg-emerald-500/10 border-emerald-500/20"
            : "bg-rose-500/10 border-rose-500/20"
        }`}
      >
        {overallOk ? (
          <CheckCircle className="text-emerald-600 shrink-0" size={32} />
        ) : (
          <XCircle className="text-rose-600 shrink-0" size={32} />
        )}
        <div>
          <h3
            className={`font-title-lg font-bold ${
              overallOk ? "text-emerald-800" : "text-rose-800"
            }`}
          >
            {overallOk ? "All Systems Operational" : "Service Degraded"}
          </h3>
          <p className="text-xs text-on-surface-variant/80 mt-0.5">
            {lastUpdated ? `Last checked: ${lastUpdated}` : "Checking…"}
          </p>
        </div>
      </div>

      {/* Services Grid — API + DB are measured; the rest are labelled not-monitored */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* API Server (measured: we received a response) */}
        <ServiceCard
          name="API Server"
          icon={<Server size={18} className={apiUp ? "text-emerald-600" : "text-rose-600"} />}
          measured
          up={apiUp}
          detail={apiUp ? `Uptime ${health ? formatUptime(health.uptimeSeconds) : "—"}` : "Tidak merespons"}
        />
        {/* Database (measured: SELECT 1 + latency) */}
        <ServiceCard
          name="Database"
          icon={<Database size={18} className={dbUp ? "text-emerald-600" : "text-rose-600"} />}
          measured
          up={dbUp}
          detail={
            dbUp
              ? `Latency ${health?.database.latencyMs ?? "—"} ms`
              : "Tidak terhubung"
          }
        />
        {/* Authentication — shares the API process; not independently probed */}
        <ServiceCard
          name="Authentication"
          icon={<Key size={18} className="text-on-surface-variant" />}
          measured={false}
          up={apiUp}
          detail="Tidak dipantau terpisah"
        />
        {/* Storage — external (Supabase); not probed here */}
        <ServiceCard
          name="Storage"
          icon={<Cloud size={18} className="text-on-surface-variant" />}
          measured={false}
          up={null}
          detail="Tidak dipantau"
        />
        {/* Push notifications — external (FCM); not probed here */}
        <ServiceCard
          name="Push Notifs"
          icon={<BellRing size={18} className="text-on-surface-variant" />}
          measured={false}
          up={null}
          detail="Tidak dipantau"
        />
      </div>

      {/* Real counts */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <CountCard label="Workspaces" value={health?.counts.workspaces} icon={<Building2 size={18} />} />
        <CountCard label="Karyawan" value={health?.counts.employees} icon={<Users size={18} />} />
        <CountCard label="Absensi Hari Ini" value={health?.counts.attendanceToday} icon={<CalendarCheck size={18} />} />
        <CountCard label="Tiket Terbuka" value={health?.counts.openTickets} icon={<Ticket size={18} />} />
      </div>

      {/* Latency chart — explicitly labelled as a sample */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-title-lg text-on-surface font-semibold">
            Response Time (24h)
          </h3>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-semibold">
            <AlertTriangle size={10} /> Contoh / ilustrasi
          </span>
        </div>
        <p className="text-[11px] text-on-surface-variant/70 mb-4">
          Grafik ini adalah contoh statis. Riwayat latency nyata memerlukan
          penyimpanan time-series/APM. Latency DB terukur ada di kartu Database di atas.
        </p>
        <div className="h-48 w-full relative border-l border-b border-outline-variant/60">
          <svg className="w-full h-full absolute inset-0" preserveAspectRatio="none" viewBox="0 0 100 100">
            <polyline
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              points={SAMPLE_LATENCY.map(
                (p, i) => `${(i / (SAMPLE_LATENCY.length - 1)) * 100},${100 - p}`
              ).join(" ")}
            />
          </svg>
        </div>
      </div>

      {/* Incident / activity history — real audit logs (correct path) */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-outline-variant bg-surface">
          <h3 className="font-title-lg text-on-surface font-semibold">
            Aktivitas Audit Terbaru
          </h3>
          <p className="text-[10px] text-on-surface-variant/60 mt-0.5">
            Sumber: log audit nyata (/audit-logs)
          </p>
        </div>
        <div className="overflow-x-auto">
          {auditLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-on-surface-variant/60">
              <RefreshCw size={20} className="animate-spin" />
              <span className="text-xs">Memuat log audit…</span>
            </div>
          ) : auditError ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <AlertTriangle size={20} className="text-amber-500" />
              <span className="text-xs text-on-surface-variant/70">{auditError}</span>
            </div>
          ) : incidents.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-on-surface-variant/60">
              <CheckCircle size={20} className="text-emerald-500" />
              <span className="text-xs">Belum ada aktivitas audit</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant text-xs font-semibold uppercase tracking-wider text-on-surface-variant/80">
                  <th className="py-3 px-6">Waktu</th>
                  <th className="py-3 px-6">Entitas</th>
                  <th className="py-3 px-6">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 text-xs">
                {incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-surface-container-low/30 transition-colors">
                    <td className="py-4 px-6 text-on-surface-variant font-medium">{inc.date}</td>
                    <td className="py-4 px-6 font-bold text-on-surface">{inc.service}</td>
                    <td className="py-4 px-6 text-on-surface-variant/90">{inc.description}</td>
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

function ServiceCard({
  name,
  icon,
  measured,
  up,
  detail,
}: {
  name: string;
  icon: React.ReactNode;
  measured: boolean;
  up: boolean | null;
  detail: string;
}) {
  const statusColor =
    up === null ? "text-on-surface-variant" : up ? "text-emerald-600" : "text-rose-600";
  const dotColor =
    up === null ? "bg-slate-400" : up ? "bg-emerald-600" : "bg-rose-600";
  const barColor = up === null ? "bg-slate-300" : up ? "bg-emerald-500" : "bg-rose-500";

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-full h-1 ${barColor}`} />
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
          {name}
        </span>
        {icon}
      </div>
      <p className="text-sm font-bold text-on-surface">{detail}</p>
      <div className={`mt-3 flex items-center gap-1.5 text-xs font-semibold ${statusColor}`}>
        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
        {up === null ? "Tidak dipantau" : up ? "Operational" : "Down"}
        {!measured && up !== null && (
          <span className="ml-1 text-[10px] font-normal text-on-surface-variant/60">
            (mengikuti API)
          </span>
        )}
      </div>
    </div>
  );
}

function CountCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | undefined;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex items-center gap-3">
      <span className="p-2 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
        {icon}
      </span>
      <div>
        <p className="text-2xl font-bold text-on-surface">{value ?? "—"}</p>
        <p className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant/70">
          {label}
        </p>
      </div>
    </div>
  );
}
