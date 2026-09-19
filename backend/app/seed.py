"""Fills a brand-new database with starter content so the site isn't empty on first deploy.

Runs on every container start but only does anything when the profile table is empty,
so content you later edit or delete from the admin dashboard is never recreated.
Everything here is placeholder copy: replace it from /admin.
"""

from datetime import datetime, timezone

from sqlalchemy import select

from . import models
from .database import SessionLocal

PROFILE = dict(
    full_name="Wekesa W. Godwin",
    headline="Full-Stack Software Engineer",
    intro="I design and build fast, reliable web applications, from the database to the pixels.",
    about=(
        "I'm a full-stack software engineer who enjoys turning ideas into products people "
        "actually use. I work across the stack with Python, FastAPI, React and PostgreSQL, "
        "and ship everything in Docker so it runs the same on my laptop as it does in production.\n\n"
        "Edit this text from the admin dashboard to tell visitors your story."
    ),
    location="Kenya",
    github_url="https://github.com/wekesawgodwin",
    years_experience=3,
)

SKILLS = [
    ("Python", "Backend", 90), ("FastAPI", "Backend", 88), ("PostgreSQL", "Backend", 82),
    ("REST API Design", "Backend", 85),
    ("React", "Frontend", 85), ("JavaScript", "Frontend", 85), ("HTML & CSS", "Frontend", 90),
    ("Docker", "DevOps", 80), ("Git & GitHub", "DevOps", 88), ("Railway / Cloud Deploys", "DevOps", 75),
]

SERVICES = [
    ("Web Application Development", "code",
     "Full-stack web apps built with React and FastAPI: fast, secure, and easy to maintain.",
     "Custom quote"),
    ("API & Backend Engineering", "server",
     "Well-documented REST APIs, database design with PostgreSQL, authentication and integrations.",
     "Custom quote"),
    ("Deployment & DevOps", "cloud",
     "Dockerised apps shipped to the cloud with CI/CD, custom domains, HTTPS and monitoring.",
     "Custom quote"),
]

WELCOME_POST = dict(
    title="Hello, world: how this site is built",
    slug="hello-world",
    excerpt="A quick tour of the stack behind this portfolio: FastAPI, PostgreSQL, React and Docker on Railway.",
    content=(
        "Welcome to my corner of the internet!\n\n"
        "This site is a small full-stack app of its own:\n\n"
        "- **FastAPI** serves a JSON API and the compiled frontend\n"
        "- **PostgreSQL** stores projects, posts, messages and reviews\n"
        "- **React** renders the pages you're looking at\n"
        "- **Docker** packages it all, and **Railway** runs it\n\n"
        "Everything you see is editable from a private admin dashboard, so keeping it fresh "
        "is as easy as writing a post like this one.\n\n"
        "Thanks for stopping by. Feel free to leave a comment below."
    ),
    published=True,
)


def seed() -> None:
    with SessionLocal() as db:
        if db.scalar(select(models.Profile.id).limit(1)) is not None:
            return
        db.add(models.Profile(**PROFILE))
        db.add_all(
            models.Skill(name=n, category=c, level=lvl, sort_order=i)
            for i, (n, c, lvl) in enumerate(SKILLS)
        )
        db.add_all(
            models.Service(title=t, icon=icon, description=d, cost=cost, sort_order=i)
            for i, (t, icon, d, cost) in enumerate(SERVICES)
        )
        db.add(models.Project(
            title="wekesawgodwin.com",
            description=(
                "This portfolio: a FastAPI + PostgreSQL backend serving a React frontend, "
                "with an admin dashboard for projects, blog posts, messages and client reviews. "
                "Deployed with Docker on Railway."
            ),
            github_url="https://github.com/wekesawgodwin/wekesawgodwin",
            live_url="https://wekesawgodwin.com",
            category="Web App",
            tech_stack="FastAPI, PostgreSQL, React, Docker, Railway",
            featured=True,
        ))
        db.add(models.BlogPost(**WELCOME_POST, published_at=datetime.now(timezone.utc)))
        db.commit()
        print("Seeded starter content.")


if __name__ == "__main__":
    seed()
