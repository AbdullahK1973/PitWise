from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.config import get_settings
from app.database import Base, SessionLocal, engine
from app.routes import account, auth, diagnosis, health, vehicles
from app.seed.seed_db import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.auto_create_tables:
        Base.metadata.create_all(bind=engine)
    if settings.seed_database_on_startup:
        db = SessionLocal()
        try:
            seed_database(db, include_demo_data=settings.seed_demo_data)
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

def _split_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


origins = ["*"] if settings.backend_cors_origins == "*" else _split_csv(settings.backend_cors_origins)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

trusted_hosts = _split_csv(settings.backend_trusted_hosts)
if trusted_hosts != ["*"]:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=trusted_hosts)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(account.router)
app.include_router(vehicles.router)
app.include_router(diagnosis.router)
