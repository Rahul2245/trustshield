"""Tier-1 NLP inference wrapper."""

from __future__ import annotations

from dataclasses import asdict, dataclass

from app.ai.model_loader import model_loader
from app.ai.preprocessing import preprocessor


@dataclass(frozen=True)
class NLPPrediction:
    """Structured output from the text classifier."""

    cleaned_text: str
    spam_probability: float
    safe_probability: float
    predicted_label: str
    risk_score: float

    def model_dump(self) -> dict[str, float | str]:
        return asdict(self)


class NLPModel:
    """Runs text cleaning, TF-IDF vectorization, and Naive Bayes inference."""

    def predict(self, text: str) -> NLPPrediction:
        cleaned_text = preprocessor.clean_text(text)
        vector = model_loader.vectorizer.transform([cleaned_text])
        probabilities = model_loader.naive_bayes.predict_proba(vector)[0]

        classes = list(model_loader.naive_bayes.classes_)
        spam_index = classes.index(1) if 1 in classes else len(probabilities) - 1
        safe_index = classes.index(0) if 0 in classes else 0
        spam_probability = float(probabilities[spam_index])
        safe_probability = float(probabilities[safe_index])

        return NLPPrediction(
            cleaned_text=cleaned_text,
            spam_probability=spam_probability,
            safe_probability=safe_probability,
            predicted_label="SPAM" if spam_probability >= 0.5 else "SAFE",
            risk_score=round(spam_probability * 100.0, 4),
        )


nlp_model = NLPModel()
