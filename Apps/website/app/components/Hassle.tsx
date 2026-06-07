"use client";

import React, { useState } from 'react';
import { LazyMotion, m, domAnimation } from 'motion/react';
import { GridPattern } from '@/components/ui/grid-pattern';

interface HassleCardProps {
  icon: string;
  iconBg: string;
  title: string;
  desc: string;
  index: number;
}

function HassleCard({ icon, iconBg, title, desc, index }: HassleCardProps) {
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top } = e.currentTarget.getBoundingClientRect();
    setCoords({ x: e.clientX - left, y: e.clientY - top });
  };

  return (
    <m.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.15, 
        type: "spring", 
        stiffness: 100, 
        damping: 15 
      }}
      onMouseMove={handleMouseMove}
      className="group relative bg-white rounded-3xl p-8 shadow-xs border border-neutral-200/80 hover:border-emerald-500/30 hover:shadow-lg transition-all duration-500 flex flex-col items-center text-center overflow-hidden h-full cursor-default"
    >
      {/* Interactive Spotlight Effect */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100"
        style={{
          background: `radial-gradient(350px circle at ${coords.x}px ${coords.y}px, rgba(52,211,153,0.08), transparent 80%)`,
        }}
      />

      {/* Grid Pattern Backdrop */}
      <GridPattern
        width={32}
        height={32}
        className="absolute inset-0 h-full w-full stroke-neutral-200/30 [mask-image:radial-gradient(160px_circle_at_center,white,transparent)] group-hover:stroke-neutral-300/50 transition-colors duration-300"
      />

      {/* Premium Icon Container with Solid/Glow States */}
      <div className={`relative w-20 h-20 rounded-2xl flex items-center justify-center mb-8 shadow-xs transition-all duration-500 group-hover:scale-110 group-hover:shadow-md ${iconBg}`}>
        <span className="material-symbols-outlined text-4xl transform transition-transform duration-500 group-hover:rotate-12">{icon}</span>
      </div>

      {/* Copywriting */}
      <h3 className="font-headline-sm text-headline-sm text-navy mb-4 relative z-10 font-bold group-hover:text-emerald-950 transition-colors duration-300">
        {title}
      </h3>
      <p className="text-body-sm text-on-surface-variant font-sans relative z-10 leading-relaxed group-hover:text-on-surface transition-colors duration-300">
        {desc}
      </p>

      {/* Subtle corner light flare */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-tr-3xl" />
    </m.div>
  );
}

export default function Hassle() {
  const cards = [
    {
      icon: "report_problem",
      iconBg: "bg-red-50 text-red-500 border border-red-200/50 group-hover:bg-red-500 group-hover:text-white group-hover:border-red-500",
      title: "Kecurangan & Fraud",
      desc: "Karyawan menitipkan absensi kepada rekan kerja atau menggunakan aplikasi pihak ketiga untuk memalsukan lokasi GPS clock-in."
    },
    {
      icon: "hourglass_empty",
      iconBg: "bg-amber-50 text-amber-500 border border-amber-250 group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500",
      title: "Pemborosan Waktu HRD",
      desc: "Menghabiskan berjam-jam bahkan berhari-hari untuk merekap, mencocokkan, dan memvalidasi data absensi dari file spreadsheet yang berserakan."
    },
    {
      icon: "visibility_off",
      iconBg: "bg-emerald-50 text-emerald-600 border border-emerald-250 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600",
      title: "Minim Visibilitas Real-time",
      desc: "Manajemen tidak bisa memantau apakah tim lapangan atau karyawan yang bekerja dari rumah (WFH) benar-benar mulai bekerja tepat waktu."
    }
  ];

  return (
    <LazyMotion features={domAnimation}>
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-20 text-center" id="solusi">
        <m.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-16 max-w-3xl mx-auto"
        >
          <h2 className="font-headline-lg text-headline-lg text-navy mb-4">Melakukan Absensi Manual Itu Merepotkan</h2>
          <p className="text-body-md text-on-surface-variant font-sans">
            Banyak kendala klasik yang dihadapi divisi HRD dan pihak manajemen setiap bulannya akibat sistem kehadiran konvensional.
          </p>
        </m.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map((card, index) => (
            <HassleCard
              key={index}
              index={index}
              icon={card.icon}
              iconBg={card.iconBg}
              title={card.title}
              desc={card.desc}
            />
          ))}
        </div>
      </section>
    </LazyMotion>
  );
}
