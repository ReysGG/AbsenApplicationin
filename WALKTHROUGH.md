# Walkthrough: Setup Monorepo Project Absen Application

Dokumen ini menjelaskan cara project ini dibuat menjadi monorepo, file apa saja yang ditambahkan, apakah bisa otomatis, dan kenapa syntax/config-nya bentuknya seperti ini.

## 1. Kondisi project sekarang

Struktur project saat ini:

```txt
Absen Application/
├─ Apps/
│  ├─ website/      # Next.js web app
│  ├─ backend/      # Express backend
│  └─ app_flutter/  # Flutter mobile app
├─ package.json
├─ pnpm-workspace.yaml
├─ turbo.json
├─ .gitignore
└─ WALKTHROUGH.md
```

Ini sudah menjadi monorepo karena beberapa aplikasi berada dalam satu repository/folder utama dan bisa dikelola dari root.

## 2. Apa itu monorepo?

Monorepo adalah satu repository yang berisi lebih dari satu project/package.

Contoh di project ini:

- `Apps/website` untuk frontend Next.js.
- `Apps/backend` untuk backend Express.
- `Apps/app_flutter` untuk mobile Flutter.
- `packages/*` untuk package bersama jika nanti dibutuhkan.

Tujuannya bukan supaya semua teknologi jadi sama, tapi supaya manajemen project lebih rapi dari satu root.

## 3. Apakah ada cara otomatis?

Ada, tapi tidak selalu cocok untuk project yang sudah ada.

### Opsi otomatis 1 — create-turbo

Kalau mulai dari nol, bisa pakai:

```powershell
pnpm dlx create-turbo@latest
```

Ini akan membuat struktur monorepo otomatis, biasanya seperti:

```txt
apps/
packages/
package.json
pnpm-workspace.yaml
turbo.json
```

Tapi untuk project ini, kita **tidak pakai auto generator** karena project sudah punya folder sendiri:

```txt
Apps/website
Apps/backend
Apps/app_flutter
```

Kalau dipaksa pakai generator, biasanya malah membuat project baru dan kita tetap perlu memindahkan file lama secara manual.

### Opsi otomatis 2 — init pnpm workspace manual ringan

Tidak ada command `pnpm init monorepo` resmi yang otomatis membaca semua project dan menebak config terbaik. Biasanya tetap manual:

```powershell
pnpm init
```

Lalu membuat:

```txt
pnpm-workspace.yaml
turbo.json
```

### Kesimpulan auto

Untuk project yang sudah berjalan, setup manual lebih aman karena:

- Tidak merusak folder existing.
- Tidak mengganti dependency yang sudah ada.
- Bisa menyesuaikan Next.js, Express, dan Flutter sekaligus.
- Bisa mempertahankan nama folder `Apps` yang sekarang sudah dipakai.

## 4. File yang sudah dibuat

Aku sudah membuat file root berikut:

```txt
package.json
pnpm-workspace.yaml
turbo.json
.gitignore
```

Aku juga update:

```txt
Apps/backend/package.json
```

Supaya backend punya nama package dan script yang bisa dipanggil dari root.

## 5. Root `package.json`

File root `package.json` sekarang:

```json
{
  "name": "absen-application",
  "version": "0.1.0",
  "private": true,
  "packageManager": "pnpm@10.0.0",
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "web:dev": "pnpm --filter website dev",
    "web:build": "pnpm --filter website build",
    "web:start": "pnpm --filter website start",
    "web:lint": "pnpm --filter website lint",
    "web:doctor": "pnpm --filter website doctor",
    "backend:dev": "pnpm --filter backend dev",
    "backend:start": "pnpm --filter backend start",
    "mobile:get": "cd Apps/app_flutter && flutter pub get",
    "mobile:run": "cd Apps/app_flutter && flutter run",
    "mobile:test": "cd Apps/app_flutter && flutter test",
    "mobile:build:apk": "cd Apps/app_flutter && flutter build apk"
  },
  "devDependencies": {
    "turbo": "latest"
  }
}
```

### Penjelasan syntax `package.json`

#### `name`

```json
"name": "absen-application"
```

Ini nama project root. Karena root bukan aplikasi yang dipublish, namanya bebas tapi sebaiknya jelas.

#### `private`

```json
"private": true
```

Ini penting untuk monorepo. Artinya root package tidak akan tidak sengaja dipublish ke npm.

#### `packageManager`

```json
"packageManager": "pnpm@10.0.0"
```

Ini memberi tahu bahwa project ini sebaiknya dijalankan dengan pnpm. Kalau beda versi pnpm, biasanya masih tetap bisa, tapi field ini membantu konsistensi tim.

