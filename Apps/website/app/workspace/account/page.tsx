"use client"

/**
 * app/workspace/account/page.tsx
 *
 * Halaman akun pengguna — profil + ganti password.
 *
 * - Menampilkan profil user yang sedang login (nama, email, role)
 * - Form ganti password: current password → new password → confirm
 * - Menggunakan better-auth `authClient.changePassword()` bila tersedia,
 *   fallback ke alur lupa password via `/forgot-password`
 * - Semua label dalam Bahasa Indonesia
 *
 * Requirements: 1.10, 19.4, 20.1
 */

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, CheckCircle2, User, Lock, Shield } from "lucide-react"
import Link from "next/link"

import { authClient, useSession } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// ── Zod schema ────────────────────────────────────────────────────────────────

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Password saat ini wajib diisi"),
    newPassword: z
      .string()
      .min(8, "Password baru minimal 8 karakter")
      .regex(/[A-Z]/, "Harus mengandung minimal 1 huruf besar")
      .regex(/[0-9]/, "Harus mengandung minimal 1 angka"),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  })

type ChangePasswordValues = z.infer<typeof changePasswordSchema>

// ── Role badge label ──────────────────────────────────────────────────────────

function getRoleBadgeLabel(roles?: string[]): string {
  if (!roles || roles.length === 0) return "Pengguna"
  if (roles.includes("stakeholder")) return "Stakeholder"
  if (roles.includes("support_admin")) return "Support Admin"
  return "Pengguna"
}

function getRoleBadgeColor(roles?: string[]): string {
  if (!roles) return "bg-gray-100 text-gray-700"
  if (roles.includes("stakeholder")) return "bg-emerald-100 text-emerald-700"
  if (roles.includes("support_admin")) return "bg-blue-100 text-blue-700"
  return "bg-gray-100 text-gray-700"
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AccountPage() {
  const { data: session, isPending: sessionLoading } = useSession()

  const [serverError, setServerError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  // Detect whether better-auth exposes changePassword
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hasChangePassword = typeof (authClient as any).changePassword === "function"

  async function onSubmit(values: ChangePasswordValues) {
    setServerError(null)
    setSuccessMessage(null)
    setSubmitting(true)

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (authClient as any).changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })

      if (result?.error) {
        const msg: string = result.error.message ?? ""
        if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("current")) {
          setServerError("Password saat ini tidak valid. Silakan coba lagi.")
        } else {
          setServerError("Gagal mengubah password. Silakan coba lagi.")
        }
        return
      }

      setSuccessMessage("Password berhasil diubah.")
      reset()
    } catch {
      setServerError("Gagal mengubah password. Silakan coba lagi.")
    } finally {
      setSubmitting(false)
    }
  }

  // Derive display data from session
  const user = session?.user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionAny = session as any
  const roles: string[] =
    sessionAny?.roles ??
    sessionAny?.user?.roles ??
    []

  const initials = user?.name
    ? user.name
        .split(" ")
        .slice(0, 2)
        .map((w: string) => w[0]?.toUpperCase() ?? "")
        .join("")
    : "?"

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Akun Saya</h1>
        <p className="text-sm text-gray-500 mt-1">
          Lihat informasi profil dan kelola keamanan akun Anda.
        </p>
      </div>

      {/* ── Profil card ────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User size={18} aria-hidden="true" className="text-gray-500" />
            Profil
          </CardTitle>
          <CardDescription>Informasi akun Anda (read-only).</CardDescription>
        </CardHeader>
        <CardContent>
          {sessionLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              <span>Memuat profil...</span>
            </div>
          ) : (
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div
                className="w-14 h-14 rounded-full bg-slate-700 flex items-center justify-center text-white text-xl font-bold shrink-0"
                aria-hidden="true"
              >
                {initials}
              </div>

              {/* Fields */}
              <div className="space-y-3 flex-1">
                {/* Nama Lengkap */}
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 uppercase tracking-wide">
                    Nama Lengkap
                  </Label>
                  <p className="text-sm font-medium text-gray-900">
                    {user?.name ?? "—"}
                  </p>
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 uppercase tracking-wide">
                    Email
                  </Label>
                  <p className="text-sm text-gray-900">{user?.email ?? "—"}</p>
                </div>

                {/* Role */}
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 uppercase tracking-wide">
                    Role
                  </Label>
                  <div>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${getRoleBadgeColor(roles)}`}
                    >
                      <Shield size={10} aria-hidden="true" />
                      {getRoleBadgeLabel(roles)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Ganti password card ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock size={18} aria-hidden="true" className="text-gray-500" />
            Ubah Password
          </CardTitle>
          <CardDescription>
            Gunakan password yang kuat dan unik untuk keamanan akun Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasChangePassword ? (
            /* ── Form ganti password (changePassword tersedia) ── */
            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="space-y-4"
              aria-label="Form ubah password"
            >
              {/* Password saat ini */}
              <div className="space-y-1.5">
                <Label htmlFor="currentPassword">Password Saat Ini</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-describedby={
                    errors.currentPassword ? "currentPassword-error" : undefined
                  }
                  aria-invalid={!!errors.currentPassword}
                  {...register("currentPassword")}
                />
                {errors.currentPassword && (
                  <p
                    id="currentPassword-error"
                    role="alert"
                    className="text-sm text-destructive"
                  >
                    {errors.currentPassword.message}
                  </p>
                )}
              </div>

              {/* Password baru */}
              <div className="space-y-1.5">
                <Label htmlFor="newPassword">Password Baru</Label>
                <Input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  aria-describedby={
                    errors.newPassword ? "newPassword-error" : "newPassword-hint"
                  }
                  aria-invalid={!!errors.newPassword}
                  {...register("newPassword")}
                />
                <p id="newPassword-hint" className="text-xs text-gray-500">
                  Minimal 8 karakter, 1 huruf besar, dan 1 angka.
                </p>
                {errors.newPassword && (
                  <p
                    id="newPassword-error"
                    role="alert"
                    className="text-sm text-destructive"
                  >
                    {errors.newPassword.message}
                  </p>
                )}
              </div>

              {/* Konfirmasi password */}
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  aria-describedby={
                    errors.confirmPassword ? "confirmPassword-error" : undefined
                  }
                  aria-invalid={!!errors.confirmPassword}
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <p
                    id="confirmPassword-error"
                    role="alert"
                    className="text-sm text-destructive"
                  >
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Server error */}
              {serverError && (
                <p role="alert" className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                  {serverError}
                </p>
              )}

              {/* Success */}
              {successMessage && (
                <p
                  role="status"
                  className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-md px-3 py-2"
                >
                  <CheckCircle2 size={15} aria-hidden="true" />
                  {successMessage}
                </p>
              )}

              <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden="true" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  "Simpan Password Baru"
                )}
              </Button>
            </form>
          ) : (
            /* ── Fallback: link ke forgot-password ── */
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Untuk mengubah password, klik tautan di bawah ini. Kami akan mengirimkan
                email dengan instruksi reset password.
              </p>
              <Button asChild variant="outline">
                <Link href="/forgot-password">
                  Kirim Email Reset Password
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
