"""FastAPI application entry point."""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import init_db, close_db
from app.core.exceptions import register_exception_handlers


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables
    await init_db()
    # Ensure storage directories exist
    Path(settings.STORAGE_DIR).mkdir(parents=True, exist_ok=True)
    overlays_dir = Path(settings.STORAGE_DIR) / "overlays"
    overlays_dir.mkdir(parents=True, exist_ok=True)
    yield
    # Shutdown
    await close_db()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/v1/openapi.json",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register exception handlers
register_exception_handlers(app)

# Import and include API v1 router (import after app creation to avoid circular imports)
from app.api.v1.router import api_v1_router  # noqa: E402

app.include_router(api_v1_router, prefix="/api/v1")

# Mount storage for serving generated overlay images
storage_path = Path(settings.STORAGE_DIR)
if storage_path.exists():
    app.mount("/storage", StaticFiles(directory=str(storage_path)), name="storage")


@app.get("/api/v1/health")
async def health_check():
    return {
        "code": 200,
        "status": "ok",
        "version": settings.APP_VERSION,
    }
