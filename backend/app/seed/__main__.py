from app.database import SessionLocal
from app.seed.seed_db import seed_database


def main() -> None:
    with SessionLocal() as db:
        seed_database(db, include_demo_data=False)
    print("Seeded curated OBD reference data. Generated code-family coverage is available lazily.")


if __name__ == "__main__":
    main()
