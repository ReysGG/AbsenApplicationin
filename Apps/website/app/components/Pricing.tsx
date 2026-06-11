"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { BorderBeam } from '@/components/ui/border-beam';
import { LazyMotion, m, domAnimation, AnimatePresence } from 'motion/react';

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <LazyMotion features={domAnimation}>
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-20" id="harga">
        
        {/* Section Header */}
        <m.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 max-w-3xl mx-auto"
        >
          <h2 className="font-headline-lg text-headline-lg text-navy mb-4">Pilih Paket yang Sesuai untuk Bisnis Anda</h2>
          <p className="text-body-md text-on-surface-variant font-sans mb-8">
            Mulai uji coba gratis 14 hari tanpa biaya komitmen. Tingkatkan atau turunkan paket kapan saja.
          </p>

          {/* Toggle with sliding capsule */}
          <div className="inline-flex items-center bg-neutral-100 p-1 rounded-full border card-border font-sans relative">
            <button
              onClick={() => setIsYearly(false)}
              className="relative px-6 py-2 rounded-full font-label-sm text-label-sm font-semibold transition-all cursor-pointer select-none"
            >
              {!isYearly && (
                <m.div
                  layoutId="activePricingToggle"
                  className="absolute inset-0 bg-navy rounded-full z-0"
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                />
              )}
              <span className={`relative z-10 transition-colors duration-200 ${
                !isYearly ? 'text-white' : 'text-neutral-600 hover:text-navy'
              }`}>
                Bulanan
              </span>
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className="relative px-6 py-2 rounded-full font-label-sm text-label-sm font-semibold transition-all cursor-pointer select-none"
            >
              {isYearly && (
                <m.div
                  layoutId="activePricingToggle"
                  className="absolute inset-0 bg-navy rounded-full z-0"
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                />
              )}
              <span className={`relative z-10 transition-colors duration-200 ${
                isYearly ? 'text-white' : 'text-neutral-600 hover:text-navy'
              }`}>
                Tahunan <span className="text-xs text-brand-teal font-bold">(Hemat 20%)</span>
              </span>
            </button>
          </div>
        </m.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch font-sans">
          
          {/* Lite Plan */}
          <m.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.1, type: "spring", stiffness: 80, damping: 15 }}
            className="bg-white/80 backdrop-blur-md rounded-3xl p-8 border card-border shadow-level-1 flex flex-col justify-between hover:shadow-level-3 hover:scale-[1.02] hover:border-mint/30 transition-all duration-300"
          >
            <div>
              <h3 className="font-headline-sm text-headline-sm text-navy mb-2">Lite</h3>
              <p className="text-on-surface-variant text-body-sm font-sans mb-6">Cocok untuk tim kecil dengan kebutuhan absensi dasar.</p>
              <div className="mb-8 min-h-[44px]">
                <AnimatePresence mode="wait">
                  <m.span 
                    key={isYearly ? 'yearly' : 'monthly'}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="font-display-md text-display-md text-navy font-bold inline-block"
                  >
                    {isYearly ? 'Rp 12.000' : 'Rp 15.000'}
                  </m.span>
                </AnimatePresence>
                <span className="text-on-surface-variant text-label-sm font-sans"> / karyawan / bln</span>
              </div>
              <ul className="space-y-4 mb-8 text-on-surface-variant text-body-sm font-sans">
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xs">
                    <span className="material-symbols-outlined text-xs font-bold">check</span>
                  </span>
                  Verifikasi Wajah Standar
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xs">
                    <span className="material-symbols-outlined text-xs font-bold">check</span>
                  </span>
                  Pencatatan Kehadiran GPS
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xs">
                    <span className="material-symbols-outlined text-xs font-bold">check</span>
                  </span>
                  Laporan Kehadiran PDF Harian
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xs">
                    <span className="material-symbols-outlined text-xs font-bold">check</span>
                  </span>
                  Dukungan Layanan Email
                </li>
              </ul>
            </div>
            <Link href="/sign-up" className="block text-center w-full py-3 border border-mint text-brand-teal hover:bg-mint/10 rounded-xl font-label-md text-label-md transition-all duration-300 cursor-pointer font-bold">
              Mulai Uji Coba
            </Link>
          </m.div>

          {/* Pro Plan (Highlighted) */}
          <m.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.25, type: "spring", stiffness: 80, damping: 15 }}
            className="bg-white rounded-3xl p-8 border-2 border-mint shadow-[0_0_50px_0_rgba(52,211,153,0.15)] flex flex-col justify-between relative overflow-hidden group hover:scale-[1.03] transition-all duration-300"
          >
            <BorderBeam size={250} duration={6} colorFrom="#34D399" colorTo="#022C22" />
            <div className="absolute top-4 right-4 bg-linear-to-r from-navy via-brand-teal to-mint text-white font-label-xs text-label-xs font-bold px-3.5 py-1.5 rounded-full border border-mint/20 shadow-sm">
              Populer
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-navy mb-2 flex items-center gap-1.5">
                Pro <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-bold uppercase font-sans border border-emerald-200">Recommended</span>
              </h3>
              <p className="text-on-surface-variant text-body-sm font-sans mb-6">Sempurna untuk bisnis berkembang yang butuh verifikasi anti-cheat.</p>
              <div className="mb-8 min-h-[44px]">
                <AnimatePresence mode="wait">
                  <m.span 
                    key={isYearly ? 'yearly' : 'monthly'}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="font-display-md text-display-md text-navy font-bold inline-block"
                  >
                    {isYearly ? 'Rp 23.200' : 'Rp 29.000'}
                  </m.span>
                </AnimatePresence>
                <span className="text-on-surface-variant text-label-sm font-sans"> / karyawan / bln</span>
              </div>
              <ul className="space-y-4 mb-8 text-on-surface-variant text-body-sm font-sans">
                <li className="flex items-center gap-2 font-semibold text-navy">
                  <span className="w-5 h-5 rounded-full bg-emerald-50 text-white flex items-center justify-center text-xs shadow-xs">
                    <span className="material-symbols-outlined text-xs font-bold">check</span>
                  </span>
                  Liveness Detection (Anti-Kecurangan)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xs">
                    <span className="material-symbols-outlined text-xs font-bold">check</span>
                  </span>
                  Geofencing Radius Kustom (Multi-Kantor)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xs">
                    <span className="material-symbols-outlined text-xs font-bold">check</span>
                  </span>
                  Laporan spreadsheet Excel &amp; PDF otomatis
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xs">
                    <span className="material-symbols-outlined text-xs font-bold">check</span>
                  </span>
                  Dukungan Chat Prioritas 24/7
                </li>
              </ul>
            </div>
            <Link href="/sign-up" className="block text-center w-full py-3 bg-navy text-white hover:bg-mint hover:text-navy rounded-xl font-label-md text-label-md font-bold transition-all duration-300 shadow-level-1 cursor-pointer">
              Mulai Uji Coba
            </Link>
          </m.div>

          {/* Enterprise Plan */}
          <m.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.4, type: "spring", stiffness: 80, damping: 15 }}
            className="bg-white/80 backdrop-blur-md rounded-3xl p-8 border card-border shadow-level-1 flex flex-col justify-between hover:shadow-level-3 hover:scale-[1.02] hover:border-mint/30 transition-all duration-300"
          >
            <div>
              <h3 className="font-headline-sm text-headline-sm text-navy mb-2">Enterprise</h3>
              <p className="text-on-surface-variant text-body-sm font-sans mb-6">Untuk korporasi besar dengan kebutuhan kepatuhan hukum dan customisasi.</p>
              <div className="mb-8 min-h-[44px]">
                <span className="font-display-md text-display-md text-navy font-bold">Custom</span>
                <span className="text-on-surface-variant text-label-sm font-sans"> / Hubungi Kami</span>
              </div>
              <ul className="space-y-4 mb-8 text-on-surface-variant text-body-sm font-sans">
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xs">
                    <span className="material-symbols-outlined text-xs font-bold">check</span>
                  </span>
                  Integrasi REST API &amp; Webhook
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xs">
                    <span className="material-symbols-outlined text-xs font-bold">check</span>
                  </span>
                  Hosting Mandiri (On-premise / Private Cloud)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xs">
                    <span className="material-symbols-outlined text-xs font-bold">check</span>
                  </span>
                  Dedicated Support Account Manager
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xs">
                    <span className="material-symbols-outlined text-xs font-bold">check</span>
                  </span>
                  Perjanjian Layanan Kustom (SLA &amp; NDA)
                </li>
              </ul>
            </div>
            <Link href="/sign-up" className="block text-center w-full py-3 bg-navy text-white hover:bg-mint hover:text-navy rounded-xl font-label-md text-label-md font-bold transition-all duration-300 cursor-pointer">
              Hubungi Sales
            </Link>
          </m.div>
        </div>
      </section>
    </LazyMotion>
  );
}
