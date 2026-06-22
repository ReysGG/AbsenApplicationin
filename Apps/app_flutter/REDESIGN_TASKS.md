# AttendX Mobile — Redesain Total UI/UX (Modern Playful)

> Dokumen kerja redesain. Arah yang disepakati dengan user:
> - **Gaya visual:** Modern playful (vibrant + ilustratif)
> - **Cakupan:** Semua layar (full overhaul)
> - **Mode warna:** Light + Dark, **ikut setelan sistem HP** (otomatis)
> - **Font:** Ganti dari Inter → **Plus Jakarta Sans**
> - **Eksekusi:** Kerjakan penuh sampai selesai, verifikasi dengan `flutter analyze`
>
> Catatan lingkungan: path proyek berisi spasi (`David Boy`, `Absen Application`)
> sehingga sebagian operasi shell baca-tulis bisa terputus. Saat mengeksekusi,
> **pakai tool Write/Edit langsung** (bukan `sed`/`cat` via shell), dan selalu
> kutip path. Jalankan task sesuai urutan di bawah.

---

## Status font (sudah disiapkan)

- File `assets/fonts/PlusJakartaSans-Variable.ttf` **sudah diunduh** (variable
  font, mencakup berat ExtraLight→ExtraBold). Tinggal didaftarkan di pubspec.

---

## TASK 1 — Daftarkan font Plus Jakarta Sans

**File:** `pubspec.yaml`

Pada blok `flutter: > fonts:`, tambahkan family baru **di atas** family `Inter`
(Inter boleh dipertahankan sebagai fallback, atau dihapus belakangan). Karena
file ini variable font, daftarkan satu asset untuk semua weight:

```yaml
  fonts:
    - family: PlusJakartaSans
      fonts:
        - asset: assets/fonts/PlusJakartaSans-Variable.ttf
    - family: Inter
      fonts:
        - asset: assets/fonts/Inter-Regular.ttf
          weight: 400
        - asset: assets/fonts/Inter-Medium.ttf
          weight: 500
        - asset: assets/fonts/Inter-SemiBold.ttf
          weight: 600
        - asset: assets/fonts/Inter-Bold.ttf
          weight: 700
```

> Variable font: Flutter memetakan `fontWeight` ke axis `wght` otomatis. Tidak
> perlu mendaftarkan tiap berat terpisah.

Setelah edit: `flutter pub get`.

---

## TASK 2 — Fondasi: warna (palet playful + dark aktif)

**File:** `lib/core/theme/app_colors.dart`

Struktur token saat ini sudah bagus (ada getter dinamis `isDark`). Yang diubah:

1. **Primary** — geser dari navy korporat (`#003D9B`) ke biru-indigo lebih hidup.
   - Light `primary`: `#4F46E5` (indigo-600) atau `#2563EB`. Saran: **`#4F46E5`**.
   - Dark `primary`: `#818CF8` (indigo-400) agar kontras di latar gelap.
2. **Secondary** jadi aksen ungu-magenta playful (sudah ada `#B845FF` di dark).
   - Light `secondary`: `#7C3AED`.
3. **Brand gradient** (header) dibuat lebih "pop" — gradasi 3-stop:
   - `brandStart #6366F1` → `brandMid #7C3AED` → `brandEnd #4F46E5`.
   - Untuk dark, gradient versi lebih gelap: `#4338CA → #6D28D9 → #3730A3`.
4. **Accent palette** dipertahankan tapi disegarkan agar konsisten:
   - `accentViolet #8B5CF6`, `accentCyan #06B6D4`, `accentGreen #10B981`,
     `accentRose #F43F5E`, tambah `accentAmber #F59E0B`, `accentPink #EC4899`.
5. **pageBg**: light `#F5F6FB` (sedikit ungu-netral), dark `#0B0B12`.
6. **Card tokens** dibuat lebih lembut + radius besar (lihat Task 3).
   - `cardBorder` light `#ECEDF5`, dark `#23263A`.
7. **Gradient util baru** (opsional, untuk tombol/tile playful):
   - `accentGradient(Color a, Color b)` helper, atau simpan beberapa
     `List<Color>` siap pakai (mis. `tileGradients`).

> PENTING: jangan hapus token lama yang dipakai luas (`brandMid`, `success`,
> `pending`, dll). Cukup ubah nilainya. Semua layar menarik dari getter ini, jadi
> mengubah nilai = otomatis berdampak ke seluruh app.

