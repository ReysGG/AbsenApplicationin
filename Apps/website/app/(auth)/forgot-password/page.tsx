"use client"

/**
 * Halaman Forgot Password — AttendX Web Dashboard
 *
 * - Form dengan field email
 * - Loading state saat submit
 * - Success state: pesan generic (tidak mengkonfirmasi apakah email terdaftar)
 * - Error state: pesan generic yang sama
 *
 * Requirements: 1.9, 19.4, 19.6
 */

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowLeft, Loader2, MailCheck } from "lucide-react"

import { forgetPassword } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// ── Zod schema ────────────────────────────────────────────────────────────────
const forgotPasswordSchema = z.object({
  email: z.string().email("Format email tidak valid"),
})

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ForgotPasswordPage() {
  /**
   * Selalu tampilkan pesan sukses yang sama terlepas berhasil atau gagal
   * untuk menghindari user enumeration (req 1.9 — tidak konfirmasi email terdaftar).
   */
  const [submitted, setSubmitted] = useState(false)
  const [pending, setPending] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  async function onSubmit(values: ForgotPasswordValues) {
    setPending(true)

    try {
      // Fire-and-forget — we show the same message regardless of outcome
      await forgetPassword({
        email: values.email,
        redirectTo: "/reset-password",
      })
    } catch {
      // Swallow error — same generic response to prevent user enumeration
    } finally {
      setPending(false)
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="space-y-1 pb-4 text-center">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <MailCheck className="w-6 h-6 text-green-600" aria-hidden="true" />
            </div>
          </div>
          <CardTitle className="text-xl font-bold">Cek email Anda</CardTitle>
          <CardDescription>
            Link reset password telah dikirim ke email Anda. Silakan periksa kotak masuk
            (dan folder spam) dalam beberapa menit.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center pt-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary hover:underline underline-offset-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            Kembali ke halaman masuk
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm shadow-lg">
      <CardHeader className="space-y-1 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">AX</span>
          </div>
          <span className="text-sm font-semibold text-muted-foreground">AttendX</span>
        </div>
        <CardTitle className="text-2xl font-bold">Lupa Password</CardTitle>
        <CardDescription>
          Masukkan email Anda dan kami akan mengirimkan link untuk mereset password.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="admin@perusahaan.com"
              aria-describedby={errors.email ? "email-error" : undefined}
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            {errors.email && (
              <p id="email-error" role="alert" className="text-sm text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                <span>Mengirim...</span>
              </>
            ) : (
              "Kirim Link Reset"
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center pt-0">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary hover:underline underline-offset-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          Kembali ke halaman masuk
        </Link>
      </CardFooter>
    </Card>
  )
}
