"use client";

import React from 'react';
import { BorderBeam } from '@/components/ui/border-beam';
import { Particles } from '@/components/ui/particles';
import { LazyMotion, m, domAnimation } from 'motion/react';

export default function CTA() {
  return (
    <LazyMotion features={domAnimation}>
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-20">
        <m.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="relative bg-linear-to-br from-[#011C16] via-navy to-[#043E31] rounded-3xl p-12 md:p-20 overflow-hidden shadow-level-3 text-center border border-emerald-500/20"
        >
          <BorderBeam size={400} duration={8} colorFrom="#34D399" colorTo="#022C22" borderWidth={2} />
          
          {/* Background Radial Glow and Slow Mint Embers */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(52,211,153,0.12),transparent_70%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.02),transparent_40%)]"></div>
          <Particles className="absolute inset-0 z-0 opacity-60" quantity={25} color="#34D399" size={0.6} staticity={70} ease={80} refresh />
          
          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
            <h2 className="font-display-md text-display-md text-white tracking-tight leading-tight mb-6">
              Mulai Transformasi <span className="bg-linear-to-r from-mint via-secondary-fixed-dim to-mint bg-clip-text text-transparent">Digital Absensi</span> Karyawan Anda Hari Ini
            </h2>
            <p className="text-body-md text-white/80 font-sans mb-10 max-w-2xl">
              Bergabunglah dengan ratusan perusahaan lain yang telah memangkas biaya administrasi HRD dan meningkatkan produktivitas tim mereka.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center font-sans w-full sm:w-auto z-10">
              <button className="w-full sm:w-auto px-8 py-4 bg-mint text-navy hover:bg-white hover:text-navy rounded-xl text-sm font-semibold transition-all duration-300 shadow-level-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
                Coba Gratis 14 Hari
              </button>
              <button className="w-full sm:w-auto px-8 py-4 bg-transparent border border-white/20 hover:border-mint text-white rounded-xl text-sm font-semibold transition-all hover:bg-white/5 duration-300 cursor-pointer">
                Hubungi Tim Sales
              </button>
            </div>
            
            <div className="mt-8 text-white/60 font-sans text-xs flex flex-wrap gap-x-6 gap-y-2 justify-center">
              <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-mint text-sm">check_circle</span> Tanpa kartu kredit</span>
              <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-mint text-sm">check_circle</span> Setup cepat 5 menit</span>
              <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-mint text-sm">check_circle</span> Batalkan kapan saja</span>
            </div>
          </div>
        </m.div>
      </section>
    </LazyMotion>
  );
}
