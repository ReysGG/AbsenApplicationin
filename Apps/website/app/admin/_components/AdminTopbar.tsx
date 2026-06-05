"use client";

import { Bell, Search, Menu, ChevronDown, Sun, Moon } from "lucide-react";
import { useState } from "react";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";

export default function AdminTopbar({
  onMenuClick,
  user,
}: {
  onMenuClick: () => void;
  user: {
    name: string;
    email: string;
    initials: string;
  };
}) {
  const [dark, setDark] = useState(false);

  return (
    <header className="admin-topbar">
      {/* Left */}
      <div className="admin-topbar-left">
        <button
          onClick={onMenuClick}
          className="admin-topbar-btn"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        <div className="admin-search">
          <Search size={16} className="admin-search-icon" />
          <input
            type="search"
            placeholder="Cari karyawan, laporan..."
            className="admin-search-input"
          />
          <kbd className="admin-search-kbd">⌘K</kbd>
        </div>
      </div>

      {/* Right */}
      <div className="admin-topbar-right">
        {/* Status badge */}
        <AnimatedShinyText className="admin-topbar-status">
          ● Sistem Aktif
        </AnimatedShinyText>

        {/* Theme toggle */}
        <button
          onClick={() => setDark(!dark)}
          className="admin-topbar-btn"
          aria-label="Toggle theme"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <button className="admin-topbar-btn admin-notif-btn" aria-label="Notifications">
          <Bell size={18} />
          <span className="admin-notif-badge">5</span>
        </button>

        {/* Divider */}
        <div className="admin-topbar-divider" />

        {/* User */}
        <button className="admin-topbar-user">
          <div className="admin-topbar-avatar">
            <span>{user.initials}</span>
          </div>
          <div className="admin-topbar-user-info hidden sm:block">
            <p className="admin-topbar-user-name">{user.name}</p>
            <p className="admin-topbar-user-role">{user.email}</p>
          </div>
          <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
        </button>
      </div>
    </header>
  );
}
