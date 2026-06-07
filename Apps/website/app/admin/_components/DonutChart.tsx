import React from "react";

export function DonutChart() {
  const hadir = 89;
  const terlambat = 6;
  const absen = 5;

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
          <span className="admin-donut-pct">89%</span>
          <span className="admin-donut-sub">Hadir</span>
        </div>
      </div>
      <div className="admin-donut-legend">
        {[
          { color: "#022C22", label: "Hadir", val: "221" },
          { color: "#34D399", label: "Terlambat", val: "14" },
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
