# AttendX Mobile (Flutter) — Implementation Plan

> Aplikasi mobile untuk **End User / Karyawan** (clock-in/out). Fokus: Flutter (`Apps/app_flutter`).
> Sumber kebenaran: `Proposal Pengembangan Aplikasi Mobile (2).pdf`, mockup di `ubahflutter.md` + `proposal_mockups/`, design token di `DESIGN (1).md`, kontrak API di `Apps/backend`.

---

## 0. Jawaban Pertanyaan Docker

Ya. Backend (Express) dan website (Next.js) keduanya bisa di-Dockerize nanti tanpa mengganggu Flutter:

- **Backend** sudah service Node terpisah (`Apps/backend`) — cukup `Dockerfile` multi-stage (build `tsc` → run `node dist`) + `DATABASE_URL`/`DIRECT_URL` ke Supabase/Postgres.
- **Website** Next.js → `Dockerfile` dengan `output: 'standalone'`.
- **Flutter tidak ikut Docker** (aplikasi mobile native, didistribusi via APK/Play Store/App Store). Flutter hanya butuh tahu `API_BASE_URL` saat build.
- Disarankan `docker-compose.yml` di root (backend + postgres + website) untuk dev lokal nanti. **Bukan bagian dari pekerjaan Flutter ini** — dicatat saja agar arsitektur Flutter tidak bikin asumsi yang menyulitkan containerisasi (misal: base URL dibuat configurable lewat `--dart-define`).

---

## 1. Pemahaman Use Case (dari PDF)

Aplikasi mobile **khusus role End User (Karyawan)**. Dari PDF bagian 5.1 + 7 + tabel role bagian 5.3, fitur yang menjadi tanggung jawab aplikasi mobile:

| # | Fitur | Sensor / Mekanisme | Sumber PDF |
|---|-------|--------------------|------------|
| 1 | Login akun karyawan | Firebase/better-auth, JWT | 5.1, 6B |
| 2 | Check-in & Check-out | Tombol → trigger verifikasi berlapis | 5.1 |
| 3 | Validasi lokasi (GPS + Geofence) | GPS, OSM map, deteksi mock-location | 5.1, 7.1, 6B |
| 4 | Validasi wajah (Face Recognition) | Kamera + Google ML Kit (on-device) | 5.1, 7.2, 7.3 |
| 5 | Liveness detection (kedip / gerak kepala) | ML Kit Face, anti foto statis | 5.1, 7.4, 6B |
| 6 | Mode WFH toggle (GPS off, face tetap aktif) | toggle UI | 5.1 |
| 7 | Riwayat presensi pribadi | API | 5.1 |
| 8 | Pengajuan izin / cuti dari aplikasi | API + upload bukti | 5.1 |
| 9 | Lihat jadwal shift pribadi | API | 5.1 |
| 10 | Notifikasi (pengingat absen, status approval) | Push Notification (FCM) | 5.1, 7.7 |
| 11 | Offline mode (simpan lokal, sync saat online) | Local Storage + sync engine | 5.1, 7.6 |

**Yang BUKAN tanggung jawab mobile:** dashboard HR, manajemen karyawan/lokasi/shift, approval, laporan, billing, super admin → semua di Web Dashboard.

### Keamanan wajib (PDF 6B)
- JWT + refresh token (sesi aman, auto-refresh).
- GPS spoofing detection → batalkan check-in + catat anomali.
- Liveness anti foto statis.
- Rate limiting (server-side; mobile harus menangani 429 dengan graceful backoff).

---

## 2. Temuan Penting: Gap Backend untuk Mobile ⚠️

Backend saat ini (`Apps/backend`) **dirancang untuk Web Dashboard, belum untuk mobile**. Bukti dari kode:

1. **Autentikasi berbasis BFF HMAC header**, bukan token mobile.
   `middleware/authenticate.ts` mengharuskan header `x-user-context` + `x-user-context-sig` yang ditandatangani oleh Next.js BFF dengan `INTERNAL_JWT_SECRET`. Mobile tidak punya secret ini dan tidak boleh punya.
