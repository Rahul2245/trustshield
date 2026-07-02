from pathlib import Path
from typing import Literal

from pydantic import (
    Field,
    HttpUrl,
    AmqpDsn,
    MongoDsn,
    model_validator,
)
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings for the Unified Trust AI Worker.
    """

   
    # Application Configuration
   
    APP_NAME: str = Field(default="Unified Trust AI Worker")
    APP_VERSION: str = Field(default="1.0.0")

    ENVIRONMENT: Literal[
        "development",
        "staging",
        "production"
    ] = "development"

    LOG_LEVEL: Literal[
        "DEBUG",
        "INFO",
        "WARNING",
        "ERROR",
        "CRITICAL"
    ] = "INFO"

   
    # RabbitMQ
   
    AMQP_URL: AmqpDsn = Field(
        ...,
        description="RabbitMQ connection string"
    )

    QUEUE_NAME: str = Field(
        default="security.threat_analysis_queue"
    )

    PREFETCH_COUNT: int = Field(
        default=10,
        gt=0
    )

   
    # MongoDB
   
    MONGO_URI: MongoDsn = Field(
        ...,
        description="MongoDB connection string"
    )

    DATABASE_NAME: str = Field(
        default="trust_db"
    )

    SECURITY_LOG_COLLECTION: str = Field(
        default="security_event_logs"
    )

   
    # Gateway
   
    GATEWAY_WEBHOOK_URL: HttpUrl = Field(...)

    WEBHOOK_TIMEOUT: int = Field(
        default=5,
        gt=0
    )

   
    # Ollama
   
    OLLAMA_HOST: HttpUrl = Field(...)

    OLLAMA_MODEL: str = Field(
        default="llama3"
    )

    OLLAMA_TIMEOUT: int = Field(
        default=45,
        gt=0
    )

   
    # Fusion Engine
   
    NLP_WEIGHT: float = Field(
        default=0.65,
        ge=0,
        le=1
    )

    IF_WEIGHT: float = Field(
        default=0.35,
        ge=0,
        le=1
    )

    @model_validator(mode="after")
    def validate_weights(self):
        total = round(self.NLP_WEIGHT + self.IF_WEIGHT, 6)

        if total != 1.0:
            raise ValueError(
                "NLP_WEIGHT + IF_WEIGHT must equal 1.0"
            )

        return self

   
    # Risk Thresholds (0-100 scale)
   
    LOW_RISK_THRESHOLD: float = Field(
        default=50,
        ge=0,
        le=100
    )

    SHADOW_THRESHOLD: float = Field(
        default=80,
        ge=0,
        le=100
    )

    HIGH_RISK_THRESHOLD: float = Field(
        default=100,
        ge=0,
        le=100
    )

   
    # Worker
   
    MAX_RETRIES: int = Field(
        default=3,
        ge=0
    )

    RETRY_DELAY: int = Field(
        default=2,
        ge=0
    )

   
    # ML Models
   
    MODEL_DIRECTORY: Path = Path("./local_models")

    TFIDF_MODEL_PATH: str = "tfidf.joblib"
    NB_MODEL_PATH: str = "nb.joblib"
    IF_MODEL_PATH: str = "iforest.joblib"

    @property
    def tfidf_path(self) -> Path:
        return self.MODEL_DIRECTORY / self.TFIDF_MODEL_PATH

    @property
    def nb_model_path(self) -> Path:
        return self.MODEL_DIRECTORY / self.NB_MODEL_PATH

    @property
    def if_model_path(self) -> Path:
        return self.MODEL_DIRECTORY / self.IF_MODEL_PATH

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()