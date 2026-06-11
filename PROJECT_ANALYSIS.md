# Dokumentasi Analisis Project: AttendX — Aplikasi Absensi Digital Karyawan

> Dokumen ini dipecah menjadi beberapa file karena ukurannya besar. Ini adalah **file utama (index)** yang berisi Ringkasan, Scope, dan Tech Stack. Bagian lain ada di file terpisah:
>
> | File | Isi |
> |------|-----|
> | **PROJECT_ANALYSIS.md** (file ini) | Bagian 1–3: Ringkasan, Tujuan & Scope, Tech Stack |
> | **[PROJECT_ANALYSIS_2_STRUKTUR.md](./PROJECT_ANALYSIS_2_STRUKTUR.md)** | Bagian 4–6: Struktur Folder, Route/Endpoint/Screen, Komponen & Module |
> | **[PROJECT_ANALYSIS_3_FITUR.md](./PROJECT_ANALYSIS_3_FITUR.md)** | Bagian 7–8: Fitur yang Sudah Ada, Fitur yang Belum Ada |
> | **[PROJECT_ANALYSIS_4_KUALITAS.md](./PROJECT_ANALYSIS_4_KUALITAS.md)** | Bagian 9–18: Kelebihan, Kekurangan, UI/UX, Backend, Database, Auth, Security, Performance, Code Quality, Testing |
> | **[PROJECT_ANALYSIS_5_ROADMAP.md](./PROJECT_ANALYSIS_5_ROADMAP.md)** | Bagian 19–25: Dokumentasi, Kesesuaian Produk, Rekomendasi Tambahan, Refactor, Roadmap, Kesimpulan |

**Tanggal analisis:** 10 Juni 2026
**Metode:** Pembacaan langsung source code (read-only) pada tiga aplikasi: Flutter mobile, Express backend, Next.js website. Klaim di dokumen ini diverifikasi terhadap kode aktual. Bila sesuatu tidak ditemukan, ditulis "Tidak ditemukan di project". Fitur yang hanya tampilan ditandai "UI only". Data palsu ditandai "Dummy/Mock".

---

## 1. Ringkasan Project

**AttendX** adalah sistem absensi digital karyawan berbasis SaaS multi-tenant. Sistem ini memverifikasi kehadiran karyawan melalui lokasi (GPS + geofence) dan wajah (face + liveness), ditujukan untuk perusahaan dengan model kerja modern: WFO, WFH, hybrid, multi-divisi, dan multi-cabang.

Project ini berupa **monorepo** (pnpm + turbo) yang berisi tiga aplikasi yang saling terhubung lewat satu backend dan satu database:

| Aplikasi | Stack | Untuk Siapa | Lokasi |
|----------|-------|-------------|--------|
| **Mobile** | Flutter | Karyawan (end user) — check-in/out, riwayat, izin, jadwal | `Apps/app_flutter` |
| **Website** | Next.js 16 + React 19 | HR / Admin (dashboard) | `Apps/website` |
| **Backend** | Express 5 + Prisma 7 + better-auth | API untuk web & mobile | `Apps/backend` |
| **Database** | PostgreSQL | — | container `db` (lokal) |

**Masalah yang ingin diselesaikan** (dari PRD):
1. Absensi manual rentan manipulasi waktu dan lokasi.
2. Rekap absensi bulanan oleh HR memakan waktu.
3. Sistem fingerprint tidak cocok untuk WFH/multi-cabang.
4. Data absensi tersebar di banyak sumber.
5. Sulit mengelola karyawan berdasarkan divisi, lokasi, shift, dan role.
6. Solusi SaaS komersial per-user sering terlalu mahal untuk SME/startup.

**Target pengguna:**
- **Platform level:** Super Admin, Admin Platform (tim internal pemilik platform).
- **Workspace level:** Stakeholder/Owner perusahaan, Support Admin/HR Admin, End User/Karyawan.

**Jenis project:** SaaS B2B multi-tenant — kombinasi **Mobile app** (karyawan), **Web dashboard** (HR/admin), dan **Backend REST API**. Bukan landing page atau library; ini produk fullstack lengkap.

**Nilai utama:** Memusatkan data absensi, jadwal, lokasi, dan laporan; menyediakan verifikasi anti-manipulasi (geofence + wajah); kontrol akses berbasis role + scope; serta laporan kehadiran yang bisa diekspor — dengan isolasi data antar-tenant.