2. **Attendance READ-ONLY.** `attendance.routes.ts` cuma `GET /attendance`, `GET /attendance/:id`, dan adjustment-note. **Tidak ada `POST /check-in` / `POST /check-out`.**
3. **Leave butuh permission `approve_leave`** (`leave.routes.ts`) → itu permission HR, bukan end user. Tidak ada endpoint "ajukan cuti sebagai karyawan sendiri".
4. **Tidak ada endpoint self-service** (`/me/attendance`, `/me/shift`, `/me/leave`) untuk end user.
5. **Tidak ada registrasi device token FCM** untuk push notification.
6. **Tidak ada endpoint face enrollment** (registrasi vektor wajah karyawan).

### Keputusan arsitektur yang perlu konfirmasi
Untuk membuat Flutter **fungsional end-to-end**, backend perlu lapisan **Mobile API** (mis. prefix `/api/v1/mobile/*`) dengan auth token langsung (Firebase ID token atau better-auth bearer) dan endpoint:
`POST /mobile/check-in`, `POST /mobile/check-out`, `GET /mobile/me/attendance`, `GET /mobile/me/shift`, `GET/POST /mobile/me/leave-requests`, `POST /mobile/devices` (FCM), `POST /mobile/face/enroll`.

**Strategi yang saya usulkan (lihat Fase 0):** Bangun Flutter dulu dengan **layer data ber-abstraksi + mock/fake repository** sehingga UI & logika selesai tanpa nunggu backend. Saat endpoint mobile siap, tukar implementasi repository tanpa mengubah UI. Ini menghindari blocking dan tetap rapi.

> **Butuh keputusan kamu:** apakah saya boleh sekalian menambah Mobile API di backend (Fase 6), atau Flutter cukup pakai mock dulu sampai kamu siapkan backend-nya? Default rencana: Flutter pakai mock dulu, Mobile API jadi fase terpisah.

---

## 3. Tech Stack & Dependencies Flutter

State sekarang: project Flutter masih template default (`lib/main.dart` counter, `pubspec.yaml` tanpa dependency). Akan ditambahkan:

| Kebutuhan | Package | Alasan |
|-----------|---------|--------|
| State management | `flutter_riverpod` | ringan, testable, sesuai layered arch |
| Routing | `go_router` | deep-link & guard auth |
| HTTP | `dio` | interceptor (JWT, refresh, retry, 429) |
| Auth | `firebase_auth` + `firebase_core` | sesuai PDF (Firebase Auth) |
| Lokasi | `geolocator` | GPS + akurasi |
| Anti-spoof GPS | `geolocator` (isMocked) + cek `mockLocationEnabled` | PDF 6B |
| Peta | `flutter_map` + `latlong2` | OpenStreetMap (PDF, tanpa biaya) |
| Kamera | `camera` | feed wajah |
| Face + liveness | `google_mlkit_face_detection` | on-device, gratis (PDF) |
| Local storage / offline | `drift` atau `hive` + `sqflite` | antrian absen offline |
| Secure storage | `flutter_secure_storage` | token |
| Notifikasi | `firebase_messaging` + `flutter_local_notifications` | FCM |
| Konektivitas | `connectivity_plus` | trigger auto-sync |
| Permission | `permission_handler` | kamera, lokasi, notifikasi |
| Util | `intl`, `freezed`, `json_serializable` | model & format tanggal ID |

Konfigurasi: `API_BASE_URL` via `--dart-define` (mendukung Docker/lingkungan berbeda).

---

## 4. Arsitektur Aplikasi (Clean-ish + Feature-first)

