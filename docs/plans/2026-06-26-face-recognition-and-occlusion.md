# AttendX Face Recognition and Face Obstruction Plan

Tanggal: 2026-06-26

## 1. Ringkasan

Tujuan plan ini adalah mengubah validasi wajah AttendX dari liveness-only menjadi verifikasi wajah yang benar:

- Saat daftar wajah, aplikasi menyimpan template/embedding wajah karyawan.
- Saat absen, aplikasi cek apakah wajah yang muncul sama dengan wajah terdaftar.
- Sistem menolak absen jika wajah tidak cocok atau wajah tidak cukup jelas.
- Deteksi gangguan wajah ditambahkan bertahap: kualitas gambar dulu, lalu masker/kacamata gelap/tangan menutup wajah.

Catatan kondisi saat ini:

- Flutter sudah punya layar daftar wajah dan verifikasi wajah.
- Saat daftar wajah, backend baru menandai `faceProfileStatus = Registered`.
- Saat absen, Flutter menjalankan liveness challenge, lalu mengirim `faceVerified = true`.
- Backend sudah punya field opsional `faceMatchScore`, tetapi belum ada pipeline yang menghasilkan skor itu.
- Belum ada face embedding matching 1:1.
- Belum ada deteksi khusus untuk wajah tertutup, masker, kacamata hitam, tangan menutup wajah, atau glare berat.

## 2. Prinsip Arsitektur

Python tidak ditanam langsung ke Flutter atau Next.js. Python dibuat sebagai ML service terpisah:

```text
Flutter Mobile
  -> Backend Express API
    -> Python Face Service
      -> Face model / quality model
```

Alasan:

- Flutter tetap ringan dan tidak membawa runtime Python.
- Backend tetap menjadi decision authority.
- Model bisa diganti, di-scale, dan di-deploy tanpa rebuild APK.
- Audit log dan threshold tetap dikontrol server.

## 3. Scope

### In Scope

- Face enrollment dengan foto referensi.
- Face embedding generation.
- Face matching saat check-in dan check-out.
- Quality gate untuk blur, gelap, terlalu terang, pose buruk, wajah terlalu kecil/besar.
- Deteksi basic obstruction dengan heuristik model face detector.
- Integrasi Python FastAPI service dengan backend Express.
- Penyimpanan embedding dan metadata model.
- UI error Flutter yang jelas saat wajah gagal.
- Test backend untuk pass/fail face match.

### Out of Scope untuk v1

- Anti-spoofing tingkat tinggi seperti 3D depth, infrared, atau device attestation kuat.
- Face recognition offline penuh di Flutter.
- Model training custom dari nol.
- Vector search massal untuk identifikasi banyak orang. Kebutuhan kita adalah 1:1 verification.

## 4. Target Teknologi

### Python Face Service

- Runtime: Python 3.11+
- Framework: FastAPI
- Server: Uvicorn
- Model face recognition: InsightFace / ArcFace ONNX
- Runtime model: ONNX Runtime
- Image processing: OpenCV, NumPy

### Backend

- Express + TypeScript existing service.
- Prisma schema update.
- Env baru: `FACE_SERVICE_URL`, `FACE_MATCH_THRESHOLD`, `FACE_QUALITY_MIN_SCORE`.
- Backend tetap memutuskan final `faceVerified`.

### Flutter

- Tetap pakai package camera dan ML Kit yang sudah ada untuk liveness.
- Tambah still photo capture saat enroll dan setelah liveness selesai.
- Kirim foto sebagai base64 JPEG ke backend.

## 5. Data Model

Disarankan membuat tabel baru, bukan menumpuk semua di `Employee`.

