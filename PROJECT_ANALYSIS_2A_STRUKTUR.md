# PROJECT_ANALYSIS — Bagian 2A: Struktur Folder & Komponen

> Lanjutan dari [PROJECT_ANALYSIS.md](./PROJECT_ANALYSIS.md). Bagian ini memuat **Bagian 4 (Struktur Folder)** dan **Bagian 6 (Komponen & Module)**. Tabel Route/Endpoint/Screen (Bagian 5) ada di [PROJECT_ANALYSIS_2B_ROUTES.md](./PROJECT_ANALYSIS_2B_ROUTES.md).

---

## 4. Struktur Folder Project

Project adalah monorepo dengan tiga aplikasi di bawah `Apps/`, plus dokumentasi & konfigurasi di root.

### Root

```
Absen Application/
├── Apps/
│   ├── app_flutter/     # Mobile (Flutter)
│   ├── backend/         # Express + Prisma + better-auth
│   └── website/         # Next.js dashboard
├── docs/plans/          # Catatan rencana implementasi (backend, flutter)
├── proposal_mockups/    # Gambar mockup proposal
├── .kiro/specs/         # Spec requirements/design/tasks dashboard
├── docker-compose.yml   # Orkestrasi backend + website + postgres
├── pnpm-workspace.yaml  # Definisi workspace monorepo
├── turbo.json           # Pipeline turbo
├── PRD.md               # Product Requirements Document
├── DESIGN (1).md        # Design system
├── README.md            # Panduan utama (lengkap, bahasa Indonesia)
└── WALKTHROUGH.md
```

Penilaian: struktur root **rapi dan scalable**. Pemisahan tiga app dalam satu monorepo jelas, dokumentasi produk (PRD, design, plans) lengkap dan terorganisir.

### Mobile — `Apps/app_flutter/lib/`

```
lib/
├── main.dart            # Entry: init intl + ProviderScope
├── app.dart             # MaterialApp.router, theme light
├── core/                # Infrastruktur lintas-fitur
│   ├── config/          # app_config.dart (env, geofence default)
│   ├── network/         # dio_client.dart, api_exception.dart
│   ├── router/          # app_router.dart, app_routes.dart (GoRouter)
│   ├── storage/         # token_store.dart (secure storage)
│   ├── theme/           # colors, spacing, typography, theme
│   ├── widgets/         # app_card, status_badge
│   ├── utils/           # formatters, status_styles
│   └── providers.dart   # DI: toggle mock vs remote per repository
├── features/            # Feature-first (UI + controller per fitur)
│   ├── auth/            # login, splash, auth_controller
│   ├── home/            # home_screen, home_controller
│   ├── attendance/      # checkin flow (prep, location, face, success)
│   ├── history/         # list + detail
│   ├── leave/           # list, create, controller
│   ├── schedule/        # schedule_screen
│   ├── notifications/   # notifications_screen
│   ├── profile/         # profile_screen
│   ├── shell/           # main_shell (bottom nav)
│   └── sync/            # sync_controller, sync_status_screen
└── shared/
    ├── models/          # user_profile, attendance_record, shift, dll
    └── data/            # repository: mock + remote + api_mappers
```

Penilaian: arsitektur **feature-first** yang bersih. Pemisahan `core` / `features` / `shared` konsisten. Tiap domain punya repository abstrak dengan dua implementasi (mock & remote) — bagus untuk testability. Penamaan rapi.

### Backend — `Apps/backend/src/`

```
src/
├── index.ts             # Bootstrap Express, CORS, helmet, mount routes, start jobs
├── config/              # env (zod-validated), prisma, auth, supabaseStorage
├── middleware/          # authenticate (web HMAC), authenticateMobile (bearer),
│                        # requirePermission, enforceScope, resolveActiveWorkspace,
│                        # rateLimiter, loginGuard, errorHandler, logger, requestId
├── lib/                 # permissions, hmac, authVerify, audit, errors, response,
│                        # loginAttempts, mailer, excelExport, hmac, logger
├── modules/             # Per domain: .routes / .controller / .service / .schema
│   ├── auth/  attendance/  leave/  employees/  locations/  shifts/
│   ├── departments/  dashboard/  reports/  settings/  audit/
│   ├── exports/  notifications/  mobile/
├── jobs/                # absentJob, missingCheckoutJob, dailySummaryJob,
│                        # exportWorker, cleanupExportJob
├── prisma/              # seed.ts
├── tests/               # vitest unit tests (Prisma di-mock)
└── types/               # auth.ts, express.d.ts
```

