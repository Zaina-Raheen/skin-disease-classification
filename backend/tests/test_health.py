"""
test_health.py
---------------
Tests for GET /api/health

Run with:  pytest tests/test_health.py -v
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from app import app


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_health_returns_200(client):
    response = client.get("/api/health")
    assert response.status_code == 200


def test_health_response_shape(client):
    response = client.get("/api/health")
    data = response.get_json()
    assert "status" in data
    assert data["status"] == "ok"
    assert "model_loaded" in data
    assert isinstance(data["model_loaded"], bool)


def test_health_does_not_require_image(client):
    # Just calling it with no body/params at all should work fine.
    response = client.get("/api/health")
    assert response.status_code == 200
