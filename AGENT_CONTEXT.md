# AttendX — Konteks untuk Agent

Ringkasan kondisi proyek + cara melanjutkan. Dibuat dari sesi pengembangan panjang.
Aturan: balas dalam Bahasa Indonesia. Jangan tulis nilai secret di repo (lihat `.env` VPS).

---

## 1. Apa ini

AttendX = aplikasi absensi karyawan (GPS geofence + verifikasi wajah/liveness). Monorepo (pnpm + turbo), 3 app:

| App | Stack | Untuk | Lokasi |
|-----|-------|-------|--------|
| Mobile | Flutter | Karyawan (check-in/out, riwayat, izin, jadwal) | `Apps/app_flutter` |
| Website | Next.js 16 + React 19 | HR/Admin dashboard + platform admin | `Apps/website` |
| Backend | Express 5 + Prisma 7 + better-auth | API web & mobile | `Apps/backend` |
| DB | PostgreSQL | — | container `db` |

**Arsitektur auth (penting):**
- **Mobile** → `Authorization: Bearer <token>` (better-auth bearer) → `/api/v1/mobile/*`, middleware `authenticateMobile`.
- **Website** → BFF proxy `app/api/[[...path]]/route.ts` validasi sesi better-auth → tanda tangan HMAC (`INTERNAL_JWT_SECRET`) → Express (`authenticate`). Website JUGA konek langsung ke Postgres (Prisma adapter) untuk better-auth → makanya website tidak bisa serverless tanpa DB publik (Vercel kurang cocok).
- Web & backend berbagi `BETTER_AUTH_SECRET` + `INTERNAL_JWT_SECRET`.

---

## 2. Model Role (proposal §5.3 — WAJIB dipatuhi)

2 level, **terpisah tegas**. Stakeholder (pembeli) ≠ pemilik produk.

**LEVEL PLATFORM** (pemilik produk / "Tim Kita") — kolom DB `users.global_role`:
- `super_admin` = dev/pemilik website. Akses penuh konsol `/admin`.
- `admin_platform` = support Tim Kita.
- Kelola billing/tenant/monitor/support. **Tidak boleh masuk workspace tenant.**

**LEVEL WORKSPACE** (pelanggan) — tabel `RoleAssignment` (`stakeholder`/`support_admin`/`end_user`):
- `stakeholder` = pemilik perusahaan (semua izin workspace; di platform cuma "Lihat" billing sendiri).
- `support_admin` = HR (scoped per departemen).
- `end_user` = karyawan (mobile).

Gate: `/admin` → `requirePlatformAdmin` (cek `globalRole`); `/workspace` → role workspace.
Definisi role: `Apps/backend/src/lib/permissions.ts`, `middleware/requirePlatformAdmin.ts`, `types/auth.ts`.

---

## 3. Deploy (LIVE)