---

## TASK 3 — Fondasi: tipografi (Plus Jakarta Sans)

**File:** `lib/core/theme/app_typography.dart`

- Ganti `_family = 'Inter'` → `_family = 'PlusJakartaSans'`.
- Naikkan sedikit berat heading agar terasa playful/tegas:
  - `display` w800, `headlineLg` w700, `headlineMd` w700, `titleLg` w700.
- `letterSpacing` heading dirapatkan sedikit (-0.5..-1) — sudah mendekati.
- Body tetap w400/w500 (PlusJakarta lebih bulat, tetap nyaman dibaca).

---

## TASK 4 — Fondasi: spacing & radius (lebih membulat)

**File:** `lib/core/theme/app_spacing.dart`

- Naikkan skala radius agar lebih "playful/rounded":
  - `AppRadius`: `sm 8`, `md 12`, `lg 16`, `xl 20`, `xxl 28`, `full 9999`.
- Spacing 4px rhythm tetap. Tambah `xxl = 40` bila perlu hero section.

---

## TASK 5 — Fondasi: ThemeData (light + dark, ikut sistem)

**Files:** `lib/core/theme/app_theme.dart`, `lib/app.dart`

`app_theme.dart`:
- Pastikan `light()` dan `dark()` memakai font `PlusJakartaSans` (lewat
  `fontFamily: 'PlusJakartaSans'`).
- Tombol: radius `AppRadius.lg` (kini 16), tinggi minimum nyaman (52–54).
- Input: `filled` dengan `surfaceContainerLow`, border lembut, focus 2px primary.
- Naikkan `chipTheme`, `cardTheme` radius mengikuti token baru.

`app.dart` (KUNCI dark mode dibuka):
```dart
// HAPUS pemaksaan light:
// AppColors.isDark = false;
// themeMode: ThemeMode.light,

// GANTI jadi ikut sistem:
final brightness = MediaQuery.platformBrightnessOf(context);
AppColors.isDark = brightness == Brightness.dark;

return MaterialApp.router(
  title: AppConfig.appName,
  debugShowCheckedModeBanner: false,
  theme: AppTheme.light(),
  darkTheme: AppTheme.dark(),
  themeMode: ThemeMode.system,
  routerConfig: router,
);
```

> Karena `AppColors.isDark` adalah state statis yang dibaca oleh widget non-theme
> (mis. `pageBg`, `cardBorder`), set nilainya dari `platformBrightnessOf` setiap
> build root. Bungkus root dengan listener perubahan brightness bila perlu
> (mis. gunakan `WidgetsBindingObserver` di app shell) agar toggle sistem
> langsung memicu rebuild. Alternatif paling aman: pindahkan `isDark` ke
> `Builder` yang membaca `Theme.of(context).brightness` di tiap layar — tapi ini
> perubahan lebih besar; cukup set di root + `didChangePlatformBrightness`.

---

## TASK 6 — Komponen inti

### 6a. `lib/core/widgets/solid_card.dart`
- Radius default → `AppRadius.xxl` (28).
- Tambah opsi `gradient` (List<Color>?) agar kartu hero bisa playful.
- Bayangan: pertahankan dua-lapis, tapi warnai sedikit dengan primary di light
  (`primary.withValues(alpha: .06)`) untuk kesan hidup. Dark tetap netral gelap.
- Tambah opsi `accent` (Color?) untuk strip aksen kiri / ring tipis (opsional).

### 6b. `lib/core/widgets/brand_header.dart` + header di `home_screen.dart`
- Pakai **gradient 3-stop** baru (`brandGradient`).
- Tambah elemen dekoratif playful: 1–2 lingkaran blur transparan (`Positioned`
  + `Container` bulat `white.withValues(alpha:.08)`) di pojok header → kesan
  "bubble". Jaga agar tidak mengurangi keterbacaan teks putih.
- Radius bawah header → 28–32.

### 6c. `lib/features/shell/main_shell.dart` (bottom nav)
- Pertahankan struktur pill + bounce. Segarkan:
  - Indikator aktif: kapsul gradient (primary→secondary) alih-alih solid.
  - Icon aktif putih, label gradient/primary.
  - Bar diberi radius atas (top 24) + shadow lembut, melayang sedikit dari tepi
    (margin horizontal 12, bottom 8) → gaya "floating nav" playful (opsional;
    bila ingin aman tetap full-width).

