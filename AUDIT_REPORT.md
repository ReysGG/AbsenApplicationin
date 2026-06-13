# AttendX — Audit Proyek (Anti Empty-UI / Anti Fake Functionality)

> Audit berbasis-bukti terhadap source code. Tidak mempercayai README/PRD/komentar — setiap klaim ditelusuri ke `file:line`.
> Tanggal: 2026-06-13 · Auditor: Kiro (skill `project-audit`)

## Pernyataan Cakupan (Coverage)

Repo besar (backend 57 file modul, website 109 file, Flutter 73 file). Audit memprioritaskan urutan skill: **auth/keamanan → jalur tulis DB → halaman read-only → mobile → testing**.

**Sudah ditelusuri mendalam (dengan bukti):**
- Backend: seluruh 15 modul route (inventory endpoint + middleware), middleware keamanan (authenticate, authenticateMobile, requirePermission, enforceScope, resolveActiveWorkspace, requirePlatformAdmin), `lib/permissions`, `lib/hmac`, `schema.prisma`, `seed.ts`, service: dashboard, mobile (check-in/out), platform.
- Website: BFF proxy + apiClient + auth, `proxy.ts`, sweep API-client di semua halaman, mendalam: overview, leave, workforce, admin/tenants, admin/system-health, admin/platform (+chart), admin home DashboardPage, sign-in, sign-up, sidebar.
- Mobile: providers (mock↔remote), location_service, face_liveness_service, checkin_flow_controller, remote_attendance_repository, sync_service, widget_test.
- Testing/CI: vitest config + mobile.test, e2e auth.spec, ci.yml.

**Belum ditelusuri baris-demi-baris (diberi label `Not Verified` bila relevan):** beberapa service backend (departments/shifts/locations/attendance/leave/reports/exports/settings/audit/notifications controller+service secara penuh — sebagian disimpulkan dari pola route+middleware yang konsisten), halaman website: attendance, departments, shifts, locations, reports, exports, settings, audit-log, account, my-workspace, admin/billing, admin/users, admin/tickets (terkonfirmasi *wired* ke API lewat sweep, tetapi tidak dibedah penuh), seluruh layar Flutter UI (history/leave/schedule/profile/notifications), jobs terjadwal.

---

## 1. Executive Summary

**Penilaian jujur:** Ini **proyek yang benar-benar berfungsi**, bukan cangkang UI kosong. Mayoritas fitur inti tersambung end-to-end ke backend Express + Prisma + PostgreSQL nyata, dengan keamanan yang kuat dan integrasi perangkat mobile yang asli (GPS, ML Kit face/liveness, offline-sync SQLite). Masalah yang ditemukan **terkonsentrasi dan dapat diidentifikasi**, bukan menyebar.

**Area terkuat:**
- Keamanan/Auth backend (HMAC `timingSafeEqual`, identitas via `authUserId` bukan email, RBAC + scope dipaksakan di backend, isolasi workspace + audit log).
- Mobile: integrasi perangkat nyata (geolocator, google_mlkit_face_detection, sqflite offline queue, connectivity_plus) — bukan simulasi.
- Backend API: konsisten DB-backed dengan validasi Zod dan rantai middleware seragam.

**Area terlemah:**
- `/admin/platform` (Platform Dashboard) = **100% mock data** (diberi banner "Demo Mode").
- `/admin` (home) = campuran data nyata + **"Info Sistem" hardcoded** + bar resource fake + beberapa tombol **no-op**.
- `/sign-up` = halaman registrasi **rusak** (kontradiksi dengan `disableSignUp:true` + tidak ada provider Google).
- Integritas absensi: server **mempercayai boolean dari klien** (`faceVerified`, `livenessPassed`, `isMocked`) — tidak ada face-matching di server.
- Testing: hanya unit test (Prisma di-mock), **tidak ada integration test ber-DB nyata**; e2e tanpa backend; tidak ada job mobile di CI.

**Kesiapan:**
- **Demo:** Ya (siap). Dengan akun seed, alur inti jalan.
- **MVP:** Hampir — setelah perbaikan P0 (sign-up, resend-invitation, leave-types, label/hapus mock platform).
- **Produksi:** Belum — butuh penguatan integritas absensi sisi server, integration test, dan penyelesaian gap P0/P1.

**Risiko terbesar bila dibiarkan:** Pemalsuan absensi. Karena server menerima `faceVerified/livenessPassed/isMocked` apa adanya, klien yang dimodifikasi/permintaan API yang dibuat manual bisa lolos check-in tanpa wajah/lokasi asli (geofence tetap diperiksa server, tapi face/liveness/anti-spoof tidak).

| Area | Skor | Catatan |
|---|---:|---|
| Web Dashboard | 78 | `workspace/*` solid & nyata; `/admin/platform` mock; `/admin` home partial-fake |
| Mobile App | 80 | Integrasi device nyata + offline sync; face=liveness saja, boolean dipercaya server |
| Backend/API | 88 | DB-backed, tervalidasi, ter-permission; 1 endpoint hilang (`/shared/leave-types`) |
| Database/Persistence | 85 | Schema lengkap + scoping + audit log; `LeaveType` praktis tak terpakai; pakai `db push` (bukan migration) |
| Auth/Security | 82 | Sangat kuat; risiko: boolean absensi dipercaya, `/sign-up` rusak, latent platform-admin lockout |
| Testing | 55 | Unit (Prisma mock) saja; tanpa integration DB; e2e tanpa backend; CI tak jalankan e2e/mobile |
| Production Readiness | 60 | Beberapa gap terkonsentrasi (mock platform, sign-up, resend, integritas absensi, test) |

