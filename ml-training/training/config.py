"""Centralized configuration for the offline ML training pipeline."""

from __future__ import annotations

from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class TrainingSettings(BaseSettings):
    """Environment-driven settings for dataset and model artifact paths."""

    BASE_DIR: Path = Field(
        default_factory=lambda: Path(__file__).resolve().parent.parent
    )
    RAW_DATA_DIR: Path = Field(default=Path("datasets/raw"))
    PROCESSED_DATA_DIR: Path = Field(default=Path("datasets/processed"))
    MODELS_DIR: Path = Field(default=Path("models"))
    REPORTS_DIR: Path = Field(default=Path("reports"))
    PROCESSED_DATASET_NAME: str = Field(default="text_dataset.csv")
    AI_WORKER_MODELS_DIR: Path = Field(default=Path("../ai-worker/models"))

    TFIDF_MAX_FEATURES: int = Field(default=50000, gt=0)
    RANDOM_SEED: int = Field(default=42)
    TEST_SIZE: float = Field(default=0.20, gt=0, lt=1)
    NLP_MODEL_VERSION: str = Field(default="1.0.0")
    IFOREST_MODEL_VERSION: str = Field(default="1.0.0")
    IFOREST_N_ESTIMATORS: int = Field(default=300, gt=0)

    @property
    def processed_dataset_path(self) -> Path:
        return self.BASE_DIR / self.PROCESSED_DATA_DIR / self.PROCESSED_DATASET_NAME

    @property
    def models_directory(self) -> Path:
        return self.BASE_DIR / self.MODELS_DIR

    @property
    def reports_directory(self) -> Path:
        return self.BASE_DIR / self.REPORTS_DIR

    @property
    def raw_data_directory(self) -> Path:
        return self.BASE_DIR / self.RAW_DATA_DIR

    @property
    def ai_worker_models_directory(self) -> Path:
        path = self.AI_WORKER_MODELS_DIR
        return path if path.is_absolute() else self.BASE_DIR / path

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


training_settings = TrainingSettings()
