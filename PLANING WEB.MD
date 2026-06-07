# PLANNING IMPLEMENTASI — AttendX Web Dashboard v1

**Project:** AttendX — Sistem Absensi Digital Karyawan (SaaS)
**Scope dokumen:** Web Dashboard v1 (HR/Admin Workspace)
**Basis:** `PRD.md` + jawaban klarifikasi (`PERTANYAAN PLANNING WEB.md`)
**Versi:** 1.0

---

## 1. Ringkasan Keputusan Teknis (Locked untuk v1)

| Area | Keputusan v1 | Ditunda ke v1.1 |
| --- | --- | --- |
| Auth | `better-auth` (Prisma + PostgreSQL), pertahankan yang sudah ada | Firebase/Supabase Auth |
| Identitas user | Field `firebase_uid` → diganti `auth_user_id` (mengikuti better-auth) | — |
| Pembuatan akun karyawan | Invite/manual oleh HR/Stakeholder dari dashboard | Auto-provision dari mobile |
| API | Express.js di `Apps/backend` | — |
| Web | Next.js (`Apps/website`) untuk UI + BFF/proxy ringan | — |
| Alur request | Browser → Next.js Dashboard → BFF/Proxy → Express API → DB | — |
| Prisma & DB | Mulai di `Apps/backend`, refactor ke `packages/db` saat stabil | Package `packages/db` final |
| Database | Supabase PostgreSQL managed | — |
| RLS | Wajib aktif untuk tabel inti sebelum production; backend tetap permission check | RLS lanjutan |
| Permission | RBAC + granular permission + scope (workspace/department/location) | — |
| Real-time | Polling 10 detik | WebSocket |
| Status attendance | Dihitung di backend (write + scheduled job), dashboard read-only | — |
| Attendance correction | Hanya admin note di v1 | Correction request + approval |
| Leave approval | Single approver | Multi-level approval |
| Pengajuan tanggal lampau | Tidak diizinkan default | Setting workspace |
| Map | Leaflet + OpenStreetMap + fallback input manual lat/long | — |
| WFH location | Ditentukan HR/Stakeholder | Request oleh karyawan |
| Export | Excel/XLSX + CSV (PDF ditunda) | PDF export |
| Export async | > 5.000 row async, max 50.000 row/request, file di Supabase Storage + signed URL | Email notification |
| Import karyawan | Tidak ada (manual CRUD) | Import Excel/CSV |
| Bahasa UI | Indonesia (struktur disiapkan bilingual) | Bilingual penuh |
| Timezone | Per-workspace, simpan UTC, tampilkan sesuai workspace | Multi-timezone per workspace |
| Switch workspace | Tidak ada (satu Active Workspace) | Multi-workspace switch |
| Testing | Vitest, Supertest, Playwright, Prisma seed | — |
| Super Admin / Platform Admin | Tidak masuk v1 | v1.1 / modul terpisah |

---

## 2. Arsitektur Sistem

### 2.1 Diagram Alur

```text
┌──────────────┐     ┌─────────────────────┐     ┌───────────────┐     ┌──────────────┐
│   Browser    │ ──> │  Next.js Dashboard  │ ──> │  Express API  │ ──> │  Supabase    │
│  (HR/Admin)  │     │  (UI + BFF/Proxy)   │     │  (/api/v1)    │     │  PostgreSQL  │
└──────────────┘     └─────────────────────┘     └───────────────┘     └──────────────┘
                            │  better-auth                │  JWT verify + RBAC + scope
                            │  session cookie             │  workspace_id filter + RLS
                            ▼                              ▼
                     middleware auth              middleware: auth → workspace → role → scope

        Mobile App (Flutter) ─────────────────────────────> Express API (write AttendanceLog)
```

### 2.2 Pembagian Tanggung Jawab

- **Next.js (`Apps/website`)**: rendering halaman dashboard, server components untuk data awal, client components untuk tabel/filter/chart/form, middleware proteksi route, BFF/proxy untuk meneruskan request ke Express dengan session yang aman.
- **Express (`Apps/backend`)**: sumber kebenaran business logic, REST API `/api/v1`, verifikasi token, RBAC + scope check, perhitungan status attendance, generate export.
- **Supabase PostgreSQL**: penyimpanan data, RLS sebagai lapisan keamanan multi-tenant, storage untuk file export.
- **Mobile (Flutter)**: sumber AttendanceLog (di luar scope dashboard, hanya konsumsi data).

### 2.3 Struktur Monorepo Target