---

## 2. Project Map

| Area | Stack/Framework | Lokasi | Catatan |
|---|---|---|---|
| Monorepo | pnpm workspaces + turbo | root | `pnpm-workspace.yaml`, `turbo.json` |
| Mobile | Flutter (Riverpod, go_router, Dio) | `Apps/app_flutter` | Device pkg lengkap: geolocator, camera, google_mlkit_face_detection, sqflite, connectivity_plus, firebase_messaging, local_auth |
| Website | Next.js 16 + React 19 (App Router) | `Apps/website` | BFF proxy `app/api/[[...path]]/route.ts`; guard `proxy.ts`; recharts, tanstack-table, leaflet, RHF+zod |
| Backend | Express 5 + Prisma 7 + better-auth | `Apps/backend` | 15 modul route di `/api/v1`; helmet, cors, rate-limit; exceljs/pdfkit/firebase-admin |
| Database | PostgreSQL (Prisma) | container `db` | Schema 30+ model; `prisma db push` (tanpa folder migrations di backend) |
| Auth | better-auth (cookie web, bearer mobile) + HMAC BFF | `lib/auth.ts`, `config/auth.ts`, `middleware/authenticate.ts` | `disableSignUp:true`; sesi 24h / 7d remember-me |
| Testing | Vitest (backend), Playwright (web), flutter_test | `Apps/*/` | CI di `.github/workflows/ci.yml` |

**Dua jalur auth ke backend yang sama:** Web → BFF tanda tangan HMAC konteks user → `authenticate`. Mobile → `Authorization: Bearer` → `authenticateMobile` (self-scoped ke Employee).

---

## 3. Route & Page Inventory (Website)

| Route | File | Peran | Sumber Data | Status |
|---|---|---|---|---|
| `/` (landing) | `app/page.tsx` + `app/components/*` | publik | statis marketing | Functional (statik wajar) |
| `/login` | `app/(auth)/login/page.tsx` | publik | better-auth | Functional |
| `/forgot-password` | `app/(auth)/forgot-password/page.tsx` | publik | better-auth reset | Functional |
| `/reset-password` | `app/(auth)/reset-password/page.tsx` | publik | better-auth | Functional (Not fully verified) |
| `/activate` | `app/(auth)/activate/page.tsx` | publik | `POST /employees/activate` | Functional (Not fully verified) |
| `/sign-in` | `app/sign-in/page.tsx` | publik | redirect → `/login` | Functional (redirect) |
| `/sign-up` | `app/sign-up/page.tsx` | publik | `authClient.signUp` + Google | **Broken** (disableSignUp + no social) |
| `/workspace` | `app/workspace/page.tsx` | HR | redirect → `/overview` | Functional (redirect) |
| `/workspace/overview` | `.../overview/page.tsx` | HR | 4× `/dashboard/*` | **Functional / DB-backed** |
| `/workspace/workforce` | `.../workforce/page.tsx` | HR | `/employees` CRUD | Functional (1 tombol broken, lihat §5) |
| `/workspace/leave` | `.../leave/page.tsx` | HR | `/leave-requests*` | **Functional** (1 endpoint hilang, lihat §9) |
| `/workspace/attendance` | `.../attendance/page.tsx` | HR | `/attendance*` | Functional (wired; Not fully verified) |
| `/workspace/departments` | `.../departments/page.tsx` | HR | `/departments*` | Functional (wired; Not fully verified) |
| `/workspace/shifts` | `.../shifts/page.tsx` | HR | `/shifts*` | Functional (wired; Not fully verified) |
| `/workspace/locations` | `.../locations/page.tsx` | HR | `/locations*` | Functional (wired; Not fully verified) |
| `/workspace/reports` | `.../reports/page.tsx` | HR | `/reports*` | Functional (wired; Not fully verified) |
| `/workspace/exports` | `.../exports/page.tsx` | HR | `/exports*` | Functional (wired; Not fully verified) |
| `/workspace/settings` | `.../settings/page.tsx` | HR | `/settings*` | Functional (wired; Not fully verified) |
| `/workspace/audit-log` | `.../audit-log/page.tsx` | HR | `/audit-logs*` | Functional (wired; Not fully verified) |
| `/workspace/account` | `.../account/page.tsx` | HR | — | Not Verified |
| `/workspace/my-workspace` | `.../my-workspace/page.tsx` | HR | `/workspaces/current` | Functional (wired; Not fully verified) |
| `/admin` | `app/admin/page.tsx` → `_components/DashboardPage.tsx` | platform | `/dashboard/*` nyata + hardcoded | **Partial** (data nyata + info sistem fake + tombol no-op) |
| `/admin/platform` | `app/admin/platform/page.tsx` | platform | **array hardcoded** | **Mock Data** (banner Demo) |
| `/admin/tenants` | `app/admin/tenants/page.tsx` | platform | `/platform/tenants` | **Functional / DB-backed** |
| `/admin/billing` | `app/admin/billing/page.tsx` | platform | `/platform/invoices` | Functional (wired; Not fully verified) |
| `/admin/users` | `app/admin/users/page.tsx` | platform | `/platform/admin-users` | Functional (wired; Not fully verified) |
| `/admin/tickets` | `app/admin/tickets/page.tsx` | platform | `/platform/tickets` | Functional (wired; Not fully verified) |
| `/admin/system-health` | `app/admin/system-health/page.tsx` | platform | `/audit` (fallback sampel) | **Partial** (uptime/latency/metrics hardcoded) |

