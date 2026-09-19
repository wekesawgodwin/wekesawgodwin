from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://portfolio:portfolio@localhost:5432/portfolio"
    secret_key: str = "change-me"
    admin_username: str = "admin"
    admin_password: str = "change-me"
    access_token_minutes: int = 60 * 12
    cors_origins: str = "http://localhost:5173"
    static_dir: str = "static"
    max_resume_mb: int = 10
    max_image_mb: int = 5
    site_url: str = "https://wekesawgodwin.com"

    @property
    def sqlalchemy_url(self) -> str:
        # Railway provides postgres:// or postgresql:// URLs; SQLAlchemy needs the driver named.
        url = self.database_url
        for prefix in ("postgres://", "postgresql://"):
            if url.startswith(prefix):
                return "postgresql+psycopg://" + url[len(prefix):]
        return url

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
