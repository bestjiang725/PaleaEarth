"""Application configuration via pydantic-settings."""

from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "PaleoEarth Visualizer"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    SECRET_KEY: str = "dev-secret-key-change-in-production"

    # Database — set via env: sqlite+aiosqlite:///... or postgresql+asyncpg://...
    DATABASE_URL: str = "sqlite+aiosqlite:///./paleoearth.db"
    DATABASE_URL_SYNC: str = "sqlite:///./paleoearth.db"

    # Redis (optional, for production Celery)
    REDIS_URL: str = "redis://localhost:6379/0"

    # Data paths
    DATA_DIR: str = str(Path(__file__).parent.parent.parent.parent / "data")
    STORAGE_DIR: str = str(Path(__file__).parent.parent / "storage")

    # Tile rendering
    OVERLAY_WIDTH: int = 2048
    OVERLAY_HEIGHT: int = 1024
    OVERLAY_DPI: int = 100

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
    }


settings = Settings()