**Mobile (Flutter) screens:** splash, login, lock, home, check-in flow (prep→location→face→success), history+detail, leave+create, schedule, notifications, profile, sync-status, main-shell. Semua terhubung ke repository (mock atau remote sesuai `USE_MOCK_DATA`).

---

## 9. API Audit (Backend `/api/v1`)

Rantai middleware standar (kuat): `authenticate → resolveActiveWorkspace → requirePermission(...) → enforceScope`. Semua endpoint berikut DB-backed kecuali dicatat.

| Method | Endpoint | Permission | DB-backed | Status |
|---|---|---|---|---|
| GET | `/me`, `/workspaces/current` | authenticate | ✓ | Functional |
| POST | `/auth/login-event`, `/logout-event`, `/login-failed` | authenticate/loginGuard | ✓ (audit + lockout) | Functional |
| GET | `/dashboard/{summary,attendance-trend,department-breakdown,live-preview}` | view_dashboard | ✓ (agregasi Prisma nyata + scope) | **Functional** |
| CRUD | `/departments`, `/employees`, `/shifts`, `/locations` (+status, +wfh) | view/manage_* | ✓ | Functional |
| POST | `/employees/activate` | PUBLIC | ✓ | Functional (by design publik) |
| POST | `/employees/:id/resend-invitation` | manage_employees | ✓ | Functional di backend — **tapi frontend salah path** (lihat §5/§12) |
| GET/POST/PATCH | `/attendance*`, `/leave-requests*` | view_live_attendance / approve_leave | ✓ | Functional |
| GET | `/reports/*`, `/exports*` | view_reports / export_reports | ✓ (exceljs/pdfkit + worker async) | Functional (Not fully verified end-to-end download) |
| CRUD | `/settings/{workspace,roles,holidays}` | view_dashboard/manage_roles/manage_attendance_policy | ✓ | Functional |
| GET | `/audit-logs`, `/audit-logs/:id` | view_audit_logs (read-only) | ✓ | Functional |
| GET/POST | `/notifications`, `/read-all`, `/:id/read` | **hanya authenticate+resolveActiveWorkspace** | ✓ | Functional — **tanpa requirePermission** (self-scope by recipient; lihat §14) |
| Mobile (18) | `/mobile/*` | authenticateMobile (self-scope) | ✓ | Functional |
| Platform (12) | `/platform/{tenants,invoices,admin-users,tickets}` | requirePlatformAdmin (globalRole) | ✓ | Functional |
| GET | `/shared/leave-types` | — | — | **MISSING** — dipanggil frontend, tidak ada di backend (lihat §12) |
| GET | `/audit` (tanpa `-logs`) | — | — | **MISSING** — dipanggil `system-health`, route asli `/audit-logs` → fallback sampel |

---

## 4. Every Page Audit (halaman kritis)

### `/workspace/overview` — Ringkasan Kehadiran
- **File:** `app/workspace/overview/page.tsx` · **Status: Functional / DB-backed**
- **Data:** `Promise.allSettled` ke `/dashboard/summary|attendance-trend|department-breakdown|live-preview` (BFF→Express→Prisma agregasi nyata, `dashboard.service.ts`).
- **State:** loading per-section, error per-section (banner amber "Sebagian data tidak dapat dimuat"), empty state aman, refetch manual + filter tanggal. Normalisasi camel/snake-case.
- **Temuan:** Tidak ada fake. Solid.

### `/workspace/leave` — Izin & Cuti
- **File:** `app/workspace/leave/page.tsx` · **Status: Functional** (1 dependensi hilang)
- **Aksi:** Approve (`PATCH /leave-requests/:id/approve`, deteksi `conflictWarning`→dialog konfirmasi→`forceApprove`), Reject (dialog wajib catatan), Create (HR manual, RHF-like validate), cancel. Server-side pagination (TanStack), states lengkap, drawer detail + lampiran signed URL.
- **Temuan:** `useEffect` memanggil `GET v1/shared/leave-types` yang **tidak ada** → fallback ke `LEAVE_TYPES_DEFAULT` hardcoded (graceful, tidak crash). Lihat §12.

