"use client";

import React from 'react';
import { Android } from '@/components/ui/android';
import { LazyMotion, m, domAnimation } from 'motion/react';

export default function Steps() {
  const steps = [
    {
      number: 1,
      bg: "bg-navy",
      title: "Unduh & Instal Aplikasi",
      desc: "Karyawan mengunduh aplikasi Absen.ai di Google Play Store atau Apple App Store secara gratis."
    },
    {
      number: 2,
      bg: "bg-brand-teal",
      title: "Daftarkan Wajah & Lokasi Kantor",
      desc: "Karyawan mendaftarkan profil wajah (Face Register) dan HR mengatur geofence radius kantor melalui Web Dashboard."
    },
    {
      number: 3,
      bg: "bg-emerald-success",
      title: "Mulai Absen & Pantau Real-time",
      desc: "Karyawan melakukan clock-in wajah & GPS. Data absensi otomatis langsung tercatat dan dapat dipantau oleh HR."
    }
  ];

  return (
    <LazyMotion features={domAnimation}>
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-20" id="alur">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Column: Text & Steps */}
          <m.div 
            initial={{ opacity: 0, x: -35 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="space-y-10"
          >
            <div>
              <h2 className="font-headline-lg text-headline-lg text-navy mb-4">Cukup 3 Langkah untuk Memulai</h2>
              <p className="text-body-md text-on-surface-variant font-sans">
                Proses integrasi dan penyiapan yang cepat tanpa memerlukan instalasi perangkat keras (fingerprint scanner) tambahan.
              </p>
            </div>

            <div className="space-y-8 font-sans">
              {steps.map((step, index) => (
                <m.div 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  className="flex gap-4"
                >
                  <div className={`w-12 h-12 rounded-full ${step.bg} text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-sm`}>
                    {step.number}
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-navy mb-1">{step.title}</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {step.desc}
                    </p>
                  </div>
                </m.div>
              ))}
            </div>
          </m.div>

          {/* Right Column: Android Mockup with Floating Animation */}
          <div className="flex justify-center items-center">
            <m.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, type: "spring", stiffness: 80, damping: 15 }}
              className="relative w-[240px] h-[480px]"
            >
              {/* Glow shadow — centered behind the phone */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-linear-to-br from-brand-teal/20 via-mint/15 to-navy/10 rounded-full blur-3xl pointer-events-none"></div>
              {/* Bottom drop shadow puddle */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[160px] h-[32px] bg-neutral-900/15 rounded-full blur-xl pointer-events-none"></div>
              
              {/* Infinite gentle floating motion for phone container */}
              <m.div
                animate={{ y: [0, -12, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                className="w-full h-full"
              >
                <Android className="relative z-10 w-full h-full drop-shadow-xl">
                  {/* Dynamic simulated phone mockup UI */}
                  <div className="w-full h-full bg-[#030712] text-white flex flex-col justify-between p-5 font-sans relative overflow-hidden">
                    {/* Background glow decorators */}
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                    
                    {/* Top Device Bar */}
                    <div className="flex justify-between items-center text-[10px] text-neutral-400 font-medium tracking-wide mb-2.5 relative z-10">
                      <span>08:00</span>
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[10px]">signal_cellular_4_bar</span>
                        <span className="material-symbols-outlined text-[10px]">wifi</span>
                        <span className="material-symbols-outlined text-[10px]">battery_5_bar</span>
                      </div>
                    </div>

                    {/* App Logo/Header */}
                    <div className="flex items-center gap-1.5 mb-2 relative z-10">
                      <div className="w-5 h-5 rounded-md bg-emerald-500 flex items-center justify-center text-white font-bold text-[10px]">A</div>
                      <div>
                        <h4 className="text-[10px] font-bold tracking-tight leading-none">Absen.ai Mobile</h4>
                        <p className="text-[7px] text-emerald-400 font-semibold tracking-wider uppercase">Face &amp; GPS Verification</p>
                      </div>
                    </div>

                    {/* Camera scan area (simulated) */}
                    <div className="relative w-full aspect-square rounded-2xl border border-neutral-850 bg-neutral-950 flex flex-col items-center justify-center overflow-hidden mb-2 group">
                      {/* Grid overlay */}
                      <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] bg-size-[16px_16px] pointer-events-none"></div>
                      
                      {/* Avatar profile */}
                      <div className="relative w-32 h-32 rounded-full border border-emerald-500/80 p-0.5 flex items-center justify-center overflow-hidden z-10">
                        <img 
                          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces"
                          alt="Face Scan" 
                          className="w-full h-full rounded-full object-cover"
                        />
                        {/* Scanning beam line */}
                        <div className="absolute inset-x-0 h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] animate-scanline" />
                      </div>

                      {/* Scanning Liveness Indicators */}
                      <div className="absolute bottom-2 bg-neutral-900/90 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-emerald-500/20 text-[8px] font-bold text-emerald-400 flex items-center gap-1 z-20">
                        <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping"></span>
                        Liveness Detected
                      </div>
                    </div>

                    {/* Check-in Status Indicators */}
                    <div className="space-y-2 relative z-10">
                      <div className="bg-neutral-900/60 border border-neutral-850 p-2 rounded-xl flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-xs font-bold">verified</span>
                        </div>
                        <div className="leading-tight">
                          <p className="text-[7px] text-neutral-400 uppercase tracking-wider font-semibold">Face Verification</p>
                          <p className="text-[9px] text-white font-bold">99.8% Match (Rian H.)</p>
                        </div>
                      </div>

                      <div className="bg-neutral-900/60 border border-neutral-850 p-2 rounded-xl flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-xs font-bold">my_location</span>
                        </div>
                        <div className="leading-tight">
                          <p className="text-[7px] text-neutral-400 uppercase tracking-wider font-semibold">Geofence Location</p>
                          <p className="text-[9px] text-white font-bold">Inside Office (Radius 12m)</p>
                        </div>
                      </div>
                    </div>

                    {/* Clock-in Button (Active state success) */}
                    <div className="mt-3 relative z-10">
                      <div className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-2.5 px-3 rounded-xl text-center text-[10px] font-bold shadow-lg shadow-emerald-950/20 border border-emerald-400/20 flex items-center justify-center gap-1">
                        <span className="material-symbols-outlined text-xs">check_circle</span>
                        Clock In Berhasil (08:00 WIB)
                      </div>
                      <p className="text-[7px] text-center text-neutral-500 mt-1.5 font-medium tracking-wide">
                        IP: 180.252.12.9 • Android 14 • Safe Device
                      </p>
                    </div>

                  </div>
                </Android>
              </m.div>
            </m.div>
          </div>
        </div>
      </section>
    </LazyMotion>
  );
}
