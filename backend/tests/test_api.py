import atexit
import os
import tempfile

test_db = tempfile.NamedTemporaryFile(prefix="pitwise-test-", suffix=".db", delete=False)
test_db.close()


def cleanup_test_db() -> None:
    try:
        if os.path.exists(test_db.name):
            os.unlink(test_db.name)
    except OSError:
        pass


atexit.register(cleanup_test_db)

os.environ["APP_ENV"] = "test"
os.environ["DATABASE_URL"] = f"sqlite:///{test_db.name}"
os.environ["AUTO_CREATE_TABLES"] = "true"
os.environ["SEED_DATABASE_ON_STARTUP"] = "true"
os.environ["SEED_DEMO_DATA"] = "true"

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.config import Settings
from app.main import app

CLIENT_HEADERS = {"X-Pitwise-Client-Id": "test-client-12345"}
OTHER_CLIENT_HEADERS = {"X-Pitwise-Client-Id": "other-client-12345"}


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_database_health_check(client):
    response = client.get("/health/db")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "available"}


def test_seeded_code_lookup_creates_scan(client):
    vehicle = client.post(
        "/vehicles",
        headers=CLIENT_HEADERS,
        json={"make": "Toyota", "model": "Camry", "year": 2017, "engine": "2.5L I4", "mileage": 86300},
    ).json()
    response = client.post(
        "/diagnosis/lookup",
        headers=CLIENT_HEADERS,
        json={"vehicle_id": vehicle["id"], "code": "p0302", "symptoms": "rough idle"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["code"] == "P0302"
    assert data["urgency"] == "high"
    assert "definitely" not in data["diagnosis"]["plain_english_explanation"].lower()
    assert data["diagnosis"]["disclaimer"]


def test_invalid_code_rejected(client):
    response = client.post("/diagnosis/lookup", headers=CLIENT_HEADERS, json={"code": "302"})
    assert response.status_code == 422


def test_lookup_rejects_vehicle_from_another_user(client):
    other_vehicle = client.post(
        "/vehicles",
        headers=OTHER_CLIENT_HEADERS,
        json={"make": "Ford", "model": "Escape", "year": 2020, "engine": None, "mileage": None},
    ).json()

    response = client.post(
        "/diagnosis/lookup",
        headers=CLIENT_HEADERS,
        json={"vehicle_id": other_vehicle["id"], "code": "P0420"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Vehicle not found"


def test_user_data_isolation(client):
    first_vehicle = client.post(
        "/vehicles",
        headers=CLIENT_HEADERS,
        json={"make": "Honda", "model": "Civic", "year": 2018, "engine": None, "mileage": None},
    ).json()
    second_vehicle = client.post(
        "/vehicles",
        headers=OTHER_CLIENT_HEADERS,
        json={"make": "Ford", "model": "Escape", "year": 2020, "engine": None, "mileage": None},
    ).json()

    client.post("/diagnosis/lookup", headers=CLIENT_HEADERS, json={"vehicle_id": first_vehicle["id"], "code": "P0420"})
    client.post("/diagnosis/lookup", headers=OTHER_CLIENT_HEADERS, json={"vehicle_id": second_vehicle["id"], "code": "P0171"})

    first_scans = client.get("/scans", headers=CLIENT_HEADERS).json()
    second_scans = client.get("/scans", headers=OTHER_CLIENT_HEADERS).json()

    assert {scan["user_id"] for scan in first_scans} == {first_vehicle["user_id"]}
    assert {scan["user_id"] for scan in second_scans} == {second_vehicle["user_id"]}
    assert first_vehicle["user_id"] != second_vehicle["user_id"]


def test_delete_my_data_removes_only_current_user(client):
    first_vehicle = client.post(
        "/vehicles",
        headers={"X-Pitwise-Client-Id": "delete-client-12345"},
        json={"make": "Mazda", "model": "3", "year": 2019, "engine": None, "mileage": None},
    ).json()
    second_vehicle = client.post(
        "/vehicles",
        headers={"X-Pitwise-Client-Id": "keep-client-12345"},
        json={"make": "Subaru", "model": "Outback", "year": 2021, "engine": None, "mileage": None},
    ).json()
    client.post("/diagnosis/lookup", headers={"X-Pitwise-Client-Id": "delete-client-12345"}, json={"vehicle_id": first_vehicle["id"], "code": "P0420"})
    client.post("/diagnosis/lookup", headers={"X-Pitwise-Client-Id": "keep-client-12345"}, json={"vehicle_id": second_vehicle["id"], "code": "P0171"})

    response = client.delete("/me", headers={"X-Pitwise-Client-Id": "delete-client-12345"})

    assert response.status_code == 200
    assert client.get("/vehicles/main", headers={"X-Pitwise-Client-Id": "delete-client-12345"}).json() is None
    assert client.get("/scans", headers={"X-Pitwise-Client-Id": "delete-client-12345"}).json() == []
    assert client.get("/vehicles/main", headers={"X-Pitwise-Client-Id": "keep-client-12345"}).json()["id"] == second_vehicle["id"]


def test_production_settings_require_managed_database_and_locked_down_http_boundaries():
    with pytest.raises(ValidationError):
        Settings(
            app_env="production",
            database_url="sqlite:///./pitwise.db",
            backend_cors_origins="https://pitwise.example",
            backend_trusted_hosts="pitwise.example",
            auto_create_tables=False,
            seed_database_on_startup=False,
            seed_demo_data=False,
        )

    with pytest.raises(ValidationError):
        Settings(
            app_env="production",
            database_url="postgresql+psycopg://user:pass@db:5432/pitwise",
            backend_cors_origins="*",
            backend_trusted_hosts="pitwise.example",
            auto_create_tables=False,
            seed_database_on_startup=False,
            seed_demo_data=False,
        )


def test_production_settings_disable_startup_database_mutations():
    with pytest.raises(ValidationError):
        Settings(
            app_env="production",
            database_url="postgresql+psycopg://user:pass@db:5432/pitwise",
            backend_cors_origins="https://pitwise.example",
            backend_trusted_hosts="pitwise.example",
            auto_create_tables=True,
            seed_database_on_startup=False,
            seed_demo_data=False,
        )

    with pytest.raises(ValidationError):
        Settings(
            app_env="production",
            database_url="postgresql+psycopg://user:pass@db:5432/pitwise",
            backend_cors_origins="https://pitwise.example",
            backend_trusted_hosts="pitwise.example",
            auto_create_tables=False,
            seed_database_on_startup=True,
            seed_demo_data=False,
        )
