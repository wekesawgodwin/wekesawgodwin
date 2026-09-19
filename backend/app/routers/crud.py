"""Builds public list + admin create/update/delete routes for simple ordered resources."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import require_admin
from ..database import get_db


def _dump(payload: BaseModel) -> dict:
    # HttpUrl values must be stored as plain strings.
    return {k: (str(v) if v is not None and not isinstance(v, (str, int, bool)) else v)
            for k, v in payload.model_dump().items()}


def build_crud_routers(model, schema_in, schema_out, path: str, tag: str):
    public = APIRouter(prefix=f"/api/{path}", tags=[tag])
    admin = APIRouter(prefix=f"/api/admin/{path}", tags=[f"admin:{tag}"],
                      dependencies=[Depends(require_admin)])

    def get_or_404(db: Session, item_id: int):
        item = db.get(model, item_id)
        if item is None:
            raise HTTPException(status_code=404, detail=f"{tag.capitalize()} not found")
        return item

    @public.get("", response_model=list[schema_out])
    def list_items(db: Session = Depends(get_db)):
        return db.scalars(select(model).order_by(model.sort_order, model.id)).all()

    @admin.post("", response_model=schema_out, status_code=status.HTTP_201_CREATED)
    def create_item(payload: schema_in, db: Session = Depends(get_db)):
        item = model(**_dump(payload))
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    @admin.put("/{item_id}", response_model=schema_out)
    def update_item(item_id: int, payload: schema_in, db: Session = Depends(get_db)):
        item = get_or_404(db, item_id)
        for key, value in _dump(payload).items():
            setattr(item, key, value)
        db.commit()
        db.refresh(item)
        return item

    @admin.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
    def delete_item(item_id: int, db: Session = Depends(get_db)):
        db.delete(get_or_404(db, item_id))
        db.commit()

    return public, admin
