from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas
from ..auth import require_admin
from ..database import get_db
from ..ratelimit import contact_limiter

public = APIRouter(prefix="/api/contact", tags=["contact"])
admin = APIRouter(prefix="/api/admin/messages", tags=["admin:messages"],
                  dependencies=[Depends(require_admin)])


def message_out(m: models.Message) -> schemas.MessageOut:
    out = schemas.MessageOut.model_validate(m)
    return out.model_copy(update={"service_title": m.service.title if m.service else None})


@public.post("", status_code=status.HTTP_201_CREATED, dependencies=[Depends(contact_limiter)])
def send_message(payload: schemas.MessageIn, db: Session = Depends(get_db)):
    if payload.website:
        raise HTTPException(status_code=400, detail="Invalid submission")
    service_id = payload.service_id
    if service_id is not None and db.get(models.Service, service_id) is None:
        service_id = None
    db.add(models.Message(
        name=payload.name.strip(),
        email=str(payload.email),
        subject=payload.subject.strip(),
        body=payload.body.strip(),
        service_id=service_id,
    ))
    db.commit()
    return {"detail": "Thanks! Your message has been sent."}


def get_or_404(db: Session, message_id: int) -> models.Message:
    message = db.get(models.Message, message_id)
    if message is None:
        raise HTTPException(status_code=404, detail="Message not found")
    return message


@admin.get("", response_model=list[schemas.MessageOut])
def list_messages(db: Session = Depends(get_db)):
    messages = db.scalars(select(models.Message).options(joinedload(models.Message.service))
                          .order_by(models.Message.created_at.desc()))
    return [message_out(m) for m in messages]


@admin.patch("/{message_id}", response_model=schemas.MessageOut)
def update_message(message_id: int, payload: schemas.MessageUpdate, db: Session = Depends(get_db)):
    message = get_or_404(db, message_id)
    message.is_read = payload.is_read
    db.commit()
    return message_out(message)


@admin.delete("/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_message(message_id: int, db: Session = Depends(get_db)):
    db.delete(get_or_404(db, message_id))
    db.commit()
