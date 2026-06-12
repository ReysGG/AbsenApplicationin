# PROJECT_ANALYSIS — Bagian 4B: Auth, Security, Performance, Code Quality, Testing

> Lanjutan dari [PROJECT_ANALYSIS_4A_KUALITAS.md](./PROJECT_ANALYSIS_4A_KUALITAS.md). Memuat **Bagian 14–18**.

---

## 14. Analisis Authentication dan Authorization

### Dua jalur autentikasi
- **Web (HMAC BFF):** Next.js BFF (`app/api/[[...path]]/route.ts`) validasi sesi better-auth, lalu tandatangani konteks `{authUserId, email, fullName, workspaceId}` dengan HMAC-SHA256 (`INTERNAL_JWT_SECRET`), teruskan ke Express. Middleware `authenticate` verifikasi (timing-safe), resolusi user **strictly by `authUserId`** (anti account-takeover), re-derive role/permission/scope dari DB.
- **Mobile (Bearer):** better-auth bearer plugin. `authenticateMobile` validasi token, wajib ada Employee tertaut (akun admin murni ditolak dari mobile). Scope via ownership di service layer.

### Status per area

| Area | Status | Catatan |
|------|--------|---------|
| Login (web) | Sudah | better-auth email/password |
| Login (mobile) | Sudah | bearer, employee-only |
| Register | Parsial | `/sign-up` ada tapi `disableSignUp:true` di server (kontradiktif) |
| Aktivasi karyawan | Sudah | via token email, set password |
| Logout | Sudah | web & mobile + audit |
| Forgot/reset password | Sudah | better-auth (web) |
| Session/token | Sudah | cookie 24h (web), bearer (mobile) |
| Refresh token | **Belum** | Disimpan tapi tak dipakai (mobile) |
| Protected route | Sudah | `proxy.ts` + layout RSC (web) |
| Role-based access | Sudah (server) / Parsial (UI) | UI sebagian hardcoded |
| Backend authorization | Sudah | RBAC + scope + workspace dienforce |
| Cross-workspace guard | Sudah | ditolak + diaudit |

**Penilaian:** Lapisan auth/authorization adalah salah satu yang terkuat. Risiko utama: kepemilikan `INTERNAL_JWT_SECRET` (by design BFF) dan tidak adanya refresh flow di mobile.

---

## 15. Analisis Security

| Risiko / Aspek | Status | Prioritas | Catatan / Solusi |
|----------------|--------|-----------|------------------|
| Hardcoded secret | **Aman** | — | Tak ada secret produksi di source; `.env.example` placeholder; env divalidasi Zod ≥32 char |
| Mobile kirim verifikasi palsu | **Risiko** | High | `faceVerified:true` + GPS hardcoded → absensi bisa dimanipulasi. Wajib sensor nyata |
| Supabase RLS belum aktif | **Risiko** | High | Hanya app-layer isolation; aktifkan RLS sebagai lapisan kedua |
| Input validation | Baik | — | Zod per modul |
| Authorization backend | Baik | — | RBAC + scope + workspace, tak hanya frontend |
| Rate limiting | Ada | — | general 500/15m, sensitive 50/15m, auth 10/15m (in-memory, single-instance) |
| Login lockout | Ada | Medium | 5×/15min → lock 15min (in-memory, hilang saat restart) |
| Audit logging | Sangat baik | — | Aksi penting + percobaan ilegal tercatat |
| Error tak bocor stack | Baik | — | errorHandler tak leak ke client |
| Helmet + CORS | Ada | — | Origin dari `CORS_ORIGIN`, credentials |
| CSP web | Ada | — | `next.config.ts` header ketat, `connect-src 'self'` |
| Header spoof guard | Ada | — | BFF strip header `x-user-context*` dari inbound |
| Secure storage token (mobile) | Ada | — | encryptedSharedPreferences |
| `manage_geofence` tak dienforce | Risiko | Medium | Radius bisa diubah tanpa permission |
| File export ownership | Ada | — | Signed URL + cek ownership |
| Bucket Supabase | **Perlu cek** | High | Harus diset private sebelum production |
| Data wajah di dashboard | Aman | — | Hanya status, bukan model wajah |

**Kesimpulan:** Fondasi security backend kuat. Dua risiko tertinggi bersifat fungsional: **mobile mengirim data verifikasi palsu** dan **RLS belum aktif**. Keduanya High dan wajib sebelum production.

---

## 16. Analisis Performance

