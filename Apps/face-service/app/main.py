import base64
import binascii
import os
import secrets
from contextlib import asynccontextmanager
from typing import Literal

import cv2
import numpy as np
from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    imageBase64: str = Field(min_length=1, max_length=8_000_000)
    mode: Literal["enroll", "verify"]


class AnalyzeReject(BaseModel):
    ok: Literal[False] = False
    reason: str
    code: str


class ObstructionResult(BaseModel):
    status: Literal["clear", "suspected", "blocked"]
    reason: str | None = None


class EyewearResult(BaseModel):
    type: Literal["none", "clear_glasses", "dark_glasses", "suspected", "unknown"]
    confidence: float
    eyeVisibilityScore: float
    blocksEyes: bool


class QualityResult(BaseModel):
    score: float
    faceCount: int
    brightness: float
    blurScore: float
    poseOk: bool
    faceSizeOk: bool
    obstruction: ObstructionResult
    eyewear: EyewearResult


class AnalyzeSuccess(BaseModel):
    ok: Literal[True] = True
    embedding: list[float]
    model: str
    embeddingDim: int
    quality: QualityResult


class HealthResponse(BaseModel):
    status: Literal["ok"]
    ready: bool
    model: str
    modelRoot: str
    error: str | None = None


_face_app = None
_model_error: str | None = None

# Minimum acceptable face-quality score (0..1). Configurable via env so a
# deployment can tune strictness for real phone front-cameras. Used both for the
# obstruction hint and the hard reject in /v1/face/analyze.
QUALITY_MIN_SCORE = float(os.getenv("FACE_QUALITY_MIN_SCORE", "0.45"))
REJECT_DARK_EYEWEAR = os.getenv("FACE_REJECT_DARK_EYEWEAR", "true").lower() == "true"
FACE_SERVICE_API_KEY = os.getenv("FACE_SERVICE_API_KEY", "").strip()


def _extract_bearer_token(authorization: str | None) -> str | None:
    if not authorization:
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return None
    return token.strip()


def require_internal_api_key(
    x_internal_api_key: str | None = Header(default=None),
    authorization: str | None = Header(default=None),
) -> None:
    if not FACE_SERVICE_API_KEY:
        return

    provided = (x_internal_api_key or _extract_bearer_token(authorization) or "").strip()
    if not provided or not secrets.compare_digest(provided, FACE_SERVICE_API_KEY):
        raise HTTPException(status_code=401, detail="Invalid internal face-service credential")


def _parse_det_size(value: str) -> tuple[int, int]:
    try:
        width, height = value.lower().split("x", 1)
        return int(width), int(height)
    except Exception:
        return 640, 640


def _load_face_model() -> None:
    global _face_app, _model_error
    model_name = os.getenv("FACE_MODEL_NAME", "buffalo_l")
    model_root = os.getenv("FACE_MODEL_ROOT", "/models")
    det_size = _parse_det_size(os.getenv("FACE_DET_SIZE", "640x640"))

    try:
        from insightface.app import FaceAnalysis

        app = FaceAnalysis(
            name=model_name,
            root=model_root,
            providers=["CPUExecutionProvider"],
        )
        app.prepare(ctx_id=-1, det_size=det_size)
        _face_app = app
        _model_error = None
    except Exception as exc:
        _face_app = None
        _model_error = str(exc)


@asynccontextmanager
async def lifespan(_: FastAPI):
    _load_face_model()
    yield


app = FastAPI(title="AttendX Face Service", version="0.1.0", lifespan=lifespan)


def _decode_image(image_base64: str) -> np.ndarray | None:
    if "," in image_base64[:80]:
        image_base64 = image_base64.split(",", 1)[1]
    try:
        raw = base64.b64decode(image_base64, validate=True)
    except (binascii.Error, ValueError):
        return None
    arr = np.frombuffer(raw, dtype=np.uint8)
    image = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    return image


def _quality_metrics(image: np.ndarray) -> tuple[float, float]:
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    brightness = float(np.mean(gray) / 255.0)
    laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    # Phone front-cameras + JPEG compression lower the Laplacian variance, so a
    # divisor of 500 was too strict (real selfies scored ~0.3). 150 is a more
    # realistic "in focus" bar while still flagging genuinely blurry shots.
    blur_score = min(1.0, laplacian_var / 150.0)
    return brightness, blur_score


