# AttendX Face Service

Python FastAPI service for backend-side face analysis.

Responsibilities:

- Decode a base64 face image.
- Detect exactly one face.
- Generate a face embedding using InsightFace/ArcFace.
- Return basic image quality signals.
- Reject unusable images with stable error codes.

This service is intentionally fail-closed. If the model is missing or cannot be
loaded, `/v1/face/analyze` returns `ok=false` instead of producing fake
embeddings.

## Local Run

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 4100
```

## Environment

- `FACE_MODEL_NAME`: InsightFace model pack name. Default: `buffalo_l`.
- `FACE_MODEL_ROOT`: Directory containing InsightFace models. Default: `/models`.
- `FACE_DET_SIZE`: Detector size in `WIDTHxHEIGHT` format. Default: `640x640`.

The model files must be available in `FACE_MODEL_ROOT`. Do not rely on runtime
network downloads in production.