Penilaian: struktur **modular per domain** dengan pola `routes/controller/service/schema` yang konsisten — sangat scalable dan mudah dirawat. Salah satu bagian terkuat project.

### Website — `Apps/website/`

```
website/
├── app/
│   ├── page.tsx         # Landing page marketing
│   ├── components/      # Komponen landing (Hero, Pricing, FAQ, dll) — statis
│   ├── (auth)/          # login, activate, forgot/reset-password
│   ├── sign-in/ sign-up/
│   ├── workspace/       # Dashboard HR: overview, attendance, workforce,
│   │                    # departments, locations, shifts, leave, reports,
│   │                    # exports, audit-log, settings, account, my-workspace
│   ├── admin/           # Platform admin: billing, tenants, users, platform,
│   │                    # tickets, system-health (+ _components)
│   ├── api/[[...path]]/  # BFF proxy ke Express (HMAC sign)
│   ├── api/auth/[...all]/ # better-auth handler
│   └── generated/prisma/ # Prisma client hasil generate
├── components/
│   ├── ui/              # shadcn + magicui
│   └── dashboard/       # Sidebar, NotificationBell, LocationMap
├── lib/                 # auth, auth-client, apiClient, hmac, permissionGuards,
│                        # prisma, mailer, formatters, hooks/useFetch
├── types/               # attendance, dashboard, leave, locations, overview, dll
├── e2e/                 # Playwright specs
├── proxy.ts             # Route guard (pengganti middleware.ts di Next 16)
└── prisma/schema.prisma # Hanya tabel auth
```

Penilaian: struktur App Router yang baik. Pemisahan route group `(auth)` / `workspace` / `admin` jelas. **Catatan:** ada folder `app/workspace/overview/_components/` berisi dashboard per-role (`StakeholderDashboard`, `EmployeeDashboard`, dll) yang **tidak dipakai (dead code)** — sebaiknya dibersihkan. Dua sistem styling co-exist (Tailwind gray/slate vs Material token) menandakan UI dirakit dari lebih dari satu sumber.

### Catatan struktur lintas-app
- Penamaan file konsisten di tiap app, tapi konvensi berbeda antar-app (wajar karena beda bahasa/framework).
- Tidak ada folder `mock` khusus di website — data dummy admin tersebar inline di tiap `page.tsx` (idealnya dipindah ke folder terpisah).
- Backend tidak punya folder `migrations` — pakai `prisma db push` (lihat bagian Database).

---

## 6. Komponen, Module, atau Service yang Sudah Ada

### 6.1 Mobile — Widget & Controller

| Komponen | Lokasi | Fungsi | Status |
|----------|--------|--------|--------|
| AppCard | `core/widgets/app_card.dart` | Surface kartu bordered + shadow | Sudah ada |
| StatusBadge | `core/widgets/status_badge.dart` | Pill status warna | Sudah ada |
| DioClient | `core/network/dio_client.dart` | HTTP client + interceptor token/retry/401 | Sudah ada (matang) |
| TokenStore | `core/storage/token_store.dart` | Simpan token di secure storage | Sudah ada |
| AppTheme | `core/theme/app_theme.dart` | ThemeData Material 3 (light) | Sudah ada (matang) |
| AuthController | `features/auth/auth_controller.dart` | StateNotifier login/restore/logout | Sudah ada |
| CheckinFlowController | `features/attendance/checkin_flow_controller.dart` | State multi-step check-in | Sudah ada |
| SyncQueueController | `features/sync/sync_controller.dart` | Antrian sync | UI only (simulasi) |
| Repository (×5 domain) | `shared/data/*` | Mock + Remote per domain | Sudah ada (remote nyata) |

### 6.2 Backend — Middleware & Service

