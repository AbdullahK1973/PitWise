import json

from sqlalchemy.orm import Session

from app.models import AppUser, ObdCode, Scan, Vehicle
from app.seed.obd_codes import SEEDED_CODES
from app.services.ai_service import DiagnosisGenerator


def seed_database(db: Session, include_demo_data: bool = True) -> None:
    for item in SEEDED_CODES:
        existing = db.get(ObdCode, item["code"])
        if existing:
            for key, value in _to_model_payload(item).items():
                setattr(existing, key, value)
        else:
            db.add(ObdCode(**_to_model_payload(item)))

    if not include_demo_data:
        db.commit()
        return

    demo_user = db.query(AppUser).filter(AppUser.external_id == "demo-local-development").first()
    if not demo_user:
        demo_user = AppUser(external_id="demo-local-development")
        db.add(demo_user)
        db.flush()

    demo_vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.user_id == demo_user.id, Vehicle.make == "Toyota", Vehicle.model == "Camry", Vehicle.year == 2017)
        .first()
    )
    if not demo_vehicle:
        demo_vehicle = Vehicle(user_id=demo_user.id, make="Toyota", model="Camry", year=2017, engine="2.5L I4", mileage=86300)
        db.add(demo_vehicle)
        db.flush()

    if db.query(Scan).count() == 0:
        generator = DiagnosisGenerator()
        for code, symptoms in [("P0302", "Rough idle and check engine light"), ("P0420", "No major symptoms, light came back after clearing")]:
            obd = db.get(ObdCode, code)
            if obd:
                diagnosis = generator.generate(obd, symptoms=symptoms)
                db.add(
                    Scan(
                        user_id=demo_user.id,
                        vehicle_id=demo_vehicle.id,
                        code=code,
                        symptoms=symptoms,
                        urgency=diagnosis.urgency,
                        summary=diagnosis.plain_english_explanation,
                        result_json=diagnosis.model_dump_json(),
                    )
                )

    db.commit()


def _to_model_payload(item: dict) -> dict:
    return {
        "code": item["code"],
        "title": item["title"],
        "explanation": item["explanation"],
        "urgency": item["urgency"],
        "drive_safety": item["drive_safety"],
        "likely_causes": json.dumps(item["likely_causes"]),
        "repair_paths": json.dumps(item["repair_paths"]),
        "cost_range": item["cost_range"],
        "mechanic_questions": json.dumps(item["mechanic_questions"]),
        "category": item.get("category", "general"),
    }
