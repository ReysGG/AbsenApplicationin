# PRD — AttendX Web Dashboard v1

## Sistem Absensi Digital Karyawan Berbasis SaaS

**Project:** AttendX
**Client/Case:** PT Inovasi Kerja Digital
**Platform utama v1:** Web Dashboard untuk HR/Admin Workspace
**Dokumen:** Product Requirements Document
**Versi:** v1.0

CATATAN untuk API nya pakai Express.js! ada folder backend di dalam folder apps/!
---

# 1. Overview & Goals

## 1.1 Ringkasan Produk

AttendX adalah sistem absensi digital berbasis SaaS untuk perusahaan yang menerapkan model kerja modern seperti WFO, WFH, hybrid, multi-divisi, dan multi-cabang.

Sistem ini terdiri dari:

* Mobile App untuk karyawan melakukan check-in/check-out.
* Web Dashboard untuk HR/Admin mengelola karyawan, lokasi, jadwal, absensi, dan laporan.
* REST API sebagai penghubung antara mobile app, web dashboard, dan database.

Fokus PRD ini adalah **Web Dashboard v1**, yaitu panel kerja untuk HR, Stakeholder perusahaan, dan Support Admin dalam memantau serta mengelola data absensi karyawan.

---

## 1.2 Pengguna Utama

### Platform Level

* Super Admin
* Admin Platform

### Workspace Level

* Stakeholder / Owner Perusahaan
* Support Admin / HR Admin
* End User / Karyawan

---

## 1.3 Masalah yang Diselesaikan

Perusahaan dengan sistem kerja WFO/WFH sering mengalami masalah berikut:

1. Absensi manual rentan manipulasi waktu dan lokasi.
2. HR membutuhkan waktu lama untuk merekap absensi bulanan.
3. Sistem fingerprint tidak cocok untuk WFH atau multi-cabang.
4. Data absensi tersebar di banyak sumber.
5. Perusahaan sulit mengelola karyawan berdasarkan divisi, lokasi, shift, dan struktur role.
6. Solusi SaaS komersial per-user sering terlalu mahal untuk startup atau SME.

---

## 1.4 Tujuan Produk

Web Dashboard AttendX v1 bertujuan untuk:

* Membantu HR memantau absensi secara real-time.
* Mengurangi pekerjaan rekap manual.
* Memusatkan data karyawan, jadwal shift, lokasi kerja, dan laporan.
* Memberikan kontrol akses berdasarkan role.
* Menyediakan laporan kehadiran yang bisa diekspor.
* Mendukung sistem kerja WFO, WFH, multi-lokasi, dan multi-divisi.

---

## 1.5 Success Metrics

Target keberhasilan Web Dashboard v1:

| Area                | Metric                                                                  |
| ------------------- | ----------------------------------------------------------------------- |
| Efisiensi HR        | Waktu rekap absensi bulanan turun minimal 70%                           |
| Manual Entry        | 0 input manual untuk data check-in/check-out reguler                    |
| Laporan             | HR dapat generate laporan periode tertentu dalam < 1 menit              |
| Monitoring          | Data live attendance tampil maksimal 10 detik setelah data masuk        |
| Validitas Data      | Minimal 95% absensi memiliki data lokasi, waktu, user, dan status valid |
| Error Rate          | Error export laporan < 2% dari total request export                     |
| Adoption            | 80% HR/Admin aktif menggunakan dashboard minimal 3x seminggu            |
| Multi-tenant Safety | 0 kasus data tenant/workspace bocor ke tenant lain                      |

---

# 2. Scope — In & Out

## 2.1 In Scope — Web Dashboard v1

Fitur yang masuk dalam Web Dashboard v1:

1. Authentication & Role Access

   * Login dashboard.
   * Role-based access control.
   * Workspace-based access.

2. Overview Dashboard

   * Total karyawan.
   * Total hadir hari ini.
   * Total terlambat.
   * Total izin/cuti.
   * Grafik tren kehadiran.
   * Ringkasan per divisi.
   * Ringkasan leave/permit.

3. Live Attendance

   * Tabel absensi real-time.
   * Filter tanggal.
   * Filter divisi.
   * Filter lokasi.
   * Filter status.
   * Detail attendance log.
   * Export data attendance.

4. Workforce / Employee Management

   * Tambah karyawan.
   * Edit karyawan.
   * Nonaktifkan karyawan.
   * Assign divisi.
   * Assign lokasi kerja.
   * Assign shift.
   * Assign role workspace.

5. Locations

   * Tambah lokasi kantor.
   * Edit koordinat lokasi.
   * Atur radius geofence.
   * Aktif/nonaktif lokasi.
   * Dukungan multi-cabang.

6. Shift Management

   * Tambah shift.
   * Edit shift.
   * Assign shift ke karyawan.
   * Atur jam masuk, jam pulang, grace period.

7. Leave & Permit Approval

   * Melihat daftar pengajuan izin/cuti.
   * Approve/reject pengajuan.
   * Melihat status pengajuan.

8. Reports

   * Rekap absensi per periode.
   * Filter berdasarkan divisi, lokasi, karyawan, status.
   * Export Excel/CSV.
   * Export PDF sebagai nice-to-have v1.1.

9. Settings

   * Konfigurasi workspace.
   * Konfigurasi WFO/WFH.
   * Konfigurasi default geofence.
   * Konfigurasi grace period keterlambatan.
   * Konfigurasi role terbatas.

---

## 2.2 Out of Scope — Web Dashboard v1

Fitur berikut tidak masuk ke Web Dashboard v1:

1. Billing System

   * Paket subscription.
   * Invoice tenant.
   * Payment gateway.
   * Upgrade/downgrade plan.

2. Support Ticket Platform

   * Live chat CS.
   * Ticket support.
   * SLA support platform.

3. Full Super Admin Platform

   * Monitoring kesehatan platform global.
   * Revenue analytics.
   * Tenant billing analytics.

4. Payroll System

   * Perhitungan gaji.
   * Potongan otomatis.
   * Integrasi pajak.
   * Slip gaji.

5. Advanced Attendance Fraud AI

   * Deteksi pola kecurangan berbasis machine learning.
   * Risk scoring otomatis.

