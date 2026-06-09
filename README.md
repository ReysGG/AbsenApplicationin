# AttendX — Aplikasi Absensi Digital Karyawan

Sistem absensi karyawan dengan verifikasi lokasi (GPS + geofence) dan wajah (face + liveness). Terdiri dari tiga aplikasi yang saling terhubung:

| Aplikasi | Stack | Untuk siapa | Lokasi |
|----------|-------|-------------|--------|
| **Mobile** | Flutter | Karyawan (end user) — check-in/out, riwayat, izin, jadwal | `Apps/app_flutter` |
| **Website** | Next.js 16 + React 19 | HR / Admin (dashboard) | `Apps/website` |
| **Backend** | Express 5 + Prisma 7 + better-auth | API untuk web & mobile | `Apps/backend` |
| **Database** | PostgreSQL | — | container `db` (lokal) |

> Mobile **tidak** di-Docker (didistribusikan sebagai APK/IPA). Backend + Website + Postgres dijalankan via `docker compose`.

---

## Arsitektur

```
┌─────────────┐     Bearer token        ┌──────────────────┐
│  Flutter    │ ───────────────────────▶│                  │
│  (mobile)   │   /api/v1/mobile/*       │   Express        │      ┌────────────┐
└─────────────┘                          │   Backend        │─────▶│ PostgreSQL │
                                         │   host :10001    │      │ host :10002│
┌─────────────┐  HMAC-signed context     │   (cont. :4000)  │      │(cont. :5432)│
│  Next.js    │  header (BFF proxy)      │                  │      └────────────┘
│  (website)  │ ───────────────────────▶│                  │            ▲
│ host :10000 │                          │                  │            │
│(cont. :3000)│                          └──────────────────┘            │
└─────────────┘                                                          │
       └──── better-auth (sesi cookie, DB sama) ─────────────────────────┘
```

> **Port:** untuk menghindari bentrok, port host dimulai dari 10000. Di dalam jaringan Docker, antar-container tetap memakai port internal (website 3000, backend 4000, postgres 5432).

| Service | Port host (akses dari komputer) | Port container (antar-service) |
|---------|--------------------------------|-------------------------------|
| Website | `10000` | `3000` |
| Backend | `10001` | `4000` |
| Postgres | `10002` | `5432` |

**Dua jalur autentikasi ke backend yang sama:**

- **Website** → BFF proxy (`app/api/[[...path]]/route.ts`) memvalidasi sesi better-auth, lalu menandatangani konteks user dengan HMAC (`INTERNAL_JWT_SECRET`) dan meneruskan ke Express. Middleware `authenticate` memverifikasi tanda tangan itu.
- **Mobile** → kirim `Authorization: Bearer <session-token>` (better-auth bearer plugin). Middleware `authenticateMobile` memvalidasi token, lalu memuat data `Employee` yang tertaut. Endpoint mobile hanya mengakses data milik karyawan itu sendiri.

Kedua app berbagi `BETTER_AUTH_SECRET` (kredensial sama) dan `INTERNAL_JWT_SECRET` (hanya dipakai web BFF ↔ backend).

---

## Prasyarat

- **Docker** + Docker Compose (untuk backend + website + db)
- **Flutter SDK** 3.11+ dan Dart (untuk mobile)
- **Node.js 22** (hanya jika ingin menjalankan backend/website tanpa Docker)

---

## Cara Menjalankan — Docker (backend + website + database)

```bash
# 1. Salin env contoh dan isi secret
cp .env.docker.example .env

# 2. Generate dua secret (masing-masing minimal 32 karakter)
openssl rand -base64 48   # untuk BETTER_AUTH_SECRET
openssl rand -base64 48   # untuk INTERNAL_JWT_SECRET
# tempel ke .env

# 3. Build & jalankan
docker compose up --build
```

Yang terjadi saat boot:
- `db` (Postgres) start → healthcheck.
- `backend` menunggu db sehat, menjalankan `prisma db push` (menerapkan schema), lalu **seed otomatis** (idempotent), lalu start di `:4000`.
- `website` start di `:3000`, mem-proxy API ke `backend:4000`.

