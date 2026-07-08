import atexit
import os
import tempfile
import time

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


def test_describe_issue_lookup_creates_matched_scan(client):
    vehicle = client.post(
        "/vehicles",
        headers={"X-Pitwise-Client-Id": "describe-client-12345"},
        json={"make": "Honda", "model": "Accord", "year": 2016, "engine": "2.4L I4", "mileage": 102000},
    ).json()

    response = client.post(
        "/diagnosis/describe",
        headers={"X-Pitwise-Client-Id": "describe-client-12345"},
        json={
            "vehicle_id": vehicle["id"],
            "description": "The engine has a rough idle, it shakes at stops, and the check engine light flashed once.",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["code"] in {"P0300", "P0301", "P0302"}
    assert "closest seeded OBD2 pattern" in data["diagnosis"]["symptoms_note"]
    assert data["diagnosis"]["likely_causes"]
    assert data["diagnosis"]["estimated_repair_cost_range"]


def test_describe_issue_lookup_understands_plain_driver_words(client):
    response = client.post(
        "/diagnosis/describe",
        headers={"X-Pitwise-Client-Id": "describe-plain-client-12345"},
        json={"description": "My car shakes when I am stopped at stoplights and the check engine light is on."},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["code"] in {"P0300", "P0301", "P0302"}
    assert data["symptoms"] == "My car shakes when I am stopped at stoplights and the check engine light is on."


def test_describe_issue_lookup_rejects_unmatched_description(client):
    response = client.post(
        "/diagnosis/describe",
        headers={"X-Pitwise-Client-Id": "describe-unmatched-client-12345"},
        json={"description": "There is a strange vague thing happening sometimes but no actual vehicle symptoms."},
    )

    assert response.status_code == 404


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


def test_agent_task_runs_in_background_and_reports_backend_work(client):
    vehicle = client.post(
        "/vehicles",
        headers={"X-Pitwise-Client-Id": "agent-client-12345"},
        json={"make": "Toyota", "model": "RAV4", "year": 2018, "engine": "2.5L I4", "mileage": 91600},
    ).json()
    scan = client.post(
        "/diagnosis/lookup",
        headers={"X-Pitwise-Client-Id": "agent-client-12345"},
        json={"vehicle_id": vehicle["id"], "code": "P0171", "symptoms": "rough idle after cold start"},
    ).json()

    response = client.post(
        "/agent/tasks",
        headers={"X-Pitwise-Client-Id": "agent-client-12345"},
        json={"goal": "Prepare my shop visit", "scan_id": scan["id"]},
    )

    assert response.status_code == 202
    task = response.json()
    assert task["status"] in {"queued", "running", "completed"}

    task = _wait_for_agent_task(client, task["id"], {"X-Pitwise-Client-Id": "agent-client-12345"})
    assert task["status"] == "completed"
    assert task["progress"] == 100
    assert task["result"]["backend_calls"] == ["GET /vehicles/main", "GET /scans", f"GET /mechanic-prep/{scan['id']}"]
    assert task["result"]["next_actions"]
    assert "rough idle after cold start" in task["result"]["summary"]
    assert any(action["title"] == "Bring the symptom description" for action in task["result"]["next_actions"])


def test_agent_task_rejects_other_users_scan(client):
    other_vehicle = client.post(
        "/vehicles",
        headers={"X-Pitwise-Client-Id": "agent-other-client-12345"},
        json={"make": "Honda", "model": "Fit", "year": 2015, "engine": None, "mileage": None},
    ).json()
    other_scan = client.post(
        "/diagnosis/lookup",
        headers={"X-Pitwise-Client-Id": "agent-other-client-12345"},
        json={"vehicle_id": other_vehicle["id"], "code": "P0420"},
    ).json()

    response = client.post(
        "/agent/tasks",
        headers={"X-Pitwise-Client-Id": "agent-client-12345"},
        json={"goal": "Analyze scan", "scan_id": other_scan["id"]},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Scan not found"


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


def _wait_for_agent_task(client, task_id: str, headers: dict[str, str]) -> dict:
    for _ in range(20):
        response = client.get(f"/agent/tasks/{task_id}", headers=headers)
        assert response.status_code == 200
        task = response.json()
        if task["status"] in {"completed", "failed"}:
            return task
        time.sleep(0.05)
    return task
