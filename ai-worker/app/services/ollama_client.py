"""Shared Ollama HTTP client with pooling, retries, and health checks."""

from __future__ import annotations

import asyncio
import json
from typing import Any

import httpx

from app.config.settings import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class OllamaClient:
    """Manages a reusable async HTTP client for local Ollama inference."""

    def __init__(self) -> None:
        self._client: httpx.AsyncClient | None = None

    @property
    def is_initialized(self) -> bool:
        return self._client is not None

    async def start(self) -> None:
        if self._client is not None:
            return
        self._client = httpx.AsyncClient(
            base_url=str(settings.OLLAMA_HOST).rstrip("/"),
            timeout=settings.OLLAMA_TIMEOUT,
            limits=httpx.Limits(max_connections=10, max_keepalive_connections=5),
        )
        logger.info("Ollama HTTP client initialized.")

    async def stop(self) -> None:
        if self._client is not None:
            await self._client.aclose()
            self._client = None
            logger.info("Ollama HTTP client closed.")

    async def health_check(self) -> bool:
        if self._client is None:
            return False
        try:
            response = await self._client.get("/api/tags")
            response.raise_for_status()
            return True
        except Exception:
            logger.warning("Ollama health check failed.", exc_info=True)
            return False

    async def generate_json(
        self,
        prompt: str,
        *,
        model: str | None = None,
    ) -> dict[str, Any]:
        """Run a structured JSON generation request with retry logic."""
        if self._client is None:
            raise RuntimeError("Ollama client is not initialized.")

        selected_model = model or settings.OLLAMA_MODEL
        payload = {
            "model": selected_model,
            "prompt": prompt,
            "format": "json",
            "stream": False,
        }

        last_error: Exception | None = None
        for attempt in range(settings.OLLAMA_MAX_RETRIES + 1):
            try:
                response = await self._client.post("/api/generate", json=payload)
                response.raise_for_status()
                body = response.json()
                raw_text = str(body.get("response", "")).strip()
                parsed = json.loads(raw_text)
                if not isinstance(parsed, dict):
                    raise ValueError("Ollama response JSON must be an object.")
                return parsed
            except Exception as exc:
                last_error = exc
                if attempt >= settings.OLLAMA_MAX_RETRIES:
                    break
                delay = settings.OLLAMA_RETRY_DELAY * (2**attempt)
                logger.warning(
                    "Ollama request failed (attempt %d/%d); retrying in %.1fs.",
                    attempt + 1,
                    settings.OLLAMA_MAX_RETRIES + 1,
                    delay,
                )
                await asyncio.sleep(delay)

        raise RuntimeError("Ollama request failed after retries.") from last_error


ollama_client = OllamaClient()