### `/workspace/workforce` — Manajemen Karyawan
- **File:** `app/workspace/workforce/page.tsx` · **Status: Functional** (1 tombol broken + guard kosmetik)
- **Aksi:** List (server pagination), Add/Edit (RHF + Zod, `POST/PATCH /employees`), ubah status (archive/suspend/activate, dialog konfirmasi), refetch setelah mutasi. States lengkap, empty state, warning ikon shift/lokasi.
- **Temuan A (Broken):** `handleResendInvitation` → `POST v1/employees/${id}/resend-invite`, sedangkan route backend `/employees/:id/resend-invitation` → **404**, error ditelan diam-diam (`catch {}` "silently fail"). Lihat §12.
- **Temuan B (Hardcoded permission):** `currentUser` di-hardcode `roles:["stakeholder"]` (komentar: "naive: we assume..."), sehingga `canManage` selalu `true` di frontend. Kosmetik — backend tetap memaksakan `manage_employees`, jadi bukan lubang keamanan, tapi guard UI palsu. Lihat §11.

### `/admin` — Dashboard Admin (home)
- **File:** `app/admin/_components/DashboardPage.tsx` · **Status: Partial**
- **Nyata:** KPI cards, activity feed, trend mini-chart, department progress, tabel rekap → dari `/dashboard/*` (DB-backed) dengan loading/error/empty.
- **Fake/Hardcoded:** Kartu **"Info Sistem"** — Server Uptime `"99.9%"`, Lokasi Aktif `"12"`, Device Terdaftar `"312"` (literal). Bar **CPU 34% / Memory 70% / Storage 48%** (literal). `StatCard.change` selalu `0` (delta "vs bulan lalu" palsu). MiniChart memakai `weeklyData` (series *present*) untuk **semua** kartu (sparkline menyesatkan di kartu Absent/Late).
- **No-op:** `quickActions` `href:"#"` (Rekap Harian/Export Excel/Sync Data) dirender sebagai tombol tanpa handler; tombol **"+ Tambah Data"**, **"Export"**, **"Lihat Semua"**, ikon `MoreHorizontal` — tanpa `onClick`. Lihat §12.

### `/admin/platform` — Platform Dashboard
- **File:** `app/admin/platform/page.tsx` · **Status: Mock Data** (berlabel)
- **Fake:** `recentRegistrations` (L13), `topTenants` (L56) array hardcoded; KPI `"1,248" / "45.2k" / "$84.5k" / "124"` literal; `GrowthChart.tsx`/`PlanDonutChart.tsx` = polyline SVG hardcoded. Banner jujur "Data ... contoh demonstrasi" (L87). Tombol "Export Report"/date-range no-op.
- **Ironi:** endpoint platform asli (`/platform/tenants`, `/invoices`, `/tickets`) **ada & dipakai** halaman lain (tenants/billing/tickets), tapi dashboard ini tidak memakainya.

### `/admin/system-health` — System Health
- **File:** `app/admin/system-health/page.tsx` · **Status: Partial**
- **Nyata-parsial:** mencoba `GET v1/audit` untuk "Incident History" — tetapi route asli `/audit-logs`, sehingga **selalu 404 → fallback sampel** (`fallbackIncidents`, flag `usingLiveAudit=false`, ada badge "Showing sample data"). Jadi tabel insiden tak pernah live.
- **Fake:** uptime per-service (99.98%/99.99%/100%/99.95%/99.80%), grafik latency (`latencyPoints` literal + `Math.random` saat refresh), "Days Outage Free 12", "Avg Latency 43ms" — semua hardcoded.

### `/admin/tenants` — Tenants
- **File:** `app/admin/tenants/page.tsx` · **Status: Functional / DB-backed**
- Nyata: `GET/POST /platform/tenants`, bulk `PATCH /:id/status`, search/filter, loading/error/empty, refetch. Tidak ada fake.

---

## 5. Button & Action Audit (temuan signifikan)

| Halaman | Aksi | Handler? | API? | Persist? | Status |
|---|---|---|---|---|---|
| workforce | Add/Edit/Status karyawan | ✓ | ✓ | ✓ | Functional |
| workforce | **Kirim Ulang Undangan** (ikon Mail) | ✓ | salah path `resend-invite` | ✗ → 404 | **Broken** (silent fail) |
| leave | Approve/Reject/Create/Conflict | ✓ | ✓ | ✓ | Functional |
| tenants | Add/Suspend/Inactive tenant | ✓ | ✓ | ✓ | Functional |
| `/admin` home | Quick actions (Rekap/Export/Sync) `href:"#"` | ✗ | ✗ | ✗ | **No-op** |
| `/admin` home | "+ Tambah Data" / "Export" / "Lihat Semua" / `MoreHorizontal` | ✗ | ✗ | ✗ | **No-op** |
| `/admin/platform` | "Export Report" / date-range | ✗ | ✗ | ✗ | **No-op** |
| `/sign-up` | "Daftar" (submit) | ✓ | `signUp.email` **dinonaktifkan** | ✗ | **Broken** |
| `/sign-up` | "Continue with Google" | ✓ | provider Google **tak dikonfigurasi** | ✗ | **Broken** |

## 6. Form Audit

