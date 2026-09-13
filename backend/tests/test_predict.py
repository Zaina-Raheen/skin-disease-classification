"""
test_predict.py
----------------
Tests for POST /api/predict

Run with:  pytest tests/test_predict.py -v

These tests exercise the API contract (status codes + JSON shape).
They do NOT test real model accuracy, since the real model isn't wired
in yet — that's covered separately once Member G's final_model.h5 and
predict.py are in place (see predict.py's module docstring).
"""

import io
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from PIL import Image
from app import app


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def _make_test_image(fmt="JPEG", size=(224, 224), color=(120, 60, 60)):
    """Builds a tiny in-memory image so tests don't need a real file on disk."""
    buf = io.BytesIO()
    Image.new("RGB", size, color=color).save(buf, format=fmt)
    buf.seek(0)
    return buf


def test_valid_image_upload_returns_prediction(client):
    img = _make_test_image()
    response = client.post(
        "/api/predict",
        data={"image": (img, "test.jpg")},
        content_type="multipart/form-data",
    )
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert "class" in data["prediction"]
    assert "confidence" in data["prediction"]
    assert "probabilities" in data
    assert "disclaimer" in data


def test_missing_image_returns_400(client):
    response = client.post("/api/predict", data={}, content_type="multipart/form-data")
    assert response.status_code == 400
    data = response.get_json()
    assert data["success"] is False
    assert data["error"] == "No image file provided"


def test_invalid_file_content_returns_400(client):
    fake_file = io.BytesIO(b"this is not an image, just plain text")
    response = client.post(
        "/api/predict",
        data={"image": (fake_file, "fake.jpg")},
        content_type="multipart/form-data",
    )
    assert response.status_code == 400
    data = response.get_json()
    assert data["success"] is False
    assert data["error"] == "Invalid image file"


def test_unsupported_extension_returns_400(client):
    img = _make_test_image()
    response = client.post(
        "/api/predict",
        data={"image": (img, "test.gif")},
        content_type="multipart/form-data",
    )
    assert response.status_code == 400
    data = response.get_json()
    assert data["success"] is False
    assert "extension" in data["error"].lower()


def test_empty_file_returns_400(client):
    empty_file = io.BytesIO(b"")
    response = client.post(
        "/api/predict",
        data={"image": (empty_file, "empty.jpg")},
        content_type="multipart/form-data",
    )
    assert response.status_code == 400
    data = response.get_json()
    assert data["success"] is False


def test_oversized_file_returns_413(client):
    # MAX_CONTENT_LENGTH defaults to 10MB; send something larger.
    huge_file = io.BytesIO(b"0" * (11 * 1024 * 1024))
    response = client.post(
        "/api/predict",
        data={"image": (huge_file, "huge.jpg")},
        content_type="multipart/form-data",
    )
    assert response.status_code == 413
    data = response.get_json()
    assert data["success"] is False


def test_low_confidence_prediction_includes_warning(client, monkeypatch):
    """
    Forces predict_image to return a low-confidence result so we can check
    the /api/predict endpoint correctly flags it as 'uncertain'.
    """
    import app as app_module

    def fake_low_confidence_predict(pil_image):
        return {
            "class": "melanoma",
            "confidence": 0.20,
            "probabilities": {c: 0.20 for c in app_module.CLASS_NAMES},
        }

    monkeypatch.setattr(app_module, "predict_image", fake_low_confidence_predict)

    img = _make_test_image()
    response = client.post(
        "/api/predict",
        data={"image": (img, "test.jpg")},
        content_type="multipart/form-data",
    )
    data = response.get_json()
    assert data["prediction"]["class"] == "uncertain"
    assert "warning" in data


def test_prediction_failure_returns_500(client, monkeypatch):
    import app as app_module

    def fake_broken_predict(pil_image):
        raise RuntimeError("simulated model crash")

    monkeypatch.setattr(app_module, "predict_image", fake_broken_predict)

    img = _make_test_image()
    response = client.post(
        "/api/predict",
        data={"image": (img, "test.jpg")},
        content_type="multipart/form-data",
    )
    assert response.status_code == 500
    data = response.get_json()
    assert data["success"] is False
    assert data["error"] == "Internal server error"
