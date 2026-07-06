"""FastAPI lifespan orchestration for the AI worker."""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI

from app.ai.model_loader import model_loader
from app.config.settings import settings
from app.core.logging import configure_logging, get_logger
from app.database.mongodb import mongodb
from app.rabbitmq.connection import rabbitmq
from app.rabbitmq.consumer import threat_event_consumer
from app.services.ollama_client import ollama_client

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Initialize and tear down worker dependencies."""
    configure_logging()
    logger.info("Starting %s v%s.", settings.APP_NAME, settings.APP_VERSION)

    if settings.LOAD_MODELS_ON_STARTUP:
        model_loader.load_models()

    await ollama_client.start()

    if settings.CONNECT_SERVICES_ON_STARTUP:
        await mongodb.connect()
        await rabbitmq.connect()
        await threat_event_consumer.start()

    try:
        yield
    finally:
        await threat_event_consumer.stop()
        if settings.CONNECT_SERVICES_ON_STARTUP:
            await rabbitmq.disconnect()
            await mongodb.disconnect()
        await ollama_client.stop()
        logger.info("AI worker shutdown completed.")
