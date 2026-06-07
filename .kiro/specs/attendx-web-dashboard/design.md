# Design — AttendX Web Dashboard v1

## Overview

AttendX Web Dashboard v1 adalah aplikasi web multi-tenant untuk HR/Admin yang memantau dan mengelola absensi karyawan. Arsitekturnya memisahkan tiga lapisan utama: **Next.js** (`Apps/website`) sebagai UI + BFF/proxy, **Express.js** (`Apps/backend`) sebagai REST API dan sumber kebenaran business logic, dan **Supabase PostgreSQL** sebagai database (dengan RLS) dan storage privat untuk file.

Prinsip desain utama:

- **Isolasi multi-tenant ketat** — setiap akses data dibatasi Active Workspace di backend, diperkuat RLS.
- **RBAC + granular permission + scope** — Stakeholder implicit-all; Support Admin hanya permission yang diberikan, dibatasi scope (department/location, logika OR), permission dapat di-bind per scope.
- **Backend sebagai source of truth** untuk status attendance; dashboard read-only.
- **Tidak ada hard delete** untuk data penting; gunakan lifecycle status.
- **Append-only audit log** untuk seluruh aksi sensitif dan security event.

Dokumen ini memetakan keputusan teknis ke requirements (R1–R21).

---

## Architecture

### High-Level Diagram

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                                Browser                                    │
│            (HR/Admin — Chrome/Edge/Firefox/Safari modern)                 │
└───────────────┬───────────────────────────────────────────────────────────┘
                │ HTTPS (session cookie better-auth)
                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Next.js (Apps/website)                                │
