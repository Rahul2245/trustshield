"""Webhook client for notifying the Node.js Edge Gateway."""

from __future__ import annotations

import httpx

from app.config.settings import settings
from app.core.logging import get_logger
from app.schemas.webhook import WebhookPayload

logger = get_logger(__name__)


class WebhookService:
    """Sends completed AI evaluation results to the gateway callback URL."""

    async def dispatch(self, payload: WebhookPayload) -> bool:
        try:
            async with httpx.AsyncClient(timeout=settings.WEBHOOK_TIMEOUT) as client:
                response = await client.post(
                    str(settings.GATEWAY_WEBHOOK_URL),
                    json=payload.model_dump(mode="json"),
                )
                response.raise_for_status()
            logger.info("Dispatched webhook for event_id=%s.", payload.event_id)
            return True
        except Exception as exc:
            logger.warning("Webhook dispatch failed for event_id=%s: %s", payload.event_id, exc)
            return False


webhook_service = WebhookService()
