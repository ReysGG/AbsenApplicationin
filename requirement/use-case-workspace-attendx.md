# Use Case — Level Workspace AttendX

**Scope:** Hanya mencakup aktivitas di dalam Workspace (setelah Stakeholder berlangganan)
**Sistem:** AttendX — Aplikasi Absensi Digital SaaS
**Dokumen oleh:** Kelompok David Boy dkk. — Universitas Esa Unggul 2026

---

## Konteks & Alur Kepemilikan

```
[Platform Level]
  Superadmin / Admin Helper
       │
       │  (jual akses / bantu daftarkan)
       ▼
[Workspace Level]
  Stakeholder  ──────────────────────────────────────────┐
       │  (punya 1 workspace, max 1 perusahaan)          │
       │                                                  │
       │  buat akun HRD                                   │
       ▼                                                  │
      HRD  ─────────────────────────────────────────┐    │
       │  buat & kelola karyawan                    │    │
       ▼                                            │    │
   Karyawan                                         │    │
   (End User)                                       │    │
                                                    │    │
            [Scope dokumen ini]  ◄──────────────────┘────┘
```

### Catatan Penting

> - Satu akun Stakeholder hanya boleh mendaftarkan **maksimal 1 perusahaan** di dalam workspacenya.
> - Stakeholder mendapatkan workspace secara **otomatis** setelah berlangganan (dibeli sendiri atau dibuatkan oleh Superadmin / Admin Helper).
> - Superadmin dan Admin Helper **tidak ikut campur** dalam operasional workspace — mereka hanya bisa membantu setup awal jika diminta Stakeholder.

---

## Daftar Aktor Level Workspace

| Aktor | Peran | Dibuat Oleh |
|---|---|---|
| **Stakeholder** | Pemilik/pembeli layanan; mendaftarkan perusahaan; membuat akun HRD | Superadmin / Admin Helper / daftar sendiri |
| **HRD** | Mengelola data karyawan, shift, absensi, izin/cuti dalam perusahaan | Stakeholder |
| **Karyawan (End User)** | Melakukan absensi check-in/out, ajukan izin/cuti, lihat jadwal | HRD |

---

## Daftar Use Case Level Workspace

| ID | Use Case | Aktor Utama |
|---|---|---|
| WS-01 | Aktivasi Workspace & Registrasi Perusahaan | Stakeholder |
| WS-02 | Konfigurasi Profil & Pengaturan Perusahaan | Stakeholder |
| WS-03 | Buat & Kelola Akun HRD | Stakeholder |
| WS-04 | Buat & Kelola Data Karyawan | HRD |
| WS-05 | Konfigurasi Lokasi Kantor & Geofencing | HRD / Stakeholder |
| WS-06 | Konfigurasi Shift Kerja | HRD / Stakeholder |
| WS-07 | Proses Check-in Karyawan | Karyawan |
| WS-08 | Proses Check-out Karyawan | Karyawan |
| WS-09 | Pengajuan Izin & Cuti | Karyawan |
| WS-10 | Approval Izin & Cuti | HRD |
| WS-11 | Monitoring Kehadiran Real-time | HRD / Stakeholder |
| WS-12 | Rekapitulasi & Export Laporan | HRD / Stakeholder / Karyawan |

---

---

## WS-01 — Aktivasi Workspace & Registrasi Perusahaan

| Atribut | Detail |
|---|---|
| **ID** | WS-01 |
| **Nama** | Aktivasi Workspace & Registrasi Perusahaan |
| **Aktor Utama** | Stakeholder |
| **Aktor Sekunder** | Superadmin / Admin Helper (opsional, hanya bantu setup) |
| **Trigger** | Stakeholder baru saja berlangganan dan pertama kali login ke sistem |

### Konteks

Ketika seseorang membeli layanan AttendX (baik mandiri maupun dibuatkan oleh tim), mereka otomatis mendapatkan satu **workspace kosong**. Langkah pertama yang wajib dilakukan adalah mendaftarkan perusahaan ke dalam workspace tersebut.

### Alur Normal — Stakeholder Daftar Sendiri