#### `scripts`

Bagian ini adalah daftar shortcut command.

Contoh:

```json
"web:dev": "pnpm --filter website dev"
```

Artinya saat menjalankan:

```powershell
pnpm web:dev
```

pnpm akan mencari workspace bernama `website`, lalu menjalankan script `dev` di `Apps/website/package.json`.

Di `Apps/website/package.json`, script-nya ada seperti ini:

```json
"dev": "next dev"
```

Jadi alurnya:

```txt
pnpm web:dev
→ pnpm --filter website dev
→ masuk ke package website
→ menjalankan next dev
```

#### Kenapa ada `web:dev`, bukan cuma `dev`?

Karena root bisa punya banyak aplikasi:

- `web:dev` untuk Next.js.
- `backend:dev` untuk Express backend.
- `mobile:run` untuk Flutter.
- `dev` untuk menjalankan task via Turbo.

Dengan prefix seperti `web:` dan `backend:`, command jadi lebih jelas.

#### `devDependencies`

```json
"devDependencies": {
  "turbo": "latest"
}
```

Turbo dipasang di root karena Turbo bertugas menjalankan task lint/build/dev lintas workspace.

## 6. `pnpm-workspace.yaml`

File ini:

```yaml
packages:
  - "Apps/website"
  - "Apps/backend"
  - "packages/*"
```

### Penjelasan syntax YAML

`pnpm-workspace.yaml` memakai YAML, bukan JSON.

```yaml
packages:
```

Artinya daftar folder yang dianggap workspace oleh pnpm.

```yaml
  - "Apps/website"
  - "Apps/backend"
```

Artinya dua folder ini adalah package Node.js yang bisa diatur oleh pnpm.

```yaml
  - "packages/*"
```

Artinya semua folder langsung di dalam `packages/` nanti juga dianggap workspace.

Contoh jika nanti ada:

```txt
packages/shared-types/package.json
packages/api-client/package.json
```

Maka pnpm otomatis mengenali keduanya.

### Kenapa Flutter tidak dimasukkan?

Flutter bukan package Node.js. `Apps/app_flutter` memakai `pubspec.yaml`, bukan `package.json`.

Jadi Flutter tidak perlu masuk `pnpm-workspace.yaml`.

Tapi Flutter tetap bagian dari monorepo secara struktur, dan tetap bisa dipanggil dari root lewat script:

```powershell
pnpm mobile:run
```

## 7. `turbo.json`

