"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { signIn } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  rememberMe: z.boolean(),
})

type LoginValues = z.infer<typeof loginSchema>

const GENERIC_LOGIN_ERROR = "Email atau password tidak valid"
const LOCKOUT_LOGIN_ERROR = "Terlalu banyak percobaan login. Coba lagi beberapa menit lagi."

type AuthEventResult = { ok: boolean; locked: boolean; message?: string }

async function postAuthEvent(
  event: "login-check" | "login-failed" | "login-event",
  email: string,
): Promise<AuthEventResult> {
  try {
    const res = await fetch(`/api/v1/auth/${event}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })

    if (res.status === 423) {
      const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null
      return { ok: false, locked: true, message: body?.error?.message ?? LOCKOUT_LOGIN_ERROR }
    }
    return { ok: res.ok, locked: false }
  } catch {
    // A failed telemetry event must not disclose infrastructure details.
    return { ok: true, locked: false }
  }
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawCallback = searchParams.get("callbackUrl") ?? ""
  const callbackUrl = rawCallback.startsWith("/") && !rawCallback.startsWith("//") && !rawCallback.includes(":")
    ? rawCallback
    : "/workspace/overview"

  const [serverError, setServerError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  })

  async function onSubmit(values: LoginValues) {
    setServerError(null)
    setPending(true)
    try {
      const lockoutCheck = await postAuthEvent("login-check", values.email)
      if (!lockoutCheck.ok) {
        setServerError(lockoutCheck.locked ? lockoutCheck.message ?? LOCKOUT_LOGIN_ERROR : GENERIC_LOGIN_ERROR)
        return
      }

      const result = await signIn.email({
        email: values.email,
        password: values.password,
        rememberMe: values.rememberMe,
        callbackURL: callbackUrl,
      })

      if (result?.error) {
        const failureRecord = await postAuthEvent("login-failed", values.email)
        setServerError(failureRecord.locked ? failureRecord.message ?? LOCKOUT_LOGIN_ERROR : GENERIC_LOGIN_ERROR)
        return
      }

      void postAuthEvent("login-event", values.email)
      router.push(callbackUrl)
      router.refresh()
    } catch {
      setServerError(GENERIC_LOGIN_ERROR)
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="w-full max-w-5xl overflow-hidden rounded-3xl border border-emerald-950/10 bg-white shadow-2xl shadow-emerald-950/10 lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-[#022c22] p-10 text-white lg:flex lg:flex-col">
        <div className="absolute -left-20 -top-16 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-12 h-72 w-72 rounded-full bg-teal-300/10 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-300 text-[#022c22] shadow-lg shadow-emerald-950/20">
            <Building2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <span className="text-lg font-semibold tracking-tight">AttendX</span>
        </div>

        <div className="relative my-auto py-16">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.18em] text-emerald-200">Workforce operations</p>
          <h1 className="max-w-md text-4xl font-semibold leading-tight tracking-tight">
            Kelola kehadiran dengan lebih jelas dan terpercaya.
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-emerald-50/75">
            Satu ruang kerja untuk memantau tim, mengelola jadwal, dan menjaga data absensi tetap akurat.
          </p>
          <ul className="mt-10 space-y-4 text-sm text-emerald-50/90">
            {[
              "Akses berbasis peran dan scope kerja",
              "Rekap kehadiran yang mudah ditindaklanjuti",
              "Data dan aktivitas tercatat secara aman",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center gap-2 text-xs text-emerald-100/65">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          Sesi dan akses Anda dilindungi.
        </div>
      </section>

      <section className="px-6 py-8 sm:px-10 sm:py-12">
        <div className="mx-auto max-w-sm">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#022c22] text-emerald-300">
              <Building2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-[#022c22]">AttendX</span>
          </div>

          <div className="mb-8">
            <p className="text-sm font-medium text-emerald-700">Portal organisasi</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Masuk ke akun Anda</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Gunakan email kerja dan kata sandi yang diberikan administrator perusahaan Anda.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700">Email kerja</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nama@perusahaan.com"
                  className="h-11 border-slate-200 bg-slate-50 pl-10 shadow-none focus-visible:bg-white focus-visible:ring-emerald-700"
                  aria-describedby={errors.email ? "email-error" : undefined}
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
              </div>
              {errors.email && <p id="email-error" role="alert" className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="password" className="text-slate-700">Kata sandi</Label>
                <Link href="/forgot-password" className="text-xs font-medium text-emerald-700 hover:text-emerald-900 hover:underline">
                  Lupa kata sandi?
                </Link>
              </div>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Masukkan kata sandi"
                  className="h-11 border-slate-200 bg-slate-50 px-10 shadow-none focus-visible:bg-white focus-visible:ring-emerald-700"
                  aria-describedby={errors.password ? "password-error" : undefined}
                  aria-invalid={!!errors.password}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p id="password-error" role="alert" className="text-sm text-destructive">{errors.password.message}</p>}
            </div>

            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-600">
              <input id="rememberMe" type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-emerald-700" {...register("rememberMe")} />
              Ingat perangkat ini selama 7 hari
            </label>

            {serverError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{serverError}</p>}

            <Button type="submit" className="h-11 w-full bg-[#022c22] text-white hover:bg-[#064e3b]" disabled={pending}>
              {pending ? <><Loader2 className="animate-spin" aria-hidden="true" /><span>Memproses...</span></> : <><span>Masuk ke dashboard</span><ArrowRight aria-hidden="true" /></>}
            </Button>
          </form>

          <div className="mt-8 border-t border-slate-100 pt-5 text-center text-xs leading-5 text-slate-500">
            Akun dibuat oleh administrator atau HR perusahaan Anda. Perlu akses baru? Hubungi administrator Anda.
          </div>
        </div>
      </section>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-[520px] w-full max-w-5xl rounded-3xl bg-white shadow-xl" />}>
      <LoginForm />
    </Suspense>
  )
}
