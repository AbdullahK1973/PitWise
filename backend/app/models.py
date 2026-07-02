from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


class AppUser(Base):
    __tablename__ = "app_users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    external_id: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    email: Mapped[str | None] = mapped_column(String(254), unique=True, index=True, nullable=True)
    display_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    auth_provider: Mapped[str] = mapped_column(String(30), default="anonymous")
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    google_sub: Mapped[str | None] = mapped_column(String(120), unique=True, index=True, nullable=True)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

    vehicles: Mapped[list["Vehicle"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    scans: Mapped[list["Scan"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Vehicle(Base):
    __tablename__ = "vehicles"
    __table_args__ = (
        CheckConstraint("year >= 1981 AND year <= 2035", name="ck_vehicles_year_supported"),
        CheckConstraint("mileage IS NULL OR (mileage >= 0 AND mileage <= 1000000)", name="ck_vehicles_mileage_supported"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("app_users.id", ondelete="CASCADE"), index=True)
    make: Mapped[str] = mapped_column(String(80))
    model: Mapped[str] = mapped_column(String(80))
    year: Mapped[int] = mapped_column(Integer)
    engine: Mapped[str | None] = mapped_column(String(80), nullable=True)
    mileage: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

    user: Mapped[AppUser] = relationship(back_populates="vehicles")
    scans: Mapped[list["Scan"]] = relationship(back_populates="vehicle", cascade="all, delete-orphan")


class ObdCode(Base):
    __tablename__ = "obd_codes"
    __table_args__ = (
        CheckConstraint("urgency IN ('low', 'moderate', 'high', 'critical')", name="ck_obd_codes_urgency"),
        CheckConstraint("drive_safety IN ('safe', 'caution', 'avoid driving')", name="ck_obd_codes_drive_safety"),
    )

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
    __table_args__ = (
        CheckConstraint("urgency IN ('low', 'moderate', 'high', 'critical')", name="ck_scans_urgency"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("app_users.id", ondelete="CASCADE"), index=True)
    vehicle_id: Mapped[int] = mapped_column(ForeignKey("vehicles.id", ondelete="CASCADE"), index=True)
    code: Mapped[str] = mapped_column(ForeignKey("obd_codes.code", ondelete="RESTRICT"), index=True)
    symptoms: Mapped[str | None] = mapped_column(Text, nullable=True)
    urgency: Mapped[str] = mapped_column(String(20))
    summary: Mapped[str] = mapped_column(Text)
    result_json: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    user: Mapped[AppUser] = relationship(back_populates="scans")
    vehicle: Mapped[Vehicle] = relationship(back_populates="scans")