- **VPS**: `188.166.187.162` (DigitalOcean), **SHARED** dgn project lain (`/root/SocialSync`, `/root/ReysWebsite`, redis). RAM 3.8GB — hati-hati build berat.
- **Path project**: `/root/AttendX` (docker compose). `COMPOSE_PROJECT_NAME=attendx`, volume DB `attendx_attendx_pgdata`.
- **URL live**:
  - API: `https://absen-api.buildwithreys.tech/api/v1`
  - Dashboard HR: `https://absen.buildwithreys.tech`
  - (nginx reverse-proxy + Let's Encrypt; HTTP→HTTPS redirect; auto-renew)
- **Port host**: website `10000`, backend `10001`, postgres `10002`.
- **Source**: GitHub `main` → `https://github.com/ReysGG/AbsenApplicationi.git`.
- **`.env`** di `/root/AttendX/.env` (chmod 600): POSTGRES creds, `BETTER_AUTH_SECRET`, `INTERNAL_JWT_SECRET`, `S3_*`, `NEXT_PUBLIC_APP_URL=https://absen.buildwithreys.tech`, `BETTER_AUTH_URL=https://absen-api.buildwithreys.tech`, `COMPOSE_PROJECT_NAME=attendx`.
- **`docker-compose.override.yml`** (di VPS, TIDAK di git): inject `S3_*` ke backend + `BETTER_AUTH_URL=https://absen.buildwithreys.tech` ke website (karena website butuh domain sendiri, beda dari API).

### Akun demo (password `Attendx2024!`)
| Email | Role | Catatan |
|-------|------|---------|
| `superadmin@attendx.dev` | super_admin (dev) | **dibuat oleh seed yang sudah diperbaiki — belum tentu ada di live, lihat §6** |
| `platform@attendx.dev` | admin_platform | sda |
| `stakeholder@attendx.dev` | stakeholder | sudah di-demote `global_role=user` di live |
| `hradmin@attendx.dev` | support_admin (HR) | login dashboard |
| `karyawan@attendx.dev` | end_user | login mobile |

---

## 4. Storage foto wajah (#7) — Supabase S3

- Endpoint `https://yvxzfvbftqtogarpzzwx.storage.supabase.co/storage/v1/s3`, region `ap-southeast-1`, bucket `face-captures` (sudah dibuat + tervalidasi PUT/HEAD/signed-URL).
- Access key ID + **SECRET ada di `.env` VPS saja** (jangan commit). Disarankan rotate setelah testing.
- Backend pakai `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`, path-style → `Apps/backend/src/config/faceStorage.ts`.
- Alur: mobile capture still saat verifikasi wajah → base64 di body check-in/out → backend upload → simpan key di `attendance_logs.check_in_face_key`/`check_out_face_key` → endpoint detail web keluarkan signed URL → dashboard tampilkan ("Foto Wajah").

---

## 5. Status fitur

**Sudah selesai & live:**
- De-slop UI Flutter (flat Corporate-Modern) + SSE realtime notif di website.
- #1 timezone WIB (`api_mappers.dart` `.toLocal()`).
- #2 clock-out stuck (checkout dulu menjalankan flow check-in) — `home_screen.dart` + `checkin_prep_screen.dart` + error handling `face_verification_screen.dart`.
- #4 reset enroll wajah demo (`faceProfileStatus=NotRegistered` + gate router `/face-enroll`).
- #5 auto "Terlambat" >10 mnt (logic backend `mobile.service.ts` sudah ada; **belum dikonfirmasi live**).
- #6 checkout reuse mode WFO/WFH check-in (tidak tanya lagi).
- #7 capture wajah → S3 → review HR (full stack, live & tervalidasi).
- Fix bug **enroll wajah stuck** (kacamata bikin eyeOpenProbability rendah): kriteria dilonggarkan + soft-decay + tombol "Ambil Foto" manual muncul setelah 7 dtk.
- Fix bug **role**: stakeholder tadinya `super_admin` (shortcut seed) → di-demote live + seed diperbaiki (lihat §6).
- UI polish **pass 1**: `SolidCard` shadow 2-lapis + radius 20 + token `cardShadowAmbient`; home header gradasi (`brandGradient`). Propagate ke semua layar.

**Belum / open:**
- **#3 warna font susah dibaca** → BUTUH screenshot layar dari user (belum tahu layar mana).
- **#5** → konfirmasi "Terlambat" saat re-test.
- **UI polish pass 2** (header premium per-tab Riwayat/Izin/Jadwal/Profil + ikon home lebih "pop" + ilustrasi empty-state) → nunggu arahan user.
- **Form "coba gratis" (email) khusus role dev** → fitur baru, BELUM dibuat. Butuh SMTP + keputusan scope (form publik di landing → daftar request `super_admin`-only → approve = provision tenant?).
- **SMTP belum dikonfigurasi** di VPS → email aktivasi karyawan & reset password TIDAK benar-benar terkirim (cuma ke-log).
- **Token aktivasi karyawan IN-MEMORY** (`employees.activation.ts`) → hilang saat backend restart. Untuk produksi pindah ke DB.

---

## 6. ⚠️ Yang BELUM ter-push ke GitHub (penting untuk agent berikut)

Backend live (`/root/AttendX`) saat ini di commit **`4727fc2`** (sudah ada #7 web display + capture).
Perubahan berikut masih **LOKAL saja** (belum di-commit/push) — ada di APK lokal terakhir tapi belum di repo/VPS:
- `Apps/app_flutter/lib/features/auth/face_enroll_screen.dart` (fix enroll stuck) → **sudah masuk APK terbaru**.
- `Apps/backend/src/prisma/seed.ts` (role fix: bikin `superadmin@`/`platform@`, demote stakeholder) → **belum di-seed di live**.
- UI polish: `lib/core/widgets/solid_card.dart`, `lib/core/theme/app_colors.dart`, `lib/core/theme/app_spacing.dart`, `lib/features/home/home_screen.dart` → **sudah masuk APK terbaru**.

Konsekuensi:
- **Live `/admin` saat ini terkunci**: stakeholder sudah di-demote (via SQL langsung), tapi akun `super_admin` baru belum dibuat. Untuk mengaktifkan: push `seed.ts` → `git pull` di VPS → `docker compose exec backend npx tsx src/prisma/seed.ts` (idempotent, bikin `superadmin@`/`platform@` + demote stakeholder). ATAU buat via SQL (hash password better-auth dihitung lokal).
- APK terbaru ada di `Apps/app_flutter/build/app/outputs/flutter-apk/app-release.apk` (~90MB) — sudah berisi SEMUA fix mobile.

---

## 7. Cara build & deploy

### Mobile (APK)
> SDK Flutter WAJIB di path tanpa spasi: pakai `C:\flutter\bin\flutter.bat` (SDK di `C:\Users\David Boy\flutter` ada spasi → build native-assets/secure-storage GAGAL).
```powershell
cd "Apps\app_flutter"
& 'C:\flutter\bin\flutter.bat' build apk --release --dart-define-from-file=env/prod.json
# env/prod.json → { "USE_MOCK_DATA": false, "API_BASE_URL": "https://absen-api.buildwithreys.tech/api/v1" }
# analyze: & 'C:\flutter\bin\flutter.bat' analyze
```
Build lama → jalankan via `Start-Process ... -RedirectStandardOutput/Error -NoNewWindow -PassThru` lalu poll log (tahan timeout).

### Backend/Website (VPS, via git)
```bash
# di lokal: commit + push ke main
# di VPS:
ssh root@188.166.187.162
cd /root/AttendX && git pull
docker compose up -d --build backend      # atau website / db
# entrypoint backend otomatis: prisma db push --accept-data-loss + seed idempotent
```
- Backend npm pakai `--legacy-peer-deps` (konflik peer zod/better-auth) — Dockerfile sudah handle.
- Skema DB diterapkan via `prisma db push` saat boot container (BUKAN migration) → kolom baru cukup `db push`.

---

## 8. Gotcha teknis (sering bikin error)

- **SSH**: `ssh -o BatchMode=yes -o ConnectTimeout=30 -o ServerAliveInterval=10 root@188.166.187.162` (key auth; kadang flaky → retry).
- **PowerShell menghapus tanda kutip ganda** yang dikirim ke `ssh`/exe → hindari `"`, `(`, `)`, `|` di command remote; untuk SQL/config berkutip **base64-encode lokal** lalu `echo <b64> | base64 -d` di VPS. Hitung base64: `[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes('...'))`.
- **Disk VPS**: build cache docker bisa numpuk besar → `docker builder prune -f` (AMAN: cache saja, bukan image/container/volume). JANGAN `system prune -a` / `--volumes`.
- **Relokasi/compose**: `COMPOSE_PROJECT_NAME=attendx` pin nama project agar volume DB reattach.
- **Website env**: `NEXT_PUBLIC_APP_URL` di-bake saat BUILD (client-side) → harus benar SEBELUM build website; `BETTER_AUTH_URL` website = domain website (`absen.buildwithreys.tech`), backend = domain API (`absen-api...`).

---

## 9. Verifikasi
```bash
cd Apps/backend && npm run typecheck      # tsc --noEmit
cd Apps/website && npx tsc --noEmit
cd Apps/app_flutter && & 'C:\flutter\bin\flutter.bat' analyze
curl -s https://absen-api.buildwithreys.tech/api/v1/health
```

> Proposal lengkap: `Proposal Pengembangan Aplikasi Mobile (2).pdf` (sudah ter-index di knowledge base `attendx-proposal`). README utama: `README.md`. Design mobile: `Apps/app_flutter/DESIGN.md`.
