"""Application configuration via Pydantic Settings.

Loads from .env.local first, then .env, then OS environment.
Secrets (GEMINI_API_KEY) are never logged or returned in API responses.
"""
from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(BACKEND_ROOT / ".env", BACKEND_ROOT / ".env.local"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "MindfulSpend AI"
    app_version: str = "1.0.0"
    debug: bool = True

    gemini_api_key: str = Field(default="", description="Google AI Studio API key")
    gemini_model: str = "gemini-2.5-flash"
    use_mock_gemini: bool = False

    database_url: str = f"sqlite:///{BACKEND_ROOT / 'data' / 'mindfulspend.db'}"

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # JWT Authentication
    JWT_SECRET_KEY: str = "mindfulspend-hackathon-2026-secret-key-change-in-prod"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 10080  # 7 days

    data_dir: Path = BACKEND_ROOT / "data"
    models_dir: Path = BACKEND_ROOT / "app" / "ml_models"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def gemini_enabled(self) -> bool:
        """True when a real Gemini API call should be made."""
        return bool(self.gemini_api_key) and not self.use_mock_gemini


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
