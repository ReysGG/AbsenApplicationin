# Implementation Plan — AttendX Web Dashboard v1

Catatan: tasks ini mengikuti fase di design.md. Item bertanda **[DEFAULT]** memakai keputusan sementara yang menunggu jawaban Putaran 3 di `PERTANYAAN PLANNING WEB.md` — bisa disesuaikan tanpa mengubah struktur tasks.

## Phase 0 — Fondasi Monorepo, DB, Auth, RBAC

- [x] 1. Setup struktur backend Express + TypeScript
  - Konversi `Apps/backend` ke TypeScript (tsconfig, tsx, build script), buat struktur folder `config/`, `middleware/`, `lib/`, `modules/`, `jobs/`, `prisma/`, `tests/`
  - Tambahkan entrypoint `src/index.ts` dengan Express app + health check `/api/v1/health`
  - _Requirements: 18.1_

- [x] 2. Setup Prisma + koneksi Supabase PostgreSQL
  - Inisialisasi Prisma di `Apps/backend/prisma`, konfigurasi datasource ke Supabase, env handling
  - Definisikan semua enum (EmploymentStatus, AccountStatus, AttendanceStatus, dll) sesuai design
  - _Requirements: 4.1, 17.4_

- [x] 3. Definisikan schema Prisma untuk seluruh entity inti
  - Tenant, Workspace, User, RoleAssignment, Permission, RoleAssignmentPermission, Employee, EmployeeWfhLocation, Department, Location, Shift, AttendanceLog, LeaveRequest, ExportJob, HolidayCalendar, AuditLog
  - Pastikan setiap tabel inti punya `workspace_id`, `created_at`, `updated_at`; PK uuid/cuid **[DEFAULT]**
  - Buat migration awal
  - _Requirements: 4.1, 4.8_

- [x] 4. Integrasikan better-auth dengan model User aplikasi
  - Hubungkan `User.auth_user_id` ke tabel better-auth; pertahankan setup auth di `Apps/website` **[DEFAULT]**
  - Konfigurasi email+password, session 24 jam / remember-me 7 hari, auto-extend
  - _Requirements: 1.1, 1.3, 1.4, 1.5, 17.4_

- [x] 5. Buat lib standar response, error, dan request pipeline
  - `lib/response.ts` (success/error shape), `lib/errors.ts` (error codes), `middleware/requestId.ts`, `middleware/logger.ts` (structured JSON), `middleware/errorHandler.ts`
  - _Requirements: 18.2, 18.3, 18.4, 18.5_

- [x] 6. Implementasikan middleware auth, workspace, RBAC, scope (skeleton + unit test)
  - `authenticate` (verifikasi user context dari BFF via HMAC header) **[DEFAULT]**, `resolveActiveWorkspace`, `requirePermission`, `enforceScope` (OR gabungan) **[DEFAULT]**
  - Helper `lib/permissions.ts` (Stakeholder implisit semua permission)
  - _Requirements: 3.1, 3.2, 3.3, 3.7, 3.10, 4.2, 4.6, 17.1, 17.2_
  - _Property: cross-workspace request selalu 403 + audit log_

- [x] 7. Setup BFF/proxy di Next.js + API client + auth client
  - Route handler `app/api/[...]` meneruskan request ke Express dengan menandatangani user context (user_id, workspace_id) **[DEFAULT]**
  - `lib/apiClient.ts`, `lib/authClient.ts`, `lib/permissionGuards.ts`
  - _Requirements: 18.7_

- [x] 8. Setup testing harness + CI
  - Vitest + Supertest (backend), Playwright (web), Prisma seed helper
  - GitHub Actions: install → lint → typecheck → test → build
  - _Requirements: 18.9, 18.10_

- [x] 9. Seed script bootstrap workspace + stakeholder + dummy data
  - Seed Tenant/Workspace (timezone `Asia/Jakarta` **[DEFAULT]**), Stakeholder, department/location/shift contoh, employee + attendance dummy untuk dev UI
  - _Requirements: 4.7_

## Phase 1 — Auth + Workspace + Overview Dashboard

