"""Backward-compatible entry point for NLP training."""

from training.nlp_trainer import NLPTrainer, main

__all__ = ["NLPTrainer", "main"]


if __name__ == "__main__":
    main()
