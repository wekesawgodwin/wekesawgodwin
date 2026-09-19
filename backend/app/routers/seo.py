from xml.sax.saxutils import escape

from fastapi import APIRouter, Depends, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models
from ..config import get_settings
from ..database import get_db

router = APIRouter(include_in_schema=False)

STATIC_PAGES = ["", "skills", "services", "portfolio", "blog", "contact"]


@router.get("/robots.txt")
def robots():
    site = get_settings().site_url.rstrip("/")
    body = f"User-agent: *\nDisallow: /admin\nDisallow: /review/\n\nSitemap: {site}/sitemap.xml\n"
    return Response(body, media_type="text/plain")


@router.get("/sitemap.xml")
def sitemap(db: Session = Depends(get_db)):
    site = get_settings().site_url.rstrip("/")
    entries = [(f"{site}/{page}", None) for page in STATIC_PAGES]
    entries += [(f"{site}/portfolio/{pid}", None) for pid in db.scalars(select(models.Project.id))]
    posts = db.execute(select(models.BlogPost.slug, models.BlogPost.updated_at)
                       .where(models.BlogPost.published.is_(True))).all()
    entries += [(f"{site}/blog/{slug}", updated) for slug, updated in posts]

    urls = []
    for loc, lastmod in entries:
        mod = f"<lastmod>{lastmod.date().isoformat()}</lastmod>" if lastmod else ""
        urls.append(f"<url><loc>{escape(loc)}</loc>{mod}</url>")
    xml = ('<?xml version="1.0" encoding="UTF-8"?>\n'
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
           + "".join(urls) + "</urlset>")
    return Response(xml, media_type="application/xml")
