"""
predict.py
----------
Inference pipeline for the Skin Disease Classification model.

============================================================================
 STATUS: REAL MODEL WIRED IN — verified against train.py / tune_model.py
============================================================================
final_model.h5, model.h5, tuned_model.h5, training_logs.csv,
tuned_training_logs.csv, train.py and tune_model.py were provided and
inspected directly (architecture read from the .h5 files, preprocessing
read from the actual training scripts). Two things this backend was
GUESSING at before are now confirmed or corrected:

1. CLASS_NAMES (below) is CONFIRMED, not assumed. train.py loads data with
   `tf.keras.utils.image_dataset_from_directory`, which — like
   flow_from_directory — assigns class indices in alphabetical order of
   the subfolder names. The augmented_train/ folders are exactly:
   akiec, bcc, bkl, df, melanoma, nv, vasc (already alphabetical), so the
   model's 7 output neurons map to that order, index 0 to 6.

2. PREPROCESSING WAS WRONG AND HAS BEEN FIXED. This file used to divide
   pixel values by 255 (0-1 range) before predicting. But train.py never
   does that: `image_dataset_from_directory` returns raw float32 pixels
   in the 0-255 range, and train.py feeds that straight into MobileNetV2
   with no Rescaling layer and no `preprocess_input()` call. Verified
   empirically too — feeding the real final_model.h5 a 0-1 normalized
   image vs. a 0-255 image produces very different softmax outputs, so
   this isn't a cosmetic detail. preprocess_image() below now matches
   training exactly: resize to 224x224, keep 0-255 float32, no division.

WHICH MODEL FILE IS ACTUALLY USED
    Three model files were provided:
      - model.h5        <- direct checkpoint output of train.py
      - final_model.h5  <- byte-for-byte SAME trained weights as model.h5
                            (verified by comparing the dense_1 kernel
                            arrays directly); this is the name your team
                            workflow expects Member F to hand to G/H, so
                            it's the one wired in below.
      - tuned_model.h5   <- from tune_model.py (adds built-in augmentation
                            layers + a 256-unit head). Its own
                            tuned_training_logs.csv shows it peaked at
                            ~66.7% val_accuracy vs. ~67.8% for the
                            untuned model, so it did NOT outperform the
                            original — that's likely why F shipped
                            final_model.h5 rather than the tuned version.
                            If your team later prefers the tuned model,
                            swap MODEL_PATH and note it also needs no
                            preprocessing change (same raw 0-255 pipeline).

If Member G later sends an actual predict.py with different logic than
what's here, prefer G's real code over this file's re-derivation.
"""

import os
import hashlib
import logging
from pathlib import Path

import numpy as np
from PIL import Image

logger = logging.getLogger("skin-disease-backend")

# ---------------------------------------------------------------------------
# Class names — CONFIRMED from train.py's use of image_dataset_from_directory
# (alphabetical folder order) + the real augmented_train/ folder names.
# ---------------------------------------------------------------------------
CLASS_NAMES = ["akiec", "bcc", "bkl", "df", "melanoma", "nv", "vasc"]

# Resize target — matches train.py's IMAGE_SIZE = (224, 224).
IMAGE_SIZE = (224, 224)

# Shared mutable status dict so app.py can read whether we're in real or
# mock mode without re-checking the filesystem on every request.
MODEL_STATUS = {"mode": "mock"}

_model = None  # holds the loaded Keras model when in "real" mode


def load_model(model_path: str):
    """
    Loads the trained model ONCE at server startup.

    If model_path doesn't exist, we deliberately do NOT crash the server —
    we fall back to mock mode so the rest of the API stays testable while
    the real model is still on its way from Member G.
    """
    global _model

    path = Path(model_path)
    if not path.exists():
        logger.warning(
            f"final_model.h5 not found at '{model_path}'. "
            "Starting in MOCK mode. Drop the real model file there and "
            "restart the server once it's available."
        )
        MODEL_STATUS["mode"] = "mock"
        return None

    try:
        # Imported lazily so the whole app doesn't hard-require tensorflow
        # to even start up while we're still in mock mode (tensorflow is a
        # heavy dependency and slow to import).
        import tensorflow as tf

        _model = tf.keras.models.load_model(path)
        MODEL_STATUS["mode"] = "real"
        logger.info("Model loaded successfully")
        return _model
    except Exception:
        logger.exception(f"Failed to load model at '{model_path}'. Falling back to MOCK mode.")
        MODEL_STATUS["mode"] = "mock"
        return None


