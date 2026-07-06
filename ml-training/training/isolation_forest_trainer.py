"""Training pipeline for the Tier-2 Isolation Forest anomaly detector."""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

from training.feature_engineering import feature_generator
from training.preprocessing import preprocessor

logger = logging.getLogger(__name__)

MODEL_VERSION = "1.0.0"
RANDOM_SEED = 42


class IsolationForestTrainer:
    """Builds the structural anomaly model and its feature scaler."""

    EXPECTED_FEATURES = [
        "burst_velocity",
        "target_recipient_ratio",
        "uri_hyperlink_density",
        "session_dwell_duration",
        "word_count",
        "character_count",
        "uppercase_ratio",
        "special_character_ratio",
        "url_count",
    ]

    def __init__(
        self,
        dataset_path: str | Path = "datasets/processed/text_dataset.csv",
        model_output_path: str | Path = "models/isolation_forest.joblib",
        scaler_output_path: str | Path = "models/behavior_scaler.joblib",
        report_output_path: str | Path = "reports/isolation_forest_metrics.json",
        metadata_output_path: str | Path = "models/iforest_metadata.json",
    ) -> None:
        self.base_dir = Path(__file__).resolve().parent.parent
        self.dataset_path = self._resolve_path(dataset_path)
        self.model_output_path = self._resolve_path(model_output_path)
        self.scaler_output_path = self._resolve_path(scaler_output_path)
        self.report_output_path = self._resolve_path(report_output_path)
        self.metadata_output_path = self._resolve_path(metadata_output_path)

        self.df: pd.DataFrame | None = None
        self.feature_matrix: np.ndarray | None = None
        self.model: IsolationForest | None = None
        self.scaler: StandardScaler | None = None
        self.metrics: dict[str, Any] = {}

    def _resolve_path(self, value: str | Path) -> Path:
        path = Path(value)
        return path if path.is_absolute() else self.base_dir / path

    def load_dataset(self) -> None:
        if not self.dataset_path.exists():
            raise FileNotFoundError(f"Dataset not found: {self.dataset_path}")
        self.df = pd.read_csv(self.dataset_path)
        logger.info("Loaded Isolation Forest dataset with %d rows.", len(self.df))

    def preprocess(self) -> None:
        if self.df is None:
            raise RuntimeError("Dataset must be loaded before preprocessing.")
        self.df = preprocessor.clean_dataframe(self.df)

    def engineer_features(self) -> None:
        if self.df is None:
            raise RuntimeError("Dataset must be loaded before feature engineering.")
        self.df = feature_generator.generate_features(self.df)

    def prepare_feature_matrix(self) -> None:
        if self.df is None:
            raise RuntimeError("Dataset must be loaded before matrix preparation.")

        missing = [column for column in self.EXPECTED_FEATURES if column not in self.df.columns]
        if missing:
            raise ValueError(f"Missing Isolation Forest features: {missing}")

        feature_df = self.df[self.EXPECTED_FEATURES]
        if feature_df.isnull().values.any():
            raise ValueError("Isolation Forest features contain null values.")

        non_numeric = [
            column
            for column in feature_df.columns
            if not pd.api.types.is_numeric_dtype(feature_df[column])
        ]
        if non_numeric:
            raise ValueError(f"Isolation Forest features must be numeric: {non_numeric}")

        self.scaler = StandardScaler()
        self.feature_matrix = self.scaler.fit_transform(feature_df.to_numpy(dtype=float))
        logger.info("Prepared Isolation Forest feature matrix: %s.", self.feature_matrix.shape)

    def train(self) -> None:
        if self.feature_matrix is None:
            raise RuntimeError("Feature matrix must be prepared before training.")

        self.model = IsolationForest(
            n_estimators=300,
            max_samples="auto",
            contamination="auto",
            bootstrap=False,
            n_jobs=-1,
            random_state=RANDOM_SEED,
        )
        self.model.fit(self.feature_matrix)
        logger.info("Isolation Forest model trained.")

    def evaluate(self) -> None:
        if self.model is None or self.feature_matrix is None or self.df is None:
            raise RuntimeError("Model and feature matrix are required for evaluation.")

        predictions = self.model.predict(self.feature_matrix)
        scores = self.model.score_samples(self.feature_matrix)
        normal_count = int(np.sum(predictions == 1))
        anomaly_count = int(np.sum(predictions == -1))
        total = len(self.feature_matrix)
        p25, p50, p75 = np.percentile(scores, [25, 50, 75])
        feature_df = self.df[self.EXPECTED_FEATURES]

        self.metrics = {
            "number_of_samples": total,
            "number_predicted_normal": normal_count,
            "number_predicted_anomaly": anomaly_count,
            "contamination_percentage": float((anomaly_count / total) * 100 if total else 0.0),
            "mean_score": float(np.mean(scores)),
            "std_score": float(np.std(scores)),
            "min_score": float(np.min(scores)),
            "max_score": float(np.max(scores)),
            "score_percentiles": {
                "25th": float(p25),
                "50th": float(p50),
                "75th": float(p75),
            },
            "feature_statistics": {
                column: {
                    "mean": float(feature_df[column].mean()),
                    "std": float(feature_df[column].std()),
                    "min": float(feature_df[column].min()),
                    "max": float(feature_df[column].max()),
                }
                for column in self.EXPECTED_FEATURES
            },
        }

    def save_artifacts(self) -> None:
        if self.model is None or self.scaler is None or self.feature_matrix is None:
            raise RuntimeError("Model, scaler, and feature matrix are required before saving.")
        if not self.metrics:
            raise RuntimeError("Metrics are required before saving.")

        self.model_output_path.parent.mkdir(parents=True, exist_ok=True)
        self.scaler_output_path.parent.mkdir(parents=True, exist_ok=True)
        self.report_output_path.parent.mkdir(parents=True, exist_ok=True)
        self.metadata_output_path.parent.mkdir(parents=True, exist_ok=True)

        joblib.dump(self.model, self.model_output_path)
        joblib.dump(self.scaler, self.scaler_output_path)

        with self.report_output_path.open("w", encoding="utf-8") as file:
            json.dump(self.metrics, file, indent=4)

        metadata = {
            "version": MODEL_VERSION,
            "training_timestamp": datetime.now(timezone.utc).isoformat(),
            "algorithm": "IsolationForest",
            "feature_order": self.EXPECTED_FEATURES,
            "feature_count": len(self.EXPECTED_FEATURES),
            "dataset_size": len(self.feature_matrix),
            "random_state": RANDOM_SEED,
            "n_estimators": 300,
            "contamination": "auto",
            "uses_scaler": True,
            "scaler_name": self.scaler_output_path.name,
            "score_range": {
                "min": self.metrics["min_score"],
                "max": self.metrics["max_score"],
                "mean": self.metrics["mean_score"],
            },
        }
        with self.metadata_output_path.open("w", encoding="utf-8") as file:
            json.dump(metadata, file, indent=4)

        logger.info("Saved Isolation Forest artifacts to %s.", self.model_output_path.parent)

    def run(self) -> None:
        self.load_dataset()
        self.preprocess()
        self.engineer_features()
        self.prepare_feature_matrix()
        self.train()
        self.evaluate()
        self.save_artifacts()


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )
    IsolationForestTrainer().run()


if __name__ == "__main__":
    main()
