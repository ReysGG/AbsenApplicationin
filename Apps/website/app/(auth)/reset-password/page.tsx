"use client"

/**
 * Halaman Reset Password — AttendX Web Dashboard
 *
 * - Membaca `?token=` dari URL; jika tidak ada → redirect ke forgot-password
 * - Form: password baru + konfirmasi password
 * - Zod: min 8 karakter, kedua password harus sama
 * - Sukses → redirect ke /login?reset=success
 * - Gagal (token kedaluwarsa/invalid) → tampilkan error dengan link minta ulang
 *
 * Requirements: 1.10, 1.11, 19.4, 19.6
 */

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowLeft, Loader2 } from "lucide-react"

import { resetPassword } from "@/lib/auth-client"
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
const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string().min(8, "Password minimal 8 karakter"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  })

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

// ── Page ──────────────────────────────────────────────────────────────────────
// useSearchParams() requires a Suspense boundary for static prerendering.
function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [pending, setPending] = useState(false)
  const [tokenError, setTokenError] = useState(false)

  // Jika tidak ada token, langsung redirect ke forgot-password
  useEffect(() => {
    if (!token) {
      router.replace("/forgot-password")
    }
  }, [token, router])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
  })

  async function onSubmit(values: ResetPasswordValues) {
    if (!token) return

    setPending(true)
    setTokenError(false)

    try {
      const result = await resetPassword({
        newPassword: values.password,
        token,
      })

      if (result?.error) {
        // Token kedaluwarsa atau tidak valid (req 1.11)
        setTokenError(true)
        return
      }

      // Sukses → redirect ke login dengan parameter reset=success (req 1.10)
      router.push("/login?reset=success")
    } catch {
      setTokenError(true)
    } finally {
      setPending(false)
    }
  }

  // Jangan render form saat tidak ada token (akan di-redirect)
  if (!token) return null

  return (
    <Card className="w-full max-w-sm shadow-lg">
      <CardHeader className="space-y-1 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">AX</span>
          </div>
          <span className="text-sm font-semibold text-muted-foreground">AttendX</span>
        </div>
        <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
        <CardDescription>
          Masukkan password baru Anda di bawah ini.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Token error state (expired / invalid — req 1.11) */}
        {tokenError && (
          <div
            role="alert"
            className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            <p className="font-medium">Link reset password tidak valid atau telah kedaluwarsa.</p>
            <p className="mt-1 text-muted-foreground">
              Silakan{" "}
              <Link
                href="/forgot-password"
                className="text-primary font-medium hover:underline underline-offset-4"
              >
                minta link baru
              </Link>
              .
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {/* Password baru */}
          <div className="space-y-1.5">
            <Label htmlFor="password">Password Baru</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="Minimal 8 karakter"
              aria-describedby={errors.password ? "password-error" : undefined}
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            {errors.password && (
              <p id="password-error" role="alert" className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Konfirmasi password */}
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Ulangi password baru"
              aria-describedby={
                errors.confirmPassword ? "confirm-password-error" : undefined
              }
              aria-invalid={!!errors.confirmPassword}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p
                id="confirm-password-error"
                role="alert"
                className="text-sm text-destructive"
              >
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                <span>Menyimpan...</span>
              </>
            ) : (
              "Simpan Password Baru"
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Card className="w-full max-w-sm shadow-lg" />}>
      <ResetPasswordForm />
    </Suspense>
  )
}
