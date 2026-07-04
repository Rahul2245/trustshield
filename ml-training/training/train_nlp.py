
import json
import logging
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Tuple

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

MODEL_VERSION = "1.0.0"
RANDOM_SEED = 42
DEFAULT_CLASSIFICATION_THRESHOLD = 0.5

from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import MultinomialNB

# Import the existing preprocessing singleton as strictly required
from training.preprocessing import preprocessor

# Configure production-grade logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("train_nlp")




class NLPTrainingPipeline:
    """
    Production-grade training pipeline for the Tier-1 NLP Spam Classifier.
    Coordinates data loading, preprocessing, training, evaluation, and artifact generation.
    """

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

    def __init__(self) -> None:
        """Initializes the training pipeline and resolves absolute directory paths."""
        self.base_dir = Path(__file__).resolve().parent.parent
        self.dataset_path = self.base_dir / "datasets" / "processed" / "text_dataset.csv"
        self.models_dir = self.base_dir / "models"
        self.reports_dir = self.base_dir / "reports"

        self._ensure_directories()

        self.vectorizer = TfidfVectorizer(
            max_features=50000,
            ngram_range=(1, 2),
            min_df=5,
            max_df=0.9,
            strip_accents="unicode",
            sublinear_tf=True,
            dtype=np.float32,
        )
        self.model = MultinomialNB(alpha=0.1)

    def _ensure_directories(self) -> None:
        """Ensures that all necessary output directories exist."""
        self.models_dir.mkdir(parents=True, exist_ok=True)
        self.reports_dir.mkdir(parents=True, exist_ok=True)

    def _normalize_labels(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Normalizes dataset labels into strict binary integers (0 and 1).
        Raises ValueError if an unknown label is encountered.
        """
        logger.info("Normalizing Labels")

        def map_label(val: Any) -> int:
            val_str = str(val).strip().lower()
            if val_str not in self.LABEL_MAPPING:
                raise ValueError(f"Unknown label encountered during normalization: '{val}'")
            return self.LABEL_MAPPING[val_str]

        df["label"] = df["label"].apply(map_label)
        return df

    def _compute_and_log_statistics(self, df: pd.DataFrame) -> None:
        """Computes and logs foundational dataset statistics before training."""
        total_samples = len(df)
        spam_samples = int(df["label"].sum())
        safe_samples = total_samples - spam_samples
        spam_ratio = (spam_samples / total_samples) if total_samples > 0 else 0.0

        words_per_text = df["text"].astype(str).apply(lambda x: len(x.split()))
        chars_per_text = df["text"].astype(str).apply(len)

        avg_words = float(words_per_text.mean())
        avg_chars = float(chars_per_text.mean())

        logger.info("--- Dataset Summary ---")
        logger.info(f"Total Samples:  {total_samples}")
        logger.info(f"Spam Samples:   {spam_samples}")
        logger.info(f"Safe Samples:   {safe_samples}")
        logger.info(f"Spam Ratio:     {spam_ratio:.2%}")
        logger.info(f"Average Words:  {avg_words:.2f}")
        logger.info(f"Average Chars:  {avg_chars:.2f}")
        logger.info("-----------------------")

    def load_and_prepare_data(self) -> Tuple[pd.DataFrame, pd.Series]:
        """Loads, cleans, normalizes, and validates the dataset."""
        logger.info(f"Loading Dataset from {self.dataset_path}")
        if not self.dataset_path.exists():
            raise FileNotFoundError(f"Dataset not found at {self.dataset_path}")

        df = pd.read_csv(self.dataset_path)

        if "text" not in df.columns or "label" not in df.columns:
            raise KeyError("Dataset must contain 'text' and 'label' columns.")

        logger.info("Cleaning Dataset via centralized preprocessor")
        df = preprocessor.clean_dataframe(df)

        df = self._normalize_labels(df)
        self._compute_and_log_statistics(df)

        return df["text"].astype(str), df["label"]

    def train_model(
        self, X_train: pd.Series, y_train: pd.Series
    ) -> Tuple[np.ndarray, float]:
        """Vectorizes training text and trains the Multinomial Naive Bayes model."""
        logger.info("Training Model (TF-IDF Vectorization & MultinomialNB)")
        start_time = time.perf_counter()

        X_train_vec = self.vectorizer.fit_transform(X_train)
        self.model.fit(X_train_vec, y_train)

        duration = time.perf_counter() - start_time
        logger.info(f"Training completed in {duration:.3f}s")
        return X_train_vec, duration

    def evaluate_model(
        self, X_test: pd.Series, y_test: pd.Series
    ) -> Tuple[dict[str, Any], str, float]:
        """Evaluates the trained model against the test set and calculates metrics."""
        logger.info("Evaluating Model")
        start_time = time.perf_counter()

        X_test_vec = self.vectorizer.transform(X_test)

        # Utilize probabilities for Fusion Engine compatibility downstream
        y_proba_full = self.model.predict_proba(X_test_vec)
        y_proba = y_proba_full[:, 1]
        y_pred = (y_proba >= DEFAULT_CLASSIFICATION_THRESHOLD).astype(int)

        metrics = {
            "accuracy": float(accuracy_score(y_test, y_pred)),
            "precision": float(precision_score(y_test, y_pred)),
            "recall": float(recall_score(y_test, y_pred)),
            "f1_score": float(f1_score(y_test, y_pred)),
            "roc_auc": float(roc_auc_score(y_test, y_proba)),
            "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
        }

        clf_report = classification_report(y_test, y_pred, target_names=["Safe", "Spam"])

        duration = time.perf_counter() - start_time
        logger.info(f"Evaluation completed in {duration:.3f}s")
        return metrics, clf_report, duration

    def save_artifacts(
        self,
        metrics: dict[str, Any],
        clf_report: str,
        total_samples: int,
        train_duration: float,
        eval_duration: float,
        total_runtime: float,
    ) -> None:
        """Persists trained models, metadata, and comprehensive training reports."""
        logger.info("Saving Models to disk")
        
        tfidf_path = self.models_dir / "tfidf.joblib"
        nb_path = self.models_dir / "naive_bayes.joblib"
        joblib.dump(self.vectorizer, tfidf_path)
        joblib.dump(self.model, nb_path)

        feature_names = self.vectorizer.get_feature_names_out().tolist()

        with open(
            self.models_dir / "feature_names.json",
            "w",
            encoding="utf-8",
        ) as f:
            json.dump(feature_names, f, indent=4)

        timestamp_iso = datetime.now(timezone.utc).isoformat()
        
        logger.info("Saving Model Metadata")
        feature_count = len(self.vectorizer.vocabulary_)
        metadata = {
            "random_seed": RANDOM_SEED,
            "model_name": "Tier-1 NLP Spam Classifier",
            "version": MODEL_VERSION,
            "algorithm": "MultinomialNB",
            "vectorizer": "TF-IDF",
            "training_samples": total_samples,
            "feature_count": feature_count,
            "accuracy": metrics["accuracy"],
            "precision": metrics["precision"],
            "recall": metrics["recall"],
            "f1_score": metrics["f1_score"],
            "roc_auc": metrics["roc_auc"],
            "trained_at": timestamp_iso,
        }
        with open(self.models_dir / "model_metadata.json", "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=4)

        logger.info("Saving Reports")
        with open(self.reports_dir / "metrics.json", "w", encoding="utf-8") as f:
            json.dump(metrics, f, indent=4)

        with open(self.reports_dir / "classification_report.txt", "w", encoding="utf-8") as f:
            f.write(clf_report)

        training_summary = {
            "training_timestamp": timestamp_iso,
            "dataset_size": total_samples,
            "train_size": int(total_samples * 0.8),
            "test_size": total_samples - int(total_samples * 0.8),
            "algorithm": "MultinomialNB",
            "vectorizer": "TF-IDF",
            "hyperparameters": {
                "vectorizer": self.vectorizer.get_params(),
                "model": self.model.get_params(),
            },
            "metrics": metrics,
            "training_duration": train_duration,
            "evaluation_duration": eval_duration,
            "total_runtime": total_runtime,
            "class_distribution": class_distribution,
        }
        with open(self.reports_dir / "training_summary.json", "w", encoding="utf-8") as f:
            json.dump(training_summary, f, indent=4,default=str,)

    def run(self) -> None:
        """Executes the complete end-to-end training pipeline."""
        start_runtime = time.perf_counter()
        
        try:
            X, y = self.load_and_prepare_data()

            logger.info("Splitting Dataset")
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.20, random_state=RANDOM_SEED, stratify=y
            )

            _, train_duration = self.train_model(X_train, y_train)

            metrics, clf_report, eval_duration = self.evaluate_model(X_test, y_test)

            total_runtime = time.perf_counter() - start_runtime
            self.save_artifacts(
                metrics=metrics,
                clf_report=clf_report,
                total_samples=len(X),
                train_duration=train_duration,
                class_distribution={
                    "safe": int((y == 0).sum()),
                    "spam": int((y == 1).sum()),
                },
                train_duration=train_duration,
                eval_duration=eval_duration,
                total_runtime=total_runtime,
            )

            logger.info("Finished: NLP Training Pipeline executed successfully.")

        except Exception as exc:
            logger.exception("A fatal error occurred during the NLP training pipeline.")
            raise


def main() -> None:
    """Entry point for the training script."""
    pipeline = NLPTrainingPipeline()
    pipeline.run()


if __name__ == "__main__":
    main()

