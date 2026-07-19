import logging
import sys

from core.config import settings


def setup_logging() -> None:
    """Initialises standard logging for StadiumMind AI."""
    # Reset existing handlers to prevent duplicate logs
    logging.root.handlers = []

    log_level = logging.DEBUG if settings.DEBUG else logging.INFO

    # Human-readable formatting for logs
    formatter = logging.Formatter(
        fmt="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)

    # Configure base root logger
    logging.basicConfig(level=log_level, handlers=[console_handler])

    # Silence verbose dependencies
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)
