import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import require_admin
from ..database import get_db
from ..ratelimit import review_limiter

public = APIRouter(prefix="/api/reviews", tags=["reviews"])
admin = APIRouter(prefix="/api/admin", tags=["admin:reviews"], dependencies=[Depends(require_admin)])


def find_invite(db: Session, token: str) -> models.ReviewInvite | None:
    return db.scalar(select(models.ReviewInvite).where(models.ReviewInvite.token == token))


# ---------- Public ----------
@public.get("", response_model=list[schemas.ReviewOut])
def list_reviews(db: Session = Depends(get_db)):
    return db.scalars(select(models.Review).where(models.Review.approved.is_(True))
                      .order_by(models.Review.created_at.desc())).all()


@public.get("/invite/{token}", response_model=schemas.InviteCheck)
def check_invite(token: str, db: Session = Depends(get_db)):
    invite = find_invite(db, token)
    if invite is None or invite.used:
        return schemas.InviteCheck(valid=False)
    return schemas.InviteCheck(valid=True, client_label=invite.client_label)


@public.post("/invite/{token}", response_model=schemas.ReviewOut,
             status_code=status.HTTP_201_CREATED, dependencies=[Depends(review_limiter)])
def submit_review(token: str, payload: schemas.ReviewIn, db: Session = Depends(get_db)):
    invite = find_invite(db, token)
    if invite is None or invite.used:
        raise HTTPException(status_code=400, detail="This review link is invalid or has already been used.")
    invite.used = True
    review = models.Review(
        name=payload.name.strip(),
        role=payload.role.strip(),
        rating=payload.rating,
        content=payload.content.strip(),
        invite_id=invite.id,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


# ---------- Admin ----------
@admin.get("/invites", response_model=list[schemas.InviteOut])
def list_invites(db: Session = Depends(get_db)):
    return db.scalars(select(models.ReviewInvite).order_by(models.ReviewInvite.created_at.desc())).all()


@admin.post("/invites", response_model=schemas.InviteOut, status_code=status.HTTP_201_CREATED)
def create_invite(payload: schemas.InviteIn, db: Session = Depends(get_db)):
    invite = models.ReviewInvite(token=secrets.token_urlsafe(24), client_label=payload.client_label.strip())
    db.add(invite)
    db.commit()
    db.refresh(invite)
    return invite


@admin.delete("/invites/{invite_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_invite(invite_id: int, db: Session = Depends(get_db)):
    invite = db.get(models.ReviewInvite, invite_id)
    if invite is None:
        raise HTTPException(status_code=404, detail="Invite not found")
    db.delete(invite)
    db.commit()


@admin.get("/reviews", response_model=list[schemas.ReviewOut])
def admin_list_reviews(db: Session = Depends(get_db)):
    return db.scalars(select(models.Review).order_by(models.Review.created_at.desc())).all()


def get_review_or_404(db: Session, review_id: int) -> models.Review:
    review = db.get(models.Review, review_id)
    if review is None:
        raise HTTPException(status_code=404, detail="Review not found")
    return review


@admin.patch("/reviews/{review_id}", response_model=schemas.ReviewOut)
def update_review(review_id: int, payload: schemas.ReviewUpdate, db: Session = Depends(get_db)):
    review = get_review_or_404(db, review_id)
    review.approved = payload.approved
    db.commit()
    return review


@admin.delete("/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(review_id: int, db: Session = Depends(get_db)):
    db.delete(get_review_or_404(db, review_id))
    db.commit()
