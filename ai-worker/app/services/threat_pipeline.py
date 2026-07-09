"""End-to-end asynchronous threat inference pipeline."""

from __future__ import annotations

import time
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from typing import Any

from app.ai.fusion_engine import FusionResult, fusion_engine
from app.ai.isolation_forest import IsolationForestPrediction, isolation_forest_model
from app.ai.nlp_model import NLPPrediction, nlp_model
from app.ai.shadow_engine import ShadowEvaluation, shadow_engine
from app.core.logging import get_logger
from app.database.repository import security_log_repository
from app.ai.model_loader import model_loader
from app.schemas.threat_event import ThreatEvent
from app.schemas.threat_matrix import ThreatMatrix
from app.schemas.webhook import WebhookPayload
from app.services.webhook_service import webhook_service

logger = get_logger(__name__)


@dataclass(frozen=True)
class ThreatPipelineResult:
    """Complete structured output from a processed event."""

    event: dict[str, Any]
    nlp: NLPPrediction
    isolation_forest: IsolationForestPrediction
    fusion: FusionResult
    shadow: ShadowEvaluation
    processing_time_ms: int
    webhook_dispatched: bool

    def model_dump(self) -> dict[str, Any]:
        payload = asdict(self)
        payload["nlp"] = self.nlp.model_dump()
        payload["isolation_forest"] = self.isolation_forest.model_dump()
        payload["fusion"] = self.fusion.model_dump()
        payload["shadow"] = self.shadow.model_dump()
        return payload


class ThreatPipeline:
    """Coordinates model inference, persistence, and callbacks."""

    async def process_event(self, event: ThreatEvent) -> ThreatPipelineResult:
        start = time.perf_counter()

        nlp_prediction = nlp_model.predict(event.payload_text)
        if_prediction = isolation_forest_model.predict(event.payload_text)
        fusion_result = fusion_engine.fuse(
            nlp_risk_score=nlp_prediction.risk_score,
            if_risk_score=if_prediction.risk_score,
        )

        if fusion_result.decision == "SHADOW":
            shadow_result = await shadow_engine.evaluate(event.payload_text)
        else:
            shadow_result = shadow_engine.disabled("Risk score did not require shadow review.")

        processing_time_ms = int((time.perf_counter() - start) * 1000)
        created_at = datetime.now(timezone.utc)
        matrix = ThreatMatrix(
            event_id=event.event_id,
            correlation_id=event.correlation_id,
            user_id=event.user_id,
            tier1_nlp_score=nlp_prediction.risk_score,
            tier2_if_score=if_prediction.risk_score,
            final_fusion_score=fusion_result.risk_score,
            shadow_queue_verdict=str(shadow_result.is_malicious),
            shadow_queue_confidence=shadow_result.confidence_score,
            action_taken=fusion_result.decision,
            processing_time_ms=processing_time_ms,
            model_versions=model_loader.model_versions,
            created_at=created_at,
        )

        document = {
            "input": event.model_dump(mode="json"),
            "prediction": {
                "nlp": nlp_prediction.model_dump(),
                "isolation_forest": if_prediction.model_dump(),
                "fusion": fusion_result.model_dump(),
                "shadow": shadow_result.model_dump(),
            },
            "threat_matrix": matrix.model_dump(mode="json"),
            "created_at": created_at,
        }
        await self._persist(document)

        webhook_payload = WebhookPayload(
            event_id=event.event_id,
            event_type=event.event_type,
            correlation_id=event.correlation_id,
            user_id=event.user_id,
            risk_score=fusion_result.risk_score,
            action=fusion_result.decision,
            timestamp=created_at,
        )
        webhook_dispatched = await webhook_service.dispatch(webhook_payload)

        logger.info(
            "Processed event_id=%s decision=%s risk=%.2f.",
            event.event_id,
            fusion_result.decision,
            fusion_result.risk_score,
        )
        return ThreatPipelineResult(
            event=event.model_dump(mode="json"),
            nlp=nlp_prediction,
            isolation_forest=if_prediction,
            fusion=fusion_result,
            shadow=shadow_result,
            processing_time_ms=processing_time_ms,
            webhook_dispatched=webhook_dispatched,
        )

    async def predict_text(self, payload_text: str) -> dict[str, Any]:
        event = ThreatEvent(
            event_id=f"adhoc-{int(time.time() * 1000)}",
            correlation_id="adhoc",
            user_id="adhoc",
            origin_ip="127.0.0.1",
            payload_text=payload_text,
            burst_velocity=0.0,
            target_recipient_ratio=0.0,
            uri_hyperlink_density=0.0,
            session_dwell_duration=0.0,
        )
        result = await self.process_event(event)
        return result.model_dump()

    async def _persist(self, document: dict[str, Any]) -> None:
        try:
            await security_log_repository.insert_threat_log(document)
        except RuntimeError:
            logger.warning("MongoDB is not connected; skipping threat matrix persistence.")


threat_pipeline = ThreatPipeline()
