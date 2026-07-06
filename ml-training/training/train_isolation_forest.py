"""Backward-compatible entry point for Isolation Forest training."""

from training.isolation_forest_trainer import IsolationForestTrainer, main

__all__ = ["IsolationForestTrainer", "main"]


if __name__ == "__main__":
    main()
