"""Training pipeline for the Tier-1 TF-IDF + Naive Bayes classifier."""

from __future__ import annotations

import json
import logging
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import MultinomialNB

from training.preprocessing import preprocessor

logger = logging.getLogger(__name__)

MODEL_VERSION = "1.0.0"
RANDOM_SEED = 42
CLASSIFICATION_THRESHOLD = 0.5


class NLPTrainer:
    """Builds and evaluates the production text classification artifacts."""

    LABEL_MAPPING = {
        "spam": 1,
        "malicious": 1,
        "1": 1,
        "true": 1,
        "ham": 0,
        "safe": 0,
        "normal": 0,
        "0": 0,
        "false": 0,
    }

    def __init__(
        self,
        dataset_path: str | Path | None = None,
        models_dir: str | Path | None = None,
        reports_dir: str | Path | None = None,
    ) -> None:
        self.base_dir = Path(__file__).resolve().parent.parent
        self.dataset_path = Path(dataset_path) if dataset_path else (
            self.base_dir / "datasets" / "processed" / "text_dataset.csv"
        )
        self.models_dir = Path(models_dir) if models_dir else self.base_dir / "models"
        self.reports_dir = Path(reports_dir) if reports_dir else self.base_dir / "reports"

        self.vectorizer = TfidfVectorizer(
            max_features=50000,
            ngram_range=(1, 2),
            min_df=1,
            max_df=0.95,
            strip_accents="unicode",
            sublinear_tf=True,
            dtype=np.float32,
        )
        self.model = MultinomialNB(alpha=0.1)

    def _ensure_directories(self) -> None:
        self.models_dir.mkdir(parents=True, exist_ok=True)
        self.reports_dir.mkdir(parents=True, exist_ok=True)

    def _normalize_labels(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy(deep=True)

        def map_label(value: Any) -> int:
            normalized = str(value).strip().lower()
            if normalized not in self.LABEL_MAPPING:
                raise ValueError(f"Unknown label encountered: {value!r}")
            return self.LABEL_MAPPING[normalized]

        df["label"] = df["label"].apply(map_label)
        return df

    def load_and_prepare_data(self) -> tuple[pd.Series, pd.Series]:
        """Load, clean, validate, and label-normalize the text dataset."""
        if not self.dataset_path.exists():
            raise FileNotFoundError(f"Dataset not found: {self.dataset_path}")

        df = pd.read_csv(self.dataset_path)
        missing = {"text", "label"} - set(df.columns)
        if missing:
            raise ValueError(f"Dataset is missing required columns: {sorted(missing)}")

        cleaned_df = preprocessor.clean_dataframe(df)
        cleaned_df = self._normalize_labels(cleaned_df)

        if cleaned_df["label"].nunique() < 2:
            raise ValueError("NLP training requires at least two label classes.")

        logger.info("Prepared NLP dataset with %d rows.", len(cleaned_df))
        return cleaned_df["text"].astype(str), cleaned_df["label"].astype(int)

    def train(self, x_train: pd.Series, y_train: pd.Series) -> float:
        start = time.perf_counter()
        x_train_vectorized = self.vectorizer.fit_transform(x_train)
        self.model.fit(x_train_vectorized, y_train)
        duration = time.perf_counter() - start
        logger.info("NLP model trained in %.3fs.", duration)
        return duration

    def evaluate(self, x_test: pd.Series, y_test: pd.Series) -> tuple[dict[str, Any], str, float]:
        start = time.perf_counter()
        x_test_vectorized = self.vectorizer.transform(x_test)
        probabilities = self.model.predict_proba(x_test_vectorized)[:, 1]
        predictions = (probabilities >= CLASSIFICATION_THRESHOLD).astype(int)

        metrics = {
            "accuracy": float(accuracy_score(y_test, predictions)),
            "precision": float(precision_score(y_test, predictions, zero_division=0)),
            "recall": float(recall_score(y_test, predictions, zero_division=0)),
            "f1_score": float(f1_score(y_test, predictions, zero_division=0)),
            "roc_auc": float(roc_auc_score(y_test, probabilities)),
            "confusion_matrix": confusion_matrix(y_test, predictions).tolist(),
        }
        report = classification_report(
            y_test,
            predictions,
            target_names=["Safe", "Spam"],
            zero_division=0,
        )
        duration = time.perf_counter() - start
        logger.info("NLP model evaluated in %.3fs.", duration)
        return metrics, report, duration

    def save_artifacts(
        self,
        metrics: dict[str, Any],
        classification_report_text: str,
        total_samples: int,
        train_size: int,
        test_size: int,
        class_distribution: dict[str, int],
        train_duration: float,
        evaluation_duration: float,
        total_runtime: float,
    ) -> None:
        self._ensure_directories()

        joblib.dump(self.vectorizer, self.models_dir / "tfidf.joblib")
        joblib.dump(self.model, self.models_dir / "naive_bayes.joblib")

        timestamp = datetime.now(timezone.utc).isoformat()
        metadata = {
            "version": MODEL_VERSION,
            "model_name": "Tier-1 NLP Spam Classifier",
            "algorithm": "MultinomialNB",
            "vectorizer": "TfidfVectorizer",
            "classification_threshold": CLASSIFICATION_THRESHOLD,
            "random_seed": RANDOM_SEED,
            "feature_count": len(self.vectorizer.vocabulary_),
            "training_samples": total_samples,
            "train_size": train_size,
            "test_size": test_size,
            "class_distribution": class_distribution,
            "metrics": metrics,
            "trained_at": timestamp,
        }

        with (self.models_dir / "model_metadata.json").open("w", encoding="utf-8") as file:
            json.dump(metadata, file, indent=4)
        with (self.reports_dir / "metrics.json").open("w", encoding="utf-8") as file:
            json.dump(metrics, file, indent=4)
        with (self.reports_dir / "classification_report.txt").open("w", encoding="utf-8") as file:
            file.write(classification_report_text)

        summary = {
            "training_timestamp": timestamp,
            "dataset_size": total_samples,
            "train_size": train_size,
            "test_size": test_size,
            "algorithm": "MultinomialNB",
            "vectorizer": "TfidfVectorizer",
            "metrics": metrics,
            "training_duration": train_duration,
            "evaluation_duration": evaluation_duration,
            "total_runtime": total_runtime,
            "class_distribution": class_distribution,
        }
        with (self.reports_dir / "nlp_training_summary.json").open("w", encoding="utf-8") as file:
            json.dump(summary, file, indent=4)

        logger.info("Saved NLP artifacts to %s.", self.models_dir)

    def run(self) -> None:
        start = time.perf_counter()
        x, y = self.load_and_prepare_data()
        x_train, x_test, y_train, y_test = train_test_split(
            x,
            y,
            test_size=0.20,
            random_state=RANDOM_SEED,
            stratify=y,
        )

        train_duration = self.train(x_train, y_train)
        metrics, report, evaluation_duration = self.evaluate(x_test, y_test)
        self.save_artifacts(
            metrics=metrics,
            classification_report_text=report,
            total_samples=len(x),
            train_size=len(x_train),
            test_size=len(x_test),
            class_distribution={
                "safe": int((y == 0).sum()),
                "spam": int((y == 1).sum()),
            },
            train_duration=train_duration,
            evaluation_duration=evaluation_duration,
            total_runtime=time.perf_counter() - start,
        )


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )
    NLPTrainer().run()


if __name__ == "__main__":
    main()
