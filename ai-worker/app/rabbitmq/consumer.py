"""RabbitMQ consumer for asynchronous threat evaluation events."""

from __future__ import annotations

import asyncio
import json
from typing import Any
from uuid import uuid4

from aio_pika import IncomingMessage
from pydantic import ValidationError

from app.config.settings import settings
from app.core.logging import get_logger
from app.rabbitmq.connection import rabbitmq
from app.schemas.threat_event import ThreatEvent
from app.services.threat_pipeline import threat_pipeline

logger = get_logger(__name__)


class ThreatEventConsumer:
    """Consumes AMQP events and runs the AI threat pipeline."""

    def __init__(self) -> None:
        self._task: asyncio.Task[None] | None = None
        self._stopping = asyncio.Event()

    async def start(self) -> None:
        if self._task and not self._task.done():
            logger.warning("Threat event consumer is already running.")
            return
        self._stopping.clear()
        self._task = asyncio.create_task(self._consume(), name="threat-event-consumer")

    async def stop(self) -> None:
        self._stopping.set()
        if self._task and not self._task.done():
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                logger.info("Threat event consumer stopped.")
        self._task = None

    async def _consume(self) -> None:
        if rabbitmq.channel is None:
            raise RuntimeError("RabbitMQ channel is not initialized.")

        queue = await rabbitmq.channel.declare_queue(
            settings.QUEUE_NAME,
            durable=True,
            arguments={
                "x-dead-letter-exchange": "",
                "x-dead-letter-routing-key": settings.DLQ_QUEUE_NAME,
            },
        )
        logger.info("Started consuming RabbitMQ queue '%s'.", settings.QUEUE_NAME)

        async with queue.iterator() as queue_iter:
            async for message in queue_iter:
                if self._stopping.is_set():
                    break
                await self._handle_message(message)

    async def _handle_message(self, message: IncomingMessage) -> None:
        retry_count = self._extract_retry_count(message)
        try:
            payload = json.loads(message.body.decode("utf-8"))
            event = self._coerce_event(payload)
            await threat_pipeline.process_event(event)
            await message.ack()
        except ValidationError as exc:
            logger.error("Dropping invalid threat event: %s", exc)
            await message.reject(requeue=False)
        except json.JSONDecodeError as exc:
            logger.error("Dropping malformed JSON message: %s", exc)
            await message.reject(requeue=False)
        except Exception:
            logger.exception("Threat event processing failed.")
            if retry_count >= settings.MAX_RETRIES:
                logger.error(
                    "Retry limit reached (%d); routing message to DLQ.",
                    settings.MAX_RETRIES,
                )
                await message.reject(requeue=False)
                return

            delay = settings.RETRY_DELAY * (2**retry_count)
            logger.warning("Requeueing message after %.1fs (retry %d).", delay, retry_count + 1)
            await asyncio.sleep(delay)
            await message.nack(requeue=True)

    def _extract_retry_count(self, message: IncomingMessage) -> int:
        headers = message.headers or {}
        death = headers.get("x-death")
        if isinstance(death, list) and death:
            return int(death[0].get("count", 0))
        return int(headers.get("x-retry-count", 0))

    def _coerce_event(self, payload: dict[str, Any]) -> ThreatEvent:
        event_payload = {
            "event_id": str(payload.get("event_id") or payload.get("eventId") or uuid4()),
            "correlation_id": str(
                payload.get("correlation_id")
                or payload.get("correlationId")
                or payload.get("request_id")
                or payload.get("requestId")
                or uuid4()
            ),
            "user_id": str(payload.get("user_id") or payload.get("userId") or payload.get("email") or "unknown"),
            "origin_ip": payload.get("origin_ip") or payload.get("originIp") or payload.get("ip") or "127.0.0.1",
            "payload_text": str(
                payload.get("payload_text")
                or payload.get("payloadText")
                or payload.get("message")
                or payload.get("email")
                or ""
            ),
            "burst_velocity": float(payload.get("burst_velocity") or payload.get("burstVelocity") or 0.0),
            "target_recipient_ratio": float(
                payload.get("target_recipient_ratio") or payload.get("targetRecipientRatio") or 0.0
            ),
            "uri_hyperlink_density": float(
                payload.get("uri_hyperlink_density") or payload.get("uriHyperlinkDensity") or 0.0
            ),
            "session_dwell_duration": float(
                payload.get("session_dwell_duration") or payload.get("sessionDwellDuration") or 0.0
            ),
        }
        return ThreatEvent.model_validate(event_payload)

    def is_running(self) -> bool:
        return self._task is not None and not self._task.done()


threat_event_consumer = ThreatEventConsumer()
