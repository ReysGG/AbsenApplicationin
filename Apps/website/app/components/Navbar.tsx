"use client";

import Link from 'next/link';
import React from 'react';
import { ShinyButton } from '@/components/ui/shiny-button';
import { LazyMotion, m, domAnimation } from 'motion/react';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <LazyMotion features={domAnimation}>
      <m.nav 
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled 
            ? "bg-white/85 backdrop-blur-md border-b border-neutral-200/80 shadow-xs h-20" 
            : "bg-transparent border-b border-transparent h-24"
        }`}
      >
        <div className="flex justify-between items-center h-full px-margin-desktop max-w-container-max mx-auto w-full">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-navy flex items-center justify-center text-white font-bold text-lg">A</div>
            <span className="font-headline-sm text-headline-sm font-bold text-navy">Absen.ai</span>
          </div>
          <div className="hidden md:flex space-x-8 items-center">
            <a className="text-brand-teal font-bold hover:text-navy transition-colors duration-200" href="#hero">Beranda</a>
            <a className="text-neutral-600 hover:text-brand-teal transition-colors duration-200" href="#fitur">Fitur</a>
            <a className="text-neutral-600 hover:text-brand-teal transition-colors duration-200" href="#alur">Alur Kerja</a>
            <a className="text-neutral-600 hover:text-brand-teal transition-colors duration-200" href="#harga">Harga</a>
            <a className="text-neutral-600 hover:text-brand-teal transition-colors duration-200" href="#faq">FAQ</a>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <Link href="/sign-in" className="text-neutral-600 hover:text-brand-teal font-sans text-sm font-medium transition-colors">Masuk</Link>
            <Link href="/uji-coba" aria-label="Daftar akun gratis">
              <ShinyButton className="px-5 py-2.5 bg-navy text-white border-navy rounded-md text-sm font-semibold hover:bg-mint hover:text-navy transition-all duration-300">
                Coba Gratis
              </ShinyButton>
            </Link>
          </div>
          <button
            type="button"
            className="md:hidden flex items-center justify-center p-2 text-neutral-900"
            aria-label={mobileMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>
        {mobileMenuOpen && (
          <div id="mobile-navigation" className="md:hidden absolute left-0 right-0 top-full border-b border-neutral-200 bg-white px-margin-mobile py-5 shadow-lg">
            <nav aria-label="Navigasi utama" className="mx-auto flex max-w-container-max flex-col gap-1">
              {[
                ['#hero', 'Beranda'],
                ['#fitur', 'Fitur'],
                ['#alur', 'Alur Kerja'],
                ['#harga', 'Harga'],
                ['#faq', 'FAQ'],
              ].map(([href, label]) => (
                <a key={href} href={href} onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2.5 font-medium text-neutral-700 hover:bg-emerald-50 hover:text-brand-teal">
                  {label}
                </a>
              ))}
              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-neutral-100 pt-4">
                <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)} className="rounded-lg border border-neutral-200 px-3 py-2.5 text-center text-sm font-semibold text-neutral-700">
                  Masuk
                </Link>
                <Link href="/uji-coba" onClick={() => setMobileMenuOpen(false)} className="rounded-lg bg-navy px-3 py-2.5 text-center text-sm font-semibold text-white">
                  Uji Coba
                </Link>
              </div>
            </nav>
          </div>
        )}
      </m.nav>
    </LazyMotion>
  );
}

