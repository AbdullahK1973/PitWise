import json
import threading
from dataclasses import dataclass, field
from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Scan, Vehicle
from app.schemas import AgentAction, AgentActivity, AgentTaskRead, AgentTaskResult, AgentTaskStatus, DiagnosisResponse


def _now() -> datetime:
    return datetime.now(timezone.utc)


@dataclass
class AgentTaskState:
    id: str
    user_id: int
    goal: str
    scan_id: int | None
    status: AgentTaskStatus = "queued"
    progress: int = 0
    activities: list[AgentActivity] = field(default_factory=list)
    result: AgentTaskResult | None = None
    error: str | None = None
    created_at: datetime = field(default_factory=_now)
    updated_at: datetime = field(default_factory=_now)
    completed_at: datetime | None = None


_tasks: dict[str, AgentTaskState] = {}
_lock = threading.Lock()


def create_agent_task(user_id: int, goal: str, scan_id: int | None) -> AgentTaskRead:
    task = AgentTaskState(id=str(uuid4()), user_id=user_id, goal=goal.strip(), scan_id=scan_id)
    with _lock:
        _tasks[task.id] = task
    return _to_read(task)


def get_agent_task(task_id: str, user_id: int) -> AgentTaskRead | None:
    with _lock:
        task = _tasks.get(task_id)
        if not task or task.user_id != user_id:
            return None
        return _to_read(task)


def start_agent_task(task_id: str) -> None:
    thread = threading.Thread(target=_run_agent_task, args=(task_id,), daemon=True)
    thread.start()


def _run_agent_task(task_id: str) -> None:
    _update(task_id, status="running", progress=8)
    db = SessionLocal()
    try:
        task = _get_state(task_id)
        if not task:
            return

        backend_calls: list[str] = []
        _record(task_id, "Loading vehicle profile", "running", "Checking the saved vehicle context for this user.", 18)
        vehicle = db.query(Vehicle).filter(Vehicle.user_id == task.user_id).order_by(Vehicle.id.asc()).first()
        backend_calls.append("GET /vehicles/main")

        _record(task_id, "Reading recent scans", "running", "Pulling scan history so the agent can reason from the latest issue.", 38)
        scans = db.query(Scan).filter(Scan.user_id == task.user_id).order_by(Scan.created_at.desc()).limit(5).all()
        backend_calls.append("GET /scans")

        target_scan = _select_scan(db, task.user_id, task.scan_id, scans)
        if task.scan_id and not target_scan:
            raise ValueError("The selected scan was not found.")

        if target_scan:
            _record(task_id, "Inspecting diagnosis", "running", f"Reviewing {target_scan.code} and its mechanic-prep guidance.", 62)
            diagnosis = DiagnosisResponse.model_validate(json.loads(target_scan.result_json))
            backend_calls.append(f"GET /mechanic-prep/{target_scan.id}")
            result = _build_result(task.goal, vehicle, scans, target_scan, diagnosis, backend_calls)
        else:
            _record(task_id, "Checking readiness", "running", "No scan exists yet, so the agent is preparing the next useful setup task.", 62)
            result = _build_no_scan_result(task.goal, vehicle, backend_calls)

        _record(task_id, "Preparing action plan", "completed", "The agent turned the background checks into next actions.", 88)
        _complete(task_id, result)
    except Exception as exc:
        _fail(task_id, str(exc))
    finally:
        db.close()


def _select_scan(db: Session, user_id: int, scan_id: int | None, scans: list[Scan]) -> Scan | None:
    if scan_id is not None:
        return db.query(Scan).filter(Scan.id == scan_id, Scan.user_id == user_id).first()
    return scans[0] if scans else None