6. Face Recognition Management di Web

   * Registrasi wajah tetap dilakukan dari mobile app.
   * Dashboard hanya melihat status verifikasi, bukan mengelola model wajah secara manual.

7. Native Mobile App Implementation

   * Mobile app punya PRD terpisah.
   * Web Dashboard hanya mengonsumsi data dari mobile attendance.

8. Offline Attendance Sync Engine

   * Mekanisme offline sync berada di mobile app dan backend.
   * Dashboard hanya menampilkan status sync jika data sudah masuk.

---

# 3. User Roles & Permissions

## 3.1 Role Overview

| Role                     | Level     | Deskripsi                                                         |
| ------------------------ | --------- | ----------------------------------------------------------------- |
| Super Admin              | Platform  | Tim internal pemilik platform. Mengelola platform secara global.  |
| Admin Platform           | Platform  | Membantu operasional platform dan tenant.                         |
| Stakeholder              | Workspace | Owner/admin utama perusahaan klien.                               |
| Support Admin / HR Admin | Workspace | HR/admin internal perusahaan yang mengelola karyawan dan absensi. |
| End User                 | Workspace | Karyawan yang melakukan absensi lewat mobile app.                 |

---

## 3.2 Permission Detail per Modul

## A. Overview Dashboard

| Role           | Bisa Melihat                  | Bisa Mengedit       |
| -------------- | ----------------------------- | ------------------- |
| Super Admin    | Tidak masuk workspace v1      | Tidak               |
| Admin Platform | Tidak masuk workspace v1      | Tidak               |
| Stakeholder    | Semua statistik workspace     | Tidak, hanya filter |
| Support Admin  | Statistik sesuai divisi/akses | Tidak, hanya filter |
| End User       | Tidak akses web dashboard v1  | Tidak               |

Rules:

* Stakeholder melihat seluruh data workspace.
* Support Admin hanya melihat data divisi/lokasi yang diberikan.
* End User tidak masuk dashboard web v1.

---

## B. Live Attendance

| Role          | Bisa Melihat                    | Bisa Mengedit        |
| ------------- | ------------------------------- | -------------------- |
| Stakeholder   | Semua live attendance workspace | Tidak edit log utama |
| Support Admin | Attendance sesuai akses         | Tidak edit log utama |
| End User      | Riwayat sendiri via mobile      | Tidak via web        |

Rules:

* Attendance log tidak boleh diubah langsung.
* Koreksi absensi harus melalui mekanisme adjustment request atau admin note.
* Perubahan manual terhadap data kehadiran harus tercatat di audit log.

---

## C. Workforce / Karyawan

| Role          | Bisa Melihat                  | Bisa Mengedit                          |
| ------------- | ----------------------------- | -------------------------------------- |
| Stakeholder   | Semua karyawan                | Tambah, edit, nonaktifkan, assign role |
| Support Admin | Karyawan sesuai divisi/lokasi | Tambah/edit terbatas jika diizinkan    |
| End User      | Profil sendiri via mobile     | Edit profil terbatas                   |

Rules:

* Karyawan tidak dihapus permanen.
* Status karyawan hanya Active, Inactive, Suspended, atau Archived.
* Nonaktif karyawan tidak menghapus history attendance.

---

## D. Locations

| Role          | Bisa Melihat                   | Bisa Mengedit                |
| ------------- | ------------------------------ | ---------------------------- |
| Stakeholder   | Semua lokasi                   | Tambah, edit, aktif/nonaktif |
| Support Admin | Lokasi sesuai akses            | Edit jika diberi permission  |
| End User      | Lokasi yang relevan via mobile | Tidak                        |

Rules:

* Setiap lokasi wajib memiliki nama, latitude, longitude, dan radius.
* Lokasi tidak boleh dihapus jika masih dipakai attendance history.
* Lokasi bisa dinonaktifkan.

---

## E. Reports

| Role          | Bisa Melihat               | Bisa Export        |
| ------------- | -------------------------- | ------------------ |
| Stakeholder   | Semua laporan workspace    | Ya                 |
| Support Admin | Laporan sesuai akses       | Ya, jika diizinkan |
| End User      | Riwayat pribadi via mobile | Tidak via web v1   |

Rules:

* Export wajib mengikuti filter akses role.
* User tidak boleh export data di luar workspace/divisi/lokasi aksesnya.

---

## F. Settings

| Role          | Bisa Melihat                 | Bisa Mengedit |
| ------------- | ---------------------------- | ------------- |
| Stakeholder   | Semua setting workspace      | Ya            |
| Support Admin | Sebagian setting operasional | Terbatas      |
| End User      | Tidak                        | Tidak         |

Rules:

* Perubahan setting penting seperti geofence, shift, WFH mode, dan role wajib masuk audit log.
* Setting workspace tidak boleh memengaruhi workspace lain.

---

# 4. Feature Specs per Modul

---

# 4.1 Overview Dashboard

## Objective

Memberikan ringkasan cepat kondisi kehadiran perusahaan hari ini dan tren absensi dalam periode tertentu.

## User Stories

1. Sebagai Stakeholder, saya bisa melihat ringkasan total karyawan, hadir, terlambat, izin, dan absen hari ini agar saya tahu kondisi operasional perusahaan.
2. Sebagai HR Admin, saya bisa melihat tren kehadiran 30 hari terakhir agar saya bisa menganalisis pola keterlambatan.
3. Sebagai HR Admin, saya bisa melihat breakdown per divisi agar saya tahu divisi mana yang paling sering terlambat atau absen.
4. Sebagai Stakeholder, saya bisa klik ringkasan live check-ins untuk masuk ke halaman Live Attendance.

## Main Components

* Summary cards:

  * Total Employees
  * Present Today
  * Late Today
  * On Leave/Permit
  * Absent
* Attendance trend chart.
* Department breakdown.
* Leave & permit summary.
* Live check-ins preview.
* Date range filter.

## Business Rules

1. Present dihitung jika karyawan memiliki check-in valid pada tanggal berjalan.
2. Late dihitung jika check-in melewati jam masuk shift + grace period.
3. Absent dihitung jika karyawan aktif dan tidak memiliki check-in valid sampai batas waktu tertentu.
4. On Leave dihitung jika pengajuan cuti/izin sudah approved untuk hari tersebut.
5. Data dashboard harus mengikuti akses role.
6. Default periode grafik adalah 30 hari terakhir.

