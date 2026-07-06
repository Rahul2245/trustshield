"""Shadow queue inspection API aligned with the architecture specification."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.ai.shadow_engine import shadow_engine
from app.core.exceptions import PayloadTooLargeError
from app.config.settings import settings

router = APIRouter(prefix="/ai", tags=["shadow"])


class ThreatPayload(BaseModel):
    """Borderline threat payload submitted for semantic shadow review."""

    user_id: str = Field(..., min_length=1)
    payload_text: str = Field(..., min_length=1)


@router.post("/shadow-inspect")
async def evaluate_shadow_queue_event(data: ThreatPayload) -> dict[str, object]:
    encoded_size = len(data.payload_text.encode("utf-8"))
    if encoded_size > settings.MAX_PAYLOAD_BYTES:
        raise PayloadTooLargeError(
            f"Payload exceeds maximum size of {settings.MAX_PAYLOAD_BYTES} bytes."
        )

    result = await shadow_engine.evaluate(data.payload_text)
    if not result.enabled:
        raise HTTPException(status_code=503, detail=result.reason)
    if not result.completed:
        raise HTTPException(status_code=503, detail=result.reason)

    return {
        "status": "COMPLETED",
        "user_id": data.user_id,
        "verdict": result.is_malicious,
        "score": result.confidence_score,
        "reason": result.reason,
    }
