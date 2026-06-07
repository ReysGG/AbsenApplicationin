"use client";

import React, { useState, useEffect } from 'react';
import { LazyMotion, m, domAnimation } from 'motion/react';
import { ShineBorder } from '@/components/ui/shine-border';

export default function Features() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  // --- 1. Card 1: Retail & Franchise (F&B) Shift & Outlet Registry ---
  const [selectedOutlet, setSelectedOutlet] = useState('Surabaya Main');
  const [selectedShift, setSelectedShift] = useState('Shift Pagi (08:00 - 17:00)');
  const [staffName, setStaffName] = useState('');
  const [retailState, setRetailState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [registeredStaff, setRegisteredStaff] = useState<string[]>([]);

  const handleRegisterStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName) return;
    setRetailState('loading');
    setTimeout(() => {
      setRegisteredStaff(prev => [staffName, ...prev]);
      setRetailState('success');
    }, 1200);
  };

  const handleResetRetail = () => {
    setStaffName('');
    setRetailState('idle');
  };

  // --- 2. Card 3: Korporat & Kantor Pusat SAP/ERP Sync Logs ---
  const [corpLogs, setCorpLogs] = useState<Array<{ text: string; type: 'success' | 'info' | 'system' }>>([
    { text: '[SYS] Tablet lobby online. Sensor biometrik aktif.', type: 'system' },
    { text: '[SYNC] Sync SAP/ERP Payroll: Connected (200 OK)', type: 'system' },
    { text: '[OK] Dwi K. Check-in via Tablet Lobi HQ (08:02)', type: 'success' },
    { text: '[INFO] Lembur otomatis dikalkulasi ke payroll database.', type: 'info' }
  ]);

  useEffect(() => {
    const mockLogs: Array<{ text: string; type: 'success' | 'info' | 'system' }> = [
      { text: '[OK] Haris S. Check-in via Lobi Branch-02 (08:05)', type: 'success' },
      { text: '[SYNC] Webhook terkirim: Data absensi disinkronkan ke cloud.', type: 'system' },
      { text: '[OK] Rina W. Check-in via Tablet Lobi Gedung A (08:12)', type: 'success' },
      { text: '[INFO] Laporan bulanan SAP ERP selesai diekspor.', type: 'info' }
    ];

    const interval = setInterval(() => {
      const randomLog = mockLogs[Math.floor(Math.random() * mockLogs.length)];
      setCorpLogs(prev => [...prev.slice(1), randomLog]);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  return (
    <LazyMotion features={domAnimation}>
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-24" id="fitur">
        {/* Self-contained CSS keyframes for scan line animation */}
        <style>{`
          @keyframes scanline {
            0%, 100% { top: 4%; }
            50% { top: 96%; }
          }
          .animate-scanline {
            animation: scanline 2.5s ease-in-out infinite;
          }
        `}</style>

        <div className="relative font-sans">
          
          {/* Section Header */}
          <m.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="mb-16 max-w-3xl relative z-10"
          >
            <span className="bg-emerald-50 text-brand-teal font-label-xs text-label-xs font-bold px-3 py-1 rounded-full border border-emerald-200/40 uppercase tracking-wider mb-3.5 inline-block">
              Target Solusi Bisnis
            </span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-navy mb-4">
              Didesain untuk Berbagai Kebutuhan Bisnis
            </h2>
            <p className="text-on-surface-variant text-sm md:text-base leading-relaxed">
              Mulai dari retail dengan ratusan cabang hingga perusahaan startup berbasis WFH, Absen.ai menyesuaikan dengan alur kerja operasional Anda.
            </p>
          </m.div>

          {/* Bento Grid (3 Columns Layout matching Photo 2, now in Light Theme) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16 relative z-10">
            
            {/* Card 1: Retail & Franchise (F&B) Shift & Outlet Registry */}
            <m.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: 0.1, type: "spring", stiffness: 80, damping: 15 }}
              className="bg-white border border-neutral-200/80 rounded-2xl p-6 flex flex-col justify-between h-[540px] shadow-xs hover:shadow-sm transition-shadow relative overflow-hidden"
              onMouseEnter={() => setHoveredCard(1)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {hoveredCard === 1 && (
                <ShineBorder borderWidth={1.5} shineColor={["#34D399", "#10B981", "#047857"]} duration={6} />
              )}
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-brand-teal mb-2 block">
                  Multi-Outlet &amp; Shift
                </span>
                <h3 className="text-lg font-bold text-navy mb-2">Retail &amp; Franchise (F&B)</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed mb-6">
                  Pantau kehadiran karyawan di puluhan outlet berbeda secara real-time. Kelola rotasi shift yang rumit dan pastikan staf toko absen tepat di lokasi kerja.
                </p>
              </div>

              {/* Interactive Shift Registry Mockup */}
              <div className="bg-neutral-50 border border-neutral-200/70 rounded-xl p-5 flex-1 flex flex-col justify-between text-neutral-700 font-sans relative overflow-hidden">
                {retailState === 'success' ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-4 animate-fadeIn">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-brand-teal flex items-center justify-center mb-3 border border-emerald-500/20">
                      <span className="material-symbols-outlined">storefront</span>
                    </div>
                    <h4 className="text-sm font-bold text-navy">Staf Berhasil Didaftarkan!</h4>
                    <p className="text-[10px] text-neutral-500 mt-1 max-w-[200px]">
                      <strong>{registeredStaff[0]}</strong> ditugaskan di <strong>{selectedOutlet}</strong> untuk <strong>{selectedShift.split(' ')[0]}</strong>.
                    </p>
                    <button 
                      onClick={handleResetRetail}
                      className="mt-4 px-3 py-1.5 bg-neutral-200 hover:bg-brand-teal hover:text-white text-navy font-semibold text-[10px] rounded-lg transition cursor-pointer"
                    >
                      Daftar Jadwal Lain
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleRegisterStaff} className="space-y-3">
                    <div className="flex items-center gap-1.5 border-b border-neutral-200 pb-2">
                      <span className="material-symbols-outlined text-brand-teal text-sm">schedule</span>
                      <span className="text-xs font-bold text-navy">Roster Manager</span>
                    </div>
                    
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-neutral-500 font-bold block mb-1">Pilih Outlet</label>
                      <select 
                        value={selectedOutlet}
                        onChange={(e) => setSelectedOutlet(e.target.value)}
                        className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs text-navy focus:outline-hidden focus:border-brand-teal/50 transition-all font-sans"
                      >
                        <option value="Surabaya Main">Surabaya Main Outlet</option>
                        <option value="Jakarta Mall">Jakarta Mall Hub</option>
                        <option value="Bandung Cafe">Bandung Cafe Store</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-neutral-500 font-bold block mb-1">Rotasi Shift</label>
                      <select 
                        value={selectedShift}
                        onChange={(e) => setSelectedShift(e.target.value)}
                        className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs text-navy focus:outline-hidden focus:border-brand-teal/50 transition-all font-sans"
                      >
                        <option value="Shift Pagi (08:00 - 17:00)">Shift Pagi (08:00 - 17:00)</option>
                        <option value="Shift Siang (12:00 - 21:00)">Shift Siang (12:00 - 21:00)</option>
                        <option value="Shift Malam (21:00 - 06:00)">Shift Malam (21:00 - 06:00)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-neutral-500 font-bold block mb-1">Nama Karyawan</label>
                      <input 
                        type="text" 
                        placeholder="Contoh: Rian Hidayat"
                        value={staffName}
                        onChange={(e) => setStaffName(e.target.value)}
                        required
                        className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs text-navy focus:outline-hidden focus:border-brand-teal/50 transition-all font-sans"
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={retailState === 'loading'}
                      className="w-full py-2 bg-brand-teal hover:bg-brand-teal/90 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                    >
                      {retailState === 'loading' ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent animate-spin rounded-full"></span>
                          Menyimpan...
                        </>
                      ) : (
                        'Tugaskan ke Outlet'
                      )}
                    </button>
                  </form>
                )}

                {/* Status indicator matches original UseCases card */}
                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 mt-4 border-t border-neutral-200 pt-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Outlet Surabaya (Main)</span>
                  </div>
                  <span className="font-bold text-navy">12 Kehadiran Aktif</span>
                </div>
              </div>
            </m.div>

            {/* Card 2: Stacked Cards (Logistics HP Mockup Map & WFH House) */}
            <m.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: 0.25, type: "spring", stiffness: 80, damping: 15 }}
              className="flex flex-col gap-6 h-[540px]"
            >
              
              {/* Top Stacked Card: Logistik & Sales Lapangan Phone Mockup Map */}
              <div 
                className="bg-white border border-neutral-200/80 rounded-2xl p-5 flex justify-between items-center h-[257px] relative overflow-hidden shadow-xs hover:shadow-sm transition-shadow"
                onMouseEnter={() => setHoveredCard(2)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {hoveredCard === 2 && (
                  <ShineBorder borderWidth={1.5} shineColor={["#34D399", "#10B981", "#047857"]} duration={6} />
                )}
                
                {/* Left Side: Copywriting */}
                <div className="w-[53%] flex flex-col justify-between h-full">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-brand-teal mb-1 block">
                      GPS Route Matching
                    </span>
                    <h3 className="text-sm font-bold text-navy mb-1 leading-tight">Logistik &amp; Sales Lapangan</h3>
                    <p className="text-[10px] text-on-surface-variant leading-relaxed">
                      Lacak rute absensi kurir/sales. Validasi GPS clock-in secara otomatis untuk mencegah manipulasi rute kunjungan lapangan.
                    </p>
                  </div>

                  {/* Status indicator matches original UseCases card */}
                  <div className="bg-emerald-50 border border-emerald-100 p-1.5 rounded-lg text-[8px] font-mono text-neutral-600 flex flex-col gap-0.5">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[9px] text-brand-teal">navigation</span>
                      <span>Toko Jaya Surabaya</span>
                    </div>
                    <span className="text-emerald-650 font-bold">● Rute Sesuai</span>
                  </div>
                </div>

                {/* Right Side: Phone Mockup with Premium Vector Map */}
                <div className="w-[43%] h-full flex items-center justify-center">
                  <div className="relative w-[115px] h-[215px] bg-neutral-900 rounded-2xl p-1.5 border-3 border-neutral-800 shadow-md overflow-hidden">
                    
                    {/* Phone Notch/Speaker */}
                    <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-8 h-2 rounded-full bg-neutral-900 z-30 flex items-center justify-center">
                      <div className="w-3 h-px bg-neutral-800 rounded-full"></div>
                    </div>

                    {/* Custom Premium Vector Map Screen */}
                    <div className="w-full h-full rounded-xl overflow-hidden bg-slate-50 relative border border-neutral-800/40 select-none">
                      
                      {/* Decorative River/Water Block */}
                      <div className="absolute top-0 right-0 w-12 h-10 bg-blue-100/60 rounded-bl-full border-l border-b border-blue-200/40"></div>
                      
                      {/* Decorative Park Block */}
                      <div className="absolute bottom-4 left-2 w-8 h-8 bg-emerald-50/60 rounded-lg border border-emerald-100/40"></div>
                      
                      {/* Grid of streets */}
                      {/* Horizontal Street 1 */}
                      <div className="absolute top-7 left-0 right-0 h-3.5 bg-white border-y border-slate-100 flex items-center px-1 text-[3.5px] text-slate-400 font-bold tracking-wide">
                        Jl. Raya Surabaya
                      </div>
                      {/* Horizontal Street 2 */}
                      <div className="absolute bottom-7 left-0 right-0 h-3.5 bg-white border-y border-slate-100 flex items-center px-1 text-[3.5px] text-slate-400 font-bold tracking-wide">
                        Jl. Sudirman
                      </div>
                      {/* Vertical Street 1 */}
                      <div className="absolute top-0 bottom-0 left-4 w-3.5 bg-white border-x border-slate-100 flex items-center justify-center text-[3.5px] text-slate-400 font-bold tracking-wide [writing-mode:vertical-lr] rotate-180">
                        Jl. Darmo
                      </div>
                      {/* Vertical Street 2 */}
                      <div className="absolute top-0 bottom-0 right-6 w-3.5 bg-white border-x border-slate-100 flex items-center justify-center text-[3.5px] text-slate-400 font-bold tracking-wide [writing-mode:vertical-lr]">
                        Jl. Tunjungan
                      </div>

                      {/* Map Route line (Green path) */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 200">
                        <path d="M12 180 L12 90 L82 90 L82 28" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 2" />
                        
                        {/* Starting Pin */}
                        <circle cx="12" cy="180" r="2.5" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="0.8" />
                        
                        {/* Live Location pulse */}
                        <circle cx="12" cy="120" r="5" fill="#10B981" fillOpacity="0.3" />
                        <circle cx="12" cy="120" r="2" fill="#047857" />

                        {/* Destination Pin (Toko Jaya) */}
                        <path d="M82 22 C82 22 85 25 85 28 C85 31 82 35 82 35 C82 35 79 31 79 28 C79 25 82 22 82 22 Z" fill="#DC2626" />
                        <circle cx="82" cy="27" r="1" fill="#FFFFFF" />
                      </svg>

                      {/* Route Badge inside map */}
                      <div className="absolute top-1.5 left-1.5 bg-white/95 border border-slate-200 px-1 py-0.5 rounded shadow-3xs text-[4.5px] font-sans text-neutral-700 flex items-center gap-0.5">
                        <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping"></span>
                        <span className="font-bold">Rian H. (Active)</span>
                      </div>

                      {/* Target Destination Label */}
                      <div className="absolute top-14 right-0.5 bg-neutral-900/90 text-white px-1 py-0.5 rounded text-[3.5px] font-sans scale-90">
                        📍 Toko Jaya
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* Bottom Stacked Card: Kerja Remote (WFH) House Illustration */}
              <div 
                className="bg-white border border-neutral-200/80 rounded-2xl p-5 flex justify-between items-center h-[257px] relative overflow-hidden shadow-xs hover:shadow-sm transition-shadow"
                onMouseEnter={() => setHoveredCard(3)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {hoveredCard === 3 && (
                  <ShineBorder borderWidth={1.5} shineColor={["#34D399", "#10B981", "#047857"]} duration={6} />
                )}
                
                {/* Left Side: Copywriting */}
                <div className="w-[53%] flex flex-col justify-between h-full">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-brand-teal mb-1 block">
                      Biometric Security
                    </span>
                    <h3 className="text-sm font-bold text-navy mb-1 leading-tight">Kerja Remote (WFH)</h3>
                    <p className="text-[10px] text-on-surface-variant leading-relaxed">
                      Berikan fleksibilitas absensi aman bagi tim remote. Verifikasi wajah instan menjamin orang yang bekerja adalah karyawan Anda.
                    </p>
                  </div>

                  {/* Status indicator matches original UseCases card */}
                  <div className="bg-purple-50 border border-purple-100 p-1.5 rounded-lg text-[8px] font-mono text-neutral-600 flex flex-col gap-0.5">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[9px] text-purple-600">vpn_key</span>
                      <span>IP: 192.168.1.45</span>
                    </div>
                    <span className="text-purple-700 font-bold">● Encrypted Match</span>
                  </div>
                </div>

                {/* Right Side: WFH House Image */}
                <div className="w-[43%] h-full flex items-center justify-center">
                  <div className="w-[110px] h-[160px] relative rounded-xl border border-neutral-200 bg-white shadow-2xs overflow-hidden flex items-center justify-center p-0.5">
                    <img 
                      src="/wfh_home.png" 
                      alt="WFH Modern House Mockup" 
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <div className="absolute bottom-1 left-1 right-1 bg-white/90 border border-neutral-200 p-1 rounded text-[5px] font-mono text-neutral-700 text-center font-bold">
                      Rumah (WFH - Valid)
                    </div>
                  </div>
                </div>
              </div>

            </m.div>

            {/* Card 3: Tall Card - Korporat & Kantor Pusat Lobby Tablet Mockup */}
            <m.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: 0.4, type: "spring", stiffness: 80, damping: 15 }}
              className="bg-white border border-neutral-200/80 rounded-2xl p-6 flex flex-col justify-between h-[540px] shadow-xs hover:shadow-sm transition-shadow relative overflow-hidden"
              onMouseEnter={() => setHoveredCard(4)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {hoveredCard === 4 && (
                <ShineBorder borderWidth={1.5} shineColor={["#34D399", "#10B981", "#047857"]} duration={6} />
              )}
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-brand-teal mb-2 block">
                  API &amp; Webhook Ready
                </span>
                <h3 className="text-lg font-bold text-navy mb-2">Korporat &amp; Kantor Pusat</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed mb-6">
                  Hadirkan solusi check-in touchless menggunakan tablet absensi terpusat di lobi kantor. Integrasikan data absen langsung ke sistem payroll internal perusahaan.
                </p>
              </div>

              {/* Simulated Tablet Check-in Mockup */}
              <div className="bg-neutral-50 border border-neutral-200/70 rounded-xl p-5 flex-1 flex flex-col justify-between font-sans">
                
                {/* Silver Tablet Bezel */}
                <div className="relative mx-auto w-[220px] h-[160px] bg-slate-350 rounded-2xl p-2.5 shadow-md border border-slate-400 flex flex-col justify-between overflow-hidden">
                  {/* Camera Lens circle decoration */}
                  <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-slate-650 z-30"></div>

                  {/* White Screen Viewport */}
                  <div className="relative flex-1 bg-white rounded-lg border border-slate-200/50 p-2 flex flex-col justify-between overflow-hidden select-none">
                    
                    {/* Top Header of Screen */}
                    <div className="flex justify-between items-center text-[5px] text-slate-400 font-bold border-b border-slate-100 pb-1">
                      <span>ABSEN.AI LOBBY NODE-04</span>
                      <span className="text-brand-teal flex items-center gap-0.5">● WFO ACTIVE</span>
                    </div>

                    {/* Body: Scan Camera View on Left, Result Card on Right */}
                    <div className="flex gap-2.5 my-1.5 flex-1 items-center">
                      
                      {/* Simulated Camera Scanner Feed */}
                      <div className="w-[75px] bg-slate-50 border border-slate-200/80 rounded-md relative flex items-center justify-center overflow-hidden h-[75px]">
                        {/* Grid overlay */}
                        <div className="absolute inset-0 bg-[radial-gradient(#00000003_1px,transparent_1px)] bg-size-[6px_6px] pointer-events-none"></div>
                        
                        {/* Scan Reticle */}
                        <div className="w-11 h-11 rounded-full border border-brand-teal/40 flex items-center justify-center relative bg-white shadow-3xs">
                          {/* Glowing scanning laser bar */}
                          <div className="absolute left-0 right-0 h-[1.5px] bg-brand-teal shadow-[0_0_4px_rgba(4,120,87,0.6)] animate-scanline"></div>
                          <span className="material-symbols-outlined text-slate-300 text-xl">person</span>
                        </div>
                      </div>

                      {/* Result details */}
                      <div className="flex-1 flex flex-col justify-between h-[75px] text-[5.5px] text-slate-500 py-0.5 font-sans">
                        <div>
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold px-1 py-0.2 rounded text-[4.5px] inline-block uppercase">
                            Verified Match
                          </span>
                          <p className="font-bold text-navy text-[8px] mt-1 leading-tight">Andi Wijaya</p>
                          <p className="text-[5px] text-slate-400">ID: EMP-8804 • Staff HR</p>
                        </div>
                        <div className="space-y-0.5 border-t border-slate-100 pt-1 text-[5px]">
                          <p>Waktu: <strong>08:02:15 WIB</strong></p>
                          <p>Suhu: <strong>36.5 °C (Normal)</strong></p>
                        </div>
                      </div>
                    </div>

                    {/* Touchless tablet footer status bar */}
                    <div className="flex justify-between items-center text-[5px] text-slate-400 mt-1 border-t border-slate-100 pt-1 font-mono">
                      <span>LOBI UTAMA HQ JAKARTA</span>
                      <span className="text-brand-teal font-bold">SAP CONNECTED</span>
                    </div>
                  </div>
                </div>

                {/* Webhook Sync logs */}
                <div className="bg-slate-900 rounded-lg p-2.5 border border-slate-850 font-mono text-[7.5px] text-slate-300 mt-4 space-y-1 shadow-inner">
                  <div className="text-[7px] text-slate-500 font-semibold border-b border-slate-800 pb-1 flex justify-between uppercase">
                    <span>Webhook Sync Stream</span>
                    <span className="text-brand-teal">200 OK</span>
                  </div>
                  <div className="text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                    <span>[08:02:15] Webhook triggered: ID EMP-8804 (Andi W.)</span>
                  </div>
                  <div className="text-slate-450 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-slate-650"></span>
                    <span>[08:02:16] Sync SAP/ERP Payroll: Complete</span>
                  </div>
                </div>

                {/* Status indicator matches Card 1 exactly for symmetrical layout */}
                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 mt-4 border-t border-neutral-200 pt-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>SAP/ERP Integration</span>
                  </div>
                  <span className="font-bold text-navy">Connected (API 200)</span>
                </div>

              </div>
            </m.div>

          </div>

          {/* Bottom Highlights (Three columns, styled for Light Theme) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-neutral-200/80 relative z-10 font-sans">
            <m.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-20px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-brand-teal text-lg">bolt</span>
                <h4 className="text-sm font-bold text-navy">Sinkronisasi Kehadiran Instan</h4>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Catatan masuk dari aplikasi lapangan dan WhatsApp terunggah ke database cloud pusat hanya dalam waktu 0.2 detik.
              </p>
            </m.div>
            <m.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-20px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-brand-teal text-lg">bar_chart</span>
                <h4 className="text-sm font-bold text-navy">Laporan &amp; Analitik Terpadu</h4>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Pantau trend keterlambatan, frekuensi ketidakhadiran divisi, dan sisa jatah cuti karyawan lewat chart visual terperinci.
              </p>
            </m.div>
            <m.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-20px" }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-brand-teal text-lg">hub</span>
                <h4 className="text-sm font-bold text-navy">Integrasi API &amp; Webhook</h4>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Hubungkan Absen.ai dengan sistem ERP internal, HRIS populer, hingga bot pesan Telegram melalui REST API out-of-the-box.
              </p>
            </m.div>
          </div>

      </div>
    </section>
    </LazyMotion>
  );
}
