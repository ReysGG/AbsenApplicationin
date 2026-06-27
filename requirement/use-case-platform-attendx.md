# Use Case — Level Platform AttendX
## Superadmin & Admin Helper

**Scope:** Hanya mencakup aktivitas di Level Platform (bukan di dalam Workspace)
**Sistem:** AttendX — Aplikasi Absensi Digital SaaS
**Dokumen oleh:** Kelompok David Boy dkk. — Universitas Esa Unggul 2026

---

## Konteks & Posisi dalam Sistem

```
┌─────────────────────────────────────────────────────────┐
│                    LEVEL PLATFORM                       │
│                                                         │
│   Superadmin ──────────────── Admin Helper              │
│   (pemilik app)                (asisten superadmin)     │
│        │                            │                   │
│        └──────────────┬─────────────┘                   │
│                       │                                 │
│              Kelola seluruh platform                    │
│              (tenant, billing, support)                 │
└───────────────────────┼─────────────────────────────────┘
                        │ membuat akun / mengaktifkan
                        ▼
┌─────────────────────────────────────────────────────────┐
│                   LEVEL WORKSPACE                       │
│                                                         │
│   Stakeholder → HRD → Karyawan                         │
│   (bukan urusan platform)                               │
└─────────────────────────────────────────────────────────┘
```

### Prinsip Utama

> - **Superadmin dan Admin Helper adalah pemilik/pengelola aplikasi AttendX itu sendiri**, bukan pengguna layanan.
> - Mereka **tidak pernah masuk ke dalam workspace** milik Stakeholder. Data internal perusahaan klien sepenuhnya privat dan tidak bisa diakses dari level platform.
> - Superadmin dan Admin Helper hanya berinteraksi dengan hal-hal yang bersifat **infrastruktur, billing, dan dukungan teknis**.
> - **Perbedaan Superadmin vs Admin Helper:** Superadmin punya akses penuh tanpa batas. Admin Helper adalah staf operasional yang direkrut oleh Superadmin untuk membantu pekerjaan sehari-hari, dengan beberapa batasan akses pada fungsi kritis (misalnya tidak bisa hapus Superadmin lain atau ubah konfigurasi inti sistem).

---

## Daftar Aktor Level Platform

| Aktor | Peran | Dibuat Oleh |
|---|---|---|
| **Superadmin** | Pemilik aplikasi AttendX; akses penuh atas seluruh platform | Sistem (akun pertama saat deploy) |
| **Admin Helper** | Staf operasional yang membantu Superadmin; akses terbatas pada fungsi kritis | Superadmin |

---

## Daftar Use Case Level Platform

| ID | Use Case | Aktor |
|---|---|---|
| PL-01 | Login ke Panel Platform | Superadmin, Admin Helper |
| PL-02 | Buat & Kelola Akun Admin Helper | Superadmin |
| PL-03 | Daftarkan Stakeholder Baru (Manual) | Superadmin, Admin Helper |
| PL-04 | Aktivasi Workspace Stakeholder | Superadmin, Admin Helper |
| PL-05 | Bantu Setup Perusahaan Stakeholder | Superadmin, Admin Helper |
| PL-06 | Kelola Status & Paket Langganan Tenant | Superadmin, Admin Helper |
| PL-07 | Suspend / Nonaktifkan Tenant | Superadmin, Admin Helper |
| PL-08 | Tangani Support Ticket dari Stakeholder | Superadmin, Admin Helper |
| PL-09 | Monitor Kesehatan Platform | Superadmin, Admin Helper |
| PL-10 | Lihat Audit Log Platform | Superadmin |

---

---

## PL-01 — Login ke Panel Platform

| Atribut | Detail |
|---|---|
| **ID** | PL-01 |
| **Nama** | Login ke Panel Platform |
| **Aktor** | Superadmin, Admin Helper |
| **Trigger** | Superadmin / Admin Helper ingin mengelola platform |

