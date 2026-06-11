import React from "react";
import { Search, Filter, Trash2, Link as LinkIcon, MoreVertical } from "lucide-react";
import { Tenant } from "./types";

interface TenantTableProps {
  tenants: Tenant[];
  filteredTenants: Tenant[];
  search: string;
  setSearch: (s: string) => void;
  planFilter: string;
  setPlanFilter: (s: string) => void;
  selectedIds: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectRow: (id: string) => void;
  onSuspendSelected: () => void;
  onDeleteSelected: () => void;
  onSelectTenant: (t: Tenant) => void;
}

export function TenantTable({
  tenants,
  filteredTenants,
  search,
  setSearch,
  planFilter,
  setPlanFilter,
  selectedIds,
  onSelectAll,
  onSelectRow,
  onSuspendSelected,
  onDeleteSelected,
  onSelectTenant,
}: TenantTableProps) {
  return (
    <div className="space-y-6">
      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-navy/10 border border-navy/20 rounded-xl p-4 flex justify-between items-center shadow-sm animate-in slide-in-from-top-4 duration-200">
          <span className="text-xs font-semibold text-navy">
            {selectedIds.length} tenants selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={onSuspendSelected}
              className="px-3.5 py-2 bg-surface-container-lowest border border-outline-variant hover:bg-surface-container-low text-[11px] font-semibold rounded-lg transition-colors flex items-center gap-1"
            >
              Suspend
            </button>
            <button
              onClick={onDeleteSelected}
              className="px-3.5 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-[11px] font-semibold rounded-lg transition-colors flex items-center gap-1"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/70" size={16} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tenants..."
            className="w-full pl-9 pr-4 py-2 bg-surface border border-outline-variant rounded-lg text-xs font-medium focus:ring-2 focus:ring-navy focus:outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Filter size={16} className="text-on-surface-variant/70" />
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="px-3 py-1.5 bg-surface border border-outline-variant rounded-lg text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-navy appearance-none pr-8 relative"
          >
            <option value="All">All Plans</option>
            <option value="Enterprise">Enterprise</option>
            <option value="Pro">Pro</option>
            <option value="Basic">Basic</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-6 w-12">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredTenants.length && filteredTenants.length > 0}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    className="rounded border-outline-variant text-navy focus:ring-navy cursor-pointer w-4 h-4"
                  />
                </th>
                <th className="py-3 px-6">Company</th>
                <th className="py-3 px-6">Plan</th>
                <th className="py-3 px-6">Users</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Last Active</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40 text-xs">
              {filteredTenants.length > 0 ? (
                filteredTenants.map((tenant) => (
                  <tr
                    key={tenant.id}
                    className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                      selectedIds.includes(tenant.id) ? "bg-emerald-50/10" : ""
                    }`}
                    onClick={() => onSelectTenant(tenant)}
                  >
                    <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(tenant.id)}
                        onChange={() => onSelectRow(tenant.id)}
                        className="rounded border-outline-variant text-navy focus:ring-navy cursor-pointer w-4 h-4"
                      />
                    </td>
                    <td className="py-4 px-6 flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-navy/10 text-navy flex items-center justify-center font-bold text-xs border border-navy/20">
                        {tenant.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-xs text-on-surface">{tenant.name}</p>
                        <p className="text-xs text-on-surface-variant/80 flex items-center gap-0.5">
                          <LinkIcon size={10} /> {tenant.domain}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          tenant.plan === "Enterprise"
                            ? "bg-emerald-50 text-emerald-700"
                            : tenant.plan === "Pro"
                            ? "bg-slate-100 text-slate-700"
                            : "bg-slate-50 text-slate-500"
                        }`}
                      >
                        {tenant.plan}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-medium text-xs">
                      {(tenant.users ?? 0).toLocaleString()}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                          tenant.status === "Active" ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            tenant.status === "Active" ? "bg-emerald-600" : "bg-rose-600"
                          }`}
                        />
                        {tenant.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-on-surface-variant/80">
                      {tenant.lastActive}
                    </td>
                    <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onSelectTenant(tenant)}
                        className="p-1.5 text-on-surface-variant hover:text-navy hover:bg-emerald-50 rounded-md transition-colors"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-on-surface-variant/70 text-xs">
                    No tenants found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
