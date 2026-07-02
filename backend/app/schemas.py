from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


Urgency = Literal["low", "moderate", "high", "critical"]
DriveSafety = Literal["safe", "caution", "avoid driving"]


class VehicleBase(BaseModel):
    make: str = Field(min_length=1, max_length=80)
    model: str = Field(min_length=1, max_length=80)
    year: int = Field(ge=1981, le=2035)
    engine: str | None = Field(default=None, max_length=80)
    mileage: int | None = Field(default=None, ge=0, le=1_000_000)


class EmailLoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    display_name: str | None = Field(default=None, max_length=120)


class GoogleAccessTokenLoginRequest(BaseModel):
    access_token: str = Field(min_length=20, max_length=4096)


class AuthUserRead(BaseModel):
    id: int
    email: str | None
    display_name: str | None
    auth_provider: str
    avatar_url: str | None

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    client_id: str
    user: AuthUserRead


class VehicleCreate(VehicleBase):
    pass


class VehicleRead(VehicleBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CodeLookupRequest(BaseModel):
    code: str = Field(min_length=4, max_length=8)
    vehicle_id: int | None = None
    symptoms: str | None = Field(default=None, max_length=600)


class DiagnosisResponse(BaseModel):
    code: str
    title: str
    plain_english_explanation: str
    urgency: Urgency
    drive_safety_guidance: DriveSafety
    likely_causes: list[str]
    common_repair_paths: list[str]
    estimated_repair_cost_range: str
    mechanic_questions_to_ask: list[str]
    proof_to_request: list[str]
    upsell_watchouts: list[str]
    before_approving_repairs: list[str]
    confidence_note: str
    disclaimer: str
    symptoms_note: str | None = None


class ScanRead(BaseModel):
    id: int
    user_id: int
    vehicle_id: int
    code: str
    symptoms: str | None
    urgency: Urgency
    summary: str
    created_at: datetime
    diagnosis: DiagnosisResponse


class ScanSummary(BaseModel):
    id: int
    user_id: int
    vehicle_id: int
    code: str
    urgency: Urgency
    summary: str
    created_at: datetime


class CodeSearchResult(BaseModel):
    code: str
    title: str
    urgency: Urgency
    drive_safety: DriveSafety

    model_config = {"from_attributes": True}
