"""
training/preprocessing.py

Provides text preprocessing capabilities for the Trust & Safety system.

CRITICAL:
This preprocessing logic must remain strictly synchronized with the
inference preprocessing logic in the AI Worker to prevent
training-serving skew.
"""

import logging
import re
import string

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


class TextPreprocessor:
    """
    Cleans raw text using compiled regular expressions.

    Designed to be lightweight, deterministic, and synchronized with the
    inference preprocessing pipeline.
    """

    def __init__(self) -> None:
        """Compile all regex patterns once for maximum performance."""

        # HTML tags
        self._re_html = re.compile(r"<[^>]+>")

        # URLs
        self._re_url = re.compile(r"https?://\S+|www\.\S+")

        # Email addresses
        self._re_email = re.compile(r"\S+@\S+")

        # Digits
        self._re_digits = re.compile(r"\d+")

        # Punctuation
        self._re_punct = re.compile(
            rf"[{re.escape(string.punctuation)}]"
        )

        # Consecutive whitespace
        self._re_whitespace = re.compile(r"\s+")

    def clean_text(self, text: str) -> str:
        """
        Clean a single text string.

        Processing steps:
            1. Handle None values
            2. Convert to string (if needed)
            3. Lowercase
            4. Remove HTML
            5. Remove URLs
            6. Remove email addresses
            7. Remove digits
            8. Remove punctuation
            9. Normalize whitespace

        Args:
            text:
                Raw text.

        Returns:
            Cleaned text.
        """

        # Avoid converting None -> "None"
        if text is None:
            return ""

        if not isinstance(text, str):
            text = str(text)

        text = text.lower()

        text = self._re_html.sub(" ", text)
        text = self._re_url.sub(" ", text)
        text = self._re_email.sub(" ", text)
        text = self._re_digits.sub(" ", text)
        text = self._re_punct.sub(" ", text)

        text = self._re_whitespace.sub(" ", text).strip()

        return text

    def clean_dataframe(
        self,
        df: pd.DataFrame,
        text_column: str = "text",
    ) -> pd.DataFrame:
        """
        Clean an entire dataframe without modifying the original.

        Args:
            df:
                Input dataframe.

            text_column:
                Name of the text column.

        Returns:
            Cleaned dataframe.

        Raises:
            ValueError:
                If the text column does not exist.
        """

        if text_column not in df.columns:
            message = (
                f"Target column '{text_column}' not found in DataFrame."
            )
            logger.error(message)
            raise ValueError(message)    

        logger.info(
            "Starting preprocessing for column '%s'.",
            text_column,
        )

        # Explicit deep copy
        cleaned_df = df.copy(deep=True)

        initial_rows = len(cleaned_df)

        # Replace missing values with empty strings
        cleaned_df[text_column] = (
            cleaned_df[text_column]
            .fillna("")
            .apply(self.clean_text)
        )

        # Remove rows that became empty after preprocessing
        cleaned_df = cleaned_df[
            cleaned_df[text_column] != ""
        ]

        cleaned_df.reset_index(
            drop=True,
            inplace=True,
        )

        final_rows = len(cleaned_df)

        logger.info(
            "Preprocessing complete. "
            "Removed %d empty rows. Final row count: %d.",
            initial_rows - final_rows,
            final_rows,
        )

        return cleaned_df


# Global reusable instance
preprocessor = TextPreprocessor()