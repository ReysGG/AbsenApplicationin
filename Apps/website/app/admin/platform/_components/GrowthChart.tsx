import React from "react";

export interface GrowthPoint {
  label: string;
  newTenants: number;
}

interface GrowthChartProps {
  data: GrowthPoint[];
}

/**
 * Tenant-growth line chart driven by real data (new tenants per month for the
 * last 6 months, from GET /platform/metrics). Replaces the previous hardcoded
 * SVG polyline.
 */
export function GrowthChart({ data }: GrowthChartProps) {
  const points = data.length > 0 ? data : [{ label: "—", newTenants: 0 }];
  const max = Math.max(1, ...points.map((p) => p.newTenants));

  // Build the polyline points across a 0..100 viewBox.
  const coords = points.map((p, i) => {
    const x = points.length === 1 ? 0 : (i / (points.length - 1)) * 100;
    const y = 100 - (p.newTenants / max) * 90 - 5; // pad 5% top/bottom
    return { x, y, value: p.newTenants, label: p.label };
  });
  const polyline = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const polygon = `0,100 ${polyline} 100,100`;

  return (
    <div className="lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-500">
            Tenant Growth
          </h3>
          <p className="font-label-md text-xs text-on-surface-variant">
            New tenants per month (last 6 months)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-navy" />
          <span className="font-label-md text-xs text-on-surface-variant">New Tenants</span>
        </div>
      </div>

      <div className="h-64 w-full relative border-l border-b border-outline-variant">
        <div className="absolute left-0 top-0 w-full border-t border-outline-variant/20 h-0" />
        <div className="absolute left-0 top-1/2 w-full border-t border-outline-variant/20 h-0" />

        <svg className="w-full h-full absolute inset-0" preserveAspectRatio="none" viewBox="0 0 100 100">
          <polygon fill="#022C22" fillOpacity="0.05" points={polygon} />
          <polyline
            fill="none"
            points={polyline}
            stroke="#022C22"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      {/* X axis labels from real month buckets */}
      <div className="flex justify-between mt-2 px-1">
        {coords.map((c, i) => (
          <span
            key={i}
            className="font-label-md text-[10px] text-on-surface-variant"
            title={`${c.label}: ${c.value} tenant baru`}
          >
            {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}
