
"""
Tier-2 Anomaly Detection Model Trainer
Isolation Forest implementation for Trust & Safety behavioral telemetry.

This module is responsible for loading preprocessed behavioral features, scaling them,
and training an Isolation Forest model to detect anomalous user actions. The
resulting model artifacts and evaluation metrics are saved for later consumption
by the online FastAPI AI Worker.
"""

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional
from datetime import datetime

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

from training.preprocessing import TextPreprocessor
from training.feature_engineering import BehaviorFeatureGenerator

# Configure production logging
logger = logging.getLogger(__name__)


class IsolationForestTrainer:
    """
    Production-grade trainer for the Tier-2 Isolation Forest model.
    Responsible for data validation, scaling, model training, unsupervised evaluation,
    and artifact serialization.
    """

    EXPECTED_FEATURES: List[str] = [
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
        dataset_path: str = "datasets/processed/text_dataset.csv",
        model_output_path: str = "models/isolation_forest.joblib",
        scaler_output_path: str = "models/behavior_scaler.joblib",
        report_output_path: str = "reports/isolation_forest_metrics.json",
        metadata_output_path: str = "models/iforest_metadata.json",
    ) -> None:
        """
        Initialize the trainer with file paths and configure state.

        Args:
            dataset_path: Path to the processed input CSV.
            model_output_path: Destination path for the serialized joblib model.
            scaler_output_path: Destination path for the serialized feature scaler.
            report_output_path: Destination path for the JSON metrics report.
            metadata_output_path: Destination path for the model metadata JSON.
        """
        self.dataset_path = Path(dataset_path)
        self.model_output_path = Path(model_output_path)
        self.scaler_output_path = Path(scaler_output_path)
        self.report_output_path = Path(report_output_path)
        self.metadata_output_path = Path(metadata_output_path)

        self.df: Optional[pd.DataFrame] = None
        self.feature_matrix: Optional[np.ndarray] = None
        self.model: Optional[IsolationForest] = None
        self.scaler: Optional[StandardScaler] = None
        self.metrics: Dict[str, Any] = {}

    def load_dataset(self) -> None:
        """
        Loads the dataset from the designated path.

        Raises:
            FileNotFoundError: If the processed dataset does not exist.
        """
        logger.info(f"Loading dataset from {self.dataset_path}")
        if not self.dataset_path.exists():
            raise FileNotFoundError(
                f"Required dataset not found at {self.dataset_path}. "
                "Ensure previous pipeline steps have executed."
            )
        
        self.df = pd.read_csv(self.dataset_path)
        logger.info(f"Successfully loaded dataset with {len(self.df)} rows.")

    def preprocess(self) -> None:
        """
        Executes text cleaning via TextPreprocessor.
        """
        logger.info("Executing text preprocessing...")
        if self.df is None:
            raise ValueError("Dataset not loaded. Call load_dataset() first.")
        
        preprocessor = TextPreprocessor()
        self.df = preprocessor.clean_dataframe(self.df)
        logger.info("Text preprocessing complete.")

    def engineer_features(self) -> None:
        """
        Executes behavioral feature generation via BehaviorFeatureGenerator.
        """
        logger.info("Generating behavioral features...")
        if self.df is None:
            raise ValueError("Dataset not loaded. Cannot generate features.")
        
        generator = BehaviorFeatureGenerator()
        self.df = generator.generate_features(self.df)
        logger.info("Feature generation complete.")

    def prepare_feature_matrix(self) -> None:
        """
        Validates the dataframe, extracts the expected columns, verifies order,
        and applies feature scaling.

        Raises:
            ValueError: If required columns are missing, contain NaNs, or are non-numeric.
        """
        logger.info("Preparing and validating feature matrix...")
        if self.df is None:
            raise ValueError("Dataset not available for matrix preparation.")

        # 1. Verify required columns exist
        missing_cols = [col for col in self.EXPECTED_FEATURES if col not in self.df.columns]
        if missing_cols:
            raise ValueError(f"Missing required behavioral features: {missing_cols}")

        feature_df = self.df[self.EXPECTED_FEATURES]

        # 2. Strict validation of feature order
        if list(feature_df.columns) != self.EXPECTED_FEATURES:
            raise ValueError(
                f"Feature order mismatch! Expected {self.EXPECTED_FEATURES} "
                f"but got {list(feature_df.columns)}"
            )

        # 3. Verify no NaNs in feature columns
        if feature_df.isnull().values.any():
            nan_counts = feature_df.isnull().sum()
            nan_cols = nan_counts[nan_counts > 0].to_dict()
            raise ValueError(f"Dataset contains NaNs in feature columns: {nan_cols}")

        # 4. Verify all feature columns are numeric
        non_numeric_cols = [
            col for col in feature_df.columns 
            if not pd.api.types.is_numeric_dtype(feature_df[col])
        ]
        if non_numeric_cols:
            raise ValueError(
                f"Non-numeric types found in expected numeric feature columns: {non_numeric_cols}"
            )

        # 5. Fit & Transform StandardScaler
        logger.info("Scaling features using StandardScaler...")
        self.scaler = StandardScaler()
        self.feature_matrix = self.scaler.fit_transform(feature_df.to_numpy())
        
        logger.info(f"Feature matrix prepared and scaled successfully. Shape: {self.feature_matrix.shape}")

    def train(self) -> None:
        """
        Trains the Isolation Forest model using the prepared and scaled feature matrix.
        """
        logger.info("Initializing Isolation Forest model...")
        if self.feature_matrix is None:
            raise ValueError("Feature matrix not prepared. Call prepare_feature_matrix() first.")

        self.model = IsolationForest(
            n_estimators=300,
            max_samples="auto",
            contamination="auto",
            bootstrap=False,
            n_jobs=-1,
            random_state=42
        )

        logger.info("Fitting model...")
        self.model.fit(self.feature_matrix)
        logger.info("Model training complete.")

    def evaluate(self) -> None:
        """
        Generates unsupervised evaluation metrics, score percentiles, and anomaly distributions.
        """
        logger.info("Evaluating anomaly distributions...")
        if self.model is None or self.feature_matrix is None:
            raise ValueError("Model is not trained. Call train() first.")

        # IsolationForest returns 1 for inliers (normal) and -1 for outliers (anomaly)
        predictions = self.model.predict(self.feature_matrix)
        
        # Lower score corresponds to higher degree of abnormality
        scores = self.model.score_samples(self.feature_matrix)

        number_predicted_normal = int(np.sum(predictions == 1))
        number_predicted_anomaly = int(np.sum(predictions == -1))
        total_samples = len(self.feature_matrix)
        
        # Compute extended evaluation metrics
        contamination_pct = (number_predicted_anomaly / total_samples) * 100
        anomaly_ratio = (number_predicted_anomaly / number_predicted_normal) if number_predicted_normal > 0 else 0
        p25, p50, p75 = np.percentile(scores, [25, 50, 75])

        # Feature statistics are pulled from the unscaled data for human readability
        feature_df = self.df[self.EXPECTED_FEATURES]

        self.metrics = {
            "number_of_samples": total_samples,
            "number_predicted_normal": number_predicted_normal,
            "number_predicted_anomaly": number_predicted_anomaly,
            "contamination_percentage": float(contamination_pct),
            "anomaly_ratio": float(anomaly_ratio),
            "mean_score": float(np.mean(scores)),
            "std_score": float(np.std(scores)),
            "min_score": float(np.min(scores)),
            "max_score": float(np.max(scores)),
            "score_percentiles": {
                "25th": float(p25),
                "50th": float(p50),
                "75th": float(p75)
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
        logger.info("Evaluation complete.")

    def save_model(self) -> None:
        """
        Serializes and saves the trained model and feature scaler to disk.
        """
        logger.info("Saving model and scaler artifacts...")
        if self.model is None or self.scaler is None:
            raise ValueError("No trained model or scaler to save.")

        self.model_output_path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self.model, self.model_output_path)
        logger.info(f"Model saved to {self.model_output_path}")

        self.scaler_output_path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self.scaler, self.scaler_output_path)
        logger.info(f"Scaler saved to {self.scaler_output_path}")

    def save_report(self) -> None:
        """
        Saves the evaluation metrics to a JSON report.
        """
        logger.info(f"Saving report to {self.report_output_path}...")
        if not self.metrics:
            raise ValueError("No metrics to save. Call evaluate() first.")

        self.report_output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.report_output_path, "w") as f:
            json.dump(self.metrics, f, indent=4)
        logger.info("Report saved successfully.")

    def save_metadata(self) -> None:
        """
        Saves model metadata required during inference.
        """
        if self.model is None or self.feature_matrix is None:
            raise ValueError("Model must be trained before saving metadata.")

        metadata = {
            "version": "1.0.0",
            "training_timestamp": datetime.utcnow().isoformat(),
            "algorithm": "IsolationForest",
            "feature_order": self.EXPECTED_FEATURES,
            "feature_count": len(self.EXPECTED_FEATURES),
            "dataset_size": len(self.feature_matrix),
            "random_state": 42,
            "n_estimators": 300,
            "contamination": "auto",
            "uses_scaler": True,
            "scaler_name": self.scaler_output_path.name
        }

        self.metadata_output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.metadata_output_path, "w") as f:
            json.dump(metadata, f, indent=4)

        logger.info("Metadata saved successfully.")

    def run(self) -> None:
        """
        Orchestrates the entire training pipeline sequentially.
        """
        logger.info("Starting Isolation Forest training pipeline.")
        try:
            self.load_dataset()
            self.preprocess()
            self.engineer_features()
            self.prepare_feature_matrix()
            self.train()
            self.evaluate()
            self.save_model()
            self.save_report()
            self.save_metadata()
            logger.info("Isolation Forest training pipeline completed successfully.")
        except Exception as e:
            logger.error(f"Pipeline failed: {e}")
            raise


if __name__ == "__main__":
    trainer = IsolationForestTrainer()
    trainer.run()