def preprocess_image(pil_image: Image.Image) -> np.ndarray:
    """
    Resize to 224x224 and add the batch dimension Keras expects:
    (1, 224, 224, 3).

    IMPORTANT: pixel values are kept in the raw 0-255 range on purpose —
    this matches train.py exactly, which uses
    tf.keras.utils.image_dataset_from_directory with no Rescaling layer
    and no preprocess_input() call. Do NOT divide by 255 here; that was
    tried and produces materially different (wrong) predictions from this
    specific model, since the model's learned weights expect the same
    scale it was trained on.

    Bilinear resizing is used to match image_dataset_from_directory's
    default interpolation.
    """
    image = pil_image.convert("RGB").resize(IMAGE_SIZE, resample=Image.BILINEAR)
    array = np.array(image, dtype=np.float32)  # deliberately NOT / 255.0
    return np.expand_dims(array, axis=0)


def _mock_probabilities(pil_image: Image.Image) -> np.ndarray:
    """
    Produces a fake-but-deterministic probability distribution over
    CLASS_NAMES, seeded from the image bytes so the same image always
    gets the same mock result (useful for testing the frontend).
    NOT a real prediction. Only used when no real model is loaded.
    """
    image = pil_image.convert("RGB").resize((32, 32))
    digest = hashlib.sha256(np.array(image).tobytes()).digest()
    seed = int.from_bytes(digest[:4], "big")
    rng = np.random.default_rng(seed)

    raw = rng.dirichlet(np.ones(len(CLASS_NAMES)) * 0.6)  # skewed, so one class tends to dominate
    return raw


# Confidence & Out-of-Domain (OOD) Guardrail Thresholds
CONFIDENCE_THRESHOLD = 0.65
MARGIN_THRESHOLD = 0.20


def predict_image(pil_image: Image.Image) -> dict:
    """
    Runs a single PIL image through the model (real or mock) and returns:
        {
            "class": str,
            "confidence": float,
            "probabilities": {class_name: float, ...},
            "is_uncertain": bool,
            "warning": str or None,
            "supported_classes": list[str]
        }
    """
    if MODEL_STATUS["mode"] == "real" and _model is not None:
        batch = preprocess_image(pil_image)
        raw_predictions = _model.predict(batch, verbose=0)[0]
    else:
        raw_predictions = _mock_probabilities(pil_image)

    sorted_indices = np.argsort(raw_predictions)[::-1]
    predicted_index = int(sorted_indices[0])
    second_index = int(sorted_indices[1])

    confidence = float(raw_predictions[predicted_index])
    second_confidence = float(raw_predictions[second_index])
    margin = confidence - second_confidence

    probabilities = {name: float(p) for name, p in zip(CLASS_NAMES, raw_predictions)}

    # Determine if image is Out-of-Domain (OOD) or low confidence (e.g. Vitiligo/Eczema)
    is_uncertain = confidence < CONFIDENCE_THRESHOLD or margin < MARGIN_THRESHOLD
    warning = None

    if is_uncertain:
        warning = (
            f"Low confidence ({confidence * 100:.1f}%). This image may be out-of-domain "
            f"(e.g., Vitiligo, Eczema, Acne, or poor lighting) which is outside the 7 trained categories "
            f"({', '.join(CLASS_NAMES)}). Please consult a medical professional."
        )

    return {
        "class": CLASS_NAMES[predicted_index],
        "confidence": confidence,
        "probabilities": probabilities,
        "is_uncertain": is_uncertain,
        "warning": warning,
        "supported_classes": CLASS_NAMES,
    }

