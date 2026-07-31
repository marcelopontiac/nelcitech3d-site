import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./nelci.db"
    SECRET_KEY: str = "change-this-to-a-secure-random-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    BRAPI_TOKEN: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
