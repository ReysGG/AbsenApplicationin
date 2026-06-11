"use client";

import React from 'react';
import Link from 'next/link';
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text';
import { ShinyButton } from '@/components/ui/shiny-button';
import { Safari } from '@/components/ui/safari';
import { BorderBeam } from '@/components/ui/border-beam';
import { GridPattern } from '@/components/ui/grid-pattern';
import { Particles } from '@/components/ui/particles';
import { Marquee } from '@/components/ui/marquee';
import { LazyMotion, m, domAnimation } from 'motion/react';

export default function Hero() {
  return (
    <LazyMotion features={domAnimation}>
      <section id="hero" className="relative px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-20 md:py-28 overflow-hidden flex flex-col items-center text-center">
        {/* Background Grid Pattern and Interactive Particles */}
        <GridPattern
          width={40}
          height={40}
          x={-1}
          y={-1}
          className="absolute inset-x-0 inset-y-[-30%] h-[150%] w-full skew-y-12 fill-mint/3 stroke-mint/8 mask-[radial-gradient(ellipse_at_center,white,transparent_75%)] z-0"
        />
        <Particles className="absolute inset-0 z-0" quantity={100} color="#34D399" ease={60} refresh />
        
        {/* Animated Badge */}
        <m.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="z-10 mb-6"
        >
          <AnimatedGradientText className="px-4 py-1.5 rounded-full border border-mint/20 bg-mint/5 font-label-sm text-label-sm font-semibold inline-flex items-center gap-2">
            ✨ <span className="bg-linear-to-r from-navy via-brand-teal to-mint bg-clip-text text-transparent">Introducing Absen.ai v1.0</span>
          </AnimatedGradientText>
        </m.div>

        {/* Main Headline */}
        <m.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="z-10 font-display-lg text-display-lg text-navy max-w-4xl tracking-tight leading-tight mb-6"
        >
          Otomatisasi Kehadiran &amp; <span className="bg-linear-to-r from-brand-teal to-mint bg-clip-text text-transparent">Kelola Alur Kerja HR</span> dengan AI
        </m.h1>

        {/* Subheadline */}
        <m.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="z-10 text-body-lg text-neutral-600 max-w-2xl mb-10 font-sans"
        >
          Tinggalkan rekap manual. Kelola kehadiran WFO, WFH, shift, dan izin karyawan secara otomatis berbasis Face Recognition &amp; GPS dengan laporan real-time.
        </m.p>

        {/* CTA Buttons */}
        <m.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="z-10 flex flex-col sm:flex-row gap-4 mb-16 items-center justify-center"
        >
          <Link href="/sign-up" aria-label="Coba gratis 14 hari">
            <ShinyButton className="px-8 py-4 bg-navy text-white border-navy rounded-md text-sm font-semibold hover:bg-mint hover:text-navy transition-all duration-300 shadow-level-2">
              Coba Gratis 14 Hari
            </ShinyButton>
          </Link>
          <a href="#fitur" className="flex items-center justify-center px-8 py-4 bg-transparent border border-mint text-brand-teal hover:text-navy rounded-md text-sm font-semibold hover:bg-mint/10 transition-all duration-300 font-sans cursor-pointer">
            Lihat Demo Video
          </a>
        </m.div>

        {/* Logos Ticker (Trusted by) */}
        <m.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.55 }}
          className="z-10 w-full max-w-4xl mb-20 font-sans"
        >
          <p className="text-xs uppercase tracking-widest text-neutral-400 font-bold mb-6">
            Dipercaya oleh Perusahaan &amp; Startup Berkembang
          </p>
          <Marquee className="[--duration:30s] opacity-60 hover:opacity-90 transition-opacity" pauseOnHover>
            <div className="flex items-center justify-around gap-16 px-4">
              <div className="flex items-center gap-2 font-semibold text-neutral-500 tracking-tight">
                <span className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] text-white font-extrabold">G</span> gojek
              </div>
              <div className="flex items-center gap-1 font-semibold text-neutral-500 tracking-tight">
                <span className="text-emerald-500 text-lg">●</span> tokopedia
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-neutral-500 tracking-tight">
                <span className="w-4.5 h-4.5 bg-sky-500 rounded-sm flex items-center justify-center text-[9px] text-white font-bold">T</span> traveloka
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-neutral-500 tracking-tight">
                <span className="w-4.5 h-4.5 bg-red-600 rounded-full flex items-center justify-center text-[9px] text-white font-bold">B</span> bukalapak
              </div>
              <div className="flex items-center gap-2 font-semibold text-neutral-500 tracking-tight">
                <span className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-[9px] text-white font-bold">RG</span> ruangguru
              </div>
              <div className="flex items-center gap-1 font-semibold text-neutral-500 tracking-tight">
                <span className="text-red-500 font-bold text-lg">+</span> halodoc
              </div>
              <div className="flex items-center gap-1 font-semibold text-neutral-500 tracking-tight">
                <span className="text-emerald-500">☕</span> kopi kenangan
              </div>
              <div className="flex items-center gap-1 font-semibold text-neutral-500 tracking-tight">
                <span className="text-emerald-600">🌱</span> bibit
              </div>
            </div>
          </Marquee>
        </m.div>

        {/* Safari Dashboard Mockup */}
        <m.div 
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.65, type: "spring", stiffness: 80, damping: 15 }}
          className="relative z-10 w-full max-w-5xl rounded-2xl shadow-level-3 overflow-visible border card-border bg-white p-1"
        >
          <Safari
            url="app.absen.ai"
            imageSrc="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop"
            className="w-full rounded-xl overflow-hidden"
          />
          <BorderBeam size={250} duration={8} colorFrom="#022C22" colorTo="#34D399" />
          
          {/* Floating Badges */}
          <div className="absolute top-[25%] -left-12 hidden lg:flex items-center gap-3 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl border card-border shadow-level-2 animate-[bounce_4s_infinite] z-20">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">verified</span>
            </div>
            <div className="text-left font-sans">
              <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">Face Match</p>
              <p className="text-xs text-navy font-bold">99.8% Verified</p>
            </div>
          </div>

          <div className="absolute bottom-[20%] -right-12 hidden lg:flex items-center gap-3 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl border card-border shadow-level-2 animate-[bounce_5s_infinite] z-20">
            <div className="w-8 h-8 rounded-full bg-mint/20 text-brand-teal flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">location_on</span>
            </div>
            <div className="text-left font-sans">
              <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">Geofence Status</p>
              <p className="text-xs text-navy font-bold">Inside Office Radius</p>
            </div>
          </div>
        </m.div>
      </section>
    </LazyMotion>
  );
}

