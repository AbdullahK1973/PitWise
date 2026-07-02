import json
import re
from urllib.error import URLError
from urllib.request import Request, urlopen

from fastapi import APIRouter, HTTPException, status
from sqlalchemy.exc import IntegrityError

from app.database import SessionLocal
from app.models import AppUser, now_utc
from app.schemas import AuthResponse, AuthUserRead, EmailLoginRequest, GoogleAccessTokenLoginRequest

router = APIRouter(prefix="/auth", tags=["auth"])

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


@router.post("/email", response_model=AuthResponse)
def login_with_email(payload: EmailLoginRequest) -> AuthResponse:
    email = _normalize_email(payload.email)
    display_name = payload.display_name.strip() if payload.display_name else None
    external_id = f"email:{email}"

    with SessionLocal() as db:
        user = db.query(AppUser).filter(AppUser.external_id == external_id).first()
        if not user:
            user = db.query(AppUser).filter(AppUser.email == email).first()
        if not user:
            user = AppUser(external_id=external_id, email=email, display_name=display_name, auth_provider="email")
            db.add(user)
        else:
            user.external_id = external_id
            user.email = email
            user.auth_provider = "email"
            if display_name:
                user.display_name = display_name
        user.last_login_at = now_utc()
        _commit_user(db, user)
        return _auth_response(user)


@router.post("/google", response_model=AuthResponse)
def login_with_google(payload: GoogleAccessTokenLoginRequest) -> AuthResponse:
    profile = _fetch_google_profile(payload.access_token)
    google_sub = str(profile.get("sub") or "").strip()
    email = _normalize_email(str(profile.get("email") or ""))
    display_name = str(profile.get("name") or "").strip() or None
    avatar_url = str(profile.get("picture") or "").strip() or None

    if not google_sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google did not return a user id.")

    external_id = f"google:{google_sub}"
    with SessionLocal() as db:
        user = db.query(AppUser).filter(AppUser.google_sub == google_sub).first()
        if not user:
            user = db.query(AppUser).filter(AppUser.external_id == external_id).first()
        if not user and email:
            user = db.query(AppUser).filter(AppUser.email == email).first()

        if not user:
            user = AppUser(external_id=external_id)
            db.add(user)

        user.external_id = external_id
        user.google_sub = google_sub
        user.email = email
        user.display_name = display_name
        user.avatar_url = avatar_url
        user.auth_provider = "google"
        user.last_login_at = now_utc()
        _commit_user(db, user)
        return _auth_response(user)


def _normalize_email(value: str) -> str:
    email = value.strip().lower()
    if not EMAIL_PATTERN.match(email):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Enter a valid email address.")
    return email


def _fetch_google_profile(access_token: str) -> dict:
    request = Request(GOOGLE_USERINFO_URL, headers={"Authorization": f"Bearer {access_token}"})
    try:
        with urlopen(request, timeout=8) as response:
            payload = response.read().decode("utf-8")
            return json.loads(payload)
    except (OSError, URLError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google login could not be verified.") from exc


def _commit_user(db, user: AppUser) -> None:
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account already exists with this login.") from exc
    db.refresh(user)


def _auth_response(user: AppUser) -> AuthResponse:
    return AuthResponse(client_id=user.external_id, user=AuthUserRead.model_validate(user))
