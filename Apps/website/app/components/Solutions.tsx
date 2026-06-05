import React from 'react';

export default function Solutions() {
  return (
    <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-16" id="solusi">
      <div className="text-center mb-16">
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-4">Satu Sistem untuk Mengelola Kehadiran Karyawan</h2>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mx-auto font-sans">Solusi end-to-end yang menjembatani kebutuhan mobilitas karyawan dengan visibilitas manajemen.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Card 1 */}
        <div className="bg-white rounded-xl p-8 shadow-level-1 border card-border hover:-translate-y-1 transition-transform duration-300">
          <div className="w-14 h-14 rounded-md bg-surface-container flex items-center justify-center text-primary-container mb-6">
            <span className="material-symbols-outlined text-3xl">smartphone</span>
          </div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-3">Mobile App Karyawan</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-6 font-sans">Aplikasi intuitif untuk Check-in, pengajuan izin, dan melihat jadwal shift harian.</p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 font-label-sm text-label-sm"><span className="material-symbols-outlined text-secondary text-sm">done</span> Check-in instan</li>
            <li className="flex items-center gap-2 font-label-sm text-label-sm"><span className="material-symbols-outlined text-secondary text-sm">done</span> Pengajuan Cuti &amp; Izin</li>
          </ul>
        </div>
        
        {/* Card 2 */}
        <div className="bg-white rounded-xl p-8 shadow-level-1 border card-border hover:-translate-y-1 transition-transform duration-300">
          <div className="w-14 h-14 rounded-md bg-surface-container flex items-center justify-center text-primary-container mb-6">
            <span className="material-symbols-outlined text-3xl">dashboard</span>
          </div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-3">Dashboard Web HR</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-6 font-sans">Pusat kendali untuk monitoring real-time, laporan kehadiran komprehensif, dan manajemen role.</p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 font-label-sm text-label-sm"><span className="material-symbols-outlined text-secondary text-sm">done</span> Real-time Monitoring</li>
            <li className="flex items-center gap-2 font-label-sm text-label-sm"><span className="material-symbols-outlined text-secondary text-sm">done</span> Export Laporan Cepat</li>
          </ul>
        </div>
        
        {/* Card 3 */}
        <div className="bg-white rounded-xl p-8 shadow-level-1 border card-border hover:-translate-y-1 transition-transform duration-300">
          <div className="w-14 h-14 rounded-md bg-surface-container flex items-center justify-center text-primary-container mb-6">
            <span className="material-symbols-outlined text-3xl">shield_lock</span>
          </div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-3">Keamanan Berlapis</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-6 font-sans">Validasi ketat dengan Face Recognition, GPS tracking, dan proteksi anti-spoofing.</p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 font-label-sm text-label-sm"><span className="material-symbols-outlined text-secondary text-sm">done</span> Liveness Check</li>
            <li className="flex items-center gap-2 font-label-sm text-label-sm"><span className="material-symbols-outlined text-secondary text-sm">done</span> Validasi Lokasi Akurat</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
