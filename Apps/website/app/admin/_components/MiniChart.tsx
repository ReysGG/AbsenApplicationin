import React from "react";

export function MiniChart({
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
