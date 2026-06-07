import React from "react";
import { Registration } from "./types";

interface RegistrationsTableProps {
  registrations: Registration[];
}

export function RegistrationsTable({ registrations }: RegistrationsTableProps) {
  return (
    <div className="lg:col-span-7 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm flex flex-col justify-between overflow-hidden">
      <div className="p-6 border-b border-outline-variant/60 flex justify-between items-center">
        <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-500">
          Recent Registrations
        </h3>
        <button className="text-navy text-xs font-semibold hover:underline">
          View All
        </button>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low font-label-md text-xs uppercase tracking-wider text-slate-500">
              <th className="py-3 px-6 font-semibold">Tenant</th>
              <th className="py-3 px-6 font-semibold">Plan</th>
              <th className="py-3 px-6 font-semibold">Status</th>
              <th className="py-3 px-6 font-semibold text-right">Date</th>
            </tr>
          </thead>
          <tbody className="font-body-md text-on-surface divide-y divide-outline-variant/30 text-xs">
            {registrations.map((reg) => (
              <tr key={reg.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-6 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-navy/10 text-navy flex items-center justify-center font-bold text-xs border border-navy/20">
                    {reg.initials}
                  </div>
                  <span className="font-semibold text-xs">{reg.tenant}</span>
                </td>
                <td className="py-4 px-6">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      reg.plan === "Enterprise"
                        ? "bg-emerald-50 text-emerald-700"
                        : reg.plan === "Pro"
                        ? "bg-slate-100 text-slate-700"
                        : "bg-slate-50 text-slate-500"
                    }`}
                  >
                    {reg.plan}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                      reg.status === "Active"
                        ? "text-emerald-600"
                        : reg.status === "Trial"
                        ? "text-amber-600"
                        : "text-slate-400"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        reg.status === "Active"
                          ? "bg-emerald-600"
                          : reg.status === "Trial"
                          ? "bg-amber-600"
                          : "bg-slate-400"
                      }`}
                    />
                    {reg.status}
                  </span>
                </td>
                <td className="py-4 px-6 text-right text-xs text-on-surface-variant/80">
                  {reg.date}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
