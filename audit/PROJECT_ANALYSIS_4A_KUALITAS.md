# PROJECT_ANALYSIS — Bagian 4A: Kelebihan, Kekurangan, UI/UX, Backend, Database

> Lanjutan dari [PROJECT_ANALYSIS_3B_FITUR_BELUM.md](./PROJECT_ANALYSIS_3B_FITUR_BELUM.md). Memuat **Bagian 9–13**. Bagian 14–18 (Auth, Security, Performance, Code Quality, Testing) di [PROJECT_ANALYSIS_4B_KUALITAS.md](./PROJECT_ANALYSIS_4B_KUALITAS.md).

---

## 9. Kelebihan Project Saat Ini

| Kelebihan | Penjelasan (berdasarkan bukti kode) |
|-----------|-------------------------------------|
| Arsitektur monorepo rapi | Tiga app (`Apps/app_flutter`, `backend`, `website`) terpisah jelas dalam pnpm+turbo, dengan satu backend & DB bersama |
| Backend modular & matang | Pola `routes/controller/service/schema` konsisten di 14 modul; mayoritas endpoint DB-backed nyata, bukan stub |
| Keamanan auth kuat | HMAC timing-safe (`crypto.timingSafeEqual`), resolusi user via `authUserId` (anti account-takeover), env divalidasi Zod ≥32 char saat boot |
| RBAC + scope dienforce di server | Permission, scope dept/lokasi, dan isolasi workspace dienforce di middleware+service, bukan hanya frontend — sudah di-unit-test |
| Multi-tenant isolation konsisten | Setiap query di-scope `workspaceId`; percobaan lintas-workspace ditolak + diaudit |
| Audit log menyeluruh | Login, mutasi entity, export, penolakan permission, percobaan akses ilegal semua tercatat |
| Geofence server-side nyata | Backend hitung Haversine sendiri & tak percaya flag client — desain anti-manipulasi yang benar |
| Error handling konsisten | `AppError` hierarchy + envelope `{success,error}` seragam, tak bocorkan stack |
| Web dashboard HR berkualitas | Loading skeleton, empty state, error banner `role=alert`, pagination server, form RHF+Zod, confirm dialog — konsisten di semua page data |
| Aksesibilitas diperhatikan | `aria-*`, status dot+teks (bukan warna saja), `lang=id`, disabled-not-hidden nav — sesuai `ACCESSIBILITY.md` |
| Design system mobile matang | Token warna/tipografi/spacing lengkap, ThemeData Material 3 |
| Data layer mobile testable | Tiap domain punya repository abstrak dengan implementasi mock & remote; toggle 1 flag |
| Dokumentasi produk lengkap | PRD detail, README bahasa Indonesia menyeluruh, docs/plans, SUPABASE_RLS.md |
| Background jobs nyata | absentJob & missingCheckoutJob timezone-correct, exportWorker async — bukan kosmetik |

---

## 10. Kekurangan Project Saat Ini

