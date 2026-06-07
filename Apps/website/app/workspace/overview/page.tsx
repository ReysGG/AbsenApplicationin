"use client";

/**
 * app/workspace/overview/page.tsx
 *
 * Halaman Overview Dashboard — Client Component.
 *
 * Fitur:
 * - Filter tanggal (default: hari ini)
 * - 6 summary cards (Total, Hadir, Terlambat, Izin/Cuti, Tidak Hadir, Belum Pulang)
 * - Klik card "Terlambat" → Live Attendance filter status=Late (R5.5)
 * - Grafik tren kehadiran 30 hari (Recharts AreaChart)
 * - Tabel breakdown per divisi
 * - Live preview 5 check-in terakhir
 * - Semua section punya empty state yang aman — tidak crash (R5.9, R19.9)
 *
 * Data diambil dari BFF:
 *   /api/v1/dashboard/summary
 *   /api/v1/dashboard/attendance-trend
 *   /api/v1/dashboard/department-breakdown
 *   /api/v1/dashboard/live-preview
 *
 * Requirements: 5.1, 5.5, 19.5, 19.9
 */

import React, { useState, useEffect, useCallback } from "react";
import { RefreshCw, CalendarDays, AlertCircle } from "lucide-react";
import { createClientApiClient } from "@/lib/apiClient";
import SummaryCards from "./_components/SummaryCards";
import AttendanceTrendChart from "./_components/AttendanceTrendChart";
import DepartmentBreakdown from "./_components/DepartmentBreakdown";
import LivePreview from "./_components/LivePreview";
import type {
  DashboardSummary,
  AttendanceTrendPoint,
  DepartmentBreakdownRow,
  LivePreviewItem,
} from "@/types/overview";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayDateString(): string {
  return new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
}

function formatDisplayDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

type SectionError = {
  summary?: string;
  trend?: string;
  breakdown?: string;
  preview?: string;
};

