"""Operational health and inference API routes."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.ai.model_loader import ModelArtifactError, model_loader
from app.ai.shadow_engine import shadow_engine
from app.config.settings import settings
from app.core.exceptions import PayloadTooLargeError
from app.database.mongodb import mongodb
from app.rabbitmq.connection import rabbitmq
from app.rabbitmq.consumer import threat_event_consumer
from app.services.threat_pipeline import threat_pipeline

router = APIRouter(tags=["ai-worker"])


class PredictionRequest(BaseModel):
    """Ad-hoc text prediction request."""

    payload_text: str = Field(..., min_length=1)


@router.get("/health/live")
async def liveness() -> dict[str, str]:
    return {"status": "alive"}


@router.get("/health/ready")
async def readiness() -> dict[str, Any]:
    mongo_ok = await mongodb.health_check()
    rabbit_ok = rabbitmq.health_check()
    models_ok = model_loader.is_loaded
    ready = mongo_ok and rabbit_ok and models_ok
    return {
        "status": "ready" if ready else "not_ready",
        "mongodb": mongo_ok,
        "rabbitmq": rabbit_ok,
        "models": models_ok,
        "consumer": threat_event_consumer.is_running(),
        "ollama": await shadow_engine.health_check(),
    }


@router.get("/health")
async def health() -> dict[str, Any]:
    return {
        "live": "alive",
        "ready": await readiness(),
        "models": model_loader.health(),
        "ollama": {
            "available": await shadow_engine.health_check(),
            "host": str(settings.OLLAMA_HOST),
            "model": settings.OLLAMA_MODEL,
        },
    }


@router.get("/models/status")
async def model_status() -> dict[str, Any]:
    return model_loader.health()


@router.post("/models/reload")
async def reload_models() -> dict[str, Any]:
    try:
        model_loader.reload()
    except ModelArtifactError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return model_loader.health()


@router.post("/predict")
async def predict(request: PredictionRequest) -> dict[str, Any]:
    encoded_size = len(request.payload_text.encode("utf-8"))
    if encoded_size > settings.MAX_PAYLOAD_BYTES:
        raise PayloadTooLargeError(
            f"Payload exceeds maximum size of {settings.MAX_PAYLOAD_BYTES} bytes."
        )
    try:
        return await threat_pipeline.predict_text(request.payload_text)
    except ModelArtifactError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
