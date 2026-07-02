from app.database import SessionLocal
from app.seed.seed_db import seed_database


def main() -> None:
    with SessionLocal() as db:
        seed_database(db, include_demo_data=False)
    print("Seeded OBD code reference data.")


if __name__ == "__main__":
    main()