export default function OverviewPage() {
  const [selectedDate, setSelectedDate] = useState<string>(todayDateString());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [summary, setSummary] = useState<FetchState<DashboardSummary>>({
    data: null,
    loading: true,
    error: null,
  });
  const [trend, setTrend] = useState<FetchState<AttendanceTrendPoint[]>>({
    data: null,
    loading: true,
    error: null,
  });
  const [breakdown, setBreakdown] = useState<
    FetchState<DepartmentBreakdownRow[]>
  >({
    data: null,
    loading: true,
    error: null,
  });
  const [livePreview, setLivePreview] = useState<FetchState<LivePreviewItem[]>>(
    {
      data: null,
      loading: true,
      error: null,
    }
  );

  const sectionErrors: SectionError = {
    ...(summary.error ? { summary: summary.error } : {}),
    ...(trend.error ? { trend: trend.error } : {}),
    ...(breakdown.error ? { breakdown: breakdown.error } : {}),
    ...(livePreview.error ? { preview: livePreview.error } : {}),
  };
  const hasErrors = Object.keys(sectionErrors).length > 0;

  // ---------------------------------------------------------------------------
  // Fetch helpers — wrap each call so one failure doesn't block others
  // ---------------------------------------------------------------------------

  const fetchAllData = useCallback(
    async (date: string, isManualRefresh = false) => {
      if (isManualRefresh) setIsRefreshing(true);

      const api = createClientApiClient();
      const params: Record<string, string> = { date };

      // Reset loading states
      setSummary((s) => ({ ...s, loading: true, error: null }));
      setTrend((s) => ({ ...s, loading: true, error: null }));
      setBreakdown((s) => ({ ...s, loading: true, error: null }));
      setLivePreview((s) => ({ ...s, loading: true, error: null }));

      // Fire all 4 requests in parallel
      const [summaryRes, trendRes, breakdownRes, previewRes] =
        await Promise.allSettled([
          api.get<DashboardSummary>("v1/dashboard/summary", params),
          api.get<AttendanceTrendPoint[]>("v1/dashboard/attendance-trend"),
          api.get<DepartmentBreakdownRow[]>(
            "v1/dashboard/department-breakdown",
            params
          ),
          api.get<LivePreviewItem[]>("v1/dashboard/live-preview", params),
        ]);

      // Summary
      if (summaryRes.status === "fulfilled" && summaryRes.value.success) {
        setSummary({ data: summaryRes.value.data, loading: false, error: null });
      } else {
        const msg =
          summaryRes.status === "rejected"
            ? "Gagal memuat ringkasan"
            : summaryRes.value.success === false
            ? summaryRes.value.error.message
            : "Gagal memuat ringkasan";
        setSummary({ data: null, loading: false, error: msg });
      }

      // Trend
      if (trendRes.status === "fulfilled" && trendRes.value.success) {
        setTrend({ data: trendRes.value.data, loading: false, error: null });
      } else {
        const msg =
          trendRes.status === "rejected"
            ? "Gagal memuat tren"
            : trendRes.value.success === false
            ? trendRes.value.error.message
            : "Gagal memuat tren";
        setTrend({ data: null, loading: false, error: msg });
      }

      // Breakdown
      if (breakdownRes.status === "fulfilled" && breakdownRes.value.success) {
        setBreakdown({
          data: breakdownRes.value.data,
          loading: false,
          error: null,
        });
      } else {
        const msg =
          breakdownRes.status === "rejected"
            ? "Gagal memuat breakdown divisi"
            : breakdownRes.value.success === false
            ? breakdownRes.value.error.message
            : "Gagal memuat breakdown divisi";
        setBreakdown({ data: null, loading: false, error: msg });
      }

      // Live preview
      if (previewRes.status === "fulfilled" && previewRes.value.success) {
        setLivePreview({
          data: previewRes.value.data,
          loading: false,
          error: null,
        });
      } else {
        const msg =
          previewRes.status === "rejected"
            ? "Gagal memuat preview live"
            : previewRes.value.success === false
            ? previewRes.value.error.message
            : "Gagal memuat preview live";
        setLivePreview({ data: null, loading: false, error: msg });
      }

      if (isManualRefresh) setIsRefreshing(false);
    },
    []
  );

  // Initial load
  useEffect(() => {
    fetchAllData(selectedDate);
  }, [selectedDate, fetchAllData]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    if (newDate) setSelectedDate(newDate);
  };

  const handleRefresh = () => {
    fetchAllData(selectedDate, true);
  };

  const isAnyLoading =
    summary.loading || trend.loading || breakdown.loading || livePreview.loading;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6 max-w-screen-xl mx-auto">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Ringkasan Kehadiran
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {formatDisplayDate(selectedDate)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Date filter (R5.4) */}
          <div className="relative flex items-center">
            <CalendarDays
              className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="date"
              id="overview-date"
              value={selectedDate}
              max={todayDateString()}
              onChange={handleDateChange}
              className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              aria-label="Pilih tanggal untuk filter data dashboard"
            />
          </div>

          {/* Manual refresh */}
          <button
            onClick={handleRefresh}
            disabled={isAnyLoading || isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Perbarui data dashboard"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            <span className="hidden sm:inline">Perbarui</span>
          </button>
        </div>
      </div>

      {/* ── Global error notice (soft — each section still shows empty state) */}
      {hasErrors && !isAnyLoading && (
        <div
          role="alert"
          className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-sm"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          <span>
            Sebagian data tidak dapat dimuat. Coba tekan{" "}
            <strong>Perbarui</strong> untuk mencoba lagi.
          </span>
        </div>
      )}

      {/* ── Summary Cards (6 cards) ───────────────────────────────── */}
      <SummaryCards data={summary.data} loading={summary.loading} />

      {/* ── Trend Chart ───────────────────────────────────────────── */}
      <AttendanceTrendChart data={trend.data} loading={trend.loading} />

      {/* ── Department Breakdown + Live Preview (side by side on lg+) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DepartmentBreakdown
          data={breakdown.data}
          loading={breakdown.loading}
        />
        <LivePreview data={livePreview.data} loading={livePreview.loading} />
      </div>
    </div>
  );
}