1. Stakeholder melakukan pembayaran langganan melalui halaman pricing AttendX.
2. Sistem secara otomatis membuat **akun Stakeholder** dan **workspace kosong** yang terikat ke akun tersebut.
3. Stakeholder menerima email berisi kredensial login dan link aktivasi.
4. Stakeholder login ke **Dashboard Web** untuk pertama kalinya.
5. Sistem menampilkan halaman **"Setup Perusahaan"** — Stakeholder diwajibkan mengisi data perusahaan sebelum bisa menggunakan fitur lain.
6. Stakeholder mengisi form registrasi perusahaan:
   - Nama perusahaan / PT
   - Bidang usaha
   - Alamat kantor utama
   - Logo perusahaan (opsional)
   - Zona waktu operasional
7. Stakeholder klik **"Simpan & Lanjutkan"**.
8. Sistem menyimpan data perusahaan dan menandai workspace sebagai **aktif & siap digunakan**.
9. Stakeholder diarahkan ke **Dashboard utama** workspace.

### Alur Alternatif — Dibuatkan oleh Superadmin / Admin Helper

1. Calon Stakeholder menghubungi tim AttendX dan meminta bantuan setup.
2. Superadmin atau Admin Helper membuat akun Stakeholder secara manual dari Panel Platform.
3. Superadmin / Admin Helper membuatkan dan mengisi data perusahaan atas nama Stakeholder.
4. Setelah selesai, Stakeholder menerima email notifikasi bahwa workspace sudah siap.
5. Stakeholder login dan dapat langsung menggunakan workspace tanpa perlu setup ulang.

### Constraint

> - Satu akun Stakeholder **hanya dapat mendaftarkan 1 perusahaan**. Jika mencoba membuat perusahaan kedua, sistem akan menampilkan pesan: *"Workspace Anda sudah memiliki perusahaan terdaftar. Hubungi tim AttendX jika membutuhkan workspace tambahan."*
> - Data perusahaan yang sudah didaftarkan masih bisa diedit melalui menu Settings, tetapi tidak bisa dihapus dan dibuat ulang tanpa bantuan Superadmin.

---

## WS-02 — Konfigurasi Profil & Pengaturan Perusahaan

| Atribut | Detail |
|---|---|
| **ID** | WS-02 |
| **Nama** | Konfigurasi Profil & Pengaturan Perusahaan |
| **Aktor Utama** | Stakeholder |
| **Trigger** | Setelah registrasi perusahaan selesai, atau kapan saja saat ada perubahan informasi |

### Alur Normal

1. Stakeholder membuka menu **Settings → Profil Perusahaan** di Dashboard.
2. Dapat mengubah data umum: nama perusahaan, logo, bidang usaha, alamat, zona waktu.
3. Mengatur **kebijakan absensi** perusahaan:
   - Toleransi keterlambatan (grace period, dalam menit)
   - Batas jam check-in valid (contoh: maksimal 2 jam setelah shift mulai)
   - Apakah karyawan boleh WFH secara default atau harus mengajukan izin dulu
   - Mode GPS: wajib aktif / opsional untuk WFH
4. Mengatur **kebijakan cuti**:
   - Jumlah hari cuti tahunan per karyawan
   - Jenis-jenis izin yang tersedia (Sakit, Keperluan Keluarga, Cuti Bersama, dll)
5. Klik **"Simpan Pengaturan"** — perubahan berlaku langsung.

---

## WS-03 — Buat & Kelola Akun HRD

| Atribut | Detail |
|---|---|
| **ID** | WS-03 |
| **Nama** | Buat & Kelola Akun HRD |
| **Aktor Utama** | Stakeholder |
| **Trigger** | Stakeholder perlu mendelegasikan pengelolaan karyawan kepada staf HR |

### Alur Normal — Buat Akun HRD Baru

1. Stakeholder membuka menu **"Tim HRD"** di Dashboard.
2. Klik tombol **"+ Tambah HRD"**.
3. Mengisi data akun HRD baru:
   - Nama lengkap
   - Email (akan digunakan sebagai username login)
   - Nomor telepon (opsional)
   - Divisi / departemen yang dikelola (HRD bisa di-assign ke divisi tertentu, atau seluruh perusahaan)