| Form | Validasi Klien | Validasi Server | Submit API | Persist | Status |
|---|---|---|---|---|---|
| Add/Edit Employee (workforce) | Zod (RHF) | Zod backend | `/employees` | ✓ | Functional |
| Create Leave (HR) | manual + field errors | Zod backend | `/leave-requests` | ✓ | Functional |
| Reject Leave (catatan wajib) | ✓ | ✓ | `/reject` | ✓ | Functional |
| Add Tenant | ringan | Zod/validasi service | `/platform/tenants` | ✓ | Functional |
| Login | ✓ | better-auth | `/api/auth` | ✓ (sesi) | Functional |
| **Sign-up** | ✓ | — | `signUp.email` (disabled) | ✗ | **Broken** |
| Mobile check-in | flow state (GPS+face wajib) | Zod `checkSubmissionSchema` + geofence server | `/mobile/check-in` | ✓ | Functional (lihat §14 integritas) |
| Mobile create leave | ✓ | Zod + overlap check | `/mobile/me/leave-requests` | ✓ | Functional |

## 7. Table / List / Chart Audit

| Elemen | Halaman | Sumber | Real? | Status |
|---|---|---|---|---|
| Tabel karyawan | workforce | `/employees` (server pagination) | ✓ | Functional |
| Tabel leave | leave | `/leave-requests` (server pagination) | ✓ | Functional |
| Trend chart (Recharts) | overview | `/dashboard/attendance-trend` | ✓ | Functional |
| Department breakdown | overview/admin | `/dashboard/department-breakdown` | ✓ | Functional |
| KPI + activity + rekap | `/admin` home | `/dashboard/*` | ✓ | Functional |
| Info Sistem + resource bars | `/admin` home | literal | ✗ | **Hardcoded** |
| GrowthChart / PlanDonutChart | `/admin/platform` | polyline SVG literal | ✗ | **Mock Data** |
| KPI + topTenants + registrations | `/admin/platform` | array literal | ✗ | **Mock Data** |
| Uptime/latency/incidents | `/admin/system-health` | literal (+ audit fallback) | ✗ | **Hardcoded** |
| `Features.tsx` log feed (landing) | `/` | `mockLogs` (animasi marketing) | ✗ | Mock (wajar, kosmetik landing) |

## 8. Modal / Drawer / Dropdown / Tab Audit

| Elemen | Halaman | Fungsional? | Status |
|---|---|---|---|
| AddTenantModal / TenantDrawer | tenants | ✓ (submit → API) | Functional |
| Add/Edit Employee Dialog + Status confirm | workforce | ✓ | Functional |
| Reject/Conflict/Create dialog | leave | ✓ | Functional |
| InviteAdminModal | admin/users | ✓ (wired; Not fully verified) | Functional |
| CreateInvoiceModal / InvoiceDrawer | admin/billing | ✓ (wired; Not fully verified) | Functional |

---

## 10. Database Audit (`prisma/schema.prisma`)

Schema komprehensif (~30 model), index komposit memadai, relasi & enum lengkap, semua data ber-tenant pakai `workspaceId`.

| Model | Dipakai fitur | CRUD | Scoped | Audit log | Status |
|---|---|---|---|---|---|
| Tenant/Workspace | platform + semua | ✓ | — / by tenant | sebagian | Functional |
| User / RoleAssignment / Permission / RoleAssignmentPermission | auth/RBAC | ✓ | by workspace | ✓ | Functional |
| Employee (+EmployeeWfhLocation) | workforce/mobile | ✓ | by workspace | ✓ | Functional |
| Department / Location / Shift | master data | ✓ (no hard delete) | by workspace | ✓ | Functional |
| AttendanceLog | absensi/dashboard/report | ✓ | by workspace | ✓ | Functional |
| AttendanceRawLog | audit attempt mentah mobile | create | by workspace | — | Functional |
| LeaveRequest (+approver) | izin/cuti | ✓ | by workspace | ✓ | Functional |
| ExportJob | export async | ✓ | by workspace | ✓ | Functional |
| HolidayCalendar / WorkspaceSetting | settings | ✓ | by workspace | ✓ | Functional |
| AuditLog | audit (append-only) | create/read | by workspace | self | Functional |
| Notification | notif in-app | ✓ | by recipient | — | Functional |
| Invoice / SupportTicket / TicketMessage | platform billing/tiket | ✓ | by tenant | — | Functional |
| DeviceToken | FCM | upsert/delete | by user | — | Functional |
| **LeaveType** | (seharusnya tipe izin) | ada model + endpoint **hilang** | by workspace | — | **Unused** (tak diseed, endpoint `/shared/leave-types` tak ada) |

**Catatan:** Backend memakai `prisma db push` (tidak ada folder `prisma/migrations`), wajar untuk dev tetapi berisiko untuk produksi (tidak ada riwayat migrasi/rollback).

---

## 11. Mock, Dummy, Static, Hardcoded Data