**Penilaian kematangan singkat:** Backend dan Web dashboard HR sudah **nyata dan terintegrasi** (bukan mock). Yang masih lemah: **fitur "smart attendance" di mobile (wajah, GPS, offline sync) masih disimulasikan**, dan sebagian halaman admin platform di web masih **mock UI**. Detail per bagian ada di file lanjutan.

---

## 2. Tujuan dan Scope Project

### Tujuan utama (dari PRD Web Dashboard v1)
- Membantu HR memantau absensi secara real-time.
- Mengurangi pekerjaan rekap manual.
- Memusatkan data karyawan, jadwal shift, lokasi kerja, dan laporan.
- Memberikan kontrol akses berbasis role + scope.
- Menyediakan laporan kehadiran yang bisa diekspor (Excel/CSV).
- Mendukung WFO, WFH, multi-lokasi, multi-divisi.

### Fitur inti yang ingin disediakan
Authentication & role access, Overview dashboard, Live attendance, Workforce/Employee management, Locations + geofence, Shift management, Leave & permit approval, Reports + export, Settings, Audit log.

### Batasan scope saat ini

**In Scope (MVP v1 yang direkomendasikan PRD):**
1. Auth + Role Guard
2. Overview Dashboard
3. Workforce CRUD
4. Locations
5. Shifts
6. Live Attendance
7. Reports Export CSV/Excel
8. Basic Settings
9. Audit Log minimal

**Out of Scope v1 (ditunda):**
- Billing system (subscription, invoice, payment gateway)
- Support ticket platform
- Full Super Admin platform (monitoring global, revenue analytics)
- Payroll system
- Advanced attendance fraud AI / ML risk scoring
- Face recognition management di web (registrasi wajah tetap dari mobile)
- Offline attendance sync engine (di mobile + backend, dashboard hanya menampilkan status)
- PDF export (masuk v1.1)

### Fokus project
Project ini **fullstack penuh** (mobile + web + backend), namun fokus pengembangan paling matang ada di **backend** dan **web dashboard HR**. Mobile sudah punya kerangka lengkap tapi fitur sensor (kamera/GPS) masih simulasi. Lihat catatan penting:

> **Temuan kunci:** Beberapa fitur yang ada di scope PRD ternyata **sudah diimplementasikan melebihi rencana MVP** (mis. backend punya exports async, audit log lengkap, jobs background). Sebaliknya, beberapa fitur "smart" yang dijanjikan mobile (wajah, GPS asli, offline sync) **belum fungsional / masih disimulasikan**. Ini dibahas tuntas di bagian 7, 9, dan 10.

---

## 3. Tech Stack yang Digunakan

### 3.1 Mobile (Flutter) — `Apps/app_flutter`

| Area | Teknologi | Versi | Catatan |
|------|-----------|-------|---------|
| Framework | Flutter / Dart | SDK `^3.11.4` | Light theme only, tidak ada dark mode |
| State management | `flutter_riverpod` | ^2.5.1 | StateNotifier + FutureProvider, tanpa codegen |
| Routing | `go_router` | ^14.2.7 | Auth-aware redirect + StatefulShellRoute (bottom nav) |
| Networking | `dio` | ^5.7.0 | Interceptor token, retry 429, handle 401 |
| Secure storage | `flutter_secure_storage` | ^9.2.2 | Simpan access+refresh token (refresh tak dipakai) |
| Utility | `intl`, `equatable` | 0.20.2 / 2.0.5 | Format tanggal id_ID |
| Lint | `flutter_lints` | ^6.0.0 | Aturan default |
| **Kamera** | — | — | **Tidak ditemukan** — tidak ada package `camera` |
| **GPS** | — | — | **Tidak ditemukan** — tidak ada `geolocator` |
| **Face/ML** | — | — | **Tidak ditemukan** — tidak ada `google_mlkit_face_detection` |
| **Maps** | — | — | **Tidak ditemukan** — tidak ada `flutter_map` |
| **Offline DB** | — | — | **Tidak ditemukan** — tidak ada `sqflite`/`hive`/`drift` |
| **File picker** | — | — | **Tidak ditemukan** — upload lampiran palsu |

> Konsekuensi: fitur wajah, GPS, peta, offline sync, dan upload file di mobile **tidak mungkin nyata** karena package-nya memang tidak ada. Lihat bagian 7 & 9.

### 3.2 Website (Next.js) — `Apps/website`