```
lib/
├── main.dart
├── app.dart                      # MaterialApp.router + theme
├── core/
│   ├── theme/                    # warna + tipografi dari DESIGN (1).md (AttendX tokens)
│   ├── router/                   # go_router + auth guard
│   ├── network/                  # dio client, interceptor, error mapper
│   ├── config/                   # env (--dart-define), constants
│   ├── storage/                  # secure storage, local db
│   └── widgets/                  # komponen shared (AppBar, BottomNav, StatusBadge, dll)
├── features/
│   ├── auth/                     # splash, login, session
│   ├── home/                     # dashboard beranda (jam, shift, status, quick links)
│   ├── attendance/               # prep check-in, validasi lokasi, verifikasi wajah, sukses
│   ├── history/                  # riwayat presensi + detail presensi
│   ├── leave/                    # daftar pengajuan + buat pengajuan
│   ├── schedule/                 # jadwal shift
│   ├── notifications/            # daftar notifikasi
│   ├── profile/                  # profil + logout
│   └── sync/                     # status sinkronisasi offline
└── shared/
    ├── models/                   # entity + DTO (freezed)
    └── data/                     # repository interface + impl (mock & remote)
```

Pola tiap fitur: `presentation (screen+widgets) → controller (riverpod) → repository (abstract) → datasource (remote dio / local db)`.

---

## 5. Daftar Screen (dari mockup `ubahflutter.md`)

Brand: **AttendX**. Warna primary `#0058BE`, secondary `#8127CF`, font Inter, Material Symbols. Bottom nav 5 tab: **Beranda · Riwayat · Pengajuan · Shift · Profil**.

| # | Screen | Mockup ref | Catatan |
|---|--------|-----------|---------|
| 1 | Splash | `Splash Screen` | logo + loading, cek sesi |
| 2 | Login | `Login Screen` | email + password, lupa sandi, security note |
| 3 | Home / Beranda | `Home Dashboard` | greeting, jam realtime, kartu shift+mode (WFO/WFH), kartu aksi check-in/out, akses cepat |
| 4 | Persiapan Check-in | `Persiapan Check-in` | mode kerja, checklist prasyarat (GPS, Face, Liveness) |
| 5 | Validasi Lokasi | `Validasi Lokasi` | peta OSM + geofence overlay + pin + status, warning di luar radius |
| 6 | Verifikasi Wajah | `Verifikasi Wajah` | camera feed, oval guide, scanning line, instruksi liveness, progress |
| 7 | Check-in Berhasil | `Check-in Berhasil` | animasi sukses, ringkasan jam masuk + detail |
| 8 | Riwayat Presensi | `Riwayat Presensi` | filter chips, list kartu (hadir/terlambat/pending sync) |
| 9 | Detail Presensi | `Detail Presensi` | status, jam masuk/pulang/total, validasi lokasi/wajah/sync, peta in/out |
| 10 | Daftar Pengajuan | `Daftar Pengajuan` | filter tab (pending/approved/rejected), list kartu |
| 11 | Buat Pengajuan | `Buat Pengajuan` | jenis, tanggal, alasan, upload bukti |
| 12 | Jadwal Shift | `Jadwal Shift` | week selector, calendar ribbon, timeline shift |
| 13 | Notifikasi | `Notifikasi` | grup Hari Ini / Kemarin, read/unread |
| 14 | Profil | `Profil` | header bento, menu list, logout |
| 15 | Sinkronisasi Offline | `Sinkronisasi Offline` | status card, list item antrian sync |

---

## 6. Rencana Fase & Task

### Fase 0 — Fondasi
- [ ] 0.1 Update `pubspec.yaml` dengan dependency (section 3), `flutter pub get`.
- [ ] 0.2 Setup `core/config` (env via `--dart-define`, base URL).
- [ ] 0.3 Theme AttendX dari `DESIGN (1).md` (ColorScheme, TextTheme Inter, radius, spacing).
- [ ] 0.4 Komponen shared: AppScaffold, BottomNavBar, StatusBadge, PrimaryButton, dll.
- [ ] 0.5 `go_router` + auth guard + struktur folder feature.
- [ ] 0.6 Layer data: definisi repository abstract + **mock impl** (data dummy) untuk semua fitur.

