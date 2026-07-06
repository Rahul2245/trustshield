"""HTTP middleware for request validation and correlation tracking."""

from __future__ import annotations

from uuid import uuid4

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from app.config.settings import settings
from app.core.exceptions import PayloadTooLargeError
from app.core.logging import get_logger

logger = get_logger(__name__)


class RequestValidationMiddleware(BaseHTTPMiddleware):
    """Enforces payload size limits and propagates correlation identifiers."""

    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        correlation_id = (
            request.headers.get("x-correlation-id")
            or request.headers.get("X-Correlation-ID")
            or str(uuid4())
        )
        request.state.correlation_id = correlation_id

        content_length = request.headers.get("content-length")
        if content_length is not None:
            try:
                size = int(content_length)
            except ValueError as exc:
                raise PayloadTooLargeError("Invalid Content-Length header.") from exc
            if size > settings.MAX_PAYLOAD_BYTES:
                raise PayloadTooLargeError(
                    f"Payload exceeds maximum size of {settings.MAX_PAYLOAD_BYTES} bytes."
                )

        response = await call_next(request)
        response.headers["X-Correlation-ID"] = correlation_id
        return response


def register_middleware(app) -> None:
    app.add_middleware(RequestValidationMiddleware)
