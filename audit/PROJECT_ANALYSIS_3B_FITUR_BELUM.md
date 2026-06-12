# PROJECT_ANALYSIS — Bagian 3B: Fitur yang Belum Ada tapi Dibutuhkan

> Lanjutan dari [PROJECT_ANALYSIS_3A_FITUR_ADA.md](./PROJECT_ANALYSIS_3A_FITUR_ADA.md). Memuat **Bagian 8**: fitur yang belum ada/belum fungsional tetapi penting, beserta prioritas.

Prioritas: **High** = wajib sebelum production/MVP nyata · **Medium** = penting setelah fondasi · **Low** = enhancement.

---

## 8. Fitur yang Belum Ada tapi Dibutuhkan

### 8.1 Mobile — Fitur "Smart Attendance" Nyata

| Fitur | Alasan | Prioritas | Rekomendasi |
|-------|--------|-----------|-------------|
| **GPS asli (geolocator)** | Saat ini koordinat hardcoded → absensi bisa dipalsukan, melanggar tujuan inti produk | **High** | Tambah `geolocator`, baca posisi nyata, kirim ke backend. Tambah deteksi mock-location |
| **Face recognition + liveness nyata** | Verifikasi wajah hanya animasi Timer yang selalu lolos | **High** | Tambah `camera` + `google_mlkit_face_detection`, embedding wajah, liveness challenge nyata |
| **Peta nyata** | Detail absensi & validasi lokasi hanya placeholder teks | **Medium** | Tambah `flutter_map` (OSM) untuk visualisasi titik check-in |
| **Offline sync engine** | Sync hanya in-memory simulasi, tak ada antrian/DB lokal, tak bertahan restart | **Medium** | Tambah `sqflite`/`drift` + `connectivity_plus`, antrian upload nyata, simpan original timestamp |
| **File picker lampiran izin** | Lampiran izin = nama file hardcoded | **Medium** | Tambah `file_picker`/`image_picker`, upload nyata ke endpoint Supabase |
| **Refresh token rotation** | Refresh token disimpan tapi tak dipakai → sesi mati saat token expired | **Medium** | Implementasi alur refresh saat 401 |
| **Dark mode** | Hanya light theme | **Low** | Tambah ThemeData dark + toggle |
| **Bundle font Inter** | Font dirujuk tapi tak di-bundle (fallback platform) | **Low** | Tambahkan asset font di pubspec |

> Ini adalah gap **paling kritikal** project. Tiga pilar nilai produk (anti-manipulasi lokasi + wajah + offline) belum fungsional di mobile.

### 8.2 Backend — Penyempurnaan Fungsional

| Fitur | Alasan | Prioritas | Rekomendasi |
|-------|--------|-----------|-------------|
| **Database migrations** | Hanya `prisma db push`, tak ada history schema reproducible | **High** | Pakai `prisma migrate`, commit folder `migrations/` |
| **Supabase RLS aktif** | RLS hanya didokumentasikan, belum diaktifkan → lapisan kedua isolasi tenant absen | **High** | Terapkan policy di `SUPABASE_RLS.md`, set bucket private |
| **XLSX nyata** | Export "Excel" sebenarnya CSV berkedok | **Medium** | Pakai `exceljs` yang sudah terpasang untuk generate .xlsx asli |
| **Notifikasi benar-benar dibuat** | `createNotification()` tak pernah dipanggil → notifikasi selalu kosong | **Medium** | Panggil saat leave baru & export selesai; pertimbangkan push notif mobile |
| **AttendanceLog status Leave** | Approve leave tak membuat row Leave → dashboard under-report | **Medium** | Saat approve, buat/update AttendanceLog berstatus Leave untuk rentang tanggal |
| **Check-in pakai timezone workspace** | Hitung Late pakai waktu lokal server, bukan TZ workspace → salah bila server beda TZ | **Medium** | Konversi ke `workspace.timezone` seperti yang sudah dilakukan jobs |
| **Enforce `manage_geofence`** | Permission ada tapi tak dicek saat ubah radius | **Medium** | Tambah cek permission di controller locations |
| **Store persisten untuk lockout/token** | Login attempts & token aktivasi in-memory → hilang saat restart, tak multi-instance | **Medium** | Pindah ke Redis/DB |
| **Job scheduler eksternal** | Jobs pakai `setInterval` in-process → tak aman multi-instance | **Low** | Pakai BullMQ/cron eksternal saat scale |
| **dailySummaryJob tulis DB** | Saat ini hanya log | **Low** | Simpan ringkasan harian ke tabel |
| **cleanupExportJob hapus file** | File storage tak benar-benar dihapus | **Low** | Tambah method delete di StorageClient |

