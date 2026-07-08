from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import AppUser, Scan
from app.schemas import AgentTaskCreate, AgentTaskRead
from app.services.agent_runner import create_agent_task, get_agent_task, start_agent_task


router = APIRouter(prefix="/agent", tags=["agent"])


@router.post("/tasks", response_model=AgentTaskRead, status_code=status.HTTP_202_ACCEPTED)
def create_task(
    payload: AgentTaskCreate,
    current_user: AppUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AgentTaskRead:
    if payload.scan_id is not None:
        scan = db.query(Scan).filter(Scan.id == payload.scan_id, Scan.user_id == current_user.id).first()
        if not scan:
            raise HTTPException(status_code=404, detail="Scan not found")

    task = create_agent_task(current_user.id, payload.goal, payload.scan_id)
    start_agent_task(task.id)
    return task


@router.get("/tasks/{task_id}", response_model=AgentTaskRead)
def fetch_task(task_id: str, current_user: AppUser = Depends(get_current_user)) -> AgentTaskRead:
    task = get_agent_task(task_id, current_user.id)
    if not task:
        raise HTTPException(status_code=404, detail="Agent task not found")
    return task
