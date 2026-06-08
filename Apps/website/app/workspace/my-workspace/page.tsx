"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  FileText,
  Plus,
  Send,
  Smartphone,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { createClientApiClient } from "@/lib/apiClient";
import type { PaginatedData } from "@/lib/apiClient";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MeResponse {
  authUserId: string;
  email: string;
  name: string;
  role: string;
  workspaceId: string;
  department?: string;
}

interface DashboardSummary {
  presentToday?: number;
  absent?: number;
  late?: number;
  // API may use camelCase or snake_case variants
  present_today?: number;
  absent_today?: number;
  late_today?: number;
  totalEmployees?: number;
}

interface LeaveRequest {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  status: "Pending" | "Approved" | "Rejected" | "Cancelled";
  reason?: string;
  employeeName?: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn?: string;
  check_in?: string;
  status: "Present" | "Late" | "Absent" | "Leave" | string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function currentMonthRange(): { start: string; end: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const start = `${year}-${month}-01`;
  const end = `${year}-${month}-${String(now.getDate()).padStart(2, "0")}`;
  return { start, end };
}

function formatDateRange(startDate: string, endDate: string): string {
  const fmt = (d: string) => {
    const date = new Date(d + "T00:00:00");
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };
  if (startDate === endDate) return fmt(startDate);
  const s = new Date(startDate + "T00:00:00");
  const e = new Date(endDate + "T00:00:00");
  const sStr = s.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  const eStr = e.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  return `${sStr} - ${eStr}`;
}

function statusColors(status: string): string {
  switch (status) {
    case "Approved":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "Rejected":
      return "bg-red-100 text-red-800 border-red-200";
    case "Cancelled":
      return "bg-gray-100 text-gray-600 border-gray-200";
    default: // Pending
      return "bg-amber-100 text-amber-800 border-amber-200";
  }
}

function calendarDayColor(status: string | undefined): string {
  switch (status) {
    case "Present":
      return "bg-emerald-500 text-white";
    case "Late":
      return "bg-amber-500 text-white";
    case "Absent":
      return "bg-red-500 text-white";
    case "Leave":
      return "bg-purple-500 text-white";
    default:
      return "border border-outline-variant/50 text-on-surface-variant/80 font-normal";
  }
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// Monday-based day-of-week (0=Mon … 6=Sun)
function mondayWeekday(date: Date): number {
  return (date.getDay() + 6) % 7;
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function MyWorkspacePage() {
  const api = createClientApiClient();
  const today = todayISO();

  // ── State ────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);

  const [me, setMe] = useState<MeResponse | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({});
  const [calendarError, setCalendarError] = useState(false);
  const [leaveError, setLeaveError] = useState(false);

  // Leave modal state
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveType, setLeaveType] = useState("Annual Leave");
  const [leaveStartDate, setLeaveStartDate] = useState("");
  const [leaveEndDate, setLeaveEndDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Data Fetching ─────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { start, end } = currentMonthRange();

    const [meRes, summaryRes, leaveRes, attendanceTodayRes, attendanceMonthRes] =
      await Promise.allSettled([
        api.get<MeResponse>("v1/me"),
        api.get<DashboardSummary>("v1/dashboard/summary", { date: today }),
        api.get<PaginatedData<LeaveRequest> | LeaveRequest[]>("v1/leave-requests", {
          page_size: "5",
        }),
        api.get<PaginatedData<AttendanceRecord>>("v1/attendance", {
          date: today,
          page_size: "1",
        }),
        api.get<PaginatedData<AttendanceRecord>>("v1/attendance", {
          start_date: start,
          end_date: end,
          page_size: "100",
        }),
      ]);

    // -- me
    if (meRes.status === "fulfilled" && meRes.value.success) {
      setMe((meRes.value as { success: true; data: MeResponse }).data);
    }

    // -- dashboard summary
    if (summaryRes.status === "fulfilled" && summaryRes.value.success) {
      setSummary((summaryRes.value as { success: true; data: DashboardSummary }).data);
    }

    // -- leave requests
    if (leaveRes.status === "fulfilled" && leaveRes.value.success) {
      const raw = (leaveRes.value as { success: true; data: PaginatedData<LeaveRequest> | LeaveRequest[] }).data;
      const list: LeaveRequest[] = Array.isArray(raw)
        ? raw
        : (raw as PaginatedData<LeaveRequest>).data ?? [];
      setLeaveRequests(list);
      setLeaveError(false);
    } else {
      setLeaveError(true);
    }

    // -- today's check-in
    if (attendanceTodayRes.status === "fulfilled" && attendanceTodayRes.value.success) {
      const raw = (attendanceTodayRes.value as { success: true; data: PaginatedData<AttendanceRecord> }).data;
      const records: AttendanceRecord[] = Array.isArray(raw) ? raw : raw.data ?? [];
      const todayRecord = records.find((r) => r.date?.startsWith(today));
      const hasCheckedIn = !!(todayRecord?.checkIn || todayRecord?.check_in);
      setIsCheckedIn(hasCheckedIn);
    }

    // -- attendance calendar
    if (attendanceMonthRes.status === "fulfilled" && attendanceMonthRes.value.success) {
      const raw = (attendanceMonthRes.value as { success: true; data: PaginatedData<AttendanceRecord> }).data;
      const records: AttendanceRecord[] = Array.isArray(raw) ? raw : raw.data ?? [];
      const map: Record<string, string> = {};
      records.forEach((r) => {
        const day = r.date?.split("T")[0]?.split("-")[2];
        if (day) map[String(parseInt(day, 10))] = r.status;
      });
      setAttendanceMap(map);
      setCalendarError(false);
    } else {
      setCalendarError(true);
    }

    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Leave Submit ──────────────────────────────────────────────────────────
  const submitLeaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveStartDate || !leaveEndDate) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await api.post<LeaveRequest>("v1/leave-requests", {
        type: leaveType,
        startDate: leaveStartDate,
        endDate: leaveEndDate,
        reason: leaveReason,
      });

      if (res.success) {
        const newReq = (res as { success: true; data: LeaveRequest }).data;
        setLeaveRequests((prev) => [newReq, ...prev]);
        setShowLeaveModal(false);
        setLeaveStartDate("");
        setLeaveEndDate("");
        setLeaveReason("");
        setLeaveType("Annual Leave");
      } else {
        setSubmitError((res as { success: false; error: { message: string } }).error?.message ?? "Failed to submit request.");
      }
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Calendar Grid ─────────────────────────────────────────────────────────
  const now = new Date();
  const calYear = now.getFullYear();
  const calMonth = now.getMonth();
  const totalDays = daysInMonth(calYear, calMonth);
  const firstDayOffset = mondayWeekday(new Date(calYear, calMonth, 1));
  // Previous month's trailing days shown in first row
  const prevMonthDays = daysInMonth(calYear, calMonth === 0 ? 11 : calMonth - 1);
  const monthName = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // ── Derived display values ─────────────────────────────────────────────
  const userName = me?.name ?? "—";
  const userInitials = me ? getInitials(me.name) : "—";
  const presentCount = summary?.presentToday ?? summary?.present_today ?? "—";
  const absentCount = summary?.absent ?? summary?.absent_today ?? "—";
  const lateCount = summary?.late ?? summary?.late_today ?? "—";

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-on-surface-variant">
          <Loader2 size={32} className="animate-spin text-primary" />
          <span className="text-sm font-medium">Loading your workspace…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Hero Welcome Card */}
      <div className="bg-primary text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md relative overflow-hidden">
        {/* Abstract design element background */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-secondary/15 rounded-full blur-2xl pointer-events-none translate-x-20 -translate-y-20" />
        <div className="absolute left-0 bottom-0 w-60 h-60 bg-mint/10 rounded-full blur-2xl pointer-events-none -translate-x-20 translate-y-20" />

        <div className="space-y-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center font-bold text-lg">
              {userInitials}
            </div>
            <div>
              <span className="text-[10px] text-mint uppercase font-semibold tracking-wider">
                Personal Desk
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                Good morning, {userName.split(" ")[0]}
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-200 max-w-md font-medium leading-relaxed">
            {isCheckedIn
              ? "You have checked in today. Have a productive shift!"
              : "You are currently checked out. Check-in dilakukan via aplikasi mobile."}
          </p>
        </div>

        {/* Checked status & informational note */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 relative z-10">
          <div className="bg-white/10 border border-white/15 px-4 py-3 rounded-2xl flex items-center gap-3 backdrop-blur-xs">
            <div className={`w-3 h-3 rounded-full ${isCheckedIn ? "bg-mint animate-pulse" : "bg-slate-400"}`} />
            <div className="text-left">
              <span className="text-[9px] text-slate-300 block uppercase font-bold tracking-wider">
                Status Today
              </span>
              <span className="text-xs font-bold">
                {isCheckedIn ? "Checked In" : "Not Checked In"}
              </span>
            </div>
          </div>

          {/* Informational only — actual check-in via mobile */}
          <div className="h-11 px-5 bg-white/10 border border-white/20 text-white font-semibold text-[11px] rounded-2xl flex items-center justify-center gap-2 cursor-default select-none">
            <Smartphone size={14} />
            Check-in via mobile app
          </div>
        </div>
      </div>

      {/* 2. Attendance Stats Row from dashboard/summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
              Present Today
            </span>
            <p className="text-2xl font-bold text-on-surface">{presentCount}</p>
            <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 mt-1">
              <TrendingUp size={10} />
              From dashboard
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
            <CheckCircle size={18} className="text-emerald-500" />
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
              Absent Today
            </span>
            <p className="text-2xl font-bold text-on-surface">{absentCount}</p>
            <p className="text-[10px] text-on-surface-variant font-semibold mt-1">
              Not present
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
            <AlertCircle size={18} className="text-red-500" />
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
              Late Arrivals
            </span>
            <p className="text-2xl font-bold text-on-surface">{lateCount}</p>
            <p className="text-[10px] text-on-surface-variant font-semibold mt-1">
              Limit: Max 3 per month
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <Clock size={18} className="text-amber-500" />
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
              Leave Balance
            </span>
            <p className="text-2xl font-bold text-on-surface">— / 12</p>
            <p className="text-[10px] text-on-surface-variant font-semibold mt-1">
              Days remaining this year
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
            <FileText size={18} className="text-secondary" />
          </div>
        </div>
      </div>

      {/* 3. Grid Columns — Calendar & Leave */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Attendance Mini Calendar */}
        <div className="lg:col-span-7 bg-surface-container-lowest border border-outline-variant rounded-2xl p-5">
          <div className="pb-4 border-b border-outline-variant/60 flex justify-between items-center">
            <div>
              <h3 className="font-title-md font-bold text-on-surface">Mini Attendance Log</h3>
              <p className="text-[11px] text-on-surface-variant">
                {monthName} attendance calendar
              </p>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold text-on-surface-variant">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Present
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Late
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Absent
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Leave
              </span>
            </div>
          </div>

          {calendarError ? (
            <div className="mt-6 flex flex-col items-center justify-center gap-2 py-10 text-on-surface-variant">
              <AlertCircle size={24} className="text-amber-500" />
              <p className="text-xs font-medium">Could not load attendance data.</p>
              <p className="text-[10px]">Calendar is unavailable right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2 mt-6 text-center text-[10px] font-bold text-on-surface-variant">
              <span>MON</span>
              <span>TUE</span>
              <span>WED</span>
              <span>THU</span>
              <span>FRI</span>
              <span>SAT</span>
              <span>SUN</span>

              {/* Trailing days from previous month */}
              {Array.from({ length: firstDayOffset }).map((_, i) => (
                <span key={`prev-${i}`} className="text-slate-300 font-normal">
                  {prevMonthDays - firstDayOffset + 1 + i}
                </span>
              ))}

              {/* Current month days */}
              {Array.from({ length: totalDays }).map((_, i) => {
                const day = i + 1;
                const status = attendanceMap[String(day)];
                const colorClass = calendarDayColor(status);
                const isFuture = day > now.getDate();
                return (
                  <span
                    key={day}
                    className={`h-9 flex items-center justify-center rounded-lg ${
                      isFuture
                        ? "border border-outline-variant/50 text-on-surface-variant/40 font-normal"
                        : colorClass
                    }`}
                  >
                    {day}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Leave Requests Management */}
        <div className="lg:col-span-5 bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 flex flex-col">
          <div className="pb-4 border-b border-outline-variant/60 flex justify-between items-center">
            <div>
              <h3 className="font-title-md font-bold text-on-surface">Leave Requests</h3>
              <p className="text-[11px] text-on-surface-variant">Submit and monitor time off requests</p>
            </div>
            <button
              onClick={() => setShowLeaveModal(true)}
              className="h-7 px-3 bg-primary text-white font-bold text-[10px] rounded-lg hover:bg-primary/95 flex items-center gap-1 transition-colors"
            >
              <Plus size={11} />
              Request
            </button>
          </div>

          <div className="mt-4 space-y-3.5 flex-1">
            {leaveError ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-on-surface-variant">
                <AlertCircle size={20} className="text-amber-500" />
                <p className="text-xs font-medium text-center">Could not load leave requests.</p>
              </div>
            ) : leaveRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-on-surface-variant">
                <FileText size={20} className="opacity-40" />
                <p className="text-xs font-medium">No leave requests found.</p>
              </div>
            ) : (
              leaveRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-3 border border-outline-variant rounded-xl flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold text-on-surface">{req.type}</h4>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">
                      {formatDateRange(req.startDate, req.endDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${statusColors(req.status)}`}>
                      {req.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. Leave Request Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            onClick={() => setShowLeaveModal(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          />
          <div className="relative bg-surface-container-lowest border border-outline-variant w-full max-w-md p-6 rounded-2xl shadow-xl z-10 m-4">
            <div className="flex justify-between items-center pb-4 border-b border-outline-variant">
              <h3 className="font-title-md font-bold text-on-surface">Submit Leave Request</h3>
              <button
                onClick={() => setShowLeaveModal(false)}
                className="text-on-surface-variant hover:text-on-surface text-xs font-bold"
              >
                Close
              </button>
            </div>

            <form onSubmit={submitLeaveRequest} className="mt-4 space-y-4">
              {submitError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle size={14} className="text-red-500 shrink-0" />
                  <p className="text-[11px] text-red-700 font-medium">{submitError}</p>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-on-surface-variant block uppercase">
                  Leave Category
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full h-9 px-3 border border-outline-variant rounded-lg text-xs font-semibold bg-surface focus:ring-1 focus:ring-primary focus:outline-hidden"
                >
                  <option>Annual Leave</option>
                  <option>Sick Leave</option>
                  <option>Personal Permission</option>
                  <option>WFH Request</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface-variant block uppercase">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={leaveStartDate}
                    onChange={(e) => setLeaveStartDate(e.target.value)}
                    required
                    className="w-full h-9 px-3 border border-outline-variant rounded-lg text-xs font-semibold bg-surface focus:ring-1 focus:ring-primary focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface-variant block uppercase">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={leaveEndDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    required
                    min={leaveStartDate}
                    className="w-full h-9 px-3 border border-outline-variant rounded-lg text-xs font-semibold bg-surface focus:ring-1 focus:ring-primary focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-on-surface-variant block uppercase">
                  Reason
                </label>
                <textarea
                  placeholder="Brief reason for leave…"
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg text-xs font-semibold bg-surface focus:ring-1 focus:ring-primary focus:outline-hidden resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-10 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary/95 transition-colors flex items-center justify-center gap-1.5 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={13} />
                )}
                {submitting ? "Submitting…" : "Submit Request"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
