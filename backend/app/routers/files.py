"""Resume (CV) and image uploads. Both are stored in Postgres so they survive Railway redeploys."""

import re
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, Response, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session, undefer

from .. import models, schemas
from ..auth import require_admin
from ..config import get_settings
from ..database import get_db

public = APIRouter(prefix="/api", tags=["files"])
admin = APIRouter(prefix="/api/admin", tags=["admin:files"], dependencies=[Depends(require_admin)])

# SVG is deliberately excluded: it can carry scripts and would be served from our own origin.
IMAGE_SIGNATURES = {
    "image/png": (b"\x89PNG\r\n\x1a\n",),
    "image/jpeg": (b"\xff\xd8\xff",),
    "image/gif": (b"GIF87a", b"GIF89a"),
    "image/webp": (b"RIFF",),
}


def safe_filename(name: str | None, fallback: str) -> str:
    name = re.sub(r"[^A-Za-z0-9._-]+", "-", (name or "").rsplit("/", 1)[-1]).strip("-.")
    return name[:200] or fallback


async def read_limited(file: UploadFile, max_mb: int) -> bytes:
    limit = max_mb * 1024 * 1024
    data = await file.read(limit + 1)
    if len(data) > limit:
        raise HTTPException(status_code=413, detail=f"File is larger than {max_mb} MB")
    if not data:
        raise HTTPException(status_code=400, detail="File is empty")
    return data


def media_out(m: models.Media) -> schemas.MediaOut:
    out = schemas.MediaOut.model_validate(m)
    return out.model_copy(update={"url": f"/api/media/{m.id}/{m.filename}"})


# ---------- Resume ----------
def latest_resume(db: Session, with_data: bool = False) -> models.Resume | None:
    query = select(models.Resume).order_by(models.Resume.uploaded_at.desc(), models.Resume.id.desc())
    if with_data:
        query = query.options(undefer(models.Resume.data))
    return db.scalars(query.limit(1)).first()


@public.get("/resume/meta", response_model=schemas.ResumeOut | None)
def resume_meta(db: Session = Depends(get_db)):
    return latest_resume(db)


@public.get("/resume")
def download_resume(db: Session = Depends(get_db)):
    resume = latest_resume(db, with_data=True)
    if resume is None:
        raise HTTPException(status_code=404, detail="No resume uploaded yet")
    return Response(
        content=resume.data,
        media_type=resume.content_type,
        headers={
            "Content-Disposition": f"inline; filename*=UTF-8''{quote(resume.filename)}",
            "Cache-Control": "no-cache",
        },
    )


@admin.post("/resume", response_model=schemas.ResumeOut, status_code=status.HTTP_201_CREATED)
async def upload_resume(file: UploadFile, db: Session = Depends(get_db)):
    data = await read_limited(file, get_settings().max_resume_mb)
    if not data.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="Please upload a PDF file")
    # Only the newest resume is ever served, so replace rather than accumulate.
    for old in db.scalars(select(models.Resume)):
        db.delete(old)
    resume = models.Resume(
        filename=safe_filename(file.filename, "resume.pdf"),
        content_type="application/pdf",
        size=len(data),
        data=data,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume


@admin.delete("/resume", status_code=status.HTTP_204_NO_CONTENT)
def delete_resume(db: Session = Depends(get_db)):
    for old in db.scalars(select(models.Resume)):
        db.delete(old)
    db.commit()


# ---------- Media ----------
@public.get("/media/{media_id}/{filename}")
def serve_media(media_id: int, filename: str, db: Session = Depends(get_db)):
    media = db.scalars(select(models.Media).where(models.Media.id == media_id)
                       .options(undefer(models.Media.data))).first()
    if media is None:
        raise HTTPException(status_code=404, detail="Image not found")
    return Response(
        content=media.data,
        media_type=media.content_type,
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )


@admin.get("/media", response_model=list[schemas.MediaOut])
def list_media(db: Session = Depends(get_db)):
    return [media_out(m) for m in db.scalars(select(models.Media).order_by(models.Media.id.desc()))]


@admin.post("/media", response_model=schemas.MediaOut, status_code=status.HTTP_201_CREATED)
async def upload_media(file: UploadFile, db: Session = Depends(get_db)):
    data = await read_limited(file, get_settings().max_image_mb)
    content_type = next(
        (ct for ct, sigs in IMAGE_SIGNATURES.items() if any(data.startswith(s) for s in sigs)), None
    )
    if content_type == "image/webp" and data[8:12] != b"WEBP":
        content_type = None
    if content_type is None:
        raise HTTPException(status_code=400, detail="Please upload a PNG, JPEG, GIF or WebP image")
    media = models.Media(
        filename=safe_filename(file.filename, "image"),
        content_type=content_type,
        size=len(data),
        data=data,
    )
    db.add(media)
    db.commit()
    db.refresh(media)
    return media_out(media)


@admin.delete("/media/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_media(media_id: int, db: Session = Depends(get_db)):
    media = db.get(models.Media, media_id)
    if media is None:
        raise HTTPException(status_code=404, detail="Image not found")
    db.delete(media)
    db.commit()
