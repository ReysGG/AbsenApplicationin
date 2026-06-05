"use client";

import { NumberTicker } from "@/components/ui/number-ticker";
import { AnimatedList } from "@/components/ui/animated-list";
import { BorderBeam } from "@/components/ui/border-beam";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { useState, useEffect } from "react";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  RefreshCw,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
  Smartphone,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Stat Cards ──────────────────────────────────────────────────────────────

interface StatCard {
  title: string;
  value: number;
  suffix?: string;
  change: number;
  changeLabel: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
}

const stats: StatCard[] = [
  {
    title: "Total Karyawan",
    value: 248,
    change: 12,
    changeLabel: "vs bulan lalu",
    icon: <Users size={22} />,
    color: "stat-icon--navy",
    gradient: "stat-bg--navy",
  },
  {
    title: "Hadir Hari Ini",
    value: 221,
    suffix: "",
    change: 3.2,
    changeLabel: "vs kemarin",
    icon: <UserCheck size={22} />,
    color: "stat-icon--cyan",
    gradient: "stat-bg--cyan",
  },
  {
    title: "Tidak Hadir",
    value: 27,
    change: -2,
    changeLabel: "vs kemarin",
    icon: <UserX size={22} />,
    color: "stat-icon--error",
    gradient: "stat-bg--error",
  },
  {
    title: "Terlambat",
    value: 14,
    change: -5.1,
    changeLabel: "vs kemarin",
    icon: <Clock size={22} />,
    color: "stat-icon--warn",
    gradient: "stat-bg--warn",
  },
];

// ── Activity items ───────────────────────────────────────────────────────────

interface Activity {
  name: string;
  action: string;
  time: string;
  icon: string;
  color: string;
  status: "success" | "warning" | "error";
}

const activities: Activity[] = [
  {
    name: "Budi Santoso",
    action: "Check-in berhasil",
    time: "08:02",
    icon: "✅",
    color: "#10b981",
    status: "success",
  },
  {
    name: "Siti Rahayu",
    action: "Pengajuan izin sakit",
    time: "08:15",
    icon: "🏥",
    color: "#f59e0b",
    status: "warning",
  },
  {
    name: "Ahmad Fauzi",
    action: "Terlambat 32 menit",
    time: "08:47",
    icon: "⚠️",
    color: "#ef4444",
    status: "error",
  },
  {
    name: "Dewi Puspita",
    action: "Check-in berhasil",
    time: "07:58",
    icon: "✅",
    color: "#10b981",
    status: "success",
  },
  {
    name: "Rizki Pratama",
    action: "Lembur disetujui",
    time: "09:01",
    icon: "🕐",
    color: "#6366f1",
    status: "success",
  },
  {
    name: "Nurul Hidayah",
    action: "Check-in berhasil",
    time: "07:50",
    icon: "✅",
    color: "#10b981",
    status: "success",
  },
  {
    name: "Dito Prasetyo",
    action: "Tidak hadir tanpa keterangan",
    time: "–",
    icon: "❌",
    color: "#ef4444",
    status: "error",
  },
];

// ── Quick Actions ────────────────────────────────────────────────────────────

const quickActions = [
  { label: "Rekap Harian", icon: <Calendar size={16} />, href: "#" },
  { label: "Export Excel", icon: <Download size={16} />, href: "#" },
  { label: "Sync Data", icon: <RefreshCw size={16} />, href: "#" },
];

// ── Recent attendance table ──────────────────────────────────────────────────

