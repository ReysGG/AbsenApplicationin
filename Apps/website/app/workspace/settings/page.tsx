"use client";

import React, { useState } from "react";
import {
  User,
  Shield,
  Smartphone,
  Bell,
  CheckCircle,
  Save,
  Key,
  SmartphoneIcon
} from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaved, setIsSaved] = useState(false);

  // Settings form states
  const [name, setName] = useState("Michael Chen");
  const [email, setEmail] = useState("michael.c@acme.com");
  const [phone, setPhone] = useState("+62 812 3456 7890");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [pushNotifs, setPushNotifs] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const tabs = [
    { id: "profile", label: "Profile Details", icon: User },
    { id: "security", label: "Security & Login", icon: Shield },
    { id: "devices", label: "Device Locking", icon: Smartphone },
    { id: "notifications", label: "Alert Config", icon: Bell }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="font-title-xxl text-primary font-bold tracking-tight">Settings</h2>
        <p className="text-xs text-on-surface-variant font-medium">
          Configure personal workspace preferences and registered mobile devices.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center h-10 px-4 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                }`}
              >
                <Icon size={15} className="mr-3" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Box */}
        <div className="md:col-span-3 bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 shadow-xs min-h-[350px]">
          {isSaved && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
              <CheckCircle size={15} />
              Changes saved successfully.
            </div>
          )}

          {activeTab === "profile" && (
            <form onSubmit={handleSave} className="space-y-5">
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider pb-3 border-b border-outline-variant">
                Account Credentials
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface-variant block uppercase">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-9 px-3 border border-outline-variant rounded-lg text-xs font-semibold bg-surface focus:ring-1 focus:ring-primary focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface-variant block uppercase">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-9 px-3 border border-outline-variant rounded-lg text-xs font-semibold bg-surface focus:ring-1 focus:ring-primary focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface-variant block uppercase">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-9 px-3 border border-outline-variant rounded-lg text-xs font-semibold bg-surface focus:ring-1 focus:ring-primary focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface-variant block uppercase">
                    Assigned Division
                  </label>
                  <input
                    type="text"
                    value="Engineering"
                    disabled
                    className="w-full h-9 px-3 border border-outline-variant rounded-lg text-xs font-semibold bg-surface-container opacity-70 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="h-9 px-5 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Save size={13} />
                  Save Preferences
                </button>
              </div>
            </form>
          )}

          {activeTab === "security" && (
            <form onSubmit={handleSave} className="space-y-5">
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider pb-3 border-b border-outline-variant">
                Change Password
              </h3>

              <div className="space-y-4 max-w-sm">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface-variant block uppercase">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full h-9 px-3 border border-outline-variant rounded-lg text-xs font-semibold bg-surface focus:ring-1 focus:ring-primary focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface-variant block uppercase">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-9 px-3 border border-outline-variant rounded-lg text-xs font-semibold bg-surface focus:ring-1 focus:ring-primary focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="h-9 px-5 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Key size={13} />
                  Update Password
                </button>
              </div>
            </form>
          )}

          {activeTab === "devices" && (
            <div className="space-y-5">
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider pb-3 border-b border-outline-variant">
                Registered Device Fingerprints
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                AttendX uses device fingerprints to lock checks to a single verified device.
              </p>

              <div className="border border-outline-variant rounded-2xl p-4 bg-surface-container/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
                    <SmartphoneIcon size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-on-surface">iPhone 15 Pro</h4>
                    <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">
                      FINGERPRINT: D4A8-79C0-11EF-BA29
                    </p>
                  </div>
                </div>
                <button className="h-7 px-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold text-[10px] rounded-lg transition-colors">
                  Unbind Device
                </button>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-5">
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider pb-3 border-b border-outline-variant">
                Alert Preferences
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-outline-variant/60">
                  <div>
                    <h4 className="text-xs font-bold text-on-surface">Push Notification Logs</h4>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">
                      Send instantaneous check-in confirmations to my phone.
                    </p>
                  </div>
                  <button
                    onClick={() => setPushNotifs(!pushNotifs)}
                    className={`h-6 w-11 rounded-full p-1 transition-colors relative ${
                      pushNotifs ? "bg-primary" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`h-4 w-4 bg-white rounded-full block transition-transform ${
                        pushNotifs ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-outline-variant/60">
                  <div>
                    <h4 className="text-xs font-bold text-on-surface">Weekly Attendance Summary</h4>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">
                      Receive weekly logs and compliance statistics via email.
                    </p>
                  </div>
                  <button
                    onClick={() => setEmailNotifs(!emailNotifs)}
                    className={`h-6 w-11 rounded-full p-1 transition-colors relative ${
                      emailNotifs ? "bg-primary" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`h-4 w-4 bg-white rounded-full block transition-transform ${
                        emailNotifs ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
