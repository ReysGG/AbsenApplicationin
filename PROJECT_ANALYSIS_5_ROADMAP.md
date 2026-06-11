# PROJECT_ANALYSIS — Bagian 5: Roadmap & Kesimpulan

> Lanjutan dari [PROJECT_ANALYSIS_4B_KUALITAS.md](./PROJECT_ANALYSIS_4B_KUALITAS.md). Memuat **Bagian 19–25** (penutup).

---

## 19. Analisis Dokumentasi

| Dokumentasi | Status | Catatan |
|-------------|--------|---------|
| README utama (root) | **Sangat baik** | Bahasa Indonesia lengkap: arsitektur, port, cara run Docker & mobile, env, mobile API, struktur, catatan/batasan |
| PRD | **Sangat baik** | Detail: scope, role/permission, feature spec, data model, API contract, NFR, milestone, MVP cut |
| Design system | Ada | `DESIGN (1).md` |
| docs/plans | Ada | Rencana backend & flutter |
| Cara install & run | Ada | Di README (Docker + non-Docker + mobile) |
| Environment variable | Ada | Tabel lengkap di README + `.env.example` |
| API documentation | Parsial | Ringkasan mobile API di README + API contract di PRD; tak ada OpenAPI/Swagger |
| Folder structure | Ada | Di README |
| Deployment guide | Parsial | Docker compose dijelaskan; production checklist (RLS) di `SUPABASE_RLS.md` |
| Accessibility | Ada | `ACCESSIBILITY.md` (website) |
| Performance | Ada | `PERFORMANCE.md` (website) — sebagian klaim tak sesuai (RSC) |
| README website | **Boilerplate** | `create-next-app` default, bukan project-specific |
| Contribution guide | **Tidak ditemukan** | — |
| Changelog | **Tidak ditemukan** | — |
| CLAUDE.md / AGENTS.md | Ada | Warning Next 16 |

**Penilaian:** Dokumentasi produk (PRD, README root) jauh di atas rata-rata. Yang kurang: API docs formal (OpenAPI), contribution guide, changelog, dan README website masih boilerplate.

---

## 20. Analisis Kesesuaian dengan Kebutuhan Produk

Dibandingkan dengan MVP yang direkomendasikan PRD:

| Kebutuhan Produk (MVP PRD) | Status | Catatan |
|----------------------------|--------|---------|
| Auth + Role Guard | **Sudah** | Server-enforced |
| Overview Dashboard | **Sudah** | Leave count under-report |
| Workforce CRUD | **Sudah** | Lengkap |
| Locations + geofence | **Sudah** | `manage_geofence` tak dienforce |
| Shifts | **Sudah** | Lengkap |
| Live Attendance | **Sudah** | Halaman terkaya |
| Reports Export CSV/Excel | **Parsial** | CSV ok, XLSX palsu |
| Basic Settings | **Parsial** | Backend ok, web save palsu |
| Audit Log | **Sudah** | Lengkap |
| Multi-tenant isolation | **Parsial** | App-layer ok, RLS belum |
| **Mobile attendance (sumber data)** | **Parsial** | Alur ada, **GPS+wajah simulasi** |

| Pertanyaan kunci | Jawaban |
|------------------|---------|
| Fitur utama tersedia? | **Sudah** (web dashboard HR) / **Parsial** (mobile smart attendance) |
| Flow utama berjalan? | **Sudah** untuk HR; mobile check-in jalan tapi data verifikasi palsu |
| Data real/API? | **Sudah** untuk web workspace + mobile data flow; admin platform masih mock |
| Siap MVP? | **Hampir** untuk dashboard HR; **Belum** untuk klaim anti-manipulasi mobile |

---

## 21. Komponen atau Module yang Perlu Ditambahkan