def _build_result(
    goal: str,
    vehicle: Vehicle | None,
    scans: list[Scan],
    scan: Scan,
    diagnosis: DiagnosisResponse,
    backend_calls: list[str],
) -> AgentTaskResult:
    vehicle_name = _vehicle_name(vehicle)
    symptoms = _symptom_summary(scan)
    first_proof = diagnosis.proof_to_request[0] if diagnosis.proof_to_request else "proof that confirms the suspected fault"
    first_question = diagnosis.mechanic_questions_to_ask[0] if diagnosis.mechanic_questions_to_ask else "what test confirms the repair"
    first_approval = diagnosis.before_approving_repairs[0] if diagnosis.before_approving_repairs else "a written estimate with evidence"
    scan_count_note = f" It considered {len(scans)} recent scan{'' if len(scans) == 1 else 's'}." if scans else ""
    symptom_note = f" It also used the described issue: {symptoms}." if symptoms else ""

    return AgentTaskResult(
        summary=(
            f"Autonomous agent completed '{goal}' for {vehicle_name}. "
            f"The latest priority is {scan.code}: {diagnosis.title}. "
            f"Drive guidance is {diagnosis.drive_safety_guidance}.{symptom_note}{scan_count_note}"
        ),
        backend_calls=backend_calls,
        next_actions=[
            AgentAction(title="Confirm the drive decision", detail=diagnosis.confidence_note, priority=diagnosis.urgency),
            *(
                [AgentAction(title="Bring the symptom description", detail=f"Tell the shop exactly what you entered: {symptoms}", priority="moderate")]
                if symptoms
                else []
            ),
            AgentAction(title="Request proof before parts", detail=first_proof, priority=diagnosis.urgency),
            AgentAction(title="Ask the shop one pointed question", detail=first_question, priority="moderate"),
            AgentAction(title="Use the approval gate", detail=first_approval, priority="moderate"),
        ],
    )


def _build_no_scan_result(goal: str, vehicle: Vehicle | None, backend_calls: list[str]) -> AgentTaskResult:
    vehicle_name = _vehicle_name(vehicle)
    return AgentTaskResult(
        summary=f"Autonomous agent completed '{goal}' for {vehicle_name}. No scan is saved yet, so the best next task is capturing a code or symptom description.",
        backend_calls=backend_calls,
        next_actions=[
            AgentAction(title="Capture the current issue", detail="Enter an OBD2 code or describe symptoms so PitWise can create a diagnosis.", priority="moderate"),
            AgentAction(title="Verify vehicle details", detail="Confirm year, make, model, mileage, and engine before relying on repair guidance.", priority="low"),
        ],
    )


def _vehicle_name(vehicle: Vehicle | None) -> str:
    if not vehicle:
        return "the saved account"
    return f"{vehicle.year} {vehicle.make} {vehicle.model}"


def _symptom_summary(scan: Scan) -> str | None:
    if not scan.symptoms:
        return None
    symptoms = " ".join(scan.symptoms.split())
    if not symptoms:
        return None
    return symptoms if len(symptoms) <= 180 else f"{symptoms[:177].rstrip()}..."


def _get_state(task_id: str) -> AgentTaskState | None:
    with _lock:
        return _tasks.get(task_id)


def _record(task_id: str, label: str, status: str, detail: str, progress: int) -> None:
    with _lock:
        task = _tasks.get(task_id)
        if not task:
            return
        task.activities.append(AgentActivity(label=label, status=status, detail=detail))
        task.progress = max(task.progress, progress)
        task.updated_at = _now()


def _update(task_id: str, status: AgentTaskStatus | None = None, progress: int | None = None) -> None:
    with _lock:
        task = _tasks.get(task_id)
        if not task:
            return
        if status:
            task.status = status
        if progress is not None:
            task.progress = progress
        task.updated_at = _now()


def _complete(task_id: str, result: AgentTaskResult) -> None:
    with _lock:
        task = _tasks.get(task_id)
        if not task:
            return
        task.status = "completed"
        task.progress = 100
        task.result = result
        task.completed_at = _now()
        task.updated_at = task.completed_at


def _fail(task_id: str, error: str) -> None:
    with _lock:
        task = _tasks.get(task_id)
        if not task:
            return
        task.status = "failed"
        task.error = error
        task.completed_at = _now()
        task.updated_at = task.completed_at


def _to_read(task: AgentTaskState) -> AgentTaskRead:
    return AgentTaskRead(
        id=task.id,
        user_id=task.user_id,
        goal=task.goal,
        scan_id=task.scan_id,
        status=task.status,
        progress=task.progress,
        activities=list(task.activities),
        result=task.result,
        error=task.error,
        created_at=task.created_at,
        updated_at=task.updated_at,
        completed_at=task.completed_at,
    )
