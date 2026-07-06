"""Optional local Ollama shadow analysis for explanations only."""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass

import httpx

from app.config.settings import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


@dataclass(frozen=True)
class ShadowEvaluation:
    """Non-authoritative LLM explanation result."""

    enabled: bool
    completed: bool
    is_malicious: bool
    confidence_score: float
    reason: str

    def model_dump(self) -> dict[str, bool | float | str]:
        return asdict(self)


class ShadowEngine:
    """Runs optional LLM review for borderline cases without changing decisions."""

    async def evaluate(self, payload_text: str) -> ShadowEvaluation:
        if not settings.OLLAMA_HOST or not settings.OLLAMA_MODEL:
            return self.disabled("Ollama is not configured.")

        prompt = (
            "You are an internal enterprise Trust & Safety Security Agent. "
            "Review the payload for social engineering, account takeover, spam, "
            "credential harvesting, or automated abuse. Return only JSON with "
            "keys is_malicious (boolean), confidence_score (0.0-1.0), and reason. "
            f"Payload: {payload_text!r}"
        )

        try:
            async with httpx.AsyncClient(timeout=settings.OLLAMA_TIMEOUT) as client:
                response = await client.post(
                    f"{str(settings.OLLAMA_HOST).rstrip('/')}/api/generate",
                    json={
                        "model": settings.OLLAMA_MODEL,
                        "prompt": prompt,
                        "stream": False,
                    },
                )
                response.raise_for_status()
                body = response.json()
                raw_text = str(body.get("response", "")).strip()
                parsed = json.loads(raw_text)
        except Exception as exc:
            logger.warning("Shadow evaluation skipped: %s", exc)
            return ShadowEvaluation(
                enabled=True,
                completed=False,
                is_malicious=False,
                confidence_score=0.0,
                reason="Shadow evaluation unavailable.",
            )

        return ShadowEvaluation(
            enabled=True,
            completed=True,
            is_malicious=bool(parsed.get("is_malicious", False)),
            confidence_score=max(0.0, min(1.0, float(parsed.get("confidence_score", 0.0)))),
            reason=str(parsed.get("reason", "No reason supplied.")),
        )

    def disabled(self, reason: str) -> ShadowEvaluation:
        return ShadowEvaluation(
            enabled=False,
            completed=False,
            is_malicious=False,
            confidence_score=0.0,
            reason=reason,
        )


shadow_engine = ShadowEngine()
