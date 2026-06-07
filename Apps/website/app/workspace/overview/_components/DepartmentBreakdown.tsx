"use client";

/**
 * DepartmentBreakdown.tsx
 *
 * Tabel ringkasan kehadiran per divisi.
 * Kolom: Divisi, Total, Hadir, Terlambat, Tidak Hadir
 * Empty state: "Belum ada divisi" (R5.9, R19.9)
 *
 * Requirements: 5.3, 5.9
 */

import type { DepartmentBreakdownRow } from "@/types/overview";

interface DepartmentBreakdownProps {
  data: DepartmentBreakdownRow[] | null;
  loading?: boolean;
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded w-full" />
        </td>
      ))}
    </tr>
  );
}

export default function DepartmentBreakdown({
  data,
  loading,
}: DepartmentBreakdownProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h2 className="text-base font-semibold text-gray-700 mb-4">
        Kehadiran per Divisi
      </h2>

      <div className="overflow-x-auto">
        <table
          className="w-full text-sm"
          aria-label="Tabel kehadiran per divisi"
        >
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-4 py-2.5 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide">
                Divisi
              </th>
              <th className="px-4 py-2.5 text-right font-semibold text-gray-500 text-xs uppercase tracking-wide">
                Total
              </th>
              <th className="px-4 py-2.5 text-right font-semibold text-green-600 text-xs uppercase tracking-wide">
                Hadir
              </th>
              <th className="px-4 py-2.5 text-right font-semibold text-orange-500 text-xs uppercase tracking-wide">
                Terlambat
              </th>
              <th className="px-4 py-2.5 text-right font-semibold text-red-500 text-xs uppercase tracking-wide">
                Tidak Hadir
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : !data || data.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-gray-400 text-sm"
                  role="cell"
                >
                  <div className="flex flex-col items-center gap-2">
                    <svg
                      className="w-8 h-8 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    <span>Belum ada divisi</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={row.department_id}
                  className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-gray-700">
                    {row.department_name}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {row.total}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-green-600">
                    {row.present}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-orange-500">
                    {row.late}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-red-500">
                    {row.absent}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
