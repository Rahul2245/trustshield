"""Fusion logic for converting model outputs into production decisions."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Literal

from app.config.settings import settings

Decision = Literal["ALLOW", "MONITOR", "SHADOW", "BLOCK"]
RiskLevel = Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]


@dataclass(frozen=True)
class FusionResult:
    """Final risk decision generated from Tier-1 and Tier-2 model outputs."""

    risk_score: float
    confidence: float
    decision: Decision
    risk_level: RiskLevel
    explanation: str

    def model_dump(self) -> dict[str, float | str]:
        return asdict(self)


class FusionEngine:
    """Combines NLP and anomaly risk into a single deterministic decision."""

    def fuse(self, nlp_risk_score: float, if_risk_score: float) -> FusionResult:
        score = (
            nlp_risk_score * settings.NLP_WEIGHT
            + if_risk_score * settings.IF_WEIGHT
        )
        risk_score = round(max(0.0, min(100.0, score)), 4)
        confidence = round(abs(risk_score - 50.0) / 50.0, 4)
        decision = self._decision_for_score(risk_score)
        risk_level = self._risk_level_for_score(risk_score)

        return FusionResult(
            risk_score=risk_score,
            confidence=confidence,
            decision=decision,
            risk_level=risk_level,
            explanation=(
                f"Weighted score from NLP={nlp_risk_score:.2f} "
                f"and anomaly={if_risk_score:.2f} produced {decision}."
            ),
        )

    def _decision_for_score(self, score: float) -> Decision:
        if score > settings.SHADOW_THRESHOLD:
            return "BLOCK"
        if score >= settings.LOW_RISK_THRESHOLD:
            return "SHADOW"
        return "ALLOW"

    def _risk_level_for_score(self, score: float) -> RiskLevel:
        if score > settings.SHADOW_THRESHOLD:
            return "CRITICAL"
        if score >= settings.LOW_RISK_THRESHOLD:
            return "MEDIUM"
        return "LOW"


fusion_engine = FusionEngine()
