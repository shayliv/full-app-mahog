from functools import lru_cache
from typing import List

from pydantic import AnyUrl
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Student Management CRM"
    backend_cors_origins: List[AnyUrl] = []
    # Default to local MySQL; override via DATABASE_URL in .env if needed.
    database_url: str = "mysql+pymysql://root@localhost:3306/student_crm"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