4. Klik **"Kirim Undangan"**.
5. Sistem mengirim **email undangan** ke HRD berisi link aktivasi akun dan instruksi pertama kali login.
6. HRD mengklik link, membuat password, dan akun aktif.

### Alur Kelola Akun HRD yang Sudah Ada

- **Edit data HRD** → ubah nama, email, atau assignment divisi
- **Nonaktifkan HRD** → akun dinonaktifkan, tidak bisa login; data histori tetap tersimpan
- **Reset password** → Stakeholder bisa trigger reset password dan link dikirim ke email HRD
- **Lihat aktivitas HRD** → Stakeholder bisa melihat log aksi yang dilakukan HRD (siapa approve siapa, kapan)

### Hak Akses HRD

> HRD **tidak bisa** membuat atau menghapus akun HRD lain. Hanya Stakeholder yang memiliki hak tersebut.

---

## WS-04 — Buat & Kelola Data Karyawan

| Atribut | Detail |
|---|---|
| **ID** | WS-04 |
| **Nama** | Buat & Kelola Data Karyawan |
| **Aktor Utama** | HRD |
| **Aktor Sekunder** | Stakeholder (bisa melakukan hal yang sama) |
| **Trigger** | Ada karyawan baru bergabung, atau data karyawan perlu diperbarui |

### Alur Normal — Tambah Karyawan Baru

1. HRD membuka menu **"Karyawan"** di Dashboard Web.
2. Klik tombol **"+ Tambah Karyawan"**.
3. HRD mengisi form data karyawan:
   - Nama lengkap
   - Email aktif karyawan
   - Nomor ID karyawan (opsional, bisa di-generate otomatis)
   - Divisi / departemen
   - Jabatan
   - Jadwal shift yang di-assign
   - Tanggal mulai kerja
4. Klik **"Simpan & Kirim Undangan"**.
5. Sistem mengirim **email undangan** ke karyawan berisi link download aplikasi AttendX dan instruksi aktivasi akun.
6. Karyawan mengunduh dan menginstall aplikasi **AttendX** di smartphone Android / iOS.
7. Karyawan login menggunakan email yang telah didaftarkan HRD.
8. Saat pertama kali login, karyawan diwajibkan melakukan **Face Enrollment**:
   - Kamera depan aktif otomatis
   - Sistem memandu karyawan untuk merekam wajah dari beberapa sudut pandang
   - Data **vektor wajah** tersimpan terenkripsi di Supabase Storage
   - Face enrollment hanya perlu dilakukan **sekali**; bisa diperbarui jika ada perubahan penampilan signifikan
9. Setelah face enrollment selesai, karyawan siap menggunakan fitur absensi.

### Alur Kelola Karyawan

| Aksi | Deskripsi |
|---|---|
| Edit data | Ubah nama, divisi, jabatan, atau shift yang di-assign |
| Nonaktifkan akun | Karyawan resign/keluar — akun dinonaktifkan, histori absensi tetap tersimpan |
| Pindah divisi | Ubah assignment divisi; shift baru berlaku mulai tanggal yang ditentukan |
| Reset face enrollment | Jika karyawan mengalami perubahan penampilan signifikan, HRD bisa trigger ulang face enrollment |
| Lihat rekap absensi | HRD bisa melihat histori absensi karyawan tertentu langsung dari halaman profil karyawan |

---

## WS-05 — Konfigurasi Lokasi Kantor & Geofencing

| Atribut | Detail |
|---|---|
| **ID** | WS-05 |
| **Nama** | Konfigurasi Lokasi Kantor & Geofencing |
| **Aktor Utama** | HRD, Stakeholder |
| **Trigger** | Setup awal sistem atau ada perubahan lokasi kantor |

### Alur Normal

1. HRD / Stakeholder membuka menu **"Lokasi"** di Dashboard Web.
2. Klik **"+ Tambah Lokasi"** untuk mendaftarkan titik lokasi kantor.
3. Menentukan koordinat lokasi dengan salah satu cara:
   - Cari nama tempat/alamat melalui kolom pencarian (menggunakan OpenStreetMap)
   - Klik langsung pada peta interaktif untuk pin titik koordinat
   - Input manual latitude dan longitude
