import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_seeded_code_lookup_creates_scan(client):
    vehicle = client.get("/vehicles/main").json()
    response = client.post(
        "/diagnosis/lookup",
        json={"vehicle_id": vehicle["id"], "code": "p0302", "symptoms": "rough idle"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["code"] == "P0302"
    assert data["urgency"] == "high"
    assert "definitely" not in data["diagnosis"]["plain_english_explanation"].lower()
    assert data["diagnosis"]["disclaimer"]


def test_invalid_code_rejected(client):
    response = client.post("/diagnosis/lookup", json={"code": "302"})
    assert response.status_code == 422
