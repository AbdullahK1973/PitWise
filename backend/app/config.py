from functools import lru_cache
from typing import Literal

from pydantic import ConfigDict, field_validator, model_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_env: Literal["development", "test", "production"] = "development"
    database_url: str = "sqlite:///./pitwise.db"
    ai_mode: str = "fallback"
    llm_api_key: str | None = None
    llm_api_url: str | None = None
    backend_cors_origins: str = "*"
    backend_trusted_hosts: str = "*"
    auto_create_tables: bool = True
    seed_database_on_startup: bool = True
    seed_demo_data: bool = True
    sql_echo: bool = False
    database_pool_size: int = 5
    database_max_overflow: int = 10
    database_pool_recycle_seconds: int = 1800

    @field_validator("backend_cors_origins", "backend_trusted_hosts")
    @classmethod
    def require_locked_down_http_boundaries_in_production(cls, value: str, info):
        app_env = info.data.get("app_env")
        if app_env == "production" and value.strip() == "*":
            raise ValueError(f"{info.field_name.upper()} must be explicit in production.")
        return value

    @field_validator("database_url")
    @classmethod
    def require_managed_database_in_production(cls, value: str, info):
        app_env = info.data.get("app_env")
        if app_env == "production" and value.startswith("sqlite"):
            raise ValueError("DATABASE_URL must use a production database in production.")
        return value

    @model_validator(mode="after")
    def require_explicit_production_startup_behaviour(self):
        if self.app_env == "production":
            if self.auto_create_tables:
                raise ValueError("AUTO_CREATE_TABLES must be false in production. Run Alembic migrations instead.")
            if self.seed_database_on_startup:
                raise ValueError("SEED_DATABASE_ON_STARTUP must be false in production. Seed reference data as a release task.")
            if self.seed_demo_data:
                raise ValueError("SEED_DEMO_DATA must be false in production.")
        return self

    model_config = ConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
