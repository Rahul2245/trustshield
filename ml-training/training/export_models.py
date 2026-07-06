"""Artifact export helpers for deploying trained models to the AI worker."""

from __future__ import annotations

import shutil
from pathlib import Path


REQUIRED_ARTIFACTS = [
    "tfidf.joblib",
    "naive_bayes.joblib",
    "isolation_forest.joblib",
    "behavior_scaler.joblib",
    "model_metadata.json",
    "iforest_metadata.json",
]

 
def export_artifacts(
    source_models_dir: str | Path = "models",
    target_models_dir: str | Path = "../ai-worker/models",
) -> list[Path]:
    """Copy generated model artifacts into the AI worker model directory."""
    source_dir = Path(source_models_dir)
    target_dir = Path(target_models_dir)
    target_dir.mkdir(parents=True, exist_ok=True)

    exported: list[Path] = []
    for artifact_name in REQUIRED_ARTIFACTS:
        source = source_dir / artifact_name
        if not source.exists() or source.stat().st_size == 0:
            raise FileNotFoundError(f"Required artifact is missing or empty: {source}")
        destination = target_dir / artifact_name
        shutil.copy2(source, destination)
        exported.append(destination)
    return exported