### Alur Normal

1. Superadmin / Admin Helper membuka URL khusus Panel Platform (berbeda dari URL Dashboard Stakeholder).
2. Mengisi email dan password akun platform.
3. Sistem memverifikasi kredensial melalui Firebase Authentication.
4. Jika berhasil → diarahkan ke **Panel Platform** dengan tampilan dan menu yang berbeda dari Dashboard Workspace.
5. Panel menampilkan overview platform: jumlah tenant aktif, total end user, MRR (Monthly Recurring Revenue), dan support ticket yang belum terselesaikan.

### Catatan Keamanan

> - URL Panel Platform tidak dipublikasikan secara umum dan tidak dapat diakses oleh Stakeholder maupun karyawan.
> - Login gagal lebih dari 5 kali dalam 10 menit akan memicu rate limiting dan notifikasi keamanan ke email Superadmin utama.

---

## PL-02 — Buat & Kelola Akun Admin Helper

| Atribut | Detail |
|---|---|
| **ID** | PL-02 |
| **Nama** | Buat & Kelola Akun Admin Helper |
| **Aktor Utama** | Superadmin |
| **Trigger** | Superadmin membutuhkan staf tambahan untuk membantu operasional platform |

### Alur Normal — Buat Admin Helper Baru

1. Superadmin membuka menu **"Admin Users"** di Panel Platform.
2. Klik **"+ Tambah Admin Helper"**.
3. Mengisi data Admin Helper baru:
   - Nama lengkap
   - Email aktif (digunakan sebagai username login)
   - Nomor telepon (opsional)
4. Menentukan **batasan akses** Admin Helper:
   - Boleh / tidak boleh buat akun Stakeholder baru
   - Boleh / tidak boleh suspend tenant
   - Boleh / tidak boleh akses menu Audit Log
   - Boleh / tidak boleh ubah paket langganan tenant
5. Klik **"Kirim Undangan"**.
6. Sistem mengirim email undangan ke Admin Helper berisi link aktivasi dan instruksi pertama kali login.

### Kelola Admin Helper yang Sudah Ada

| Aksi | Deskripsi |
|---|---|
| Edit data | Ubah nama, email, atau batasan akses Admin Helper |
| Nonaktifkan akun | Admin Helper tidak bisa login; akses dicabut seketika |
| Reset password | Superadmin trigger reset; link dikirim ke email Admin Helper |
| Lihat log aktivitas | Superadmin bisa melihat semua aksi yang pernah dilakukan oleh Admin Helper tertentu |

### Constraint

> - Hanya **Superadmin** yang bisa membuat, mengedit, atau menghapus akun Admin Helper.
> - Admin Helper **tidak bisa** membuat Admin Helper lain.
> - Admin Helper **tidak bisa** mengubah akun atau hak akses Superadmin.

---

## PL-03 — Daftarkan Stakeholder Baru (Manual)

| Atribut | Detail |
|---|---|
| **ID** | PL-03 |
| **Nama** | Daftarkan Stakeholder Baru secara Manual |
| **Aktor** | Superadmin, Admin Helper |
| **Trigger** | Ada calon pelanggan yang meminta bantuan pendaftaran, atau pembayaran dilakukan via transfer manual |

### Konteks

Ada dua cara Stakeholder bisa terdaftar di sistem:
1. **Self-register** — Stakeholder mendaftar dan bayar sendiri via halaman publik AttendX (tidak memerlukan intervensi platform).
2. **Manual oleh Platform** — Stakeholder menghubungi tim AttendX dan minta dibuatkan akunnya (use case ini).

### Alur Normal

