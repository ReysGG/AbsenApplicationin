# PROJECT_ANALYSIS — Bagian 2B: Route, Endpoint & Screen

> Lanjutan dari [PROJECT_ANALYSIS_2A_STRUKTUR.md](./PROJECT_ANALYSIS_2A_STRUKTUR.md). Bagian ini memuat **Bagian 5**: daftar lengkap screen mobile, route website, dan endpoint backend dengan status koneksi data.

---

## 5. Page, Route, Screen, atau Endpoint yang Ada

### 5.1 Mobile — Screen (Flutter)

Kolom "Backend" = apakah layar mengambil data nyata dari API (saat `USE_MOCK_DATA=false`).

| Screen | File | Fungsi | Backend | Loading/Error/Empty |
|--------|------|--------|---------|---------------------|
| Splash | `auth/splash_screen.dart` | Loading saat restore sesi | Tidak langsung | N/A (ini loadernya) |
| Login | `auth/login_screen.dart` | Form email/password + validasi | **Ya** | Spinner + error inline |
| Home | `home/home_screen.dart` | Jam live, shift hari ini, CTA check-in/out | **Ya** | Loading + error(retry) |
| Check-in Prep | `attendance/checkin_prep_screen.dart` | Pilih WFO/WFH, checklist prasyarat | Tidak (state UI) | N/A |
| Location Validation | `attendance/location_validation_screen.dart` | Cek geofence | **Parsial** — lokasi nyata, **GPS hardcoded** | Loading, warning luar radius |
| Face Verification | `attendance/face_verification_screen.dart` | "Wajah + liveness" | **SIMULASI** — Timer, selalu lolos | Spinner submit saja |
| Check-in Success | `attendance/checkin_success_screen.dart` | Konfirmasi + ringkasan | **Ya** (fetch detail) | Loading + error |
| History | `history/history_screen.dart` | List absensi, filter status, pull-refresh | **Ya** | Loading + error + empty |
| Attendance Detail | `history/attendance_detail_screen.dart` | Waktu, metrik validasi, peta | **Ya** (peta placeholder) | Loading + error |
| Leave List | `leave/leave_screen.dart` | List izin, filter status, FAB | **Ya** | Loading + error + empty |
| Create Leave | `leave/create_leave_screen.dart` | Tipe, rentang tanggal, alasan, lampiran | **Ya** kecuali **lampiran PALSU** | Spinner + snackbar |
| Schedule | `schedule/schedule_screen.dart` | Pita minggu + detail shift | **Ya** | Loading + error; **rawan crash bila minggu kosong** |
| Notifications | `notifications/notifications_screen.dart` | Grup hari ini/sebelumnya, mark-all-read | **Ya** | Loading + error + empty |
| Profile | `profile/profile_screen.dart` | Bento profil, badge wajah, logout | Baca profil; logout live | "Bantuan" = no-op |
| Sync Status | `sync/sync_status_screen.dart` | Antrian offline + "sync now" | **SIMULASI penuh** | Empty state ada |
| Main Shell | `shell/main_shell.dart` | Bottom nav 5 tab | N/A | N/A |

### 5.2 Website — Route (Next.js)

Kolom "Data" = sumber data: **Backend** (API nyata) / **UI-only** (statis) / **Mock** (array hardcoded).

#### Marketing & Auth

| Route | Fungsi | Data |
|-------|--------|------|
| `/` | Landing page (Hero, Pricing, FAQ, dll) | **UI-only / statis** |
| `/login` | Login email/password, RHF+Zod, remember-me | **Backend** (better-auth) |
| `/sign-in` | Redirect legacy → `/login` | n/a |
| `/sign-up` | Register admin + Google OAuth | **Backend** (tapi `disableSignUp:true` di server — kontradiktif) |
| `/forgot-password` | Minta email reset (anti-enumeration) | **Backend** |
| `/reset-password` | Set password baru dari token | **Backend** |
| `/activate` | Aktivasi karyawan, set password dari `?token` | **Backend** (`POST /api/v1/auth/activate`) |

#### Workspace (Dashboard HR)

