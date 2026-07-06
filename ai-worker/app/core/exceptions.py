"""Application-wide exception types and FastAPI handlers."""

from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.ai.model_loader import ModelArtifactError
from app.core.logging import get_logger

logger = get_logger(__name__)


class PayloadTooLargeError(ValueError):
    """Raised when an incoming payload exceeds configured limits."""


class ServiceUnavailableError(RuntimeError):
    """Raised when a required dependency is unavailable."""


def register_exception_handlers(app: FastAPI) -> None:
    """Attach standardized exception handlers to the FastAPI application."""

    @app.exception_handler(ModelArtifactError)
    async def model_artifact_handler(
        _request: Request,
        exc: ModelArtifactError,
    ) -> JSONResponse:
        logger.error("Model artifact error: %s", exc)
        return JSONResponse(status_code=503, content={"detail": str(exc)})

    @app.exception_handler(PayloadTooLargeError)
    async def payload_too_large_handler(
        _request: Request,
        exc: PayloadTooLargeError,
    ) -> JSONResponse:
        return JSONResponse(status_code=413, content={"detail": str(exc)})

    @app.exception_handler(ServiceUnavailableError)
    async def service_unavailable_handler(
        _request: Request,
        exc: ServiceUnavailableError,
    ) -> JSONResponse:
        return JSONResponse(status_code=503, content={"detail": str(exc)})

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(
        request: Request,
        exc: Exception,
    ) -> JSONResponse:
        logger.exception("Unhandled exception on %s.", request.url.path)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error."},
        )
