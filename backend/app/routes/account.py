from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import AppUser, Scan, Vehicle

router = APIRouter(prefix="/me", tags=["account"])


@router.delete("")
def delete_my_data(current_user: AppUser = Depends(get_current_user), db: Session = Depends(get_db)) -> dict[str, str]:
    db.query(Scan).filter(Scan.user_id == current_user.id).delete(synchronize_session=False)
    db.query(Vehicle).filter(Vehicle.user_id == current_user.id).delete(synchronize_session=False)
    db.delete(current_user)
    db.commit()
    return {"status": "deleted"}
