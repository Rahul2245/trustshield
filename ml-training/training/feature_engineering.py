"""
Module: training/feature_engineering.py

Description:
Production-grade feature engineering pipeline for the offline Trust & Safety
machine learning training system. Computes deterministic text statistics and
simulates upstream behavioral telemetry without introducing target leakage.
"""

import logging
import re
from typing import List

import numpy as np
import pandas as pd


# Logging


logger = logging.getLogger(__name__)

if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)

logger.setLevel(logging.INFO)


class FeatureEngineeringError(Exception):
    """Raised when feature engineering cannot be completed."""


class BehaviorFeatureGenerator:
    """
    Generates structural text features and simulated behavioral telemetry.

    The generator is intentionally independent of the target label to
    eliminate any possibility of target leakage.
    """

   
    # Required columns
   

    REQUIRED_COLUMNS: List[str] = ["text"]

   
    # Tunable constants
   

    BASE_BURST_MEAN = 8.0
    BURST_STD = 3.0
    MAX_BURST_VELOCITY = 250.0

    BASE_TARGET_MEAN = 0.20
    TARGET_STD = 0.15

    BASE_DWELL_TIME = 12.0
    DWELL_STD = 4.0
    MAX_DWELL_DURATION = 600.0

    def __init__(self, seed: int = 42) -> None:
        """
        Initialize the feature generator.

        Args:
            seed:
                Random seed used for reproducible telemetry simulation.
        """

        self.rng = np.random.default_rng(seed)

        self._uppercase_regex = re.compile(r"[A-Z]")
        self._special_char_regex = re.compile(r"[^a-zA-Z0-9\s]")
        self._url_regex = re.compile(r"https?://\S+|www\.\S+")

    def validate_dataframe(self, df: pd.DataFrame) -> None:
        """
        Validate the incoming dataframe.

        Args:
            df:
                Input dataframe.

        Raises:
            FeatureEngineeringError:
                If validation fails.
        """

        if not isinstance(df, pd.DataFrame):
            raise FeatureEngineeringError(
                f"Expected pandas.DataFrame, received {type(df)}."
            )

        missing = [
            column
            for column in self.REQUIRED_COLUMNS
            if column not in df.columns
        ]

        if missing:
            raise FeatureEngineeringError(
                f"Missing required columns: {missing}"
            )

        if df["text"].isnull().any():
            logger.warning(
                "Null values detected in 'text'. They will be treated as empty strings."
            )

    def extract_text_statistics(
        self,
        df: pd.DataFrame,
    ) -> pd.DataFrame:
        """
        Compute structural text statistics.
        """

        logger.info("Extracting text statistics...")

        working_df = df.copy(deep=True)

        text_series = working_df["text"].fillna("").astype(str)

        working_df["word_count"] = (
            text_series.str.split().str.len()
        )

        working_df["character_count"] = (
            text_series.str.len()
        )

        safe_char_count = np.maximum(
            working_df["character_count"].to_numpy(),
            1,
        )

        safe_word_count = np.maximum(
            working_df["word_count"].to_numpy(),
            1,
        )

        uppercase_count = (
            text_series
            .str.findall(self._uppercase_regex)
            .str.len()
            .to_numpy()
        )

        working_df["uppercase_ratio"] = (
            uppercase_count / safe_char_count
        )

        special_count = (
            text_series
            .str.findall(self._special_char_regex)
            .str.len()
            .to_numpy()
        )

        working_df["special_character_ratio"] = (
            special_count / safe_char_count
        )

        working_df["url_count"] = (
            text_series
            .str.findall(self._url_regex)
            .str.len()
        )

        working_df["uri_hyperlink_density"] = np.clip(
            working_df["url_count"].to_numpy() / safe_word_count,
            0.0,
            1.0,
        )

        return working_df

    def generate_behavior_features(
        self,
        df: pd.DataFrame,
    ) -> pd.DataFrame:
        """
        Generate simulated behavioral telemetry.
        """

        logger.info("Generating behavioral telemetry...")

        working_df = df.copy(deep=True)

        if working_df.empty:
            working_df["burst_velocity"] = pd.Series(dtype=float)
            working_df["target_recipient_ratio"] = pd.Series(dtype=float)
            working_df["session_dwell_duration"] = pd.Series(dtype=float)
            return working_df

        text_series = working_df["text"].fillna("").astype(str)

        unique_word_counts = text_series.apply(
            lambda value: len(set(value.split()))
        ).to_numpy()

        word_counts = working_df["word_count"].to_numpy()

        safe_word_count = np.maximum(word_counts, 1)

        repetition_index = (
            word_counts - unique_word_counts
        ) / safe_word_count

        short_message_indicator = np.clip(
            15.0 / safe_word_count,
            0.0,
            2.0,
        )

        urls = working_df["url_count"].to_numpy()
        special_ratio = (
            working_df["special_character_ratio"].to_numpy()
        )
        hyperlink_density = (
            working_df["uri_hyperlink_density"].to_numpy()
        )

                # Burst Velocity
        
        burst_mean = (
            self.BASE_BURST_MEAN
            + (urls * 2.5)
            + (special_ratio * 6.0)
            + (
                repetition_index
                * short_message_indicator
                * 4.0
            )
        )

        burst = self.rng.normal(
            loc=burst_mean,
            scale=self.BURST_STD,
        )

        working_df["burst_velocity"] = np.clip(
            burst,
            1.0,
            self.MAX_BURST_VELOCITY,
        )

                # Target Recipient Ratio
        
        target_mean = (
            self.BASE_TARGET_MEAN
            + (hyperlink_density * 0.4)
            + (repetition_index * 0.3)
            + (short_message_indicator * 0.1)
        )

        working_df["target_recipient_ratio"] = np.clip(
            self.rng.normal(
                loc=target_mean,
                scale=self.TARGET_STD,
            ),
            0.0,
            1.0,
        )

                # Session Dwell Duration
        
        dwell_mean = (
            self.BASE_DWELL_TIME
            + (word_counts * 0.4)
        )

        promotional_penalty = (
            (hyperlink_density * 8.0)
            + (repetition_index * 5.0)
        )

        dwell_mean = np.maximum(
            dwell_mean - promotional_penalty,
            3.0,
        )

        dwell = self.rng.normal(
            loc=dwell_mean,
            scale=self.DWELL_STD,
        )

        working_df["session_dwell_duration"] = np.clip(
            dwell,
            1.0,
            self.MAX_DWELL_DURATION,
        )

        return working_df

    def generate_features(
        self,
        df: pd.DataFrame,
    ) -> pd.DataFrame:
        """
        Execute the complete feature engineering pipeline.
        """

        logger.info("Running feature engineering pipeline...")

        self.validate_dataframe(df)

        processed_df = self.extract_text_statistics(df)
        processed_df = self.generate_behavior_features(processed_df)

        logger.info("Feature engineering completed successfully.")

        return processed_df


# Reusable singleton
feature_generator = BehaviorFeatureGenerator()