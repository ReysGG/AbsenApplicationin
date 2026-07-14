# AttendX Face Service

Python FastAPI service for backend-side face analysis.

Responsibilities:

- Decode a base64 face image.
- Detect exactly one face.
- Generate a face embedding using InsightFace/ArcFace.
- Return basic image quality signals.
- Report conservative eyewear and eye-visibility signals.
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
- `FACE_SERVICE_API_KEY`: Optional internal credential for `/v1/face/analyze`.
  Set this in Docker/production and have the backend send it via
  `x-internal-api-key`. Leave empty only for isolated local development.
- `FACE_REJECT_DARK_EYEWEAR`: Reject a strong bilateral dark-eye signal, such
  as sunglasses. Default: `true`. Ordinary clear glasses remain allowed and
  are returned as an informational `quality.eyewear` attribute.

The eyewear signal is deliberately conservative. It uses InsightFace eye
landmarks plus eye-region brightness and edge information. It is not presented
as a medical or demographic classifier and must not be used for identity; the
ArcFace embedding remains the identity signal.

## Model setup

InsightFace expects the model pack at `FACE_MODEL_ROOT/models/<FACE_MODEL_NAME>/`
(e.g. `/models/models/buffalo_l/*.onnx`). With the Docker stack, `/models` is a
writable volume mapped to the host `./models/face`.

Two ways to provide the model:

1. **Auto-download (default).** On first start, if the folder is empty and the
   container has internet access, InsightFace downloads the pack automatically.
   The first `/v1/face/analyze` call may be slow while it downloads (~280MB).
   `GET /health` reports `ready:false` until the model is loaded.

2. **Pre-seed manually (no runtime network needed).** Recommended for
   production / air-gapped servers. Place the `.onnx` files yourself, then
   restart the service:

   ```bash
   # On the host, relative to docker-compose.yml:
   TARGET=./models/face/models/buffalo_l
   mkdir -p "$TARGET"
   curl -fL -o /tmp/buffalo_l.zip \
     https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip
   # no unzip? use python:
   python3 -c "import zipfile;zipfile.ZipFile('/tmp/buffalo_l.zip').extractall('/tmp/blz')"
   find /tmp/blz -name '*.onnx' -exec cp -f {} "$TARGET"/ \;
   docker compose restart face-service
   # verify inside the internal container network:
   docker compose exec face-service python -c "import urllib.request;print(urllib.request.urlopen('http://127.0.0.1:4100/health').read().decode())"
   ```

   Expected files in `buffalo_l/`: `det_10g.onnx`, `w600k_r50.onnx`,
   `genderage.onnx`, `2d106det.onnx`, `1k3d68.onnx`.

Check readiness any time with `GET /health` → `{"ready":true,"error":null}`.
