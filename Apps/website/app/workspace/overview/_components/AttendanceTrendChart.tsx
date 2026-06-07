"use client";

/**
 * AttendanceTrendChart.tsx
 *
 * Grafik tren kehadiran 30 hari menggunakan Recharts AreaChart.
 * Lines: Hadir (hijau), Terlambat (oranye), Tidak Hadir (merah).
 * Empty state: tampilkan pesan teks — tidak crash (R5.9).
 *
 * Requirements: 5.2, 5.9, 19.9
 */

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { AttendanceTrendPoint } from "@/types/overview";

interface AttendanceTrendChartProps {
  data: AttendanceTrendPoint[] | null;
  loading?: boolean;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  } catch {
    return dateStr;
  }
}

const LEGEND_LABELS: Record<string, string> = {
  present: "Hadir",
  late: "Terlambat",
  absent: "Tidak Hadir",
};

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-3 shadow-md text-sm"
      role="tooltip"
    >
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="flex items-center gap-2">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
            aria-hidden="true"
          />
          <span className="text-gray-600">
            {LEGEND_LABELS[entry.name] ?? entry.name}:
          </span>
          <span className="font-semibold text-gray-800">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

function CustomLegend({
  payload,
}: {
  payload?: Array<{ value: string; color: string }>;
}) {
  return (
    <div
      className="flex gap-4 justify-center mt-2"
      role="list"
      aria-label="Keterangan grafik"
    >
      {(payload ?? []).map((entry) => (
        <div key={entry.value} className="flex items-center gap-1.5" role="listitem">
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
            aria-hidden="true"
          />
          <span className="text-sm text-gray-600">
            {LEGEND_LABELS[entry.value] ?? entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AttendanceTrendChart({
  data,
  loading,
}: AttendanceTrendChartProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h2 className="text-base font-semibold text-gray-700 mb-4">
        Tren Kehadiran (30 Hari)
      </h2>

      {loading ? (
        <div
          className="h-64 flex items-center justify-center"
          aria-busy="true"
          aria-label="Memuat grafik tren"
        >
          <div className="animate-pulse text-gray-400 text-sm">
            Memuat data grafik…
          </div>
        </div>
      ) : !data || data.length === 0 ? (
        /* Empty state — R5.9, R19.9 */
        <div
          className="h-64 flex flex-col items-center justify-center gap-2"
          role="status"
          aria-label="Tidak ada data tren"
        >
          <svg
            className="w-10 h-10 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
            />
          </svg>
          <p className="text-sm text-gray-500">Tidak ada data tersedia</p>
        </div>
      ) : (
        <div className="h-64" aria-label="Grafik tren kehadiran 30 hari">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data.map((d) => ({ ...d, dateLabel: formatDate(d.date) }))}
              margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ea580c" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="dateLabel"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
              <Area
                type="monotone"
                dataKey="present"
                stroke="#16a34a"
                strokeWidth={2}
                fill="url(#colorPresent)"
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Area
                type="monotone"
                dataKey="late"
                stroke="#ea580c"
                strokeWidth={2}
                fill="url(#colorLate)"
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Area
                type="monotone"
                dataKey="absent"
                stroke="#dc2626"
                strokeWidth={2}
                fill="url(#colorAbsent)"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
