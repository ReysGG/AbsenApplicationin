# PROJECT_ANALYSIS — Bagian 3A: Fitur yang Sudah Ada

> Lanjutan dari [PROJECT_ANALYSIS_2B_ROUTES.md](./PROJECT_ANALYSIS_2B_ROUTES.md). Memuat **Bagian 7**: daftar fitur yang sudah tersedia beserta status nyatanya. Fitur yang belum ada (Bagian 8) di [PROJECT_ANALYSIS_3B_FITUR_BELUM.md](./PROJECT_ANALYSIS_3B_FITUR_BELUM.md).

Legenda status: `[Sudah Ada]` fungsional penuh · `[Parsial]` sebagian jalan · `[UI Only]` tampilan saja · `[Dummy Data]` pakai data palsu · `[Simulasi]` dianimasikan tapi tidak nyata.

---

## 7. Fitur yang Sudah Ada

### 7.1 Authentication & Session
**Status:** `[Sudah Ada]`
- **Web:** login, forgot/reset password, aktivasi karyawan via token — semua lewat better-auth nyata (`lib/auth.ts`, `(auth)/*`). Session cookie 24 jam (7 hari remember-me).
- **Mobile:** login → token bearer disimpan di secure storage, restore sesi via `/mobile/me`, logout (`auth_controller.dart`, `RemoteAuthRepository`).
- **Backend:** dua jalur auth — HMAC BFF (web) dan bearer (mobile), keduanya dienforce di server.
- Catatan: refresh token disimpan tapi **tidak pernah dipakai** (tak ada rotasi). `/sign-up` publik kontradiktif dengan `disableSignUp:true` di server.

### 7.2 Role-Based Access Control + Scope
**Status:** `[Sudah Ada]` (backend) / `[Parsial]` (web UI)
- Backend: 15 permission, role stakeholder/support_admin/end_user, scope workspace/department/location. Dienforce penuh di middleware + service, sudah di-unit-test (`lib/permissions.ts`, `middleware/enforceScope.ts`).
- Web: `permissionGuards.ts` ada tapi **kosmetik** — beberapa page malah hardcode `true` (locations) atau role stakeholder (workforce). Enforcement sebenarnya tetap di server.
- Gap: permission `manage_geofence` tidak dienforce di backend.

### 7.3 Multi-Tenant Isolation
**Status:** `[Sudah Ada]` (lapisan aplikasi)
- Setiap query di-scope `workspaceId`; percobaan lintas-workspace ditolak + dicatat audit (`resolveActiveWorkspace.ts`).
- Gap: Supabase RLS hanya **didokumentasikan, belum diaktifkan** (`SUPABASE_RLS.md`) — lapisan kedua belum ada.

### 7.4 Overview Dashboard (Web)
**Status:** `[Sudah Ada]`
- Summary cards (total/present/late/leave/absent/unassigned/pending), trend 30 hari (Recharts), department breakdown, live preview. 4 call paralel via `Promise.allSettled` (satu gagal tak membuat blank). Date filter + manual refresh.
- Gap: hitungan "Leave" under-report karena tak ada AttendanceLog berstatus Leave yang pernah dibuat (lihat 7.9).

### 7.5 Live Attendance (Web)
**Status:** `[Sudah Ada]`
- Tabel 11 kolom, 5 filter (terisi dari URL), polling 10 detik, panel detail (face/geofence/spoofing/sync indicator dengan dot+teks), tambah admin note. Halaman paling kaya di dashboard.

### 7.6 Workforce / Employee Management (Web + Backend)
**Status:** `[Sudah Ada]`
- CRUD karyawan, ubah status (archive → disable login), assign dept/lokasi/shift, auto employee code, token aktivasi + email undangan, resend invite. Warning bila shift/lokasi belum di-set.

### 7.7 Locations + Geofence (Web + Backend)
**Status:** `[Sudah Ada]` (kecuali satu gap)
- CRUD lokasi, Leaflet map picker, radius geofence (default WFH 150m / lain 100m), aktif/nonaktif. Backend memakai radius ini untuk validasi check-in (Haversine).
- Gap: perubahan radius tidak dijaga permission `manage_geofence`.

### 7.8 Shift Management (Web + Backend)
**Status:** `[Sudah Ada]`
- CRUD shift, jam masuk/pulang, grace period, checkout tolerance, work days, assign bulk ke karyawan, list "tanpa shift". Shift lintas-tengah-malam ditangani. Perubahan grace dijaga permission.

### 7.9 Leave & Permit
**Status:** `[Sudah Ada]` di approval, `[Parsial]` di efek attendance
- Web/Backend: list, approve, reject, cancel, HR manual create, cek overlap, upload lampiran (Supabase), cek scope approver + warning konflik.
- Mobile: ajukan izin, list, cancel (`leave_screen.dart`, `create_leave_screen.dart`).
- **Gap penting:** approve leave **tidak membuat AttendanceLog berstatus Leave**. Hanya warning konflik. absentJob memang melewati karyawan dengan leave approved (tak ditandai Absent), tapi dashboard yang menghitung `status='Leave'` akan under-report.
- **Gap mobile:** lampiran adalah **nama file hardcoded** (`bukti_pengajuan.pdf`), tidak ada file picker. `[Simulasi]`

### 7.10 Reports + Export
**Status:** `[Parsial]`
- 4 jenis report (summary, daily detail, late, missing checkout) + export. Threshold async nyata (sync ≤5000 baris, async 5000–50000 via ExportJob + worker, >50000 ditolak). CSV nyata.
- **Gap:** **XLSX palsu** — `generateXLSX` hanya memanggil `generateCSV` dan memberi MIME XLSX. `exceljs` terpasang tapi tak pernah di-import. File tetap bisa dibuka Excel karena CSV semicolon.