def _quality_score(
    brightness: float,
    blur_score: float,
    face_size_ok: bool,
    pose_ok: bool,
) -> float:
    if brightness < 0.18:
        brightness_score = brightness / 0.18
    elif brightness > 0.92:
        brightness_score = max(0.0, (1.0 - brightness) / 0.08)
    else:
        brightness_score = 1.0

    # Soft penalties (not hard zeros) so a slightly small or slightly angled
    # face — or a face with glasses — still clears a reasonable threshold.
    size_score = 1.0 if face_size_ok else 0.55
    pose_score = 1.0 if pose_ok else 0.6
    return float(max(0.0, min(1.0, min(brightness_score, blur_score, size_score, pose_score))))


def _clamp01(value: float) -> float:
    return float(max(0.0, min(1.0, value)))


def _eye_patch(
    gray: np.ndarray,
    center: np.ndarray,
    half_width: int,
    half_height: int,
) -> np.ndarray | None:
    height, width = gray.shape[:2]
    cx, cy = int(center[0]), int(center[1])
    x1, x2 = max(0, cx - half_width), min(width, cx + half_width)
    y1, y2 = max(0, cy - half_height), min(height, cy + half_height)
    if x2 - x1 < 4 or y2 - y1 < 4:
        return None
    return gray[y1:y2, x1:x2]


def _analyze_eyewear(image: np.ndarray, face) -> EyewearResult:
    """Estimate eye obstruction while keeping ordinary clear glasses allowed."""
    landmarks = getattr(face, "kps", None)
    if landmarks is None or len(landmarks) < 2:
        return EyewearResult(
            type="unknown",
            confidence=0.0,
            eyeVisibilityScore=0.5,
            blocksEyes=False,
        )

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    x1, y1, x2, y2 = [int(round(float(v))) for v in face.bbox]
    height, width = gray.shape[:2]
    x1, x2 = max(0, x1), min(width, x2)
    y1, y2 = max(0, y1), min(height, y2)
    face_crop = gray[y1:y2, x1:x2]
    if face_crop.size == 0:
        return EyewearResult(
            type="unknown",
            confidence=0.0,
            eyeVisibilityScore=0.5,
            blocksEyes=False,
        )

    eyes = np.asarray(landmarks[:2], dtype=np.float32)
    eye_distance = float(np.linalg.norm(eyes[0] - eyes[1]))
    if eye_distance < 8:
        return EyewearResult(
            type="unknown",
            confidence=0.0,
            eyeVisibilityScore=0.5,
            blocksEyes=False,
        )

    half_width = max(5, int(eye_distance * 0.28))
    half_height = max(4, int(eye_distance * 0.18))
    face_brightness = max(1.0, float(np.mean(face_crop)))
    dark_threshold = max(24.0, min(72.0, face_brightness * 0.48))

    brightness_ratios: list[float] = []
    dark_fractions: list[float] = []
    edge_densities: list[float] = []
    for eye in eyes:
        patch = _eye_patch(gray, eye, half_width, half_height)
        if patch is None or patch.size == 0:
            continue
        brightness_ratios.append(float(np.mean(patch)) / face_brightness)
        dark_fractions.append(float(np.mean(patch < dark_threshold)))
        edges = cv2.Canny(patch, 50, 130)
        edge_densities.append(float(np.mean(edges > 0)))

    if len(brightness_ratios) != 2:
        return EyewearResult(
            type="unknown",
            confidence=0.0,
            eyeVisibilityScore=0.5,
            blocksEyes=False,
        )

    mean_ratio = float(np.mean(brightness_ratios))
    mean_dark = float(np.mean(dark_fractions))
    mean_edges = float(np.mean(edge_densities))
    darkness_score = _clamp01((0.72 - mean_ratio) / 0.38)
    coverage_score = _clamp01((mean_dark - 0.18) / 0.52)
    dark_glasses_score = _clamp01(0.62 * darkness_score + 0.38 * coverage_score)
    eye_visibility = _clamp01(1.0 - dark_glasses_score)

    if dark_glasses_score >= 0.88 and min(dark_fractions) >= 0.42:
        return EyewearResult(
            type="dark_glasses",
            confidence=round(dark_glasses_score, 4),
            eyeVisibilityScore=round(eye_visibility, 4),
            blocksEyes=True,
        )
    if dark_glasses_score >= 0.58:
        return EyewearResult(
            type="suspected",
            confidence=round(dark_glasses_score, 4),
            eyeVisibilityScore=round(eye_visibility, 4),
            blocksEyes=False,
        )

    # Frame edges with a visible, non-dark eye area suggest ordinary glasses.
    if mean_edges >= 0.15 and mean_ratio >= 0.58:
        frame_score = _clamp01((mean_edges - 0.12) / 0.20)
        return EyewearResult(
            type="clear_glasses",
            confidence=round(frame_score, 4),
            eyeVisibilityScore=round(eye_visibility, 4),
            blocksEyes=False,
        )

    return EyewearResult(
        type="none",
        confidence=round(_clamp01(1.0 - max(dark_glasses_score, mean_edges)), 4),
        eyeVisibilityScore=round(eye_visibility, 4),
        blocksEyes=False,
    )


