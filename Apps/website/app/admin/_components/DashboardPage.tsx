"use client";

import { NumberTicker } from "@/components/ui/number-ticker";
import { AnimatedList } from "@/components/ui/animated-list";
import { BorderBeam } from "@/components/ui/border-beam";
import { useState, useEffect, useCallback } from "react";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  RefreshCw,
  MapPin,
  Smartphone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HeartPulse,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";
import { MiniChart } from "./MiniChart";
import { DonutChart } from "./DonutChart";
import { createClientApiClient } from "@/lib/apiClient";

// ── API response types ────────────────────────────────────────────────────────

interface DashboardSummary {
  date: string;
  totalEmployees: number;
  presentToday: number;
  lateToday: number;
  onLeave: number;
  absent: number;
  unassignedShift: number;
  pendingCheckout: number;
}

interface LivePreviewItem {
  employeeId: string;
  employeeName: string;
  department: string;
  checkInAt: string;
  status: string;
  workMode: string;
}

interface AttendanceTrend {
  period: string;
  labels: string[];
  series: {
    present: number[];
    late: number[];
    absent: number[];
    leave: number[];
  };
}

interface DepartmentBreakdownItem {
  departmentId: string;
  departmentName: string;
  totalEmployees: number;
  present: number;
  late: number;
  absent: number;
}

// ── Derived UI types ──────────────────────────────────────────────────────────

interface StatCard {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  /** Per-card sparkline series (real data from the attendance trend). */
  trend: number[];
}

interface Activity {
  name: string;
  action: string;
  time: string;
  icon: React.ReactNode;
  color: string;
  status: "success" | "warning" | "error";
}