- [x] 10. Implementasikan endpoint auth & me
  - `GET /me` (profil + permissions), `GET /workspaces/current`
  - _Requirements: 1.1, 3.2, 3.3, 4.7_

- [x] 11. Implementasikan flow login + lockout + rate limit
  - Login email/password, pesan generic, lockout 5x/15 menit, rate limit per IP & email
  - Audit: login_success, login_failed_due_to_lockout, logout
  - _Requirements: 1.1, 1.2, 1.7, 1.8, 1.12, 1.13, 14.1, 17.3_
  - _Property: kredensial salah tidak membocorkan keberadaan email_

- [x] 12. Implementasikan forgot/reset password
  - Request reset (link 30 menit), set password baru, invalidate semua sesi lama
  - _Requirements: 1.9, 1.10, 1.11_

- [x] 13. Halaman login, forgot-password, reset-password (Next.js)
  - Form RHF + Zod, error state bertekst, redirect ke last page setelah login
  - _Requirements: 1.6, 19.4, 19.6_

- [x] 14. Layout dashboard + sidebar + route guard
  - Layout `(dashboard)`, sidebar dengan item disabled sesuai permission, middleware proteksi route + redirect session expired
  - _Requirements: 3.4, 3.11, 13.3, 19.1, 19.3_

- [x] 15. Endpoint dashboard summary & trend & breakdown & preview
  - `GET /dashboard/summary|attendance-trend|department-breakdown|live-preview` dengan filter tanggal + scope
  - Empty state aman, default trend 30 hari, kategori "Unassigned Shift"
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6, 5.7, 5.8, 5.9, 5.10_

- [x] 16. Halaman Overview Dashboard (Recharts + cards)
  - Summary cards, trend chart, department breakdown, leave summary, live preview, date range filter
  - Klik card "Late" → Live Attendance filter status Late
  - _Requirements: 5.1, 5.5, 19.5, 19.9_

## Phase 2 — Workforce + Departments + Locations + Shifts

- [x] 17. Implementasikan Department CRUD
  - `GET/POST /departments`, `PATCH /departments/:id`, deactivate, list employees by department; single-level; no hard delete jika ada history
  - Audit: create/update/deactivate department
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 18. Implementasikan Employee service + endpoints
  - `GET/POST /employees`, `GET/PATCH /employees/:id`, `PATCH /employees/:id/status`
  - Field wajib, employee_code auto `EMP-YYYY-0001` (editable), unik per workspace, email unik per workspace, lifecycle status, no hard delete
  - Validasi scope untuk Support Admin
  - Audit: create/update/archive/reactivate employee
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.13, 7.14, 7.15, 7.16_
  - _Property: employee_code & email unik per workspace_

- [x] 19. Implementasikan account activation flow
  - Generate token aktivasi 7 hari saat create employee (status Pending_Activation), resend membatalkan token lama, aktivasi set password + Active
  - Abstraksi MailerService (mode log link bila email belum dikonfigurasi) **[DEFAULT]**
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

- [x] 20. Efek archive employee terhadap login account
  - Disable login jika user hanya end_user; pertahankan akses dashboard jika juga Support Admin/Stakeholder; history tetap
  - _Requirements: 7.9, 7.10, 7.11_

- [x] 21. Halaman Workforce (list + form add/edit + status + warnings)
  - TanStack Table server-side pagination, form RHF+Zod, badge Archived, warning shift/lokasi belum diatur
  - _Requirements: 7.10, 7.12, 16.7, 19.5, 19.9_

- [x] 22. Implementasikan Location service + endpoints
  - `GET/POST /locations`, `PATCH /locations/:id`, `PATCH /locations/:id/status`
  - Validasi koordinat wajib, radius 50–500 (default WFO 100/WFH 150), tipe Office/Branch/WFHApproved, no hard delete jika ada history
  - Konfirmasi & permission `manage_geofence` untuk ubah radius; perubahan hanya untuk attendance baru
  - Audit: create/update location, change_geofence_radius, deactivate location
  - _Requirements: 9.1, 9.2, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 9.10, 9.11, 9.12, 9.15_