│  • App Router pages (Server + Client Components)                          │
│  • better-auth (email/password, session, reset)                          │
│  • Middleware: auth guard + active workspace + route protection          │
│  • BFF/Proxy: app/api/* → meneruskan ke Express dgn signed internal JWT   │
└───────────────┬───────────────────────────────────────────────────────────┘
                │ HTTPS + X-Internal-Token (signed JWT: user_id, workspace_id, roles)
                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Express API (Apps/backend) — /api/v1                   │
│  Namespaces: /dashboard  /mobile  /shared                                 │
│  Middleware chain: requestId → verifyInternalToken/session → resolveWS    │
│                    → requirePermission → enforceScope → handler           │
│  Modules: auth, dashboard, attendance, employees, departments, locations, │
│           shifts, leave, reports, exports, settings, roles, audit, notif  │
│  Jobs (node-cron): absentJob(15m), missingCheckoutJob(30m),               │
│                    dailySummaryJob(nightly), exportWorker, cleanupJob      │
└───────────────┬───────────────────────────────────────┬───────────────────┘
                │ Prisma                                  │ Supabase SDK
                ▼                                         ▼
┌──────────────────────────────────┐      ┌──────────────────────────────────┐
│   Supabase PostgreSQL (+ RLS)     │      │   Supabase Storage (private)      │
│   tenant, workspace, employee,    │      │   exports/ , leave-attachments/   │
│   attendance, leave, ...          │      │   signed URL (expiry)             │
└──────────────────────────────────┘      └──────────────────────────────────┘
                ▲
                │ writes AttendanceLog / AttendanceRawLog
┌──────────────────────────────────┐
│   Mobile App (Flutter)            │
│   → /api/v1/mobile/...            │
└──────────────────────────────────┘
```

### Request Flow (Dashboard)

1. Browser memuat halaman Next.js; better-auth memvalidasi session cookie.
2. Middleware Next.js memastikan user terautentikasi dan memiliki Active Workspace; jika tidak → redirect login / Access Denied.
3. Komponen memanggil BFF route (`app/api/...`) di Next.js.
4. BFF mengambil session better-auth, menyusun **internal JWT** bertanda tangan (HS256, secret bersama) berisi `user_id`, `workspace_id`, `roles`, lalu meneruskan ke Express.
5. Express memverifikasi signature internal JWT, me-resolve workspace, mengecek permission + scope, menjalankan handler, dan mengembalikan response standar.
6. BFF meneruskan response ke browser.

### Auth Boundary

- **Dashboard requests:** Express mempercayai **internal JWT** dari BFF (signature-verified) untuk identitas user, tetapi tetap melakukan permission & scope check sendiri (defense in depth, R3/R17).
- **Mobile/direct requests:** Express memverifikasi session/token better-auth sesuai mekanisme auth (di luar fokus utama dashboard, namespace `/mobile`).

### Monorepo Layout

```text
Absen Application/
├─ Apps/
│  ├─ backend/                         # Express API (TypeScript)
│  │  ├─ src/
│  │  │  ├─ index.ts                   # bootstrap, mount routers, error handler
│  │  │  ├─ config/                    # env, prisma client, supabase client
│  │  │  ├─ middleware/                # requestId, auth, workspace, rbac, scope, rateLimit, error
│  │  │  ├─ modules/<domain>/          # routes.ts, controller.ts, service.ts, schema.ts (Zod)
│  │  │  ├─ jobs/                      # node-cron jobs + export worker
│  │  │  ├─ lib/                       # response, errors, permissions, datetime/timezone, audit
│  │  │  └─ prisma/                    # schema.prisma, migrations, seed.ts
│  │  └─ tests/                        # vitest + supertest
│  └─ website/                         # Next.js (existing)
│     ├─ app/(auth)/login, /forgot-password, /reset-password, /activate
│     ├─ app/(dashboard)/overview, live-attendance, workforce, departments,
│     │     locations, shifts, leave, reports, exports, settings, audit-log, account
│     ├─ app/api/                      # BFF/proxy route handlers → Express
│     ├─ components/                   # shadcn + domain components (tables, charts, forms)
│     ├─ lib/                          # api client, auth helpers, permission guards, zod schemas
│     └─ prisma/                       # better-auth schema (existing)
└─ packages/
   └─ db/                              # (v1.1) shared Prisma — mulai di backend dulu
```

> Keputusan: Prisma schema dimulai di `Apps/backend/src/prisma` untuk v1, dengan opsi refactor ke `packages/db` saat stabil (sesuai jawaban B5/T2).

---

## Data Model

Semua tabel aplikasi memakai **UUID** primary key (T1), kolom `created_at`/`updated_at`, dan `workspace_id` pada tabel ber-tenant (R4). Auth ditangani tabel **better-auth** (`user`, `session`, `account`, `verification`); entity aplikasi memakai `UserProfile` dengan relasi `auth_user_id` (T2).

### Entity Relationship (ringkas)

```text
Tenant 1───* Workspace 1───* UserProfile *───1 (better-auth user)
                  │
                  ├─* Department
                  ├─* Location ───* EmployeeWfhLocation *─── Employee
                  ├─* Shift
                  ├─* Employee 1───* AttendanceLog
                  │                └─* AttendanceRawLog
                  │            1───* LeaveRequest
                  ├─* RoleAssignment *───* Permission   (via RoleAssignmentPermission)
                  ├─* HolidayCalendar
                  ├─* ExportJob
                  ├─* Notification
                  ├─* WorkspaceSetting (1:1)
                  └─* AuditLog
```

### Tabel Inti

**Tenant** — `id`, `name`, `slug`, `status`, `plan`, `created_at`, `updated_at`. (Dibuat di v1 walau Platform Admin ditunda — T3.)

**Workspace** — `id`, `tenant_id`, `name`, `timezone` (default `Asia/Jakarta`), `default_geofence_radius`, `default_grace_period`, `default_absence_cutoff_minutes` (default 120), `wfh_enabled`, `hybrid_enabled`, `status`, timestamps.

**UserProfile** — `id`, `workspace_id` (nullable untuk multi-WS), `auth_user_id` (FK ke better-auth user), `full_name`, `phone`, `account_status` (`Pending_Activation` | `Active` | `Disabled` | `No_Login_Access`), `last_login_at`, timestamps.

**RoleAssignment** — `id`, `workspace_id`, `auth_user_id`, `role` (`stakeholder` | `support_admin` | `end_user`), `scope_type` (`workspace` | `department` | `location`), `scope_id` (nullable untuk workspace), timestamps. Multi-row per user (R3.9).

**Permission** — `id`, `key` (enum 15 permission), `label`. Seed statis.

**RoleAssignmentPermission** — `id`, `role_assignment_id`, `permission_id`. Join granular permission ke scope tertentu (T6/T7) → permission dapat berbeda per scope.

**Department** — `id`, `workspace_id`, `name`, `status` (`Active`|`Inactive`), timestamps. Single-level (R8.3).

**Location** — `id`, `workspace_id`, `name`, `type` (`Office`|`Branch`|`WFHApproved`), `address`, `latitude`, `longitude`, `radius_meters` (50–500), `status` (`Active`|`Inactive`), `created_by`, `updated_by`, timestamps.

**Shift** — `id`, `workspace_id`, `name`, `start_time` (time lokal), `end_time` (time lokal), `break_minutes` (nullable), `grace_period_minutes` (default 10), `checkout_tolerance_minutes` (default 60), `absence_cutoff_minutes` (nullable override), `work_days` (string[] enum hari), `effective_from` (date), `status` (`Active`|`Inactive`), timestamps. Shift malam: `end_time < start_time` menandakan lintas tengah malam (R10.7).

**Employee** — `id`, `workspace_id`, `user_profile_id` (nullable), `employee_code` (unik per workspace, format `EMP-YYYY-0001`), `full_name`, `email`, `phone`, `position`, `department_id`, `employment_status` (`Active`|`Inactive`|`Suspended`|`Archived`), `assigned_location_id` (primary WFO), `assigned_shift_id`, `work_mode` (`WFO`|`WFH`|`Hybrid`), `face_profile_status` (`NotRegistered`|`Registered`|`NeedReEnrollment`), `joined_at`, `inactive_at`, timestamps.

**EmployeeWfhLocation** — `id`, `employee_id`, `location_id`, timestamps. Pivot many-to-many, dibatasi maks 3 per employee (T8/R9.13).

**AttendanceLog** (final, read-only dari dashboard) — `id`, `workspace_id`, `employee_id`, `attendance_date`, `shift_id`, `check_in_at` (UTC), `check_out_at` (UTC), `check_in_lat/lng`, `check_out_lat/lng`, `location_id`, `work_mode`, `face_check_status`, `geofence_status`, `spoofing_status`, `sync_status`, `original_check_in_at`, `synced_at`, `status` (enum AttendanceStatus), `notes` (admin note), timestamps.

**AttendanceRawLog** (semua attempt mentah dari mobile) — `id`, `workspace_id`, `employee_id`, `event_type` (`check_in`|`check_out`), `raw_payload_json`, `device_time`, `server_received_at`, `face_result`, `geofence_result`, `spoofing_result`, `is_duplicate`, `is_invalid_sequence`, `resulting_attendance_log_id` (nullable), `created_at`. (T10/R6.10) Memisahkan jejak mentah dari hasil final.

**LeaveRequest** — `id`, `workspace_id`, `employee_id`, `type` (configurable, seed default), `start_date`, `end_date`, `reason`, `attachment_url`, `status` (`Pending`|`Approved`|`Rejected`|`Cancelled`), `approver_id`, `approved_at`, `rejected_at`, `notes`, `conflict_note`, `source` (`mobile`|`dashboard`), timestamps.

**LeaveType** — `id`, `workspace_id`, `name`, `requires_attachment` (default false), `status`. Seed: Sakit, Cuti Tahunan, Izin Pribadi, Dinas Luar, WFH Request, Lainnya.

**HolidayCalendar** — `id`, `workspace_id`, `date`, `name`, `recurring_yearly` (bool), `status`, timestamps. (T4)

**ExportJob** — `id`, `workspace_id`, `requested_by`, `report_type`, `filters_json`, `format` (`xlsx`|`csv`), `row_count`, `status` (`Queued`|`Processing`|`Completed`|`Failed`|`Expired`), `file_path`, `signed_url_expires_at`, `requested_at`, `completed_at`, `error_message`. (T5)

**WorkspaceSetting** — `id`, `workspace_id` (unik), `late_calculation_policy`, `missing_checkout_policy`, `export_permissions_json`, `display_settings_json`, timestamps. Field effective-dated dikelola lewat versi (lihat Effective-Dated Strategy).

**Notification** — `id`, `workspace_id`, `recipient_auth_user_id`, `type` (`leave_request_new`|`export_completed`), `ref_id`, `is_read`, `created_at`. (V3/R21)

**AuditLog** (append-only) — `id`, `workspace_id`, `actor_user_id`, `action`, `entity_type`, `entity_id`, `old_value` (jsonb, hanya field berubah), `new_value` (jsonb), `ip_address`, `user_agent`, `request_id`, `created_at`. Retensi ≥ 1 tahun (Y2). Tidak menyimpan field sensitif (R14.3).

### Enums

```text
EmploymentStatus : Active | Inactive | Suspended | Archived
AccountStatus    : Pending_Activation | Active | Disabled | No_Login_Access
FaceProfileStatus: NotRegistered | Registered | NeedReEnrollment
AttendanceStatus : Present | Late | Absent | PendingCheckout | MissingCheckout | Leave | Invalid
WorkMode         : WFO | WFH | Hybrid
LocationType     : Office | Branch | WFHApproved
ActiveStatus     : Active | Inactive
LeaveStatus      : Pending | Approved | Rejected | Cancelled
WorkspaceRole    : stakeholder | support_admin | end_user
ScopeType        : workspace | department | location
ExportStatus     : Queued | Processing | Completed | Failed | Expired
```

### Effective-Dated Strategy (R13.5, R15.11)

Field effective-dated (grace period, attendance policy, shift rule, checkout tolerance, absence cut-off, work day) tidak di-mutate in place. Aturan utama disimpan pada **Shift** dengan `effective_from`; perubahan membuat baris shift baru / versi baru sehingga attendance lama memakai aturan yang berlaku pada `attendance_date`. Perhitungan status selalu menyelesaikan "shift rule yang berlaku pada attendance_date".

---

## Authorization Design

### Permission Resolution

```text
function can(user, permission, target?):
  if user.isStakeholder(workspace): return true          # implicit all (R3.2)
  assignments = RoleAssignment[user, workspace]
  for a in assignments:
    if permission in a.permissions:                       # via RoleAssignmentPermission
       if a.scope_type == 'workspace': return true
       if target matches a.scope (dept/location): return true
  return false
```

### Scope Filtering (OR logic, X1)

```text
function scopeFilter(user, workspace):
  if user.hasWorkspaceScope(): return { workspace_id }     # full workspace
  deptIds = scoped department ids
  locIds  = scoped location ids
  return { workspace_id, OR: [ department_id in deptIds, assigned_location_id in locIds ] }
```

- Visibilitas data = UNION (OR) department/location scope.
- Aksi sensitif tetap butuh permission valid + target dalam scope.
- Approval leave: butuh `approve_leave` **dan** scope atas employee pengaju; jika tidak → FORBIDDEN (X3/R3.13/R11.5).

### Middleware Chain (Express)

```text
requestId            # generate request_id, attach to ctx + logs (R18.4)
verifyAuth           # dashboard: verify internal JWT signature; mobile: verify session/token
resolveWorkspace     # set Active Workspace; reject if missing (R4)
requirePermission(p) # 403 + audit failed_permission_check (R3.11)
enforceScope         # inject scopeFilter into query; cross-workspace → 403 + security audit (R4.6)
handler
errorHandler         # map errors → standard error response
```

### UI Permission Behavior (R13.3)

Setting/aksi yang tak diizinkan tetap **ditampilkan disabled**, bukan disembunyikan. BFF menyertakan permission map dari `/me`; komponen membaca map untuk menentukan state disabled.

---

## API Design

### Conventions

- Base path `/api/v1`; namespace `/dashboard`, `/mobile`, `/shared` (U1).
- Success: `{ "success": true, "data": ..., "message": "OK" }`.
- Error: `{ "success": false, "error": { "code": "...", "message": "..." } }`.
- Error codes (U5): `VALIDATION_ERROR`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `LOCKED`, `EXPIRED_TOKEN`, `INTERNAL_ERROR`.
- Pagination (U6): `{ data: [...], pagination: { page, page_size, total, total_pages } }`, default `page_size=25`.
- Date filter (U7): `start_date`/`end_date` (`YYYY-MM-DD`, inklusif), dikonversi ke rentang UTC per timezone workspace.
- Semua input divalidasi Zod (R18.8).

### Endpoint Map (dashboard namespace)

| Domain | Method & Path | Permission |
| --- | --- | --- |
| Auth/Me | `GET /me`, `GET /workspaces/current` | authenticated |
| Account | `GET /account`, `POST /account/change-password` | authenticated |
| Dashboard | `GET /dashboard/summary\|attendance-trend\|department-breakdown\|live-preview` | `view_dashboard` |
| Attendance | `GET /attendance`, `GET /attendance/:id`, `GET /attendance/export`, `POST /attendance/:id/adjustment-note` | `view_live_attendance` (+ note perm) |
| Employees | `GET/POST /employees`, `GET/PATCH /employees/:id`, `PATCH /employees/:id/status`, `POST /employees/:id/resend-invite` | `view_employees` / `manage_employees` |
| Departments | `GET/POST /departments`, `PATCH /departments/:id`, `PATCH /departments/:id/status` | `manage_employees` (atau perm khusus) |
| Locations | `GET/POST /locations`, `GET/PATCH /locations/:id`, `PATCH /locations/:id/status` | `manage_locations` / `manage_geofence` |
| Shifts | `GET/POST /shifts`, `GET/PATCH /shifts/:id`, `POST /shifts/:id/assign` | `manage_shifts` / `manage_grace_period` |
| Leave | `GET /leave-requests`, `GET /leave-requests/:id`, `POST /leave-requests`, `PATCH /leave-requests/:id/approve\|reject\|cancel` | `approve_leave` (+scope) |
| Reports | `GET /reports/attendance-summary\|daily-detail\|late\|missing-checkout\|leave\|department`, `GET /reports/preview`, `POST /reports/export` | `view_reports` / `export_reports` |
| Exports | `GET /exports`, `GET /exports/:id` | `export_reports` |
| Settings | `GET/PATCH /settings/workspace`, `GET /settings/holidays`, `POST /settings/holidays` | per-setting permission |
| Roles | `GET/POST /settings/roles`, `DELETE /settings/roles/:id` | stakeholder only |
| Audit | `GET /audit-logs`, `GET /audit-logs/:id` | `view_audit_logs` |
| Notifications | `GET /notifications`, `POST /notifications/:id/read` | authenticated |

### Mobile/Shared (kontrak minimal — U2)

| Path | Deskripsi |
| --- | --- |
| `POST /mobile/attendance/check-in` | Tulis attempt → AttendanceRawLog, hitung status, buat/inci AttendanceLog |
| `POST /mobile/attendance/check-out` | Tulis check-out attempt, update AttendanceLog |
| `POST /mobile/leave-requests` | Pengajuan leave dari karyawan |
| `GET /shared/leave-types` | Daftar leave type workspace |

Detail penuh mobile berada di spec mobile terpisah; dashboard hanya mengonsumsi `AttendanceLog`.

---

## Component Design (Frontend)

- **App Router groups:** `(auth)` untuk login/activate/reset; `(dashboard)` untuk halaman ber-proteksi dengan layout + sidebar.
- **Sidebar:** item dirender berdasarkan permission map; item tanpa permission tampil disabled (R13.3).
- **Tables:** TanStack Table + server-side pagination/sorting/filtering; default 25 baris (S5/R16.7).
- **Charts:** Recharts untuk trend & department breakdown (S2).
- **Forms:** React Hook Form + Zod resolver; skema Zod dibagikan ke backend bila memungkinkan (S4/R18.8).
- **Maps:** Leaflet + OpenStreetMap untuk Location, dengan input lat/long manual sebagai fallback (R9.3).
- **Polling:** Live Attendance polling 10 detik; dashboard summary refresh saat load + manual, opsional polling 60 detik (Y1/R6.2).
- **Empty/Error states:** komponen empty state + error boundary global (R18.6/R19.9).
- **i18n-ready:** teks lewat dictionary Indonesia; struktur siap bilingual (R19.3).

---

## Background Jobs

Implementasi `node-cron` di Express worker (O3):

| Job | Frekuensi | Fungsi |
| --- | --- | --- |
| `absentJob` | tiap 15 menit | Tandai Absent untuk employee aktif tanpa check-in valid melewati absence cut-off & tanpa leave approved (R15.6) |
| `missingCheckoutJob` | tiap 30 menit | Tandai Missing Checkout setelah shift end + checkout tolerance (R15.7) |
| `dailySummaryJob` | tiap malam (timezone workspace) | Pra-agregasi summary harian (R15.8) |
| `exportWorker` | event/queue | Proses ExportJob async > 5.000 row, upload ke Storage, set signed URL (R12.8–10) |
| `cleanupJob` | harian | Hapus file export > 7 hari, set status Expired; pertahankan history ≥ 30 hari (R12.11–12) |

Job memakai timezone workspace untuk menentukan batas hari & cut-off; semua timestamp tersimpan UTC.

---

## Attendance Status Calculation

```text
on check-in (mobile write):
  resolve shift rule effective on attendance_date (anchor: shift start date for overnight)
  if face fail OR spoofing OR outside geofence OR suspicious sync: status = Invalid
  else if check_in_at <= shift_start + grace_period: status = Present
  else: status = Late
  store first valid check-in; extras → AttendanceRawLog (is_duplicate=true)

pending: valid check-in & no check-out → PendingCheckout (display/runtime)

absentJob (15m):
  for active employees with assigned shift, no valid check-in past (shift_start + absence_cutoff),
  no approved leave, not holiday → status = Absent

missingCheckoutJob (30m):
  valid check-in, no check-out, now > (shift_end + checkout_tolerance) → MissingCheckout

leave approved → Leave for covered dates (does not auto-overwrite existing attendance; conflict_note)
```

Backend adalah source of truth; dashboard hanya membaca status final (R15.1/R15.12).

---

## Storage & File Handling

- **Buckets privat:** `exports/`, `leave-attachments/`.
- **Akses:** hanya via signed URL dengan expiry; export 24 jam (R12.10), pembuat saja yang berhak (R17.6).
- **Upload attachment:** validasi tipe (PDF/JPG/PNG) & ukuran ≤ 5 MB; tanpa virus scan di v1 (R17.7).
- **Retensi export:** file 7 hari (auto-cleanup), history ≥ 30 hari (R12.11–12).

---

## Email & Notifications

- **Provider:** Resend (fallback SMTP). Jika belum siap, generate link aktivasi/reset dan tampilkan ke HR untuk dibagikan manual (V1/V2).
- **Email events:** invitation aktivasi (berlaku 7 hari, resend membatalkan token lama — R2), reset password (berlaku 30 menit — R1.9/R1.11).
- **In-app:** badge leave request baru & export selesai, di-scope ke Active Workspace + permission (R21).

---

## Security Design

- Session better-auth (24 jam / remember me 7 hari), auto-extend selama aktif (R1.3–1.5).
- Login lockout 5x/15 menit → lock 15 menit; rate limit per IP & email (R1.7–1.8).
- Pesan login generik untuk mencegah user enumeration (R1.2).
- Internal JWT BFF→Express bertanda tangan; Express verifikasi signature + permission/scope (R17.2).
- RLS Supabase untuk tabel inti sebelum production; backend tetap filter `workspace_id` (R4.3–4.4).
- Cross-workspace access → FORBIDDEN + security audit log (R4.6).
- Tanpa hard delete; lifecycle status untuk data penting (R17.8).
- Timestamp attendance asli tidak diubah; admin note saja (R6.6–6.7/R15).
- Rate limit endpoint sensitif (login, export, role management) (R17.3).

---

## Error Handling

- Error handler global memetakan exception ke error code standar + `request_id`.
- Validasi Zod → `VALIDATION_ERROR` dengan detail field.
- Otorisasi → `UNAUTHENTICATED`/`FORBIDDEN`; lockout → `LOCKED`; token kedaluwarsa → `EXPIRED_TOKEN`.
- Konflik unik (email/employee_code, overlap leave) → `CONFLICT`.
- Export gagal → status `Failed` + `error_message`, dapat di-retry (R17.10).
- Structured JSON logs dengan `request_id` di setiap entri (R18.4–18.5).

---

## Testing Strategy

| Layer | Tool | Fokus |
| --- | --- | --- |
| Unit/Integration | Vitest | service logic, permission resolution, scope filter (OR), status calculation, effective-dated rules |
| API | Supertest | endpoint auth guard, validation, pagination, error shape |
| E2E | Playwright | login/lockout/reset, role-based navigation, live attendance filter, export flow |
| DB | Prisma seed | data uji deterministik |

Prioritas (R18.10): auth guard, role/permission, workspace isolation (cross-workspace FORBIDDEN), attendance status calculation, leave approval permission+scope, export permission, scope OR behaviour.

---

## Seeding & Bootstrap (W1–W3)

Seed script membuat:

- Tenant: `PT Inovasi Kerja Digital`; Workspace sama, timezone `Asia/Jakarta`.
- Stakeholder: `admin@attendx.test` (password dev `Password123!`, wajib diganti via reset di production).
- 3 departments, 2 locations, 2 shifts, 20 employees, 30 hari dummy attendance, 5 leave requests, 1 Stakeholder + 2 Support Admin dengan scope berbeda.
- Permission catalog (15 permission) + leave types default.

---

## Phasing (ringkas, sesuai PRD/PLANING)

- **Phase 0:** struktur backend TS, Prisma schema + migration + seed, better-auth wiring, middleware skeleton, BFF/proxy, CI (GitHub Actions: install→lint→typecheck→test→build).
- **Phase 1:** login/session/reset/lockout, active workspace, permission map `/me`, layout + sidebar, overview dashboard, account page.
- **Phase 2:** employees (invite/activation), departments, locations (+Leaflet), shifts (+assign), warnings.
- **Phase 3:** live attendance table + filters + detail + polling + admin note + AttendanceRawLog read.
- **Phase 4:** leave approval (scope+permission), reports + preview, export sync/async + ExportJob + Storage + Export History.
- **Phase 5:** settings + effective-dated, role/permission management (stakeholder), audit log + filter, jobs (absent/missing/cleanup), RLS production, hardening, performance.

---

## Requirements Coverage Map

| Requirement | Design Section |
| --- | --- |
| R1 Auth & Session | Security Design, Email & Notifications |
| R2 Activation | Email & Notifications, Data Model (AccountStatus) |
| R3 Authorization | Authorization Design |
| R4 Multi-Tenant | Architecture (Auth Boundary), Security, Data Model |
| R5 Overview | Component Design, API (dashboard) |
| R6 Live Attendance | API, Component Design, Data Model (AttendanceRawLog) |
| R7 Workforce | Data Model (Employee), API |
| R8 Departments | Data Model, API |
| R9 Locations & Geofence | Data Model, Component (Leaflet), API |
| R10 Shifts | Data Model (effective-dated), API |
| R11 Leave | Data Model, Authorization (scope), API |
| R12 Reports & Export | Storage, Jobs, API |
| R13 Settings | Effective-Dated Strategy, Authorization (UI behavior) |
| R14 Audit Log | Data Model (AuditLog), Middleware |
| R15 Status Calculation | Attendance Status Calculation, Jobs |
| R16 Performance | Component Design, API (pagination) |
| R17 Security & Reliability | Security Design, Storage |
| R18 API & Observability | API Design, Error Handling, Testing |
| R19 UI/UX & A11y | Component Design |
| R20 Account & Profile | API (account), Component Design |
| R21 Notifications | Email & Notifications, Data Model (Notification) |
