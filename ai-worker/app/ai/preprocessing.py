"""
Text Preprocessing Module for Trust & Safety AI Worker.

This module provides an optimized, lightweight text preprocessor designed 
specifically to match the cleaning pipeline of the pre-trained TF-IDF vectorizer. 
It intentionally omits advanced NLP techniques (stemming, lemmatization, stop-word 
removal) to maintain feature alignment with the model.
"""

import re
import string
from typing import Optional


class TextPreprocessor:
    """
    A text preprocessor that standardizes input data using compiled regular expressions.
    Designed to be instantiated once and reused across multiple requests.
    """

    def __init__(self) -> None:
        """
        Initialize and compile all regular expression patterns to optimize 
        performance for repeated calls in a production environment.
        """
        # Matches standard HTML tags
        self._html_pattern = re.compile(r"<[^>]+>")
        
        # Matches URLs (http, https, or www)
        self._url_pattern = re.compile(r"https?://\S+|www\.\S+")
        
        # Matches basic email formats
        self._email_pattern = re.compile(r"\S+@\S+")
        
        # Matches any numerical digit
        self._digit_pattern = re.compile(r"\d+")
        
        # Matches any standard punctuation character
        # re.escape ensures characters like '[' or '-' are treated literally
        self._punctuation_pattern = re.compile(f"[{re.escape(string.punctuation)}]")
        
        # Matches one or more whitespace characters (spaces, tabs, newlines)
        self._whitespace_pattern = re.compile(r"\s+")

    def clean_text(self, text: Optional[str]) -> str:
        """
        Clean and normalize raw text data.

        Args:
            text (Optional[str]): The raw input string to be cleaned.

        Returns:
            str: The cleaned and normalized string. Returns an empty string 
                 if the input is None or if the cleaning process removes all content.
        """
        if text is None:
            return ""

        # 1. Convert to lowercase
        cleaned_text = text.lower()

        # 2. Remove HTML tags
        cleaned_text = self._html_pattern.sub(" ", cleaned_text)

        # 3. Remove URLs
        cleaned_text = self._url_pattern.sub(" ", cleaned_text)

        # 4. Remove Email addresses
        cleaned_text = self._email_pattern.sub(" ", cleaned_text)

        # 5. Remove Digits
        cleaned_text = self._digit_pattern.sub(" ", cleaned_text)

        # 6. Remove Punctuation
        cleaned_text = self._punctuation_pattern.sub(" ", cleaned_text)

        # 7. Normalize whitespace (replace multiple spaces/newlines with a single space)
        cleaned_text = self._whitespace_pattern.sub(" ", cleaned_text)

        # 8. Strip leading and trailing whitespace
        cleaned_text = cleaned_text.strip()

        return cleaned_text


# Singleton instance intended for import and reuse across the FastAPI application
preprocessor = TextPreprocessor()