| Kekurangan | Dampak | Prioritas | Rekomendasi |
|------------|--------|-----------|-------------|
| **GPS mobile hardcoded** | Absensi bisa dipalsukan; melanggar nilai inti anti-manipulasi | High | Integrasi `geolocator` + deteksi mock location |
| **Face/liveness mobile simulasi** | Verifikasi wajah selalu lolos tanpa kamera | High | Integrasi `camera` + ML Kit + embedding nyata |
| **Mobile kirim data verifikasi palsu** | `faceVerified:true` + koordinat hardcoded dikirim ke server | High | Hanya kirim hasil sensor nyata |
| **Tidak ada DB migrations** | Schema tak reproducible (`db push` saja) | High | `prisma migrate` + commit migrations |
| **Supabase RLS belum aktif** | Lapisan kedua isolasi tenant absen | High | Terapkan policy + bucket private |
| **Settings web save palsu** | Stakeholder kira setting tersimpan padahal tidak | High | Wire ke PATCH backend |
| **XLSX export palsu** | "Excel" sebenarnya CSV | Medium | Pakai `exceljs` |
| **Notifikasi tak pernah dibuat** | Fitur notifikasi kosong selamanya | Medium | Panggil `createNotification` |
| **Leave tak buat status attendance** | Dashboard under-report "Leave" | Medium | Buat AttendanceLog Leave saat approve |
| **Offline sync simulasi** | Tak ada antrian/DB lokal nyata | Medium | sqflite/drift + connectivity_plus |
| **Permission UI hardcoded** | Sebagian page abaikan permission nyata (kosmetik) | Medium | Ambil dari `/me`, pakai context |
| **Check-in pakai TZ server** | Hitung Late salah bila beda TZ | Medium | Pakai timezone workspace |
| **`manage_geofence` tak dienforce** | Radius bisa diubah tanpa permission | Medium | Cek permission di controller |
| **Store in-memory (lockout/token)** | Hilang saat restart, tak multi-instance | Medium | Redis/DB |
| **Dead code & dead links (web)** | role dashboards orphan, sidebar link ke route tak ada | Low | Bersihkan |
| **Dua sistem styling** | Inkonsistensi visual gray/slate vs token | Low | Konsolidasi |
| **Test mock semua / dangkal** | Tak ada integration test nyata; mobile 1 test | Medium | Tambah test HTTP & e2e authenticated |
| **Tidak ada ESLint backend** | Konsistensi kode tak terjaga otomatis | Low | Tambah ESLint |
| **Font Inter tak di-bundle** | Tipografi mobile fallback ke platform | Low | Bundle font |
| **flutter_secure_storage gagal build di path berisi spasi** | `flutter test`/`build apk` gagal di mesin ini | Medium | Pindah SDK ke path tanpa spasi (mis. `C:\flutter`) |

---

## 11. Analisis UI/UX

### Web Dashboard (HR)
**Penilaian: polished & profesional** untuk semua halaman `/workspace/*` dan `/admin` dashboard.
- Navigasi jelas (Sidebar permission-aware, disable bukan hide).
- Loading skeleton/spinner, empty state berikon, error banner dengan retry — konsisten.
- Form RHF+Zod dengan error inline; confirm dialog untuk aksi destruktif.
- Panel detail slide-in, polling dengan timestamp live.
- Responsif (`sm:`/`lg:` breakpoint, mobile drawer).
- Aksesibilitas baik (lihat bagian 9).

**Placeholder/kosmetik:** `/admin/{billing,tenants,users,platform,tickets}` (mock + banner Demo), settings save/devices, role dashboards orphan, landing statis.

**Inkonsistensi:** dua sistem styling co-exist; enforcement permission di client tak merata.

### Mobile
**Penilaian: design system matang, beberapa state hilang.**
- Tema konsisten, komponen reusable rapi.
- Mayoritas screen punya loading/error/empty state.
- Kekurangan: Schedule tak ada guard empty (rawan crash), Face screen tak ada jalur gagal, peta hanya placeholder, "Bantuan" no-op, tak ada dark mode.

### Kesimpulan UI/UX
Dashboard HR adalah produk visual yang nyaris siap; mobile rapi tapi beberapa fitur kunci hanya kulit (wajah/peta/sync).

---

## 12. Analisis Backend dan API

