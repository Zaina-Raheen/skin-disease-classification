"""
app.py
------
Flask backend for the Skin Disease Classification project (Member H's part
of the pipeline: G -> H -> I/J).

WHAT THIS FILE DOES
    1. Creates the Flask app and configures it from environment variables
       (.env file) — allowed frontend origin, max upload size, confidence
       threshold, model path.
    2. Loads the trained model exactly ONCE, when the server starts
       (see predict.py -> load_model()), not on every request.
    3. Exposes two endpoints:
         GET  /api/health   -> {"status": "ok", "model_loaded": true/false}
         POST /api/predict  -> runs an uploaded image through the model
    4. Validates every uploaded image before it ever reaches the model.
    5. Returns clean, consistent JSON for both success and error cases,
       and converts Flask's default HTML error pages into JSON.

HOW THE FRONTEND TALKS TO THIS SERVER
    The frontend sends a POST request to /api/predict with the image as
    multipart/form-data under the field name "image". See the fetch()
    example at the bottom of README.md.

CURRENT STATUS: MOCK MODEL MODE
    predict.py currently cannot find a real final_model.h5, so it runs a
    mock predictor. Every response below is 100% real code and a real
    HTTP flow — only the numbers coming out of the "model" are fake until
    Member G's real predict.py + final_model.h5 are dropped in. See the
    big comment block at the top of predict.py for exactly what to swap.
"""

import os
import logging
from pathlib import Path

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.exceptions import RequestEntityTooLarge

from predict import load_model, predict_image, CLASS_NAMES, MODEL_STATUS
from utils.preprocessing import validate_upload, ALLOWED_EXTENSIONS

# ---------------------------------------------------------------------------
# 1. Load configuration from .env
# ---------------------------------------------------------------------------
load_dotenv()

MODEL_PATH = os.environ.get("MODEL_PATH", "model/final_model.h5")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")
PORT = int(os.environ.get("PORT", 5000))
MAX_CONTENT_LENGTH = int(os.environ.get("MAX_CONTENT_LENGTH", 10 * 1024 * 1024))  # 10 MB
CONFIDENCE_THRESHOLD = float(os.environ.get("CONFIDENCE_THRESHOLD", 0.65))

# ---------------------------------------------------------------------------
# 2. Logging setup (prints to terminal, never logs raw image bytes)
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("skin-disease-backend")

# ---------------------------------------------------------------------------
# 3. Create Flask app
# ---------------------------------------------------------------------------
app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH

# Allow both configured origins used across the team (Vite default 5173,
# CRA default 3000). Keep this list driven by env var, not hardcoded, in
# production.
allowed_origins = [FRONTEND_URL, "http://localhost:3000", "http://localhost:5173"]
CORS(app, resources={r"/api/*": {"origins": allowed_origins}})

# ---------------------------------------------------------------------------
# 4. Load the model ONCE at server startup
# ---------------------------------------------------------------------------
model = load_model(MODEL_PATH)
logger.info(f"Model status: {MODEL_STATUS['mode']} (path checked: {MODEL_PATH})")

# ---------------------------------------------------------------------------
# 5. Routes
# ---------------------------------------------------------------------------


@app.route("/api/health", methods=["GET"])
def health():
    """Simple liveness check. Does NOT require an image."""
    return jsonify({
        "status": "ok",
        "model_loaded": MODEL_STATUS["mode"] == "real",
        "mode": MODEL_STATUS["mode"],  # "real" or "mock"
        "supported_classes": CLASS_NAMES,
    }), 200


@app.route("/api/predict", methods=["POST"])
def predict():
    """
    Accepts multipart/form-data with field 'image'.
    Pipeline: receive -> validate -> preprocess -> predict -> respond.
    """
    logger.info("Prediction request received")

    # --- 1. Was a file provided at all? ---
    if "image" not in request.files or request.files["image"].filename == "":
        logger.error("Prediction failed: no image file provided")
        return jsonify({"success": False, "error": "No image file provided"}), 400

    file = request.files["image"]

    # --- 2. Validate extension + that it's actually a readable image ---
    is_valid, error_message, pil_image = validate_upload(file)
    if not is_valid:
        logger.error(f"Prediction failed: {error_message}")
        return jsonify({"success": False, "error": error_message}), 400

    # --- 3. Run inference ---
    try:
        result = predict_image(pil_image)
    except Exception:
        logger.exception("Prediction failed: internal error during inference")
        return jsonify({"success": False, "error": "Internal server error"}), 500

    predicted_class = result["class"]
    confidence = result["confidence"]
    probabilities = result["probabilities"]
    is_uncertain = result.get("is_uncertain", False)
    warning = result.get("warning")

    response = {
        "success": True,
        "prediction": {
            "class": "uncertain" if is_uncertain else predicted_class,
            "confidence": round(confidence, 4),
            "raw_class": predicted_class,
        },
        "probabilities": {k: round(v, 4) for k, v in probabilities.items()},
        "is_uncertain": is_uncertain,
        "supported_classes": CLASS_NAMES,
        "disclaimer": "This prediction is for educational/research purposes only and is not a medical diagnosis.",
    }

    # --- 4. Low-confidence guardrail ---
    if warning or is_uncertain or confidence < CONFIDENCE_THRESHOLD:
        response["warning"] = warning or (
            "The model is not sufficiently confident in this prediction (confidence < 65%). "
            "Please ensure the lesion is one of the 7 supported categories."
        )

    if MODEL_STATUS["mode"] == "mock":
        response["note"] = (
            "Running in MOCK mode: final_model.h5 / predict.py from Member G "
            "have not been added yet, so this prediction is simulated, not real."
        )

    logger.info(f"Prediction completed: class={predicted_class}, confidence={confidence:.4f}, is_uncertain={is_uncertain}")
    return jsonify(response), 200


# ---------------------------------------------------------------------------
# 6. Error handlers -> always return JSON, never Flask's default HTML page
# ---------------------------------------------------------------------------


@app.errorhandler(400)
def bad_request(e):
    return jsonify({"success": False, "error": "Bad request"}), 400


@app.errorhandler(404)
def not_found(e):
    return jsonify({"success": False, "error": "Endpoint not found"}), 404


@app.errorhandler(413)
@app.errorhandler(RequestEntityTooLarge)
def too_large(e):
    logger.error("Prediction failed: uploaded file exceeded max size")
    return jsonify({
        "success": False,
        "error": f"File too large. Maximum allowed size is {MAX_CONTENT_LENGTH // (1024 * 1024)}MB",
    }), 413


@app.errorhandler(500)
def internal_error(e):
    logger.exception("Internal server error")
    return jsonify({"success": False, "error": "Internal server error"}), 500


# ---------------------------------------------------------------------------
# 7. Local dev entrypoint
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    logger.info("Server started")
    # host="0.0.0.0" so it's reachable if teammates test from another
    # machine on the same network, and so it works unmodified on most
    # cloud platforms (Render, etc.) which inject PORT via env var.
    app.run(host="0.0.0.0", port=PORT, debug=True)