4. Mengisi detail lokasi:
   - Nama lokasi (contoh: *"Kantor Pusat Jakarta"*, *"Cabang Bandung"*)
   - Tipe lokasi: Kantor / WFH Zone
   - Radius geofencing yang diizinkan (dalam meter; contoh: 100m)
5. Klik **"Simpan Lokasi"**.
6. Lokasi aktif dan mulai digunakan sebagai acuan validasi GPS saat karyawan check-in.

### Fitur Multi-Lokasi

- Stakeholder / HRD dapat mendaftarkan **lebih dari satu lokasi** (kantor pusat + beberapa cabang).
- Setiap lokasi memiliki radius geofencing yang dapat dikustomisasi secara independen.
- Karyawan dapat di-assign ke lokasi tertentu sehingga sistem hanya memvalidasi geofencing lokasi yang relevan.

---

## WS-06 — Konfigurasi Shift Kerja

| Atribut | Detail |
|---|---|
| **ID** | WS-06 |
| **Nama** | Konfigurasi & Penjadwalan Shift Kerja |
| **Aktor Utama** | HRD, Stakeholder |
| **Trigger** | Setup awal sistem, atau ada perubahan jadwal kerja perusahaan |

### Alur Normal — Buat Template Shift

1. HRD membuka menu **"Shift"** di Dashboard Web.
2. Klik **"+ Buat Shift Baru"**.
3. Mengisi parameter shift:
   - Nama shift (contoh: *"Shift Pagi"*, *"Shift Siang"*, *"Shift Malam"*)
   - Jam mulai dan jam selesai
   - Grace period / toleransi keterlambatan (dalam menit)
   - Aturan lembur (apakah dihitung otomatis jika check-out melebihi jam selesai)
4. Klik **"Simpan Shift"**.
5. Template shift tersedia untuk di-assign ke karyawan.

### Alur — Assign Shift ke Karyawan

1. HRD membuka menu **"Karyawan"** dan pilih karyawan atau kelompok divisi.
2. Pilih template shift yang berlaku untuk karyawan tersebut.
3. Tentukan tanggal berlaku shift (bisa langsung hari ini atau mulai tanggal tertentu).
4. Jenis penjadwalan yang tersedia:
   - **Recurring / Tetap** — shift yang sama berulang setiap minggu
   - **Rotasi** — karyawan bergantian antar shift sesuai jadwal yang ditentukan
   - **Jadwal Khusus** — untuk tanggal tertentu saja (misal lembur akhir bulan)
5. Karyawan otomatis melihat jadwal shift yang telah di-assign di aplikasi mobile pada menu **"Shift"**.

---

## WS-07 — Proses Check-in Karyawan

| Atribut | Detail |
|---|---|
| **ID** | WS-07 |
| **Nama** | Proses Check-in Harian |
| **Aktor Utama** | Karyawan (End User) |
| **Trigger** | Karyawan memulai jam kerja sesuai jadwal shift |
| **Precondition** | Karyawan sudah login, face enrollment selesai, GPS & kamera aktif di perangkat |

### Alur Normal — Check-in WFO

1. Karyawan membuka aplikasi **AttendX** di smartphone.
2. Halaman utama menampilkan:
   - Nama karyawan dan foto profil
   - Info shift hari ini (contoh: *"Shift Pagi — 08:00 s.d. 17:00"*)
   - Waktu server real-time (WIB) — **bukan waktu lokal perangkat** untuk mencegah manipulasi
   - Status check-in hari ini (*"Belum Check-in"*)
