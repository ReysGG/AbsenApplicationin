"use client";

import React, { useState } from 'react';
import { Safari } from '@/components/ui/safari';
import { LazyMotion, m, domAnimation, AnimatePresence } from 'motion/react';

const tabs = [
  {
    id: 'dashboard',
    label: 'Dashboard Utama',
    desc: 'Pantau grafik kehadiran harian, keterlambatan, dan persentase absen seluruh karyawan secara real-time.',
    img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop',
    url: 'app.absen.ai/dashboard'
  },
  {
    id: 'biometric',
    label: 'Face Recognition',
    desc: 'Sistem pencocokan biometrik wajah berkecepatan tinggi dengan integrasi perlindungan liveness detection.',
    img: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2070&auto=format&fit=crop',
    url: 'app.absen.ai/face-verify'
  },
  {
    id: 'gps',
    label: 'Validasi Geofencing',
    desc: 'Peta pelacakan lokasi berbasis GPS untuk membatasi wilayah clock-in karyawan agar terhindar dari pemalsuan lokasi.',
    img: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2074&auto=format&fit=crop',
    url: 'app.absen.ai/geofencing'
  },
  {
    id: 'payroll',
    label: 'Laporan Kehadiran',
    desc: 'Laporan otomatis terstruktur bulanan yang siap diekspor dalam satu klik untuk mempermudah perhitungan payroll.',
    img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop',
    url: 'app.absen.ai/reports'
  }
];

export default function UserFlows() {
  const [activeTab, setActiveTab] = useState(tabs[0]);

  return (
    <LazyMotion features={domAnimation}>
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-20 bg-surface-container-lowest rounded-3xl my-16 border card-border shadow-level-1">
        
        {/* Section Header */}
        <m.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 max-w-3xl mx-auto"
        >
          <h2 className="font-headline-lg text-headline-lg text-navy mb-4">Navigasi Alur Kerja HR &amp; Karyawan</h2>
          <p className="text-body-md text-on-surface-variant font-sans">
            Jelajahi alur dashboard interaktif kami untuk berbagai kebutuhan pengelolaan data operasional absensi.
          </p>
        </m.div>

        {/* Tabs list with sliding capsule indicator */}
        <div className="flex flex-wrap justify-center gap-2 mb-8 bg-neutral-100 p-1.5 rounded-full max-w-fit mx-auto border border-neutral-200/50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab)}
              className="relative px-6 py-2.5 rounded-full font-label-sm text-label-sm font-semibold transition-all cursor-pointer select-none"
            >
              {activeTab.id === tab.id && (
                <m.div
                  layoutId="activeTabBg"
                  className="absolute inset-0 bg-navy rounded-full z-0"
                  transition={{ type: "spring", stiffness: 300, damping: 28 }}
                />
              )}
              <span className={`relative z-10 transition-colors duration-200 ${
                activeTab.id === tab.id ? 'text-white' : 'text-neutral-600 hover:text-navy'
              }`}>
                {tab.label}
              </span>
            </button>
          ))}
        </div>

        {/* Active Tab Content Description with cross-fade */}
        <div className="text-center max-w-2xl mx-auto mb-10 min-h-[50px] font-sans overflow-hidden">
          <AnimatePresence mode="wait">
            <m.p 
              key={activeTab.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.25 }}
              className="font-body-sm text-body-sm text-on-surface-variant"
            >
              {activeTab.desc}
            </m.p>
          </AnimatePresence>
        </div>

        {/* Interactive Safari Mockup with entrance and switch animations */}
        <div className="relative w-full max-w-4xl mx-auto rounded-xl shadow-level-2 overflow-hidden border card-border bg-white p-1">
          <AnimatePresence mode="wait">
            <m.div
              key={activeTab.id}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <Safari
                url={activeTab.url}
                imageSrc={activeTab.img}
                className="w-full"
              />
            </m.div>
          </AnimatePresence>
        </div>
      </section>
    </LazyMotion>
  );
}

