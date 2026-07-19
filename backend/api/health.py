from datetime import UTC, datetime

from fastapi import APIRouter

from core.config import settings

router = APIRouter()


@router.get("/health", tags=["System"])
async def get_health() -> dict[str, str]:
    """Returns the API service health, version, and server timestamp."""
    return {
        "status": "ok",
        "version": settings.API_VERSION,
        "timestamp": datetime.now(UTC).isoformat(),
    }
