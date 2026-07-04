"""
Offline Training Orchestrator

This script is responsible for coordinating the execution of the offline machine
learning training pipeline. It integrates existing dataset managers and trainers
to generate production-ready model artifacts for downstream consumption.
"""

import json
import logging
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

# Assuming the project root is in the PYTHONPATH or executed from ml-training/
from datasets.dataset_manager import DatasetManager
from training.nlp_trainer import NLPTrainer
from training.isolation_forest_trainer import IsolationForestTrainer


class TrainingOrchestrator:
    """
    Coordinates the machine learning offline training pipeline.
    
    Responsibilities:
    - Setup directory structures and logging.
    - Discover and merge raw datasets.
    - Trigger independent model trainers.
    - Verify model and report artifacts.
    - Generate pipeline metadata and summaries.
    """

    def __init__(self) -> None:
        """Initializes the orchestrator and configures state/logging."""
        self.base_dir: Path = Path(__file__).resolve().parent
        self.start_time: float = time.time()
        self.status: str = "FAILED"
        self.dataset_size: int = 0
        self.number_of_raw_datasets: int = 0
        self.feature_columns: List[str] = []
        
        # Define expected artifact paths
        self.expected_models: List[Path] = [
            self.base_dir / "models" / "tfidf.joblib",
            self.base_dir / "models" / "naive_bayes.joblib",
            self.base_dir / "models" / "isolation_forest.joblib",
        ]
        self.expected_reports: List[Path] = [
            self.base_dir / "reports" / "metrics.json",
            self.base_dir / "reports" / "classification_report.txt",
            self.base_dir / "reports" / "isolation_forest_metrics.json",
        ]
        
        self._configure_logging()

    def _configure_logging(self) -> None:
        """STEP 1: Configures professional, single-logger standard output logging."""
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s - %(levelname)s - %(name)s - %(message)s",
            handlers=[logging.StreamHandler(sys.stdout)]
        )
        self.logger = logging.getLogger("TrainingOrchestrator")

    def _create_directories(self) -> None:
        """STEP 2: Creates all required directories if they are missing."""
        directories = [
            self.base_dir / "datasets" / "processed",
            self.base_dir / "models",
            self.base_dir / "reports"
        ]
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)

    def _discover_datasets(self) -> List[str]:
        """
        STEP 3: Discovers datasets in the raw directory.
        
        Returns:
            List[str]: A list of file paths to the raw CSV datasets.
            
        Raises:
            FileNotFoundError: If zero datasets exist.
        """
        raw_dir = self.base_dir / "datasets" / "raw"
        file_paths = list(raw_dir.glob("*.csv"))
        
        if not file_paths:
            raise FileNotFoundError(f"No raw datasets found in {raw_dir}")
            
        self.number_of_raw_datasets = len(file_paths)
        self.logger.info("Datasets discovered")
        
        # Return string paths for maximum compatibility with legacy/standard pandas APIs
        return [str(path) for path in file_paths]

    def _build_master_dataset(self, file_paths: List[str]) -> None:
        """
        STEP 4: Builds and exports the master dataset.
        
        Args:
            file_paths (List[str]): List of raw dataset paths.
        """
        dataset_manager = DatasetManager()
        
        # Build master dataset
        master_dataframe = dataset_manager.build_master_dataset(file_paths)
        self.dataset_size = len(master_dataframe)
        self.feature_columns = list(master_dataframe.columns)
        self.logger.info("Dataset merged")
        
        # Export master dataset
        dataset_manager.export_dataset(master_dataframe)
        self.logger.info("Dataset exported")

    def _run_trainers(self) -> None:
        """STEP 5 & 6: Executes the independent ML trainers."""
        # Step 5: NLP Trainer
        self.logger.info("NLP training started")
        nlp_trainer = NLPTrainer()
        nlp_trainer.run()
        self.logger.info("NLP completed")

        # Step 6: Isolation Forest Trainer
        self.logger.info("Isolation Forest started")
        if_trainer = IsolationForestTrainer()
        if_trainer.run()
        self.logger.info("Isolation Forest completed")

    def _verify_artifacts(self) -> None:
        """
        STEP 7: Verifies all expected model and report artifacts were created.
        
        Raises:
            RuntimeError: If any expected file does not exist or is 0 bytes.
        """
        all_expected_files = self.expected_models + self.expected_reports
        
        for file_path in all_expected_files:
            if not file_path.exists():
                raise RuntimeError(f"Artifact verification failed: {file_path.name} does not exist.")
            if file_path.stat().st_size == 0:
                raise RuntimeError(f"Artifact verification failed: {file_path.name} is empty (0 bytes).")
                
        self.logger.info("Artifacts verified")

    def _generate_metadata(self) -> None:
        """STEP 8: Generates pipeline and model metadata."""
        metadata = {
            "model_version": "1.0.0",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "training_dataset_size": self.dataset_size,
            "generated_models": [path.name for path in self.expected_models],
            "feature_columns": self.feature_columns,
            "training_pipeline_version": "1.0.0"
        }
        
        metadata_path = self.base_dir / "models" / "model_metadata.json"
        with open(metadata_path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=4)
            
        self.logger.info("Metadata generated")

    def _generate_summary(self, exception: Optional[Exception] = None) -> None:
        """
        STEP 9: Generates the final training summary report.
        
        Args:
            exception (Optional[Exception]): The exception raised during execution, if any.
        """
        execution_time = time.time() - self.start_time
        
        summary = {
            "status": self.status,
            "execution_time": round(execution_time, 2),
            "dataset_size": self.dataset_size,
            "number_of_raw_datasets": self.number_of_raw_datasets,
            "generated_models": [path.name for path in self.expected_models],
            "generated_reports": [path.name for path in self.expected_reports],
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "error": str(exception) if exception else None
        }
        
        summary_path = self.base_dir / "reports" / "training_summary.json"
        with open(summary_path, "w", encoding="utf-8") as f:
            json.dump(summary, f, indent=4)
            
        self.logger.info("Summary generated")

    def run_pipeline(self) -> None:
        """
        Main execution flow wrapper for the training orchestrator.
        Guarantees cleanup and summary generation regardless of success or failure.
        """
        self.logger.info("Pipeline started")
        
        try:
            self._create_directories()
            
            raw_files = self._discover_datasets()
            
            self._build_master_dataset(raw_files)
            
            self._run_trainers()
            
            self._verify_artifacts()
            
            self._generate_metadata()
            
            self.status = "SUCCESS"
            self.logger.info("Pipeline completed")
            
        except Exception as e:
            self.logger.error(f"Pipeline failed: {e}", exc_info=True)
            self._generate_summary(exception=e)
            raise  # Re-raise exactly as instructed
        finally:
            # Generate summary in finally block to ensure it writes even on success
            if self.status == "SUCCESS":
                self._generate_summary()


if __name__ == "__main__":
    orchestrator = TrainingOrchestrator()
    orchestrator.run_pipeline()