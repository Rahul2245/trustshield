"""
datasets/dataset_manager.py

Orchestrates the ingestion, standardization, validation, normalization,
and merging of raw datasets for the offline Trust & Safety Machine
Learning pipeline.
"""

import logging
from pathlib import Path
from typing import Dict, List, Optional, Union

import pandas as pd

# Configure module-level logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)


class DatasetValidationError(Exception):
    """Raised when a dataset fails schema validation."""


class DatasetManager:
    """
    Manages loading, normalization, validation, and aggregation of
    multiple raw datasets into a single master dataset suitable for
    offline machine learning.
    """

    # Ordered columns required by downstream training pipeline
    REQUIRED_COLUMNS = [
        "text",
        "label",
    ]

    DEFAULT_COLUMN_MAPPING = {
        "message": "text",
        "body": "text",
        "content": "text",
        "category": "label",
        "class": "label",
        "target": "label",
        "spam": "label",
    }

    # Canonical binary label mapping
    LABEL_MAPPING = {
        # Spam / malicious
        "spam": "spam",
        "phishing": "spam",
        "malicious": "spam",
        "fraud": "spam",
        "scam": "spam",
        "junk": "spam",
        "1": "spam",
        "true": "spam",
        "yes": "spam",

        # Ham / safe
        "ham": "ham",
        "safe": "ham",
        "normal": "ham",
        "legitimate": "ham",
        "0": "ham",
        "false": "ham",
        "no": "ham",
    }

    def __init__(
        self,
        output_path: Union[str, Path] = "datasets/processed/text_dataset.csv",
        column_mapping: Optional[Dict[str, str]] = None,
    ) -> None:
        """
        Initialize DatasetManager.

        Args:
            output_path:
                Destination path for the merged dataset.
            column_mapping:
                Optional custom column mapping.
        """
        self.output_path = Path(output_path)
        self.column_mapping = column_mapping or self.DEFAULT_COLUMN_MAPPING

    def load_dataset(
        self,
        file_path: Union[str, Path],
    ) -> Optional[pd.DataFrame]:
        """
        Load a CSV dataset.

        Returns:
            DataFrame if loaded successfully, otherwise None.
        """
        path = Path(file_path)

        if not path.is_file():
            logger.warning("Dataset not found. Skipping: %s", path)
            return None

        try:
            logger.info("Loading dataset: %s", path)
            return pd.read_csv(path)

        except pd.errors.EmptyDataError:
            logger.warning("Dataset is empty: %s", path)
            return None

        except Exception:
            logger.exception("Failed to load dataset: %s", path)
            raise

    def normalize_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Standardize column names.
        """
        lower_mapping = {
            key.lower(): value
            for key, value in self.column_mapping.items()
        }

        rename_dict = {}

        for column in df.columns:
            normalized = str(column).strip().lower()

            if normalized in lower_mapping:
                rename_dict[column] = lower_mapping[normalized]

            elif normalized in self.REQUIRED_COLUMNS:
                rename_dict[column] = normalized

        return df.rename(columns=rename_dict)

    def validate_columns(
        self,
        df: pd.DataFrame,
        source_name: str = "Unknown",
    ) -> None:
        """
        Ensure required columns exist.
        """
        missing = set(self.REQUIRED_COLUMNS) - set(df.columns)

        if missing:
            message = (
                f"Dataset '{source_name}' is missing required columns: {missing}"
            )
            logger.error(message)
            raise DatasetValidationError(message)

    def normalize_labels(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Normalize labels into canonical values:
            spam
            ham
        """
        df = df.copy()

        df["label"] = (
            df["label"]
            .astype(str)
            .str.strip()
            .str.lower()
            .replace(self.LABEL_MAPPING)
        )

        return df

    def clean_text(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Trim whitespace and remove empty rows.
        """
        df = df.copy()

        df["text"] = (
            df["text"]
            .astype(str)
            .str.strip()
        )

        df = df[df["text"] != ""]

        return df

    def build_master_dataset(
        self,
        file_paths: List[Union[str, Path]],
    ) -> pd.DataFrame:
        """
        Build the final merged dataset.
        """
        valid_frames: List[pd.DataFrame] = []

        for path in file_paths:

            df = self.load_dataset(path)

            if df is None:
                continue

            original_rows = len(df)

            df = self.normalize_columns(df)

            try:
                self.validate_columns(df, str(path))

            except DatasetValidationError:
                logger.warning(
                    "Skipping dataset due to validation failure: %s",
                    path,
                )
                continue

            df = df[self.REQUIRED_COLUMNS]

            df = self.normalize_labels(df)
            df = self.clean_text(df)

            valid_rows = len(df)

            logger.info(
                "Dataset '%s': %d rows loaded -> %d valid rows",
                Path(path).name,
                original_rows,
                valid_rows,
            )

            valid_frames.append(df)

        if not valid_frames:
            raise ValueError(
                "No valid datasets were loaded. "
                "Master dataset construction failed."
            )

        logger.info("Merging %d datasets.", len(valid_frames))

        master_df = pd.concat(valid_frames, ignore_index=True)

        rows_before = len(master_df)

        # Remove nulls
        master_df.dropna(
            subset=self.REQUIRED_COLUMNS,
            inplace=True,
        )

        # Create normalized text for duplicate detection
        master_df["_normalized_text"] = (
            master_df["text"]
            .str.lower()
            .str.strip()
        )

        # Remove duplicates regardless of casing
        master_df.drop_duplicates(
            subset=["_normalized_text", "label"],
            inplace=True,
        )

        master_df.drop(columns="_normalized_text", inplace=True)

        # Shuffle deterministically
        master_df = (
            master_df.sample(
                frac=1,
                random_state=42,
            )
            .reset_index(drop=True)
        )

        rows_after = len(master_df)
        removed = rows_before - rows_after

        logger.info(
            "Master dataset statistics:"
        )
        logger.info(
            "Rows before cleaning : %d",
            rows_before,
        )
        logger.info(
            "Rows after cleaning  : %d",
            rows_after,
        )
        logger.info(
            "Rows removed         : %d",
            removed,
        )

        return master_df

    def export_dataset(self, df: pd.DataFrame) -> None:
        """
        Export the processed dataset.
        """
        try:
            self.output_path.parent.mkdir(
                parents=True,
                exist_ok=True,
            )

            logger.info(
                "Exporting dataset to %s",
                self.output_path,
            )

            df.to_csv(
                self.output_path,
                index=False,
            )

            logger.info(
                "Dataset exported successfully (%d rows).",
                len(df),
            )

        except Exception:
            logger.exception(
                "Failed to export dataset to %s",
                self.output_path,
            )
            raise