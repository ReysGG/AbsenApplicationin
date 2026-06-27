"use client";

/**
 * app/uji-coba/page.tsx
 *
 * Public "uji coba" (trial) lead form (#15). Visitors leave their email and a
 * short message; the backend forwards it to the product owner's inbox via
 * Gmail SMTP, who then follows up by email.
 *
 * Posts to the public BFF route POST /api/public/trial-request (no session).
 */

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle2, Mail, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const trialSchema = z.object({
  name: z.string().min(2, "Nama wajib diisi"),
  email: z.string().email("Format email tidak valid"),
  company: z.string().optional(),
  message: z.string().max(2000).optional(),
});

type TrialValues = z.infer<typeof trialSchema>;

export default function TrialPage() {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TrialValues>({
    resolver: zodResolver(trialSchema),
    defaultValues: { name: "", email: "", company: "", message: "" },
  });

  async function onSubmit(values: TrialValues) {
    setSubmitting(true);
    setServerError(null);
    try {
      const res = await fetch("/api/public/trial-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success !== false) {
        setDone(true);
      } else {
        setServerError(
          json?.error?.message ?? "Gagal mengirim permintaan. Coba lagi.",
        );
      }
    } catch {
      setServerError("Gagal menghubungi server. Coba lagi nanti.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6"
        >
          <ArrowLeft size={16} /> Kembali ke beranda
        </Link>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
          {done ? (
            <div className="text-center space-y-3 py-6">
              <div className="mx-auto w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="text-emerald-600" size={28} />
              </div>
              <h1 className="text-xl font-bold text-slate-900">
                Permintaan terkirim!
              </h1>
              <p className="text-sm text-slate-500">
                Terima kasih. Tim kami akan menghubungi Anda melalui email yang
                Anda masukkan untuk mengatur uji coba aplikasi.
              </p>
              <Button asChild className="mt-2">
                <Link href="/">Selesai</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <Mail className="text-slate-500" size={20} />
                <h1 className="text-xl font-bold text-slate-900">
                  Ajukan Uji Coba
                </h1>
              </div>
              <p className="text-sm text-slate-500 mb-6">
                Masukkan email Anda dan tim pembuat aplikasi akan menghubungi
                Anda untuk demo & uji coba.
              </p>

              <form
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nama</Label>
                  <Input id="name" placeholder="Nama Anda" {...register("name")} />
                  {errors.name && (
                    <p role="alert" className="text-sm text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@perusahaan.com"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p role="alert" className="text-sm text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="company">Perusahaan (opsional)</Label>
                  <Input
                    id="company"
                    placeholder="Nama perusahaan"
                    {...register("company")}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="message">Pesan (opsional)</Label>
                  <textarea
                    id="message"
                    rows={4}
                    placeholder="Ceritakan kebutuhan Anda..."
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    {...register("message")}
                  />
                </div>

                {serverError && (
                  <p
                    role="alert"
                    className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2"
                  >
                    {serverError}
                  </p>
                )}

                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" /> Mengirim...
                    </>
                  ) : (
                    "Kirim Permintaan"
                  )}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
