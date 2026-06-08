import React from "react";

export interface DonutChartProps {
  presentCount?: number;
  lateCount?: number;
  absentCount?: number;
  totalEmployees?: number;
}

export function DonutChart({
  presentCount,
  lateCount,
  absentCount,
  totalEmployees,
}: DonutChartProps) {
  const total = totalEmployees ?? 1;
  const hadir = total > 0 ? Math.round(((presentCount ?? 0) / total) * 100) : 0;
  const terlambat = total > 0 ? Math.round(((lateCount ?? 0) / total) * 100) : 0;
  const absen = total > 0 ? Math.round(((absentCount ?? 0) / total) * 100) : 0;

  return (
    <div className="admin-donut-wrap">
      <div className="admin-donut">
        <svg viewBox="0 0 36 36" className="admin-donut-svg">
          <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#eceef0" strokeWidth="3" />
          <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#022C22" strokeWidth="3"
            strokeDasharray={`${hadir} ${100 - hadir}`} strokeDashoffset="25" strokeLinecap="round" />
          <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#34D399" strokeWidth="3"
            strokeDasharray={`${terlambat} ${100 - terlambat}`} strokeDashoffset={`${25 - hadir}`} strokeLinecap="round" />
          <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#ba1a1a" strokeWidth="3"
            strokeDasharray={`${absen} ${100 - absen}`} strokeDashoffset={`${25 - hadir - terlambat}`} strokeLinecap="round" />
        </svg>
        <div className="admin-donut-center">
          <span className="admin-donut-pct">{hadir}%</span>
          <span className="admin-donut-sub">Hadir</span>
        </div>
      </div>
      <div className="admin-donut-legend">
        {[
          { color: "#022C22", label: "Hadir", val: String(presentCount ?? 0) },
          { color: "#34D399", label: "Terlambat", val: String(lateCount ?? 0) },
          { color: "#ba1a1a", label: "Absen", val: String(absentCount ?? 0) },
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