### 6d. `lib/core/widgets/status_badge.dart`
- Tetap pill 10% opacity. Tambah varian `filled` (solid + teks putih) untuk
  status penting (mis. "Terlambat").

### 6e. `lib/core/widgets/page_background.dart`
- Tambah opsi latar dengan **blob gradient halus** (2 lingkaran besar blur
  primary/secondary alpha rendah) di belakang konten → kedalaman playful.
  Default tetap polos agar performa aman; aktifkan di Login & Home.

---

## TASK 7 — Redesain layar (urut)

Semua layar menarik token, jadi setelah Task 2–6 mereka **sudah berubah**.
Penyesuaian per layar:

1. **Splash** (`features/auth/splash_screen.dart`)
   - Logo + gradient brand fullscreen, animasi skala lembut.
2. **Login** (`features/auth/login_screen.dart`)
   - `PageBackground` blob aktif. Logo gradient. Tombol "Masuk" gradient.
   - Kartu login radius 28, field di `surfaceContainerLow`.
3. **Home** (`features/home/home_screen.dart`)
   - Header bubble gradient. Jam besar tetap. Kartu aksi: tombol check-in
     gradient (primary→secondary), check-out solid rose.
   - QuickGrid: tiap ikon pakai latar gradient lembut sesuai accent.
   - Tambah ilustrasi/empty-state ramah bila `homeData` kosong.
4. **Riwayat** (`features/history/history_screen.dart`)
   - FilterChip aktif gradient. Kartu riwayat radius 24, badge status filled
     untuk "Terlambat".
5. **Izin** (`features/leave/leave_screen.dart` + `create_leave_screen.dart`)
   - Hero form gradient sesuai tipe. Summary card ringkas dengan ikon.
6. **Jadwal** (`features/schedule/schedule_screen.dart`)
   - Kartu shift dengan aksen warna mode kerja (WFO/WFH), timeline lembut.
7. **Profil** (`features/profile/profile_screen.dart`)
   - Header avatar dengan ring gradient. Section card konsisten.
8. **Notifikasi** (`features/notifications/notifications_screen.dart`)
   - Item dengan ikon kategori warna, unread dot, empty-state ilustratif.
9. **Flow check-in / face**
   (`features/attendance/checkin_prep_screen.dart`,
    `location_validation_screen.dart`, `face_verification_screen.dart`,
    `checkin_success_screen.dart`, `features/auth/face_enroll_screen.dart`)
   - Latar gelap netral untuk kamera; overlay panduan dengan aksen primary;
     layar sukses dengan animasi centang + konfeti lembut (opsional Lottie).

> Empty-state ilustratif: sudah ada `LottieIcon` (`assets/anim/`). Pakai ulang
> untuk Home/Notifikasi/Jadwal kosong agar konsisten.

---

## TASK 8 — Verifikasi

```powershell
cd "Apps\app_flutter"
& 'C:\flutter\bin\flutter.bat' pub get
& 'C:\flutter\bin\flutter.bat' analyze
```
- Perbaiki semua error/warning yang muncul dari perubahan.
- Uji manual light & dark (ubah tema sistem emulator) untuk kontras teks.
- Build cek: `& 'C:\flutter\bin\flutter.bat' build apk --debug` (opsional).

---

## Prinsip menjaga konsistensi

- Jangan hardcode warna di layar — selalu lewat `AppColors.*` getter (dark-aware).
- Jangan hardcode `fontFamily` 'Inter' lagi di layar; biarkan ikut theme, atau
  ganti ke `'PlusJakartaSans'` bila eksplisit (cek: `home_screen.dart`,
  `brand_header.dart` ada `fontFamily: 'Inter'` literal yang harus diganti).
- Radius & spacing selalu dari `AppRadius` / `AppSpacing`.
- Animasi: pakai `flutter_animate` yang sudah ada; jaga durasi 280–380ms.

## Daftar literal `fontFamily: 'Inter'` yang perlu diganti

Cari di seluruh `lib/` string `'Inter'` dan ganti ke `'PlusJakartaSans'`
(diketahui ada di: `home_screen.dart` beberapa tempat, `brand_header.dart`).
Setelah `_family` di typography diubah, sisa literal inilah yang tertinggal.
