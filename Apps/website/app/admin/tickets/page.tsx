"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Ticket, Search, CheckCircle2, ChevronRight, Send, Building } from "lucide-react";
import { PageHeader } from "../_components/PageHeader";
import { createClientApiClient } from "@/lib/apiClient";

interface Message {
  id: string;
  sender: "Client" | "Agent";
  senderName: string;
  message: string;
  time: string;
}

interface SupportTicket {
  id: string;
  tenant: string;
  title: string;
  description: string;
  priority: "High" | "Medium" | "Low";
  status: "Open" | "In Progress" | "Closed";
  category: "Billing" | "Technical" | "Feature Request";
  updatedAt: string;
  messages: Message[];
}

/** Derive avatar initials from a sender name (DTO has no avatarInitials). */
function initialsOf(name: string): string {
  const parts = name.replace(/\(.*\)/, "").trim().split(/\s+/).filter(Boolean);
  return (
    parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?"
  );
}

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<"All" | "Open" | "In Progress" | "Closed">("All");
  const [replyText, setReplyText] = useState("");

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const api = createClientApiClient();
      const res = await api.get<SupportTicket[]>("v1/platform/tickets");
      if (res.success) {
        setTickets(res.data);
        setSelectedTicketId((prev) => prev ?? res.data[0]?.id ?? null);
      } else {
        setError(res.error.message ?? "Gagal memuat tiket.");
      }
    } catch {
      setError("Terjadi kesalahan jaringan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const activeTicket =
    tickets.find((t) => t.id === selectedTicketId) || tickets[0] || null;

  /** Replace one ticket in state with the server's updated copy. */
  function applyUpdated(updated: SupportTicket) {
    setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText || !activeTicket) return;
    try {
      const api = createClientApiClient();
      const res = await api.post<SupportTicket>(
        `v1/platform/tickets/${activeTicket.id}/reply`,
        { message: replyText }
      );
      if (res.success) {
        applyUpdated(res.data);
        setReplyText("");
      } else {
        setError(res.error.message ?? "Gagal mengirim balasan.");
      }
    } catch {
      setError("Gagal mengirim balasan.");
    }
  };

  async function setStatus(id: string, status: "Open" | "Closed") {
    try {
      const api = createClientApiClient();
      const res = await api.patch<SupportTicket>(`v1/platform/tickets/${id}/status`, {
        status,
      });
      if (res.success) applyUpdated(res.data);
      else setError(res.error.message ?? "Gagal memperbarui status.");
    } catch {
      setError("Gagal memperbarui status.");
    }
  }

  const handleCloseTicket = (id: string) => setStatus(id, "Closed");
  const handleOpenTicket = (id: string) => setStatus(id, "Open");

  // Filter tickets
  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.tenant.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusTab === "All" || t.status === statusTab;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <PageHeader
        title="Support Tickets"
        description="Helpdesk panel to resolve client technical requests and issues."
      />

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-xs font-medium">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="text-sm text-gray-500 py-12 text-center">Memuat tiket…</div>
      )}

      {/* Main Inbox Interface Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden min-h-[600px] h-[calc(100vh-220px)] max-h-[800px]">
        {/* Left Side: Ticket List Inbox (Span 4) */}
        <div className="lg:col-span-4 border-r border-outline-variant flex flex-col h-full bg-surface-container-low/20">
          {/* Header Search & Tabs */}
          <div className="p-4 space-y-3 border-b border-outline-variant/60 bg-surface-container-low/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/70" size={14} />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search inbox..."
                className="w-full pl-8 pr-3 py-1.5 bg-surface border border-outline-variant rounded-lg text-xs focus:ring-1 focus:ring-primary focus:outline-none transition-all"
              />
            </div>
            {/* Status tabs */}
            <div className="flex gap-2 text-xs font-semibold overflow-x-auto">
              {(["All", "Open", "In Progress", "Closed"] as const).map((tab) => {
                const count = tickets.filter((t) => t.status === tab).length;
                return (
                  <button
                    key={tab}
                    onClick={() => setStatusTab(tab)}
                    className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap ${
                      statusTab === tab
                        ? "bg-primary text-on-primary"
                        : "bg-surface border border-outline-variant hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {tab}
                    {tab !== "All" && count > 0 && ` (${count})`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ticket Items Scroll */}
          <div className="flex-1 overflow-y-auto divide-y divide-outline-variant/30 custom-scrollbar">
            {filteredTickets.length > 0 ? (
              filteredTickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicketId(t.id)}
                  className={`p-4 cursor-pointer hover:bg-surface transition-colors ${
                    activeTicket.id === t.id ? "bg-surface border-l-4 border-primary" : ""
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-bold text-on-surface-variant/70 tracking-wider">
                      {t.id}
                    </span>
                    <span className="text-[10px] text-on-surface-variant/60">{t.updatedAt}</span>
                  </div>
                  <h4 className="font-semibold text-xs text-on-surface mt-1 line-clamp-1">
                    {t.title}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-[10px] font-semibold text-primary flex items-center gap-0.5">
                      <Building size={10} /> {t.tenant}
                    </span>
                    <span className="text-[10px] text-on-surface-variant/40">•</span>
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        t.priority === "High"
                          ? "bg-rose-50 text-rose-700"
                          : t.priority === "Medium"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-slate-50 text-slate-500"
                      }`}
                    >
                      {t.priority}
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                        t.status === "Open"
                          ? "text-rose-600"
                          : t.status === "In Progress"
                          ? "text-amber-600"
                          : "text-emerald-600"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          t.status === "Open"
                            ? "bg-rose-600"
                            : t.status === "In Progress"
                            ? "bg-amber-600"
                            : "bg-emerald-600"
                        }`}
                      />
                      {t.status}
                    </span>
                    <ChevronRight size={14} className="text-on-surface-variant/40" />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-on-surface-variant/70 text-xs">
                No tickets matching query.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Conversation Panel (Span 8) */}
        {activeTicket ? (
          <div className="lg:col-span-8 flex flex-col h-full bg-surface-container-lowest">
            {/* Conversation Header */}
            <div className="p-4 border-b border-outline-variant/60 flex justify-between items-center bg-surface-container-low/20">
              <div>
                <span className="text-[10px] font-bold text-on-surface-variant/80 uppercase tracking-wider">
                  {activeTicket.id}
                </span>
                <h3 className="font-semibold text-xs sm:text-sm text-on-surface mt-0.5">
                  {activeTicket.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-semibold text-primary flex items-center gap-0.5">
                    <Building size={11} /> {activeTicket.tenant}
                  </span>
                  <span className="text-[10px] text-on-surface-variant/40">•</span>
                  <span className="text-[10px] text-on-surface-variant font-medium">
                    Category: {activeTicket.category}
                  </span>
                </div>
              </div>

              {/* Status Management */}
              <div className="flex gap-2">
                {activeTicket.status !== "Closed" ? (
                  <button
                    onClick={() => handleCloseTicket(activeTicket.id)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-sm"
                  >
                    <CheckCircle2 size={12} />
                    Close Ticket
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenTicket(activeTicket.id)}
                    className="px-3 py-1.5 border border-outline-variant hover:bg-surface-container-low text-on-surface rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    Reopen Ticket
                  </button>
                )}
              </div>
            </div>

            {/* Conversation Body Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-container-low/30 custom-scrollbar">
              {/* Client Original Description */}
              <div className="bg-surface border border-outline-variant rounded-xl p-4 space-y-2 shadow-sm max-w-2xl">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded">
                  Issue Description
                </span>
                <p className="text-xs text-on-surface/90 leading-relaxed font-body-md">
                  {activeTicket.description}
                </p>
              </div>

              {/* Thread Messages */}
              {activeTicket.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-xl ${
                    msg.sender === "Agent" ? "ml-auto flex-row-reverse" : ""
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-bold text-[10px] ${
                      msg.sender === "Agent"
                        ? "bg-primary text-on-primary"
                        : "bg-slate-200 text-slate-700 border border-slate-300"
                    }`}
                  >
                    {initialsOf(msg.senderName)}
                  </div>
                  <div>
                    <div
                      className={`flex items-baseline gap-2 mb-1 ${
                        msg.sender === "Agent" ? "justify-end" : ""
                      }`}
                    >
                      <span className="text-[10px] font-semibold text-on-surface">
                        {msg.senderName}
                      </span>
                      <span className="text-[9px] text-on-surface-variant/60">{msg.time}</span>
                    </div>
                    <div
                      className={`p-3.5 rounded-xl text-xs leading-relaxed font-body-md ${
                        msg.sender === "Agent"
                          ? "bg-primary/10 text-primary border border-primary/20 rounded-tr-none"
                          : "bg-surface border border-outline-variant/60 rounded-tl-none"
                      }`}
                    >
                      <p>{msg.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Input Form */}
            {activeTicket.status !== "Closed" ? (
              <form onSubmit={handleSendReply} className="p-4 border-t border-outline-variant bg-surface">
                <div className="relative">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    required
                    placeholder={`Reply to ${activeTicket.tenant}...`}
                    rows={3}
                    className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/60 rounded-xl text-xs text-on-surface placeholder-on-surface-variant/80 focus:ring-1 focus:ring-primary focus:outline-none resize-none"
                  />
                  <div className="absolute right-3 bottom-3 flex gap-2">
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 bg-primary hover:bg-primary/95 text-on-primary rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow"
                    >
                      <Send size={12} />
                      Send Reply
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="p-6 text-center text-xs text-on-surface-variant/80 border-t border-outline-variant bg-surface-container-low/20">
                This ticket is closed. You can reopen it using the header button to send a new message.
              </div>
            )}
          </div>
        ) : (
          <div className="lg:col-span-8 flex flex-col items-center justify-center text-center p-8 bg-surface-container-lowest">
            <Ticket size={48} className="text-on-surface-variant/40 mb-3" />
            <h4 className="font-semibold text-on-surface text-sm">No ticket selected</h4>
            <p className="text-xs text-on-surface-variant/70 max-w-xs mt-1">
              Select a support ticket from the inbox pane to view conversation history and reply.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