interface AttendanceRow {
  name: string;
  dept: string;
  checkin: string;
  checkout: string;
  status: string;
  location: string;
  device: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(isoString: string): string {
  try {
    return new Date(isoString).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "–";
  }
}

function mapStatusToAction(status: string): string {
  switch (status) {
    case "Present":
      return "Check-in berhasil";
    case "Late":
      return "Terlambat";
    case "Leave":
      return "Izin/Cuti";
    case "Absent":
      return "Tidak hadir";
    default:
      return status;
  }
}

function mapStatusToActivityMeta(status: string): {
  icon: React.ReactNode;
  color: string;
  badgeStatus: "success" | "warning" | "error";
} {
  switch (status) {
    case "Present":
      return {
        icon: <CheckCircle2 size={16} />,
        color: "#10b981",
        badgeStatus: "success",
      };
    case "Late":
      return {
        icon: <AlertCircle size={16} />,
        color: "#ef4444",
        badgeStatus: "warning",
      };
    case "Leave":
      return {
        icon: <HeartPulse size={16} />,
        color: "#a855f7",
        badgeStatus: "warning",
      };
    case "Absent":
      return {
        icon: <XCircle size={16} />,
        color: "#ef4444",
        badgeStatus: "error",
      };
    default:
      return {
        icon: <CheckCircle2 size={16} />,
        color: "#6366f1",
        badgeStatus: "success",
      };
  }
}

function mapWorkMode(workMode: string): string {
  switch (workMode) {
    case "WFH":
      return "Remote";
    case "WFO":
    default:
      return "Kantor";
  }
}

function mapStatusToIndonesian(status: string): string {
  switch (status) {
    case "Present":
      return "Hadir";
    case "Late":
      return "Terlambat";
    case "Leave":
      return "Izin";
    case "Absent":
      return "Tidak Hadir";
    default:
      return status;
  }
}

function livePreviewToActivity(item: LivePreviewItem): Activity {
  const meta = mapStatusToActivityMeta(item.status);
  return {
    name: item.employeeName,
    action: mapStatusToAction(item.status),
    time: item.checkInAt ? formatTime(item.checkInAt) : "–",
    icon: meta.icon,
    color: meta.color,
    status: meta.badgeStatus,
  };
}

function livePreviewToTableRow(item: LivePreviewItem): AttendanceRow {
  return {
    name: item.employeeName,
    dept: item.department,
    checkin: item.checkInAt ? formatTime(item.checkInAt) : "–",
    checkout: "—",
    status: mapStatusToIndonesian(item.status),
    location: mapWorkMode(item.workMode),
    device: "Mobile",
  };
}

function summaryToStats(
  summary: DashboardSummary,
  trend: AttendanceTrend | null
): StatCard[] {
  const present = trend?.series.present ?? [];
  const late = trend?.series.late ?? [];
  const absent = trend?.series.absent ?? [];
  return [
    {
      title: "Total Karyawan",
      value: summary.totalEmployees,
      icon: <Users size={22} />,
      color: "stat-icon--navy",
      gradient: "stat-bg--navy",
      trend: [],
    },
    {
      title: "Hadir Hari Ini",
      value: summary.presentToday,
      icon: <UserCheck size={22} />,
      color: "stat-icon--cyan",
      gradient: "stat-bg--cyan",
      trend: present,
    },
    {
      title: "Tidak Hadir",
      value: summary.absent,
      icon: <UserX size={22} />,
      color: "stat-icon--error",
      gradient: "stat-bg--error",
      trend: absent,
    },
    {
      title: "Terlambat",
      value: summary.lateToday,
      icon: <Clock size={22} />,
      color: "stat-icon--warn",
      gradient: "stat-bg--warn",
      trend: late,
    },
  ];
}

function deptBreakdownToProgress(
  items: DepartmentBreakdownItem[]
): { label: string; pct: number; color: string }[] {
  // Show top 3 departments by attendance rate; fall back to hardcoded colours
  const colors = ["#022C22", "#34D399", "#ba1a1a", "#6366f1", "#f59e0b"];
  return items.slice(0, 5).map((dept, idx) => {
    const pct =
      dept.totalEmployees > 0
        ? Math.round((dept.present / dept.totalEmployees) * 100)
        : 0;
    return {
      label: dept.departmentName,
      pct,
      color: colors[idx % colors.length],
    };
  });
}

// ── Skeleton helpers ──────────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <div className="admin-stat-card animate-pulse">
      <div className="flex justify-between items-start w-full gap-2">
        <div className="h-4 w-32 rounded bg-slate-700" />
        <div className="h-10 w-10 rounded-lg bg-slate-700" />
      </div>
      <div className="h-10 w-24 rounded bg-slate-700 mt-3" />
      <div className="h-3 w-20 rounded bg-slate-700 mt-4" />
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="admin-activity-item">
          <div className="h-8 w-8 rounded-full bg-slate-700" />
          <div className="flex-1 space-y-1">
            <div className="h-3 w-28 rounded bg-slate-700" />
            <div className="h-3 w-36 rounded bg-slate-700" />
          </div>
          <div className="h-3 w-10 rounded bg-slate-700" />
        </div>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2 animate-pulse p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="h-4 w-32 rounded bg-slate-700" />
          <div className="h-4 w-24 rounded bg-slate-700" />
          <div className="h-4 w-12 rounded bg-slate-700" />
          <div className="h-4 w-16 rounded bg-slate-700" />
        </div>
      ))}
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [today, setToday] = useState("");

  // Data state
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [livePreview, setLivePreview] = useState<LivePreviewItem[]>([]);
  const [trend, setTrend] = useState<AttendanceTrend | null>(null);
  const [deptBreakdown, setDeptBreakdown] = useState<DepartmentBreakdownItem[]>([]);

  // Loading / error state per section
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [loadingTrend, setLoadingTrend] = useState(true);
  const [loadingDept, setLoadingDept] = useState(true);
  const [loadingTable, setLoadingTable] = useState(true);

  const [errorSummary, setErrorSummary] = useState(false);
  const [errorActivity, setErrorActivity] = useState(false);
  const [errorTrend, setErrorTrend] = useState(false);
  const [errorDept, setErrorDept] = useState(false);
  const [errorTable, setErrorTable] = useState(false);

  // Table live preview (limit=6) — separate state from activity feed (limit=7)
  const [tablePreview, setTablePreview] = useState<LivePreviewItem[]>([]);

  // Avoid hydration mismatch — set date only on client
  useEffect(() => {
    requestAnimationFrame(() => {
      setToday(
        new Intl.DateTimeFormat("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(new Date())
      );
    });
  }, []);

  const fetchDashboardData = useCallback(async () => {
    const api = createClientApiClient();

    // Reset loading states
    setLoadingSummary(true);
    setLoadingActivity(true);
    setLoadingTrend(true);
    setLoadingDept(true);
    setLoadingTable(true);

    // Reset errors
    setErrorSummary(false);
    setErrorActivity(false);
    setErrorTrend(false);
    setErrorDept(false);
    setErrorTable(false);

    const [summaryRes, activityRes, trendRes, deptRes, tableRes] =
      await Promise.allSettled([
        api.get<DashboardSummary>("v1/dashboard/summary"),
        api.get<LivePreviewItem[]>("v1/dashboard/live-preview", { limit: "7" }),
        api.get<AttendanceTrend>("v1/dashboard/attendance-trend", { days: "7" }),
        api.get<DepartmentBreakdownItem[]>("v1/dashboard/department-breakdown"),
        api.get<LivePreviewItem[]>("v1/dashboard/live-preview", { limit: "6" }),
      ]);

    // Summary
    if (
      summaryRes.status === "fulfilled" &&
      summaryRes.value.success
    ) {
      setSummary((summaryRes.value as { success: true; data: DashboardSummary }).data);
    } else {
      setErrorSummary(true);
    }
    setLoadingSummary(false);

    // Activity feed
    if (
      activityRes.status === "fulfilled" &&
      activityRes.value.success
    ) {
      setLivePreview((activityRes.value as { success: true; data: LivePreviewItem[] }).data);
    } else {
      setErrorActivity(true);
    }
    setLoadingActivity(false);

    // Trend
    if (
      trendRes.status === "fulfilled" &&
      trendRes.value.success
    ) {
      setTrend((trendRes.value as { success: true; data: AttendanceTrend }).data);
    } else {
      setErrorTrend(true);
    }
    setLoadingTrend(false);

    // Department breakdown
    if (
      deptRes.status === "fulfilled" &&
      deptRes.value.success
    ) {
      setDeptBreakdown((deptRes.value as { success: true; data: DepartmentBreakdownItem[] }).data);
    } else {
      setErrorDept(true);
    }
    setLoadingDept(false);

    // Table rows
    if (
      tableRes.status === "fulfilled" &&
      tableRes.value.success
    ) {
      setTablePreview((tableRes.value as { success: true; data: LivePreviewItem[] }).data);
    } else {
      setErrorTable(true);
    }
    setLoadingTable(false);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Derived UI data
  const stats: StatCard[] = summary ? summaryToStats(summary, trend) : [];
  const activities: Activity[] = livePreview.map(livePreviewToActivity);
  const progressItems =
    deptBreakdown.length > 0
      ? deptBreakdownToProgress(deptBreakdown)
      : [];
  const recentAttendance: AttendanceRow[] = tablePreview.map(livePreviewToTableRow);

  return (
    <div className="admin-dashboard">
      {/* ── Page Header ── */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-subtitle">{today}</p>
        </div>
        <div className="admin-page-actions">
          <button
            className="admin-action-btn"
            onClick={fetchDashboardData}
            title="Refresh data"
          >
            <RefreshCw size={16} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="admin-stat-grid">
        {loadingSummary
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : errorSummary
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="admin-stat-card flex items-center justify-center text-slate-500 text-sm">
                Gagal memuat data
              </div>
            ))
          : stats.map((s) => (
              <div key={s.title} className="admin-stat-card">
                <BorderBeam size={60} duration={8} colorFrom="#022C22" colorTo="#34D399" />

                {/* Top row: Title and Icon */}
                <div className="flex justify-between items-start w-full gap-2">
                  <p className="admin-stat-title">{s.title}</p>
                  <div className={cn("admin-stat-icon-wrap", s.color)}>
                    <div className={cn("admin-stat-icon-bg", s.gradient)}>
                      {s.icon}
                    </div>
                  </div>
                </div>

                {/* Middle row: Large Value */}
                <div className="flex-1 flex items-baseline mt-2">
                  <p className="admin-stat-value">
                    <NumberTicker value={s.value} className="admin-ticker" />
                  </p>
                </div>

                {/* Bottom row: per-card sparkline from the real 7-day trend.
                    Hidden for cards without a meaningful daily series. */}
                {s.trend.length >= 2 && (
                  <div className="admin-stat-chart mt-4">
                    <MiniChart data={s.trend} color="#34D399" />
                  </div>
                )}
              </div>
            ))}
      </div>

      {/* ── Middle Row ── */}
      <div className="admin-mid-grid">
        {/* Attendance Distribution */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Distribusi Kehadiran</h2>
          </div>
          <DonutChart
            presentCount={summary?.presentToday}
            lateCount={summary?.lateToday}
            absentCount={summary?.absent}
            totalEmployees={summary?.totalEmployees}
          />
          <div className="admin-progress-list">
            {loadingDept ? (
              <div className="space-y-3 animate-pulse">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between">
                      <div className="h-3 w-32 rounded bg-slate-700" />
                      <div className="h-3 w-8 rounded bg-slate-700" />
                    </div>
                    <div className="h-1.5 w-full rounded bg-slate-700" />
                  </div>
                ))}
              </div>
            ) : errorDept || progressItems.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">
                {errorDept ? "Gagal memuat distribusi" : "Tidak ada data departemen"}
              </p>
            ) : (
              progressItems.map((p) => (
                <div key={p.label} className="admin-progress-item">
                  <div className="admin-progress-info">
                    <span>{p.label}</span>
                    <span>{p.pct}%</span>
                  </div>
                  <div className="admin-progress-bar-track">
                    <div
                      className="admin-progress-bar-fill"
                      style={{ width: `${p.pct}%`, background: p.color }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Aktivitas Real-Time</h2>
            <span className="admin-live-badge">● LIVE</span>
          </div>
          <div className="admin-activity-feed" suppressHydrationWarning>
            {loadingActivity ? (
              <ActivitySkeleton />
            ) : errorActivity || activities.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">
                {errorActivity ? "Gagal memuat aktivitas" : "Belum ada check-in hari ini"}
              </p>
            ) : (
              <AnimatedList delay={1500}>
                {activities.map((a, i) => (
                  <figure key={i} className="admin-activity-item">
                    <div
                      className="admin-activity-icon"
                      style={{ backgroundColor: a.color + "22", color: a.color }}
                    >
                      {a.icon}
                    </div>
                    <div className="admin-activity-body">
                      <p className="admin-activity-name">{a.name}</p>
                      <p className="admin-activity-action">{a.action}</p>
                    </div>
                    <span className="admin-activity-time">{a.time}</span>
                  </figure>
                ))}
              </AnimatedList>
            )}
          </div>
        </div>

        {/* Operational Summary — all values sourced from the real dashboard summary */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Ringkasan Operasional</h2>
          </div>
          {loadingSummary ? (
            <div className="admin-sys-grid animate-pulse">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="admin-sys-card">
                  <div className="h-8 w-8 rounded bg-slate-700" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-12 rounded bg-slate-700" />
                    <div className="h-3 w-20 rounded bg-slate-700" />
                  </div>
                </div>
              ))}
            </div>
          ) : errorSummary || !summary ? (
            <p className="text-slate-500 text-sm text-center py-8">
              Gagal memuat ringkasan
            </p>
          ) : (
            <div className="admin-sys-grid">
              {[
                {
                  label: "Total Check-in",
                  val: String(summary.presentToday + summary.lateToday),
                  icon: <UserCheck size={18} className="text-[#047857]" />,
                },
                {
                  label: "Sedang Cuti",
                  val: String(summary.onLeave),
                  icon: <HeartPulse size={18} className="text-[#047857]" />,
                },
                {
                  label: "Belum Checkout",
                  val: String(summary.pendingCheckout),
                  icon: <Clock size={18} className="text-[#047857]" />,
                },
                {
                  label: "Tanpa Shift",
                  val: String(summary.unassignedShift),
                  icon: <AlertCircle size={18} className="text-[#047857]" />,
                },
              ].map((s) => (
                <div key={s.label} className="admin-sys-card">
                  <span className="admin-sys-icon flex items-center justify-center">
                    {s.icon}
                  </span>
                  <div>
                    <p className="admin-sys-val">{s.val}</p>
                    <p className="admin-sys-label">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Attendance Table ── */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h2 className="admin-card-title">Rekap Absensi Hari Ini</h2>
            <p className="admin-card-sub">
              {loadingTable
                ? "Memuat data..."
                : `Menampilkan ${recentAttendance.length} karyawan terkini`}
            </p>
          </div>
        </div>
        {loadingTable ? (
          <TableSkeleton />
        ) : errorTable || recentAttendance.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">
            {errorTable ? "Gagal memuat rekap absensi" : "Belum ada absensi hari ini"}
          </p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Departemen</th>
                  <th>Masuk</th>
                  <th>Keluar</th>
                  <th>Status</th>
                  <th>Lokasi</th>
                  <th>Device</th>
                </tr>
              </thead>
              <tbody>
                {recentAttendance.map((row, i) => (
                  <tr key={i}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="admin-table-avatar">
                          {row.name.charAt(0)}
                        </div>
                        <span className="font-medium text-slate-100">
                          {row.name}
                        </span>
                      </div>
                    </td>
                    <td>{row.dept}</td>
                    <td className="font-mono">{row.checkin}</td>
                    <td className="font-mono">{row.checkout}</td>
                    <td>
                      <StatusBadge status={row.status} />
                    </td>
                    <td>
                      <span className="flex items-center gap-1 text-slate-400">
                        <MapPin size={12} />
                        {row.location}
                      </span>
                    </td>
                    <td>
                      <span className="flex items-center gap-1 text-slate-400">
                        <Smartphone size={12} />
                        {row.device}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
