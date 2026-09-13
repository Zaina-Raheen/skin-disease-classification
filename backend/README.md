# Skin Disease Classification — Backend (Member H)

Flask REST API that sits between the trained model (from Member G) and the
frontend (Members I & J). It accepts an uploaded skin image and returns the
predicted disease class, a confidence score, and per-class probabilities.

## ✅ Current status: real model wired in and verified

`final_model.h5`, `model.h5`, `tuned_model.h5`, both training log CSVs,
`train.py`, and `tune_model.py` were all inspected directly (not guessed)
to confirm the integration:

- **Model in use:** `final_model.h5` — MobileNetV2 (frozen) → GlobalAveragePooling2D
  → Dense(128, relu) → Dropout(0.3) → Dense(7, softmax). Verified byte-for-byte
  identical trained weights to `model.h5` (train.py's raw checkpoint output).
  `tuned_model.h5` (from `tune_model.py`) was also checked — its own
  `tuned_training_logs.csv` shows it peaked at **~66.7% val_accuracy**, slightly
  below the untuned model's **~67.8%**, so it's not used here. Swap `MODEL_PATH`
  if your team decides otherwise.
- **Class order — confirmed, not assumed:** `train.py` loads data with
  `tf.keras.utils.image_dataset_from_directory`, which assigns class indices in
  alphabetical order of subfolder names. The real folders are `akiec, bcc, bkl,
  df, melanoma, nv, vasc` (already alphabetical), so that's the model's true
  output order, index 0–6.
- **Preprocessing — one real bug found and fixed:** the previous version of
  this backend normalized pixels to 0–1 before predicting. `train.py` never
  does that — `image_dataset_from_directory` yields raw 0–255 float pixels, and
  nothing in the model (no `Rescaling` layer, no `preprocess_input()`) rescales
  them. Feeding the real model 0–1 vs 0–255 input was tested directly and gives
  visibly different softmax outputs, so this mattered. `predict.py` now resizes
  to 224×224 and keeps raw 0–255 values, matching training exactly.

A stray uploaded file called `download` was 0 bytes (a failed browser
download) and was ignored — nothing was lost by skipping it.

---

## 1. What this backend does, in plain terms

1. The frontend (React) shows an upload button. The user picks a skin
   photo.
2. The frontend sends that image to `POST /api/predict` as
   `multipart/form-data`.
3. Flask receives the file, checks it's really an image (right extension,
   not empty, not corrupted).
