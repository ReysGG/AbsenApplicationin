# AttendX — Full Project Audit (Anti Empty-UI / Fake-Functionality)

> Tanggal: 2026-06-10 · Metode: review source code langsung (5 area), bukan README/PRD.
> File audit dipecah: lihat juga `02-web.md`, `03-mobile.md`, `04-backend-db.md`, `05-security.md`, `06-backlog.md`.

---

## 1. Executive Summary

**Verdict singkat:** Backend dan dashboard *workspace* (HR) **benar-benar fungsional dan DB-backed**. Yang menyesatkan ada di dua tempat: **(a) seluruh fitur pembeda di mobile (GPS, wajah, liveness, offline) hanya simulasi** — tidak ada satu pun package sensor di `pubspec.yaml`; **(b) seluruh konsol `/admin/*` adalah mockup statis** tanpa backend (jujur diberi banner "Demo Mode", tapi tetap UI-only). Plus satu fitur mati: **notifikasi tidak pernah dibuat** oleh flow mana pun.

**Terkuat:** Backend Express (RBAC + scoping + persistence nyata), dashboard workspace (13 halaman semua real API), export (benar-benar generate XLSX + upload Supabase).

**Terlemah:** Mobile check-in (inti produk absensi justru disimulasikan), konsol admin (UI-only), notifikasi (dead feature).

**Kesiapan:**
- **Demo?** Ya — dengan catatan jangan klaim GPS/face nyata di mobile.
- **MVP?** Belum. Inti absensi (GPS + face) wajib nyata dulu. Ini P0.
- **Production?** Belum. Lihat roadmap P0 di `06-backlog.md`.

**Risiko terbesar:** Mobile mengirim **koordinat hardcoded** (`-6.20885, 106.84575`) dan **`faceVerified=true` otomatis** ke backend. Backend memang sudah validasi geofence server-side (bagus), tapi karena klien selalu kirim titik kantor yang benar + face=true, **absensi bisa dipalsukan dari mana saja** begitu `USE_MOCK_DATA=false`. Anti-spoof PDF 6B belum terpenuhi.

### Skor (0–100)

| Area | Skor | Catatan |
|---|---:|---|
| Web Dashboard (workspace) | 85 | 13 halaman real API, state lengkap. Kurang: guard per-halaman baru ditambah, settings belum di-gate. |
| Web Dashboard (admin) | 15 | Mockup statis, no backend. Hanya `/admin` index + system-health audit-feed yang real. |
| Mobile App | 35 | Arsitektur repo + auth + check-in API real & teruji; tapi GPS/face/liveness/offline **simulasi**, mock default ON. |
| Backend / API | 88 | Persistence nyata, RBAC + scoping konsisten. Kurang: notifikasi dead, dailySummary stub, cleanup file no-op. |
| Database / Persistence | 80 | Scoped by workspace. 2 model tak terpakai (AttendanceRawLog, LeaveType). |
| Auth / Security | 70 | RBAC backend kuat; `/admin` baru ditambal sesi ini; spoofing mobile = risiko utama. |
| Testing | 30 | Backend ada unit test (mobile 12 lulus); 4 test middleware pre-existing gagal; web/mobile E2E praktis nihil. |
| **Production Readiness** | **45** | Inti mobile + admin + notifikasi menahan ke bawah. |

---

## 2. Project Map

| Area | Stack | Lokasi | Catatan |
|---|---|---|---|
| Mobile | Flutter + Riverpod + go_router + dio | `Apps/app_flutter` | `useMockData` default **true** |
| Web | Next.js 16 + React 19 + better-auth | `Apps/website` | BFF proxy HMAC ke backend |
| Backend | Express 5 + Prisma 7 + better-auth (bearer) | `Apps/backend` | `prisma db push` |
| DB | PostgreSQL | container `db` (Docker) | port host 10002 |
| Auth | better-auth (cookie web / bearer mobile), shared secret | — | 2 jalur ke backend sama |

---

## 3. Feature Completeness Matrix

| Fitur | Web UI | Mobile UI | Backend API | DB | Test | Status |
|---|---|---|---|---|---|---|
| Login / sesi | ✅ | ✅ | ✅ | ✅ | sebagian | **Functional** |
| Attendance read (HR) | ✅ | — | ✅ | ✅ | ✅ | **Functional** |
| Check-in/out (mobile) | — | ✅ | ✅ (teruji live) | ✅ | ✅ | **Partial** (klien simulasi) |
| GPS / geofence | — | ⚠️ simulasi | ✅ (Haversine server) | ✅ | ✅ | **Simulated (mobile)** |
| Face / liveness | — | ⚠️ simulasi | menerima flag | — | — | **Simulated** |
| Offline sync | — | ⚠️ mock | — | — | — | **Mock / Empty** |
| Leave (ajukan/approve/cancel) | ✅ | ✅ | ✅ | ✅ | ✅ | **Functional** |
| Employee CRUD + aktivasi | ✅ | — | ✅ | ✅ | sebagian | **Functional** |
| Location/Shift/Dept CRUD | ✅ | — | ✅ | ✅ | sebagian | **Functional** |
| Reports + Export XLSX/CSV | ✅ | — | ✅ (file+bucket) | ✅ | sebagian | **Functional** |
| Notifikasi | ✅ list | ✅ list | ✅ endpoint | ⚠️ tak pernah ditulis | — | **UI Only / Empty** |
| Audit log | ✅ | — | ✅ | ✅ | — | **Functional** |
| Admin console (platform) | ⚠️ mockup | — | ❌ tidak ada | ❌ | — | **UI Only / Empty** |
| Settings + Roles | ✅ | — | ✅ | ✅ | ✅ | **Functional** |

---

## 4. Temuan Kritis (ringkas)

1. **🔴 Mobile spoofing** — koordinat & face hardcoded di klien (`location_validation_screen.dart:46-63`, `face_verification_screen.dart:60-64`). Detail di `03-mobile.md`.
2. **🔴 Admin console UI-only** — `admin/users|tenants|billing|platform|tickets` pakai array statis, no backend. Detail di `02-web.md`.
3. **🟡 Notifikasi dead** — `createNotification()` 0 call-site. Detail di `04-backend-db.md`.
4. **🟡 `/admin` baru ditambal** sesi ini (cek `globalRole`); belum diverifikasi runtime. Detail di `05-security.md`.
5. **🟡 Mock default ON** — mobile keluar kotak pakai data dummy (`app_config.dart:15`).
6. **🟢 dailySummaryJob** hanya `logger.info`, tak persist; **cleanupExportJob** file-delete no-op.
7. **🟢 Model tak terpakai**: `AttendanceRawLog`, `LeaveType`.

Lihat backlog + roadmap P0/P1/P2 di `06-backlog.md`.
