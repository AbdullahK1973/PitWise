from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import AppUser


CLIENT_ID_HEADER = "X-Pitwise-Client-Id"


def get_current_user(
    client_id: str | None = Header(default=None, alias=CLIENT_ID_HEADER),
    db: Session = Depends(get_db),
) -> AppUser:
    normalized = (client_id or "").strip()
    if len(normalized) < 12 or len(normalized) > 120:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Missing or invalid {CLIENT_ID_HEADER} header.",
        )

    user = db.query(AppUser).filter(AppUser.external_id == normalized).first()
    if user:
        return user

    user = AppUser(external_id=normalized)
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        user = db.query(AppUser).filter(AppUser.external_id == normalized).first()
        if user:
            return user
        raise
    db.refresh(user)
    return user
