"""FastAPI application entry point for the Trust & Safety AI Worker."""

from __future__ import annotations

from fastapi import FastAPI

from app.api.health import router as health_router
from app.api.shadow import router as shadow_router
from app.config.settings import settings
from app.core.exceptions import register_exception_handlers
from app.core.lifespan import lifespan
from app.core.middleware import register_middleware

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

register_middleware(app)
register_exception_handlers(app)

app.include_router(health_router, prefix="/api/v1")
app.include_router(shadow_router, prefix="/api/v1")


@app.get("/")
async def root() -> dict[str, str]:
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
    }