## Edge Cases

| Case                               | Expected Behavior                           |
| ---------------------------------- | ------------------------------------------- |
| Karyawan belum punya shift         | Masuk kategori “Unassigned Shift”           |
| Karyawan baru ditambahkan hari ini | Tidak dihitung absent sebelum tanggal aktif |
| Karyawan inactive                  | Tidak dihitung dalam present/absent         |
| Data mobile terlambat sync         | Tampilkan badge “Synced Late” di detail log |
| Tidak ada data                     | Tampilkan empty state, bukan error          |

## Acceptance Criteria

* Dashboard tampil setelah login.
* Semua summary card sesuai filter tanggal dan akses user.
* Klik card “Late” mengarah ke Live Attendance dengan filter status Late.
* Grafik tidak crash meskipun data kosong.
* Data dashboard tidak menampilkan karyawan dari workspace lain.

---

# 4.2 Live Attendance

## Objective

Membantu HR memantau absensi yang masuk secara real-time dan melakukan filter berdasarkan kebutuhan operasional.

## User Stories

1. Sebagai HR Admin, saya bisa melihat siapa saja yang sudah check-in hari ini.
2. Sebagai HR Admin, saya bisa melihat status karyawan: Present, Late, Absent, Leave, atau Pending Checkout.
3. Sebagai HR Admin, saya bisa memfilter attendance berdasarkan divisi, lokasi, shift, status, dan tanggal.
4. Sebagai Stakeholder, saya bisa mengekspor data attendance berdasarkan filter yang dipilih.
5. Sebagai HR Admin, saya bisa melihat detail log untuk memvalidasi lokasi, waktu, dan status verifikasi wajah.

## Table Columns

* Employee name
* Employee ID
* Department
* Shift
* Check-in time
* Check-out time
* Location
* Work mode: WFO/WFH
* Face verification status
* GPS/geofence status
* Attendance status
* Sync status
* Action/detail

## Business Rules

1. Status Present:

   * Check-in valid.
   * Face verification passed.
   * Lokasi valid untuk mode kerja yang dipakai.

2. Status Late:

   * Check-in valid tetapi melewati jam masuk + grace period.

3. Status Absent:

   * Tidak ada check-in sampai batas waktu cut-off.
   * Tidak sedang izin/cuti approved.

4. Status Pending Checkout:

   * Ada check-in valid.
   * Belum ada check-out.

5. Status Invalid:

   * Face verification gagal.
   * GPS spoofing terdeteksi.
   * Lokasi di luar geofence.
   * Data offline sync mencurigakan.

6. Default grace period:

   * 10 menit setelah jam masuk shift.
   * Bisa dikonfigurasi per workspace.

7. Default geofence radius:

   * WFO: 100 meter.
   * WFH: 150 meter dari lokasi WFH yang disetujui.
   * Bisa dikonfigurasi oleh Stakeholder.

8. Data attendance log tidak boleh dihapus.

9. Semua correction/manual adjustment harus dicatat di audit log.

## Edge Cases

| Case                                  | Expected Behavior                                                         |
| ------------------------------------- | ------------------------------------------------------------------------- |
| Karyawan lupa check-out               | Status menjadi “Missing Checkout” setelah melewati jam pulang + tolerance |
| Karyawan check-in dua kali            | Sistem hanya memakai check-in valid pertama, sisanya masuk duplicate log  |
| Karyawan check-out tanpa check-in     | Tampilkan sebagai invalid sequence                                        |
| GPS tidak aktif                       | Mobile menolak proses, dashboard tidak menerima log valid                 |
| Face verification gagal               | Log masuk sebagai failed attempt jika dikirim ke server                   |
| Offline check-in baru sync malam hari | Tampilkan waktu asli check-in dan waktu sync                              |
| Shift malam lintas tanggal            | Attendance date mengikuti shift start date                                |
| Karyawan pindah lokasi                | Lokasi valid mengikuti assigned location terbaru                          |

## Acceptance Criteria

* HR bisa melihat list attendance hari ini.
* Filter status, tanggal, divisi, lokasi, dan shift berjalan.
* Export hanya mengambil data sesuai filter.
* Detail log menampilkan timestamp check-in, checkout, lokasi, face status, dan sync status.
* Data dari workspace lain tidak pernah muncul.

---

# 4.3 Workforce / Employee Management

## Objective

Menyediakan modul untuk HR mengelola data karyawan, status kerja, divisi, lokasi, shift, dan role.

## User Stories

1. Sebagai Stakeholder, saya bisa menambahkan karyawan baru ke workspace.
2. Sebagai HR Admin, saya bisa mengedit data karyawan yang berada dalam divisi saya.
3. Sebagai Stakeholder, saya bisa menonaktifkan karyawan tanpa menghapus history attendance.
4. Sebagai HR Admin, saya bisa assign shift dan lokasi kerja ke karyawan.
5. Sebagai Stakeholder, saya bisa memberi role Support Admin kepada user tertentu.

## Fields

* Employee ID
* Full name
* Email
* Phone number
* Department
* Position
* Employment status
* Workspace role
* Assigned location
* Assigned shift
* Work mode eligibility: WFO, WFH, Hybrid
* Face profile status
* Account status
* Join date

## Business Rules

1. Email karyawan harus unik dalam satu workspace.
2. Employee ID harus unik dalam satu workspace.
3. Satu user dapat memiliki satu employee profile dalam satu workspace.
4. Karyawan inactive tidak bisa melakukan check-in.
5. Karyawan archived tetap muncul di laporan historis.
6. Face profile status:

   * Not Registered
   * Registered
   * Need Re-enrollment
7. HR tidak bisa mengubah data karyawan di luar scope aksesnya.

## Edge Cases

| Case                        | Expected Behavior                                        |
| --------------------------- | -------------------------------------------------------- |
| Email sudah dipakai         | Tampilkan error “Email already exists in this workspace” |
| Karyawan belum punya shift  | Tampilkan warning “Shift belum diatur”                   |
| Karyawan belum punya lokasi | Tampilkan warning “Lokasi belum diatur”                  |
| Karyawan resign             | Ubah status ke inactive/archive, history tetap aman      |
| Role HR dihapus             | User kehilangan akses dashboard setelah sesi refresh     |
| Karyawan pindah divisi      | Data baru berlaku mulai tanggal efektif                  |