- [x] 23. WFH location per employee (maks 3)
  - Tabel pivot EmployeeWfhLocation, validasi maks 3, semua dibuat HR
  - _Requirements: 9.13, 9.14_

- [x] 24. Halaman Locations (Leaflet map + input manual + form)
  - Leaflet/OSM picker, fallback lat/long manual, confirmation dialog ubah radius
  - _Requirements: 9.3, 9.7_

- [x] 25. Implementasikan Shift service + endpoints
  - `GET/POST /shifts`, `PATCH /shifts/:id`, `POST /shifts/:id/assign`
  - Field shift, work_days[], default grace 10 / checkout tolerance 60 / absence cut-off 120, tolak start==end, lintas tengah malam, effective_from, no hard delete (Active→Inactive), list employee tanpa shift
  - Permission `manage_grace_period` untuk grace; audit create/update/deactivate/assign shift, assign_location
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.10, 10.11, 10.12, 10.13_

- [x] 26. Halaman Shifts (list + form + assign)
  - Form RHF+Zod, pilih work days, assign ke employee, list employee tanpa shift
  - _Requirements: 10.2, 10.8, 10.11_

## Phase 3 — Live Attendance

- [x] 27. Implementasikan Attendance read endpoints + filters
  - `GET /attendance` (filter date/status/department/location/shift, server-side pagination), `GET /attendance/:id`
  - Scope + workspace isolation, tampilkan original vs sync time
  - _Requirements: 6.1, 6.3, 6.4, 6.5, 6.8, 6.9, 16.2, 16.7_

- [x] 28. Implementasikan admin note (tanpa edit log)
  - `POST /attendance/:id/adjustment-note`, simpan note, timestamp asli tidak berubah, audit log
  - _Requirements: 6.6, 6.7_

- [x] 29. Halaman Live Attendance (tabel + polling 10 detik + detail)
  - TanStack Table kolom sesuai requirement, polling 10s, panel detail (face/geofence/sync status)
  - Filter terbawa dari dashboard (status Late)
  - _Requirements: 6.1, 6.2, 6.4, 16.4, 19.5_

## Phase 4 — Leave/Permit + Reports + Export

- [x] 30. Implementasikan Leave service + endpoints
  - `GET /leave-requests`, `GET /leave-requests/:id`, `PATCH /leave-requests/:id/approve|reject`
  - Single approver dgn `approve_leave` + scope, status lifecycle, multi-day apply Leave, tolak overlap Pending/Approved, tolak backdated, warning konflik attendance + conflict_note, cancel hanya eksplisit, leave types configurable seed
  - HR manual leave record; proses request dari mobile
  - Audit: approve/reject/cancel leave
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9, 11.10, 11.11, 11.12, 11.13, 11.14, 11.16_
  - _Property: approval di luar scope ditolak; request overlap ditolak_

- [x] 31. Implementasikan upload attachment leave
  - Private bucket Supabase, tipe PDF/JPG/PNG ≤ 5MB, akses via signed URL
  - _Requirements: 11.15, 17.6, 17.7_

- [x] 32. Halaman Leave & Permit (list + detail + approve/reject)
  - Tabel pending, detail + lampiran, dialog approve/reject dgn warning konflik
  - _Requirements: 11.1, 11.10_

- [x] 33. Implementasikan Report queries + preview
  - `GET /reports/attendance-summary|daily-detail|late|missing-checkout`, filter server-side + scope, preview ringkasan (present/late/absent/leave) + sample rows
  - Tipe report: Summary, Daily Detail, Late, Missing Checkout, Leave & Permit, Department
  - _Requirements: 12.1, 12.2, 12.3, 12.5, 12.6_

- [x] 34. Implementasikan export sync + async (ExportJob)
  - `GET /reports/export` & `GET /attendance/export`: sync ≤5000, async >5000 (ExportJob), tolak >50000
  - Format XLSX/CSV, header walau kosong, permission `export_reports`, scope/workspace
  - `GET /exports`, `GET /exports/:id` (status + signed URL)
  - Audit: export_report
  - _Requirements: 12.4, 12.6, 12.7, 12.8, 12.9, 12.10, 12.13, 12.14, 17.6, 17.10_
  - _Property: export tidak pernah memuat data lintas workspace/scope_

