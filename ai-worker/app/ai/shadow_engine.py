"""Optional local Ollama shadow analysis for borderline threat payloads."""

from __future__ import annotations

from dataclasses import asdict, dataclass

from app.config.settings import settings
from app.core.logging import get_logger
from app.services.ollama_client import ollama_client

logger = get_logger(__name__)

SECURITY_PROMPT = (
    "Instruction: You are an internal enterprise Trust & Safety System Security Agent. "
    "Examine this borderline user text payload for advanced social engineering, account "
    "takeover patterns, or credential harvesting hooks: '{payload_text}'. "
    "Output MUST be in a valid JSON format. Do not include markdown code wrapping. "
    "JSON Keys: 'is_malicious' (boolean), 'confidence_score' (float between 0.0 and 1.0), "
    "and 'reason' (string)."
)


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
    """Runs optional LLM review for borderline cases without overriding ML decisions."""

    async def evaluate(self, payload_text: str) -> ShadowEvaluation:
        if not settings.OLLAMA_HOST or not settings.OLLAMA_MODEL:
            return self.disabled("Ollama is not configured.")

        if not ollama_client.is_initialized:
            return ShadowEvaluation(
                enabled=True,
                completed=False,
                is_malicious=False,
                confidence_score=0.0,
                reason="Shadow evaluation unavailable.",
            )

        prompt = SECURITY_PROMPT.format(payload_text=payload_text)

        try:
            parsed = await ollama_client.generate_json(prompt)
        except Exception as exc:
            logger.warning("Shadow evaluation skipped: %s", exc)
            return ShadowEvaluation(
                enabled=True,
                completed=False,
                is_malicious=False,
                confidence_score=0.0,
                reason="Shadow evaluation unavailable.",
            )

        confidence = max(0.0, min(1.0, float(parsed.get("confidence_score", 0.0))))
        return ShadowEvaluation(
            enabled=True,
            completed=True,
            is_malicious=bool(parsed.get("is_malicious", False)),
            confidence_score=confidence,
            reason=str(parsed.get("reason", "No reason supplied.")),
        )

    async def health_check(self) -> bool:
        return await ollama_client.health_check()

    def disabled(self, reason: str) -> ShadowEvaluation:
        return ShadowEvaluation(
            enabled=False,
            completed=False,
            is_malicious=False,
            confidence_score=0.0,
            reason=reason,
        )


shadow_engine = ShadowEngine()
