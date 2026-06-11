# 04 — Backend & Database Audit (`Apps/backend`)

## A. Ringkasan
Hampir semua endpoint **DB-backed nyata** (186 referensi prisma di 14 service). Web routes: `authenticate` (HMAC) → `resolveActiveWorkspace` → `requirePermission` → `enforceScope`. Mobile routes: `authenticateMobile` (bearer). Scoping `workspaceId` konsisten — tidak ditemukan kebocoran cross-tenant pada spot-check.

## B. Endpoint table (representatif)

| Method | Path | DB-backed | Permission | Status |
|---|---|---|---|---|
| GET | /attendance, /attendance/:id | Yes | view_live_attendance | OK |
| POST | /attendance/:id/adjustment-note | Yes | view_live_attendance | OK |
| GET/POST/PATCH | /employees(/:id)(/status) | Yes | view/manage_employees | OK |
| POST | /employees/activate | Yes | public (intentional) | OK |
| GET/POST/PATCH | /departments(/:id) | Yes | view/manage_employees | OK |
| GET/POST/PATCH | /locations(/:id)(/status), wfh | Yes | view_employees/manage_locations | OK |
| GET/POST/PATCH | /shifts(/:id), /assign | Yes | view_employees/manage_shifts | OK |
| GET/POST/PATCH | /leave-requests(/:id)(/approve/reject/cancel) | Yes | approve_leave | OK |
| GET | /dashboard/* (4) | Yes | view_dashboard | OK |
| GET | /reports/* (4), /reports/export | Yes (ExportJob+file) | view/export_reports | OK |
| GET | /exports(/:id) | Yes | export_reports | OK |
| GET/PATCH | /settings/workspace | Yes | view_dashboard/manage_roles | OK |
| GET/POST/DELETE | /settings/roles(/:id) | Yes | manage_roles | OK |
| GET/POST/PATCH/DELETE | /settings/holidays(/:id) | Yes | view_dashboard/manage_attendance_policy | OK |
| GET | /audit-logs(/:id) | Yes | view_audit_logs | OK |
| GET/POST | /notifications, /:id/read, /read-all | reads real table; **nothing writes** | **authenticate only (no requirePermission)** | **FAKE — never populated** |
| POST | /mobile/check-in, /check-out | Yes | bearer | OK |
| GET/POST | /mobile/me/* (today, attendance, shift, locations, leave, schedule, notifications) | Yes | bearer | OK |

## C. Export — REAL (bukan stub)
`exportWorker.ts:140-179`: ambil log → `generateXLSX`/`generateCSV` (`lib/excelExport`) → upload Supabase bucket `exports` (`:167`) → persist `ExportJob` (status/filePath/rowCount, `:171`). Signed URL di `exports.service.ts:180`. 
⚠️ `cleanupExportJob.ts:138-156`: hapus FILE storage = **no-op placeholder** (StorageClient tak punya `delete`); expiry+hard-delete DB tetap nyata.

## D. Scheduled jobs
- `absentJob.ts` — REAL (`attendanceLog.create` Absent, :201).
- `missingCheckoutJob.ts` — REAL (`update`→MissingCheckout, :151).
- `dailySummaryJob.ts` — **STUB**: groupBy hanya `logger.info` (:62), komentar :8-10 akui "No DB write for v1". Tak ada tabel ringkasan.
- `cleanupExportJob.ts` — DB nyata, file delete no-op (lihat C).

## E. Notifikasi — DEAD FEATURE 🟡
`createNotification(` (`notifications.service.ts:144`) **0 call-site** di seluruh `src/`. Leave create (`leave.service.ts:430`) & export selesai **tidak** memanggilnya. Tabel `Notification` tak pernah diisi → endpoint list/markRead (web + mobile) selalu kosong. UI notifikasi (web bell + mobile screen) = **UI Only / Empty**.
Selain itu, route notifikasi hanya `authenticate` tanpa `requirePermission` — inkonsisten dengan modul lain (minor).

## F. Model Prisma tak terpakai
- **AttendanceRawLog** (schema:611) — relasi ada, **tak pernah di-query** di `src/`. Dead (niat awal: raw attempt R6.10).
- **LeaveType** (schema:639) — **tak pernah di-query**; `type` leave disimpan sebagai string bebas. Dead (hanya komentar di mobile.service.ts:462).
- EmployeeWfhLocation, HolidayCalendar — terpakai.

## G. Rekomendasi
- **P1**: Sambungkan `createNotification()` ke flow nyata (leave baru → notify approver; leave approved/rejected → notify employee; export selesai → notify requester). Tanpa ini fitur notifikasi sia-sia.
- **P1**: Tambah `requirePermission` (atau minimal scoping eksplisit) di route notifikasi.
- **P2**: dailySummaryJob → persist ke tabel ringkasan ATAU hapus job bila tak dipakai.
- **P2**: Implement file-delete nyata di cleanupExportJob (tambah `delete` di StorageClient).
- **P2**: Hapus model `AttendanceRawLog` & `LeaveType` bila tak direncanakan, atau gunakan.
