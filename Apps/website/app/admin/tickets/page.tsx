"use client";

import React, { useState } from "react";
import { Ticket, Search, Filter, AlertCircle, Clock, CheckCircle2, ChevronRight, CornerDownLeft, Send, User, Building, Trash, Ban, Check, ArrowRight } from "lucide-react";
import { PageHeader } from "../_components/PageHeader";

interface Message {
  id: string;
  sender: "Client" | "Agent";
  senderName: string;
  avatarInitials: string;
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

const initialTickets: SupportTicket[] = [
  {
    id: "TCK-1092",
    tenant: "Acme Corp",
    title: "Geofencing check-in issues on Android 14",
    description: "Multiple employees reporting that GPS coordinates are not fetching when checking in on Samsung S24 devices running Android 14.",
    priority: "High",
    status: "Open",
    category: "Technical",
    updatedAt: "10 mins ago",
    messages: [
      {
        id: "1",
        sender: "Client",
        senderName: "Sarah Jenkins (Acme Corp Owner)",
        avatarInitials: "SJ",
        message: "Hi support team, we are facing an urgent issue with Android 14 check-ins. Geofencing seems to fail repeatedly. Could you check if the API payload is validated correctly?",
        time: "10 mins ago",
      },
    ],
  },
  {
    id: "TCK-1090",
    tenant: "Globex Inc.",
    title: "Cannot download monthly rekap excel report",
    description: "When downloading monthly attendance rekap, we are getting a 504 Gateway Timeout error. This is blocking our payroll processing.",
    priority: "High",
    status: "In Progress",
    category: "Technical",
    updatedAt: "2 hours ago",
    messages: [
      {
        id: "1",
        sender: "Client",
        senderName: "Budi Santoso (Globex Admin)",
        avatarInitials: "BS",
        message: "We need the monthly rekap excel report downloaded immediately. The spinner just keeps loading until a timeout occurs.",
        time: "5 hours ago",
      },
      {
        id: "2",
        sender: "Agent",
        senderName: "Michael Chen (Support)",
        avatarInitials: "MC",
        message: "Hello Budi, I am looking into the database query performance for monthly excel reports. It appears the date indices are slow for large employee lists. I will update you soon.",
        time: "2 hours ago",
      },
    ],
  },
  {
    id: "TCK-1088",
    tenant: "Initech",
    title: "Change billing payment method",
    description: "Need to update credit card on file for subscription renewals. The system keeps rejecting our corporate Visa card.",
    priority: "Medium",
    status: "Closed",
    category: "Billing",
    updatedAt: "1 day ago",
    messages: [
      {
        id: "1",
        sender: "Client",
        senderName: "Peter Gibbons",
        avatarInitials: "PG",
        message: "Could you reset our billing profile? Our new corporate card keeps getting rejected.",
        time: "1 day ago",
      },
      {
        id: "2",
        sender: "Agent",
        senderName: "Elena Rodriguez (Billing)",
        avatarInitials: "ER",
        message: "Hi Peter, I have cleared the billing attempt cache. Please try entering the credit card information now. Let me know if it goes through.",
        time: "18 hours ago",
      },
      {
        id: "3",
        sender: "Client",
        senderName: "Peter Gibbons",
        avatarInitials: "PG",
        message: "Thanks! That worked perfectly. Ticket can be closed.",
        time: "16 hours ago",
      },
    ],
  },
  {
    id: "TCK-1085",
    tenant: "Stark Industries",
    title: "Custom integration request: SAP API",
    description: "Requesting Webhook endpoints details to push live check-in events to our internal SAP payroll database.",
    priority: "Low",
    status: "In Progress",
    category: "Feature Request",
    updatedAt: "3 days ago",
    messages: [
      {
        id: "1",
        sender: "Client",
        senderName: "Happy Hogan",
        avatarInitials: "HH",
        message: "Do you support real-time webhooks? We need to stream logs directly to SAP database integrations.",
        time: "3 days ago",
      },
    ],
  },
];

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>(initialTickets);
  const [selectedTicketId, setSelectedTicketId] = useState<string>("TCK-1092");
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<"All" | "Open" | "In Progress" | "Closed">("All");
  const [replyText, setReplyText] = useState("");

  const activeTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0];

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText || !activeTicket) return;

    const newReply: Message = {
      id: (activeTicket.messages.length + 1).toString(),
      sender: "Agent",
      senderName: "Super Admin (You)",
      avatarInitials: "SA",
      message: replyText,
      time: "Just now",
    };

    setTickets((prev) =>
      prev.map((t) =>
        t.id === activeTicket.id
          ? {
              ...t,
              status: "In Progress" as const,
              updatedAt: "Just now",
              messages: [...t.messages, newReply],
            }
          : t
      )
    );
    setReplyText("");
  };

  const handleCloseTicket = (id: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "Closed" as const, updatedAt: "Just now" } : t))
    );
  };

  const handleOpenTicket = (id: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "Open" as const, updatedAt: "Just now" } : t))
    );
  };

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
                    {msg.avatarInitials}
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