1. Admin Helper menerima permintaan pendaftaran dari calon Stakeholder (via email, WhatsApp, atau support ticket).
2. Admin Helper membuka menu **"Tenants"** di Panel Platform.
3. Klik **"+ Tambah Tenant / Stakeholder Baru"**.
4. Mengisi data akun Stakeholder:
   - Nama lengkap pemilik / penanggung jawab
   - Email aktif (akan digunakan sebagai login Stakeholder)
   - Nomor telepon
   - Paket langganan yang dibeli (Basic / Pro / Enterprise)
   - Tanggal mulai berlangganan
   - Metode pembayaran yang dikonfirmasi
5. Klik **"Buat Akun & Workspace"**.
6. Sistem secara otomatis:
   - Membuat akun Stakeholder
   - Membuat **workspace kosong** yang terikat ke akun tersebut
   - Mengirim email ke Stakeholder berisi kredensial login dan link aktivasi
7. Admin Helper mencatat nomor tiket atau referensi transaksi untuk keperluan tracking.

---

## PL-04 — Aktivasi Workspace Stakeholder

| Atribut | Detail |
|---|---|
| **ID** | PL-04 |
| **Nama** | Aktivasi Workspace Stakeholder |
| **Aktor** | Superadmin, Admin Helper |
| **Trigger** | Workspace baru perlu diaktifkan setelah pembayaran dikonfirmasi |

### Alur Normal

1. Sistem mendeteksi pembayaran berhasil (otomatis via payment gateway) **atau** Admin Helper mengonfirmasi pembayaran manual.
2. Admin Helper membuka detail tenant di Panel Platform.
3. Mengubah status workspace dari **"Inactive"** menjadi **"Active"**.
4. Menentukan **tanggal kedaluwarsa** langganan sesuai paket yang dibeli.
5. Sistem mengirim notifikasi ke Stakeholder bahwa workspace sudah aktif dan siap digunakan.

### Status Workspace yang Ada di Sistem

| Status | Keterangan |
|---|---|
| `Inactive` | Workspace baru dibuat, belum diaktifkan / pembayaran belum dikonfirmasi |
| `Active` | Workspace berjalan normal, Stakeholder bisa login dan menggunakan semua fitur |
| `Suspended` | Workspace dibekukan sementara (biasanya karena gagal bayar atau pelanggaran) |
| `Expired` | Masa langganan habis; Stakeholder tidak bisa login sampai diperpanjang |
| `Terminated` | Workspace dihapus permanen; data diarsip sesuai kebijakan retensi |

---

## PL-05 — Bantu Setup Perusahaan Stakeholder

| Atribut | Detail |
|---|---|
| **ID** | PL-05 |
| **Nama** | Bantu Setup Perusahaan Stakeholder |
| **Aktor** | Superadmin, Admin Helper |
| **Trigger** | Stakeholder meminta bantuan setup awal karena tidak familiar dengan sistem |

### Konteks

> Ini adalah layanan **onboarding** opsional. Normalnya Stakeholder melakukan setup sendiri (lihat dokumen Level Workspace WS-01). Namun jika diminta, Superadmin atau Admin Helper bisa membantu mengisikan data awal.

### Yang Bisa Dibantu oleh Admin Helper / Superadmin

1. **Mengisi profil perusahaan** — nama PT, bidang usaha, zona waktu, logo.
2. **Mendaftarkan lokasi kantor** — input koordinat GPS dan radius geofencing.
3. **Membuat template shift** — shift pagi, siang, malam sesuai permintaan klien.
4. **Membuat akun HRD pertama** — atas nama yang ditunjuk oleh Stakeholder.
5. Setelah setup selesai, Admin Helper **menyerahkan kendali penuh** ke Stakeholder.

### Batasan yang Tidak Boleh Dilanggar

> - Admin Helper dan Superadmin **tidak boleh melihat atau mengakses data absensi, data karyawan, atau laporan** yang sudah ada di dalam workspace setelah Stakeholder mulai menggunakannya.
> - Akses setup hanya boleh dilakukan di **awal onboarding** dan atas **permintaan eksplisit** dari Stakeholder.
> - Semua aksi selama onboarding tercatat di **Audit Log** platform.

