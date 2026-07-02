import logging
import sys

from app.config.settings import settings


# Logging Format Configuration

LOG_FORMAT = "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"


def configure_logging() -> None:


    # Resolve log level from settings
    log_level_name = getattr(settings, "LOG_LEVEL", "INFO")
    log_level = getattr(logging, log_level_name.upper(), logging.INFO)

    formatter = logging.Formatter(
        fmt=LOG_FORMAT,
        datefmt=DATE_FORMAT,
    )

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)

    # Configure console handler only once
    if not root_logger.handlers:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(log_level)
        console_handler.setFormatter(formatter)
        root_logger.addHandler(console_handler)
    else:
        # Synchronize existing handlers
        for handler in root_logger.handlers:
            handler.setLevel(log_level)
            handler.setFormatter(formatter)

    # Startup confirmation
    root_logger.info("Logging configured successfully.")


def get_logger(name: str) -> logging.Logger:
    """
    Return a configured logger.

    Args:
        name: Usually __name__.

    Returns:
        A logger instance that inherits the root logger configuration.
    """
    return logging.getLogger(name)