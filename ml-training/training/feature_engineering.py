"""Deterministic structural feature engineering for training and inference."""

from __future__ import annotations

import logging
import re
from typing import ClassVar

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


class FeatureEngineeringError(Exception):
    """Raised when structural feature generation cannot be completed."""


class BehaviorFeatureGenerator:
    """Computes the exact ordered behavioral features used by Isolation Forest."""

    REQUIRED_COLUMNS: ClassVar[list[str]] = ["text"]
    FEATURE_COLUMNS: ClassVar[list[str]] = [
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

    def __init__(self) -> None:
        self._uppercase_regex = re.compile(r"[A-Z]")
        self._special_char_regex = re.compile(r"[^a-zA-Z0-9\s]")
        self._url_regex = re.compile(r"https?://\S+|www\.\S+")

    def validate_dataframe(self, df: pd.DataFrame) -> None:
        if not isinstance(df, pd.DataFrame):
            raise FeatureEngineeringError(f"Expected pandas.DataFrame, got {type(df)!r}.")
        missing = [column for column in self.REQUIRED_COLUMNS if column not in df.columns]
        if missing:
            raise FeatureEngineeringError(f"Missing required columns: {missing}")

    def extract_text_statistics(self, df: pd.DataFrame) -> pd.DataFrame:
        working_df = df.copy(deep=True)
        text_series = working_df["text"].fillna("").astype(str)

        working_df["word_count"] = text_series.str.split().str.len()
        working_df["character_count"] = text_series.str.len()
        safe_chars = np.maximum(working_df["character_count"].to_numpy(dtype=float), 1.0)
        safe_words = np.maximum(working_df["word_count"].to_numpy(dtype=float), 1.0)

        uppercase_count = text_series.str.findall(self._uppercase_regex).str.len().to_numpy(dtype=float)
        special_count = text_series.str.findall(self._special_char_regex).str.len().to_numpy(dtype=float)
        url_count = text_series.str.findall(self._url_regex).str.len().to_numpy(dtype=float)

        working_df["uppercase_ratio"] = uppercase_count / safe_chars
        working_df["special_character_ratio"] = special_count / safe_chars
        working_df["url_count"] = url_count
        working_df["uri_hyperlink_density"] = np.clip(url_count / safe_words, 0.0, 1.0)
        return working_df

    def generate_behavior_features(self, df: pd.DataFrame) -> pd.DataFrame:
        working_df = df.copy(deep=True)
        text_series = working_df["text"].fillna("").astype(str)

        word_count = np.maximum(working_df["word_count"].to_numpy(dtype=float), 1.0)
        char_count = np.maximum(working_df["character_count"].to_numpy(dtype=float), 1.0)
        unique_words = text_series.apply(lambda value: len(set(value.split()))).to_numpy(dtype=float)
        repetition_index = np.clip((word_count - unique_words) / word_count, 0.0, 1.0)

        url_count = working_df["url_count"].to_numpy(dtype=float)
        hyperlink_density = working_df["uri_hyperlink_density"].to_numpy(dtype=float)
        special_ratio = working_df["special_character_ratio"].to_numpy(dtype=float)
        uppercase_ratio = working_df["uppercase_ratio"].to_numpy(dtype=float)

        working_df["burst_velocity"] = np.clip(
            1.0
            + (word_count / 8.0)
            + (url_count * 4.0)
            + (special_ratio * 20.0)
            + (repetition_index * 12.0),
            1.0,
            250.0,
        )
        working_df["target_recipient_ratio"] = np.clip(
            0.05
            + hyperlink_density
            + (repetition_index * 0.35)
            + (uppercase_ratio * 0.25),
            0.0,
            1.0,
        )
        working_df["session_dwell_duration"] = np.clip(
            3.0
            + (char_count / 18.0)
            - (hyperlink_density * 10.0)
            - (repetition_index * 6.0),
            1.0,
            600.0,
        )
        return working_df

    def generate_features(self, df: pd.DataFrame) -> pd.DataFrame:
        self.validate_dataframe(df)
        processed_df = self.extract_text_statistics(df)
        processed_df = self.generate_behavior_features(processed_df)
        logger.info("Generated structural features for %d rows.", len(processed_df))
        return processed_df

    def feature_frame(self, text: str) -> pd.DataFrame:
        """Return a single-row feature dataframe in model order."""
        df = self.generate_features(pd.DataFrame({"text": [text]}))
        return df[self.FEATURE_COLUMNS]


feature_generator = BehaviorFeatureGenerator()
