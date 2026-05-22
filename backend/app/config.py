"""应用配置管理"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # 应用
    app_name: str = "HR 招聘助手"
    app_version: str = "0.1.0"
    debug: bool = True

    # 数据库
    database_url: str = "sqlite+aiosqlite:///./hr_recruiter.db"

    # 文件上传
    upload_dir: str = "../uploads"
    max_upload_size_mb: int = 10
    allowed_extensions: list[str] = [".pdf", ".docx", ".doc"]

    # Hermes Agent
    hermes_bin: str = "hermes"
    hermes_timeout: int = 120

    # CORS — 开发阶段允许前端所有来源
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    model_config = {"env_prefix": "HR_", "env_file": ".env"}


settings = Settings()