| Komponen/Module | Fungsi | Prioritas |
|-----------------|--------|-----------|
| **Mobile: GeolocationService** | Baca GPS nyata + deteksi mock location | High |
| **Mobile: FaceVerificationService** | Kamera + ML Kit + liveness + embedding | High |
| **Mobile: OfflineSyncRepository** | Antrian DB lokal + connectivity + upload retry | Medium |
| **Mobile: FilePickerService** | Pilih & upload lampiran izin nyata | Medium |
| **Mobile: TokenRefreshInterceptor** | Refresh token saat 401 | Medium |
| **Web: AuthContext/UserStore** | Sumber role/permission nyata (ganti hardcode) | Medium |
| **Backend: NotificationDispatcher** | Panggil createNotification di event leave/export | Medium |
| **Backend: XlsxGenerator** | Pakai exceljs untuk .xlsx asli | Medium |
| **Backend: LeaveAttendanceReconciler** | Buat AttendanceLog Leave saat approve | Medium |
| **Backend: PersistentStore (Redis)** | Lockout & token aktivasi persisten | Medium |
| **Web: reusable usePermissions hook** | Konsisten pakai permissionGuards | Low |

---

## 22. Page, Screen, Endpoint, atau Flow yang Perlu Ditambahkan

| Item | Jenis | Alasan | Prioritas |
|------|-------|--------|-----------|
| Endpoint buat notifikasi (internal call) | Flow | Notifikasi kosong tanpa ini | Medium |
| Import karyawan via Excel/CSV | Page + Endpoint | Onboarding massal | Medium |
| Attendance manual correction workflow | Flow | Baru ada admin note | Medium |
| Settings save (PATCH wiring) | Flow | Save web palsu | High |
| Mobile: layar hasil verifikasi wajah gagal | Screen | Sekarang selalu lolos | High |
| Route admin yang dilink tapi tak ada | Page | Sidebar dead links | Low |
| PDF export | Flow | v1.1 | Low |
| Multi-level leave approval | Flow | Open question PRD | Low |

---

## 23. Rekomendasi Refactor

| Bagian | Masalah | Rekomendasi Refactor | Prioritas |
|--------|---------|----------------------|-----------|
| Web data fetching | Tiap page reinvent fetch state | Pakai `useFetch`/`usePollingFetch` yang sudah ada, atau adopsi React Query | Medium |
| Web permission | Hardcode `true`/role | Sentralisasi via context + permissionGuards | Medium |
| Web styling | Dua sistem token | Pilih satu (token Material atau Tailwind gray) | Low |
| Web dead code | role dashboards orphan | Hapus `overview/_components/*` tak terpakai | Low |
| Backend XLSX | CSV berkedok | Pisah generator CSV vs XLSX (exceljs) | Medium |
| Backend model dead | WorkspaceSetting/AttendanceRawLog | Pakai atau hapus dari schema | Low |
| Backend jobs | setInterval in-process | Pindah ke scheduler/queue eksternal | Low |
| Mobile data mock | Bercampur di repository | Pertahankan pola (sudah bagus), pisahkan seed mock | Low |
| Backend dependency | exceljs/supertest tak dipakai | Pakai atau hapus | Low |

---

## 24. Roadmap Pengembangan

### Prioritas High (wajib sebelum MVP/production nyata)
1. **Mobile: integrasi GPS nyata** (`geolocator`) + deteksi mock location.
2. **Mobile: face recognition + liveness nyata** (`camera` + ML Kit + embedding).
3. **Backend: DB migrations** (`prisma migrate`, commit history).
4. **Backend: aktifkan Supabase RLS** + set bucket private.
5. **Web: settings save nyata** (wire ke PATCH).
6. **Backend: integration test** dengan DB nyata (supertest).
7. **Hentikan pengiriman data verifikasi palsu** dari mobile.

### Prioritas Medium (setelah fondasi)
1. XLSX export nyata (exceljs).
2. Trigger notifikasi (leave baru, export selesai).
3. Buat AttendanceLog status Leave saat approve.
4. Check-in pakai timezone workspace.
5. Enforce `manage_geofence`.
6. Mobile: offline sync nyata + file picker lampiran + refresh token.
7. Web: permission UI dari data nyata, Devices/Security tab nyata, leave balance nyata.
8. Store persisten (Redis) untuk lockout/token.
9. Import karyawan Excel/CSV; manual correction workflow.
10. E2E authenticated test (web) + test mobile controller/repo.