```text
Absen Application/
├─ Apps/
│  ├─ backend/                 # Express API (/api/v1)
│  │  ├─ src/
│  │  │  ├─ index.ts
│  │  │  ├─ config/            # env, db client, supabase storage
│  │  │  ├─ middleware/        # auth, workspace, rbac, scope, errorHandler, rateLimit
│  │  │  ├─ modules/           # per domain: dashboard, attendance, employees, locations,
│  │  │  │                     #   shifts, leave, reports, settings, audit, roles
│  │  │  │   └─ <module>/      #   routes.ts, controller.ts, service.ts, schema.ts
│  │  │  ├─ jobs/              # scheduled jobs (absent, missing checkout, export worker)
│  │  │  ├─ lib/               # helpers (response, errors, permissions, dates/timezone)
│  │  │  └─ prisma/            # schema.prisma, migrations, seed.ts  (sementara di sini)
│  │  └─ tests/                # vitest + supertest
│  ├─ website/                 # Next.js dashboard (existing)
│  │  ├─ app/
│  │  │  ├─ (auth)/login/
│  │  │  ├─ (dashboard)/
│  │  │  │   ├─ overview/
│  │  │  │   ├─ live-attendance/
│  │  │  │   ├─ workforce/
│  │  │  │   ├─ locations/
│  │  │  │   ├─ shifts/
│  │  │  │   ├─ leave/
│  │  │  │   ├─ reports/
│  │  │  │   ├─ settings/
│  │  │  │   └─ audit-log/
│  │  │  └─ api/                # BFF/proxy route handlers → Express
│  │  ├─ components/            # shadcn ui + komponen domain
│  │  ├─ lib/                   # api client, auth, permission guards (client)
│  │  └─ prisma/                # auth schema (better-auth) — existing
│  └─ app_flutter/             # mobile (di luar scope dashboard v1)
└─ packages/
   └─ db/                       # (v1.1) Prisma schema & client yang dishare
```

> Catatan: backend saat ini hanya `index.js` + Express. Phase 0 mengonversi ke struktur TypeScript modular di atas dan menambahkan Prisma.

---

## 3. Penyesuaian Data Model (vs PRD)

Mengikuti PRD bagian 5, dengan penyesuaian hasil klarifikasi:

### 3.1 Perubahan & Penambahan Field

- **User**: `firebase_uid` → `auth_user_id` (mengikuti better-auth). Hapus ketergantungan Firebase.
- **Workspace**: tambah field policy yang berlaku "mulai tanggal efektif" agar perubahan tidak mengubah histori (lihat 3.3).
- **RoleAssignment**: digunakan multi-row untuk mendukung banyak scope per Support Admin.
- **Permission**: tambah mekanisme granular permission (lihat bagian 4).
- **Employee**: `employment_status` enum = `Active | Inactive | Suspended | Archived`.
- **AttendanceLog**: read-only dari dashboard; `notes` dipakai untuk admin note v1.
- **ExportJob** (baru): untuk async export.
- **AuditLog**: tambah pencatatan percobaan akses lintas workspace (security audit).

### 3.2 Enum Penting

```text
EmploymentStatus : Active | Inactive | Suspended | Archived
FaceProfileStatus: NotRegistered | Registered | NeedReEnrollment
AttendanceStatus : Present | Late | Absent | PendingCheckout | MissingCheckout | Leave | Invalid
WorkMode         : WFO | WFH | Hybrid
LocationType     : Office | Branch | WFHApproved
LocationStatus   : Active | Inactive
ShiftStatus      : Active | Inactive
LeaveStatus      : Pending | Approved | Rejected | Cancelled
LeaveType        : Sakit | CutiTahunan | IzinPribadi | DinasLuar | WFHRequest | Lainnya  (configurable, seed default)
WorkspaceRole    : stakeholder | support_admin | end_user
ScopeType        : workspace | department | location
ExportStatus     : Queued | Processing | Completed | Failed | Expired
```

### 3.3 Aturan "Effective Dated" vs "Langsung Berlaku"

**Berlaku mulai tanggal efektif (tidak mengubah histori):**
- Grace period, attendance calculation policy, shift rule, checkout tolerance, absence cut-off, work day policy.
- Implementasi: simpan `effective_from` pada shift/policy; perhitungan attendance memakai aturan yang berlaku pada `attendance_date`.

**Langsung berlaku (hanya untuk attendance/assignment baru):**
- Workspace name, dashboard display, export permission, role permission, WFH mode enable/disable, geofence radius, location active/inactive.