def _face_quality(image: np.ndarray, face) -> QualityResult:
    height, width = image.shape[:2]
    brightness, blur_score = _quality_metrics(image)

    x1, y1, x2, y2 = [float(v) for v in face.bbox]
    face_width_ratio = max(0.0, (x2 - x1) / float(width))
    face_height_ratio = max(0.0, (y2 - y1) / float(height))
    face_size_ok = 0.18 <= face_width_ratio <= 0.82 and 0.18 <= face_height_ratio <= 0.90

    pose = getattr(face, "pose", None)
    if pose is None:
        pose_ok = True
    else:
        yaw, pitch, roll = [abs(float(v)) for v in pose[:3]]
        pose_ok = yaw <= 25 and pitch <= 25 and roll <= 25

    score = _quality_score(brightness, blur_score, face_size_ok, pose_ok)
    eyewear = _analyze_eyewear(image, face)
    obstruction = ObstructionResult(status="clear")
    if eyewear.blocksEyes:
        obstruction = ObstructionResult(
            status="blocked",
            reason="Area mata tertutup atau menggunakan kacamata sangat gelap.",
        )
    elif eyewear.type == "suspected":
        obstruction = ObstructionResult(
            status="suspected",
            reason="Area mata kurang terlihat jelas. Pastikan tidak tertutup bayangan atau kacamata gelap.",
        )
    elif score < QUALITY_MIN_SCORE:
        obstruction = ObstructionResult(
            status="suspected",
            reason="Wajah kurang jelas atau sebagian tertutup.",
        )

    return QualityResult(
        score=score,
        faceCount=1,
        brightness=round(brightness, 4),
        blurScore=round(blur_score, 4),
        poseOk=pose_ok,
        faceSizeOk=face_size_ok,
        obstruction=obstruction,
        eyewear=eyewear,
    )


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        ready=_face_app is not None,
        model=os.getenv("FACE_MODEL_NAME", "buffalo_l"),
        modelRoot=os.getenv("FACE_MODEL_ROOT", "/models"),
        error=_model_error,
    )


@app.post(
    "/v1/face/analyze",
    response_model=AnalyzeSuccess | AnalyzeReject,
    dependencies=[Depends(require_internal_api_key)],
)
def analyze_face(payload: AnalyzeRequest) -> AnalyzeSuccess | AnalyzeReject:
    if _face_app is None:
        return AnalyzeReject(
            reason="Model verifikasi wajah belum tersedia di face service.",
            code="face_service_unconfigured",
        )

    image = _decode_image(payload.imageBase64)
    if image is None:
        return AnalyzeReject(reason="Foto wajah tidak valid.", code="invalid_image")

    faces = _face_app.get(image)
    if len(faces) == 0:
        return AnalyzeReject(reason="Wajah tidak terdeteksi.", code="no_face")
    if len(faces) > 1:
        return AnalyzeReject(reason="Pastikan hanya ada satu wajah.", code="multiple_faces")

    face = faces[0]
    quality = _face_quality(image, face)
    if REJECT_DARK_EYEWEAR and quality.eyewear.blocksEyes:
        return AnalyzeReject(
            reason="Lepaskan sunglasses atau pastikan area mata terlihat jelas.",
            code="eye_area_blocked",
        )
    if quality.score < QUALITY_MIN_SCORE:
        # Diagnostic: show which metric pulled the score down (stdout → docker logs).
        print(
            f"[face] reject quality.score={quality.score} < {QUALITY_MIN_SCORE} "
            f"brightness={quality.brightness} blur={quality.blurScore} "
            f"faceSizeOk={quality.faceSizeOk} poseOk={quality.poseOk} mode={payload.mode}",
            flush=True,
        )
        return AnalyzeReject(
            reason=quality.obstruction.reason or "Kualitas foto wajah kurang jelas.",
            code="face_quality_low",
        )

    embedding = getattr(face, "normed_embedding", None)
    if embedding is None:
        embedding = getattr(face, "embedding", None)
    if embedding is None:
        return AnalyzeReject(
            reason="Embedding wajah tidak dapat dibuat.",
            code="embedding_failed",
        )

    embedding_list = np.asarray(embedding, dtype=np.float32).tolist()
    return AnalyzeSuccess(
        embedding=embedding_list,
        model=os.getenv("FACE_MODEL_NAME", "buffalo_l"),
        embeddingDim=len(embedding_list),
        quality=quality,
    )