const recentAttendance = [
  {
    name: "Budi Santoso",
    dept: "Engineering",
    checkin: "08:02",
    checkout: "17:05",
    status: "Hadir",
    location: "Kantor",
    device: "Mobile",
  },
  {
    name: "Siti Rahayu",
    dept: "HR",
    checkin: "–",
    checkout: "–",
    status: "Izin",
    location: "–",
    device: "–",
  },
  {
    name: "Ahmad Fauzi",
    dept: "Finance",
    checkin: "08:47",
    checkout: "17:00",
    status: "Terlambat",
    location: "Kantor",
    device: "Mobile",
  },
  {
    name: "Dewi Puspita",
    dept: "Marketing",
    checkin: "07:58",
    checkout: "17:10",
    status: "Hadir",
    location: "Remote",
    device: "Web",
  },
  {
    name: "Rizki Pratama",
    dept: "Engineering",
    checkin: "08:00",
    checkout: "19:30",
    status: "Lembur",
    location: "Kantor",
    device: "Mobile",
  },
  {
    name: "Nurul Hidayah",
    dept: "Legal",
    checkin: "07:50",
    checkout: "16:55",
    status: "Hadir",
    location: "Kantor",
    device: "Face ID",
  },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; icon: React.ReactNode }> = {
    Hadir: {
      cls: "status-badge--success",
      icon: <CheckCircle2 size={12} />,
    },
    Izin: {
      cls: "status-badge--warning",
      icon: <AlertCircle size={12} />,
    },
    Terlambat: {
      cls: "status-badge--error",
      icon: <XCircle size={12} />,
    },
    Lembur: {
      cls: "status-badge--info",
      icon: <Clock size={12} />,
    },
  };
  const { cls, icon } = map[status] ?? { cls: "", icon: null };
  return (
    <span className={cn("status-badge", cls)}>
      {icon}
      {status}
    </span>
  );
}

// ── Mini sparkline ───────────────────────────────────────────────────────────

function MiniChart({
  data,
  color,
}: {
  data: number[];
  color: string;
}) {
  const max = Math.max(...data);
  const w = 80;
  const h = 32;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - (v / max) * h;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      {/* last point dot */}
      {(() => {
        const last = data[data.length - 1];
        const x = w;
        const y = h - (last / max) * h;
        return <circle cx={x} cy={y} r="3" fill={color} />;
      })()}
    </svg>
  );
}

// ── Donut chart (CSS) ────────────────────────────────────────────────────────