### 7.11 Exports Job Management (Web + Backend)
**Status:** `[Sudah Ada]`
- Riwayat job export, polling 15s, download via signed URL, cek ownership. Worker memproses Queued → Processing → Completed/Failed (`exportWorker.ts`).
- Gap: cleanup job menandai Expired tapi **tidak benar-benar menghapus file** di Supabase (client tak punya method delete).

### 7.12 Audit Log (Web + Backend)
**Status:** `[Sudah Ada]`
- Append-only, mencatat login, mutasi employee/shift/location/leave/role/holiday, export, penolakan permission, percobaan lintas-workspace, admin note. Web: tabel + detail, scope-limited. Wajib `workspaceId`.

### 7.13 Settings (Web + Backend)
**Status:** `[Parsial]`
- Backend: workspace settings, role management (stakeholder-gated, cegah hapus stakeholder terakhir), holidays CRUD — semua nyata + audit.
- **Web settings page lemah:** hanya `/me` (read) nyata. **Save palsu (setTimeout)**, tab Devices **hardcoded** ("iPhone 15 Pro"), tab Security disabled, Notifications toggle lokal saja. `[UI Only]` sebagian.
- Catatan: tabel `WorkspaceSetting` ada tapi tidak dipakai (service baca/tulis kolom Workspace langsung).

### 7.14 Notifications
**Status:** `[Parsial]` / `[Stub]`
- Endpoint list/mark-read nyata (backend + web NotificationBell polling 30s + mobile screen).
- **Gap besar:** `createNotification()` **tidak pernah dipanggil** di mana pun. Notifikasi `leave_request_new` / `export_completed` tak pernah dibuat → endpoint selalu kosong dalam praktik.

### 7.15 Background Jobs (Backend)
**Status:** `[Sudah Ada]` (3 nyata) / `[Parsial]` (2)
- `absentJob` (tiap 15min): tandai Absent karyawan tanpa log, timezone-correct. **Nyata.**
- `missingCheckoutJob` (tiap 30min): tandai MissingCheckout, overnight-aware. **Nyata.**
- `exportWorker` (tiap 30s): proses job export. **Nyata.**
- `dailySummaryJob`: **hanya log, tak menulis DB.** `[Parsial]`
- `cleanupExportJob`: ubah status tapi **tak hapus file storage.** `[Parsial]`
- Semua via `setInterval` in-process (single-instance only).

### 7.16 Check-in/Check-out Flow (Mobile)
**Status:** `[Parsial]` — alur lengkap, sensor simulasi
- Alur multi-step nyata: prep → lokasi → wajah → submit → success. Submit benar-benar POST ke backend.
- **Lokasi:** fetch lokasi nyata + hitung Haversine nyata, tapi **koordinat GPS hardcoded** (`-6.20885, 106.84575`, "pura-pura 35m"). `[Simulasi GPS]`
- **Wajah/liveness:** Timer 3 langkah animasi, **selalu lolos**, tanpa kamera/ML. `[Simulasi]`

### 7.17 History, Schedule, Home, Profile (Mobile)
**Status:** `[Sudah Ada]` (data nyata)
- Home (shift hari ini + CTA), History (list + detail + filter), Schedule (minggu), Profile (logout live) — semua tarik data nyata dari backend saat `USE_MOCK_DATA=false`.
- Gap kecil: Schedule rawan range-error bila backend balikkan minggu kosong; menu "Bantuan" no-op; peta di detail = placeholder teks koordinat.

### 7.18 Design System (Mobile)
**Status:** `[Sudah Ada]` — bagian termatang di mobile
- Token warna lengkap, tipografi Inter (catatan: font Inter dirujuk tapi **tidak di-bundle**, fallback ke sans platform), spacing 4px, ThemeData Material 3 (light only). Widget AppCard, StatusBadge.

### 7.19 Landing Page Marketing (Web)
**Status:** `[Sudah Ada]` / `[UI Only]`
- Halaman landing lengkap (Hero, Features, Steps, Pricing, FAQ, Testimonials, CTA) dengan animasi magicui. Konten statis (hardcoded) — wajar untuk marketing.

---

### Ringkasan matriks fitur

| Fitur | Mobile | Web | Backend |
|-------|--------|-----|---------|
| Auth & session | Sudah | Sudah | Sudah |
| RBAC + scope | n/a | Parsial (kosmetik) | Sudah |
| Multi-tenant isolation | n/a | n/a | Sudah (RLS belum) |
| Overview dashboard | n/a | Sudah | Sudah |
| Live attendance | n/a | Sudah | Sudah |
| Workforce CRUD | n/a | Sudah | Sudah |
| Locations + geofence | Simulasi GPS | Sudah | Sudah |
| Shifts | Lihat (read) | Sudah | Sudah |
| Leave | Parsial (lampiran palsu) | Sudah | Sudah (efek attendance parsial) |
| Reports + export | n/a | Parsial | Parsial (XLSX palsu) |
| Audit log | n/a | Sudah | Sudah |
| Settings | n/a | Parsial | Sudah |
| Notifications | Sudah (UI) | Sudah (UI) | Stub (tak pernah dibuat) |
| Check-in wajah | Simulasi | n/a | Gate boolean |
| Offline sync | Simulasi | n/a | n/a |
| Background jobs | n/a | n/a | Sudah (3) / Parsial (2) |

---

> **Lanjut ke:** [PROJECT_ANALYSIS_3B_FITUR_BELUM.md](./PROJECT_ANALYSIS_3B_FITUR_BELUM.md) — Fitur yang belum ada tapi dibutuhkan.
