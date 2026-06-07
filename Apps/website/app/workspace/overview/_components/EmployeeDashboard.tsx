"use client";

import React, { useState } from "react";
import {
  Clock,
  MapPin,
  Camera,
  CheckCircle,
  FileText,
  Calendar,
  AlertCircle,
  LogOut,
  MapPinOff,
  UserCheck
} from "lucide-react";

export default function EmployeeDashboard() {
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState("");
  const [gpsVerified, setGpsVerified] = useState(true);
  const [faceVerified, setFaceVerified] = useState(true);

  // Submit Leave states
  const [leaveSubmitted, setLeaveSubmitted] = useState(false);
  const [leaveType, setLeaveType] = useState("Sick Leave");
  const [leaveDays, setLeaveDays] = useState("1");
  const [leaveReason, setLeaveReason] = useState("");

  const handleCheckIn = () => {
    if (checkedIn) {
      setCheckedIn(false);
      setCheckInTime("");
    } else {
      setCheckedIn(true);
      const now = new Date();
      setCheckInTime(now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
    }
  };

  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReason) return;
    setLeaveSubmitted(true);
    setLeaveReason("");
    setTimeout(() => setLeaveSubmitted(false), 3000);
  };

  const shiftInfo = {
    name: "Morning Shift",
    schedule: "07:00 AM - 03:00 PM",
    gracePeriod: "07:15 AM"
  };

  const attendanceLogs = [
    { date: "Yesterday", status: "On Time", checkIn: "06:54 AM", checkOut: "03:02 PM", type: "WFO" },
    { date: "Thursday", status: "Late", checkIn: "07:22 AM", checkOut: "03:00 PM", type: "WFO" },
    { date: "Wednesday", status: "WFH", checkIn: "07:44 AM", checkOut: "03:45 PM", type: "Remote" },
    { date: "Tuesday", status: "On Time", checkIn: "06:58 AM", checkOut: "03:00 PM", type: "WFO" }
  ];

  return (
    <div className="space-y-6">
      {/* Employee Level Header */}
      <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
        <div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wide">
            Level Workspace (End User / Employee)
          </span>
          <h2 className="font-title-xl font-bold text-on-surface mt-1">
            Personal Attendance Desk
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clock In / Out desk */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 flex flex-col justify-between min-h-[300px]">
          <div>
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider pb-3 border-b border-outline-variant/60">
              Clocking Portal
            </h3>
            <div className="mt-4 p-3 bg-surface border border-outline-variant/60 rounded-xl space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-on-surface-variant flex items-center gap-1.5">
                  <Clock size={14} className="text-emerald-600" />
                  Current Shift
                </span>
                <span className="font-bold text-on-surface">{shiftInfo.name}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant">Hours</span>
                <span className="font-semibold text-on-surface-variant">{shiftInfo.schedule}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant">Grace Limit</span>
                <span className="font-semibold text-on-surface-variant text-amber-600">{shiftInfo.gracePeriod}</span>
              </div>
            </div>

            {/* Validation indicators */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] font-bold">
              <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${
                gpsVerified ? "bg-emerald-500/5 text-emerald-700 border-emerald-200" : "bg-red-500/5 text-red-700 border-red-200"
              }`}>
                {gpsVerified ? <MapPin size={12} /> : <MapPinOff size={12} />}
                GPS Verified
              </div>
              <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${
                faceVerified ? "bg-emerald-500/5 text-emerald-700 border-emerald-200" : "bg-red-500/5 text-red-700 border-red-200"
              }`}>
                <Camera size={12} />
                Face Authenticated
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleCheckIn}
              className={`w-full h-12 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer ${
                checkedIn 
                  ? "bg-red-600 hover:bg-red-700" 
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {checkedIn ? <LogOut size={16} /> : <UserCheck size={16} />}
              {checkedIn ? `Clock Out (Checked in at ${checkInTime})` : "Perform Check-In"}
            </button>
          </div>
        </div>

        {/* Submit leave request */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider pb-3 border-b border-outline-variant/60 flex items-center justify-between">
              Submit Permit / Leave
              <FileText size={15} className="text-emerald-600" />
            </h3>

            {leaveSubmitted && (
              <div className="mt-3 p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-[10px] font-bold rounded-lg flex items-center gap-1.5">
                <CheckCircle size={12} />
                Leave application filed successfully!
              </div>
            )}

            <form onSubmit={handleLeaveSubmit} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-on-surface-variant block uppercase">Type</label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="w-full h-8 px-2 border border-outline-variant rounded-lg text-xs font-semibold bg-surface focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Annual Permit">Annual Permit</option>
                    <option value="Maternity Leave">Maternity Leave</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-on-surface-variant block uppercase">Duration (days)</label>
                  <input
                    type="number"
                    min="1"
                    value={leaveDays}
                    onChange={(e) => setLeaveDays(e.target.value)}
                    className="w-full h-8 px-2 border border-outline-variant rounded-lg text-xs font-semibold bg-surface focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-on-surface-variant block uppercase">Reason</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Elaborate details..."
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  className="w-full p-2 border border-outline-variant rounded-lg text-xs font-semibold bg-surface focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
              <button type="submit" className="w-full h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer">
                Submit Request Form
              </button>
            </form>
          </div>
        </div>

        {/* Personal Log Calendar Activity */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider pb-3 border-b border-outline-variant/60 flex items-center justify-between">
              My Logs
              <Calendar size={15} className="text-emerald-600" />
            </h3>
            <div className="mt-4 space-y-2.5">
              {attendanceLogs.map((log, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs p-1.5 border border-outline-variant/40 rounded-lg">
                  <div>
                    <span className="font-bold text-on-surface">{log.date}</span>
                    <span className="text-[10px] text-on-surface-variant font-medium ml-2">({log.type})</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="font-mono text-on-surface-variant">{log.checkIn} - {log.checkOut}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                      log.status === "On Time" ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-amber-100 text-amber-800 border-amber-200"
                    }`}>{log.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-outline-variant/60 flex justify-between items-center text-[10px] text-on-surface-variant font-semibold">
            <span>Month Present Count: 18 Days</span>
            <span className="text-emerald-600 font-bold">Compliance: 94.4%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
