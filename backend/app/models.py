from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    make: Mapped[str] = mapped_column(String(80))
    model: Mapped[str] = mapped_column(String(80))
    year: Mapped[int] = mapped_column(Integer)
    engine: Mapped[str | None] = mapped_column(String(80), nullable=True)
    mileage: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

    scans: Mapped[list["Scan"]] = relationship(back_populates="vehicle")


class ObdCode(Base):
    __tablename__ = "obd_codes"

    code: Mapped[str] = mapped_column(String(12), primary_key=True)
    title: Mapped[str] = mapped_column(String(180))
    explanation: Mapped[str] = mapped_column(Text)
    urgency: Mapped[str] = mapped_column(String(20))
    drive_safety: Mapped[str] = mapped_column(String(30))
    likely_causes: Mapped[str] = mapped_column(Text)
    repair_paths: Mapped[str] = mapped_column(Text)
    cost_range: Mapped[str] = mapped_column(String(80))
    mechanic_questions: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(80), default="general")


class Scan(Base):
    __tablename__ = "scans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    vehicle_id: Mapped[int] = mapped_column(ForeignKey("vehicles.id"))
    code: Mapped[str] = mapped_column(String(12))
    symptoms: Mapped[str | None] = mapped_column(Text, nullable=True)
    urgency: Mapped[str] = mapped_column(String(20))
    summary: Mapped[str] = mapped_column(Text)
    result_json: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    vehicle: Mapped[Vehicle] = relationship(back_populates="scans")
