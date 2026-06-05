"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { LazyMotion, m, domAnimation } from "motion/react";
import { Particles } from "@/components/ui/particles";
import { GridPattern } from "@/components/ui/grid-pattern";
import { Fingerprint, Loader2 } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    const result = await authClient.signUp.email({
      name,
      email,
      password,
      callbackURL: "/admin",
    });

    setPending(false);

    if (result.error) {
      setError(result.error.message || "Pendaftaran gagal. Coba lagi.");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  async function handleGoogleSignUp() {
    setError("");
    setPending(true);
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/admin",
      });
      if (result?.error) {
        setError(result.error.message || "Gagal masuk dengan Google.");
      }
    } catch (err: any) {
      setError(err?.message || "Terjadi kesalahan saat masuk dengan Google.");
    } finally {
      setPending(false);
    }
  }

  return (
    <LazyMotion features={domAnimation}>
      <main className="h-screen w-screen flex overflow-hidden bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans">
        {/* Left Panel: Animated Brand Display */}
        <section className="relative hidden md:flex md:w-1/2 lg:w-1/2 xl:w-[50%] h-full bg-neutral-950 text-white flex-col justify-between p-12 overflow-hidden select-none">
          {/* Visual Elements Background */}
          <div className="absolute inset-0 z-0">
            <GridPattern
              width={40}
              height={40}
              x={-1}
              y={-1}
              strokeDasharray="4 4"
              className="opacity-20 stroke-neutral-800 fill-neutral-800/10"
            />
            <Particles
              className="absolute inset-0"
              quantity={120}
              staticity={30}
              ease={60}
              size={0.6}
              color="#38bdf8"
            />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-sky-500/10 rounded-full blur-[100px] pointer-events-none" />
          </div>

          {/* Header */}
          <div className="relative z-10 flex items-center gap-2">
            <div className="relative w-6 h-6 flex items-center justify-center">
              <div className="absolute w-5 h-5 rounded-md border border-sky-400/50 rotate-6" />
              <div className="absolute w-4 h-4 rounded-md bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center -rotate-6 shadow-sm">
                <Fingerprint className="h-2.5 w-2.5 text-white" />
              </div>
            </div>
            <span className="font-bold text-sm tracking-wide bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
              Absen Pro
            </span>
          </div>

          {/* Centerpiece Branding */}
          <div className="relative z-10 my-auto flex flex-col items-center justify-center text-center">
            <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
              {/* Animated stroke outer square */}
              <m.div
                className="absolute w-20 h-20 rounded-2xl border border-sky-500/50 bg-sky-950/10 backdrop-blur-sm"
                initial={{ rotate: 0, scale: 0.9 }}
                animate={{ rotate: 360, scale: [0.9, 1.05, 0.9] }}
                transition={{
                  rotate: { duration: 25, ease: "linear", repeat: Infinity },
                  scale: { duration: 6, ease: "easeInOut", repeat: Infinity }
                }}
              />
              {/* Animated filled inner square */}
              <m.div
                className="absolute w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-[0_0_35px_rgba(56,189,248,0.3)]"
                initial={{ rotate: 0 }}
                animate={{ rotate: -360 }}
                transition={{
                  rotate: { duration: 30, ease: "linear", repeat: Infinity }
                }}
                whileHover={{ scale: 1.05 }}
              >
                <Fingerprint className="h-8 w-8 text-white stroke-[1.5]" />
              </m.div>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-b from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent mb-3 font-sans">
              Absen Application
            </h1>
            <p className="max-w-xs text-sm text-neutral-400 leading-relaxed font-normal">
              Satu akun terpadu untuk kemudahan kelola seluruh data kehadiran, shift kerja, dan rekapitulasi.
            </p>
          </div>

          {/* Quote / Subtext */}
          <div className="relative z-10 mt-auto flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-sky-400/80">
              Security Shielded
            </span>
            <span className="text-xs text-neutral-500">
              Powered by Better Auth & NextJS
            </span>
          </div>
        </section>

        {/* Right Panel: Form Display */}
        <section className="w-full md:w-1/2 lg:w-1/2 xl:w-[50%] h-full flex flex-col justify-between p-8 sm:p-12 md:p-16 lg:p-20 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 overflow-y-auto relative">
          
          {/* Mobile Header Branding (Hidden on Desktop) */}
          <div className="flex justify-between items-center w-full mb-8">
            <div className="flex items-center gap-2.5 md:hidden">
              <div className="relative w-8 h-8 flex items-center justify-center">
                <div className="absolute w-7 h-7 rounded-lg border border-sky-400/60 rotate-6" />
                <div className="absolute w-6 h-6 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-md -rotate-6">
                  <Fingerprint className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
              <span className="font-bold text-lg text-neutral-900 dark:text-white">Absen</span>
            </div>
            <div className="hidden md:block" />
          </div>

          {/* Form Content Block */}
          <div className="my-auto max-w-sm w-full mx-auto flex flex-col justify-center">
            
            {/* Titles */}
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                Buat akun admin
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Silakan daftarkan akun baru untuk mengelola panel absensi.
              </p>
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={pending}
              className="mt-6 inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-transparent bg-white dark:bg-neutral-900 text-sm font-medium text-neutral-700 dark:text-neutral-200 shadow-sm ring-1 shadow-black/5 ring-black/10 dark:ring-white/10 transition duration-150 hover:bg-neutral-50 dark:hover:bg-neutral-800 active:scale-[0.98] disabled:opacity-50"
            >
              {/* Official Google SVG */}
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.62-.62-1.07-1.37-1.07-2.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200 dark:border-neutral-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-neutral-50 dark:bg-neutral-950 px-3 text-neutral-400 dark:text-neutral-500 font-medium">
                  or
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 tracking-wide uppercase" htmlFor="name">
                  Nama
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  placeholder="Admin Perusahaan"
                  className="h-11 w-full rounded-lg border border-transparent bg-white dark:bg-neutral-900 px-3 text-sm text-neutral-800 dark:text-neutral-100 shadow-sm ring-1 shadow-black/5 ring-black/10 dark:ring-white/10 transition outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:ring-2 focus:ring-blue-500/40 focus:border-transparent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 tracking-wide uppercase" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="admin@perusahaan.com"
                  className="h-11 w-full rounded-lg border border-transparent bg-white dark:bg-neutral-900 px-3 text-sm text-neutral-800 dark:text-neutral-100 shadow-sm ring-1 shadow-black/5 ring-black/10 dark:ring-white/10 transition outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:ring-2 focus:ring-blue-500/40 focus:border-transparent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 tracking-wide uppercase" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Minimal 8 karakter"
                  className="h-11 w-full rounded-lg border border-transparent bg-white dark:bg-neutral-900 px-3 text-sm text-neutral-800 dark:text-neutral-100 shadow-sm ring-1 shadow-black/5 ring-black/10 dark:ring-white/10 transition outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:ring-2 focus:ring-blue-500/40 focus:border-transparent"
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 dark:border-red-950 bg-red-50 dark:bg-red-950/30 px-3 py-2.5 text-xs text-red-600 dark:text-red-400 animate-fadeIn">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={pending}
                className="mt-2 h-11 w-full cursor-pointer rounded-lg bg-gradient-to-b from-blue-500 to-blue-600 text-sm font-medium text-white shadow-[0_8px_24px_rgba(37,99,235,0.25)] hover:brightness-105 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <span>Daftar</span>
                )}
              </button>
            </form>

            {/* Bottom Redirect Link */}
            <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
              Sudah punya akun?{" "}
              <Link href="/sign-in" className="font-semibold text-neutral-800 dark:text-white hover:underline transition">
                Masuk
              </Link>
            </p>
          </div>

          {/* Footer */}
          <div className="w-full text-center text-[11px] text-neutral-400 dark:text-neutral-600 mt-8 flex justify-center gap-3">
            <span>© Absen App</span>
            <span>·</span>
            <Link href="#" className="hover:underline">Privacy</Link>
            <span>·</span>
            <Link href="#" className="hover:underline">Terms</Link>
          </div>

        </section>
      </main>
    </LazyMotion>
  );
}