| Aspek | Penilaian | Catatan |
|-------|-----------|---------|
| Struktur controller/service/model | Sangat baik | Pola konsisten 14 modul |
| Routing API | Baik | Prefix `/api/v1`, RESTful |
| Validasi request | Baik | Zod per modul; mobile check-in hand-parsed tapi validasi koordinat ada |
| Error response | Sangat baik | Envelope konsisten, typed AppError |
| Authentication | Sangat baik | Dua jalur (HMAC web + bearer mobile) |
| Authorization | Sangat baik | RBAC + scope + workspace isolation di server |
| Middleware | Lengkap | authenticate, requirePermission, enforceScope, rateLimiter, dll |
| Database query | Baik | Index komposit untuk dashboard/report |
| ORM | Baik | Prisma 7 + adapter pg |
| File upload | Ada | Supabase Storage (lampiran, export) |
| Logging | Ada | Winston + requestId |
| Rate limiting | Ada | general/sensitive/auth (in-memory) |
| Konsistensi response | Sangat baik | `{success,data,message}` / `{success,error}` |
| **XLSX export** | **Parsial** | CSV berkedok XLSX |
| **Notifikasi** | **Stub** | Tak pernah dibuat |
| **Migrations** | **Absen** | `db push` saja |
| **RLS** | **Belum aktif** | Hanya dokumentasi |

**Kesimpulan:** Backend adalah bagian **terkuat & paling matang** di project. Mayoritas modul production-ready; gap-nya spesifik dan teridentifikasi (migrations, RLS, XLSX, notifikasi, status Leave).

---

## 13. Analisis Database dan Data Model

Backend Prisma schema sangat lengkap (PostgreSQL, snake_case mapping, 29 enum).

### Entity utama

| Entity | Fungsi | Relasi | Catatan |
|--------|--------|--------|---------|
| Tenant | Perusahaan di level platform | → banyak Workspace | Puncak hierarki tenant |
| Workspace | Ruang kerja terisolasi | → Employee, Location, Shift, dll | **Batas tenancy** (`workspaceId` di mana-mana) |
| User | Akun login | ← AuthUser (`authUserId` unik) | Sole identity key |
| RoleAssignment | Hak akses user di workspace | → Permission | Inti RBAC + scope |
| Permission | Katalog izin | ← RoleAssignment | 15 key di-seed |
| Employee | Profil karyawan | → AttendanceLog, LeaveRequest | Unik `[workspaceId,employeeCode]` & `[workspaceId,email]` |
| Department | Divisi | self-ref parent | — |
| Location | Lokasi geofence | — | lat/lng float, radiusMeters, createdBy/updatedBy |
| Shift | Jadwal kerja | — | start/end "HH:mm", grace, workDays[], effectiveFrom |
| AttendanceLog | Check-in/out | → Employee, Location, Shift | Index komposit kuat, originalCheckInAt, syncedAt |
| LeaveRequest | Izin/cuti | → Employee | type=String (bukan FK ke LeaveType) |
| ExportJob | Job export async | — | status, filePath, signedUrlExpiresAt |
| AuditLog | Catatan perubahan | — | workspaceId wajib, old/new JSON |
| Notification | Notifikasi | — | enum tipe ada, tapi tak pernah dibuat |
| HolidayCalendar | Hari libur | — | dipakai absentJob |
| LeaveType | Tipe cuti per workspace | — | unik `[workspaceId,name]` |

### Catatan model
- **Soft-delete:** tak ada `deletedAt`; pakai status enum (Archived/Inactive). DELETE sengaja dihindari untuk employee/location/shift/department.
- **Model dead/tak dipakai:** `WorkspaceSetting` (service baca kolom Workspace langsung), `AttendanceRawLog` (tak pernah ditulis).
- **Website Prisma** hanya simpan tabel auth (User/Session/Account/Verification) — semua data bisnis di backend.

| Aspek | Status |
|-------|--------|
| Entity & relasi | Lengkap & sesuai PRD |
| Index | Ada (komposit untuk query berat) |
| Constraint | Ada (unique komposit per workspace) |
| Migration | **Tidak ditemukan** (`db push`) |
| Seed data | Ada (`prisma/seed.ts`, idempotent) |
| Soft delete | Via status enum |

---

> **Lanjut ke:** [PROJECT_ANALYSIS_4B_KUALITAS.md](./PROJECT_ANALYSIS_4B_KUALITAS.md) — Auth, Security, Performance, Code Quality, Testing.
