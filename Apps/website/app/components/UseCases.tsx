import React from 'react';

const industries = [
  {
    icon: 'storefront',
    title: 'Retail & Franchise (F&B)',
    desc: 'Pantau kehadiran karyawan di puluhan outlet berbeda secara real-time. Kelola rotasi shift yang rumit dan pastikan staf toko absen tepat di lokasi kerja.',
    accent: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    badge: 'Multi-Outlet & Shift'
  },
  {
    icon: 'local_shipping',
    title: 'Logistik & Sales Lapangan',
    desc: 'Lacak rute absensi tim kurir atau sales saat melakukan kunjungan lapangan. Validasi koordinat GPS clock-in secara otomatis untuk mencegah manipulasi rute.',
    accent: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    badge: 'GPS Route Matching'
  },
  {
    icon: 'home_work',
    title: 'Kerja Remote (WFH)',
    desc: 'Berikan fleksibilitas absensi aman bagi tim remote. Verifikasi biometrik wajah instan menjamin bahwa orang yang bekerja benar-benar karyawan Anda.',
    accent: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    badge: 'Biometric Security'
  },
  {
    icon: 'business',
    title: 'Korporat & Kantor Pusat',
    desc: 'Hadirkan solusi check-in touchless menggunakan tablet absensi terpusat di lobi kantor. Integrasikan data absen langsung ke sistem payroll internal perusahaan.',
    accent: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    badge: 'API & Webhook Ready'
  }
];

export default function UseCases() {
  return (
    <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-20 border-t border-neutral-200/50" id="solusi-industri">
      <div className="text-center mb-16 max-w-3xl mx-auto">
        <h2 className="font-headline-lg text-headline-lg text-navy mb-4">Didesain untuk Berbagai Kebutuhan Bisnis</h2>
        <p className="text-body-md text-on-surface-variant font-sans">
          Mulai dari retail dengan ratusan cabang hingga perusahaan startup berbasis WFH, Absen.ai menyesuaikan dengan alur kerja operasional Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-sans">
        {industries.map((item, index) => (
          <div 
            key={index} 
            className="group relative bg-white border card-border rounded-3xl p-8 hover:shadow-level-2 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${item.accent}`}>
                  <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                </div>
                <span className="text-[10px] font-bold tracking-wider uppercase bg-neutral-100 text-neutral-600 px-3 py-1 rounded-full border border-neutral-200">
                  {item.badge}
                </span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-navy mb-3 group-hover:text-brand-teal transition-colors">
                {item.title}
              </h3>
              <p className="text-on-surface-variant text-body-sm leading-relaxed mb-6">
                {item.desc}
              </p>
            </div>

            {/* Visual Micro-Simulation decoration */}
            <div className="bg-neutral-50 rounded-xl border card-border p-4 mt-2">
              {index === 0 && (
                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Outlet Surabaya (Main)</span>
                  </div>
                  <span className="font-bold text-navy">12 Aktif</span>
                </div>
              )}
              {index === 1 && (
                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-xs">navigation</span>
                    <span>Kunjungan Lapangan: Toko Jaya</span>
                  </div>
                  <span className="text-emerald-600 font-bold">Rute Sesuai</span>
                </div>
              )}
              {index === 2 && (
                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-xs">vpn_key</span>
                    <span>IP Address: 192.168.1.45</span>
                  </div>
                  <span className="text-purple-600 font-bold">Encrypted Match</span>
                </div>
              )}
              {index === 3 && (
                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-xs">sync_alt</span>
                    <span>SAP/ERP Sync Status</span>
                  </div>
                  <span className="text-amber-600 font-bold">Connected (API 200)</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
