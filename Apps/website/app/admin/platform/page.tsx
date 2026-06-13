"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Building2, Users, CreditCard, Ticket, RefreshCw } from "lucide-react";
import { PageHeader } from "../_components/PageHeader";
import { StatCard } from "../_components/StatCard";
import { Registration, Tenant } from "./_components/types";
import { GrowthChart, GrowthPoint } from "./_components/GrowthChart";
import { PlanDonutChart, PlanSlice } from "./_components/PlanDonutChart";
import { TopTenantsList } from "./_components/TopTenantsList";
import { RegistrationsTable } from "./_components/RegistrationsTable";
import { createClientApiClient } from "@/lib/apiClient";

interface PlatformMetrics {
  kpis: {
    activeTenants: number;
    endUsers: number;
    mrr: number;
    openTickets: number;
  };
  planBreakdown: PlanSlice[];
  growth: GrowthPoint[];
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function formatMrr(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${value}`;
}

export default function PlatformDashboardPage() {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [topTenants, setTopTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    const api = createClientApiClient();
    const [metricsRes, regRes, topRes] = await Promise.allSettled([
      api.get<PlatformMetrics>("v1/platform/metrics"),
      api.get<Registration[]>("v1/platform/registrations"),
      api.get<Tenant[]>("v1/platform/top-tenants"),
    ]);

    if (metricsRes.status === "fulfilled" && metricsRes.value.success) {
      setMetrics(metricsRes.value.data);
    } else {
      setError(true);
    }
    if (regRes.status === "fulfilled" && regRes.value.success) {
      setRegistrations(regRes.value.data as Registration[]);
    }
    if (topRes.status === "fulfilled" && topRes.value.success) {
      setTopTenants(topRes.value.data as Tenant[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Platform Dashboard"
        description="Platform performance and key metrics."
      >
        <button
          onClick={fetchData}
          disabled={loading}
          className="px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg font-label-md text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-2 text-xs font-semibold disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </PageHeader>

      {error && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg px-4 py-2.5 text-xs font-medium">
          <span>⚠️</span>
          <span>Gagal memuat metrik platform. Coba muat ulang.</span>
        </div>
      )}

      {/* KPI Stats Grid — real aggregates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Tenants"
          value={loading ? "…" : formatNumber(metrics?.kpis.activeTenants ?? 0)}
          icon={<Building2 size={20} />}
          iconBgColor="bg-primary/10"
          iconColor="text-primary"
          gradientCls="bg-primary/5"
        />
        <StatCard
          title="End Users"
          value={loading ? "…" : formatNumber(metrics?.kpis.endUsers ?? 0)}
          icon={<Users size={20} />}
          iconBgColor="bg-teal-500/10"
          iconColor="text-teal-600"
          gradientCls="bg-teal-500/5"
        />
        <StatCard
          title="MRR"
          value={loading ? "…" : formatMrr(metrics?.kpis.mrr ?? 0)}
          icon={<CreditCard size={20} />}
          iconBgColor="bg-emerald-500/10"
          iconColor="text-emerald-600"
          gradientCls="bg-emerald-500/5"
        />
        <StatCard
          title="Open Tickets"
          value={loading ? "…" : formatNumber(metrics?.kpis.openTickets ?? 0)}
          icon={<Ticket size={20} />}
          iconBgColor="bg-rose-500/10"
          iconColor="text-rose-600"
          gradientCls="bg-rose-500/5"
        />
      </div>

      {/* Charts Row — real data */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <GrowthChart data={metrics?.growth ?? []} />
        <PlanDonutChart
          data={metrics?.planBreakdown ?? []}
          totalMrr={metrics?.kpis.mrr ?? 0}
        />
      </div>

      {/* Third Row - Top 5 Tenants & Recent Registrations — real data */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <TopTenantsList tenants={topTenants} />
        <RegistrationsTable registrations={registrations} />
      </div>
    </div>
  );
}