3. Karyawan menekan tombol **"Check-in Sekarang"**.
4. Aplikasi mengaktifkan **GPS** dan mengambil koordinat lokasi karyawan saat ini secara real-time.
5. Sistem membandingkan koordinat karyawan dengan radius geofencing lokasi kantor yang terdaftar.
6. Jika karyawan berada **dalam radius yang diizinkan** → proses lanjut ke langkah verifikasi wajah.
7. Aplikasi mengaktifkan **kamera depan** secara otomatis.
8. Tampil frame oval sebagai panduan posisi wajah dengan instruksi: *"Posisikan wajah di dalam frame."*
9. Google ML Kit menjalankan **Liveness Detection** — sistem menampilkan instruksi gerakan acak (contoh: *"Kedipkan mata"* atau *"Putar kepala ke kanan"*).
10. Karyawan mengikuti instruksi; sistem mendeteksi bahwa gerakan berhasil dilakukan oleh wajah nyata (bukan foto/video).
11. **Face Recognition** mencocokkan vektor wajah real-time karyawan dengan vektor wajah yang tersimpan di profil akun (disimpan saat face enrollment).
12. Jika wajah cocok (similarity score di atas threshold yang dikonfigurasi) → **check-in berhasil**.
13. Sistem mencatat secara otomatis:
    - Timestamp check-in (waktu server)
    - Koordinat GPS saat check-in
    - Tipe lokasi (WFO)
    - Status verifikasi wajah (Verified / Failed)
    - Nama shift yang berlaku
    - Status kehadiran: *"Hadir – On Time"* atau *"Hadir – Terlambat"* (berdasarkan perbandingan dengan jam mulai shift + grace period)
14. Notifikasi sukses muncul di aplikasi.
15. Status karyawan di **Dashboard HRD** berubah secara real-time.
16. Seluruh data dikirim ke server melalui **REST API** dengan autentikasi JWT token.

### Alur Alternatif — Check-in WFH

1. Sama seperti alur WFO, namun pada langkah validasi GPS:
   - Jika karyawan sudah memiliki **pengajuan WFH yang di-approve** untuk hari ini → sistem menonaktifkan validasi geofencing kantor.
   - Sistem memvalidasi bahwa karyawan berada di **lokasi WFH yang terdaftar** (opsional, tergantung konfigurasi perusahaan).
2. **Face Recognition & Liveness Detection tetap wajib** dijalankan meskipun WFH.
3. Status tercatat sebagai *"Hadir – WFH"*.

### Alur Alternatif — Check-in Offline

1. Jika tidak ada koneksi internet saat proses check-in:
   - Validasi GPS & Face Recognition tetap berjalan secara **on-device**.
   - Jika validasi lokal berhasil → data check-in (timestamp, koordinat GPS, snapshot vektor wajah) tersimpan di **Local Storage** perangkat.
   - Muncul notifikasi: *"Absensi tersimpan lokal. Akan dikirim otomatis saat online."*
2. Ketika koneksi internet kembali tersedia → aplikasi otomatis mengirim data ke server (*background sync*).
3. Server menerima data, memvalidasi timestamp offline dengan window toleransi yang dikonfigurasi, dan menyimpan record absensi.

### Exception / Skenario Gagal

| Kondisi | Respons Sistem |
|---|---|
| Lokasi di luar geofence | Check-in ditolak. Pesan: *"Anda berada di luar area yang diizinkan. Hubungi HRD jika ada kendala."* |
| GPS spoofing terdeteksi | Check-in dibatalkan otomatis. Kejadian di-flag sebagai anomali dan muncul peringatan di dashboard HRD. |
| Instruksi liveness tidak diikuti / menggunakan foto | Proses dibatalkan. Sistem mencatat percobaan gagal. |
| Wajah tidak cocok dengan profil | Check-in gagal. Karyawan bisa mencoba kembali (maks. 3x). Jika tetap gagal, karyawan diarahkan menghubungi HRD. |
| Kamera tidak dapat diakses | Tampil pesan error dan panduan mengaktifkan izin kamera di pengaturan perangkat. |
| GPS tidak aktif | Tampil permintaan untuk mengaktifkan GPS sebelum check-in bisa dilanjutkan. |

---

## WS-08 — Proses Check-out Karyawan

| Atribut | Detail |
|---|---|
| **ID** | WS-08 |
| **Nama** | Proses Check-out Harian |
| **Aktor Utama** | Karyawan (End User) |
| **Trigger** | Karyawan mengakhiri jam kerja |
| **Precondition** | Karyawan telah berhasil melakukan check-in pada hari yang sama |

