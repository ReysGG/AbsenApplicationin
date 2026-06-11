# 05 — Auth, RBAC & Security Audit

## A. Mekanisme saat ini

| Area | Mekanisme | Status |
|---|---|---|
| Login web | better-auth email+password, cookie sesi | OK |
| Login mobile | better-auth bearer token (`/mobile/auth/login`) | OK (teruji live) |
| Lockout | login attempts 5x/15m (web), rate limit | OK |
| Rate limit mobile login | `authRateLimit` 10x/15m per IP+email | OK (ditambah sesi ini) |
| Proteksi route web | `proxy.ts` cek **keberadaan cookie** saja (tanpa role) | OK by design |
| Gate dashboard | `workspace/layout.tsx` blok `end_user` via `canAccessDashboard` (fail-closed) | OK |
| Gate `/admin` | cek `globalRole ∈ {super_admin, admin_platform}` | **Ditambah sesi ini — belum verifikasi runtime** |
| Gate halaman sensitif workspace | `lib/requirePermissionServer.ts` + layout per-route | **Ditambah sesi ini** |
| Enforcement data | backend `requirePermission` + `enforceScope` | OK (coverage luas) |
| Tenant isolation | semua query scoped `workspaceId` + cross-workspace audit | OK |

## B. Temuan

### 🔴 1. Spoofing absensi mobile (risiko utama)
Klien mengirim koordinat hardcoded + `faceVerified=true` (lihat `03-mobile.md`). Backend validasi geofence (Haversine) **tapi** percaya titik yang dikirim klien. Karena klien selalu kirim titik kantor valid, absensi bisa dipalsukan dari mana saja saat remote mode. Wajah tak diverifikasi. **Melanggar PDF 6B.**
- Fix: GPS nyata + deteksi mock-location; face/liveness nyata; (idealnya) face embedding match di server.

### 🟡 2. `/admin` sebelumnya tanpa gate role
`admin/layout.tsx` lama hanya cek sesi → semua user login bisa buka `/admin`. **Sudah ditambal** (cek `globalRole`, fail-closed). Peredam: halaman admin pakai data mock, jadi tak ada data nyata yang bocor. **Perlu verifikasi runtime** (karyawan coba `/admin` → ditolak).

### 🟡 3. Halaman workspace sensitif sebelumnya hanya cosmetic-guard
Support_admin tanpa permission bisa render `/workspace/settings|audit-log|...` (data tetap 403 dari backend, tapi shell render). **Sudah ditambal** dengan `requirePermissionServer` di layout: reports, exports, audit-log, workforce, departments, attendance, leave, locations, shifts. **`settings` sengaja tidak di-gate** (multi-section; backend enforce per-section). Perlu verifikasi runtime.

### 🟡 4. Notifikasi route tanpa `requirePermission`
Hanya `authenticate`. Minor (scoped ke recipient), tapi inkonsisten.

### 🟢 5. Token mobile
Pindah ke `flutter_secure_storage` (Keystore/Keychain) — bukan plaintext lagi. Caveat build di mesin dgn path SDK berisi spasi (didokumentasikan).

### 🟢 6. Secrets
`.env` berisi secret nyata di working tree — pastikan **tidak ter-commit** (lihat backlog: tambah ke `.gitignore`, rotate bila pernah ter-push).

## C. Rekomendasi prioritas
- **P0**: GPS + face nyata di mobile (anti-spoof).
- **P1**: Verifikasi runtime gate `/admin` + halaman sensitif (uji dgn akun `karyawan@attendx.dev` dan support_admin terbatas).
- **P1**: Pastikan `.env` di `.gitignore`; rotate `BETTER_AUTH_SECRET`/`INTERNAL_JWT_SECRET` bila pernah ke remote.
- **P2**: Tambah `requirePermission` di route notifikasi.
- **P2**: Tampilkan pesan `?error=access_denied` / `?error=forbidden` di halaman login/overview (UX, redirect sudah jalan).
