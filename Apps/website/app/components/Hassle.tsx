"use client";

import React from 'react';
import { LazyMotion, m, domAnimation } from 'motion/react';

export default function Hassle() {
  const cards = [
    {
      icon: "report_problem",
      iconBg: "bg-error-container text-error border border-error/20",
      title: "Kecurangan & Fraud",
      desc: "Karyawan menitipkan absensi kepada rekan kerja atau menggunakan aplikasi pihak ketiga untuk memalsukan lokasi GPS clock-in."
    },
    {
      icon: "hourglass_empty",
      iconBg: "bg-brand-teal/10 text-brand-teal border border-brand-teal/20",
      title: "Pemborosan Waktu HRD",
      desc: "Menghabiskan berjam-jam bahkan berhari-hari untuk merekap, mencocokkan, dan memvalidasi data absensi dari file spreadsheet yang berserakan."
    },
    {
      icon: "visibility_off",
      iconBg: "bg-mint/10 text-navy border border-mint/20",
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
            <m.div
              key={index}
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
              className="bg-white rounded-2xl p-8 shadow-level-1 border card-border hover:shadow-level-2 hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center"
            >
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-6 ${card.iconBg}`}>
                <span className="material-symbols-outlined text-3xl">{card.icon}</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-navy mb-3">{card.title}</h3>
              <p className="text-body-sm text-on-surface-variant font-sans">
                {card.desc}
              </p>
            </m.div>
          ))}
        </div>
      </section>
    </LazyMotion>
  );
}