```prisma
model EmployeeFaceProfile {
  id                String   @id @default(cuid())
  employeeId        String   @map("employee_id")
  workspaceId       String   @map("workspace_id")
  embedding         Json
  embeddingModel    String   @map("embedding_model")
  embeddingDim      Int      @map("embedding_dim")
  matchThreshold    Float    @map("match_threshold")
  qualityScore      Float?   @map("quality_score")
  referenceImageKey String?  @map("reference_image_key")
  isActive          Boolean  @default(true) @map("is_active")
  enrolledAt        DateTime @default(now()) @map("enrolled_at")
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  employee Employee @relation(fields: [employeeId], references: [id])
  workspace Workspace @relation(fields: [workspaceId], references: [id])

  @@index([workspaceId])
  @@index([employeeId, isActive])
  @@map("employee_face_profiles")
}
```

Catatan:

- `embedding` v1 bisa JSON array float agar cepat jalan.
- Nanti bisa migrasi ke `pgvector` jika butuh pencarian vektor.
- Simpan `embeddingModel` karena threshold dan skor bisa berubah jika model berubah.
- `referenceImageKey` opsional untuk review HR, tetap di private object storage.

## 6. API Contract Target

### Python Face Service

#### `POST /v1/face/analyze`

Input:

```json
{
  "imageBase64": "...",
  "mode": "enroll | verify"
}
```

Output success:

```json
{
  "ok": true,
  "embedding": [0.01, -0.02],
  "model": "buffalo_l_arcface_onnx",
  "embeddingDim": 512,
  "quality": {
    "score": 0.91,
    "faceCount": 1,
    "brightness": 0.72,
    "blurScore": 0.86,
    "poseOk": true,
    "faceSizeOk": true,
    "obstruction": {
      "status": "clear",
      "reason": null
    }
  }
}
```

Output reject:

```json
{
  "ok": false,
  "reason": "Wajah kurang jelas.",
  "code": "face_blurry"
}
```

### Backend Mobile API

#### `POST /mobile/me/face/enroll`

Request:

```json
{
  "faceImageBase64": "..."
}
```

Behavior:

- Validate image via Python service.
- Reject if quality/obstruction fails.
- Store embedding.
- Set employee `faceProfileStatus = Registered`.
- Optionally upload reference image to private storage.

#### `POST /mobile/check-in` and `POST /mobile/check-out`

Request existing fields stay, but backend no longer trusts `faceVerified`.

New behavior:

- Require `faceImageBase64`.
- Load active face profile.
- Send image to Python service for embedding + quality.
- Compare embedding with stored embedding.
- Derive `faceMatchScore`.
- Call `evaluateFaceLiveness` with server-generated match score.
- Persist score and anomalies in raw log.
- Reject if score below threshold.

## 7. Phase Plan

## Phase 0 - Baseline and Decisions

Goal: lock scope and prevent ambiguous implementation.

Tasks:

- Confirm current enrollment and attendance flows.
- Confirm whether face reference image should be retained for HR review.
- Decide v1 embedding storage: JSON first, pgvector later.
- Decide initial threshold policy:
  - Start target cosine similarity threshold: 0.55 to 0.65.
  - Final value must be calibrated from real device samples.
- Decide deployment shape:
  - Local Docker Compose service for dev.
  - Production container service next to backend.

Deliverable:

- This plan approved.
- Threshold and storage decisions documented in `.env.example`.

Acceptance:

- Team agrees Python runs as backend-side service, not inside Flutter.

## Phase 1 - Stabilize Capture UX

Goal: make capture frames reliable before adding face recognition.

Tasks:

- Keep current liveness challenges: blink and head turn.
- Enroll screen captures a still image after good frames pass.
- Attendance screen captures a still image after liveness completes.
- Compress image to JPEG with reasonable size.
- Add retry UX for:
  - no face
  - multiple faces
  - face too small
  - face too close
  - face not centered
  - low light
- Keep the anti-flicker hint behavior already added to enrollment.

Deliverable:

- Flutter sends actual face photo to enroll and attendance APIs.

Acceptance:

- Manual test can capture one stable face image during enroll.
- Manual test can capture one stable face image during check-in/check-out.
- Bad camera conditions show stable error text, not changing every frame.

## Phase 2 - Python Face Service Proof of Concept

Goal: get reliable embedding generation outside the main backend.

Tasks:

