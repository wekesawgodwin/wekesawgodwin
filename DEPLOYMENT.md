# wekesawgodwin.com: development & deployment

A personal portfolio built with **FastAPI + PostgreSQL** (backend), **React/Vite** (frontend),
packaged as a **single Docker image** and hosted on **Railway**.

In production one container does everything: FastAPI serves the JSON API under `/api/*`
and the compiled React app for every other path. That means one Railway service, one domain,
and no CORS setup.

```
backend/            FastAPI app, Alembic migrations, start.sh (migrate, seed, serve)
frontend/           React (JSX) + Vite. Public pages and the /admin dashboard
Dockerfile          Builds the frontend, then the Python image that serves it
docker-compose.yml  Local Postgres + app, production-like
railway.json        Railway build/deploy settings (Dockerfile builder, health check)
```

## Pages

| Public | Admin (`/admin`, password protected) |
| --- | --- |
| `/` Home: hero, about + stats, services, skills, projects, reviews, latest posts | Dashboard with counts |
| `/skills` Skill rings, per-category bars, toolbox | Profile: name, bio, photo, contacts, socials |
| `/services` Service cards with pricing, process, testimonials | Skills / Services / Projects CRUD |
| `/portfolio` Filterable project grid, `/portfolio/:id` details | Blog posts: Markdown editor with preview, drafts |
| `/blog` Posts + sidebar search, `/blog/:slug` article + comments | Comments moderation, Messages inbox |
| `/contact` Contact form (can preselect a service) | Reviews: one-time client review links |
| `/review/:token` Client review form | Media library (image uploads), Resume (PDF) |

Uploaded images and your resume are stored **in Postgres**, because Railway's filesystem is
wiped on every deploy.

---

## Run locally

### Option A: Docker (closest to production)

```bash
docker compose up --build
```

Open http://localhost:8000 and sign in at http://localhost:8000/admin with `admin` / `admin123`.
You can override these with `ADMIN_USERNAME`, `ADMIN_PASSWORD` and `SECRET_KEY` in your shell or a root `.env`.

### Option B: hot reload while developing

Start only the database with `docker compose up db`, or use any local Postgres. Then run:

```bash
# Terminal 1: API on :8000
cd backend
py -3.13 -m venv .venv                              # Windows; macOS/Linux: python3 -m venv .venv
source .venv/Scripts/activate                       # Git Bash on Windows; macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env                                # then edit SECRET_KEY / ADMIN_PASSWORD
alembic upgrade head && python -m app.seed
uvicorn app.main:app --reload

# Terminal 2: frontend on :5173 (proxies /api to :8000)
cd frontend
npm install
npm run dev
```

API docs: http://localhost:8000/api/docs

### Changing the database schema

Edit `backend/app/models.py`, then generate and review a migration:

```bash
cd backend
alembic revision --autogenerate -m "describe the change"
alembic upgrade head
```

Migrations run automatically on every deploy (see `backend/start.sh`).

---

## Deploy to Railway

1. **Push this repo to GitHub.**
2. In Railway, click **New Project → Deploy from GitHub repo** and pick this repository.
   Railway reads `railway.json` and builds the root `Dockerfile`.
3. In the same project, click **+ Create → Database → PostgreSQL**.
4. Open the web service, go to **Variables**, and add:

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (a reference to the Postgres service) |
   | `SECRET_KEY` | a long random string, e.g. output of `python -c "import secrets; print(secrets.token_urlsafe(48))"` |
   | `ADMIN_USERNAME` | your admin username |
   | `ADMIN_PASSWORD` | a strong password |
   | `SITE_URL` | `https://wekesawgodwin.com` (the default; used in the sitemap) |

   The app **refuses to start** if `SECRET_KEY` or `ADMIN_PASSWORD` are left at their
   placeholder values, so nobody can log in with a default password.
5. Deploy. Railway checks `/api/health` before switching traffic to the new version.
   On first boot the database is migrated and filled with starter content, which you then edit from `/admin`.
6. Under **Settings → Networking**, click **Generate Domain** to get a `*.up.railway.app` URL for testing.

## Connect wekesawgodwin.com

1. In the web service open **Settings → Networking → Custom Domain** and add `wekesawgodwin.com`.
   Add `www.wekesawgodwin.com` as well; the app automatically redirects `www` to the bare domain.
2. Railway shows the DNS records to create (a **CNAME** pointing at your `*.up.railway.app`
   target, and sometimes a **TXT** record for verification). Add them at your domain registrar / DNS provider.
   - A CNAME on the **root** domain (`@`) needs a provider that supports CNAME flattening or
     ALIAS/ANAME records. Cloudflare supports this for free. If your registrar doesn't, move
     DNS to Cloudflare, or use `www` as the primary domain.
   - If you use Cloudflare's proxy (orange cloud), set **SSL/TLS mode to Full**.
3. Wait for Railway to show the domain as verified. It issues the HTTPS certificate automatically.
4. Optional: submit `https://wekesawgodwin.com/sitemap.xml` in Google Search Console.

## After the first deploy

1. Go to `https://wekesawgodwin.com/admin` and sign in.
2. **Profile**: add your photo, bio, email, phone, LinkedIn, etc.
3. Replace the starter **skills** and **services** (seeded as placeholders) with your own.
4. Add **projects** with cover images, using the Upload button in the form.
5. Upload your **resume** (PDF) to enable the Download CV buttons.
6. When you finish a client job, create a **review link** under Reviews and send it to the client.
