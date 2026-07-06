"""Tier-2 Isolation Forest inference wrapper."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any

import numpy as np

from app.ai.feature_engineering import feature_generator
from app.ai.model_loader import model_loader


@dataclass(frozen=True)
class IsolationForestPrediction:
    """Structured output from the anomaly detector."""

    prediction: int
    is_anomaly: bool
    raw_score: float
    anomaly_score: float
    risk_score: float
    features: dict[str, float]

    def model_dump(self) -> dict[str, Any]:
        return asdict(self)


class IsolationForestModel:
    """Runs deterministic feature engineering and anomaly inference."""

    def predict(self, text: str) -> IsolationForestPrediction:
        feature_frame = feature_generator.generate_features(text)
        feature_order = model_loader.iforest_feature_order or feature_generator.FEATURE_COLUMNS
        feature_frame = feature_frame[feature_order]
        feature_matrix = feature_frame.to_numpy(dtype=float)

        scaler = model_loader.scaler
        if scaler is not None:
            feature_matrix = scaler.transform(feature_matrix)

        model = model_loader.isolation_forest
        prediction = int(model.predict(feature_matrix)[0])
        raw_score = float(model.score_samples(feature_matrix)[0])
        anomaly_score = self._normalize_anomaly_score(raw_score)

        return IsolationForestPrediction(
            prediction=prediction,
            is_anomaly=prediction == -1,
            raw_score=raw_score,
            anomaly_score=round(anomaly_score, 6),
            risk_score=round(anomaly_score * 100.0, 4),
            features={key: float(value) for key, value in feature_frame.iloc[0].to_dict().items()},
        )

    def _normalize_anomaly_score(self, raw_score: float) -> float:
        score_range = model_loader.iforest_metadata.get("score_range", {})
        min_score = float(score_range.get("min", -0.75))
        max_score = float(score_range.get("max", -0.35))
        if np.isclose(max_score, min_score):
            return 0.0
        normalized = (max_score - raw_score) / (max_score - min_score)
        return float(np.clip(normalized, 0.0, 1.0))


isolation_forest_model = IsolationForestModel()