## Acceptance Criteria

* Stakeholder bisa CRUD karyawan.
* Support Admin hanya bisa mengelola karyawan sesuai akses.
* Nonaktif karyawan tidak menghapus data attendance.
* Sistem menampilkan warning untuk data penting yang belum lengkap.

---

# 4.4 Locations

## Objective

Mengatur lokasi kerja WFO/WFH dan radius geofence untuk validasi absensi.

## User Stories

1. Sebagai Stakeholder, saya bisa menambahkan lokasi kantor baru.
2. Sebagai HR Admin, saya bisa mengatur radius geofence lokasi kantor.
3. Sebagai HR Admin, saya bisa menonaktifkan lokasi yang sudah tidak dipakai.
4. Sebagai HR Admin, saya bisa melihat karyawan yang terhubung ke lokasi tertentu.

## Fields

* Location name
* Location type: Office, Branch, WFH Approved Location
* Address
* Latitude
* Longitude
* Geofence radius
* Status: Active/Inactive
* Assigned employees count
* Created by
* Updated by

## Business Rules

1. Default radius WFO adalah 100 meter.
2. Default radius WFH adalah 150 meter.
3. Minimum radius adalah 50 meter.
4. Maximum radius adalah 500 meter.
5. Lokasi inactive tidak bisa dipakai untuk assignment baru.
6. Lokasi yang punya attendance history tidak boleh dihapus permanen.
7. Perubahan radius tidak mengubah validasi attendance lama.

## Edge Cases

| Case                          | Expected Behavior                          |
| ----------------------------- | ------------------------------------------ |
| Koordinat kosong              | Form tidak bisa disimpan                   |
| Radius terlalu kecil          | Tampilkan validasi minimum radius          |
| Radius terlalu besar          | Tampilkan warning dan batas maksimum       |
| Lokasi dipakai karyawan aktif | Tidak boleh delete, hanya deactivate       |
| Map provider gagal load       | Tetap bisa input latitude/longitude manual |
| Karyawan WFH berpindah alamat | Harus update approved WFH location         |

## Acceptance Criteria

* User bisa membuat lokasi baru dengan koordinat valid.
* Radius disimpan dan dipakai backend untuk validasi attendance.
* Lokasi inactive tidak muncul sebagai pilihan assignment baru.
* Semua perubahan lokasi masuk audit log.

---

# 4.5 Shift Management

## Objective

Mengelola jadwal kerja agar perhitungan hadir, terlambat, checkout, dan absent akurat.

## User Stories

1. Sebagai HR Admin, saya bisa membuat shift kerja.
2. Sebagai HR Admin, saya bisa assign shift ke karyawan.
3. Sebagai Stakeholder, saya bisa mengatur grace period keterlambatan.
4. Sebagai HR Admin, saya bisa melihat karyawan yang belum memiliki shift.

## Fields

* Shift name
* Start time
* End time
* Break time optional
* Grace period
* Checkout tolerance
* Work days
* Status
* Assigned employees count

## Business Rules

1. Default grace period adalah 10 menit.
2. Default checkout tolerance adalah 60 menit setelah jam pulang.
3. Shift malam boleh melewati tanggal.
4. Karyawan wajib punya shift aktif agar status late/absent dapat dihitung otomatis.
5. Perubahan shift berlaku sejak tanggal efektif, bukan mengubah history.

## Edge Cases

| Case                             | Expected Behavior                                |
| -------------------------------- | ------------------------------------------------ |
| Shift lintas hari                | Attendance date ikut tanggal mulai shift         |
| Karyawan belum punya shift       | Dashboard memberi warning                        |
| Shift dihapus                    | Tidak boleh jika ada history, hanya inactive     |
| Jam masuk sama dengan jam keluar | Form ditolak                                     |
| Perubahan shift di tengah bulan  | Report menampilkan aturan sesuai tanggal efektif |

## Acceptance Criteria

* HR bisa membuat dan mengedit shift.
* Shift bisa di-assign ke karyawan.
* Late dihitung berdasarkan shift + grace period.
* History attendance tetap konsisten walau shift berubah.

---

# 4.6 Leave & Permit Approval

## Objective

Membantu HR mengelola pengajuan izin dan cuti dari karyawan.

## User Stories

1. Sebagai HR Admin, saya bisa melihat daftar pengajuan izin/cuti.
2. Sebagai HR Admin, saya bisa approve atau reject pengajuan.
3. Sebagai Stakeholder, saya bisa melihat statistik izin/cuti.
4. Sebagai HR Admin, saya bisa melihat alasan dan lampiran pengajuan jika ada.

## Fields

* Employee
* Leave type
* Start date
* End date
* Reason
* Attachment optional
* Status: Pending, Approved, Rejected, Cancelled
* Approver
* Approved/rejected at
* Notes

## Business Rules

1. Pengajuan yang approved membuat employee tidak dihitung absent.
2. Pengajuan pending tidak mengubah status attendance.
3. Pengajuan rejected tidak mengubah status attendance.
4. Pengajuan untuk tanggal lampau hanya bisa dilakukan jika workspace mengizinkan.
5. Approval wajib menyimpan approver ID dan timestamp.

## Edge Cases

| Case                                  | Expected Behavior                                       |
| ------------------------------------- | ------------------------------------------------------- |
| Pengajuan bentrok dengan attendance   | Tampilkan warning ke HR                                 |
| Pengajuan multi-day                   | Sistem membuat status leave untuk semua tanggal terkait |
| Karyawan mengajukan di hari yang sama | Ikuti setting workspace                                 |
| Approver tidak punya akses divisi     | Approval ditolak                                        |
| Pengajuan dibatalkan                  | Status menjadi Cancelled jika belum approved            |

## Acceptance Criteria

* HR bisa approve/reject pengajuan.
* Approved leave memengaruhi dashboard dan report.
* Semua keputusan approval masuk audit log.

---

# 4.7 Reports & Export

## Objective

Membuat laporan absensi yang cepat, akurat, dan bisa digunakan HR untuk rekap bulanan.

