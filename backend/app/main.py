from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

from .config import get_settings
from .routers import auth, blog, contact, dashboard, files, profile, reviews, seo
from .routers.resources import routers as resource_routers

settings = get_settings()

if "change-me" in (settings.secret_key, settings.admin_password):
    raise RuntimeError("Set the SECRET_KEY and ADMIN_PASSWORD environment variables before starting.")

app = FastAPI(
    title="wekesawgodwin.com API",
    docs_url="/api/docs",
    redoc_url=None,
    openapi_url="/api/openapi.json",
)

if settings.cors_origin_list:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.middleware("http")
async def canonical_host_and_headers(request: Request, call_next):
    host = request.headers.get("host", "")
    if host.startswith("www."):
        url = request.url.replace(scheme="https", netloc=host[4:])
        return RedirectResponse(str(url), status_code=301)
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.setdefault("X-Frame-Options", "SAMEORIGIN")
    return response


@app.get("/api/health", tags=["health"])
def health():
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(profile.router)
for router in resource_routers:
    app.include_router(router)
for module in (blog, contact, reviews, files):
    app.include_router(module.public)
    app.include_router(module.admin)
app.include_router(dashboard.router)
app.include_router(seo.router)


# ---------- React single-page app ----------
# In production the Docker build copies the Vite output into STATIC_DIR. In local
# development the frontend runs on Vite's dev server instead, so this is skipped.
static_dir = Path(settings.static_dir).resolve()
index_html = static_dir / "index.html"

if index_html.is_file():
    if (static_dir / "assets").is_dir():
        app.mount("/assets", StaticFiles(directory=static_dir / "assets"), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found")
        candidate = (static_dir / full_path).resolve()
        if full_path and candidate.is_file() and static_dir in candidate.parents:
            return FileResponse(candidate)
        return FileResponse(index_html, headers={"Cache-Control": "no-cache"})
