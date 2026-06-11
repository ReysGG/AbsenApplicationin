import React from "react";
import { Search, Mail, Edit2, Ban, CheckCircle, Key } from "lucide-react";
import { AdminUser } from "./types";

interface UserTableProps {
  filteredUsers: AdminUser[];
  search: string;
  setSearch: (s: string) => void;
  roleFilter: string;
  setRoleFilter: (s: string) => void;
  onDeactivate: (id: string) => void;
}

export function UserTable({
  filteredUsers,
  search,
  setSearch,
  roleFilter,
  setRoleFilter,
  onDeactivate,
}: UserTableProps) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col justify-between">
      <div className="p-6 border-b border-outline-variant/60 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-500">
          Team Directory
        </h3>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-center">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/70" size={16} />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search staff..."
              className="w-full pl-9 pr-4 py-2 bg-surface border border-outline-variant rounded-lg text-xs font-medium focus:ring-2 focus:ring-navy focus:outline-none transition-all"
            />
          </div>
          {/* Role Filter */}
          <div className="relative w-full sm:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-surface border border-outline-variant rounded-lg text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-navy appearance-none"
            >
              <option value="All">All Roles</option>
              <option value="Super Admin">Super Admin</option>
              <option value="Platform Admin">Platform Admin</option>
            </select>
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-6">User</th>
              <th className="py-3 px-6">Role</th>
              <th className="py-3 px-6">Status</th>
              <th className="py-3 px-6">Last Active</th>
              <th className="py-3 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30 text-xs">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-navy/10 text-navy flex items-center justify-center font-bold text-xs border border-navy/20">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-xs text-on-surface">{user.name}</p>
                      <p className="text-xs text-on-surface-variant/80 flex items-center gap-0.5">
                        <Mail size={10} /> {user.email}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        user.role === "Super Admin"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                        user.status === "Active" ? "text-emerald-600" : "text-slate-400"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          user.status === "Active" ? "bg-emerald-600" : "bg-slate-400"
                        }`}
                      />
                      {user.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-xs text-on-surface-variant/80">
                    {user.lastActive}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => alert(`Edit role for ${user.name}`)}
                        className="p-1.5 text-on-surface-variant hover:text-navy hover:bg-emerald-50 rounded-md transition-colors"
                        title="Edit Role"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => onDeactivate(user.id)}
                        className={`p-1.5 rounded-md transition-colors ${
                          user.status === "Active"
                            ? "text-on-surface-variant hover:text-rose-600 hover:bg-rose-50"
                            : "text-emerald-600 hover:bg-emerald-50"
                        }`}
                        title={user.status === "Active" ? "Deactivate" : "Activate"}
                      >
                        {user.status === "Active" ? <Ban size={14} /> : <CheckCircle size={14} />}
                      </button>
                      <button
                        onClick={() => alert(`Reset password link sent to ${user.email}`)}
                        className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant rounded-md transition-colors"
                        title="Reset Password"
                      >
                        <Key size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-8 text-center text-on-surface-variant/70 text-xs">
                  No admins found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
