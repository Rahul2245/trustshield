"""FastAPI application entry point for the Trust & Safety AI Worker."""

from __future__ import annotations

from fastapi import FastAPI

from app.api.health import router as health_router
from app.config.settings import settings
from app.core.lifespan import lifespan

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)
app.include_router(health_router, prefix="/api/v1")


@app.get("/")
async def root() -> dict[str, str]:
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
    }
