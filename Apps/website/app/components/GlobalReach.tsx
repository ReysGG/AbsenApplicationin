"use client";

import React, { useState, useEffect } from 'react';
import WorldMap from '@/components/ui/world-map';
import { LazyMotion, m, domAnimation } from 'motion/react';

interface Activity {
  city: string;
  name: string;
  time: string;
  status: string;
  flag: string;
}

const initialActivities: Activity[] = [
  { city: 'Jakarta', name: 'Rian Hidayat', time: '08:00 WIB', status: 'Hadir', flag: '🇮🇩' },
  { city: 'Singapore', name: 'Sarah Chen', time: '09:02 SGT', status: 'Hadir', flag: '🇸🇬' },
  { city: 'Tokyo', name: 'Kenji Sato', time: '10:15 JST', status: 'Hadir', flag: '🇯🇵' },
  { city: 'London', name: 'Emily Watson', time: '08:30 GMT', status: 'Hadir', flag: '🇬🇧' },
];

export default function GlobalReach() {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  
  // Simulate live clock-in activities from around the world
  useEffect(() => {
    const names = ['Michael Brown', 'Diana Putri', 'Yuki Tanaka', 'David Miller', 'Siti Aminah', 'James Wilson'];
    const cities = [
      { name: 'Sydney', flag: '🇦🇺', timeZone: 'AEST' },
      { name: 'Bandung', flag: '🇮🇩', timeZone: 'WIB' },
      { name: 'Surabaya', flag: '🇮🇩', timeZone: 'WIB' },
      { name: 'New York', flag: '🇺🇸', timeZone: 'EST' },
    ];

    const interval = setInterval(() => {
      const randomName = names[Math.floor(Math.random() * names.length)];
      const randomCity = cities[Math.floor(Math.random() * cities.length)];
      
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} ${randomCity.timeZone}`;

      const newActivity: Activity = {
        city: randomCity.name,
        name: randomName,
        time: timeStr,
        status: 'Hadir',
        flag: randomCity.flag,
      };

      setActivities(prev => [newActivity, ...prev.slice(0, 3)]);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-20 border-t border-neutral-200/50" id="koneksi-global">
      <div className="text-center mb-16 max-w-3xl mx-auto">
        <span className="bg-emerald-50 text-brand-teal font-label-xs text-label-xs font-bold px-3.5 py-1.5 rounded-full border border-emerald-200 uppercase tracking-wider font-sans">
          Multi-Branch Synchronization
        </span>
        <h2 className="font-headline-lg text-headline-lg text-navy mt-4 mb-4">
          Kelola Absensi Multi-Cabang &amp; Tim Remote Global
        </h2>
        <p className="text-body-md text-on-surface-variant font-sans">
          Hubungkan kantor cabang, gerai retail, dan karyawan WFH di seluruh dunia dalam satu koordinasi data absensi terpusat yang sinkron secara instan.
        </p>
      </div>

      <div className="bg-linear-to-br from-neutral-900 to-neutral-950 rounded-3xl p-8 border border-neutral-800 shadow-level-3 relative overflow-hidden">
        {/* Subtle grid decoration overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] bg-size-[20px_20px] pointer-events-none"></div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-center relative z-10">
          
          {/* Left panel: Info & Live Feed */}
          <div className="lg:col-span-1 flex flex-col justify-between h-full font-sans text-neutral-300">
            <div>
              <h3 className="text-white font-headline-sm text-headline-sm mb-3">Aktivitas Real-time</h3>
              <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
                Logs kehadiran karyawan dari berbagai wilayah yang terverifikasi dan masuk ke database pusat dalam hitungan milidetik.
              </p>
            </div>

            {/* Live activity feed list */}
            <div className="space-y-3">
              <LazyMotion features={domAnimation}>
                {activities.map((act, index) => (
                  <m.div 
                    key={`${act.name}-${index}`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="bg-neutral-800/50 border border-neutral-700/30 p-3 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{act.flag}</span>
                      <div>
                        <p className="text-xs font-bold text-white leading-tight">{act.name}</p>
                        <p className="text-[10px] text-neutral-400">{act.city} • {act.time}</p>
                      </div>
                    </div>
                    <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                      {act.status}
                    </span>
                  </m.div>
                ))}
              </LazyMotion>
            </div>
          </div>

          {/* Right panel: Dotted Map with connections */}
          <div className="lg:col-span-3 bg-neutral-950/40 rounded-2xl border border-neutral-800/40 p-4">
            <WorldMap
              theme="dark"
              lineColor="#34D399"
              dots={[
                {
                  start: { lat: -6.2088, lng: 106.8456, label: 'Jakarta' }, // Jakarta
                  end: { lat: 1.3521, lng: 103.8198, label: 'Singapore' }, // Singapore
                },
                {
                  start: { lat: -6.2088, lng: 106.8456, label: 'Jakarta' }, // Jakarta
                  end: { lat: 35.6762, lng: 139.6503, label: 'Tokyo' }, // Tokyo
                },
                {
                  start: { lat: -6.2088, lng: 106.8456, label: 'Jakarta' }, // Jakarta
                  end: { lat: 51.5074, lng: -0.1278, label: 'London' }, // London
                },
                {
                  start: { lat: -6.2088, lng: 106.8456, label: 'Jakarta' }, // Jakarta
                  end: { lat: -33.8688, lng: 151.2093, label: 'Sydney' }, // Sydney
                },
                {
                  start: { lat: -6.2088, lng: 106.8456, label: 'Jakarta' }, // Jakarta
                  end: { lat: 40.7128, lng: -74.0060, label: 'New York' }, // New York
                },
                {
                  start: { lat: -6.2088, lng: 106.8456, label: 'Jakarta' }, // Jakarta
                  end: { lat: -6.9175, lng: 107.6191, label: 'Bandung' }, // Bandung
                },
                {
                  start: { lat: -6.2088, lng: 106.8456, label: 'Jakarta' }, // Jakarta
                  end: { lat: -7.2575, lng: 112.7521, label: 'Surabaya' }, // Surabaya
                },
              ]}
            />
          </div>

        </div>
      </div>
    </section>
  );
}