File ini:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**", "build/**"]
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "start": {
      "cache": false,
      "persistent": true
    },
    "doctor": {
      "cache": false
    }
  }
}
```

### Apa itu Turbo?

Turbo adalah task runner untuk monorepo JavaScript/TypeScript.

Tanpa Turbo, kamu bisa tetap menjalankan command satu-satu:

```powershell
pnpm web:build
pnpm web:lint
```

Dengan Turbo, kamu bisa menjalankan command umum dari root:

```powershell
pnpm build
pnpm lint
```

Lalu Turbo akan menjalankan script `build` atau `lint` di workspace yang punya script tersebut.

### Penjelasan `tasks`

```json
"tasks": {
```

Ini daftar task yang Turbo kenal.

#### `dev`

```json
"dev": {
  "cache": false,
  "persistent": true
}
```

`dev` biasanya server yang terus berjalan, misalnya `next dev`.

Karena server dev tidak selesai sendiri, maka:

- `persistent: true` berarti task ini long-running.
- `cache: false` berarti hasilnya tidak perlu di-cache.

#### `build`

```json
"build": {
  "dependsOn": ["^build"],
  "outputs": [".next/**", "!.next/cache/**", "dist/**", "build/**"]
}
```

Artinya saat build:

- Jalankan build dependency workspace dulu jika ada.
- Simpan output build sebagai cache.

Syntax ini:

```json
"^build"
```

berarti build package dependency terlebih dahulu.

Contoh jika nanti `website` memakai `@absen/shared-types`, maka Turbo bisa build `shared-types` dulu sebelum `website`.

#### `lint`

```json
"lint": {
  "dependsOn": ["^lint"]
}
```

Artinya lint package dependency dulu jika ada.

#### `start`

```json
"start": {
  "cache": false,
  "persistent": true
}
```

`start` biasanya server production yang berjalan terus, jadi tidak perlu cache.

## 8. Backend package

Backend sekarang punya `Apps/backend/package.json` seperti ini:

```json
{
  "name": "backend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "node index.js",
    "start": "node index.js"
  },
  "dependencies": {
    "express": "^5.2.1"
  }
}
```

### Kenapa ditambah `name`?

Supaya bisa dipanggil dengan filter:

```powershell
pnpm --filter backend dev
```

Kalau tidak ada `name`, pnpm tidak punya nama package yang jelas untuk `--filter backend`.

### Catatan penting

Saat ini backend hanya punya dependency Express dan belum terlihat file entry seperti `index.js`. Kalau belum ada `index.js`, command ini belum akan jalan:

```powershell
pnpm backend:dev
```

Nanti backend perlu dibuat file entry, misalnya:

```txt
Apps/backend/index.js
```

atau script disesuaikan ke file backend yang sebenarnya.

## 9. Root `.gitignore`

Root `.gitignore` dibuat supaya file build, dependency, environment, dan generated files tidak masuk repository.

Yang di-ignore antara lain:

- `node_modules/`
- `.next/`
- `dist/`
- `build/`
- `.turbo/`
- `.env`
- `.dart_tool/`
- Flutter generated files
- Android/iOS local generated files
- `.idea/`
- `.vscode/`

Root `.gitignore` berguna karena monorepo punya banyak app. Daripada tiap app punya ignore sendiri-sendiri saja, root juga mengatur ignore global.

## 10. Cara install setelah setup

Dari root project:

```powershell
pnpm install
```

Command ini akan:

- Membaca root `package.json`.
- Membaca `pnpm-workspace.yaml`.
- Menginstall dependency root seperti Turbo.
- Menginstall dependency workspace `Apps/website` dan `Apps/backend`.
- Membuat lockfile root `pnpm-lock.yaml`.

## 11. Cara menjalankan website

Dari root:

```powershell
pnpm web:dev
```

Ini menjalankan:

```txt
Apps/website → next dev
```

Untuk build:

```powershell
pnpm web:build
```

Untuk lint:

```powershell
pnpm web:lint
```

Untuk start production:

```powershell
pnpm web:start
```

## 12. Cara menjalankan backend

Dari root:

```powershell
pnpm backend:dev
```

Atau:

```powershell
pnpm backend:start
```

Namun backend harus punya entry file yang sesuai dengan script. Saat ini script mengarah ke:

```txt
Apps/backend/index.js
```

Jika nama file backend berbeda, ubah script di `Apps/backend/package.json`.

## 13. Cara menjalankan Flutter

Flutter tidak dijalankan oleh pnpm workspace, tapi bisa dipanggil dari root lewat script.

Install dependency Flutter:

```powershell
pnpm mobile:get
```

Run Flutter:

```powershell
pnpm mobile:run
```

Test Flutter:

```powershell
pnpm mobile:test
```

Build APK:

```powershell
pnpm mobile:build:apk
```

Di balik layar, command root ini menjalankan:

```powershell
cd Apps/app_flutter && flutter run
```

## 14. Kenapa syntax `cd Apps/app_flutter && flutter run`?

Karena Flutter command harus dijalankan dari folder Flutter project, yaitu folder yang punya:

```txt
pubspec.yaml
```

Folder itu adalah:

```txt
Apps/app_flutter
```

Maka script root perlu masuk ke folder itu dulu.

```json
"mobile:run": "cd Apps/app_flutter && flutter run"
```

Artinya:

1. Masuk ke folder `Apps/app_flutter`.
2. Kalau berhasil, jalankan `flutter run`.

Di Windows PowerShell modern, command ini biasanya tetap bisa jalan lewat npm/pnpm script karena script dijalankan oleh shell yang mendukung chaining. Kalau ada masalah, alternatifnya bisa pakai package helper seperti `npm-run-all` atau membuat script Node terpisah, tapi biasanya tidak perlu.

## 15. Command utama sehari-hari

Dari root:

```powershell
pnpm install
```

Website:

```powershell
pnpm web:dev
pnpm web:build
pnpm web:lint
```

Backend:

```powershell
pnpm backend:dev
pnpm backend:start
```

Flutter:

```powershell
pnpm mobile:get
pnpm mobile:run
pnpm mobile:test
pnpm mobile:build:apk
```

Turbo:

```powershell
pnpm dev
pnpm build
pnpm lint
```

## 16. Cara tambah dependency

### Tambah dependency ke website

```powershell
pnpm --filter website add nama-package
```

Contoh:

```powershell
pnpm --filter website add zod
```

Tambah dev dependency:

```powershell
pnpm --filter website add -D vitest
```

### Tambah dependency ke backend

```powershell
pnpm --filter backend add nama-package
```

Contoh:

```powershell
pnpm --filter backend add cors
```

### Tambah dependency Flutter

Masuk Flutter langsung:

```powershell
cd Apps/app_flutter
flutter pub add nama_package
```

Atau tetap dari root dengan command manual:

```powershell
cd Apps/app_flutter && flutter pub add nama_package
```

## 17. Apakah harus rename `Apps` jadi `apps`?

Tidak harus.

Secara convention monorepo modern biasanya pakai:

```txt
apps/
packages/
```

Tapi project kamu sekarang memakai:

```txt
Apps/
```

Aku tidak rename supaya tidak merusak path existing.

Kalau nanti mau dirapikan, bisa rename:

```powershell
Rename-Item "Apps" "apps"
Rename-Item "apps\app_flutter" "apps\mobile"
```

Tapi setelah rename, semua config perlu diubah:

```yaml
packages:
  - "apps/website"
  - "apps/backend"
  - "packages/*"
```

Dan script mobile juga perlu berubah:

```json
"mobile:run": "cd apps/mobile && flutter run"
```

## 18. Kapan perlu folder `packages/`?

Belum wajib sekarang.

Gunakan `packages/` kalau mulai ada kode yang dipakai lebih dari satu app.

Contoh:

```txt
packages/
├─ shared-types/
├─ api-client/
└─ config/
```

### Contoh `packages/shared-types`

```txt
packages/shared-types/
├─ package.json
├─ src/
│  └─ index.ts
└─ tsconfig.json
```

`package.json`:

```json
{
  "name": "@absen/shared-types",
  "version": "0.1.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts"
}
```

Install ke website:

```powershell
pnpm --filter website add @absen/shared-types@workspace:*
```

Syntax ini:

```txt
@workspace:*
```

artinya dependency diambil dari workspace lokal, bukan dari npm registry.

## 19. Apakah monorepo ini wajib pakai Turbo?

Tidak wajib.

Tanpa Turbo, project tetap monorepo karena pnpm workspace sudah cukup.

Minimalnya hanya:

```txt
package.json
pnpm-workspace.yaml
```

Turbo ditambahkan karena membantu menjalankan task lint/build/dev lintas package dan bisa caching build.

Kalau project masih kecil, kamu bisa lebih sering pakai command spesifik:

```powershell
pnpm web:dev
pnpm backend:dev
pnpm mobile:run
```

Daripada langsung:

```powershell
pnpm dev
```

## 20. Catatan lockfile lama

Aku melihat ada lockfile lama:

```txt
Apps/website/package-lock.json
Apps/backend/package-lock.json
```

Itu lockfile npm. Kalau sekarang pindah ke pnpm workspace, nanti idealnya root punya:

```txt
pnpm-lock.yaml
```

Setelah `pnpm install` berhasil, sebaiknya jangan campur npm dan pnpm untuk dependency management.

Rekomendasi:

- Pakai pnpm untuk monorepo.
- Jangan jalankan `npm install` di dalam `Apps/website` atau `Apps/backend` lagi.
- Setelah yakin semua aman, lockfile npm lama bisa dipertimbangkan untuk dihapus.

Jangan hapus lockfile lama sebelum `pnpm install` dan app berhasil jalan.

## 21. Urutan eksekusi yang disarankan

Jalankan dari root:

```powershell
pnpm install
```

Lalu test website:

```powershell
pnpm web:dev
```

Lalu test Flutter dependency:

```powershell
pnpm mobile:get
```

Lalu test Flutter:

```powershell
pnpm mobile:run
```

Kalau backend sudah punya entry file:

```powershell
pnpm backend:dev
```

Kalau backend belum punya `index.js`, buat dulu atau ubah script backend ke file yang benar.

## 22. Ringkasan sederhana

File utama monorepo:

```txt
package.json          # command root
pnpm-workspace.yaml   # daftar workspace JS
turbo.json            # konfigurasi Turbo task runner
.gitignore            # ignore file global
```

Command paling penting:

```powershell
pnpm install
pnpm web:dev
pnpm backend:dev
pnpm mobile:run
```

Konsep utamanya:

```txt
Root menjalankan command
→ pnpm memilih workspace dengan --filter
→ workspace menjalankan script masing-masing
```

Contoh:

```powershell
pnpm web:dev
```

menjadi:

```txt
root package.json
→ pnpm --filter website dev
→ Apps/website/package.json
→ next dev
```

Itulah kenapa syntax-nya terlihat seperti chaining. Bukan syntax aneh khusus monorepo, tapi gabungan dari:

- JSON untuk `package.json`.
- YAML untuk `pnpm-workspace.yaml`.
- Turbo config untuk `turbo.json`.
- Shell command untuk menjalankan Flutter dari folder mobile.