Akses:
- Website (dashboard HR): http://localhost:10000
- Backend health check: http://localhost:10001/api/v1/health

Mematikan: `docker compose down` (data Postgres tetap tersimpan di volume `attendx_pgdata`).
Reset total termasuk data: `docker compose down -v`.

### Akun demo (password: `Attendx2024!`)

| Email | Peran | Login ke |
|-------|-------|----------|
| `stakeholder@attendx.dev` | Stakeholder (semua izin) | Website |
| `hradmin@attendx.dev` | Support Admin (HR) | Website |
| `karyawan@attendx.dev` | End user (karyawan) | Mobile |

---

## Cara Menjalankan — Mobile (Flutter)

Mobile dijalankan terpisah dari Docker. Pastikan backend sudah jalan dulu.

Konfigurasi mobile memakai file `.env` berbasis JSON (fitur native Flutter `--dart-define-from-file`, tanpa package tambahan). File tersedia di `Apps/app_flutter/env/`:

| File | `USE_MOCK_DATA` | Untuk |
|------|-----------------|-------|
| `env/dev.json` | `false` | Terhubung ke backend lokal (Docker) |
| `env/mock.json` | `true` | UI dengan data dummy, tanpa backend |
| `env/prod.example.json` | `false` | Template produksi (salin → `prod.json`) |

```bash
cd Apps/app_flutter
flutter pub get

# Terhubung ke backend lokal (Docker, backend di host port 10001)
flutter run --dart-define-from-file=env/dev.json

# Mode mock (tanpa backend)
flutter run --dart-define-from-file=env/mock.json
```

Isi `env/dev.json`:
```json
{
  "USE_MOCK_DATA": false,
  "API_BASE_URL": "http://10.0.2.2:10001/api/v1"
}
```

Sesuaikan `API_BASE_URL` per platform:
- **Android emulator** → `http://10.0.2.2:10001/api/v1` (10.0.2.2 = host loopback)
- **iOS simulator** → `http://localhost:10001/api/v1`
- **HP fisik** → `http://<IP-LAN-komputer>:10001/api/v1`

Build APK rilis:
```bash
cp env/prod.example.json env/prod.json   # lalu edit API_BASE_URL
flutter build apk --dart-define-from-file=env/prod.json
```

> Masih bisa pakai `--dart-define=KEY=value` satuan bila perlu; `--dart-define-from-file` hanya cara ringkas membaca beberapa nilai dari satu file.

---

## Menjalankan Tanpa Docker (opsional, untuk pengembangan)

Repo ini monorepo pnpm + turbo. Backend dan website punya `node_modules` sendiri.

> Tanpa Docker, server berjalan di port native-nya (backend 4000, website 3000) — tidak ada remapping port seperti di Docker. Untuk mobile, arahkan `API_BASE_URL` ke `http://10.0.2.2:4000/api/v1`.

```bash
# Backend
cd Apps/backend
npm install
# set DATABASE_URL, BETTER_AUTH_SECRET, INTERNAL_JWT_SECRET di .env
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev          # :4000

# Website (terminal lain)
cd Apps/website
npm install
# set DATABASE_URL, BETTER_AUTH_SECRET, INTERNAL_JWT_SECRET, BACKEND_URL=http://localhost:4000
npm run dev          # :3000
```

---

## Variabel Lingkungan

| Variabel | Dipakai oleh | Keterangan |
|----------|--------------|------------|
| `DATABASE_URL` | backend, website | Koneksi Postgres |
| `DIRECT_URL` | backend | Koneksi langsung (opsional, untuk migrasi) |
| `BETTER_AUTH_SECRET` | backend, website | **Harus sama** di keduanya, min 32 char |
| `INTERNAL_JWT_SECRET` | backend, website | Tanda tangan HMAC BFF↔backend, min 32 char |
| `BETTER_AUTH_URL` | backend, website | Default `http://localhost:10000` (Docker) |
| `BACKEND_URL` | website | URL backend untuk BFF proxy (di Docker: `http://backend:4000`) |
| `CORS_ORIGIN` | backend | Origin yang diizinkan (Docker: `http://localhost:10000`) |
| `RUN_SEED` | backend (Docker) | `true` = seed saat boot pertama |
| `API_BASE_URL` | flutter | Via `env/*.json` (`--dart-define-from-file`); Docker: `http://10.0.2.2:10001/api/v1` |
| `USE_MOCK_DATA` | flutter | Via `env/*.json`; `true`=mock, `false`=backend |

