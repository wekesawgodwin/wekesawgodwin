from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import require_admin
from ..database import get_db

router = APIRouter(prefix="/api", tags=["profile"])


def get_profile(db: Session) -> models.Profile:
    profile = db.scalars(select(models.Profile).limit(1)).first()
    if profile is None:
        profile = models.Profile(
            full_name="Wekesa W. Godwin",
            headline="Full-Stack Software Engineer",
            intro="I design and build fast, reliable web applications.",
            about="Tell visitors about yourself from the admin dashboard.",
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


@router.get("/profile", response_model=schemas.ProfileOut)
def read_profile(db: Session = Depends(get_db)):
    return get_profile(db)


@router.put("/admin/profile", response_model=schemas.ProfileOut,
            dependencies=[Depends(require_admin)])
def update_profile(payload: schemas.ProfileIn, db: Session = Depends(get_db)):
    profile = get_profile(db)
    for key, value in payload.model_dump().items():
        setattr(profile, key, value)
    db.commit()
    db.refresh(profile)
    return profile
