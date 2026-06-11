import React from "react";
import { Tenant } from "./types";

interface TopTenantsListProps {
  tenants: Tenant[];
}

export function TopTenantsList({ tenants }: TopTenantsListProps) {
  return (
    <div className="lg:col-span-5 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6">
      <h3 className="font-semibold mb-6 text-xs uppercase tracking-wider text-slate-500">
        Top 5 Tenants
      </h3>
      <div className="space-y-4">
        {tenants.map((t) => (
          <div key={t.name}>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-medium text-on-surface text-xs">{t.name}</span>
              <span className="text-on-surface-variant text-xs">{(t.users ?? 0).toLocaleString()} users</span>
            </div>
            <div className="w-full bg-surface-container rounded-full h-2">
              <div
                className="bg-navy h-2 rounded-full transition-all duration-500"
                style={{ width: `${t.percentage}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