| Route | Fungsi | Data |
|-------|--------|------|
| `/workspace` | Redirect → overview | n/a |
| `/workspace/overview` | Summary cards, trend 30 hari, breakdown, live preview | **Backend** (4 call paralel) |
| `/workspace/attendance` | Live attendance, TanStack table, polling 10s, detail + note | **Backend** |
| `/workspace/workforce` | CRUD karyawan, status, resend invite | **Backend** (currentUser role hardcoded stakeholder) |
| `/workspace/departments` | CRUD departemen + toggle status | **Backend** |
| `/workspace/shifts` | CRUD shift, assign, list tanpa shift | **Backend** (pagination footer palsu) |
| `/workspace/locations` | CRUD lokasi, Leaflet picker, radius geofence | **Backend** (guard permission hardcoded `true`) |
| `/workspace/leave` | Approval izin (approve/reject/conflict), HR create | **Backend** |
| `/workspace/reports` | Preview report + export; riwayat export | **Backend** |
| `/workspace/exports` | Riwayat job export, polling 15s, download signed-URL | **Backend** |
| `/workspace/audit-log` | Tabel audit append-only + detail | **Backend** |
| `/workspace/settings` | Tab Profil/Security/Devices/Notifications | **Parsial** — `/me` nyata; **Save palsu (setTimeout)**, Devices hardcoded, Security disabled |
| `/workspace/account` | Profil + ganti password | **Backend** |
| `/workspace/my-workspace` | Meja kerja karyawan: hero, stats, kalender, izin | **Backend** (leave balance "—/12" hardcoded) |

#### Admin Platform

| Route | Fungsi | Data |
|-------|--------|------|
| `/admin` | Dashboard admin (KPI, live feed, dept bars) | **Backend** (panggil endpoint workspace yg sama; sebagian tile hardcoded) |
| `/admin/billing` | Invoice, MRR, revenue chart | **MOCK** — array + banner "Demo Mode" |
| `/admin/tenants` | Manajemen tenant | **MOCK** — array + banner Demo |
| `/admin/users` | Direktori tim admin internal | **MOCK** — array + banner Demo |
| `/admin/platform` | Metrik platform, growth chart | **MOCK** — statis + banner Demo |
| `/admin/tickets` | Inbox helpdesk + percakapan | **MOCK** — array + banner Demo |
| `/admin/system-health` | Uptime, latency, riwayat insiden | **Mostly MOCK** — metrik hardcoded; insiden opsional dari `v1/audit` |

> **Catatan:** PRD memang menyatakan billing/tickets/platform **out of scope v1**, jadi status mock ini sesuai rencana. Tapi `AdminSidebar.tsx` punya banyak link ke route yang **tidak ada** (`/admin/employees`, `/admin/reports/*`, dll) — dead nav links.

### 5.3 Backend — Endpoint (Express)

Base path `/api/v1`. Semua logika **nyata/DB-backed** kecuali dicatat. Web: `authenticate → resolveActiveWorkspace → requirePermission → enforceScope`. Mobile: `authenticateMobile` (bearer).

#### Auth & Dashboard

| Method | Path | Permission | Status |
|--------|------|------------|--------|
| GET | `/me` | authenticate | Nyata — user+roles+permissions |
| GET | `/workspaces/current` | authenticate+workspace | Nyata |
| POST | `/auth/login-event` | authenticate | Nyata — reset lockout, audit |
| POST | `/auth/logout-event` | authenticate | Nyata |
| POST | `/auth/login-failed` | loginGuard (publik) | Nyata — counter lockout |
| GET | `/dashboard/summary` | view_dashboard | Nyata — 7 count paralel |
| GET | `/dashboard/attendance-trend` | view_dashboard | Nyata — trend N hari |
| GET | `/dashboard/department-breakdown` | view_dashboard | Nyata |
| GET | `/dashboard/live-preview` | view_dashboard | Nyata — check-in terbaru |

#### Employees, Departments, Locations, Shifts

| Method | Path | Permission | Status |
|--------|------|------------|--------|
| GET | `/employees` | view_employees | Nyata, paginated+scoped |
| POST | `/employees` | manage_employees | Nyata — auto code + token aktivasi + email |
| GET | `/employees/:id` | view_employees | Nyata + warning shift/lokasi |
| PATCH | `/employees/:id` | manage_employees | Nyata |
| PATCH | `/employees/:id/status` | manage_employees | Nyata — archive disable login |
| POST | `/employees/:id/resend-invitation` | manage_employees | Nyata |
| POST | `/employees/activate` | **PUBLIK** | Nyata — signUpEmail, link User↔Employee |
| GET | `/employees/without-shift` | view_employees | Nyata |
| GET/POST/PATCH | `/departments[/:id]` | view/manage_employees | Nyata (tanpa DELETE) |
| GET | `/locations` | view_employees | Nyata + assignedEmployeeCount |
| POST | `/locations` | manage_locations | Nyata — default radius WFH 150/lain 100 |
| GET | `/locations/:id` | view_employees | Nyata |
| PATCH | `/locations/:id` | manage_locations | Nyata — **`manage_geofence` TIDAK dienforce** |
| PATCH | `/locations/:id/status` | manage_locations | Nyata |
| GET/POST/DELETE | `/employees/:id/wfh-locations` | view/manage_employees | Nyata (max 3) |
| GET | `/shifts` | view_employees | Nyata |
| POST | `/shifts` | manage_shifts | Nyata — grace custom butuh manage_grace_period |
| GET | `/shifts/:id` | view_employees | Nyata |
| PATCH | `/shifts/:id` | manage_shifts | Nyata |
| POST | `/shifts/:id/assign` | manage_shifts | Nyata — bulk + audit |

