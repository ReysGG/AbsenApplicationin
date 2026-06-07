import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "AttendX — Masuk",
}

/**
 * Layout untuk halaman auth: login, forgot-password, reset-password.
 * Tidak ada sidebar/header — hanya full-screen centered card.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {children}
    </div>
  )
}
