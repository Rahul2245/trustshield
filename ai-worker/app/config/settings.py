from pathlib import Path
from typing import Literal

from pydantic import (
    Field,
    HttpUrl,
    model_validator,
)
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings for the Unified Trust AI Worker.
    """

    # ---------------------------------------------------------------------
    # Application Configuration
    # ---------------------------------------------------------------------

    APP_NAME: str = Field(default="Unified Trust AI Worker")
    APP_VERSION: str = Field(default="1.0.0")

    ENVIRONMENT: Literal[
        "development",
        "staging",
        "production",
    ] = "development"

    LOG_LEVEL: Literal[
        "DEBUG",
        "INFO",
        "WARNING",
        "ERROR",
        "CRITICAL",
    ] = "INFO"

    # ---------------------------------------------------------------------
    # RabbitMQ
    # ---------------------------------------------------------------------

    AMQP_URL: str = Field(
        default="amqp://guest:guest@localhost:5672/",
        description="RabbitMQ connection string",
    )

    QUEUE_NAME: str = Field(
        default="security.threat_analysis_queue.v2"
    )

    DLQ_QUEUE_NAME: str = Field(
        default="security.threats.dlq"
    )

    EXCHANGE_NAME: str = Field(
        default="security.direct"
    )

    ROUTING_KEY: str = Field(
        default="threat.eval"
    )

    PREFETCH_COUNT: int = Field(
        default=10,
        gt=0,
    )

    # ---------------------------------------------------------------------
    # MongoDB
    # ---------------------------------------------------------------------

    MONGO_URI: str = Field(
        default="mongodb://localhost:27017/",
        description="MongoDB connection string",
    )

    DATABASE_NAME: str = Field(
        default="trust_db"
    )

    SECURITY_LOG_COLLECTION: str = Field(
        default="security_event_logs"
    )

    # ---------------------------------------------------------------------
    # Gateway
    # ---------------------------------------------------------------------

    GATEWAY_WEBHOOK_URL: HttpUrl = Field(
        default="http://localhost:5000/api/internal/webhook/ai-result"
    )

    WEBHOOK_TIMEOUT: int = Field(
        default=5,
        gt=0,
    )

    # ---------------------------------------------------------------------
    # Ollama
    # ---------------------------------------------------------------------

    OLLAMA_HOST: HttpUrl = Field(
        default="http://localhost:11434"
    )

    OLLAMA_MODEL: str = Field(
        default="llama3"
    )

    OLLAMA_TIMEOUT: int = Field(
        default=45,
        gt=0,
    )

    OLLAMA_MAX_RETRIES: int = Field(
        default=3,
        ge=0,
    )

    OLLAMA_RETRY_DELAY: float = Field(
        default=1.0,
        ge=0,
    )

    # ---------------------------------------------------------------------
    # Fusion Engine
    # ---------------------------------------------------------------------

    NLP_WEIGHT: float = Field(
        default=0.65,
        ge=0,
        le=1,
    )

    IF_WEIGHT: float = Field(
        default=0.35,
        ge=0,
        le=1,
    )

    @model_validator(mode="after")
    def validate_weights(self):
        total = round(self.NLP_WEIGHT + self.IF_WEIGHT, 6)

        if total != 1.0:
            raise ValueError(
                "NLP_WEIGHT + IF_WEIGHT must equal 1.0"
            )

        return self

    # ---------------------------------------------------------------------
    # Risk Thresholds
    # ---------------------------------------------------------------------

    LOW_RISK_THRESHOLD: float = Field(
        default=50,
        ge=0,
        le=100,
    )

    SHADOW_THRESHOLD: float = Field(
        default=80,
        ge=0,
        le=100,
    )

    HIGH_RISK_THRESHOLD: float = Field(
        default=80,
        ge=0,
        le=100,
    )

    MAX_PAYLOAD_BYTES: int = Field(
        default=65536,
        gt=0,
    )

    # ---------------------------------------------------------------------
    # Worker
    # ---------------------------------------------------------------------

    MAX_RETRIES: int = Field(
        default=3,
        ge=0,
    )

    RETRY_DELAY: int = Field(
        default=2,
        ge=0,
    )

    # ---------------------------------------------------------------------
    # ML Models
    # ---------------------------------------------------------------------

    MODEL_DIRECTORY: Path = Path("./models")

    TFIDF_MODEL_PATH: str = "tfidf.joblib"
    NB_MODEL_PATH: str = "naive_bayes.joblib"
    IF_MODEL_PATH: str = "isolation_forest.joblib"
    SCALER_MODEL_PATH: str = "behavior_scaler.joblib"

    MODEL_METADATA_PATH: str = "model_metadata.json"
    IFOREST_METADATA_PATH: str = "iforest_metadata.json"

    LOAD_MODELS_ON_STARTUP: bool = True
    CONNECT_SERVICES_ON_STARTUP: bool = True

    @property
    def tfidf_path(self) -> Path:
        return self.MODEL_DIRECTORY / self.TFIDF_MODEL_PATH

    @property
    def nb_model_path(self) -> Path:
        return self.MODEL_DIRECTORY / self.NB_MODEL_PATH

    @property
    def if_model_path(self) -> Path:
        return self.MODEL_DIRECTORY / self.IF_MODEL_PATH

    @property
    def scaler_path(self) -> Path:
        return self.MODEL_DIRECTORY / self.SCALER_MODEL_PATH

    @property
    def model_metadata_path(self) -> Path:
        return self.MODEL_DIRECTORY / self.MODEL_METADATA_PATH

    @property
    def iforest_metadata_path(self) -> Path:
        return self.MODEL_DIRECTORY / self.IFOREST_METADATA_PATH

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[2] / ".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()