- [-] 35. Export worker + storage + signed URL + history
  - Worker generate file → upload private bucket → signed URL 24 jam; history ≥30 hari (user, filter, format, row count, status, timestamps)
  - _Requirements: 12.10, 12.11, 12.12_

- [-] 36. Halaman Reports + Export History
  - Preview sebelum export, halaman Export History dgn status job (Queued/Processing/Completed/Failed/Expired) + tombol regenerate link
  - _Requirements: 12.3, 12.8, 12.11_

## Phase 5 — Settings + Audit Log + Hardening

- [ ] 37. Implementasikan Workspace Settings endpoints
  - `GET/PATCH /settings/workspace`: name, timezone, default geofence, default grace, WFH/hybrid mode, late/missing checkout policy, export permissions
  - Effective-dated vs immediate sesuai requirement; tidak mengubah histori; timezone UTC-store/display
  - Setting tanpa permission → disabled di UI
  - Audit: update_workspace_setting
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.9, 13.11_

- [ ] 38. Implementasikan Role & Permission management (Stakeholder only)
  - `GET/POST /settings/roles`, `DELETE /settings/roles/:id`: assign/remove role + scope + permission
  - Tolak hapus Stakeholder terakhir; cegah privilege escalation Support Admin
  - Audit: update_role_permission
  - _Requirements: 3.8, 3.9, 3.12, 13.10, 13.11_
  - _Property: Support Admin tidak bisa mengubah role/permission_

- [ ] 39. Implementasikan Holiday Calendar (manual)
  - CRUD holiday manual per workspace **[DEFAULT T4]**
  - _Requirements: 13.12_

- [ ] 40. Implementasikan Audit Log endpoints + halaman
  - `GET /audit-logs`, `GET /audit-logs/:id`: append-only, filter tanggal/actor/action, read-only, scope-limited, JSON old/new (field berubah saja, no sensitif)
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_

- [ ] 41. Implementasikan Attendance Status Engine + scheduled jobs
  - Kalkulasi write-time (Present/Late/Invalid/PendingCheckout); jobs Absent (15m), MissingCheckout (30m), DailySummary (malam/timezone)
  - Effective-dated, shift lintas tengah malam, duplicate handling
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8, 15.9, 15.10, 15.11_
  - _Property: status historis stabil saat setting berubah_

- [ ] 42. Cleanup job file export + retensi
  - Hapus file export >7 hari; pertahankan history ≥30 hari
  - _Requirements: 12.11, 12.12_

- [ ] 43. Aktifkan Supabase RLS untuk tabel inti
  - RLS untuk Workspace, Employee, AttendanceLog, LeaveRequest, Location, Shift, RoleAssignment; backend tetap permission check
  - _Requirements: 4.3, 4.4, 4.5_

- [ ] 44. Security & reliability hardening
  - Rate limit endpoint sensitif (login/export/roles), error boundary web, request_id end-to-end, file private + signed URL, retry export gagal
  - _Requirements: 17.1, 17.2, 17.3, 17.6, 17.10, 18.4, 18.6_

- [ ] 45. Performance pass
  - Verifikasi target (load <3s, filter <1.5s, export 5000 row <10s, p95 read <500ms), server-side pagination/filter/sort, Lighthouse ≥85
  - _Requirements: 16.1, 16.2, 16.3, 16.5, 16.6, 16.7_

- [ ] 46. Halaman akun pengguna (profil + ganti password) **[DEFAULT Y4]**
  - Lihat profil, ganti password lewat better-auth
  - _Requirements: 1.10, 19.4_

- [ ] 47. Accessibility & i18n pass
  - Label tombol jelas, status tidak hanya warna, error bertekst, kontras WCAG dasar, default bahasa Indonesia (struktur bilingual)
  - _Requirements: 19.2, 19.3, 19.4, 19.5, 19.6, 19.7, 19.8_

- [ ] 48. E2E test suite (Playwright) untuk alur kritis
  - Login→overview→live attendance, add employee→activate, create location/shift, approve leave, export, cross-workspace forbidden
  - _Requirements: 18.10_
