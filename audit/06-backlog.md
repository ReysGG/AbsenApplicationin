# 06 — Backlog, Testing & Roadmap

## A. Testing gaps

| Area | Ada? | Catatan |
|---|---|---|
| Backend unit (services) | ✅ | mobile.test.ts 12 lulus; attendance/leave/locations/shifts/dll ada |
| Backend middleware | ⚠️ | 4 test `middleware.test.ts` GAGAL (pre-existing, bukan regresi sesi ini) |
| Backend integration (HTTP+DB nyata) | ❌ | semua mock prisma; tak ada test DB nyata |
| Web E2E (Playwright) | ⚠️ | harness ada (`e2e/`), coverage flow kritis minim |
| Mobile test | ❌ | `flutter test` gagal di mesin ini (path SDK berisi spasi) |
| Security/permission test | ❌ | gate `/admin` & per-halaman belum ada test |
| CI menjalankan test | ⚠️ | GitHub Actions ada; perlu cek coverage gate |

## B. E2E flow (status)

| Flow | Status | Catatan |
|---|---|---|
| Admin login → dashboard | Functional | teruji (web build + /me) |
| HR buat employee | Functional | API + DB nyata |
| Aktivasi akun (email link) | Partial | MailerService mode log bila email belum dikonfigurasi |
| Employee login mobile | **Functional** | teruji live (token + profil) |
| Check-in GPS+face | **Partial/Simulated** | API nyata, sensor simulasi |
| HR lihat live attendance | Functional | record check-in muncul |
| Employee ajukan leave | Functional | teruji live |
| HR approve leave | Functional | API + DB |
| Dashboard update leave count | Functional | dari /dashboard |
| HR export report | Functional | XLSX + bucket |
| Audit log mencatat | Functional | writeAudit dipanggil |
| Notifikasi muncul | **Broken/Empty** | tak pernah dibuat |

## C. Implementation Backlog

| Prio | Item | Area | Solusi singkat | Kompleksitas |
|---|---|---|---|---|
| P0 | GPS nyata di check-in | Mobile | `geolocator` + mock-location detect; kirim koordinat asli | M |
| P0 | Face + liveness nyata | Mobile | `camera` + `google_mlkit_face_detection`; faceVerified hanya bila lolos | L |
| P0 | Verifikasi runtime gate `/admin` + halaman sensitif | Web | uji akun karyawan/support_admin terbatas | S |
| P1 | Sambungkan notifikasi ke flow | Backend | panggil `createNotification` di leave/export | M |
| P1 | Peta geofence nyata | Mobile | `flutter_map` + `latlong2` | M |
| P1 | `.env` ke `.gitignore` + rotate secret | DevOps | cegah bocor kredensial | S |
| P1 | Sembunyikan/disable `/admin/*` di prod (atau bangun backend) | Web | gated/feature-flag | S–L |
| P1 | Test integrasi `/mobile/*` + permission gate | Testing | supertest + DB test | M |
| P2 | Offline sync nyata | Mobile | `drift`/`hive` + `connectivity_plus` | L |
| P2 | Push notification (FCM) | Mobile+Backend | `firebase_messaging` + device token endpoint | L |
| P2 | dailySummaryJob persist / cleanup file-delete nyata | Backend | tabel ringkasan; StorageClient.delete | M |
| P2 | Hapus model tak terpakai (AttendanceRawLog, LeaveType) | DB | bersih-bersih schema | S |
| P2 | Pesan error access_denied/forbidden di UI | Web | UX feedback | S |
| P2 | Perbaiki 4 test middleware pre-existing | Testing | investigasi mock | S |

## D. Roadmap

### P0 — Wajib sebelum MVP
1. GPS nyata (mobile check-in).
2. Face + liveness nyata (mobile).
3. Verifikasi runtime gerbang `/admin` + halaman workspace sensitif.

### P1 — Penting setelah P0
- Notifikasi end-to-end (backend wiring + opsional FCM).
- Peta geofence nyata.
- `.env`/secret hygiene.
- Disable/feature-flag `/admin` mock di produksi.
- Test integrasi + permission.

### P2 — Enhancement
- Offline sync, push, dailySummary persist, cleanup file-delete, hapus model mati, UX error message, fix test middleware.

## E. Final Verdict
- **Benar-benar jadi:** backend (RBAC, persistence, export), dashboard workspace, alur leave & attendance-read, auth web+mobile.
- **Cuma kelihatan jadi:** mobile GPS/face/liveness/offline (simulasi), konsol `/admin` (mockup), notifikasi (dead).
- **Paling berbahaya bila dibiarkan:** spoofing absensi mobile (koordinat + face palsu dari klien).
- **5 hal pertama yang harus diperbaiki:** (1) GPS nyata, (2) face/liveness nyata, (3) verifikasi gate `/admin`, (4) sambungkan notifikasi, (5) `.env`/secret hygiene.
- **Demo:** siap (jangan klaim sensor nyata). **MVP:** belum (P0 dulu). **Production:** belum.