### Fase 1 — Auth & Shell
- [ ] 1.1 Splash (cek sesi → route ke Login/Home).
- [ ] 1.2 Login UI + form validation.
- [ ] 1.3 Auth controller + secure storage token (mock dulu).
- [ ] 1.4 Main shell + bottom navigation 5 tab.

### Fase 2 — Home & Riwayat
- [ ] 2.1 Home: jam realtime, kartu shift+mode kerja, status hari ini, quick links.
- [ ] 2.2 Riwayat presensi (filter chips + list).
- [ ] 2.3 Detail presensi (peta mini in/out + metrics).

### Fase 3 — Alur Check-in/Check-out (inti)
- [ ] 3.1 Persiapan check-in + checklist prasyarat + toggle WFH.
- [ ] 3.2 Validasi lokasi: `geolocator` + `flutter_map` OSM + perhitungan geofence (Haversine) + deteksi mock location.
- [ ] 3.3 Verifikasi wajah: `camera` + ML Kit face detection + liveness (kedip/gerak kepala) + progress.
- [ ] 3.4 Submit check-in/out (mock) → screen sukses.

### Fase 4 — Pengajuan, Jadwal, Notifikasi, Profil
- [ ] 4.1 Daftar pengajuan + filter status.
- [ ] 4.2 Buat pengajuan + upload bukti.
- [ ] 4.3 Jadwal shift (calendar ribbon + timeline).
- [ ] 4.4 Notifikasi (grup tanggal, read/unread).
- [ ] 4.5 Profil + logout.

### Fase 5 — Offline & Sync
- [ ] 5.1 Local DB (drift/hive) untuk antrian absen offline.
- [ ] 5.2 Screen status sinkronisasi.
- [ ] 5.3 Auto-sync via `connectivity_plus` saat online.

### Fase 6 — Integrasi Backend (butuh Mobile API) ⚠️ blocking backend
- [ ] 6.1 (Backend) Tambah `/api/v1/mobile/*`: auth token, check-in/out, me/attendance, me/shift, me/leave, devices(FCM), face/enroll.
- [ ] 6.2 Firebase Auth integrasi nyata + dio interceptor (refresh token, 429 backoff).
- [ ] 6.3 Tukar mock repository → remote repository.
- [ ] 6.4 FCM push notification end-to-end.

### Fase 7 — Pengujian & Rilis
- [ ] 7.1 Unit test (geofence, liveness state, sync queue) + widget test.
- [ ] 7.2 Permission flow Android (kamera, lokasi, notifikasi) + `AndroidManifest`.
- [ ] 7.3 Build APK debug, smoke test di device.

---

## 7. Risiko & Catatan
- **ML Kit liveness** bukan face-match penuh; PDF menyebut "vektor wajah" — untuk match identitas perlu enrollment + embedding. ML Kit Face Detection menyediakan landmark + probabilitas mata terbuka (liveness), tetapi **face recognition/embedding** mungkin perlu `google_mlkit_face_mesh` atau model TFLite tambahan. Akan dikonfirmasi di Fase 3.3.
- **iOS**: PDF menyebut Android & iOS. Plan fokus Android dulu (CI `react-doctor`/gradle sudah ada); iOS menyusul.
- **Geofence akurasi GPS** indoor bisa meleset — sediakan UI retry + pesan akurasi rendah.
- **Backend mobile API** adalah blocker fungsional; sampai siap, app berjalan penuh dengan mock.

---

## 8. Langkah Berikutnya (menunggu konfirmasi)
1. Setuju struktur & fase di atas?
2. Mobile API backend: saya kerjakan sekalian (Fase 6) atau mock dulu?
3. Mulai dari **Fase 0 + Fase 1** (fondasi + auth + shell)?