### 8.3 Web — Penyempurnaan Dashboard

| Fitur | Alasan | Prioritas | Rekomendasi |
|-------|--------|-----------|-------------|
| **Settings save nyata** | Save hanya `setTimeout`, tak ada PATCH | **High** | Wire ke `PATCH /settings/workspace` & profil |
| **Permission UI dari data nyata** | Beberapa page hardcode `true`/role stakeholder | **Medium** | Ambil role/permission user nyata dari `/me`, taruh di context/store |
| **Devices & Security tab nyata** | Devices hardcoded, Security disabled | **Medium** | Wire ke session better-auth (list device, ganti password) |
| **Leave balance nyata** | "—/12" hardcoded di my-workspace | **Medium** | Hitung saldo cuti dari data nyata |
| **Hapus dead code & dead links** | Role dashboards orphan, AdminSidebar link ke route tak ada | **Low** | Bersihkan `overview/_components/*` & link sidebar |
| **Konsolidasi styling** | Dua sistem (gray/slate vs Material token) co-exist | **Low** | Pilih satu sistem token |
| **Pagination shifts nyata** | Footer pagination palsu (disabled) | **Low** | Wire ke pagination server |

### 8.4 Fitur Lintas-Sistem yang Belum Ada (sesuai catatan PRD)

| Fitur | Status PRD | Prioritas | Catatan |
|-------|-----------|-----------|---------|
| Billing system | Out of scope v1 | Low (v2) | Web admin masih mock UI |
| Support ticket platform | Out of scope v1 | Low (v2) | Web admin masih mock UI |
| Full Super Admin platform | Out of scope v1 | Low (v2) | Sebagian mock |
| Payroll | Out of scope | Low | Belum disentuh |
| Fraud AI / risk scoring | Out of scope | Low | Belum ada |
| PDF export | v1.1 | Low | Belum ada |
| Import karyawan via Excel/CSV | Open question PRD | Medium | Belum ada, berguna untuk onboarding massal |
| Attendance manual correction workflow | v1.1 | Medium | Baru ada admin note, belum koreksi penuh |
| Real-time websocket | Open question PRD | Low | Sekarang polling 10s (cukup untuk v1) |
| Multi-level leave approval | Open question PRD | Low | Sekarang single approval |

### 8.5 Testing & Quality yang Belum Ada

| Fitur | Alasan | Prioritas | Rekomendasi |
|-------|--------|-----------|-------------|
| Integration/HTTP test backend | Semua test mock Prisma; supertest terpasang tapi tak dipakai | **High** | Tambah test HTTP dengan DB test nyata |
| Test authenticated flow (web) | Playwright hanya test route publik & redirect | **Medium** | Tambah journey login → CRUD |
| Test controller/repository (mobile) | Hanya 1 test geofence math | **Medium** | Test controller, repository, mapper |
| ESLint backend | Tak ada ESLint, `lint`=`tsc` saja | **Low** | Tambah ESLint config |

---

### Ringkasan prioritas High (wajib sebelum disebut MVP/production nyata)

1. **Mobile: GPS asli + face recognition nyata** — tanpa ini, klaim anti-manipulasi tidak berlaku.
2. **Backend: DB migrations** — agar schema reproducible.
3. **Backend: aktifkan Supabase RLS** — lapisan kedua isolasi tenant.
4. **Web: settings save nyata.**
5. **Backend: integration test nyata.**

---

> **Lanjut ke:** [PROJECT_ANALYSIS_4_KUALITAS.md](./PROJECT_ANALYSIS_4_KUALITAS.md) — Kelebihan, kekurangan, UI/UX, backend, database, auth, security, performance, code quality, testing.
