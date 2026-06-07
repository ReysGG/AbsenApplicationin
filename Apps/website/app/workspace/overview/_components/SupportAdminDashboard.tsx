"use client";

import React, { useState } from "react";
import {
  UserCheck,
  Clock,
  LogOut,
  Users,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  FileText
} from "lucide-react";

export default function SupportAdminDashboard() {
  const [leaveRequests, setLeaveRequests] = useState([
    { id: "LV-409", name: "Sarah Jenkins", type: "Sick Leave", duration: "2 days", reason: "Medical Appointment", date: "Today" },
    { id: "LV-410", name: "Thomas Kaelen", type: "Annual Permit", duration: "1 day", reason: "Family event", date: "Tomorrow" }
  ]);

  const stats = [
    { title: "Staff Present", value: "412 / 450", ratio: "91.5%", colorClass: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: UserCheck },
    { title: "Late Check-in", value: "18 Staff", ratio: "4.0%", colorClass: "text-amber-700 bg-amber-50 border-amber-200", icon: Clock },
    { title: "Remote WFH", value: "12 Staff", ratio: "2.7%", colorClass: "text-blue-700 bg-blue-50 border-blue-200", icon: LogOut },
    { title: "Absent Headcount", value: "8 Staff", ratio: "1.8%", colorClass: "text-red-700 bg-red-50 border-red-200", icon: Users }
  ];

  const liveLog = [
    { name: "Michael Chen", division: "Engineering", time: "08:02 AM", status: "On Time", gps: "verified", face: "verified" },
    { name: "Thomas Kaelen", division: "Sales & Marketing", time: "08:35 AM", status: "Late", gps: "verified", face: "manual_bypass" },
    { name: "John Doe", division: "Engineering", time: "08:52 AM", status: "Late", gps: "spoof_detected", face: "failed" }
  ];

  const handleApprove = (id: string) => {
    setLeaveRequests(leaveRequests.filter(r => r.id !== id));
  };

  const handleReject = (id: string) => {
    setLeaveRequests(leaveRequests.filter(r => r.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Support Admin Level Header */}
      <div className="flex items-center justify-between border-b border-primary/20 pb-3">
        <div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wide">
            Level Workspace (Support Admin / HR)
          </span>
          <h2 className="font-title-xl font-bold text-on-surface mt-1">
            HR Attendance Control Center
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
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${s.colorClass}`}>
                  <Icon size={16} />
                </div>
              </div>
              <p className="text-[10px] text-on-surface-variant font-semibold mt-3 pt-2 border-t border-outline-variant/40">
                Rate: {s.ratio} of total workforce today
              </p>
            </div>
          );
        })}
      </div>

      {/* Split dashboard actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time check-ins list */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5">
          <div className="pb-3 border-b border-outline-variant/60 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">Live Check-in Activity</h3>
              <p className="text-[10px] text-on-surface-variant font-medium">Monitor active locations and facial validation checks</p>
            </div>
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {liveLog.map((log, idx) => {
              const isSpoof = log.gps === "spoof_detected";
              return (
                <div key={idx} className={`p-3 border rounded-xl flex items-center justify-between transition-colors ${
                  isSpoof ? "bg-red-500/5 border-red-200" : "border-outline-variant/60 bg-surface/20 hover:bg-surface/40"
                }`}>
                  <div>
                    <h4 className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                      {log.name}
                      {isSpoof && (
                        <span className="inline-flex items-center gap-0.5 text-[8px] font-bold text-error px-1 bg-red-100 rounded uppercase">
                          <AlertTriangle size={8} />
                          Spoofing Detected
                        </span>
                      )}
                    </h4>
                    <p className="text-[9px] text-on-surface-variant font-semibold mt-0.5">{log.division} • {log.time}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                      log.status === "On Time" ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-amber-100 text-amber-800 border-amber-200"
                    }`}>
                      {log.status}
                    </span>
                    <p className="text-[9px] text-on-surface-variant font-medium mt-1">
                      Face: {log.face === "verified" ? "Verified" : log.face === "failed" ? "Failed" : "Bypass"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Leave Requests Approvals */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-outline-variant/60 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">Leave Applications</h3>
                <p className="text-[10px] text-on-surface-variant font-medium">Action pending permission request forms</p>
              </div>
              <FileText size={16} className="text-primary" />
            </div>

            <div className="mt-4 space-y-3">
              {leaveRequests.length > 0 ? (
                leaveRequests.map((r) => (
                  <div key={r.id} className="p-3 border border-outline-variant/60 rounded-xl bg-surface/20">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-on-surface">{r.name}</h4>
                        <p className="text-[9px] text-on-surface-variant font-semibold mt-0.5">{r.type} ({r.duration})</p>
                      </div>
                      <span className="text-[9px] text-on-surface-variant font-bold">{r.date}</span>
                    </div>
                    <p className="text-[10px] text-on-surface-variant leading-relaxed mt-2 bg-surface p-2 rounded-lg border border-outline-variant/40">
                      Reason: &quot;{r.reason}&quot;
                    </p>
                    <div className="flex gap-2 justify-end mt-3">
                      <button
                        onClick={() => handleReject(r.id)}
                        className="h-6 px-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold text-[9px] rounded-lg transition-colors flex items-center gap-1"
                      >
                        <XCircle size={10} />
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(r.id)}
                        className="h-6 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-[9px] rounded-lg transition-colors flex items-center gap-1"
                      >
                        <CheckCircle size={10} />
                        Approve
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs font-semibold text-on-surface-variant/80 text-center py-8">
                  No pending leave applications.
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-outline-variant/60 flex items-center justify-between">
            <span className="text-[9px] font-bold text-on-surface-variant">Quick Actions</span>
            <button className="h-7 px-3 bg-primary text-white font-bold text-[10px] rounded-lg hover:bg-primary/95 transition-colors flex items-center gap-1">
              <Download size={10} />
              Export Excel Log
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