### Alur Normal

1. Karyawan membuka aplikasi; tombol **"Check-out"** aktif (tombol Check-in menjadi non-aktif setelah check-in berhasil).
2. Karyawan menekan tombol **"Check-out"**.
3. Alur **Liveness Detection & Face Recognition** dijalankan kembali — identik dengan proses check-in.
4. Jika verifikasi berhasil → check-out dicatat.
5. Sistem secara otomatis menghitung:
   - **Total jam kerja** = timestamp check-out − timestamp check-in
   - **Status akhir** hari tersebut: *Tepat Waktu / Terlambat / Pulang Lebih Awal / Lembur*
6. Ringkasan kehadiran hari ini ditampilkan di aplikasi.
7. Status karyawan di dashboard HRD diperbarui.

### Catatan Geofencing Check-out

> Validasi geofencing pada check-out dapat dikonfigurasi oleh HRD / Stakeholder. Beberapa perusahaan memilih untuk **tidak memvalidasi lokasi** saat check-out (karyawan boleh check-out dari mana saja setelah jam kerja selesai). Konfigurasi ini tersedia di **Settings → Kebijakan Absensi**.

---

## WS-09 — Pengajuan Izin & Cuti

| Atribut | Detail |
|---|---|
| **ID** | WS-09 |
| **Nama** | Pengajuan Izin & Cuti |
| **Aktor Utama** | Karyawan (End User) |
| **Trigger** | Karyawan tidak dapat hadir, atau ingin bekerja dari rumah (WFH) |
| **Precondition** | Karyawan login di aplikasi mobile |

### Alur Normal

1. Karyawan membuka menu **"Pengajuan"** di aplikasi mobile.
2. Klik **"+ Buat Pengajuan Baru"**.
3. Memilih tipe pengajuan:
   - **Cuti Tahunan** — menggunakan jatah cuti yang tersedia
   - **Izin Sakit** — tidak memotong jatah cuti; bisa butuh dokumen pendukung
   - **Izin Keperluan Keluarga / Pribadi** — tergantung kebijakan perusahaan
   - **WFH (Work From Home)** — bekerja dari rumah, absensi tetap diperlukan via app
4. Mengisi form pengajuan:
   - Tanggal mulai dan tanggal selesai
   - Durasi (sistem otomatis menghitung hari kerja efektif)
   - Keterangan / alasan
5. Melampirkan **dokumen pendukung** jika diperlukan (contoh: foto surat dokter untuk izin sakit).
6. Menekan **"Submit Pengajuan"**.
7. Sistem mengirim **notifikasi push** ke HRD bahwa ada pengajuan baru yang perlu di-review.
8. Status pengajuan di aplikasi karyawan berubah menjadi *"Menunggu Persetujuan (Pending)"*.

### Alur Setelah Pengajuan

- Karyawan bisa melihat status real-time pengajuan di menu **"Pengajuan"** → daftar histori.
- Karyawan bisa **membatalkan** pengajuan selama status masih *"Pending"* (belum diproses HRD).
- Jika pengajuan di-approve → status berubah *"Disetujui"* + push notification masuk.
- Jika pengajuan di-reject → status berubah *"Ditolak"* + push notification beserta catatan alasan dari HRD.

### Kondisi Khusus WFH

> Jika pengajuan **WFH di-approve** oleh HRD, maka pada tanggal yang bersangkutan sistem otomatis menonaktifkan validasi geofencing GPS kantor untuk karyawan tersebut. Karyawan tetap wajib check-in via aplikasi dengan verifikasi wajah.

---

## WS-10 — Approval Izin & Cuti

| Atribut | Detail |
|---|---|
| **ID** | WS-10 |
| **Nama** | Approval Pengajuan Izin & Cuti |
| **Aktor Utama** | HRD |
| **Aktor Sekunder** | Stakeholder (bisa override keputusan HRD) |
| **Trigger** | Ada notifikasi pengajuan baru masuk dari karyawan |
| **Precondition** | HRD login ke Dashboard Web |

### Alur Normal

