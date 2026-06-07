"use client";

import React, { useState } from "react";
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
  AlertCircle
} from "lucide-react";

export default function MyWorkspacePage() {
  const [isCheckedIn, setIsCheckedIn] = useState(true);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // Leave Requests state
  const [leaveRequests, setLeaveRequests] = useState([
    {
      id: "REQ-901",
      type: "Annual Leave",
      dates: "12 Jun - 14 Jun 2026",
      duration: "3 days",
      status: "Approved",
      statusColor: "bg-emerald-100 text-emerald-800 border-emerald-200"
    },
    {
      id: "REQ-842",
      type: "Sick Leave",
      dates: "28 May 2026",
      duration: "1 day",
      status: "Approved",
      statusColor: "bg-emerald-100 text-emerald-800 border-emerald-200"
    },
    {
      id: "REQ-790",
      type: "Personal Permission",
      dates: "08 May 2026",
      duration: "0.5 day",
      status: "Approved",
      statusColor: "bg-emerald-100 text-emerald-800 border-emerald-200"
    }
  ]);

  // Form states
  const [leaveType, setLeaveType] = useState("Annual Leave");
  const [leaveDates, setLeaveDates] = useState("");
  const [leaveDuration, setLeaveDuration] = useState("");

  const submitLeaveRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const newReq = {
      id: `REQ-${Math.floor(Math.random() * 900) + 100}`,
      type: leaveType,
      dates: leaveDates || "TBD",
      duration: leaveDuration || "1 day",
      status: "Pending",
      statusColor: "bg-amber-100 text-amber-800 border-amber-200"
    };
    setLeaveRequests([newReq, ...leaveRequests]);
    setShowLeaveModal(false);
    // Reset form
    setLeaveDates("");
    setLeaveDuration("");
  };

  const handleCheckOut = () => {
    setIsCheckedIn(false);
  };

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
              MC
            </div>
            <div>
              <span className="text-[10px] text-mint uppercase font-semibold tracking-wider">
                Personal Desk
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Good morning, Michael</h2>
            </div>
          </div>
          <p className="text-xs text-slate-200 max-w-md font-medium leading-relaxed">
            {isCheckedIn
              ? "You successfully checked in at 08:02 AM today. Have a productive shift!"
              : "You are currently checked out. Ensure to register shift start when on premise."}
          </p>
        </div>

        {/* Checked status & Action Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 relative z-10">
          <div className="bg-white/10 border border-white/15 px-4 py-3 rounded-2xl flex items-center gap-3 backdrop-blur-xs">
            <div className="w-3 h-3 rounded-full bg-mint animate-pulse" />
            <div className="text-left">
              <span className="text-[9px] text-slate-300 block uppercase font-bold tracking-wider">
                Shift Schedule
              </span>
              <span className="text-xs font-bold">Morning Shift (07:00 - 15:00)</span>
            </div>
          </div>

          {isCheckedIn ? (
            <button
              onClick={handleCheckOut}
              className="h-11 px-6 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-2xl shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <Clock size={15} />
              Check Out
            </button>
          ) : (
            <button
              onClick={() => setIsCheckedIn(true)}
              className="h-11 px-6 bg-mint hover:bg-mint/90 text-primary font-bold text-xs rounded-2xl shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <Clock size={15} />
              Check In
            </button>
          )}
        </div>
      </div>

      {/* 2. Personal Statistics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Attendance Rate Gauge */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
              Attendance Rate
            </span>
            <p className="text-2xl font-bold text-on-surface">98.2%</p>
            <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 mt-1">
              <TrendingUp size={10} />
              Excellent compliance
            </p>
          </div>
          {/* SVG Radial Progress */}
          <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-surface-container"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-primary"
                strokeWidth="3.5"
                strokeDasharray="98.2, 100"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-[10px] font-bold text-primary">98%</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
              Late Arrivals
            </span>
            <p className="text-2xl font-bold text-on-surface">1 Day</p>
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
              Work Hours
            </span>
            <p className="text-2xl font-bold text-on-surface">160h</p>
            <p className="text-[10px] text-on-surface-variant font-semibold mt-1">
              100% target achieved
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <CheckCircle size={18} className="text-primary" />
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
              Leave Balance
            </span>
            <p className="text-2xl font-bold text-on-surface">10 / 12</p>
            <p className="text-[10px] text-on-surface-variant font-semibold mt-1">
              Days remaining this year
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
            <FileText size={18} className="text-secondary" />
          </div>
        </div>
      </div>

      {/* 3. Grid Columns Calendar & Leave */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Attendance Mini Calendar Card */}
        <div className="lg:col-span-7 bg-surface-container-lowest border border-outline-variant rounded-2xl p-5">
          <div className="pb-4 border-b border-outline-variant/60 flex justify-between items-center">
            <div>
              <h3 className="font-title-md font-bold text-on-surface">Mini Attendance Log</h3>
              <p className="text-[11px] text-on-surface-variant">Review June 2026 record calendar</p>
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
            </div>
          </div>

          {/* Dummy visual grid calendar representation */}
          <div className="grid grid-cols-7 gap-2 mt-6 text-center text-[10px] font-bold text-on-surface-variant">
            <span>MON</span>
            <span>TUE</span>
            <span>WED</span>
            <span>THU</span>
            <span>FRI</span>
            <span>SAT</span>
            <span>SUN</span>

            {/* Empty grid blocks */}
            <span className="text-slate-300 font-normal">25</span>
            <span className="text-slate-300 font-normal">26</span>
            <span className="text-slate-300 font-normal">27</span>
            <span className="text-slate-300 font-normal">28</span>
            <span className="text-slate-300 font-normal">29</span>
            <span className="text-slate-300 font-normal">30</span>
            <span className="text-slate-300 font-normal">31</span>

            {/* Active June calendar days */}
            <span className="h-9 flex items-center justify-center bg-emerald-500 text-white rounded-lg relative">
              1
            </span>
            <span className="h-9 flex items-center justify-center bg-emerald-500 text-white rounded-lg">
              2
            </span>
            <span className="h-9 flex items-center justify-center bg-emerald-500 text-white rounded-lg">
              3
            </span>
            <span className="h-9 flex items-center justify-center bg-amber-500 text-white rounded-lg">
              4
            </span>
            <span className="h-9 flex items-center justify-center bg-emerald-500 text-white rounded-lg">
              5
            </span>
            <span className="h-9 flex items-center justify-center bg-surface-container text-on-surface-variant font-normal rounded-lg">
              6
            </span>
            <span className="h-9 flex items-center justify-center bg-surface-container text-on-surface-variant font-normal rounded-lg">
              7
            </span>

            <span className="h-9 flex items-center justify-center bg-emerald-500 text-white rounded-lg">
              8
            </span>
            <span className="h-9 flex items-center justify-center bg-emerald-500 text-white rounded-lg">
              9
            </span>
            <span className="h-9 flex items-center justify-center bg-emerald-500 text-white rounded-lg">
              10
            </span>
            <span className="h-9 flex items-center justify-center bg-emerald-500 text-white rounded-lg">
              11
            </span>
            <span className="h-9 flex items-center justify-center bg-emerald-500 text-white rounded-lg">
              12
            </span>
            <span className="h-9 flex items-center justify-center bg-surface-container text-on-surface-variant font-normal rounded-lg">
              13
            </span>
            <span className="h-9 flex items-center justify-center bg-surface-container text-on-surface-variant font-normal rounded-lg">
              14
            </span>

            {/* Rest of calendar blank placeholder */}
            {Array.from({ length: 14 }).map((_, i) => (
              <span
                key={i}
                className="h-9 flex items-center justify-center border border-outline-variant/50 text-on-surface-variant/80 font-normal rounded-lg"
              >
                {i + 15}
              </span>
            ))}
          </div>
        </div>

        {/* Leave Requests Management */}
        <div className="lg:col-span-5 bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 flex flex-col justify-between">
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
            {leaveRequests.map((req) => (
              <div
                key={req.id}
                className="p-3 border border-outline-variant rounded-xl flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-bold text-on-surface">{req.type}</h4>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">{req.dates}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-on-surface block mb-1">
                    {req.duration}
                  </span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${req.statusColor}`}>
                    {req.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Leave Request Modal Form Drawer */}
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

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-on-surface-variant block uppercase">
                  Dates Range
                </label>
                <input
                  type="text"
                  placeholder="e.g. 15 Jun - 18 Jun 2026"
                  value={leaveDates}
                  onChange={(e) => setLeaveDates(e.target.value)}
                  required
                  className="w-full h-9 px-3 border border-outline-variant rounded-lg text-xs font-semibold bg-surface focus:ring-1 focus:ring-primary focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-on-surface-variant block uppercase">
                  Duration (Days / Hours)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 4 days"
                  value={leaveDuration}
                  onChange={(e) => setLeaveDuration(e.target.value)}
                  required
                  className="w-full h-9 px-3 border border-outline-variant rounded-lg text-xs font-semibold bg-surface focus:ring-1 focus:ring-primary focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                className="w-full h-10 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary/95 transition-colors flex items-center justify-center gap-1.5 mt-2"
              >
                <Send size={13} />
                Submit Request
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