### Prioritas Low (enhancement)
1. PDF export.
2. Dark mode mobile + bundle font Inter.
3. Bersihkan dead code & dead links, konsolidasi styling.
4. ESLint backend; hapus dependency tak terpakai.
5. dailySummaryJob tulis DB; cleanupExportJob hapus file.
6. Job scheduler eksternal; websocket real-time.
7. Billing/tickets/platform admin (v2), multi-level approval.
8. OpenAPI/Swagger, contribution guide, changelog, README website.

---

## 25. Kesimpulan

Secara keseluruhan, project AttendX berada pada tahap **menengah menuju MVP** — bukan prototipe, tapi belum siap production penuh.

**Seberapa matang?** Backend dan web dashboard HR adalah **produk nyata yang terintegrasi**: backend Express modular dengan RBAC + scope + isolasi multi-tenant + audit yang dienforce di server dan sudah di-unit-test; web dashboard HR polished dengan loading/empty/error state, form tervalidasi, dan aksesibilitas yang baik. Ini bukan UI kosong — mayoritas endpoint DB-backed dan mayoritas halaman workspace benar-benar memanggil API.

**Bagian paling kuat:** **Backend** (arsitektur, keamanan auth/HMAC, RBAC+scope, audit, geofence server-side, background jobs) dan **web dashboard HR** (kualitas UI/UX & integrasi data).

**Bagian paling lemah:** **Mobile smart attendance** — tiga pilar nilai produk (GPS asli, face recognition + liveness, offline sync) **masih disimulasikan** dan package-nya bahkan tidak terpasang. Mobile mengirim `faceVerified:true` dengan koordinat hardcoded ke server, sehingga validasi backend yang sudah benar pun menerima data palsu.

**Risiko terbesar:**
1. **Klaim anti-manipulasi belum berlaku** — karena GPS & wajah simulasi, absensi saat ini bisa dipalsukan. Ini bertentangan langsung dengan tujuan utama produk.
2. **RLS belum aktif & tidak ada DB migrations** — risiko isolasi data & maintainability schema di production.
3. **Tidak ada integration test** untuk produk yang mengklaim isolasi multi-tenant.

**Apakah siap MVP?** **Hampir** untuk sisi dashboard HR (tinggal settings save, XLSX, dan beberapa penyempurnaan). **Belum** untuk sisi mobile, karena fitur inti masih kulit.

**Apakah siap production?** **Belum.** Wajib menyelesaikan prioritas High: GPS & wajah nyata di mobile, DB migrations, aktivasi RLS, settings save, integration test, dan menghentikan pengiriman data verifikasi palsu.

**Langkah berikutnya yang paling penting:** Fokus pada **mobile** — integrasikan `geolocator` dan `camera`+ML Kit agar check-in mengirim data sensor nyata. Tanpa ini, seluruh fondasi backend yang sudah matang tidak bisa menjamin keaslian absensi, dan produk belum memenuhi janji intinya.

---

### Penutup struktur dokumen

Dokumen analisis ini terdiri dari file-file berikut:
1. **PROJECT_ANALYSIS.md** — Ringkasan, Scope, Tech Stack (Bagian 1–3)
2. **PROJECT_ANALYSIS_2A_STRUKTUR.md** — Struktur Folder & Komponen (Bagian 4, 6)
3. **PROJECT_ANALYSIS_2B_ROUTES.md** — Route/Endpoint/Screen (Bagian 5)
4. **PROJECT_ANALYSIS_3A_FITUR_ADA.md** — Fitur Sudah Ada (Bagian 7)
5. **PROJECT_ANALYSIS_3B_FITUR_BELUM.md** — Fitur Belum Ada (Bagian 8)
6. **PROJECT_ANALYSIS_4A_KUALITAS.md** — Kelebihan, Kekurangan, UI/UX, Backend, Database (Bagian 9–13)
7. **PROJECT_ANALYSIS_4B_KUALITAS.md** — Auth, Security, Performance, Code Quality, Testing (Bagian 14–18)
8. **PROJECT_ANALYSIS_5_ROADMAP.md** (file ini) — Dokumentasi, Kesesuaian, Refactor, Roadmap, Kesimpulan (Bagian 19–25)