- Create `Apps/face-service`.
- Add FastAPI app.
- Add `/health`.
- Add `/v1/face/analyze`.
- Load ONNX face recognition model at startup.
- Decode base64 safely.
- Detect exactly one face.
- Align/crop face if the selected model needs it.
- Return embedding and quality result.
- Add basic quality metrics:
  - face count
  - face bounding box size
  - brightness
  - contrast
  - blur score
  - pose estimate if available

Deliverable:

- Standalone Python service can generate embedding from sample images.

Acceptance:

- Same person photos return high similarity.
- Different person photos return lower similarity.
- No-face image is rejected.
- Multi-face image is rejected.

## Phase 3 - Database and Backend Enrollment

Goal: make face enrollment real.

Tasks:

- Add `EmployeeFaceProfile` model.
- Add Prisma migration.
- Add env config for face service and threshold.
- Update mobile schema for enroll request to accept `faceImageBase64`.
- Update `enrollFace` service:
  - call Python analyze
  - validate quality
  - store embedding
  - deactivate old active face profiles
  - set `faceProfileStatus = Registered`
- Add backend tests:
  - enroll success
  - enroll rejects no face
  - enroll rejects multiple faces
  - enroll rejects low quality
  - re-enroll deactivates previous profile

Deliverable:

- Face enrollment creates a stored active embedding.

Acceptance:

- After enroll, database has one active face profile for the employee.
- Employee status changes to `Registered`.
- Re-enroll replaces old active profile cleanly.

## Phase 4 - Backend Attendance Face Matching

Goal: backend becomes the authority for face match.

Tasks:

- Update check-in/check-out services to require active face profile.
- If profile missing, reject with "Wajah belum terdaftar."
- Send attendance `faceImageBase64` to face service.
- Compare live embedding against stored embedding.
- Generate `faceMatchScore` server-side.
- Pass score to `evaluateFaceLiveness`.
- Reject if score below threshold.
- Persist:
  - face match score
  - face result
  - quality result summary
  - anomaly code
  - captured face image key if upload succeeds
- Stop trusting client `faceVerified` as final truth.

Deliverable:

- Attendance is rejected when another person's face is used.

Acceptance:

- Same employee face passes.
- Different person's face fails.
- Liveness incomplete fails.
- Missing face profile fails.
- Existing attendance raw logs still record rejected attempts.

## Phase 5 - Flutter Integration

Goal: connect mobile app to the new backend contract.

Tasks:

- Enroll screen:
  - after stable detection, stop stream
  - take picture
  - send `faceImageBase64` to enroll API
  - show quality/mismatch errors from backend
- Attendance verification screen:
  - after liveness passes, take picture
  - submit attendance with face image
  - show backend reject reason
- Update repository contracts and DTOs.
- Add loading states that do not hang if backend rejects.
- Make retry restart camera cleanly.

Deliverable:

- User can enroll face and then check-in with actual face matching.

Acceptance:

- New user cannot absen before enroll.
- User A cannot absen using User B face.
- User can retry after low quality/mismatch without app restart.

## Phase 6 - Face Obstruction Detection v1

Goal: reject common face-obstructed cases with low complexity.

Tasks:

- Add quality/obstruction rules in Python service:
  - face landmarks missing or low confidence
  - extreme dark/bright image
  - severe blur
  - face partially outside frame
  - pose too extreme
  - face area too small
  - face area too large
- Return stable obstruction codes:
  - `face_blurry`
  - `face_too_dark`
  - `face_too_bright`
  - `face_too_small`
  - `face_too_close`
  - `face_not_centered`
  - `face_pose_invalid`
  - `face_partially_hidden`
  - `multiple_faces`
  - `no_face`
- Map backend codes to friendly Indonesian messages.

Deliverable:

- Basic gangguan wajah bisa ditolak tanpa custom model tambahan.

Acceptance:

- Wajah sangat blur ditolak.
- Wajah gelap ditolak.
- Wajah setengah keluar frame ditolak.
- Multiple faces ditolak.

## Phase 7 - Face Obstruction Detection v2

Goal: detect specific objects or occlusions that heuristics cannot reliably catch.