| Area | Status | Catatan |
|------|--------|---------|
| Pagination | Ada | Server-side di list pages (web) + cap di backend |
| Query DB | Baik | Index komposit untuk dashboard/report |
| Dashboard load | Baik | 4 call paralel `Promise.allSettled` |
| Polling | Ada | Attendance 10s, exports 15s, notif 30s (bukan websocket — cukup v1) |
| Export besar | Ada | Async >5000 baris via ExportJob + worker, >50000 ditolak |
| Lazy loading | Sebagian | LocationMap `ssr:false` dinamis |
| Image optimization | Tidak diverifikasi | Perlu cek aset landing |
| Caching | Minimal | `no-store` di `/api/*`; tak ada cache layer data |
| Bundle size | Tidak diukur | Banyak animasi magicui di landing — perlu cek |
| RSC data fetch | **Tidak sesuai klaim** | `PERFORMANCE.md` klaim list page fetch di Server Component, faktanya semua `"use client"` fetch di client |
| Jobs in-process | Risiko skala | `setInterval` single-instance |

**Target PRD** (load <3s, filter <1.5s, export <10s/5000 baris, Lighthouse ≥85): arsitektur mendukung, tapi **belum ada pengukuran nyata** (diakui di `PERFORMANCE.md`).

---

## 17. Analisis Code Quality

| Area | Penilaian | Catatan |
|------|-----------|---------|
| Konsistensi naming | Baik | Konsisten per app |
| Pemisahan concern | Sangat baik (backend) | routes/controller/service/schema |
| Reusability | Baik | Komponen ui, repository pattern, middleware |
| Type safety | Baik | TS strict (backend+web), Dart typed; Zod validasi |
| Readability | Baik | Komentar bahasa Indonesia di beberapa tempat |
| Duplikasi kode | Sedang | Tiap web page reinvent fetch (useFetch tak dipakai) |
| Error handling | Sangat baik (backend) | AppError hierarchy |
| Struktur file | Sangat baik | Feature-first (mobile), modular (backend) |
| Complexity | Wajar | — |
| Dead code | Ada | role dashboards orphan, WorkspaceSetting/AttendanceRawLog tak dipakai, sidebar dead links |
| Dependency tak perlu | Ada | `exceljs` & `supertest` terpasang tapi tak dipakai |
| Linting | Kurang | Backend tak ada ESLint (`lint`=`tsc`); web ada eslint config |
| Dua sistem styling (web) | Inkonsistensi | gray/slate vs Material token |

**Penilaian:** Kualitas kode di atas rata-rata, terutama backend. PR utama: bersihkan dead code & dependency tak terpakai, konsolidasi pola fetch & styling di web, tambah ESLint backend.

---

## 18. Analisis Testing

| Jenis Test | Status | Catatan |
|------------|--------|---------|
| Unit test backend (service/middleware) | **Ada (baik)** | Vitest, 11 file; middleware.test.ts thorough (HMAC, RBAC, scope, isolasi). **Tapi semua Prisma di-mock** |
| Integration/HTTP test backend | **Tidak ada** | supertest terpasang tapi tak dipakai; tak ada test DB nyata |
| Unit test mobile | **Minimal** | Hanya 1 test geofence math (`work_location.dart`); tak ada test controller/repo/widget |
| E2E web (Playwright) | **Dangkal** | Hanya route publik & redirect; tak ada journey authenticated/CRUD |
| Test aksesibilitas web | Ada | Label form, role=alert, lang=id (Playwright) |
| Test permission/role | Ada (unit) | Di middleware.test.ts |
| Coverage e2e authenticated | **Tidak ada** | — |

### Rekomendasi test yang perlu dibuat

| Test | Prioritas |
|------|-----------|
| Integration test backend dengan DB test nyata (supertest) | High |
| E2E web: login → CRUD employee/location/shift → export | Medium |
| Mobile: test controller, repository, mapper | Medium |
| Mobile: test check-in flow (setelah GPS/wajah nyata) | Medium |
| Regression test multi-tenant isolation end-to-end | Medium |

**Penilaian:** Test ada dan bermakna di level unit backend (terutama security path), tapi **tidak ada satu pun integration/e2e test yang menyentuh DB atau alur login nyata**. Untuk produk yang mengklaim isolasi multi-tenant, integration test adalah gap High.

---

> **Lanjut ke:** [PROJECT_ANALYSIS_5_ROADMAP.md](./PROJECT_ANALYSIS_5_ROADMAP.md) — Dokumentasi, kesesuaian produk, rekomendasi tambahan, refactor, roadmap, kesimpulan.
