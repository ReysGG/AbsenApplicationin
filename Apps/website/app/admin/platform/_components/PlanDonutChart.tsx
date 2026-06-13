import React from "react";

export interface PlanSlice {
  plan: string;
  revenue: number;
  percentage: number;
}

interface PlanDonutChartProps {
  data: PlanSlice[];
  totalMrr: number;
}

const SLICE_COLORS: Record<string, string> = {
  Enterprise: "#022C22",
  Pro: "#047857",
  Basic: "#34D399",
};
const FALLBACK_COLORS = ["#022C22", "#047857", "#34D399", "#6366f1", "#f59e0b"];

function formatMrr(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${value}`;
}

/**
 * Revenue-by-plan donut, driven by real MRR breakdown from GET /platform/metrics.
 * Replaces the previous hardcoded SVG segments.
 */
export function PlanDonutChart({ data, totalMrr }: PlanDonutChartProps) {
  const slices = data.length > 0 ? data : [];
  // Precompute the cumulative dash offset for each slice (no mutation during render).
  const cumulativeOffsets: number[] = [];
  slices.reduce((acc, s) => {
    cumulativeOffsets.push(acc);
    return acc + s.percentage;
  }, 0);

  return (
    <div className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6 flex flex-col justify-between">
      <div>
        <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-500">
          Revenue by Plan
        </h3>
        <p className="font-label-md text-xs text-on-surface-variant mb-6">
          Current active subscriptions
        </p>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center relative min-h-[160px]">
        <svg className="transform -rotate-90" height="150" viewBox="0 0 36 36" width="150">
          <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#eceef0" strokeWidth="4" />
          {slices.map((s, i) => {
            const color = SLICE_COLORS[s.plan] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length];
            const dash = `${s.percentage} ${100 - s.percentage}`;
            return (
              <circle
                key={s.plan}
                cx="18"
                cy="18"
                fill="transparent"
                r="15.915"
                stroke={color}
                strokeDasharray={dash}
                strokeDashoffset={-cumulativeOffsets[i]}
                strokeWidth="4"
                strokeLinecap="butt"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-lg font-bold text-on-surface">
            {formatMrr(totalMrr)}
          </span>
          <span className="font-label-md text-[10px] text-on-surface-variant">Total MRR</span>
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-2">
        {slices.length === 0 ? (
          <p className="text-xs text-on-surface-variant text-center">Belum ada data langganan.</p>
        ) : (
          slices.map((s, i) => (
            <div key={s.plan} className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: SLICE_COLORS[s.plan] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length] }}
                />
                <span className="text-on-surface text-xs">{s.plan}</span>
              </div>
              <span className="font-semibold text-on-surface text-xs">{s.percentage}%</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
