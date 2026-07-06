"""Thread-safe lazy loader for Trust & Safety inference artifacts."""

from __future__ import annotations

import json
from pathlib import Path
from threading import Lock
from typing import Any

import joblib
from sklearn.ensemble import IsolationForest
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.preprocessing import StandardScaler

from app.config.settings import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class ModelArtifactError(RuntimeError):
    """Raised when required ML artifacts are missing or invalid."""


class ModelLoader:
    """Loads and caches trained model artifacts for inference."""

    def __init__(self) -> None:
        self._vectorizer: TfidfVectorizer | None = None
        self._naive_bayes: MultinomialNB | None = None
        self._isolation_forest: IsolationForest | None = None
        self._scaler: StandardScaler | None = None
        self._model_metadata: dict[str, Any] = {}
        self._iforest_metadata: dict[str, Any] = {}
        self._is_loaded = False
        self._last_error: str | None = None
        self._lock = Lock()

    def _load_json(self, path: Path) -> dict[str, Any]:
        if not path.exists():
            return {}
        with path.open("r", encoding="utf-8") as file:
            data = json.load(file)
        if not isinstance(data, dict):
            raise ModelArtifactError(f"Metadata file must contain a JSON object: {path}")
        return data

    def _validate_paths(self, required_paths: dict[str, Path]) -> None:
        missing = [f"{name}: {path}" for name, path in required_paths.items() if not path.exists()]
        empty = [
            f"{name}: {path}"
            for name, path in required_paths.items()
            if path.exists() and path.stat().st_size == 0
        ]
        if missing or empty:
            details = []
            if missing:
                details.append("missing=" + "; ".join(missing))
            if empty:
                details.append("empty=" + "; ".join(empty))
            raise ModelArtifactError("Invalid model artifacts: " + " | ".join(details))

    def load_models(self, force_reload: bool = False) -> None:
        """Load all required artifacts once, or reload them when requested."""
        if self._is_loaded and not force_reload:
            return

        with self._lock:
            if self._is_loaded and not force_reload:
                return

            model_dir = Path(settings.MODEL_DIRECTORY)
            required_paths = {
                "TF-IDF vectorizer": model_dir / settings.TFIDF_MODEL_PATH,
                "Naive Bayes model": model_dir / settings.NB_MODEL_PATH,
                "Isolation Forest model": model_dir / settings.IF_MODEL_PATH,
            }

            try:
                self._validate_paths(required_paths)

                scaler_path = model_dir / settings.SCALER_MODEL_PATH
                model_metadata_path = model_dir / settings.MODEL_METADATA_PATH
                iforest_metadata_path = model_dir / settings.IFOREST_METADATA_PATH

                vectorizer = joblib.load(required_paths["TF-IDF vectorizer"])
                naive_bayes = joblib.load(required_paths["Naive Bayes model"])
                isolation_forest = joblib.load(required_paths["Isolation Forest model"])
                scaler = joblib.load(scaler_path) if scaler_path.exists() and scaler_path.stat().st_size else None

                if not hasattr(vectorizer, "transform"):
                    raise ModelArtifactError("TF-IDF artifact does not expose transform().")
                if not hasattr(naive_bayes, "predict_proba"):
                    raise ModelArtifactError("Naive Bayes artifact does not expose predict_proba().")
                if not hasattr(isolation_forest, "score_samples"):
                    raise ModelArtifactError("Isolation Forest artifact does not expose score_samples().")
                if scaler is not None and not hasattr(scaler, "transform"):
                    raise ModelArtifactError("Scaler artifact does not expose transform().")

                self._vectorizer = vectorizer
                self._naive_bayes = naive_bayes
                self._isolation_forest = isolation_forest
                self._scaler = scaler
                self._model_metadata = self._load_json(model_metadata_path)
                self._iforest_metadata = self._load_json(iforest_metadata_path)
                self._is_loaded = True
                self._last_error = None
                logger.info("Loaded ML artifacts from %s.", model_dir)
            except Exception as exc:
                self._vectorizer = None
                self._naive_bayes = None
                self._isolation_forest = None
                self._scaler = None
                self._model_metadata = {}
                self._iforest_metadata = {}
                self._is_loaded = False
                self._last_error = str(exc)
                logger.exception("Failed to load ML artifacts.")
                raise ModelArtifactError("Fatal error loading ML artifacts.") from exc

    def reload(self) -> None:
        self.load_models(force_reload=True)

    def health(self) -> dict[str, Any]:
        model_dir = Path(settings.MODEL_DIRECTORY)
        artifacts = {
            "tfidf": model_dir / settings.TFIDF_MODEL_PATH,
            "naive_bayes": model_dir / settings.NB_MODEL_PATH,
            "isolation_forest": model_dir / settings.IF_MODEL_PATH,
            "scaler": model_dir / settings.SCALER_MODEL_PATH,
            "model_metadata": model_dir / settings.MODEL_METADATA_PATH,
            "iforest_metadata": model_dir / settings.IFOREST_METADATA_PATH,
        }
        return {
            "loaded": self._is_loaded,
            "last_error": self._last_error,
            "model_directory": str(model_dir),
            "artifacts": {
                name: {
                    "path": str(path),
                    "exists": path.exists(),
                    "size_bytes": path.stat().st_size if path.exists() else 0,
                }
                for name, path in artifacts.items()
            },
            "versions": self.model_versions,
        }

    @property
    def is_loaded(self) -> bool:
        return self._is_loaded

    @property
    def vectorizer(self) -> TfidfVectorizer:
        if not self._is_loaded:
            self.load_models()
        assert self._vectorizer is not None
        return self._vectorizer

    @property
    def naive_bayes(self) -> MultinomialNB:
        if not self._is_loaded:
            self.load_models()
        assert self._naive_bayes is not None
        return self._naive_bayes

    @property
    def isolation_forest(self) -> IsolationForest:
        if not self._is_loaded:
            self.load_models()
        assert self._isolation_forest is not None
        return self._isolation_forest

    @property
    def scaler(self) -> StandardScaler | None:
        if not self._is_loaded:
            self.load_models()
        return self._scaler

    @property
    def iforest_feature_order(self) -> list[str]:
        feature_order = self._iforest_metadata.get("feature_order", [])
        return list(feature_order) if isinstance(feature_order, list) else []

    @property
    def iforest_metadata(self) -> dict[str, Any]:
        return dict(self._iforest_metadata)

    @property
    def model_versions(self) -> dict[str, str]:
        return {
            "nlp": str(self._model_metadata.get("version", "unknown")),
            "isolation_forest": str(self._iforest_metadata.get("version", "unknown")),
        }


model_loader = ModelLoader()
