# 03 — Mobile App Audit (`Apps/app_flutter`)

## A. Dependencies (`pubspec.yaml:10-31`)

**Ada (5 non-trivial):** `flutter_riverpod`, `go_router`, `dio`, `flutter_secure_storage` (token saja), `intl`, `equatable`.

**TIDAK ADA (semua package sensor/device):** geolocator, location, camera, google_mlkit_face_detection, image_picker, file_picker, connectivity_plus, sqflite, drift, hive, flutter_local_notifications, firebase_messaging, flutter_map, google_maps_flutter.

➡️ Konsekuensi: GPS, kamera, face/liveness, peta, offline DB, push notification **secara teknis tidak mungkin berfungsi** — package-nya tidak ada di dependency tree, terlepas dari flag mock.

## B. Per-fitur

| Fitur | Package | Real? | Status | Evidence |
|---|---|---|---|---|
| checkin_prep | n/a | shell UI | UI Only | checkin_prep_screen.dart |
| Validasi lokasi (GPS) | geolocator ABSENT | ❌ | **Simulated** | location_validation_screen.dart:46-63 |
| Verifikasi wajah/liveness | camera/mlkit ABSENT | ❌ | **Simulated** | face_verification_screen.dart:13-15,49-64 |
| Submit check-in/out | dio | ✅ | Functional | checkin_flow_controller.dart:104-105 |
| Sukses screen | dio | ✅ | Functional (baca detail real) | checkin_success_screen.dart |
| Offline sync | connectivity/drift ABSENT | ❌ | **Mock** | sync_controller.dart:32-54 |
| Notifikasi | fcm ABSENT | ❌ (+ backend dead) | Mock/Empty | remote_notification_repository.dart |
| Auth/leave/schedule/history | dio | ✅ remote ada | Partial (mock default) | remote_*.dart |

## C. Bukti simulasi (paling kritis)

**GPS — hardcoded.** `location_validation_screen.dart:46-63`:
```dart
await Future.delayed(1200ms);          // "Simulated GPS fix"
const myLat = -6.20885; const myLng = 106.84575;  // titik kantor
// "Pretend we are 35m away"
setLocation(myLat, myLng);
```
Tidak ada `Geolocator.getCurrentPosition`. Koordinat konstan inilah yang dikirim ke backend di `checkin_flow_controller.dart:104-105`.

**Face/liveness — auto true.** `face_verification_screen.dart`:
- `:13-15` komentar: "Simulated here... Real camera + mlkit lands in Fase 3."
- `:49-57` `Timer.periodic(1400ms)` jalan-jalan 3 ikon statis.
- `:60-64` `_complete()` → `setFaceResult(faceVerified: true, liveness: true)` tanpa syarat.
- "Kamera" hanya `Container` + `Icon` (`:88-105`), tak ada `CameraController`.

**Offline sync — in-memory.** `sync_controller.dart:32-54`: 1 `SyncItem` hardcoded; `syncNow()` flip status via `Future.delayed(1s)`. Tak ada local DB / listener. Tak ada `remote_sync_repository.dart`.

## D. Wiring repository

- **`useMockData` DEFAULT = `true`** (`app_config.dart:15-18`). Keluar kotak, semua repo = mock.
- `providers.dart:27-53`: 5 provider → `Mock*Repository()` saat flag true; → `Remote*Repository()` saat `--dart-define=USE_MOCK_DATA=false`.
- Remote repos **nyata & sudah teruji live sesi ini** (`remote_attendance_repository.dart:24-122` GET/POST ke `/mobile/*`). Jadi lapisan jaringan solid — yang bohong adalah lapisan sensor.

## E. Dampak keamanan
Karena klien selalu mengirim titik kantor yang valid + `faceVerified=true`, walau backend validasi geofence (Haversine), **absensi tetap bisa dipalsukan dari lokasi mana pun** saat remote mode aktif. Wajah sama sekali tidak diverifikasi identitasnya. Ini melanggar anti-spoof PDF 6B.

## F. Rekomendasi (P0 untuk MVP)
1. Tambah `geolocator` + ambil posisi nyata (+ cek `isMocked`/mock-location) → kirim koordinat asli.
2. Tambah `camera` + `google_mlkit_face_detection` untuk liveness (kedip/gerak kepala) nyata; `faceVerified` hanya true bila lolos.
3. Tambah `flutter_map` + `latlong2` untuk peta geofence nyata.
4. Offline: `drift`/`hive` + `connectivity_plus` untuk antrian + auto-sync (P1).
5. Pertimbangkan `useMockData` default **false** untuk build rilis (mock hanya untuk dev).