| File | Data | Tipe | Dampak | Fix |
|---|---|---|---|---|
| `app/admin/platform/page.tsx:13,56` | `recentRegistrations`, `topTenants` | Mock array | Dashboard platform palsu | Sambungkan ke `/platform/*` atau beri label tetap |
| `app/admin/platform/page.tsx` (KPI) | `1,248 / 45.2k / $84.5k / 124` | Hardcoded | KPI palsu | Endpoint metrik platform agregat |
| `app/admin/platform/_components/GrowthChart.tsx`, `PlanDonutChart.tsx` | polyline/segmen SVG | Hardcoded | Chart palsu | Data nyata dari API |
| `app/admin/_components/DashboardPage.tsx` | Info Sistem (99.9%/12/312), CPU/Mem/Storage, `change:0` | Hardcoded | Metrik infra/tren palsu | Hapus atau sambungkan metrik nyata |
| `app/admin/system-health/page.tsx` | uptime per-service, latency, "12 days", "43ms" | Hardcoded + `Math.random` | Status sistem palsu | Sumber monitoring nyata atau beri label sampel |
| `app/workspace/workforce/page.tsx` | `currentUser.roles=["stakeholder"]` | Hardcoded permission | Guard UI palsu (backend aman) | Muat user nyata dari `/me` |
| `app/workspace/leave/page.tsx` | `LEAVE_TYPES_DEFAULT` | Fallback hardcoded | Tipe izin tak dari DB | Buat endpoint `/leave-types` |
| `backend platform.service.ts` | `PLAN_MRR{499/199/49}`, `domain=${slug}.attendx.io` | Hardcoded bisnis | MRR/domain sintetis | Tabel harga + domain nyata |
| `components/dashboard/Sidebar`/`AdminSidebar` | badge `"14"`, versi `v2.1.0` | Hardcoded | kosmetik | dari API/config |

---

## 12. No-op, Dead Link, Dead Code

### No-op (tombol tanpa efek)
| Halaman | Elemen | Fix |
|---|---|---|
| `/admin` home | quickActions `href:"#"`, "+ Tambah Data", "Export", "Lihat Semua", `MoreHorizontal` | beri handler atau hapus |
| `/admin/platform` | "Export Report", date-range | beri handler atau hapus |

### Dead Link / Broken Call
| Sumber | Target | Ada? | Akibat |
|---|---|---|---|
| `workforce` `handleResendInvitation` | `POST /employees/:id/resend-invite` | ✗ (asli `…/resend-invitation`) | **404**, ditelan diam-diam |
| `leave` `useEffect` | `GET /shared/leave-types` | ✗ | **404** → fallback hardcoded |
| `system-health` `fetchAuditLogs` | `GET /audit` | ✗ (asli `/audit-logs`) | **404** → fallback sampel selalu |
| `/sign-up` form & Google | `signUp.email` / social `google` | dinonaktifkan/tak dikonfigurasi | **Broken** |
| `/sign-up` footer | `Privacy`, `Terms` (`href="#"`) | ✗ | Dead link |

### Dead Code / Halaman usang
- `app/sign-up/page.tsx` — halaman registrasi penuh yang **tidak berfungsi** (kontradiksi `disableSignUp:true`). Kandidat dihapus atau dinonaktifkan.
- `LeaveType` model — ada di schema tapi tak diseed & tak terjangkau (endpoint hilang) → efektif **dead model** dari sisi dashboard.
- (Positif) `AdminSidebar.tsx` — komentar menunjukkan ~12 link "Menu Utama" 404 sudah **dihapus**; nav saat ini valid.

---

## 13. Feature Completeness Matrix

| Fitur | Web UI | Mobile UI | Backend API | Database | Test | Fully Functional? |
|---|---|---|---|---|---|---|
| Login/Session | ✓ | ✓ | ✓ | ✓ | parsial | **Ya** |
| Registrasi mandiri | ✗ (broken) | n/a | dinonaktifkan (by design) | — | — | Tidak (by design; UI menyesatkan) |
| Aktivasi karyawan | ✓ | n/a | ✓ publik | ✓ | parsial | Ya (Not fully verified) |
| Kelola karyawan (CRUD) | ✓ | n/a | ✓ | ✓ | ✓ unit | Ya (kecuali resend-invitation) |
| Check-in/out GPS+face | n/a | ✓ | ✓ | ✓ | ✓ unit | **Ya** (face=liveness; boolean dipercaya server) |
| Geofence | n/a | ✓ | ✓ server haversine | ✓ | ✓ unit | **Ya** |
| Offline sync | n/a | ✓ SQLite | ✓ | ✓ | — | Ya |
| Izin/Cuti (ajukan→approve) | ✓ | ✓ | ✓ | ✓ | ✓ unit | Ya |
| Dashboard kehadiran | ✓ | n/a | ✓ | ✓ | — | Ya |
| Laporan + Export | ✓ | n/a | ✓ (xlsx/pdf/worker) | ✓ | ✓ unit | Ya (Not fully verified download) |
| Audit log | ✓ | n/a | ✓ | ✓ | — | Ya |
| Notifikasi (in-app + FCM) | ✓ | ✓ | ✓ | ✓ | — | Ya (Not fully verified FCM) |
| Platform: tenants/billing/tickets | ✓ | n/a | ✓ | ✓ | — | Ya |
| Platform dashboard (overview) | ✗ mock | n/a | (tak ada agregat) | parsial | — | **Tidak (mock)** |
| Tipe izin terkonfigurasi | ✗ fallback | n/a | **hilang** | model ada | — | **Tidak** |

---

## 14. Security & Permission Gaps

