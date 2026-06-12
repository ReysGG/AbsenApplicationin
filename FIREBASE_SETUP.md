# Setup Firebase Cloud Messaging (FCM) — Push Notification

Push notification adalah **satu-satunya fitur yang butuh kredensial dari kamu**. Semua
kode FCM sudah ditulis & di-guard: aplikasi **tetap jalan normal tanpa kredensial**
(push cuma nonaktif). Begitu kredensial diisi, push langsung aktif tanpa ubah kode.

Tanpa Firebase, notifikasi tetap tersimpan di DB dan muncul saat app fetch
(`createNotification` sudah aktif) — yang hilang hanya "dorongan" real-time ke HP.

---

## Langkah (sekali setup, ~10 menit)

### 1. Buat project Firebase
1. Buka https://console.firebase.google.com → **Add project** → beri nama (mis. `attendx`).
2. Google Analytics boleh di-skip.

### 2. Daftarkan aplikasi Android (untuk Flutter)
1. Di project → **Add app** → ikon **Android**.
2. **Android package name** harus **persis**: `com.example.app_flutter`
   (ini `applicationId` di `android/app/build.gradle.kts`).
3. Download file **`google-services.json`**.
4. Taruh di: `Apps/app_flutter/android/app/google-services.json`
   (sudah ada `google-services.json.example` sebagai contoh lokasi).
5. Rebuild APK:
   ```
   cd Apps/app_flutter
   flutter build apk --debug
   ```
   Plugin `com.google.gms.google-services` otomatis aktif begitu file ada
   (build.gradle.kts: `if (file("google-services.json").exists())`).

### 3. Service Account (untuk Backend mengirim push)
1. Firebase Console → ⚙️ **Project settings** → tab **Service accounts**.
2. **Generate new private key** → download file JSON.
3. Pilih SALAH SATU cara memasukkan ke backend:

   **Cara A — paste JSON ke .env (paling mudah untuk Docker):**
   Buka file `.env` di root project (bukan `.env.example`), tambahkan dalam SATU baris:
   ```
   FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...semua isi file...",...}
   ```
   Lalu rebuild backend:
   ```
   docker compose up -d --build backend
   ```

   **Cara B — mount file:**
   - Simpan JSON di `Apps/backend/secrets/firebase-service-account.json`
   - Tambah volume di `docker-compose.yml` service `backend`:
     ```yaml
     volumes:
       - ./Apps/backend/secrets:/app/secrets:ro
     ```
   - Set di `.env`:
     ```
     FIREBASE_SERVICE_ACCOUNT_PATH=/app/secrets/firebase-service-account.json
     ```
   - `docker compose up -d backend`

### 4. Verifikasi push aktif
- Cek log backend — TIDAK ada lagi warning "FCM disabled: no credentials":
  ```
  docker logs absenapplication-backend-1 | Select-String -Pattern "FCM"
  ```
- Login di app HP (token FCM otomatis terdaftar ke backend saat login).
- Di web dashboard, **approve/reject cuti** milik karyawan tsb → push muncul di HP.

---

## ⚠️ Keamanan
- `google-services.json` dan service-account JSON **JANGAN di-commit** ke git.
  Tambahkan ke `.gitignore`:
  ```
  Apps/app_flutter/android/app/google-services.json
  Apps/backend/secrets/
  .env
  ```
- Service-account JSON memberi akses penuh kirim push atas nama project —
  perlakukan seperti password.

---

## Yang sudah otomatis (tanpa aksi kamu)
- Registrasi token FCM perangkat saat login (`POST /mobile/me/device-token`)
- Hapus token saat logout (`DELETE /mobile/me/device-token`)
- Pembersihan token mati (`registration-token-not-registered`)
- Push terkirim saat: cuti disetujui (`leave_approved`), cuti ditolak (`leave_rejected`)
- Notifikasi HR saat karyawan ajukan cuti (`leave_request_new`)
- Handler foreground & background di Flutter + channel notifikasi lokal
