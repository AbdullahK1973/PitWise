import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ObdCode, Scan, Vehicle
from app.schemas import CodeLookupRequest, CodeSearchResult, DiagnosisResponse, ScanRead
from app.services.ai_service import DiagnosisGenerator
from app.utils.code_normalizer import is_valid_obd_code, normalize_obd_code

router = APIRouter(tags=["diagnosis"])


@router.post("/diagnosis/lookup", response_model=ScanRead)
def lookup_code(payload: CodeLookupRequest, db: Session = Depends(get_db)) -> ScanRead:
    code = normalize_obd_code(payload.code)
    if not is_valid_obd_code(code):
        raise HTTPException(status_code=422, detail="Enter a valid OBD2 code like P0302.")

    code_data = db.get(ObdCode, code)
    if not code_data:
        raise HTTPException(
            status_code=404,
            detail="That code is not in the MVP seed set yet. Try a common code such as P0302, P0420, or P0171.",
        )

    vehicle = _resolve_vehicle(db, payload.vehicle_id)
    diagnosis = DiagnosisGenerator().generate(code_data, payload.symptoms)
    scan = Scan(
        vehicle_id=vehicle.id,
        code=code,
        symptoms=payload.symptoms,
        urgency=diagnosis.urgency,
        summary=diagnosis.plain_english_explanation,
        result_json=diagnosis.model_dump_json(),
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)
    return _scan_to_read(scan)


@router.get("/codes/{code}", response_model=DiagnosisResponse)
def fetch_code_explanation(code: str, symptoms: str | None = None, db: Session = Depends(get_db)) -> DiagnosisResponse:
    normalized = normalize_obd_code(code)
    if not is_valid_obd_code(normalized):
        raise HTTPException(status_code=422, detail="Enter a valid OBD2 code like P0302.")
    code_data = db.get(ObdCode, normalized)
    if not code_data:
        raise HTTPException(status_code=404, detail="Code not found in seed data")
    return DiagnosisGenerator().generate(code_data, symptoms)


@router.get("/codes", response_model=list[CodeSearchResult])
def search_codes(q: str | None = None, db: Session = Depends(get_db)) -> list[ObdCode]:
    query = db.query(ObdCode)
    if q:
        term = f"%{q.upper()}%"
        query = query.filter(or_(ObdCode.code.like(term), ObdCode.title.like(f"%{q}%")))
    return query.order_by(ObdCode.code.asc()).limit(50).all()


@router.get("/scans", response_model=list[ScanRead])
def fetch_scan_history(db: Session = Depends(get_db)) -> list[ScanRead]:
    scans = db.query(Scan).order_by(Scan.created_at.desc()).all()
    return [_scan_to_read(scan) for scan in scans]


@router.get("/scans/{scan_id}", response_model=ScanRead)
def fetch_scan(scan_id: int, db: Session = Depends(get_db)) -> ScanRead:
    scan = db.get(Scan, scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return _scan_to_read(scan)


@router.get("/mechanic-prep/{scan_id}", response_model=DiagnosisResponse)
def fetch_mechanic_prep(scan_id: int, db: Session = Depends(get_db)) -> DiagnosisResponse:
    scan = db.get(Scan, scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return DiagnosisResponse.model_validate(json.loads(scan.result_json))


@router.get("/scans/{scan_id}/report")
def export_scan_report(scan_id: int, db: Session = Depends(get_db)) -> dict:
    scan = db.get(Scan, scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return {
        "format": "pdf-ready-json",
        "scan": _scan_to_read(scan).model_dump(mode="json"),
        "generated_by": "PitWise MVP",
    }


def _resolve_vehicle(db: Session, vehicle_id: int | None) -> Vehicle:
    vehicle = db.get(Vehicle, vehicle_id) if vehicle_id else db.query(Vehicle).order_by(Vehicle.id.asc()).first()
    if vehicle:
        return vehicle
    vehicle = Vehicle(make="Demo", model="Vehicle", year=2017, engine=None, mileage=None)
    db.add(vehicle)
    db.flush()
    return vehicle


def _scan_to_read(scan: Scan) -> ScanRead:
    return ScanRead(
        id=scan.id,
        vehicle_id=scan.vehicle_id,
        code=scan.code,
        symptoms=scan.symptoms,
        urgency=scan.urgency,
        summary=scan.summary,
        created_at=scan.created_at,
        diagnosis=DiagnosisResponse.model_validate(json.loads(scan.result_json)),
    )