**Aturan invarian:** perubahan setting tidak boleh mengubah hasil attendance historis. Attendance lama selalu memakai aturan yang berlaku saat dibuat.

---

## 4. Model Role, Permission & Scope

### 4.1 Role Dasar (RBAC)

- `stakeholder` — owner workspace, akses penuh, satu-satunya yang bisa memberi/mencabut permission & role.
- `support_admin` — HR admin, akses terbatas sesuai granular permission + scope.
- `end_user` — karyawan, tidak akses dashboard web v1.

### 4.2 Granular Permission v1

```text
# Action permissions
manage_employees
manage_locations
manage_shifts
manage_geofence
manage_wfh_mode
manage_grace_period
manage_attendance_policy
approve_leave
export_reports
manage_roles

# View permissions
view_dashboard
view_live_attendance
view_reports
view_employees
view_audit_logs
```

### 4.3 Aturan Permission

1. Stakeholder otomatis punya semua permission (implicit), tidak perlu assignment eksplisit.
2. Support Admin hanya punya permission yang diberikan eksplisit oleh Stakeholder.
3. Support Admin **tidak boleh** memberi/mencabut permission (`manage_roles` tetap tidak mengizinkan privilege escalation ke sesama support admin di v1 — hanya Stakeholder).
4. Setiap setting/aksi sensitif dicek terhadap permission spesifiknya (mis. ubah geofence → `manage_geofence`).
5. **UI behavior:** setting yang tidak dimiliki permission-nya tetap **ditampilkan dalam keadaan disabled**, bukan disembunyikan.

### 4.4 Scope

- Scope disimpan sebagai multi-row `RoleAssignment` (`scope_type` + `scope_id`).
- Satu Support Admin bisa punya banyak scope: beberapa department + beberapa location sekaligus.
- Resolusi data: query difilter ke himpunan department/location yang ada dalam scope user. Jika scope = workspace → seluruh workspace.

### 4.5 Middleware Chain (Express)

```text
request → authenticate (verify session/JWT)
        → resolveActiveWorkspace (workspace_id wajib)
        → requireRole / requirePermission(<perm>)
        → enforceScope (filter department/location)
        → handler
```

- Setiap request yang menyentuh data di luar Active Workspace → **403 FORBIDDEN** + dicatat sebagai security audit log.

---

## 5. Keamanan & Multi-Tenant Isolation

1. Semua tabel inti wajib punya `workspace_id`.
2. Query wajib difilter `workspace_id` aktif di backend (lapisan pertama).
3. RLS Supabase diaktifkan untuk: `Workspace`, `Employee`, `AttendanceLog`, `LeaveRequest`, `Location`, `Shift`, `RoleAssignment` (lapisan kedua) sebelum production.
4. Backend tetap melakukan permission/scope check walau RLS aktif (defense in depth).
5. Tidak ada endpoint yang mengambil data global tanpa filter tenant/workspace.
6. Export mengikuti workspace + role scope.
7. Rate limiting pada endpoint sensitif (login, export, role management).
8. Session/cookie diamankan via Next.js BFF; client tidak memegang kredensial backend internal.
9. Data wajah tidak ditampilkan bebas; dashboard hanya menampilkan status verifikasi.
10. File export hanya bisa diakses pembuatnya (signed URL + cek ownership).
11. Percobaan akses lintas workspace dicatat sebagai security audit log.

---

## 6. Perhitungan Status Attendance

**Source of truth = backend.** Dashboard hanya membaca status final.

| Status | Kapan dihitung | Aturan |
| --- | --- | --- |
| Present | saat check-in masuk | check-in valid + face passed + lokasi valid |
| Late | saat check-in masuk | check-in valid tapi > jam masuk + grace period (per shift, effective dated) |
| Invalid | saat check-in masuk | face gagal / spoofing / di luar geofence / sync mencurigakan |
| PendingCheckout | runtime/label | ada check-in valid, belum check-out |
| MissingCheckout | scheduled job | belum check-out setelah jam pulang + checkout tolerance |
| Absent | scheduled job | karyawan aktif, tak ada check-in valid sampai cut-off, tidak sedang leave approved |
| Leave | dari approval | ada leave approved untuk tanggal tsb |

Catatan:
- Shift malam lintas tanggal → `attendance_date` mengikuti tanggal mulai shift.
- Check-in ganda → pakai check-in valid pertama, sisanya duplicate log.
- Offline sync → tampilkan original time + sync time, jangan ubah timestamp asli.
- Dashboard boleh menghitung label sementara untuk tampilan, tapi bukan source of truth.

---

## 7. Rencana Per Phase

### Phase 0 — Setup Fondasi
**Tujuan:** monorepo, DB, auth, dan base permission siap.

- Konversi `Apps/backend` ke TypeScript + struktur modular.
- Setup Prisma + koneksi Supabase PostgreSQL (sementara di `Apps/backend/prisma`).
- Definisi `schema.prisma` lengkap (semua entity + enum + ExportJob).
- Migration awal + seed script (workspace contoh, role, permission, shift, location, dummy attendance).
- Integrasi better-auth (pertahankan setup `website`), sesuaikan `User.auth_user_id`.
- Standar response sukses/error + error handler global.
- Middleware skeleton: authenticate, resolveActiveWorkspace, requirePermission, enforceScope.
- Setup testing: Vitest + Supertest (backend), Playwright (web).
- Setup BFF/proxy pattern di Next.js + API client.

**Deliverable:** repo jalan end-to-end (login → request ber-auth ke Express → DB), seed data tersedia.

### Phase 1 — Auth + Workspace + Overview Dashboard
- Halaman login + flow session + redirect expired/access denied.
- Middleware role guard di Next.js + Express.
- Active workspace context.
- Layout dashboard + sidebar navigation (item disabled sesuai permission).
- Endpoint: `/me`, `/workspaces/current`, `/dashboard/summary`, `/dashboard/attendance-trend`, `/dashboard/department-breakdown`, `/dashboard/live-preview`.
- Summary cards, trend chart (30 hari default), department breakdown, leave summary, live preview.
- Klik card "Late" → Live Attendance dengan filter status Late.
- Empty state untuk data kosong.

**Success:** Stakeholder lihat seluruh data workspace; Support Admin hanya sesuai scope; data dummy bisa diganti API tanpa ubah UI besar.

### Phase 2 — Workforce + Locations + Shifts
- Employees: list, create (invite), detail, update, change status (Active/Inactive/Suspended/Archived).
- Assign department, location, shift, role + work mode eligibility.
- Validasi email & employee_code unik per workspace.
- Locations: CRUD + activate/deactivate + radius (min 50 / max 500, default WFO 100 / WFH 150) + Leaflet map + fallback manual lat/long.
- Shifts: CRUD (no hard delete, lifecycle Active→Inactive) + grace period + checkout tolerance + work days + effective_from + assign ke karyawan.
- Warning untuk karyawan tanpa shift/lokasi.
- Endpoint employees/locations/shifts sesuai API contract PRD.

**Success:** karyawan aktif punya lokasi & shift; lokasi punya koordinat + radius; shift punya jam + grace period.

### Phase 3 — Live Attendance
- Tabel live attendance (kolom sesuai PRD 4.2).
- Filter: tanggal, status, divisi, lokasi, shift.
- Detail log: timestamp check-in/out, lokasi, face status, geofence status, sync status (original vs sync time).
- Polling 10 detik untuk update.
- Admin note (`POST /attendance/:id/adjustment-note`) → masuk audit log, timestamp asli tidak berubah.
- Endpoint: `/attendance`, `/attendance/:id`, `/attendance/export`, `/attendance/:id/adjustment-note`.

**Success:** data tampil sesuai workspace + scope; filter jalan; data workspace lain tidak pernah muncul.

### Phase 4 — Leave/Permit + Reports + Export
- Leave: list, detail, approve, reject (single approver, cek `approve_leave` + scope).
- Approved leave memengaruhi dashboard & report; approval masuk audit log.
- Pengajuan tanggal lampau ditolak default.
- Reports: Attendance Summary, Daily Detail, Late, Missing Checkout, Leave & Permit, Department.
- Export Excel/XLSX + CSV mengikuti filter + permission (`export_reports`).
- Export sync ≤ 5.000 row; async > 5.000 row (max 50.000) → ExportJob + worker + Supabase Storage + signed URL + halaman Export History.
- Empty state: file tetap punya header bila data kosong.

**Success:** approved leave memengaruhi dashboard/report; export sesuai filter; tidak bocor lintas divisi/workspace.