---

## PL-06 — Kelola Status & Paket Langganan Tenant

| Atribut | Detail |
|---|---|
| **ID** | PL-06 |
| **Nama** | Kelola Status & Paket Langganan Tenant |
| **Aktor** | Superadmin, Admin Helper |
| **Trigger** | Stakeholder upgrade/downgrade paket, atau perpanjangan langganan jatuh tempo |

### Alur Normal — Perpanjangan / Upgrade Paket

1. Admin Helper membuka menu **"Tenants"** → cari tenant yang bersangkutan.
2. Membuka tab **"Billing & Subscription"** pada detail tenant.
3. Melihat informasi langganan saat ini: paket aktif, tanggal mulai, tanggal kedaluwarsa, riwayat pembayaran.
4. Jika ada perubahan:
   - **Perpanjangan** → perbarui tanggal kedaluwarsa sesuai periode yang dibayar.
   - **Upgrade paket** → ubah paket ke tier yang lebih tinggi; fitur tambahan langsung aktif.
   - **Downgrade paket** → ubah paket ke tier lebih rendah; berlaku di awal periode berikutnya.
5. Simpan perubahan → sistem kirim notifikasi konfirmasi ke email Stakeholder.

### Paket Langganan yang Tersedia (Contoh)

| Paket | Fitur | Batas Karyawan |
|---|---|---|
| Basic | Absensi, laporan dasar | Maks. 25 karyawan |
| Pro | Basic + multi-lokasi, shift rotasi, export PDF | Maks. 100 karyawan |
| Enterprise | Pro + SLA support, custom geofencing, API access | Tidak terbatas |

---

## PL-07 — Suspend / Nonaktifkan Tenant

| Atribut | Detail |
|---|---|
| **ID** | PL-07 |
| **Nama** | Suspend atau Nonaktifkan Tenant |
| **Aktor** | Superadmin, Admin Helper |
| **Trigger** | Tenant gagal bayar, melanggar TOS, atau mengajukan pembatalan layanan |

### Alur Normal — Suspend karena Gagal Bayar

1. Sistem mendeteksi langganan jatuh tempo dan pembayaran belum diterima setelah X hari grace period.
2. Sistem otomatis mengirim email peringatan ke Stakeholder (H-7, H-3, H-1 sebelum suspend).
3. Jika tidak ada respons → Admin Helper secara manual mengubah status workspace ke **"Suspended"**.
4. Stakeholder tidak bisa login ke Dashboard; karyawan tidak bisa absensi via aplikasi.
5. Data tetap tersimpan utuh selama masa retensi (contoh: 30 hari setelah suspend).
6. Jika Stakeholder melakukan pembayaran dalam masa retensi → Admin Helper reaktivasi workspace, semua data kembali normal.

### Alur Normal — Terminasi atas Permintaan Stakeholder

1. Stakeholder mengajukan permintaan berhenti berlangganan via support ticket atau email.
2. Admin Helper memproses permintaan dan mengubah status ke **"Terminated"**.
3. Data workspace diarsip sesuai kebijakan retensi platform.
4. Setelah masa retensi habis → data dihapus permanen dari server.

### Alur Normal — Suspend karena Pelanggaran TOS

1. Superadmin mendeteksi pelanggaran (misal: penyalahgunaan API, aktivitas mencurigakan).
2. **Hanya Superadmin** yang berwenang melakukan suspend dengan alasan pelanggaran TOS.
3. Superadmin mengubah status ke **"Suspended"** dan mencatat alasan secara tertulis di sistem.
4. Notifikasi dikirim ke email Stakeholder dengan penjelasan alasan suspend.

### Constraint

> - Admin Helper **boleh** melakukan suspend karena alasan billing (gagal bayar).
> - Admin Helper **tidak boleh** melakukan suspend karena pelanggaran TOS — hanya Superadmin.

---

## PL-08 — Tangani Support Ticket dari Stakeholder

