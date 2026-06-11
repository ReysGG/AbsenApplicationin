"use client";

/**
 * app/(auth)/activate/page.tsx
 *
 * Halaman aktivasi akun karyawan.
 *
 * Flow:
 * 1. Baca token dari URL query param (?token=...).
 * 2. Tampilkan form set password (password + konfirmasi).
 * 3. POST ke backend /api/v1/employees/activate dengan token + password.
 * 4. Jika berhasil → redirect ke /login?activated=1.
 * 5. Jika token invalid/expired → tampilkan pesan error + link ke HR.
 *
 * Requirements: 2.5, 2.6, 2.7
 */

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, KeyRound, CheckCircle2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const activateSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password minimal 8 karakter")
      .regex(/[A-Z]/, "Password harus mengandung huruf kapital")
      .regex(/[0-9]/, "Password harus mengandung angka"),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });

type ActivateFormValues = z.infer<typeof activateSchema>;

// ---------------------------------------------------------------------------
// Inner component (uses useSearchParams — must be in Suspense)
// ---------------------------------------------------------------------------

function ActivatePageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ActivateFormValues>({
    resolver: zodResolver(activateSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  // Token missing — show early error
  if (!token) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle>Link Tidak Valid</CardTitle>
          <CardDescription>
            Token aktivasi tidak ditemukan di URL. Pastikan kamu membuka link
            yang dikirimkan melalui email undangan.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center">
          <p className="text-xs text-gray-500 text-center">
            Jika masalah berlanjut, hubungi HR atau admin workspace kamu.
          </p>
        </CardFooter>
      </Card>
    );
  }

  // Success state
  if (status === "success") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle>Akun Berhasil Diaktivasi</CardTitle>
          <CardDescription>
            Password kamu telah diatur. Sekarang kamu dapat masuk ke aplikasi
            menggunakan email dan password yang baru.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center">
          <Button onClick={() => router.push("/login?activated=1")} className="w-full">
            Masuk Sekarang
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Error state (expired/invalid token)
  if (status === "error") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle>Aktivasi Gagal</CardTitle>
          <CardDescription>
            {errorMessage ?? "Link aktivasi tidak valid atau sudah kedaluwarsa."}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-gray-500">
            Link aktivasi berlaku selama <strong>7 hari</strong>. Jika sudah
            kedaluwarsa, minta HR untuk mengirim ulang undangan.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-xs text-gray-400">
            Butuh bantuan? Hubungi HR atau admin workspace kamu.
          </p>
        </CardFooter>
      </Card>
    );
  }

  // ---------------------------------------------------------------------------
  // Form
  // ---------------------------------------------------------------------------

  async function onSubmit(values: ActivateFormValues) {
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/v1/employees/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: values.password }),
      });

      const json = await res.json();

      if (json.success) {
        setStatus("success");
      } else {
        const code = json.error?.code ?? "";
        if (code === "EXPIRED_TOKEN") {
          setErrorMessage(
            "Link aktivasi sudah kedaluwarsa (berlaku 7 hari). Minta HR untuk mengirim ulang undangan."
          );
        } else {
          setErrorMessage(json.error?.message ?? "Aktivasi gagal. Coba lagi.");
        }
        setStatus("error");
      }
    } catch {
      setErrorMessage("Terjadi kesalahan jaringan. Coba lagi nanti.");
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
          <KeyRound className="w-6 h-6 text-blue-600" />
        </div>
        <CardTitle>Aktivasi Akun</CardTitle>
        <CardDescription>
          Buat password untuk mengaktifkan akun kamu di AttendX.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="activate-password">Password Baru</Label>
            <Input
              id="activate-password"
              type="password"
              placeholder="Minimal 8 karakter"
              autoComplete="new-password"
              {...register("password")}
              aria-describedby="activate-password-error"
            />
            {errors.password && (
              <p
                id="activate-password-error"
                className="text-xs text-red-600"
                role="alert"
              >
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <Label htmlFor="activate-confirm">Konfirmasi Password</Label>
            <Input
              id="activate-confirm"
              type="password"
              placeholder="Ulangi password"
              autoComplete="new-password"
              {...register("confirmPassword")}
              aria-describedby="activate-confirm-error"
            />
            {errors.confirmPassword && (
              <p
                id="activate-confirm-error"
                className="text-xs text-red-600"
                role="alert"
              >
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <p className="text-xs text-gray-500">
            Password harus minimal 8 karakter, mengandung huruf kapital dan
            angka.
          </p>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Mengaktifkan...
              </>
            ) : (
              "Aktifkan Akun"
            )}
          </Button>
          <p className="text-xs text-gray-400 text-center">
            Sudah punya akun?{" "}
            <a href="/login" className="text-blue-600 hover:underline">
              Masuk
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Default export — wrapped in Suspense for useSearchParams
// ---------------------------------------------------------------------------

export default function ActivatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-64 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Memuat...</span>
        </div>
      }
    >
      <ActivatePageInner />
    </Suspense>
  );
}
