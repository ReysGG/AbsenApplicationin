import React from 'react';
import { Marquee } from '@/components/ui/marquee';

const testimonialsRow1 = [
  {
    name: "Rian Hidayat",
    role: "HR Director",
    company: "PT Global Techindo",
    text: "Absen.ai memotong waktu rekap absen bulanan kami dari 4 hari menjadi hanya 15 menit saja! Geofencing-nya sangat akurat.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces"
  },
  {
    name: "Siti Rahma",
    role: "Operations Manager",
    company: "Lestari Group",
    text: "Sangat terbantu untuk memantau kehadiran staf outlet kami di berbagai daerah secara real-time. Tidak ada lagi titip absen.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces"
  },
  {
    name: "Budi Santoso",
    role: "Head of HR",
    company: "IndoMakmur Jaya",
    text: "Face recognition-nya sangat responsif, bahkan dalam kondisi cahaya temaram. Dashboard rekapnya pun sangat rapi.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces"
  }
];

const testimonialsRow2 = [
  {
    name: "Diana Lestari",
    role: "CEO",
    company: "Creative Studio",
    text: "Sebelumnya kami kewalahan melacak jam kerja tim remote, namun dengan fitur clock-in GPS, semua jadi lebih transparan.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=faces"
  },
  {
    name: "Eko Prasetyo",
    role: "HR Specialist",
    company: "Logistik Nusantara",
    text: "Aplikasi mobile-nya sangat ringan dan mudah digunakan oleh supir pengiriman di lapangan untuk absensi check-in.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces"
  },
  {
    name: "Amanda Putri",
    role: "VP of People",
    company: "Fintech Prima",
    text: "Proses onboarding sangat mudah, dan dukungan CS-nya sangat responsif membantu sinkronisasi data jadwal shift kami.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=faces"
  }
];

function TestimonialCard({ name, role, company, text, avatar, rating }: typeof testimonialsRow1[0]) {
  return (
    <div className="w-[350px] bg-white border card-border rounded-2xl p-6 shadow-level-1 hover:shadow-level-2 transition-all shrink-0 flex flex-col justify-between font-sans">
      <p className="text-on-surface-variant font-body-sm text-body-sm italic mb-6">
        &ldquo;{text}&rdquo;
      </p>
      <div className="flex items-center gap-3">
        <img
          src={avatar}
          alt={name}
          className="w-11 h-11 rounded-full object-cover border border-[#E2E8F0]"
        />
        <div>
          <h4 className="font-semibold text-navy text-label-md font-sans">{name}</h4>
          <p className="text-on-surface-variant text-label-xs font-sans">{role}, {company}</p>
        </div>
      </div>
    </div>
  );
}

export default function Testimonials() {
  return (
    <section className="py-20 overflow-hidden bg-surface-container-low" id="testimoni">
      <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto text-center mb-16">
        <h2 className="font-headline-lg text-headline-lg text-navy mb-4">Apa Kata Pelanggan Kami?</h2>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mx-auto font-sans">
          Mendengarkan kisah sukses perusahaan yang berhasil mendigitalisasi operasional HRD bersama kami.
        </p>
      </div>

      <div className="flex flex-col gap-6 w-full">
        {/* Row 1 */}
        <Marquee className="[--duration:20s]" pauseOnHover>
          {testimonialsRow1.map((item, idx) => (
            <TestimonialCard key={idx} {...item} />
          ))}
        </Marquee>

        {/* Row 2 */}
        <Marquee className="[--duration:20s]" reverse pauseOnHover>
          {testimonialsRow2.map((item, idx) => (
            <TestimonialCard key={idx} {...item} />
          ))}
        </Marquee>
      </div>
    </section>
  );
}