| Atribut | Detail |
|---|---|
| **ID** | PL-08 |
| **Nama** | Tangani Support Ticket dari Stakeholder |
| **Aktor Utama** | Admin Helper |
| **Aktor Sekunder** | Superadmin (untuk escalasi) |
| **Trigger** | Stakeholder mengirimkan pertanyaan atau laporan masalah |

### Alur Normal

1. Stakeholder mengirim support ticket melalui Portal Dukungan atau email resmi AttendX.
2. Tiket masuk ke **antrian support** di Panel Platform dan Admin Helper mendapat notifikasi.
3. Admin Helper membuka tiket dan membaca detail masalah yang dilaporkan.
4. Admin Helper mengkategorikan tiket:
   - **Teknis** — bug, error aplikasi, fitur tidak berjalan
   - **Billing** — pertanyaan tagihan, permintaan invoice, ubah paket
   - **Onboarding** — bantuan setup awal atau konfigurasi
   - **Akun** — lupa password, akun terkunci, dsb.
5. Admin Helper merespons tiket dengan solusi atau langkah lanjutan.
6. Jika masalah tidak dapat diselesaikan Admin Helper → tiket di-**escalate ke Superadmin**.
7. Setelah masalah selesai → tiket ditutup (*Resolved*) dan Stakeholder menerima notifikasi.

### Status Tiket

| Status | Keterangan |
|---|---|
| `Open` | Tiket baru masuk, belum ditangani |
| `In Progress` | Sedang ditangani oleh Admin Helper |
| `Escalated` | Diteruskan ke Superadmin untuk penanganan lebih lanjut |
| `Resolved` | Masalah selesai, tiket ditutup |
| `Closed` | Tiket ditutup setelah dikonfirmasi Stakeholder atau otomatis setelah X hari |

---

## PL-09 — Monitor Kesehatan Platform

| Atribut | Detail |
|---|---|
| **ID** | PL-09 |
| **Nama** | Monitor Kesehatan Platform |
| **Aktor** | Superadmin, Admin Helper |
| **Trigger** | Pemantauan rutin atau ada indikasi gangguan sistem |

### Yang Dipantau

1. **Uptime Server** — persentase ketersediaan API server dan database.
2. **Response Time API** — rata-rata waktu respons endpoint (target < 500ms).
3. **Error Rate** — persentase request yang gagal / menghasilkan error.
4. **Penggunaan Resource** — CPU, RAM, dan storage database Supabase.
5. **Antrian Background Job** — status BullMQ queue untuk sinkronisasi offline dan push notification.
6. **Aktivitas Anomali** — lonjakan request mencurigakan yang bisa mengindikasikan serangan.

### Alur Normal

1. Admin Helper membuka menu **"System Health"** di Panel Platform.
2. Dashboard menampilkan semua metrik di atas secara real-time dalam bentuk grafik dan indikator status (🟢 Normal / 🟡 Warning / 🔴 Critical).
3. Jika ada metrik yang masuk status 🔴 Critical → Admin Helper segera **eskalasi ke Superadmin**.
4. Superadmin mengambil tindakan perbaikan (restart service, scale server, rollback deployment, dll).
5. Insiden dicatat di log untuk keperluan analisis dan post-mortem.

---

## PL-10 — Lihat Audit Log Platform

| Atribut | Detail |
|---|---|
| **ID** | PL-10 |
| **Nama** | Lihat Audit Log Platform |
| **Aktor** | Superadmin |
| **Trigger** | Investigasi insiden, audit keamanan, atau pemeriksaan rutin |

### Konteks

> Audit Log adalah catatan lengkap semua aksi yang terjadi di level platform — siapa yang melakukan apa, kapan, dan dari IP mana. Ini adalah fitur kritis untuk keamanan dan akuntabilitas.

### Yang Tercatat di Audit Log