| Area | Masalah | Dampak | Prioritas | Solusi |
|---|---|---|---|---|
| Integritas absensi | Server percaya `faceVerified`/`livenessPassed`/`isMocked` dari klien (`mobile.service.ts checkIn`) | Absensi bisa dipalsukan via klien modif/permintaan manual | **P0** | Tanda tangan attestation device, server-side face-match (embedding), validasi konsistensi raw-log, integritas aplikasi (Play Integrity/DeviceCheck) |
| Face verification | Hanya liveness/deteksi (ML Kit), **bukan** pencocokan identitas | "Verifikasi wajah" tak membuktikan ini orangnya | **P1** | Enrollment + embedding match (didokumentasikan sbg belum ada) |
| Platform-admin lockout | `inviteAdminUser` set `globalRole` saja, tanpa RoleAssignment workspace; `authenticate` melempar "tidak memiliki workspace aktif" bila tak ada assignment | Admin platform murni hasil undangan bisa terkunci dari `/admin` | **P1** | Saat invite, buat juga assignment/skip syarat workspace untuk jalur platform |
| Notifications | `GET /notifications` tanpa `requirePermission` | Rendah — di-scope `recipientAuthUserId`, tapi inkonsisten dgn modul lain | **P2** | Tambah guard eksplisit / dokumentasikan self-scope |
| `/sign-up` aktif | Form registrasi terekspos walau `disableSignUp` | Membingungkan/permukaan serangan; UX menyesatkan | **P1** | Hapus halaman atau redirect ke `/login` |
| Migrasi DB | `prisma db push` tanpa migrations | Risiko perubahan schema produksi tanpa rollback | **P2** | Adopsi `prisma migrate` untuk produksi |

**Positif (terverifikasi kuat):** HMAC `timingSafeEqual`; identitas via `authUserId` (anti email-takeover, ada komentar eksplisit); `requirePermission`/`enforceScope`/`resolveActiveWorkspace` dipaksakan backend; cross-workspace ditolak + di-audit; `requirePlatformAdmin` cek `globalRole` dari DB; mobile self-scoped; geofence dihitung server; rate limit (general + sensitive + auth); helmet + CORS allowlist; `disableSignUp`; error login generik (anti enumerasi, diuji e2e).

---

## 15. UX & Accessibility Gaps

| Halaman | Masalah | Fix |
|---|---|---|
| `/admin` home, `/admin/platform` | tombol no-op tampak aktif (tak ada disabled/aria) | hapus atau aktifkan + state |
| `/admin/system-health`, `/admin/platform` | data sampel tanpa label jelas di sebagian elemen | beri badge "sampel/demo" konsisten |
| `workforce` resend-invitation | gagal diam-diam (tak ada toast error) | tambah toast/feedback error |
| Global (dashboard) | tidak ada sistem toast terpusat (beberapa aksi pakai `catch {}`) | tambah toaster + feedback sukses/gagal |
| Positif | overview/leave/workforce: loading/error/empty/aria/role/tooltip baik | — |

---

## 16. Testing Gaps

| Area | Ada? | Tipe | Gap | Rekomendasi |
|---|---|---|---|---|
| Backend unit | ✓ 11 file | Vitest, **Prisma di-mock** | Tak ada integration DB nyata; SQL/scope/FK tak teruji | Tambah integration test (Testcontainers/PG) |
| Backend security paths | ✓ | unit (geofence, face gate, conflict, leave overlap) | Tak menguji bypass boolean klien | Test integritas attendance |
| Web e2e | ✓ 3 spec (auth/dashboard/accessibility) | Playwright **tanpa backend** | Hanya render+route-guard; bukan E2E nyata | E2E dgn backend+DB seed |
| Mobile | ✗ minim | `widget_test.dart` = unit geofence | Tak ada widget/integration/repo test | Tambah test flow check-in, repo, golden |
| CI | ✓ `ci.yml` | backend lint+typecheck+test; web lint+typecheck+build | **Tak jalankan e2e**, **tak ada job mobile** | Tambah job e2e + `flutter analyze/test` |

---

## 17–19. Rekomendasi Endpoint / Komponen / Halaman Baru

**Endpoint baru:**
- `GET /api/v1/leave-types` (atau perbaiki frontend ke route yang benar) — permission `view_dashboard`/`approve_leave`; baca `LeaveType` per-workspace; mengaktifkan model yang kini tak terpakai.
- `GET /api/v1/platform/metrics` — agregat lintas-tenant (active tenants, end users, MRR dari Invoice, open tickets) untuk menggantikan KPI hardcoded `/admin/platform`.
- `GET /api/v1/platform/registrations` + `GET /api/v1/platform/top-tenants` — untuk tabel registrasi & top-tenant nyata.
- (Opsional) `GET /api/v1/system/health` — status service nyata untuk `/admin/system-health`.

**Perbaikan endpoint (bukan baru, hanya samakan path):**
- Frontend `workforce` → `…/resend-invitation` (bukan `resend-invite`).
- Frontend `system-health` → `/audit-logs` (bukan `/audit`).

**Komponen:** `Toaster` global (feedback sukses/gagal terpusat) — saat ini sebagian aksi `catch {}` diam.

---

## 20. Implementation Backlog

