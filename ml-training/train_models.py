"""Offline training orchestrator for the Trust & Safety ML artifacts."""

from __future__ import annotations

import json
import logging
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from datasets.dataset_manager import DatasetManager
from training.isolation_forest_trainer import IsolationForestTrainer
from training.nlp_trainer import NLPTrainer


class TrainingOrchestrator:
    """Coordinates dataset preparation, model training, and artifact verification."""

    def __init__(self) -> None:
        self.base_dir = Path(__file__).resolve().parent
        self.start_time = time.perf_counter()
        self.status = "FAILED"
        self.dataset_size = 0
        self.number_of_raw_datasets = 0
        self.feature_columns: list[str] = []
        self.generated_models = [
            self.base_dir / "models" / "tfidf.joblib",
            self.base_dir / "models" / "naive_bayes.joblib",
            self.base_dir / "models" / "isolation_forest.joblib",
            self.base_dir / "models" / "behavior_scaler.joblib",
            self.base_dir / "models" / "model_metadata.json",
            self.base_dir / "models" / "iforest_metadata.json",
        ]
        self.generated_reports = [
            self.base_dir / "reports" / "metrics.json",
            self.base_dir / "reports" / "classification_report.txt",
            self.base_dir / "reports" / "isolation_forest_metrics.json",
            self.base_dir / "reports" / "training_summary.json",
        ]
        self._configure_logging()

    def _configure_logging(self) -> None:
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s - %(levelname)s - %(name)s - %(message)s",
            handlers=[logging.StreamHandler(sys.stdout)],
        )
        self.logger = logging.getLogger(self.__class__.__name__)

    def _create_directories(self) -> None:
        for directory in [
            self.base_dir / "datasets" / "raw",
            self.base_dir / "datasets" / "processed",
            self.base_dir / "models",
            self.base_dir / "reports",
        ]:
            directory.mkdir(parents=True, exist_ok=True)

    def _discover_datasets(self) -> list[str]:
        raw_dir = self.base_dir / "datasets" / "raw"
        file_paths = sorted(raw_dir.glob("*.csv"))
        if not file_paths:
            raise FileNotFoundError(f"No raw CSV datasets found in {raw_dir}")

        self.number_of_raw_datasets = len(file_paths)
        self.logger.info("Discovered %d raw dataset(s).", self.number_of_raw_datasets)
        return [str(path) for path in file_paths]

    def _build_master_dataset(self, file_paths: list[str]) -> None:
        output_path = self.base_dir / "datasets" / "processed" / "text_dataset.csv"
        manager = DatasetManager(output_path=output_path)
        master_df = manager.build_master_dataset(file_paths)
        manager.export_dataset(master_df)

        self.dataset_size = len(master_df)
        self.feature_columns = list(master_df.columns)
        self.logger.info("Built processed dataset with %d rows.", self.dataset_size)

    def _run_trainers(self) -> None:
        self.logger.info("Starting NLP trainer.")
        NLPTrainer().run()
        self.logger.info("Starting Isolation Forest trainer.")
        IsolationForestTrainer().run()

    def _verify_artifacts(self) -> None:
        for path in self.generated_models + self.generated_reports[:-1]:
            if not path.exists():
                raise RuntimeError(f"Missing expected artifact: {path}")
            if path.stat().st_size == 0:
                raise RuntimeError(f"Expected artifact is empty: {path}")
        self.logger.info("Verified model and report artifacts.")

    def _write_summary(self, error: Exception | None = None) -> None:
        summary: dict[str, Any] = {
            "status": self.status,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "execution_time_seconds": round(time.perf_counter() - self.start_time, 3),
            "training_dataset_size": self.dataset_size,
            "number_of_raw_datasets": self.number_of_raw_datasets,
            "feature_columns": self.feature_columns,
            "generated_models": [path.name for path in self.generated_models],
            "generated_reports": [path.name for path in self.generated_reports],
            "error": str(error) if error else None,
        }
        summary_path = self.base_dir / "reports" / "training_summary.json"
        summary_path.parent.mkdir(parents=True, exist_ok=True)
        with summary_path.open("w", encoding="utf-8") as file:
            json.dump(summary, file, indent=4)

    def run_pipeline(self) -> None:
        error: Exception | None = None
        try:
            self._create_directories()
            self._build_master_dataset(self._discover_datasets())
            self._run_trainers()
            self._verify_artifacts()
            self.status = "SUCCESS"
            self.logger.info("Training pipeline completed successfully.")
        except Exception as exc:
            error = exc
            self.logger.exception("Training pipeline failed.")
            raise
        finally:
            self._write_summary(error)


def main() -> None:
    TrainingOrchestrator().run_pipeline()


if __name__ == "__main__":
    main()
