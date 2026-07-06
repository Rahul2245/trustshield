"""Deterministic feature engineering for Isolation Forest inference."""

from __future__ import annotations

import re
from typing import ClassVar

import numpy as np
import pandas as pd


class BehaviorFeatureGenerator:
    """Computes the same ordered structural features generated during training."""

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

    def generate_features(self, text: str) -> pd.DataFrame:
        value = "" if text is None else str(text)
        series = pd.Series([value])
        word_count = series.str.split().str.len().fillna(0).to_numpy(dtype=float)
        character_count = series.str.len().to_numpy(dtype=float)
        safe_words = np.maximum(word_count, 1.0)
        safe_chars = np.maximum(character_count, 1.0)

        uppercase_count = series.str.findall(self._uppercase_regex).str.len().to_numpy(dtype=float)
        special_count = series.str.findall(self._special_char_regex).str.len().to_numpy(dtype=float)
        url_count = series.str.findall(self._url_regex).str.len().to_numpy(dtype=float)
        unique_words = series.apply(lambda item: len(set(item.split()))).to_numpy(dtype=float)

        uppercase_ratio = uppercase_count / safe_chars
        special_character_ratio = special_count / safe_chars
        uri_hyperlink_density = np.clip(url_count / safe_words, 0.0, 1.0)
        repetition_index = np.clip((word_count - unique_words) / safe_words, 0.0, 1.0)

        feature_values = {
            "burst_velocity": np.clip(
                1.0
                + (safe_words / 8.0)
                + (url_count * 4.0)
                + (special_character_ratio * 20.0)
                + (repetition_index * 12.0),
                1.0,
                250.0,
            ),
            "target_recipient_ratio": np.clip(
                0.05
                + uri_hyperlink_density
                + (repetition_index * 0.35)
                + (uppercase_ratio * 0.25),
                0.0,
                1.0,
            ),
            "uri_hyperlink_density": uri_hyperlink_density,
            "session_dwell_duration": np.clip(
                3.0
                + (safe_chars / 18.0)
                - (uri_hyperlink_density * 10.0)
                - (repetition_index * 6.0),
                1.0,
                600.0,
            ),
            "word_count": word_count,
            "character_count": character_count,
            "uppercase_ratio": uppercase_ratio,
            "special_character_ratio": special_character_ratio,
            "url_count": url_count,
        }
        return pd.DataFrame({column: feature_values[column] for column in self.FEATURE_COLUMNS})


feature_generator = BehaviorFeatureGenerator()