## User Stories

1. Sebagai HR Admin, saya bisa membuat laporan absensi berdasarkan periode.
2. Sebagai HR Admin, saya bisa memfilter laporan berdasarkan divisi, lokasi, shift, status, atau karyawan.
3. Sebagai Stakeholder, saya bisa export laporan ke Excel/CSV.
4. Sebagai HR Admin, saya bisa melihat ringkasan total hadir, late, absent, leave, dan missing checkout.

## Report Types

1. Attendance Summary Report
2. Daily Attendance Detail
3. Late Employees Report
4. Missing Checkout Report
5. Leave & Permit Report
6. Department Attendance Report

## Business Rules

1. Export mengikuti filter aktif.
2. Export hanya mengambil data sesuai permission user.
3. Laporan harus mencantumkan:

   * Nama karyawan
   * Employee ID
   * Divisi
   * Tanggal
   * Shift
   * Check-in
   * Check-out
   * Status
   * Work mode
   * Location
   * Notes
4. PDF export masuk v1.1 jika waktu memungkinkan.
5. Export besar harus diproses async jika melebihi batas tertentu.

## Edge Cases

| Case                        | Expected Behavior                            |
| --------------------------- | -------------------------------------------- |
| Data periode kosong         | Export tetap menghasilkan file dengan header |
| Periode terlalu panjang     | Tampilkan limit atau proses async            |
| User export data luar akses | Ditolak                                      |
| Attendance belum checkout   | Status “Missing Checkout”                    |
| Data offline sync           | Tampilkan original time dan sync time        |

## Acceptance Criteria

* HR bisa generate laporan per periode.
* Export Excel/CSV berhasil.
* Data export sesuai filter dan permission.
* Empty state tersedia jika tidak ada data.

---

# 4.8 Settings

## Objective

Mengatur konfigurasi workspace agar aturan absensi sesuai kebijakan perusahaan.

## User Stories

1. Sebagai Stakeholder, saya bisa mengatur default geofence radius.
2. Sebagai Stakeholder, saya bisa mengaktifkan atau menonaktifkan mode WFH.
3. Sebagai Stakeholder, saya bisa mengatur grace period keterlambatan.
4. Sebagai Stakeholder, saya bisa mengatur siapa saja yang menjadi Support Admin.

## Settings List

* Workspace name
* Default timezone
* Default geofence radius
* Default grace period
* WFH mode enabled/disabled
* Hybrid mode enabled/disabled
* Late calculation policy
* Missing checkout policy
* Export permissions
* Role management

## Business Rules

1. Hanya Stakeholder yang bisa mengubah setting utama workspace.
2. Support Admin hanya bisa mengubah setting operasional jika diberi permission.
3. Perubahan setting tidak boleh memengaruhi data historis.
4. Semua perubahan setting wajib masuk audit log.

## Edge Cases

| Case                              | Expected Behavior                                             |
| --------------------------------- | ------------------------------------------------------------- |
| Timezone berubah                  | Data lama tetap disimpan UTC, tampilan mengikuti setting baru |
| WFH dimatikan                     | Karyawan tidak bisa memilih mode WFH untuk attendance baru    |
| Grace period berubah              | Berlaku mulai tanggal efektif                                 |
| Role terakhir Stakeholder dihapus | Sistem menolak agar workspace tidak kehilangan owner          |

## Acceptance Criteria

* Stakeholder bisa mengubah setting workspace.
* Semua perubahan tercatat.
* Setting workspace hanya berlaku untuk workspace tersebut.

---

# 5. Data Model & API Contract

## 5.1 Core Entity Relationship

Relasi utama sistem:

Tenant
→ Workspace
→ User
→ Employee
→ AttendanceLog

Tambahan:

Workspace
→ Department
→ Location
→ Shift
→ LeaveRequest
→ RoleAssignment
→ AuditLog

---

## 5.2 Entity Definition

## Tenant

Mewakili perusahaan/organisasi pelanggan di level platform.

Fields:

* id
* name
* slug
* status
* plan
* created_at
* updated_at

Relationship:

* Tenant memiliki banyak Workspace.

---

## Workspace

Ruang kerja terisolasi milik tenant.

Fields:

* id
* tenant_id
* name
* timezone
* default_geofence_radius
* default_grace_period
* wfh_enabled
* status
* created_at
* updated_at

Relationship:

* Workspace memiliki banyak Employee.
* Workspace memiliki banyak Location.
* Workspace memiliki banyak Shift.
* Workspace memiliki banyak AttendanceLog.

---

## User

Akun login yang bisa mengakses mobile atau dashboard.

Fields:

* id
* firebase_uid
* email
* phone
* full_name
* global_role
* status
* last_login_at
* created_at
* updated_at

Relationship:

* User dapat memiliki Employee Profile.
* User dapat memiliki RoleAssignment.

---

## Employee

Profil karyawan dalam workspace.

Fields:

* id
* workspace_id
* user_id
* employee_code
* full_name
* department_id
* position
* employment_status
* assigned_location_id
* assigned_shift_id
* work_mode
* face_profile_status
* joined_at
* inactive_at
* created_at
* updated_at

Relationship:

* Employee memiliki banyak AttendanceLog.
* Employee memiliki banyak LeaveRequest.

---

## Department

Divisi atau unit kerja.

Fields:

* id
* workspace_id
* name
* parent_department_id
* status
* created_at
* updated_at

---

## Location

Lokasi kerja valid untuk geofence.

Fields:

* id
* workspace_id
* name
* type
* address
* latitude
* longitude
* radius_meters
* status
* created_at
* updated_at

---

## Shift

Jadwal kerja karyawan.

Fields:

* id
* workspace_id
* name
* start_time
* end_time
* grace_period_minutes
* checkout_tolerance_minutes
* effective_from
* status
* created_at
* updated_at

---

## AttendanceLog

Data check-in/check-out karyawan.

Fields:

* id
* workspace_id
* employee_id
* attendance_date
* shift_id
* check_in_at
* check_out_at
* check_in_latitude
* check_in_longitude
* check_out_latitude
* check_out_longitude
* location_id
* work_mode
* face_check_status
* geofence_status
* spoofing_status
* sync_status
* status
* notes
* created_at
* updated_at

---