1. HRD menerima **push notification** di Dashboard Web: *"Ada 1 pengajuan baru dari [nama karyawan] yang perlu di-review."*
2. HRD membuka menu **"Approval"** → tampil daftar pengajuan dengan status *"Pending"*.
3. HRD mengklik pengajuan untuk melihat detail:
   - Nama karyawan dan divisi
   - Tipe pengajuan (Cuti / Izin / WFH)
   - Tanggal dan durasi
   - Alasan yang ditulis karyawan
   - Dokumen pendukung (jika ada)
   - Sisa jatah cuti karyawan (ditampilkan otomatis untuk referensi HRD)
4. HRD mengambil keputusan:
   - Klik **"Setujui"** → pengajuan diapprove
   - Klik **"Tolak"** → HRD wajib mengisi catatan alasan penolakan sebelum bisa submit
5. Sistem memperbarui **status kehadiran** karyawan secara otomatis pada tanggal yang bersangkutan.
6. **Push notification** terkirim ke karyawan berisi keputusan approval.

### Hak Override Stakeholder

> Stakeholder dapat melihat seluruh pengajuan di workspace dan bisa mengubah keputusan HRD (approve yang sudah di-reject, atau sebaliknya). Perubahan ini tercatat di log aktivitas beserta timestamp dan identitas yang melakukan perubahan.

### Dampak Approval pada Sistem

| Tipe Pengajuan | Dampak Jika Approved |
|---|---|
| Cuti Tahunan | Jatah cuti tahunan berkurang sesuai durasi; status kehadiran pada tanggal tersebut = *"Cuti"* |
| Izin Sakit | Tidak memotong jatah cuti; status = *"Izin Sakit"* |
| Izin Keperluan | Tergantung kebijakan perusahaan (potong/tidak potong cuti); status = *"Izin"* |
| WFH | GPS geofencing dinonaktifkan untuk karyawan pada tanggal tersebut; face recognition tetap aktif |

---

## WS-11 — Monitoring Kehadiran Real-time

| Atribut | Detail |
|---|---|
| **ID** | WS-11 |
| **Nama** | Monitoring Kehadiran Real-time |
| **Aktor Utama** | HRD |
| **Aktor Sekunder** | Stakeholder |
| **Trigger** | Jam kerja berjalan; HRD perlu memantau siapa saja yang sudah hadir |
| **Precondition** | HRD login ke Dashboard Web |

### Alur Normal

1. HRD membuka menu **"Live Attendance"** di Dashboard Web.
2. Halaman menampilkan **summary kehadiran hari ini** secara real-time:
   - Jumlah karyawan **Hadir** (Present) — termasuk angka persentase
   - Jumlah karyawan **Terlambat** (Late) — memerlukan perhatian
   - Jumlah karyawan **WFH** — sudah check-in dengan mode WFH
   - Jumlah karyawan **Tidak Hadir / Belum Check-in** (Absent / Unaccounted)
3. Di bawah summary, terdapat **tabel detail per karyawan** yang menampilkan:
   - Nama dan ID karyawan
   - Divisi dan shift yang berlaku
   - Waktu check-in
   - Waktu check-out (masih *"–"* jika belum checkout)
   - Tipe lokasi (Office / WFH)
   - Status verifikasi wajah (✅ Verified / ⚠️ Failed)
   - Status kehadiran (On Time / Late / WFH / Absent)
4. HRD dapat melakukan **filter** berdasarkan: Divisi / Shift / Status Kehadiran.
5. Baris karyawan dengan **anomali** (GPS spoofing terdeteksi / wajah tidak cocok) ditandai dengan ikon ⚠️ berwarna merah.
6. HRD bisa mengklik baris karyawan untuk melihat **detail log absensi**, termasuk koordinat GPS yang tercatat dan foto selfie check-in.

### Perbedaan Hak Akses Monitoring

| Aktor | Hak Akses |
|---|---|
| HRD | Hanya bisa memantau karyawan yang berada di bawah divisi yang di-assign kepadanya |
| Stakeholder | Bisa memantau **seluruh karyawan** di semua divisi dalam workspacenya |

---

## WS-12 — Rekapitulasi & Export Laporan