Tasks:

- Evaluate model tambahan:
  - mask detector
  - sunglasses detector
  - hand-over-face detector
  - general occlusion classifier
- Prefer ONNX model so service remains portable.
- Add `obstruction.status`:
  - `clear`
  - `suspected`
  - `blocked`
- Add `obstruction.type`:
  - `mask`
  - `sunglasses`
  - `hand`
  - `heavy_glare`
  - `unknown_occlusion`
- Add threshold config per obstruction type.
- Add test image set.

Deliverable:

- Kacamata hitam, masker, dan tangan menutup wajah dapat ditolak atau ditandai.

Acceptance:

- Masker menutup wajah ditolak.
- Kacamata hitam ditolak atau flagged sesuai policy.
- Kacamata bening normal tidak otomatis ditolak jika wajah tetap cocok.

## Phase 8 - Security, Privacy, and Audit

Goal: make face data handling defensible.

Tasks:

- Treat face embeddings as sensitive biometric data.
- Ensure reference images stay private.
- Do not expose embedding in API response.
- Add audit logs for:
  - face enrollment
  - face re-enrollment
  - face mismatch
  - obstruction rejection
- Rate limit face endpoints.
- Add request size limit for base64 image.
- Add timeout and circuit breaker for face service calls.
- Define fallback behavior when face service is down:
  - recommended: reject attendance with retry message
  - never silently pass as verified
- Add retention policy for reference face captures.

Deliverable:

- Face data is not casually exposed and failure modes are safe.

Acceptance:

- Backend never returns raw embedding.
- Face service timeout does not crash backend.
- Failed/mismatch attempts are visible in audit/raw logs.

## Phase 9 - QA and Calibration

Goal: tune thresholds using real device conditions.

Tasks:

- Test with at least:
  - same person, normal light
  - same person, glasses
  - same person, different angle
  - same person, low light
  - different person
  - printed photo or screen photo
  - multiple people in frame
  - mask
  - sunglasses
  - hand covering mouth/nose
- Record false accept and false reject cases.
- Tune:
  - match threshold
  - blur threshold
  - brightness threshold
  - pose threshold
  - obstruction thresholds
- Add test fixtures where legally/ethically allowed.

Deliverable:

- Calibrated thresholds for AttendX production use.

Acceptance:

- Different person fails reliably.
- Same person with normal glasses passes if face is clear.
- Same person with sunglasses or heavy obstruction is rejected/flagged.
- Error messages are understandable for non-technical users.

## 8. Recommended Implementation Order

1. Phase 0 - approve technical decisions.
2. Phase 2 - build Python service proof of concept.
3. Phase 3 - backend enrollment and embedding storage.
4. Phase 4 - backend attendance face matching.
5. Phase 5 - Flutter integration.
6. Phase 6 - quality and basic obstruction detection.
7. Phase 7 - specific obstruction model.
8. Phase 8 - security hardening.
9. Phase 9 - QA calibration.

Phase 1 can run in parallel with Phase 2 because it is mostly Flutter capture reliability.

## 9. Definition of Done

The feature is considered done when:

- A user must enroll a real face image before attendance.
- The backend stores an active face embedding for the employee.
- During attendance, backend compares live face embedding to stored embedding.
- Attendance fails if the face belongs to a different person.
- Attendance fails if liveness challenge is incomplete.
- Attendance fails if the face image quality is too poor.
- Attendance fails or flags if the face is significantly obstructed.
- Backend logs face match score and rejection reason.
- Flutter shows clear retryable error messages.
- `flutter analyze`, backend tests, and face-service tests pass.

## 10. Main Risks

- False rejects for users with glasses, low light, or older phones.
- Model threshold needs real-world calibration.
- Python service adds deployment complexity.
- Biometric data requires stricter privacy handling.
- Base64 image upload can increase payload size.

Mitigation:

- Start with conservative threshold and collect test samples.
- Keep clear retry UX.
- Keep liveness and face match as separate checks.
- Store only embedding by default; store reference image only if needed for HR review.
- Use private storage and audit access.