## LeaveRequest

Data izin/cuti.

Fields:

* id
* workspace_id
* employee_id
* type
* start_date
* end_date
* reason
* attachment_url
* status
* approver_id
* approved_at
* rejected_at
* notes
* created_at
* updated_at

---

## RoleAssignment

Hak akses user dalam workspace.

Fields:

* id
* workspace_id
* user_id
* role
* scope_type
* scope_id
* created_at
* updated_at

Role values:

* stakeholder
* support_admin
* end_user

Scope type:

* workspace
* department
* location

---

## AuditLog

Catatan perubahan penting.

Fields:

* id
* workspace_id
* actor_user_id
* action
* entity_type
* entity_id
* old_value
* new_value
* ip_address
* user_agent
* created_at

---

# 5.3 API Contract

Base URL:

`/api/v1`

Authentication:

`Authorization: Bearer <JWT>`

Standard Response:

```json
{
  "success": true,
  "data": {},
  "message": "OK"
}
```

Standard Error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input"
  }
}
```

---

## Auth & Me

| Method | Endpoint              | Description                              |
| ------ | --------------------- | ---------------------------------------- |
| GET    | `/me`                 | Get current user profile and permissions |
| GET    | `/workspaces/current` | Get current workspace context            |

---

## Dashboard

| Method | Endpoint                          | Description          |
| ------ | --------------------------------- | -------------------- |
| GET    | `/dashboard/summary`              | Get summary cards    |
| GET    | `/dashboard/attendance-trend`     | Get attendance trend |
| GET    | `/dashboard/department-breakdown` | Get department stats |
| GET    | `/dashboard/live-preview`         | Get latest check-ins |

Query example:

```txt
?date=2026-06-06&department_id=all&location_id=all
```

---

## Attendance

| Method | Endpoint                          | Description           |
| ------ | --------------------------------- | --------------------- |
| GET    | `/attendance`                     | List attendance logs  |
| GET    | `/attendance/:id`                 | Get attendance detail |
| GET    | `/attendance/export`              | Export attendance     |
| POST   | `/attendance/:id/adjustment-note` | Add admin note        |

Filters:

```txt
?start_date=2026-06-01
&end_date=2026-06-30
&department_id=dept_123
&location_id=loc_123
&status=late
&shift_id=shift_123
```

---

## Employees

| Method | Endpoint                | Description            |
| ------ | ----------------------- | ---------------------- |
| GET    | `/employees`            | List employees         |
| POST   | `/employees`            | Create employee        |
| GET    | `/employees/:id`        | Get employee detail    |
| PATCH  | `/employees/:id`        | Update employee        |
| PATCH  | `/employees/:id/status` | Change employee status |

---

## Locations

| Method | Endpoint                | Description                  |
| ------ | ----------------------- | ---------------------------- |
| GET    | `/locations`            | List locations               |
| POST   | `/locations`            | Create location              |
| GET    | `/locations/:id`        | Get location detail          |
| PATCH  | `/locations/:id`        | Update location              |
| PATCH  | `/locations/:id/status` | Activate/deactivate location |

---

## Shifts

| Method | Endpoint             | Description               |
| ------ | -------------------- | ------------------------- |
| GET    | `/shifts`            | List shifts               |
| POST   | `/shifts`            | Create shift              |
| GET    | `/shifts/:id`        | Get shift detail          |
| PATCH  | `/shifts/:id`        | Update shift              |
| POST   | `/shifts/:id/assign` | Assign shift to employees |

---

## Leave Requests

| Method | Endpoint                      | Description         |
| ------ | ----------------------------- | ------------------- |
| GET    | `/leave-requests`             | List leave requests |
| GET    | `/leave-requests/:id`         | Get leave detail    |
| PATCH  | `/leave-requests/:id/approve` | Approve request     |
| PATCH  | `/leave-requests/:id/reject`  | Reject request      |

---

## Reports

| Method | Endpoint                      | Description             |
| ------ | ----------------------------- | ----------------------- |
| GET    | `/reports/attendance-summary` | Attendance summary      |
| GET    | `/reports/daily-detail`       | Daily detail report     |
| GET    | `/reports/late`               | Late report             |
| GET    | `/reports/missing-checkout`   | Missing checkout report |
| GET    | `/reports/export`             | Export report           |

---

## Settings

| Method | Endpoint              | Description               |
| ------ | --------------------- | ------------------------- |
| GET    | `/settings/workspace` | Get workspace settings    |
| PATCH  | `/settings/workspace` | Update workspace settings |
| GET    | `/settings/roles`     | Get role assignments      |
| POST   | `/settings/roles`     | Assign role               |
| DELETE | `/settings/roles/:id` | Remove role               |

---

# 6. UI/UX Flows

---

## 6.1 HR Admin Login to Dashboard

Flow:

1. User membuka web dashboard.
2. User memasukkan email dan password.
3. Sistem melakukan autentikasi.
4. Sistem mengambil role dan workspace aktif.
5. Jika role valid, user masuk ke Overview Dashboard.
6. Jika role tidak punya akses, tampil halaman “Access Denied”.

Acceptance:

* User tanpa role dashboard tidak bisa masuk.
* Session expired diarahkan ke login.
* Setelah login sukses, dashboard menampilkan data sesuai workspace.

---

## 6.2 Overview to Live Attendance Flow

Flow:

1. HR Admin masuk ke Overview Dashboard.
2. HR melihat summary “Late Today”.
3. HR klik card Late.
4. Sistem membuka Live Attendance dengan filter status = Late.
5. HR bisa tambah filter lokasi/divisi.
6. HR klik salah satu karyawan untuk melihat detail attendance.

Acceptance:

* Filter dari dashboard terbawa ke Live Attendance.
* Detail attendance menampilkan data check-in, lokasi, face status, dan geofence status.

---

## 6.3 Live Attendance Filter & Export Flow

Flow:

1. HR membuka Live Attendance.
2. HR memilih date range.
3. HR memilih divisi.
4. HR memilih status.
5. Sistem memperbarui tabel.
6. HR klik Export.
7. Sistem membuat file Excel/CSV sesuai filter.
8. File terunduh.

Acceptance:

* Export sama dengan data yang sedang difilter.
* Export tidak mengambil data di luar akses user.
* Jika data kosong, file tetap berisi header.

---

## 6.4 Add Employee Flow

Flow:

1. Stakeholder/HR membuka Workforce.
2. Klik Add Employee.
3. Isi data karyawan.
4. Pilih department, location, shift, dan role.
5. Klik Save.
6. Sistem membuat user invitation/account.
7. Employee muncul di list.
8. Status face profile masih “Not Registered” sampai karyawan registrasi di mobile app.

Acceptance:

* Email dan employee ID harus unik.
* Karyawan baru tidak bisa check-in jika status belum active.
* Employee muncul di dashboard dan workforce list.

---

## 6.5 Configure Location Flow

Flow:

1. HR membuka Locations.
2. Klik Add Location.
3. Isi nama lokasi dan alamat.
4. Input latitude/longitude atau pilih dari map.
5. Atur radius geofence.
6. Simpan.
7. Lokasi tersedia untuk assignment karyawan.

Acceptance:

* Radius mengikuti batas minimum dan maksimum.
* Lokasi baru bisa dipakai di employee assignment.
* Perubahan lokasi masuk audit log.

---

## 6.6 Approve Leave Request Flow

Flow:

1. HR membuka menu Leave & Permit.
2. HR melihat daftar pengajuan pending.
3. HR membuka detail pengajuan.
4. HR klik Approve atau Reject.
5. Jika approve, status attendance tanggal tersebut menjadi Leave/Permit.
6. Employee mendapatkan status approval di mobile app.

Acceptance:

* HR hanya bisa approve request sesuai scope akses.
* Approval masuk audit log.
* Dashboard summary ikut berubah.

---

# 7. Non-Functional Requirements

## 7.1 Performance

Target performa:

| Area                        | Target                               |
| --------------------------- | ------------------------------------ |
| Initial dashboard load      | < 3 detik                            |
| Filter table attendance     | < 1,5 detik untuk data normal        |
| Export laporan bulanan      | < 10 detik untuk maksimal 5.000 row  |
| Real-time attendance update | Maksimal 10 detik setelah data masuk |
| API p95 response time       | < 500ms untuk endpoint read umum     |
| Lighthouse performance      | Minimal 85 untuk dashboard utama     |

---

## 7.2 Security

Requirement:

1. Semua request menggunakan JWT.
2. JWT diverifikasi di backend/API layer.
3. Middleware wajib mengecek:

   * Authentication
   * Workspace access
   * Role permission
   * Scope divisi/lokasi
4. Token memiliki expiry.
5. Refresh token dikelola oleh auth provider.
6. Password tidak disimpan di database aplikasi.
7. Endpoint sensitif memakai rate limiting.
8. Semua aktivitas penting masuk audit log.
9. Data wajah tidak ditampilkan bebas di dashboard.
10. File export hanya bisa diakses oleh user yang membuat export tersebut.

---

## 7.3 Multi-Tenant Isolation

Requirement:

1. Semua tabel utama wajib memiliki `workspace_id` atau relasi ke workspace.
2. Query data wajib difilter berdasarkan workspace aktif.
3. Supabase RLS digunakan untuk mencegah akses lintas workspace.
4. Backend tetap melakukan permission check walaupun RLS aktif.
5. Tidak boleh ada endpoint yang mengambil data global tanpa filter tenant/workspace.
6. Export juga wajib mengikuti workspace dan role scope.
7. Audit log wajib mencatat workspace_id.

---

## 7.4 Reliability

Requirement:

1. Attendance log tidak boleh hilang.
2. Export gagal harus bisa dicoba ulang.
3. Sistem harus punya error handling untuk data kosong.
4. API harus mengembalikan error code yang konsisten.
5. Offline sync dari mobile harus tetap menyimpan original timestamp.
6. Dashboard tidak boleh mengubah timestamp asli attendance.

---

## 7.5 Responsiveness

Web Dashboard v1 harus:

* Optimal untuk desktop dan laptop.
* Tetap usable di tablet.
* Mobile web dashboard bersifat responsive basic, bukan prioritas utama.
* End User tetap diarahkan menggunakan mobile app, bukan dashboard web.

Breakpoint target:

* Desktop: 1280px ke atas
* Laptop: 1024px ke atas
* Tablet: 768px ke atas
* Mobile: basic layout only

---

## 7.6 Accessibility

Requirement:

1. Semua button penting memiliki label jelas.
2. Warna status tidak boleh menjadi satu-satunya indikator.
3. Form error harus memiliki teks.
4. Table harus bisa dibaca dengan struktur yang rapi.
5. Kontras teks minimal mengikuti standar WCAG dasar.

---

# 8. Tech Stack Decisions

## 8.1 Frontend Web

Decision:

* Next.js App Router
* React
* TypeScript
* Tailwind CSS
* Server Components untuk halaman data-heavy
* Client Components untuk table interaktif, filter, chart, dan form

Alasan:

* App Router mendukung struktur modern berbasis layout.
* Server Components cocok untuk dashboard yang butuh data awal cepat.
* TypeScript membantu menjaga kontrak data.
* Tailwind mempercepat development UI dashboard.
* Next.js cocok untuk role-based dashboard dan protected routes.

---

## 8.2 Backend API

Decision:

* REST API berbasis Node.js/Express atau Next.js Route Handlers.
* Untuk tim kecil, disarankan mulai dari Next.js Route Handlers agar frontend dan backend v1 lebih cepat.
* Jika sistem membesar, business logic dapat dipisah ke service backend Node.js/Express.

Alasan:

* REST API mudah dipakai oleh Flutter mobile dan Next.js web.
* Kontrak endpoint lebih jelas untuk frontend/backend paralel.
* Mudah diuji dengan Postman/Insomnia.

---

## 8.3 Database

Decision:

* Supabase PostgreSQL sebagai database utama.
* RLS digunakan untuk multi-tenant isolation.
* Prisma dapat digunakan sebagai ORM/migration layer jika dibutuhkan.

Alasan:

* Supabase memberi PostgreSQL managed, dashboard database, RLS, storage, dan free tier.
* Prisma sendiri bukan database, melainkan ORM.
* Menggunakan Supabase lebih cocok untuk multi-tenant karena RLS bisa menjadi lapisan keamanan database.
* Prisma tetap berguna untuk type-safe query dan migration, tetapi isolation tetap harus dikunci di database dan backend.

---

## 8.4 Authentication Strategy

Decision:

* Firebase Authentication atau Supabase Auth sebagai auth provider.
* JWT digunakan untuk akses API.
* Backend melakukan verify token dan mengambil role dari database internal.

Alasan:

* Auth provider mengurangi beban membangun sistem login dari nol.
* JWT cocok untuk mobile app dan web dashboard.
* Role tidak hanya bergantung pada auth provider, karena role workspace harus fleksibel dan tersimpan di database aplikasi.

Recommended v1:

* Pilih satu: Firebase Auth atau Supabase Auth.
* Jangan memakai dua auth provider sekaligus untuk v1 kecuali ada alasan kuat.

---

## 8.5 Authorization Strategy

Decision:

* RBAC + scope-based permission.

RBAC:

* Stakeholder
* Support Admin
* End User

Scope:

* Workspace
* Department
* Location

Alasan:

* Role saja tidak cukup karena Support Admin bisa saja hanya mengelola divisi tertentu.
* Scope membuat sistem lebih fleksibel untuk multi-divisi dan multi-cabang.

---

## 8.6 Attendance Validation Strategy

Decision:

* Validasi utama dilakukan dari mobile app dan backend.
* Dashboard hanya menampilkan hasil validasi.

Validasi:

* Face recognition status
* Liveness status
* GPS/geofence status
* Mock location/spoofing status
* Shift status
* Sync status

Alasan:

* Absensi terjadi di perangkat karyawan.
* Dashboard tidak boleh menjadi sumber manipulasi attendance.
* HR hanya memantau, mengoreksi dengan audit, dan mengekspor laporan.

---

# 9. Milestones & Phasing

## Phase 0 — Product & Technical Setup

Target:

* Finalisasi PRD.
* Finalisasi database model.
* Finalisasi API contract.
* Setup repository.
* Setup design system.
* Setup environment.

Deliverables:

* PRD v1.
* ERD awal.
* API contract.
* Wireflow.
* Project structure.
* Auth strategy decision.

---

## Phase 1 — Auth + Workspace Foundation + Overview Dashboard

Fitur:

* Login.
* Middleware auth.
* Role guard.
* Workspace context.
* Layout dashboard.
* Sidebar navigation.
* Overview summary cards.
* Attendance trend dummy/real data.
* Department breakdown.

Deliverables:

* User bisa login.
* User masuk workspace yang benar.
* Dashboard overview tampil sesuai role.

Success Criteria:

* Stakeholder bisa melihat summary workspace.
* Support Admin hanya melihat data sesuai scope.
* Data dummy bisa diganti data API tanpa ubah UI besar.

---

## Phase 2 — Workforce + Locations + Shifts

Fitur:

* Employee list.
* Add/edit employee.
* Employee status.
* Assign department.
* Assign location.
* Assign shift.
* Locations CRUD.
* Shift CRUD.

Deliverables:

* HR bisa mengelola data karyawan.
* HR bisa mengelola lokasi dan shift.
* Data siap dipakai mobile app untuk absensi.

Success Criteria:

* Employee aktif memiliki lokasi dan shift.
* Lokasi punya koordinat dan radius.
* Shift punya jam masuk, jam keluar, dan grace period.

---

## Phase 3 — Live Attendance

Fitur:

* Live Attendance table.
* Filter tanggal.
* Filter status.
* Filter divisi.
* Filter lokasi.
* Attendance detail.
* Status late/present/absent/missing checkout.
* Sync status display.

Deliverables:

* HR bisa memantau kehadiran harian.
* Attendance log dari mobile/API bisa tampil di dashboard.

Success Criteria:

* Data attendance tampil sesuai workspace.
* Filter berjalan.
* Detail log menampilkan waktu, lokasi, face status, dan geofence status.

---

## Phase 4 — Leave/Permit + Reports + Export

Fitur:

* List leave/permit request.
* Approve/reject request.
* Attendance summary report.
* Daily attendance report.
* Export Excel/CSV.
* Empty state dan error state.

Deliverables:

* HR bisa approve izin/cuti.
* HR bisa export laporan absensi.

Success Criteria:

* Approved leave memengaruhi dashboard dan report.
* Export sesuai filter.
* Export tidak bocor data lintas divisi/workspace.

---

## Phase 5 — Settings + Audit Log + Hardening

Fitur:

* Workspace settings.
* WFH mode setting.
* Grace period setting.
* Default geofence setting.
* Role management.
* Audit log.
* Security hardening.
* Performance optimization.

Deliverables:

* Stakeholder bisa mengatur workspace.
* Semua aksi penting tercatat.

Success Criteria:

* Setting berlaku untuk attendance baru.
* Audit log mencatat perubahan role, shift, lokasi, employee, dan setting.
* Middleware role guard stabil.

---

# 10. Open Questions

1. Auth provider final memakai Firebase Auth atau Supabase Auth?
2. Apakah Web Dashboard v1 perlu mendukung Super Admin Platform, atau fokus Workspace HR dulu?
3. Apakah PDF export wajib v1 atau masuk v1.1?
4. Apakah Support Admin bisa check-in/check-out juga, atau hanya End User?
5. Apakah WFH location diset oleh HR atau diajukan karyawan dulu?
6. Apakah approval cuti butuh multi-level approval?
7. Berapa batas maksimal export row untuk v1?
8. Apakah employee import via Excel/CSV dibutuhkan di v1?
9. Apakah attendance adjustment/manual correction dibutuhkan di v1 atau v1.1?
10. Apakah dashboard perlu real-time websocket, atau cukup polling setiap 10 detik?

---

# 11. Recommended MVP Cut

Agar v1 tidak terlalu besar, MVP paling realistis:

1. Auth + Role Guard
2. Overview Dashboard
3. Workforce CRUD
4. Locations
5. Shifts
6. Live Attendance
7. Reports Export CSV/Excel
8. Basic Settings
9. Audit Log minimal

Ditunda ke v1.1:

* PDF export
* Billing
* Support ticket
* Advanced analytics
* Import employee via Excel
* Manual attendance correction workflow lengkap
* Super Admin platform dashboard penuh