| Kategori | Contoh Aksi yang Dicatat |
|---|---|
| Manajemen Akun | Buat akun Stakeholder, nonaktifkan Admin Helper, reset password |
| Manajemen Tenant | Aktivasi workspace, suspend tenant, ubah paket langganan |
| Onboarding | Admin Helper masuk ke alur bantu setup workspace Stakeholder |
| Support Ticket | Buka tiket, respons tiket, escalate tiket, tutup tiket |
| Keamanan | Login gagal berulang, akses dari IP tidak dikenal, perubahan konfigurasi sistem |
| Sistem | Deploy versi baru, perubahan environment variable, restart service |

### Alur Normal

1. Superadmin membuka menu **"Audit Logs"** di Panel Platform.
2. Dapat memfilter log berdasarkan: rentang waktu, aktor (siapa yang melakukan), kategori aksi, atau status (berhasil / gagal).
3. Setiap entri log menampilkan: timestamp, aktor, aksi, objek yang dikenai aksi, IP address, dan hasil (sukses/gagal).
4. Log dapat di-export ke format CSV untuk keperluan audit eksternal.

### Constraint

> - Hanya **Superadmin** yang bisa mengakses Audit Log.
> - Admin Helper **tidak bisa** melihat Audit Log.
> - Entri di Audit Log **tidak bisa diedit atau dihapus** oleh siapapun — bersifat immutable untuk integritas data audit.

---

## Matriks Hak Akses — Level Platform

| Fitur / Aksi | Superadmin | Admin Helper |
|---|:---:|:---:|
| Login ke Panel Platform | ✅ | ✅ |
| Buat / kelola akun Admin Helper | ✅ | ❌ |
| Nonaktifkan akun Admin Helper | ✅ | ❌ |
| Daftarkan Stakeholder baru (manual) | ✅ | ✅ |
| Aktivasi workspace Stakeholder | ✅ | ✅ |
| Bantu setup perusahaan Stakeholder (onboarding) | ✅ | ✅ |
| Kelola paket & billing tenant | ✅ | ✅ |
| Suspend tenant (alasan gagal bayar) | ✅ | ✅ |
| Suspend tenant (alasan pelanggaran TOS) | ✅ | ❌ |
| Terminasi / hapus tenant | ✅ | ❌ |
| Tangani support ticket | ✅ | ✅ |
| Eskalasi ticket ke Superadmin | ❌ | ✅ |
| Monitor kesehatan platform | ✅ | ✅ |
| Tindakan perbaikan infrastruktur | ✅ | ❌ |
| Akses Audit Log platform | ✅ | ❌ |
| Masuk ke dalam workspace Stakeholder | ❌ | ❌ |
| Lihat data absensi karyawan | ❌ | ❌ |

---

## Garis Batas yang Tidak Boleh Dilanggar

```
┌──────────────────────────────────────────────────────────────┐
│  SUPERADMIN & ADMIN HELPER TIDAK BOLEH:                      │
│                                                              │
│  ✗  Masuk ke dalam workspace Stakeholder                     │
│  ✗  Melihat data absensi karyawan klien                      │
│  ✗  Membaca laporan kehadiran milik perusahaan klien         │
│  ✗  Mengakses data pribadi karyawan klien                    │
│  ✗  Mengubah pengaturan internal workspace tanpa izin        │
│                                                              │
│  Semua aksi yang dilakukan di level platform tercatat        │
│  di Audit Log dan tidak bisa dihapus.                        │
└──────────────────────────────────────────────────────────────┘
```

---

*Dokumen ini mencakup use case khusus Level Platform sistem AttendX (Superadmin & Admin Helper).*
*Dibuat berdasarkan Proposal Pengembangan Aplikasi Absensi Digital Karyawan PT Inovasi Kerja Digital — Universitas Esa Unggul 2026.*
*Kelompok: David Boy, Muhammad Riky, Muhammad Fikri Nurwahid, Rizky Nurhafiizh Sayrendra*
