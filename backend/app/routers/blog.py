import re
import unicodedata
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import require_admin
from ..database import get_db
from ..ratelimit import comment_limiter

public = APIRouter(prefix="/api/posts", tags=["blog"])
admin = APIRouter(prefix="/api/admin", tags=["admin:blog"], dependencies=[Depends(require_admin)])


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    text = re.sub(r"[^\w\s-]", "", text).strip().lower()
    return re.sub(r"[-\s_]+", "-", text).strip("-")[:200] or "post"


def unique_slug(db: Session, base: str, exclude_id: int | None = None) -> str:
    slug, n = base, 2
    while True:
        query = select(models.BlogPost.id).where(models.BlogPost.slug == slug)
        if exclude_id is not None:
            query = query.where(models.BlogPost.id != exclude_id)
        if db.scalar(query) is None:
            return slug
        slug, n = f"{base}-{n}", n + 1


def summaries(db: Session, posts: list[models.BlogPost]) -> list[schemas.PostSummary]:
    counts = {}
    if posts:
        counts = dict(db.execute(
            select(models.Comment.post_id, func.count())
            .where(models.Comment.post_id.in_([p.id for p in posts]))
            .group_by(models.Comment.post_id)
        ).all())
    return [
        schemas.PostSummary.model_validate(p).model_copy(update={"comment_count": counts.get(p.id, 0)})
        for p in posts
    ]


def post_out(post: models.BlogPost) -> schemas.PostOut:
    out = schemas.PostOut.model_validate(post)
    return out.model_copy(update={"comment_count": len(out.comments)})


def get_published(db: Session, slug: str) -> models.BlogPost:
    post = db.scalar(select(models.BlogPost).where(
        models.BlogPost.slug == slug, models.BlogPost.published.is_(True)))
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


# ---------- Public ----------
@public.get("", response_model=list[schemas.PostSummary])
def list_posts(limit: int | None = Query(None, ge=1, le=100), db: Session = Depends(get_db)):
    query = (select(models.BlogPost).where(models.BlogPost.published.is_(True))
             .order_by(models.BlogPost.published_at.desc(), models.BlogPost.id.desc()))
    if limit:
        query = query.limit(limit)
    return summaries(db, list(db.scalars(query)))


@public.get("/{slug}", response_model=schemas.PostOut)
def read_post(slug: str, db: Session = Depends(get_db)):
    return post_out(get_published(db, slug))


@public.post("/{slug}/comments", response_model=schemas.CommentOut,
             status_code=status.HTTP_201_CREATED, dependencies=[Depends(comment_limiter)])
def add_comment(slug: str, payload: schemas.CommentIn, db: Session = Depends(get_db)):
    if payload.website:
        raise HTTPException(status_code=400, detail="Invalid submission")
    post = get_published(db, slug)
    comment = models.Comment(post_id=post.id, name=payload.name, content=payload.content.strip())
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


# ---------- Admin ----------
def get_post_or_404(db: Session, post_id: int) -> models.BlogPost:
    post = db.get(models.BlogPost, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


def apply_post(db: Session, post: models.BlogPost, payload: schemas.PostIn) -> None:
    post.title = payload.title
    post.slug = unique_slug(db, slugify(payload.slug or payload.title), exclude_id=post.id)
    post.excerpt = payload.excerpt
    post.content = payload.content
    post.cover_image_url = payload.cover_image_url
    post.published = payload.published
    if payload.published and post.published_at is None:
        post.published_at = datetime.now(timezone.utc)


@admin.get("/posts", response_model=list[schemas.PostSummary])
def admin_list_posts(db: Session = Depends(get_db)):
    posts = db.scalars(select(models.BlogPost).order_by(models.BlogPost.created_at.desc()))
    return summaries(db, list(posts))


@admin.get("/posts/{post_id}", response_model=schemas.PostOut)
def admin_read_post(post_id: int, db: Session = Depends(get_db)):
    return post_out(get_post_or_404(db, post_id))


@admin.post("/posts", response_model=schemas.PostOut, status_code=status.HTTP_201_CREATED)
def create_post(payload: schemas.PostIn, db: Session = Depends(get_db)):
    post = models.BlogPost()
    apply_post(db, post, payload)
    db.add(post)
    db.commit()
    db.refresh(post)
    return post_out(post)


@admin.put("/posts/{post_id}", response_model=schemas.PostOut)
def update_post(post_id: int, payload: schemas.PostIn, db: Session = Depends(get_db)):
    post = get_post_or_404(db, post_id)
    apply_post(db, post, payload)
    db.commit()
    db.refresh(post)
    return post_out(post)


@admin.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(post_id: int, db: Session = Depends(get_db)):
    db.delete(get_post_or_404(db, post_id))
    db.commit()


@admin.get("/comments", response_model=list[schemas.AdminCommentOut])
def list_comments(db: Session = Depends(get_db)):
    rows = db.execute(
        select(models.Comment, models.BlogPost.title)
        .join(models.BlogPost, models.Comment.post_id == models.BlogPost.id)
        .order_by(models.Comment.created_at.desc())
    ).all()
    return [
        schemas.AdminCommentOut(
            id=c.id, name=c.name, content=c.content, created_at=c.created_at,
            post_id=c.post_id, post_title=title,
        )
        for c, title in rows
    ]


@admin.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(comment_id: int, db: Session = Depends(get_db)):
    comment = db.get(models.Comment, comment_id)
    if comment is None:
        raise HTTPException(status_code=404, detail="Comment not found")
    db.delete(comment)
    db.commit()