### Phase 5 — Settings + Audit Log + Hardening
- Workspace settings: name, timezone, default geofence radius, default grace period, WFH mode, hybrid mode, late policy, missing checkout policy, export permissions.
- Granular permission enforcement penuh pada setiap setting (disabled bila tak punya permission).
- Role management (hanya Stakeholder): assign/remove role + scope + permission.
- Proteksi: Stakeholder terakhir tidak bisa dihapus.
- Audit Log: list + filter (tanggal, actor, action) + detail (read-only).
- Security hardening: rate limit, RLS production, review isolation, scheduled jobs (absent, missing checkout).
- Performance: target initial load < 3s, filter < 1.5s, export 5.000 row < 10s, API p95 read < 500ms, Lighthouse ≥ 85.

**Success:** setting berlaku untuk attendance baru; audit log mencatat perubahan role/shift/lokasi/employee/setting; role guard stabil.

---

## 8. Ringkasan Endpoint API (`/api/v1`)

Mengikuti API contract PRD. Standar response:
```json
{ "success": true, "data": {}, "message": "OK" }
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Invalid input" } }
```

- **Auth/Me:** `GET /me`, `GET /workspaces/current`
- **Dashboard:** `GET /dashboard/summary|attendance-trend|department-breakdown|live-preview`
- **Attendance:** `GET /attendance`, `GET /attendance/:id`, `GET /attendance/export`, `POST /attendance/:id/adjustment-note`
- **Employees:** `GET/POST /employees`, `GET/PATCH /employees/:id`, `PATCH /employees/:id/status`
- **Locations:** `GET/POST /locations`, `GET/PATCH /locations/:id`, `PATCH /locations/:id/status`
- **Shifts:** `GET/POST /shifts`, `GET/PATCH /shifts/:id`, `POST /shifts/:id/assign`
- **Leave:** `GET /leave-requests`, `GET /leave-requests/:id`, `PATCH /leave-requests/:id/approve|reject`
- **Reports:** `GET /reports/attendance-summary|daily-detail|late|missing-checkout`, `GET /reports/export`
- **Settings:** `GET/PATCH /settings/workspace`, `GET/POST /settings/roles`, `DELETE /settings/roles/:id`
- **Audit (baru):** `GET /audit-logs`, `GET /audit-logs/:id`
- **Export jobs (baru):** `GET /exports`, `GET /exports/:id` (status + signed URL)

Semua endpoint melewati middleware: auth → workspace → permission → scope.

---

## 9. Strategi Testing

Framework: **Vitest** (unit/integration), **Supertest** (API Express), **Playwright** (E2E), **Prisma seed** (test data).

Prioritas test v1:
1. Auth guard (akses tanpa login ditolak).
2. Role & granular permission enforcement.
3. Workspace isolation (cross-workspace = FORBIDDEN + security log).
4. Perhitungan status attendance (present/late/absent/missing checkout, shift lintas hari, effective dated).
5. Leave approval permission + scope.
6. Export permission + filter + ownership file.
7. Forbidden cross-workspace access pada semua modul.

Target: setiap modul punya minimal happy path + 1 test isolation/permission.

---

## 10. Aturan Invarian (Wajib Dijaga)

1. Akses data di luar Active Workspace → selalu **FORBIDDEN** + security audit log.
2. AttendanceLog tidak boleh dihapus & timestamp asli tidak boleh diubah dari dashboard.
3. Shift & Location tidak boleh hard delete bila punya histori — hanya Active → Inactive.
4. Archived employee tetap muncul di laporan historis dengan badge "Archived".
5. Karyawan inactive tidak bisa check-in.
6. LeaveRequest jadi `Cancelled` hanya via aksi eksplisit.
7. Perubahan setting tidak mengubah hasil attendance historis.
8. Setting tanpa permission → tampil disabled, bukan disembunyikan.
9. Semua aksi penting (role, shift, lokasi, employee, setting, approval, admin note) → audit log + `workspace_id`.
10. Semua timestamp disimpan UTC, ditampilkan sesuai timezone workspace.
11. Export hanya mengambil data sesuai filter + permission + scope, dan hanya bisa diakses pembuatnya.

---

## 11. Open Items untuk v1.1 (Diparkir)

PDF export, switch multi-workspace, self-signup tenant, WebSocket real-time, full attendance correction workflow, request WFH location oleh karyawan, multi-level leave approval, import karyawan Excel/CSV, export audit log, email notification export, Super Admin / Platform Admin dashboard, bilingual penuh.

---

## 12. Langkah Berikutnya

1. Konfirmasi planning ini.
2. Mulai Phase 0: setup Prisma schema + migration + seed + struktur backend TypeScript.
3. Lanjut Phase 1 setelah fondasi auth + workspace terverifikasi.