| Area | Teknologi | Versi | Catatan |
|------|-----------|-------|---------|
| Framework | `next` | 16.2.7 | App Router, `output: standalone`, pakai `proxy.ts` (bukan `middleware.ts`) |
| UI runtime | `react` / `react-dom` | 19.2.4 | — |
| Auth | `better-auth` + prisma-adapter | ^1.4.0 | Session cookie, email/password |
| ORM | `prisma` / `@prisma/client` | ^7.0.0 | Hanya tabel auth (User/Session/Account/Verification) |
| DB driver | `pg` + `@prisma/adapter-pg` | 8.16.3 | — |
| Tabel | `@tanstack/react-table` | 8.21.3 | Live attendance, dll |
| Chart | `recharts` | 2.15.3 | Trend, breakdown |
| Form | `react-hook-form` + `zod` | 7.55 / 3.25 | Validasi form |
| UI kit | shadcn (radix-ui) + magicui | — | Dua sistem styling co-exist (gray/slate vs Material token) |
| Icons | `lucide-react` | ^1.17.0 | — |
| Animasi | `motion` (Framer) | ^12.40 | Banyak dipakai di landing/admin |
| Maps | `leaflet` + `dotted-map` | 1.9.4 | Map picker lokasi |
| Styling | `tailwindcss` v4 | ^4 | — |
| E2E test | `@playwright/test` | 1.52.0 | Chromium, test publik saja |
| State mgmt | — | — | **Tidak ada** Redux/Zustand; pakai `useState` + custom `useFetch` |
| Data fetching | — | — | **Tidak ada** SWR/React Query; hook `useFetch` malah jarang dipakai (tiap page reinvent fetch sendiri) |

### 3.3 Backend (Express) — `Apps/backend`

| Area | Teknologi | Versi | Catatan |
|------|-----------|-------|---------|
| Framework | `express` | 5.2.1 | Express 5 |
| ORM | `prisma` / `@prisma/client` | 7.0.0 | Wajib driver adapter `PrismaPg` |
| DB driver | `pg` | 8.16.3 | — |
| Auth | `better-auth` + prisma-adapter | ^1.6.14 | Bearer plugin untuk mobile, share tabel dgn web |
| Validation | `zod` | 3.25.64 | Schema per modul |
| Security | `helmet`, `cors`, `express-rate-limit` | 8.1.0 / 2.8.5 / 7.5.1 | — |
| Excel | `exceljs` | 4.4.0 | **Terpasang tapi TIDAK PERNAH di-import** — XLSX palsu (CSV berkedok) |
| Logger | `winston` | 3.19.0 | — |
| Mailer | custom `lib/mailer.ts` | — | Pakai Resend API |
| Storage | Supabase Storage | — | Untuk lampiran & file export |
| Testing | `vitest` + `supertest` | 4.1.8 / 7.2.2 | supertest terpasang tapi **tak ada test HTTP**; semua Prisma di-mock |
| Lint | — | — | **Tidak ada ESLint**; `lint` = `tsc --noEmit` saja |

### 3.4 Infrastruktur

| Area | Teknologi | Catatan |
|------|-----------|---------|
| Containerization | Docker + Docker Compose | Backend + Website + Postgres. Mobile TIDAK di-Docker (distribusi APK/IPA) |
| Database | PostgreSQL (container) | Port host 10002, internal 5432 |
| Monorepo | pnpm + turbo | `pnpm-workspace.yaml`, `turbo.json` |
| CI | GitHub Actions | `.github/workflows/ci.yml`, `react-doctor.yml` |
| Port mapping | Host 10000+ | Website 10000, Backend 10001, Postgres 10002 (hindari bentrok) |

**Dua jalur autentikasi ke backend yang sama:**
- **Website → BFF proxy** (`app/api/[[...path]]/route.ts`): validasi sesi better-auth, lalu tandatangani konteks user dengan HMAC (`INTERNAL_JWT_SECRET`), teruskan ke Express. Middleware `authenticate` memverifikasi tanda tangan.
- **Mobile → Bearer token** (`Authorization: Bearer <token>`): middleware `authenticateMobile` validasi token, muat data `Employee` tertaut. Hanya akses data milik karyawan itu.

---

> **Lanjut ke:** [PROJECT_ANALYSIS_2_STRUKTUR.md](./PROJECT_ANALYSIS_2_STRUKTUR.md) — Struktur Folder, Route/Endpoint/Screen, Komponen & Module.
