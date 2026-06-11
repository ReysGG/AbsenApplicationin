import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-[#011C16] w-full py-16 border-t border-emerald-500/10 text-white font-sans">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-mint text-navy flex items-center justify-center font-bold text-base">A</div>
            <span className="font-headline-sm text-headline-sm font-bold text-white">Absen.ai</span>
          </div>
          <p className="text-white/70 font-body-sm text-body-sm max-w-sm mb-6">
            Solusi absensi digital berbasis AI terdepan untuk efisiensi operasional dan akurasi data kehadiran karyawan Anda.
          </p>
          <div className="text-white/40 font-body-sm text-body-sm">
            © 2026 Absen.ai (PT Inovasi Kerja Digital). Seluruh hak cipta dilindungi.
          </div>
        </div>
        <div>
          <h4 className="font-label-md text-label-md text-white mb-4 uppercase tracking-wider font-semibold">Tautan Penting</h4>
          <ul className="space-y-3">
            <li><a className="text-white/70 hover:text-mint transition-colors" href="#hero">Beranda</a></li>
            <li><a className="text-white/70 hover:text-mint transition-colors" href="#fitur">Fitur Utama</a></li>
            <li><a className="text-white/70 hover:text-mint transition-colors" href="#alur">Alur Kerja</a></li>
            <li><a className="text-white/70 hover:text-mint transition-colors" href="#harga">Paket Harga</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-label-md text-label-md text-white mb-4 uppercase tracking-wider font-semibold">Legal &amp; Kontak</h4>
          <ul className="space-y-3">
            <li><a className="text-white/70 hover:text-mint transition-colors" href="#faq">Pertanyaan (FAQ)</a></li>
            <li><a className="text-white/70 hover:text-mint transition-colors" href="#">Kebijakan Privasi</a></li>
            <li><a className="text-white/70 hover:text-mint transition-colors" href="#">Ketentuan Layanan</a></li>
            <li><a className="text-white/70 hover:text-mint transition-colors" href="#">Hubungi Kami</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