| Module / Service | Lokasi | Fungsi | Status |
|------------------|--------|--------|--------|
| authenticate | `middleware/authenticate.ts` | Verifikasi HMAC web BFF | Sudah ada (matang) |
| authenticateMobile | `middleware/authenticateMobile.ts` | Verifikasi bearer mobile | Sudah ada |
| requirePermission | `middleware/requirePermission.ts` | RBAC enforcement | Sudah ada |
| enforceScope | `middleware/enforceScope.ts` | Filter scope dept/lokasi | Sudah ada |
| resolveActiveWorkspace | `middleware/resolveActiveWorkspace.ts` | Isolasi workspace | Sudah ada |
| rateLimiter | `middleware/rateLimiter.ts` | Rate limit (general/sensitive/auth) | Sudah ada |
| loginGuard + loginAttempts | `middleware` + `lib` | Lockout 5×/15min | Sudah ada (in-memory) |
| audit | `lib/audit.ts` | Tulis AuditLog best-effort | Sudah ada |
| errors + errorHandler | `lib` + `middleware` | Error typed + envelope konsisten | Sudah ada (matang) |
| hmac | `lib/hmac.ts` | Sign/verify konteks (timing-safe) | Sudah ada |
| permissions | `lib/permissions.ts` | Katalog 15 permission + helper | Sudah ada |
| Service per modul (×14) | `modules/*/*.service.ts` | Logika bisnis DB-backed | Mayoritas nyata |
| excelExport | `lib/excelExport.ts` | Generate CSV/XLSX | **Parsial — XLSX palsu (CSV)** |
| createNotification | `modules/notifications` | Buat notifikasi | **Stub — tak pernah dipanggil** |

### 6.3 Website — Komponen UI

| Komponen | Lokasi | Fungsi | Status |
|----------|--------|--------|--------|
| Sidebar | `components/dashboard/Sidebar.tsx` | Nav permission-aware (disable, bukan hide) | Sudah ada |
| NotificationBell | `components/dashboard/NotificationBell.tsx` | Polling 30s notifikasi | Sudah ada (backend nyata) |
| LocationMap | `components/dashboard/LocationMap.tsx` | Leaflet map picker (ssr:false) | Sudah ada |
| shadcn ui (×11) | `components/ui/*` | button, input, card, dialog, form, dll | Sudah ada (kualitas baik) |
| magicui (×17) | `components/ui/*` | Animasi marketing (marquee, particles, dll) | Sudah ada |
| AttendanceStatusBadge | `components/ui/AttendanceStatusBadge.tsx` | Badge status absensi | Sudah ada |
| apiClient | `lib/apiClient.ts` | Typed client + ApiResponse union | Sudah ada |
| permissionGuards | `lib/permissionGuards.ts` | Guard UX (kosmetik, enforce di server) | Sudah ada |
| useFetch / usePollingFetch | `lib/hooks/useFetch.ts` | Hook fetch | Ada tapi jarang dipakai |
| Admin primitives | `app/admin/_components/*` | StatCard, Modal, Drawer, DonutChart, dll | Sudah ada |
| Role dashboards | `app/workspace/overview/_components/*` | Dashboard per-role | **Dead code (tak dirender)** |

### Kategori komponen yang sudah tersedia
- **Layout & Navigation:** Sidebar, AdminShell/Sidebar/Topbar, main_shell (mobile)
- **Form:** RHF+Zod (web), form validation manual (mobile)
- **Table:** TanStack Table (web), list builder (mobile)
- **Modal/Drawer:** Modal, Drawer, Dialog
- **Card/Chart:** StatCard, Recharts, MiniChart, DonutChart
- **Authentication:** authenticate/authenticateMobile, AuthController, better-auth
- **API service:** apiClient (web), DioClient + repository (mobile), BFF proxy
- **State management:** Riverpod (mobile), useState/useFetch (web)
- **Utility/helper:** formatters, status_styles, permissions, hmac
- **Database/model:** Prisma schema, models Dart
- **Validation:** Zod (web+backend)
- **Error handling:** AppError + errorHandler (backend), ApiException (mobile)
- **Upload/file:** Supabase Storage (backend) — **mobile file picker tidak ada**
- **Notification:** NotificationBell (web), notifications_screen (mobile) — **backend tak pernah membuat notifikasi**
- **Permission/access control:** requirePermission + enforceScope (backend), permissionGuards (web kosmetik)

---

> **Lanjut ke:** [PROJECT_ANALYSIS_2B_ROUTES.md](./PROJECT_ANALYSIS_2B_ROUTES.md) — Tabel Route, Endpoint, dan Screen.
