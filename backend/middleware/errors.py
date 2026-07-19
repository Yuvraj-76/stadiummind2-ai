import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from core.exceptions import (
    BaseAppException,
    EntityNotFoundException,
    ForbiddenException,
    InvalidCredentialsException,
    ServiceUnavailableException,
    ValidationException,
)

logger = logging.getLogger("errors")


def register_exception_handlers(app: FastAPI) -> None:
    """Registers global handlers mapping core exceptions to JSON outputs."""

    @app.exception_handler(BaseAppException)
    async def app_exception_handler(_: Request, exc: BaseAppException) -> JSONResponse:
        status_code = 500
        if isinstance(exc, EntityNotFoundException):
            status_code = 404
        elif isinstance(exc, InvalidCredentialsException):
            status_code = 401
        elif isinstance(exc, ForbiddenException):
            status_code = 403
        elif isinstance(exc, ValidationException):
            status_code = 400
        elif isinstance(exc, ServiceUnavailableException):
            status_code = 503

        logger.warning(
            "Application exception intercepted: %s - %s",
            exc.__class__.__name__,
            exc.message,
        )
        return JSONResponse(
            status_code=status_code,
            content={
                "error": exc.__class__.__name__,
                "message": exc.message,
                "status": "error",
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(_: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled server error caught: %s", str(exc))
        return JSONResponse(
            status_code=500,
            content={
                "error": "InternalServerError",
                "message": "An unexpected error occurred. Please try again later.",
                "status": "error",
            },
        )
