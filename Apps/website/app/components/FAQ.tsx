"use client";

import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { LazyMotion, m, domAnimation } from 'motion/react';

const faqItems = [
  {
    value: "item-1",
    question: "Apakah aplikasi Absen.ai membutuhkan perangkat mesin sidik jari (fingerprint)?",
    answer: "Tidak. Absen.ai sepenuhnya berbasis perangkat lunak (SaaS). Karyawan cukup menggunakan smartphone mereka untuk scan wajah & verifikasi lokasi GPS, sementara HRD mengelola semuanya lewat dashboard web."
  },
  {
    value: "item-2",
    question: "Bagaimana cara sistem mendeteksi kecurangan pemalsuan lokasi GPS (fake GPS)?",
    answer: "Absen.ai memiliki algoritma pendeteksi aplikasi mock location (fake GPS) pada perangkat Android/iOS. Jika sistem mendeteksi aplikasi pemalsu lokasi aktif, proses clock-in absensi akan otomatis ditolak oleh aplikasi."
  },
  {
    value: "item-3",
    question: "Apakah karyawan bisa berbohong menggunakan foto cetak untuk verifikasi wajah?",
    answer: "Sistem kami terintegrasi dengan teknologi AI Liveness Detection yang canggih. Sistem akan mendeteksi apakah yang di depan kamera adalah manusia hidup nyata (melalui analisa kedipan mata atau micro-movement) dan bukan foto cetak atau video di layar lain."
  },
  {
    value: "item-4",
    question: "Bagaimana jika kantor saya memiliki banyak cabang atau wilayah kerja mobile?",
    answer: "HRD dapat mengatur multi-geofence di web dashboard. Anda bisa mendaftarkan beberapa titik koordinat kantor cabang sekaligus, atau mengatur mode absensi 'Bebas' khusus untuk tim sales/lapangan dengan pelacakan titik koordinat clock-in."
  },
  {
    value: "item-5",
    question: "Bagaimana integrasi data absensi ini untuk perhitungan gaji (payroll)?",
    answer: "Data kehadiran terakumulasi secara otomatis setiap harinya. Pada akhir bulan, HRD dapat mengunduh laporan rekap absensi lengkap dalam format Excel yang siap diimpor langsung ke sistem payroll Anda."
  }
];

export default function FAQ() {
  return (
    <LazyMotion features={domAnimation}>
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-20" id="faq">
        
        {/* Section Header */}
        <m.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 max-w-3xl mx-auto"
        >
          <h2 className="font-headline-lg text-headline-lg text-navy mb-4">Pertanyaan yang Sering Diajukan</h2>
          <p className="font-body-md text-body-md text-on-surface-variant font-sans">
            Temukan jawaban atas pertanyaan umum seputar fitur, implementasi, dan keamanan sistem Absen.ai.
          </p>
        </m.div>

        <div className="max-w-3xl mx-auto font-sans">
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqItems.map((item, index) => (
              <m.div
                key={item.value}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <AccordionItem
                  value={item.value}
                  className="bg-white rounded-2xl border card-border px-6 py-2 shadow-level-1 hover:shadow-level-2 transition-all"
                >
                  <AccordionTrigger className="text-navy hover:text-brand-teal font-semibold font-sans text-sm md:text-base py-4 text-left border-none focus:outline-hidden">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-on-surface-variant font-sans text-sm pb-4 pt-1 leading-relaxed border-none">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              </m.div>
            ))}
          </Accordion>
        </div>
      </section>
    </LazyMotion>
  );
}

