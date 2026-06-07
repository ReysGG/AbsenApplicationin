"use client";

import React from 'react';
import { OrbitingCircles } from '@/components/ui/orbiting-circles';
import { IconCloud } from '@/components/ui/icon-cloud';
import { LazyMotion, m, domAnimation } from 'motion/react';
import { 
  MessageSquare, 
  FileSpreadsheet, 
  Database, 
  MapPin, 
  UserCheck, 
  Mail, 
  Cpu, 
  ShieldCheck, 
  Clock 
} from 'lucide-react';

const SlackIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M5.04 15.17a2.52 2.52 0 1 1-2.52 2.52h2.52v-2.52zM6.3 15.17a2.52 2.52 0 0 1 2.52-2.52h5.04a2.52 2.52 0 0 1 2.52 2.52v5.04a2.52 2.52 0 0 1-2.52 2.52H8.82a2.52 2.52 0 0 1-2.52-2.52v-5.04zM8.82 5.04a2.52 2.52 0 1 1 2.52-2.52v2.52H8.82zM8.82 6.3a2.52 2.52 0 0 1 2.52 2.52v5.04a2.52 2.52 0 0 1-2.52 2.52H3.78a2.52 2.52 0 0 1-2.52-2.52V8.82a2.52 2.52 0 0 1 2.52-2.52h5.04zm10.14 3.78a2.52 2.52 0 1 1 2.52-2.52h-2.52v2.52zm-1.26 0a2.52 2.52 0 0 1-2.52 2.52h-5.04a2.52 2.52 0 0 1-2.52-2.52V5.04A2.52 2.52 0 0 1 15.18 2.5h2.52a2.52 2.52 0 0 1 2.52 2.52v5.04zm-3.78 10.14a2.52 2.52 0 1 1-2.52 2.52v-2.52h2.52zm0-1.26a2.52 2.52 0 0 1-2.52-2.52v-5.04A2.52 2.52 0 0 1 15.18 6.3h5.04a2.52 2.52 0 0 1 2.52 2.52v5.04a2.52 2.52 0 0 1-2.52 2.52h-5.04z" />
  </svg>
);

// Icons for the 3D Interactive Cloud
const cloudIcons = [
  <MessageSquare key="msg" className="size-10 text-emerald-500 fill-emerald-500/10" />,
  <SlackIcon key="slack" className="size-10 text-navy" />,
  <FileSpreadsheet key="sheets" className="size-10 text-green-600" />,
  <Database key="db" className="size-10 text-blue-600" />,
  <MapPin key="gps" className="size-10 text-rose-500 fill-rose-500/10" />,
  <UserCheck key="bio" className="size-10 text-emerald-600" />,
  <Mail key="mail" className="size-10 text-sky-500" />,
  <Cpu key="cpu" className="size-10 text-brand-teal" />,
  <ShieldCheck key="shield" className="size-10 text-teal-600" />,
  <Clock key="clock" className="size-10 text-navy" />
];

export default function Integrations() {
  return (
    <LazyMotion features={domAnimation}>
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-24 border-t border-neutral-200/50" id="integrasi">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Left Column: Visual Orbiting Circles and 3D Icon Cloud */}
          <div className="lg:col-span-6 relative flex h-[480px] w-full flex-col items-center justify-center overflow-hidden rounded-3xl bg-white border card-border shadow-level-1">
            {/* Background Radial Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-mint)/5_0%,transparent_60%)] pointer-events-none" />
            
            {/* Center Logo / Shield */}
            <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-navy text-white shadow-level-2 border border-mint/20">
              <span className="font-display-lg text-lg font-bold tracking-tight text-white">A</span>
              <div className="absolute inset-0 rounded-2xl bg-linear-to-tr from-brand-teal/20 to-mint/20 animate-pulse" />
            </div>

            {/* Inner Loop Orbit - Security & Biometrics */}
            <OrbitingCircles duration={15} radius={100} iconSize={40}>
              <div className="flex items-center justify-center p-2.5 rounded-full bg-emerald-50 border border-emerald-200/60 shadow-3xs text-brand-teal">
                <UserCheck className="size-5" />
              </div>
              <div className="flex items-center justify-center p-2.5 rounded-full bg-emerald-50 border border-emerald-200/60 shadow-3xs text-brand-teal">
                <ShieldCheck className="size-5" />
              </div>
              <div className="flex items-center justify-center p-2.5 rounded-full bg-emerald-50 border border-emerald-200/60 shadow-3xs text-brand-teal">
                <Clock className="size-5" />
              </div>
            </OrbitingCircles>

            {/* Outer Loop Orbit - Integrations & Channels (Reverse) */}
            <OrbitingCircles duration={25} radius={180} iconSize={40} reverse>
              <div className="flex items-center justify-center p-2.5 rounded-full bg-neutral-50 border border-neutral-250 shadow-3xs text-emerald-600">
                <MessageSquare className="size-5" />
              </div>
              <div className="flex items-center justify-center p-2.5 rounded-full bg-neutral-50 border border-neutral-250 shadow-3xs text-navy">
                <SlackIcon className="size-5" />
              </div>
              <div className="flex items-center justify-center p-2.5 rounded-full bg-neutral-50 border border-neutral-250 shadow-3xs text-green-700">
                <FileSpreadsheet className="size-5" />
              </div>
              <div className="flex items-center justify-center p-2.5 rounded-full bg-neutral-50 border border-neutral-250 shadow-3xs text-blue-600">
                <Database className="size-5" />
              </div>
            </OrbitingCircles>
          </div>

          {/* Right Column: Copywriting & Content */}
          <m.div 
            initial={{ opacity: 0, x: 35 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6 space-y-8 font-sans"
          >
            <div>
              <span className="bg-emerald-50 text-brand-teal font-label-xs text-label-xs font-bold px-3.5 py-1.5 rounded-full border border-emerald-200 uppercase tracking-wider mb-4 inline-block">
                Konektivitas Ekosistem
              </span>
              <h2 className="font-headline-lg text-headline-lg text-navy mb-4 leading-tight">
                Integrasi Mulus dengan Workflow &amp; Software Anda
              </h2>
              <p className="text-body-md text-on-surface-variant leading-relaxed">
                Absen.ai tidak berdiri sendiri. Kami dirancang untuk langsung terhubung ke berbagai platform pesan dan database perusahaan untuk mengotomatiskan pengelolaan HR Anda secara end-to-end.
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-250 text-brand-teal">
                  <MessageSquare className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-navy mb-1">WhatsApp &amp; Chat Alert</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Kirim pengingat clock-in otomatis, log izin sakit, dan peringatan keterlambatan langsung ke nomor WhatsApp pribadi karyawan.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-250 text-brand-teal">
                  <FileSpreadsheet className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-navy mb-1">Google Sheets &amp; Rekap Excel</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Sinkronisasi data kehadiran bulanan secara terjadwal ke Google Sheets untuk kemudahan audit data tanpa ekspor manual.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-250 text-brand-teal">
                  <Database className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-navy mb-1">ERP &amp; HRIS Webhook</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Koneksikan data ke sistem payroll internal (SAP, Talenta, dll.) dengan Webhooks instan setiap kali ada aktivitas absensi sukses.
                  </p>
                </div>
              </div>
            </div>
          </m.div>

        </div>
      </section>
    </LazyMotion>
  );
}
