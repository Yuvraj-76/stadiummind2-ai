from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.health import router as health_router
from api.stadium import router as stadium_router
from core.config import settings
from core.logging import setup_logging
from middleware.errors import register_exception_handlers

# Setup logging configuration on bootstrap
setup_logging()

app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "StadiumMind AI — FIFA World Cup 2026 " "Arena Operations & Fan Platform API"
    ),
    version=settings.API_VERSION,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# Set up CORS middleware from configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register custom global exception handlers
register_exception_handlers(app)

# Include routing endpoints
app.include_router(health_router)
app.include_router(stadium_router)
