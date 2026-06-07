"use client";

import React, { useState } from "react";
import { Building2, Users, CreditCard, Ticket, Calendar, Download } from "lucide-react";
import { PageHeader } from "../_components/PageHeader";
import { StatCard } from "../_components/StatCard";
import { Registration, Tenant } from "./_components/types";
import { GrowthChart } from "./_components/GrowthChart";
import { PlanDonutChart } from "./_components/PlanDonutChart";
import { TopTenantsList } from "./_components/TopTenantsList";
import { RegistrationsTable } from "./_components/RegistrationsTable";

const recentRegistrations: Registration[] = [
  {
    id: "1",
    tenant: "Nexus Logic",
    initials: "NL",
    plan: "Enterprise",
    status: "Active",
    date: "June 6, 2026",
  },
  {
    id: "2",
    tenant: "OmniCorp",
    initials: "OC",
    plan: "Pro",
    status: "Active",
    date: "June 5, 2026",
  },
  {
    id: "3",
    tenant: "Vertex Solutions",
    initials: "VS",
    plan: "Basic",
    status: "Trial",
    date: "June 4, 2026",
  },
  {
    id: "4",
    tenant: "Cyberdyne Systems",
    initials: "CS",
    plan: "Enterprise",
    status: "Active",
    date: "June 4, 2026",
  },
  {
    id: "5",
    tenant: "Hooli Ltd",
    initials: "HL",
    plan: "Basic",
    status: "Churned",
    date: "June 3, 2026",
  },
];

const topTenants: Tenant[] = [
  { name: "Acme Corp", users: 1240, percentage: 100 },
  { name: "Globex Inc", users: 980, percentage: 80 },
  { name: "Stark Industries", users: 850, percentage: 70 },
  { name: "Initech", users: 620, percentage: 50 },
  { name: "Umbrella Corp", users: 410, percentage: 35 },
];

export default function PlatformDashboardPage() {
  const [timeRange] = useState("Last 30 Days");

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <PageHeader
        title="Platform Dashboard"
        description="Platform performance and key metrics."
      >
        <button className="px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg font-label-md text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-2 text-xs font-semibold">
          <Calendar size={16} />
          {timeRange}
        </button>
        <button className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2 text-xs font-semibold">
          <Download size={16} />
          Export Report
        </button>
      </PageHeader>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Tenants"
          value="1,248"
          change="12.5"
          changeLabel="vs last month"
          isPositive={true}
          icon={<Building2 size={20} />}
          iconBgColor="bg-primary/10"
          iconColor="text-primary"
          gradientCls="bg-primary/5"
        />
        <StatCard
          title="End Users"
          value="45.2k"
          change="8.2"
          changeLabel="vs last month"
          isPositive={true}
          icon={<Users size={20} />}
          iconBgColor="bg-teal-500/10"
          iconColor="text-teal-600"
          gradientCls="bg-teal-500/5"
        />
        <StatCard
          title="MRR"
          value="$84.5k"
          change="15.3"
          changeLabel="vs last month"
          isPositive={true}
          icon={<CreditCard size={20} />}
          iconBgColor="bg-emerald-500/10"
          iconColor="text-emerald-600"
          gradientCls="bg-emerald-500/5"
        />
        <StatCard
          title="Open Tickets"
          value="124"
          change="5.1"
          changeLabel="vs last month"
          isPositive={false}
          icon={<Ticket size={20} />}
          iconBgColor="bg-rose-500/10"
          iconColor="text-rose-600"
          gradientCls="bg-rose-500/5"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <GrowthChart />
        <PlanDonutChart />
      </div>

      {/* Third Row - Top 5 Tenants & Recent Registrations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <TopTenantsList tenants={topTenants} />
        <RegistrationsTable registrations={recentRegistrations} />
      </div>
    </div>
  );
}