4. The image is resized to 224×224 and its pixel values scaled to 0–1
   (matching Member C's preprocessing step), then handed to the model.
5. The model outputs 7 numbers (one probability per disease class). The
   highest one is the prediction; all 7 are also returned so the frontend
   can build the confidence chart.
6. Flask sends back one clean JSON object every time — same shape whether
   the request succeeded or failed, so the frontend never has to guess.

`GET /api/health` is separate and simple: it just says "the server is up"
and "is a real model loaded, or are we in mock mode". No image needed.

## 2. How the frontend calls this API

```javascript
const formData = new FormData();
formData.append("image", file); // file = the File object from an <input type="file">

const response = await fetch("http://localhost:5000/api/predict", {
  method: "POST",
  body: formData,
  // Do NOT set Content-Type manually - the browser sets the correct
  // multipart boundary automatically when you pass a FormData body.
});

const data = await response.json();
```

`data` will look like one of the JSON shapes documented below.

---

## 3. Project structure

```text
backend/
├── app.py                  # Flask app: routes, CORS, error handlers, config
├── predict.py               # Model loading + inference (currently mock mode)
├── requirements.txt
├── README.md
├── .env.example
├── .gitignore
├── model/
│   └── (put final_model.h5 here once Member G sends it)
├── uploads/                 # scratch space, not committed
├── utils/
│   ├── __init__.py
│   └── preprocessing.py     # image validation
└── tests/
    ├── test_health.py
    └── test_predict.py
```

---

## 4. API documentation

### `GET /api/health`

No parameters. Always returns `200`.

```json
{
  "status": "ok",
  "model_loaded": true,
  "mode": "real"
}
```

### `POST /api/predict`

**Body:** `multipart/form-data` with field `image` (jpg / jpeg / png / webp).

**Success — 200**
```json
{
  "success": true,
  "prediction": {
    "class": "melanoma",
    "confidence": 0.8241
  },
  "probabilities": {
    "akiec": 0.02,
    "bcc": 0.03,
    "bkl": 0.01,
    "df": 0.01,
    "melanoma": 0.8241,
    "nv": 0.05,
    "vasc": 0.0459
  },
  "disclaimer": "This prediction is for educational/research purposes only and is not a medical diagnosis."
}
```
(A `"note"` key only appears if the model file goes missing and the API
silently falls back to mock mode — see the "Mock fallback" section below.)

**Low confidence — 200**
```json
{
  "success": true,
  "prediction": { "class": "uncertain", "confidence": 0.37 },
  "probabilities": { "...": "..." },
  "disclaimer": "...",
  "warning": "The model is not sufficiently confident in this prediction."
}
```

**Missing image — 400**
```json
{ "success": false, "error": "No image file provided" }
```

**Invalid / corrupt image — 400**
```json
{ "success": false, "error": "Invalid image file" }
```

**Unsupported extension — 400**
```json
{ "success": false, "error": "Unsupported file extension. Allowed: jpeg, jpg, png, webp" }
```

**File too large — 413**
```json
{ "success": false, "error": "File too large. Maximum allowed size is 10MB" }
```

**Server error — 500**
```json
{ "success": false, "error": "Internal server error" }
```

---

## 5. Installation

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

> TensorFlow is a large install (a few minutes on a slow connection) — it's
> required now since the real model is wired in. If it's ever missing or
> `model/final_model.h5` isn't found, the API automatically falls back to a
> mock predictor rather than crashing (see `predict.py`'s docstring), and
> flags every response with `"mode": "mock"` so nobody mistakes it for real
> output.

## 6. Running locally

```bash
python app.py
```

Server starts at `http://localhost:5000`. Check it's alive:

```bash
curl http://localhost:5000/api/health
```

## 7. Testing

```bash
pytest tests/ -v
```

Covers: health check, valid upload, missing image, invalid file,
unsupported extension, empty file, oversized file, low-confidence warning,
and simulated model-failure (500).

Manual test with curl:
```bash
curl -X POST http://localhost:5000/api/predict \
  -F "image=@/path/to/some_skin_photo.jpg"
```

## 8. Deployment notes (Render or similar)

- Set `PORT`, `FRONTEND_URL`, `MODEL_PATH`, `CONFIDENCE_THRESHOLD` as
  environment variables on the platform — nothing is hardcoded in the code.
- Start command: `python app.py` (or `gunicorn app:app` for a more
  production-grade server — recommended once you're past the class demo).
- **Model file size**: `final_model.h5` from a MobileNetV2/ResNet50
  transfer-learning model is typically 10–90MB. Most free tiers (Render
  free, etc.) handle that fine, but very large models can slow cold
  starts or hit disk/memory limits — if that happens, the simplest fix is
  switching to a smaller backbone or quantizing the model, not rewriting
  this backend.
- Per your team workflow doc, final deployment target is **Hugging Face
  Spaces** (single link, no CORS split needed) — this Flask app can be
  dropped into a Space as-is; only the run command changes (Spaces expects
  the app to run via its own entrypoint convention, not `python app.py`
  directly — check current HF Spaces docs for Flask/Gradio wrapper
  requirements when Member L gets there).
- Don't use Windows-only paths anywhere — this codebase already uses
  `pathlib`/`os.path`-safe relative paths throughout.

## 9. If Member G sends a real `predict.py`

This backend re-derived the inference logic directly from `train.py` rather
than waiting on Member G's own `predict.py`, since that hadn't arrived. If G
later sends one and it does anything differently — different resize size,
any actual normalization, a different class order — trust G's real script
over this one, since it would reflect the training run directly rather than
a reconstruction of it. If it matches what's here, no change is needed.
