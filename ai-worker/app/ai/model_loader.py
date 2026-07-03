"""
Machine Learning Model Loader for Trust & Safety AI Worker.

This module is responsible strictly for loading pre-trained machine learning
artifacts from disk into memory. It enforces a read-only, inference-only
environment. No training or fitting operations are permitted here.
"""

from pathlib import Path
from threading import Lock

import joblib
from sklearn.ensemble import IsolationForest
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB

from app.config.settings import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class ModelLoader:
    """
    Singleton-oriented loader responsible for safely and lazily loading
    machine learning artifacts required for inference.
    """

    def __init__(self) -> None:
        """Initialize internal state placeholders."""
        self._vectorizer: TfidfVectorizer | None = None
        self._naive_bayes: MultinomialNB | None = None
        self._isolation_forest: IsolationForest | None = None
        self._is_loaded: bool = False
        self._lock = Lock()

    def load_models(self) -> None:
        """
        Load all required machine learning models from disk exactly once.

        Raises:
            RuntimeError: If any required model file is missing or loading fails.
        """
        if self._is_loaded:
            logger.info("Machine learning models are already loaded.")
            return

        with self._lock:
            # Double-check after acquiring the lock
            if self._is_loaded:
                return

            try:
                model_dir = Path(settings.MODEL_DIRECTORY)

                vectorizer_path = model_dir / settings.TFIDF_MODEL_PATH
                nb_path = model_dir / settings.NB_MODEL_PATH
                if_path = model_dir / settings.IF_MODEL_PATH

                required_paths = {
                    "TF-IDF Vectorizer": vectorizer_path,
                    "Naive Bayes Model": nb_path,
                    "Isolation Forest Model": if_path,
                }

                # Validate model files exist
                for name, path in required_paths.items():
                    if not path.exists():
                        raise RuntimeError(f"{name} not found: {path}")

                # Load artifacts
                self._vectorizer = joblib.load(vectorizer_path)
                logger.info("Loaded TF-IDF Vectorizer from %s", vectorizer_path)

                self._naive_bayes = joblib.load(nb_path)
                logger.info("Loaded Naive Bayes model from %s", nb_path)

                self._isolation_forest = joblib.load(if_path)
                logger.info("Loaded Isolation Forest model from %s", if_path)

                self._is_loaded = True
                logger.info("All machine learning models loaded successfully.")

            except Exception as exc:
                # Reset state to avoid partially initialized objects
                self._vectorizer = None
                self._naive_bayes = None
                self._isolation_forest = None
                self._is_loaded = False

                logger.exception("Failed to load machine learning artifacts.")
                raise RuntimeError(
                    "Fatal error loading machine learning models."
                ) from exc

    def is_loaded(self) -> bool:
        """
        Check whether all machine learning models have been loaded.

        Returns:
            True if all models are available for inference.
        """
        return self._is_loaded

    @property
    def vectorizer(self) -> TfidfVectorizer:
        """Read-only access to the TF-IDF Vectorizer."""
        if not self._is_loaded:
            self.load_models()

        assert self._vectorizer is not None
        return self._vectorizer

    @property
    def naive_bayes(self) -> MultinomialNB:
        """Read-only access to the Naive Bayes classifier."""
        if not self._is_loaded:
            self.load_models()

        assert self._naive_bayes is not None
        return self._naive_bayes

    @property
    def isolation_forest(self) -> IsolationForest:
        """Read-only access to the Isolation Forest model."""
        if not self._is_loaded:
            self.load_models()

        assert self._isolation_forest is not None
        return self._isolation_forest


# Reusable singleton instance
model_loader = ModelLoader()