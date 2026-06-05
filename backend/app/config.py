from functools import lru_cache

from pydantic import ConfigDict
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./pitwise.db"
    ai_mode: str = "fallback"
    llm_api_key: str | None = None
    llm_api_url: str | None = None
    backend_cors_origins: str = "*"

    model_config = ConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache
def get_settings() -> Settings:
    return Settings()
