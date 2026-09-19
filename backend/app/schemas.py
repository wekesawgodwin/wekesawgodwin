from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, HttpUrl, field_validator


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


def _blank_to_none(value):
    if isinstance(value, str) and not value.strip():
        return None
    return value


# ---------- Auth ----------
class LoginIn(BaseModel):
    username: str
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------- Profile ----------
class ProfileIn(BaseModel):
    full_name: str = Field(max_length=120)
    headline: str = Field("", max_length=200)
    intro: str = ""
    about: str = ""
    email: str = Field("", max_length=200)
    phone: str = Field("", max_length=50)
    location: str = Field("", max_length=120)
    avatar_url: str = Field("", max_length=500)
    github_url: str = Field("", max_length=500)
    linkedin_url: str = Field("", max_length=500)
    twitter_url: str = Field("", max_length=500)
    years_experience: int = Field(0, ge=0, le=80)


class ProfileOut(ProfileIn, ORM):
    id: int


# ---------- Skills ----------
class SkillIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    category: str = Field("General", max_length=100)
    level: int = Field(80, ge=0, le=100)
    sort_order: int = 0


class SkillOut(SkillIn, ORM):
    id: int


# ---------- Services ----------
class ServiceIn(BaseModel):
    title: str = Field(min_length=1, max_length=150)
    description: str = Field(min_length=1)
    cost: str = Field(min_length=1, max_length=100)
    icon: str = Field("code", max_length=50)
    sort_order: int = 0


class ServiceOut(ServiceIn, ORM):
    id: int


# ---------- Projects ----------
class ProjectIn(BaseModel):
    title: str = Field(min_length=1, max_length=150)
    description: str = Field(min_length=1)
    github_url: HttpUrl
    live_url: HttpUrl | None = None
    image_url: str = Field("", max_length=500)
    category: str = Field("Web App", min_length=1, max_length=100)
    tech_stack: str = Field("", max_length=300)
    featured: bool = False
    sort_order: int = 0

    _normalize_live = field_validator("live_url", mode="before")(_blank_to_none)


class ProjectOut(ORM):
    id: int
    title: str
    description: str
    github_url: str
    live_url: str | None
    image_url: str
    category: str
    tech_stack: str
    featured: bool
    sort_order: int
    created_at: datetime


# ---------- Blog ----------
class PostIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    slug: str | None = Field(None, max_length=220)
    excerpt: str = Field("", max_length=500)
    content: str = Field(min_length=1)
    cover_image_url: str = Field("", max_length=500)
    published: bool = False

    _normalize_slug = field_validator("slug", mode="before")(_blank_to_none)


class PostSummary(ORM):
    id: int
    title: str
    slug: str
    excerpt: str
    cover_image_url: str
    published: bool
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime
    comment_count: int = 0


class CommentIn(BaseModel):
    name: str | None = Field(None, max_length=100)
    content: str = Field(min_length=1, max_length=3000)
    website: str = ""  # honeypot: real users never fill this in

    _normalize_name = field_validator("name", mode="before")(_blank_to_none)


class CommentOut(ORM):
    id: int
    name: str | None
    content: str
    created_at: datetime


class AdminCommentOut(CommentOut):
    post_id: int
    post_title: str


class PostOut(PostSummary):
    content: str
    comments: list[CommentOut] = []


# ---------- Contact ----------
class MessageIn(BaseModel):
    name: str = Field("", max_length=120)
    email: EmailStr
    subject: str = Field("", max_length=200)
    body: str = Field(min_length=1, max_length=5000)
    service_id: int | None = None
    website: str = ""  # honeypot


class MessageOut(ORM):
    id: int
    name: str
    email: str
    subject: str
    body: str
    service_id: int | None
    service_title: str | None = None
    is_read: bool
    created_at: datetime


class MessageUpdate(BaseModel):
    is_read: bool


# ---------- Reviews ----------
class InviteIn(BaseModel):
    client_label: str = Field("", max_length=150)


class InviteOut(ORM):
    id: int
    token: str
    client_label: str
    used: bool
    created_at: datetime


class InviteCheck(BaseModel):
    valid: bool
    client_label: str = ""


class ReviewIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    role: str = Field("", max_length=150)
    rating: int = Field(5, ge=1, le=5)
    content: str = Field(min_length=1, max_length=2000)


class ReviewOut(ORM):
    id: int
    name: str
    role: str
    rating: int
    content: str
    approved: bool
    created_at: datetime


class ReviewUpdate(BaseModel):
    approved: bool


# ---------- Resume ----------
class ResumeOut(ORM):
    id: int
    filename: str
    size: int
    uploaded_at: datetime


# ---------- Media ----------
class MediaOut(ORM):
    id: int
    filename: str
    content_type: str
    size: int
    uploaded_at: datetime
    url: str = ""


# ---------- Dashboard ----------
class DashboardStats(BaseModel):
    projects: int
    skills: int
    services: int
    posts: int
    comments: int
    messages: int
    unread_messages: int
    reviews: int
    has_resume: bool
