"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ChevronDown,
  X,
  Building2,
  CreditCard,
  Ticket,
  Activity,
} from "lucide-react";
import { SignOutButton } from "@/components/sign-out-button";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  badge?: string;
  children?: { label: string; href: string }[];
}

// NOTE: The previous "Menu Utama" group linked to ~12 routes that do not exist
// under app/admin (employees, departments, attendance/*, reports/*, locations,
// settings, etc.) — every one was a 404, and they duplicated the real
// /workspace/* dashboard. Removed to eliminate dead links. Only the Platform
// Admin pages below actually exist.
const platformNavItems: NavItem[] = [
  {
    label: "Platform Dashboard",
    href: "/admin/platform",
    icon: <LayoutDashboard size={18} />,
  },
  {
    label: "Tenants",
    href: "/admin/tenants",
    icon: <Building2 size={18} />,
  },
  {
    label: "Billing",
    href: "/admin/billing",
    icon: <CreditCard size={18} />,
  },
  {
    label: "Support Tickets",
    href: "/admin/tickets",
    icon: <Ticket size={18} />,
    badge: "14",
  },
  {
    label: "Admin Users",
    href: "/admin/users",
    icon: <Users size={18} />,
  },
  {
    label: "System Health",
    href: "/admin/system-health",
    icon: <Activity size={18} />,
  },
];

function NavGroup({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(
    item.children?.some((c) => pathname.startsWith(c.href)) ?? false
  );
  const isActive = item.href ? pathname === item.href : false;

  if (item.children) {
    return (
      <li>
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "admin-nav-item w-full",
            open && "admin-nav-item--active"
          )}
        >
          <span className="admin-nav-icon">{item.icon}</span>
          <span className="admin-nav-label">{item.label}</span>
          {item.badge && (
            <span className="admin-nav-badge">{item.badge}</span>
          )}
          <ChevronDown
            size={14}
            className={cn(
              "ml-auto transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </button>
        <ul
          className={cn(
            "admin-nav-sub overflow-hidden transition-all duration-300",
            open ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          {item.children.map((child) => (
            <li key={child.href}>
              <Link
                href={child.href}
                className={cn(
                  "admin-nav-sub-item",
                  pathname === child.href && "admin-nav-sub-item--active"
                )}
              >
                <span className="admin-nav-sub-dot" />
                {child.label}
              </Link>
            </li>
          ))}
        </ul>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={item.href!}
        className={cn("admin-nav-item", isActive && "admin-nav-item--active")}
      >
        <span className="admin-nav-icon">{item.icon}</span>
        <span className="admin-nav-label">{item.label}</span>
        {item.badge && <span className="admin-nav-badge">{item.badge}</span>}
      </Link>
    </li>
  );
}

export default function AdminSidebar({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user: {
    name: string;
    email: string;
    initials: string;
  };
}) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="admin-overlay lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={cn("admin-sidebar", open && "admin-sidebar--open")}>
        {/* Logo */}
        <div className="admin-sidebar-brand">
          <div className="admin-brand-logo">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="url(#grad)" />
              <path
                d="M8 16L13 21L24 10"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="32" y2="32">
                  <stop offset="0%" stopColor="#022C22" />
                  <stop offset="100%" stopColor="#34D399" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="admin-brand-text">
            <span className="admin-brand-name">AbsenPro</span>
            <span className="admin-brand-sub">Admin Panel</span>
          </div>
          <button onClick={onClose} className="admin-sidebar-close lg:hidden">
            <X size={18} />
          </button>
        </div>

        {/* User card */}
        <div className="admin-user-card">
          <div className="admin-user-avatar">
            <span>{user.initials}</span>
            <span className="admin-user-status" />
          </div>
          <div className="admin-user-info">
            <p className="admin-user-name">{user.name}</p>
            <p className="admin-user-role">{user.email}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="admin-nav">
          <p className="admin-nav-section-label">Platform Admin</p>
          <ul className="admin-nav-list">
            {platformNavItems.map((item) => (
              <NavGroup key={item.label} item={item} />
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="admin-sidebar-footer">
          <SignOutButton />
          <p className="admin-sidebar-version">AbsenPro v2.1.0</p>
        </div>
      </aside>
    </>
  );
}