function DonutChart() {
  const hadir = 89;
  const terlambat = 6;
  const absen = 5;

  return (
    <div className="admin-donut-wrap">
      <div className="admin-donut">
        <svg viewBox="0 0 36 36" className="admin-donut-svg">
          <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#eceef0" strokeWidth="3" />
          <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#0A192F" strokeWidth="3"
            strokeDasharray={`${hadir} ${100 - hadir}`} strokeDashoffset="25" strokeLinecap="round" />
          <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#00E5FF" strokeWidth="3"
            strokeDasharray={`${terlambat} ${100 - terlambat}`} strokeDashoffset={`${25 - hadir}`} strokeLinecap="round" />
          <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#ba1a1a" strokeWidth="3"
            strokeDasharray={`${absen} ${100 - absen}`} strokeDashoffset={`${25 - hadir - terlambat}`} strokeLinecap="round" />
        </svg>
        <div className="admin-donut-center">
          <span className="admin-donut-pct">89%</span>
          <span className="admin-donut-sub">Hadir</span>
        </div>
      </div>
      <div className="admin-donut-legend">
        {[
          { color: "#0A192F", label: "Hadir", val: "221" },
          { color: "#00B8CC", label: "Terlambat", val: "14" },
          { color: "#ba1a1a", label: "Absen", val: "13" },
        ].map((l) => (
          <div key={l.label} className="admin-donut-legend-item">
            <span className="admin-donut-legend-dot" style={{ background: l.color }} />
            <span className="admin-donut-legend-label">{l.label}</span>
            <span className="admin-donut-legend-val">{l.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [today, setToday] = useState("");

  // Avoid hydration mismatch — set date only on client
  useEffect(() => {
    setToday(
      new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date())
    );
  }, []);

  const weeklyData = [62, 71, 68, 74, 80, 77, 89];

  return (
    <div className="admin-dashboard">
      {/* ── Page Header ── */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-subtitle">{today}</p>
        </div>
        <div className="admin-page-actions">
          {quickActions.map((a) => (
            <button key={a.label} className="admin-action-btn">
              {a.icon}
              <span className="hidden sm:inline">{a.label}</span>
            </button>
          ))}
          <ShimmerButton
            className="admin-primary-btn"
            shimmerColor="#818cf8"
            background="linear-gradient(135deg,#6366f1,#8b5cf6)"
          >
            + Tambah Data
          </ShimmerButton>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="admin-stat-grid">
        {stats.map((s) => (
          <div key={s.title} className="admin-stat-card">
            <BorderBeam size={60} duration={8} colorFrom="#0A192F" colorTo="#00E5FF" />
            <div className={cn("admin-stat-icon-wrap", s.color)}>
              <div className={cn("admin-stat-icon-bg", s.gradient)}>
                {s.icon}
              </div>
            </div>
            <div className="admin-stat-body">
              <p className="admin-stat-title">{s.title}</p>
              <p className="admin-stat-value">
                <NumberTicker
                  value={s.value}
                  className="admin-ticker"
                />
              </p>
              <div className="admin-stat-change">
                {s.change >= 0 ? (
                  <ArrowUpRight size={14} className="text-emerald-400" />
                ) : (
                  <ArrowDownRight size={14} className="text-rose-400" />
                )}
                <span
                  className={
                    s.change >= 0 ? "text-emerald-400" : "text-rose-400"
                  }
                >
                  {Math.abs(s.change)}%
                </span>
                <span className="text-slate-500">{s.changeLabel}</span>
              </div>
            </div>
            <div className="admin-stat-chart">
              <MiniChart data={weeklyData} color={s.change >= 0 ? "#10B981" : "#ba1a1a"} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Middle Row ── */}
      <div className="admin-mid-grid">
        {/* Attendance Distribution */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Distribusi Kehadiran</h2>
            <button className="admin-card-action">
              <MoreHorizontal size={16} />
            </button>
          </div>
          <DonutChart />
          <div className="admin-progress-list">
            {[
              { label: "Tepat Waktu", pct: 83, color: "#0A192F" },
              { label: "Terlambat < 30 mnt", pct: 10, color: "#00B8CC" },
              { label: "Terlambat > 30 mnt", pct: 7, color: "#ba1a1a" },
            ].map((p) => (
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
            ))}
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Aktivitas Real-Time</h2>
            <span className="admin-live-badge">● LIVE</span>
          </div>
          <div className="admin-activity-feed" suppressHydrationWarning>
            <AnimatedList delay={1500}>
              {activities.map((a, i) => (
                <figure
                  key={i}
                  className="admin-activity-item"
                >
                  <div
                    className="admin-activity-icon"
                    style={{ backgroundColor: a.color + "22" }}
                  >
                    <span>{a.icon}</span>
                  </div>
                  <div className="admin-activity-body">
                    <p className="admin-activity-name">{a.name}</p>
                    <p className="admin-activity-action">{a.action}</p>
                  </div>
                  <span className="admin-activity-time">{a.time}</span>
                </figure>
              ))}
            </AnimatedList>
          </div>
        </div>

        {/* System Info */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Info Sistem</h2>
          </div>
          <div className="admin-sys-grid">
            {[
              { label: "Server Uptime", val: "99.9%", icon: "🟢", trend: "+0.1%" },
              { label: "Total Check-in", val: "1,247", icon: "📍", trend: "+87" },
              { label: "Lokasi Aktif", val: "12", icon: "🏢", trend: "0" },
              { label: "Device Terdaftar", val: "312", icon: "📱", trend: "+3" },
            ].map((s) => (
              <div key={s.label} className="admin-sys-card">
                <span className="admin-sys-icon">{s.icon}</span>
                <div>
                  <p className="admin-sys-val">{s.val}</p>
                  <p className="admin-sys-label">{s.label}</p>
                  <p className="admin-sys-trend text-emerald-400">{s.trend}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Resource bars */}
          <div className="mt-4 space-y-3">
            {[
              { label: "CPU Usage", val: 34, color: "#0A192F" },
              { label: "Memory", val: 70, color: "#006875" },
              { label: "Storage", val: 48, color: "#00B8CC" },
            ].map((r) => (
              <div key={r.label}>
                <div className="flex justify-between text-xs mb-1" style={{color:'#75777e'}}>
                  <span>{r.label}</span>
                  <span>{r.val}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{background:'#eceef0'}}>
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${r.val}%`, background: r.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Attendance Table ── */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h2 className="admin-card-title">Rekap Absensi Hari Ini</h2>
            <p className="admin-card-sub">Menampilkan 6 dari 248 karyawan</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="admin-action-btn text-xs">
              <Download size={14} />
              Export
            </button>
            <button className="admin-action-btn text-xs">
              Lihat Semua
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
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
                <th></th>
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
                  <td>
                    <button className="admin-table-action">
                      <MoreHorizontal size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
