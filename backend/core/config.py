import json

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", case_sensitive=True, extra="ignore"
    )

    APP_NAME: str = "StadiumMind AI API"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_VERSION: str = "0.1.0"

    HOST: str = "127.0.0.1"
    PORT: int = 8000

    DATABASE_URL: str = (
        "postgresql://postgres:your-super-secret-password@db.supabase.co:5432/postgres"
    )

    SUPABASE_URL: str = "https://your-project.supabase.co"
    SUPABASE_ANON_KEY: str = "your-supabase-anon-key"
    SUPABASE_JWT_SECRET: str = "your-supabase-jwt-secret"

    OPENAI_API_KEY: str = "your-openai-api-key"
    OPENAI_MODEL_NAME: str = "gpt-4-turbo"

    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://stadiummind-ai.vercel.app",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                try:
                    parsed = json.loads(v)
                    if isinstance(parsed, list):
                        return [str(item) for item in parsed]
                except json.JSONDecodeError:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return [str(item) for item in v]
        raise ValueError(
            "CORS_ORIGINS must be a comma-separated string or a JSON list of strings"
        )


settings = Settings()
