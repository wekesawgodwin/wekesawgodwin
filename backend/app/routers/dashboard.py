from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import require_admin
from ..database import get_db

router = APIRouter(prefix="/api/admin", tags=["admin:dashboard"], dependencies=[Depends(require_admin)])


@router.get("/stats", response_model=schemas.DashboardStats)
def stats(db: Session = Depends(get_db)):
    def count(model, *where):
        return db.scalar(select(func.count()).select_from(model).where(*where))

    return schemas.DashboardStats(
        projects=count(models.Project),
        skills=count(models.Skill),
        services=count(models.Service),
        posts=count(models.BlogPost),
        comments=count(models.Comment),
        messages=count(models.Message),
        unread_messages=count(models.Message, models.Message.is_read.is_(False)),
        reviews=count(models.Review),
        has_resume=count(models.Resume) > 0,
    )
