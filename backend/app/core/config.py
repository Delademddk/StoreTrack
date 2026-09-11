import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    JWT_SECRET: str = "storetrack-dev-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 480
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:8080"]
    BACKEND_PORT: int = 3001

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