---

## Mobile API (ringkasan)

Semua di bawah prefix `/api/v1`. Auth pakai `Authorization: Bearer <token>` kecuali login.

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| POST | `/mobile/auth/login` | Body `{email, password}` → `{token, profile}` |
| POST | `/mobile/auth/logout` | Cabut sesi |
| GET | `/mobile/me` | Profil karyawan |
| GET | `/mobile/me/today` | Presensi hari ini |
| GET | `/mobile/me/attendance` | Riwayat presensi |
| GET | `/mobile/me/attendance/:id` | Detail presensi |
| POST | `/mobile/check-in` | Submit check-in |
| POST | `/mobile/check-out` | Submit check-out |
| GET | `/mobile/me/shift` | Shift yang ditugaskan |
| GET | `/mobile/me/locations` | Lokasi kerja yang valid |
| GET | `/mobile/me/leave-requests` | Daftar pengajuan izin/cuti |
| POST | `/mobile/me/leave-requests` | Buat pengajuan |
| GET | `/mobile/me/schedule` | Jadwal beberapa hari ke depan |
| GET | `/mobile/me/notifications` | Notifikasi |

Format respons standar:
```json
{ "success": true, "data": { ... }, "message": "OK" }
{ "success": false, "error": { "code": "...", "message": "..." } }
```

---

## Struktur Proyek

```
Absen Application/
├── Apps/
│   ├── app_flutter/        # Mobile (Flutter)
│   │   ├── env/            # dev.json, mock.json, prod.example.json (--dart-define-from-file)
│   │   └── lib/
│   │       ├── core/       # config, network (dio), router, theme, providers
│   │       ├── features/   # auth, home, attendance, history, leave, schedule, ...
│   │       └── shared/     # models + data (repository: mock & remote)
│   ├── backend/            # Express + Prisma + better-auth
│   │   ├── src/
│   │   │   ├── middleware/  # authenticate (web HMAC), authenticateMobile (bearer)
│   │   │   ├── modules/     # auth, attendance, leave, ..., mobile/
│   │   │   └── prisma/      # seed.ts
│   │   ├── prisma/schema.prisma
│   │   ├── Dockerfile
│   │   └── docker-entrypoint.sh
│   └── website/            # Next.js dashboard
│       ├── app/            # routes (auth), workspace/*, admin/*, api/[[...path]]
│       ├── lib/            # auth, apiClient, hmac
│       ├── proxy.ts        # route guard (pengganti middleware.ts di Next 16)
│       └── Dockerfile
├── docker-compose.yml
├── .env.docker.example
└── README.md
```

---

## Pengembangan & Verifikasi

```bash
# Backend
cd Apps/backend && npm run typecheck      # tsc --noEmit
cd Apps/backend && npm run build          # emit ke dist/
cd Apps/backend && npm test               # vitest

# Website
cd Apps/website && npm run build          # next build (standalone)
cd Apps/website && npm run lint

# Mobile
cd Apps/app_flutter && flutter analyze
cd Apps/app_flutter && flutter test

# Docker
docker compose config                     # validasi compose
```

---

## Catatan & Batasan

- **Mobile tidak di-Docker** — hanya butuh tahu `API_BASE_URL` saat build.
- Backend menerapkan schema dengan `prisma db push` (bukan migrations).
- Beberapa aksi mobile belum punya endpoint backend: **batal pengajuan izin** dan **tandai notifikasi terbaca** (saat ini no-op / belum tersedia).
- Verifikasi wajah & liveness di mobile: implementasi penuh face-recognition (embedding) belum termasuk; lihat `docs/plans/2026-06-09-attendx-flutter-mobile.md`.
- Hanya user yang punya data `Employee` tertaut yang bisa login mobile (HR murni tanpa employee record tidak bisa).
