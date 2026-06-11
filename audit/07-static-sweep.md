# 07 — Static / Not-Synced Sweep + Button/Link Findings

> Sweep menyeluruh atas keluhan "banyak yang statis & tidak sinkron". Read-only.
> Tanggal: 2026-06-11.

## RINGKASAN
- **Workspace dashboard**: semua tombol/aksi nyata (API). Aman.
- **Admin console**: data + aksi **local-state only** (mock), banyak dead-link (sebagian sudah diperbaiki sesi ini).
- **Mobile**: tidak ada data bisnis di-hardcode di widget — semua lewat repository. Yang tampil sekarang = mock seed (karena `useMockData` default `true`). 3 stub nyata: file picker, peta, tombol "Bantuan".
- **Landing page**: marketing statis (wajar), tapi ada CTA mati + logo/testimoni fiktif.

---

## A. Sudah diperbaiki sesi ini ✅
1. **Aktivasi karyawan 404** — activate page POST ke endpoint salah → diperbaiki ke `/api/v1/employees/activate` + BFF allowlist publik. (`activate/page.tsx:162`, `api/[[...path]]/route.ts`)
2. **Link aktivasi port salah** — `APP_URL` ditambah ke backend env compose → `http://localhost:10000`.
3. **AdminSidebar dead-links** — grup "Menu Utama" (12 route 404: `/admin/employees`, `/admin/departments`, `/admin/attendance/*`, `/admin/reports/*`, `/admin/notifications`, `/admin/locations`, `/admin/documents`, `/admin/access`, `/admin/settings`) **dihapus**. Sisakan "Platform Admin" (route nyata).
4. **Gate `/admin` + halaman workspace sensitif** — server-side permission guard (sesi sebelumnya).
5. **CTA & link mati landing page** — disambungkan ke route nyata `/sign-up` / anchor section:
   - Navbar "Beranda" `#` → `#hero` (+ `id="hero"` di Hero section)
   - Footer "Beranda" `#` → `#hero`
   - Hero: "Coba Gratis 14 Hari" → `/sign-up`; "Lihat Demo Video" → `#fitur`
   - CTA: "Coba Gratis" → `/sign-up`; "Hubungi Tim Sales" → `#harga`
   - Pricing: 2× "Mulai Uji Coba" + "Hubungi Sales" → `/sign-up`

   Masih TODO (butuh halaman baru, tak difabrikasi): Footer "Kebijakan Privasi / Ketentuan Layanan / Hubungi Kami" masih `href="#"` — perlu halaman legal/kontak nyata.

> Perbaikan #1–#4 perlu **verifikasi build/runtime** saat Docker hidup. #5 (landing) butuh `next build` untuk konfirmasi (import Link ditambah di Hero/CTA/Pricing).

---

## B. Admin console — LOCAL-STATE ONLY (belum disambung API)
Semua aksi terlihat "berhasil" tapi hilang saat refresh (hanya `useState` array mock). Backend tidak punya route `/admin`.

| Page | Aksi local-only | file:line |
|---|---|---|
| admin/users | Invite, Deactivate, Edit role(alert), Reset pw(alert) | users/page.tsx:62,83; UserTable.tsx:119,137 |
| admin/tenants | Add/Suspend/Delete, Impersonate(alert) | tenants/page.tsx:86,106,111; TenantDrawer.tsx:191 |
| admin/billing | Create invoice, Update status, Export(no-op), Email(alert) | billing/page.tsx:77,97,124; InvoiceDrawer.tsx:103 |
| admin/tickets | Close/Open/Reply | tickets/page.tsx:144,172,178 |
| admin/platform | Time range + Export Report (no-op) | platform/page.tsx:74,78 |
| admin/system-health | Sebagian real (audit feed); latency `Math.random()` | system-health.tsx:84-95,125-128 |
| admin (index) | quickActions `href="#"` (Rekap/Export/Sync) | DashboardPage.tsx:286-288 |

**Rekomendasi**: feature-flag/hide seluruh `/admin/*` di produksi sampai backend platform-admin dibangun — saat ini "kelihatan jadi" padahal kosong.

---

## C. Mobile — stub nyata (arsitektur sudah benar via repo)
Data bisnis TIDAK di-hardcode di widget; semua lewat repository (punya `Remote*` impl). Yang tampil = mock seed karena `useMockData` default `true` (`app_config.dart:15`).

| Item | Masalah | file:line |
|---|---|---|
| Upload bukti izin | Fake — hardcode `'bukti_pengajuan.pdf'`, tak ada file picker | create_leave_screen.dart:156-159 |
| Peta detail presensi | Placeholder — cuma teks lat/lng, tak ada tile | attendance_detail_screen.dart:150-184 |
| Tombol "Bantuan" (profil) | Dead — `onTap: () {}` | profile_screen.dart:99 |
| Badge "verified" avatar | Dekoratif, tak terkait flag apa pun | profile_screen.dart:41-49 |
| (sudah diketahui) GPS/face/liveness/offline | Simulasi — lihat `03-mobile.md` | — |

Clock home = real (`DateTime.now` + Timer). Bottom-nav 5 tab semua route nyata.

---

## D. Landing page — marketing statis (wajar) + cacat fungsional
| Item | Catatan | file:line |
|---|---|---|
| CTA buttons | **MATI** — `<button>` tanpa onClick/link ("Coba Gratis", "Lihat Demo", "Mulai Uji Coba", "Hubungi Sales") | Hero/CTA/Pricing |
| Footer links | `href="#"` (Privasi, Ketentuan, Hubungi, Beranda) | Footer.tsx:22,32-34 |
| Navbar "Beranda" | `href="#"` | Navbar.tsx:37 |
| Logo perusahaan | Fiktif (gojek/tokopedia/dll) implying pelanggan | Hero.tsx:84-110 |
| Testimoni | Fiktif + foto stok | Testimonials.tsx:4-56 |
| "Live" feed | Fabricated via `Math.random()` tiap 4s | GlobalReach.tsx:15-51, Features.tsx:32-53 |

Anchor (`#fitur`/#alur/#harga/#faq) valid. `/sign-in`,`/sign-up` ada.

---

## E. NotificationBell — wired benar, tapi selalu kosong
`components/dashboard/NotificationBell.tsx` fetch `/v1/notifications` + poll 30s + mark-read nyata. Bukan fake. Tapi karena **backend tak pernah menulis notifikasi** (`createNotification` 0 call-site), bell selalu kosong & badge 0. Gap-nya di backend (lihat `04-backend-db.md`), bukan frontend.

---

## F. Prioritas perbaikan berikut (belum dikerjakan)
- **P1**: Sambungkan `createNotification()` di backend (leave baru/approve/reject, export selesai) → bell & mobile notif jadi hidup.
- **P1**: Feature-flag/hide `/admin/*` mock di produksi, atau bangun backend-nya.
- **P1**: CTA landing page → arahkan ke `/sign-up` atau `/login`; perbaiki `href="#"` footer/navbar.
- **P2 (mobile)**: file picker (`image_picker`/`file_picker`), peta nyata (`flutter_map`), hapus/ isi tombol "Bantuan".
- **P2**: ganti logo/testimoni fiktif landing (atau beri label "ilustrasi").
