from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import AppUser, Vehicle
from app.schemas import VehicleCreate, VehicleRead

router = APIRouter(prefix="/vehicles", tags=["vehicles"])


@router.get("/main", response_model=VehicleRead | None)
def get_main_vehicle(current_user: AppUser = Depends(get_current_user), db: Session = Depends(get_db)) -> Vehicle | None:
    return db.query(Vehicle).filter(Vehicle.user_id == current_user.id).order_by(Vehicle.id.asc()).first()


@router.post("", response_model=VehicleRead)
def create_or_update_vehicle(
    payload: VehicleCreate,
    current_user: AppUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Vehicle:
    vehicle = db.query(Vehicle).filter(Vehicle.user_id == current_user.id).order_by(Vehicle.id.asc()).first()
    if not vehicle:
        vehicle = Vehicle(user_id=current_user.id, **payload.model_dump())
        db.add(vehicle)
    else:
        for field, value in payload.model_dump().items():
            setattr(vehicle, field, value)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.get("/{vehicle_id}", response_model=VehicleRead)
def get_vehicle(
    vehicle_id: int,
    current_user: AppUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Vehicle:
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id, Vehicle.user_id == current_user.id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle
