import base64
import binascii
import os
from contextlib import asynccontextmanager
from typing import Literal

import cv2
import numpy as np
from fastapi import FastAPI
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


class QualityResult(BaseModel):
    score: float
    faceCount: int
    brightness: float
    blurScore: float
    poseOk: bool
    faceSizeOk: bool
    obstruction: ObstructionResult


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
    obstruction = ObstructionResult(status="clear")
    if score < QUALITY_MIN_SCORE:
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


@app.post("/v1/face/analyze", response_model=AnalyzeSuccess | AnalyzeReject)
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

