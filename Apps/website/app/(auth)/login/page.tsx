"use client"

/**
 * Halaman Login — AttendX Web Dashboard
 *
 * - Form RHF + Zod (email, password, rememberMe)
 * - Error state bertekst (generic: "Email atau password tidak valid")
 * - Redirect ke callbackUrl setelah login (req 1.6)
 * - Remember me → session 7 hari (req 1.3–1.4)
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 19.4, 19.6
 */

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import { signIn } from "@/lib/auth-client"
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
const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  rememberMe: z.boolean(),
})

type LoginValues = z.infer<typeof loginSchema>

// ── Page ──────────────────────────────────────────────────────────────────────
// useSearchParams() requires a Suspense boundary for static prerendering in
// Next.js 16, so the form lives in a child component wrapped below.
function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // The page the user came from (e.g. from an expired session redirect).
  // Validate to prevent open redirect via protocol-relative URLs (//evil.com).
  const rawCallback = searchParams.get("callbackUrl") ?? ""
  const callbackUrl =
    rawCallback.startsWith("/") && !rawCallback.startsWith("//") && !rawCallback.includes(":")
      ? rawCallback
      : "/workspace/overview"

  // Generic server-level error (req 1.2 — don't reveal if email exists)
  const [serverError, setServerError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  })

  async function onSubmit(values: LoginValues) {
    setServerError(null)
    setPending(true)

    try {
      const result = await signIn.email({
        email: values.email,
        password: values.password,
        rememberMe: values.rememberMe,
        callbackURL: callbackUrl,
      })

      if (result?.error) {
        // Always show generic message — never reveal if the email exists (req 1.2)
        setServerError("Email atau password tidak valid")
        return
      }

      router.push(callbackUrl)
      router.refresh()
    } catch {
      setServerError("Email atau password tidak valid")
    } finally {
      setPending(false)
    }
  }

  return (
    <Card className="w-full max-w-sm shadow-lg">
      <CardHeader className="space-y-1 pb-4">
        {/* Brand mark */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">AX</span>
          </div>
          <span className="text-sm font-semibold text-muted-foreground">AttendX</span>
        </div>
        <CardTitle className="text-2xl font-bold">Masuk</CardTitle>
        <CardDescription>
          Masukkan email dan password untuk mengakses dashboard.
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

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
              >
                Lupa password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
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

          {/* Remember me */}
          <div className="flex items-center gap-2">
            <input
              id="rememberMe"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 accent-primary cursor-pointer"
              {...register("rememberMe")}
            />
            <Label htmlFor="rememberMe" className="cursor-pointer font-normal">
              Ingat saya selama 7 hari
            </Label>
          </div>

          {/* Server-level error (req 1.2 — generic message) */}
          {serverError && (
            <p role="alert" className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {serverError}
            </p>
          )}

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                <span>Memproses...</span>
              </>
            ) : (
              "Masuk"
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex-col gap-2 pt-0">
        <p className="text-xs text-muted-foreground text-center">
          Belum punya akun?{" "}
          <Link href="/sign-up" className="text-primary hover:underline font-medium">
            Daftar
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Card className="w-full max-w-sm shadow-lg" />}>
      <LoginForm />
    </Suspense>
  )
}