| Prioritas | Item | Area | Masalah | Solusi | Kompleksitas |
|---|---|---|---|---|---|
| **P0** | Integritas absensi sisi server | Backend/Mobile | Boolean `faceVerified/livenessPassed/isMocked` dipercaya | Attestation device + (idealnya) face-match server + validasi raw-log | L |
| **P0** | Perbaiki resend-invitation | Web | Path salah → 404 silent | Ubah ke `/resend-invitation` + toast | S |
| **P0** | Perbaiki/realkan `/admin/platform` | Web/Backend | 100% mock | Endpoint metrik + sambungkan, atau tandai tegas non-produksi | M |
| **P0** | Tipe izin (`/leave-types`) | Backend/Web | Endpoint hilang, model tak terpakai | Buat endpoint + seed default | S |
| **P1** | Nonaktifkan/hapus `/sign-up` | Web | Form & Google rusak | Redirect ke `/login` atau hapus | S |
| **P1** | `/admin` home: buang Info Sistem & bar fake; aktifkan/buang tombol no-op | Web | Partial-fake + no-op | Hapus literal; beri handler nyata | M |
| **P1** | `/admin/system-health`: fix `/audit-logs` + label sampel | Web | Audit live tak pernah jalan | Perbaiki path + badge "sampel" untuk metrik yg belum nyata | S |
| **P1** | Platform-admin lockout | Backend | Invite tak buat workspace assignment | Provision assignment / longgarkan syarat workspace utk jalur platform | M |
| **P1** | Muat permission user nyata di `workforce` | Web | Guard kosmetik hardcoded | Ambil `/me`, hilangkan `currentUser` hardcode | S |
| **P1** | Integration test ber-DB + job mobile di CI | Testing/DevOps | Tak ada test DB nyata; CI tanpa e2e/mobile | Testcontainers + tambah job e2e & flutter | L |
| **P2** | `prisma migrate` untuk produksi | DB | `db push` tanpa migrasi | Adopsi migrations | M |
| **P2** | Guard eksplisit/dokumentasi `/notifications` | Backend | Inkonsisten | Tambah self-scope guard | S |
| **P2** | Toaster global + hilangkan `catch {}` diam | Web | Gagal senyap | Komponen feedback | M |
| **P2** | Hilangkan hardcoded badge/versi/MRR/domain | Web/Backend | Kosmetik/sintetis | dari API/config | S |

---

## 21. Roadmap

**P0 — Sebelum MVP/Produksi**
1. Integritas absensi sisi server (anti-spoof boolean klien).
2. Perbaiki resend-invitation (path + feedback).
3. Realkan atau tandai-tegas `/admin/platform` (hilangkan kesan fitur jadi).
4. Endpoint `/leave-types` (aktifkan model `LeaveType`).

**P1 — Penting setelah P0**
5. Hapus/redirect `/sign-up`.
6. Bersihkan `/admin` home (Info Sistem/resource/tombol no-op) & perbaiki `/admin/system-health` (`/audit-logs` + label sampel).
7. Perbaiki latent platform-admin lockout.
8. Muat permission nyata di guard frontend.
9. Integration test ber-DB + e2e/mobile di CI.

**P2 — Peningkatan**
10. `prisma migrate`, guard `/notifications`, Toaster global, bersihkan hardcoded kosmetik, face-recognition (embedding) penuh.

---

## 22. Final Verdict

**Yang benar-benar selesai:** Auth/keamanan backend, RBAC + scope, dashboard kehadiran, manajemen karyawan/departemen/shift/lokasi, izin-cuti (ajukan→approve/reject dengan konflik), audit log, export, platform tenants/billing/tickets, dan **seluruh alur mobile** (login, check-in/out GPS+liveness, geofence server, offline-sync, riwayat, izin). Ini bukan UI kosong — sebagian besar jalan end-to-end ke DB nyata.

**Yang hanya tampak selesai:**
- `/admin/platform` (mock penuh, berlabel demo).
- `/admin` home "Info Sistem" + bar resource + tombol no-op.
- `/admin/system-health` (uptime/latency/incident hardcoded; audit live tak pernah jalan karena salah path).
- `/sign-up` (form & Google rusak).
- "Verifikasi wajah" = liveness, bukan identitas.

**Isu paling berbahaya bila dibiarkan:** **Pemalsuan absensi** — server menerima hasil wajah/liveness/anti-spoof dari klien tanpa verifikasi. Untuk produk absensi, ini melemahkan jaminan integritas inti (geofence aman, tapi wajah/anti-mock tidak).

**5 hal pertama yang harus diperbaiki:**
1. Integritas absensi sisi server (attestation/anti-spoof; idealnya face-match).
2. Perbaiki path `resend-invitation` + feedback error.
3. Realkan atau tandai-tegas `/admin/platform` (dan buang fake di `/admin` home).
4. Buat endpoint `/leave-types` (samakan path `system-health` ke `/audit-logs`).
5. Hapus/redirect `/sign-up`.

**Kesiapan:** Demo **Ya** · MVP **Hampir** (setelah P0) · Produksi **Belum** (perlu integritas absensi server + integration test + selesaikan P0/P1).

> Catatan metodologi: item berlabel "Not fully verified" terkonfirmasi *wired* ke API lewat sweep tetapi tidak dibedah baris-demi-baris; tidak ada yang dinyatakan Functional tanpa bukti jalur kode. Folder `audit/` lama di repo TIDAK dijadikan dasar — semua temuan ditelusuri ulang dari source.




