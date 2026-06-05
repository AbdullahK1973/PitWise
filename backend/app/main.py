from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import Base, SessionLocal, engine
from app.routes import diagnosis, health, vehicles
from app.seed.seed_db import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield


settings = get_settings()
app = FastAPI(
    title="PitWise API",
    description="Guidance-focused OBD2 issue translator and mechanic prep assistant.",
    version="0.1.0",
    lifespan=lifespan,
)

origins = ["*"] if settings.backend_cors_origins == "*" else [item.strip() for item in settings.backend_cors_origins.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(vehicles.router)
app.include_router(diagnosis.router)