| Atribut | Detail |
|---|---|
| **ID** | WS-12 |
| **Nama** | Rekapitulasi & Export Laporan Kehadiran |
| **Aktor Utama** | HRD, Stakeholder |
| **Aktor Sekunder** | Karyawan (hanya laporan pribadi sendiri) |
| **Trigger** | Akhir periode (mingguan/bulanan) atau kebutuhan laporan insidental |
| **Precondition** | Terdapat data absensi yang sudah terekam di sistem |

### Alur Normal — HRD / Stakeholder

1. HRD / Stakeholder membuka menu **"Laporan"** di Dashboard Web.
2. Mengatur **parameter laporan**:
   - Rentang tanggal (pilih periode atau bulan tertentu)
   - Filter karyawan: semua / divisi tertentu / karyawan tertentu
3. Sistem men-generate rekap yang mencakup:
   - Total hari hadir per karyawan
   - Total hari terlambat beserta rata-rata durasi keterlambatan
   - Total hari izin / cuti per jenisnya
   - Persentase kehadiran
   - Jumlah dan detail anomali yang tercatat
4. Hasil ditampilkan sebagai **tabel rekap** dan **grafik tren** kehadiran per periode.
5. HRD / Stakeholder klik **"Export"** dan memilih format:
   - **Excel / CSV** — untuk keperluan payroll, analisis, atau arsip
   - **PDF** — untuk dokumentasi formal dan pelaporan ke manajemen
6. File terunduh langsung melalui browser.

### Alur — Karyawan Export Laporan Pribadi

1. Karyawan membuka menu **"Riwayat"** di aplikasi mobile.
2. Memilih periode yang ingin dilihat.
3. Bisa melihat detail absensi per hari (jam masuk, jam keluar, status, lokasi).
4. Klik **"Export"** → laporan absensi pribadi tersimpan di perangkat dalam format PDF.

### Hak Akses Export

| Aktor | Hak Export |
|---|---|
| Stakeholder | Semua divisi, semua karyawan |
| HRD | Hanya divisi yang dikelolanya |
| Karyawan | Hanya rekap absensi pribadi sendiri |

---

## Matriks Hak Akses — Level Workspace

| Fitur / Aksi | Stakeholder | HRD | Karyawan |
|---|:---:|:---:|:---:|
| Daftarkan perusahaan (max 1) | ✅ | ❌ | ❌ |
| Edit profil & pengaturan perusahaan | ✅ | ❌ | ❌ |
| Buat / kelola akun HRD | ✅ | ❌ | ❌ |
| Nonaktifkan akun HRD | ✅ | ❌ | ❌ |
| Buat / kelola data karyawan | ✅ | ✅ | ❌ |
| Nonaktifkan akun karyawan | ✅ | ✅ | ❌ |
| Konfigurasi lokasi & geofencing | ✅ | ✅ | ❌ |
| Konfigurasi shift kerja | ✅ | ✅ | ❌ |
| Assign shift ke karyawan | ✅ | ✅ | ❌ |
| Lihat jadwal shift pribadi | ❌ | ❌ | ✅ |
| Check-in & Check-out | ❌ | ❌ | ✅ |
| Ajukan izin / cuti / WFH | ❌ | ❌ | ✅ |
| Approval izin & cuti | ✅ (override) | ✅ | ❌ |
| Monitoring live semua divisi | ✅ | ❌ | ❌ |
| Monitoring live divisi sendiri | ✅ | ✅ | ❌ |
| Export laporan semua karyawan | ✅ | ❌ | ❌ |
| Export laporan divisi sendiri | ✅ | ✅ | ❌ |
| Export laporan pribadi sendiri | ❌ | ❌ | ✅ |
| Lihat histori absensi pribadi | ❌ | ❌ | ✅ |

---

*Dokumen ini mencakup use case khusus Level Workspace sistem AttendX.*
*Dibuat berdasarkan Proposal Pengembangan Aplikasi Absensi Digital Karyawan PT Inovasi Kerja Digital — Universitas Esa Unggul 2026.*
*Kelompok: David Boy, Muhammad Riky, Muhammad Fikri Nurwahid, Rizky Nurhafiizh Sayrendra*