#### Attendance, Leave, Reports, Exports

| Method | Path | Permission | Status |
|--------|------|------------|--------|
| GET | `/attendance` | view_live_attendance | Nyata, filter+scope |
| GET | `/attendance/:id` | view_live_attendance | Nyata — isolasi 404 |
| POST | `/attendance/:id/adjustment-note` | view_live_attendance | Nyata — update notes saja + audit |
| GET | `/leave-requests` | approve_leave | Nyata |
| GET | `/leave-requests/:id` | approve_leave | Nyata + signed URL lampiran |
| POST | `/leave-requests` | approve_leave | Nyata — HR create, cek overlap |
| PATCH | `/leave-requests/:id/approve` | approve_leave | Nyata — cek scope + warning konflik |
| PATCH | `/leave-requests/:id/reject` | approve_leave | Nyata |
| PATCH | `/leave-requests/:id/cancel` | approve_leave | Nyata — pending only |
| POST | `/leave-requests/:id/attachment` | approve_leave | Nyata — upload Supabase |
| GET | `/reports/attendance-summary` | view_reports | Nyata |
| GET | `/reports/daily-detail` | view_reports | Nyata, paginated |
| GET | `/reports/late` | view_reports | Nyata |
| GET | `/reports/missing-checkout` | view_reports | Nyata |
| GET | `/reports/export` | export_reports | Nyata — sync ≤5000, async >5000–50000, >50000 → 400. **XLSX = CSV** |
| GET | `/exports` | export_reports | Nyata — list job sendiri |
| GET | `/exports/:id` | export_reports | Nyata + signed URL, cek ownership |

#### Settings, Audit, Notifications

| Method | Path | Permission | Status |
|--------|------|------------|--------|
| GET | `/settings/workspace` | view_dashboard | Nyata |
| PATCH | `/settings/workspace` | manage_roles | Nyata |
| GET | `/settings/roles` | manage_roles | Nyata |
| POST | `/settings/roles` | manage_roles + stakeholder | Nyata |
| DELETE | `/settings/roles/:id` | manage_roles + stakeholder | Nyata — cegah hapus stakeholder terakhir |
| GET/POST/PATCH/DELETE | `/settings/holidays[/:id]` | view_dashboard / manage_attendance_policy | Nyata |
| GET | `/audit-logs` | view_audit_logs | Nyata — scope-limited |
| GET | `/audit-logs/:id` | view_audit_logs | Nyata |
| GET | `/notifications` | authenticate+workspace | Nyata — **tapi selalu kosong (tak pernah dibuat)** |
| POST | `/notifications/read-all` | authenticate+workspace | Nyata |
| POST | `/notifications/:id/read` | authenticate+workspace | Nyata |

#### Mobile (bearer token)

| Method | Path | Status |
|--------|------|--------|
| POST | `/mobile/auth/login` | Nyata — signInEmail, return token+profil (employee-only) |
| POST | `/mobile/auth/logout` | Nyata |
| GET | `/mobile/me` | Nyata |
| GET | `/mobile/me/today` | Nyata |
| GET | `/mobile/me/attendance` | Nyata (cap 60) |
| GET | `/mobile/me/attendance/:id` | Nyata |
| POST | `/mobile/check-in` | Nyata — **geofence server-side (Haversine) + gate wajah/liveness + hitung Late** |
| POST | `/mobile/check-out` | Nyata |
| GET | `/mobile/me/shift` | Nyata |
| GET | `/mobile/me/locations` | Nyata |
| GET/POST | `/mobile/me/leave-requests` | Nyata — cek overlap |
| POST | `/mobile/me/leave-requests/:id/cancel` | Nyata — own + pending only |
| GET | `/mobile/me/schedule` | Nyata — dari workDays shift |
| GET | `/mobile/me/notifications` | Nyata |
| POST | `/mobile/me/notifications/read-all` | Nyata |
| POST | `/mobile/me/notifications/:id/read` | Nyata |
| GET | `/health` | Publik |

> **Penting:** Endpoint check-in backend **memvalidasi geofence dengan Haversine secara server-side** dan tidak mempercayai flag client. Namun status wajah/liveness hanya diterima sebagai boolean dari client (verifikasi wajah nyata tidak dilakukan di server — wajar untuk v1, tapi catatan kepercayaan). Karena mobile mengirim `faceVerified:true, livenessPassed:true` dengan koordinat hardcoded, **data verifikasi yang dikirim ke server saat ini dipalsukan di sisi client.**

---

> **Lanjut ke:** [PROJECT_ANALYSIS_3_FITUR.md](./PROJECT_ANALYSIS_3_FITUR.md) — Fitur yang sudah ada & yang belum ada.
