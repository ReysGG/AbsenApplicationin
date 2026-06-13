"use client";

/**
 * components/dashboard/NotificationBell.tsx
 *
 * Komponen bell notifikasi di header dashboard.
 *
 * - Real-time via SSE (GET /notifications/stream); falls back to slow polling
 *   only while the stream is disconnected.
 * - Badge merah dengan unread count (R21.1, R21.2, R21.3)
 * - Dropdown list 10 notifikasi terbaru
 * - Klik notifikasi → mark as read + navigasi ke refId jika ada
 * - Tombol "Tandai semua dibaca"
 *
 * Requirements: 21.1, 21.2, 21.3
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Bell, CheckCheck, Loader2, FileArchive, FileText } from "lucide-react";
import { createClientApiClient } from "@/lib/apiClient";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Notification {
  id: string;
  type: "leave_request_new" | "export_completed";
  refId: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function notifLabel(type: Notification["type"]): string {
  if (type === "leave_request_new") return "Permintaan izin/cuti baru";
  if (type === "export_completed") return "Ekspor laporan selesai";
  return "Notifikasi baru";
}

function notifHref(notif: Notification): string | null {
  if (notif.type === "leave_request_new") return "/workspace/leave";
  if (notif.type === "export_completed") return "/workspace/exports";
  return null;
}

function formatRelative(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Baru saja";
    if (mins < 60) return `${mins} menit lalu`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    return `${days} hari lalu`;
  } catch {
    return "";
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const api = createClientApiClient();
      const res = await api.get<NotificationsResponse>("v1/notifications");
      if (res.success) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      }
    } catch {
      // Silently fail — notification is non-critical
    }
  }, []);

  // Initial load + real-time stream (SSE). The slow fallback poll runs ONLY
  // while the stream is disconnected, so a healthy connection makes no
  // periodic requests.
  useEffect(() => {
    fetchNotifications();

    let es: EventSource | null = null;
    let connected = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const fallback = setInterval(() => {
      if (!connected) fetchNotifications();
    }, 45000);

    const connect = () => {
      try {
        es = new EventSource("/api/v1/notifications/stream", {
          withCredentials: true,
        });
      } catch {
        return; // EventSource unsupported — the fallback poll keeps it fresh.
      }

      es.onopen = () => {
        connected = true;
      };

      es.addEventListener("ready", (e: Event) => {
        connected = true;
        try {
          const data = JSON.parse((e as MessageEvent).data) as {
            unreadCount?: number;
          };
          if (typeof data.unreadCount === "number") {
            setUnreadCount(data.unreadCount);
          }
        } catch {
          /* ignore malformed payload */
        }
      });

      es.addEventListener("notification", () => {
        // A new notification arrived — pull the fresh list (correct ordering +
        // unread count). The badge updates effectively instantly.
        fetchNotifications();
      });

      es.onerror = () => {
        connected = false;
        // EventSource auto-reconnects on transient errors. If it hard-closed,
        // reopen after a short delay; the fallback poll covers the gap.
        if (es && es.readyState === EventSource.CLOSED) {
          es.close();
          es = null;
          if (!reconnectTimer) {
            reconnectTimer = setTimeout(() => {
              reconnectTimer = null;
              connect();
            }, 5000);
          }
        }
      };
    };

    connect();

    return () => {
      clearInterval(fallback);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (es) es.close();
    };
  }, [fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function handleNotifClick(notif: Notification) {
    // Mark as read
    if (!notif.isRead) {
      try {
        const api = createClientApiClient();
        await api.post(`v1/notifications/${notif.id}/read`, {});
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // Silently fail
      }
    }

    // Navigate
    const href = notifHref(notif);
    if (href) {
      setOpen(false);
      window.location.href = href;
    }
  }

  async function handleMarkAll() {
    setMarkingAll(true);
    try {
      const api = createClientApiClient();
      await api.post("v1/notifications/read-all", {});
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Silently fail
    } finally {
      setMarkingAll(false);
    }
  }

  const visibleNotifs = notifications.slice(0, 10);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        aria-label={`Notifikasi${unreadCount > 0 ? ` (${unreadCount} belum dibaca)` : ""}`}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1"
            aria-hidden="true"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden"
          role="menu"
          aria-label="Daftar notifikasi"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Notifikasi</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                disabled={markingAll}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium focus:outline-none focus:underline disabled:opacity-50"
                aria-label="Tandai semua notifikasi sebagai dibaca"
              >
                {markingAll ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <CheckCheck className="w-3 h-3" />
                )}
                Tandai semua dibaca
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {visibleNotifs.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Tidak ada notifikasi</p>
              </div>
            ) : (
              visibleNotifs.map((notif) => (
                <button
                  key={notif.id}
                  type="button"
                  onClick={() => handleNotifClick(notif)}
                  className={[
                    "w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 focus:outline-none focus:bg-gray-50",
                    !notif.isRead ? "bg-blue-50/50" : "",
                  ].join(" ")}
                  role="menuitem"
                >
                  {/* Icon */}
                  <div
                    className={[
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                      notif.type === "leave_request_new"
                        ? "bg-purple-100 text-purple-600"
                        : "bg-green-100 text-green-600",
                    ].join(" ")}
                  >
                    {notif.type === "leave_request_new" ? (
                      <FileText className="w-4 h-4" />
                    ) : (
                      <FileArchive className="w-4 h-4" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={[
                        "text-sm leading-tight",
                        !notif.isRead
                          ? "font-semibold text-gray-900"
                          : "font-medium text-gray-700",
                      ].join(" ")}
                    >
                      {notifLabel(notif.type)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatRelative(notif.createdAt)}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!notif.isRead && (
                    <span
                      className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5"
                      aria-hidden="true"
                    />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 10 && (
            <div className="px-4 py-2.5 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">
                Menampilkan 10 notifikasi terbaru
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
