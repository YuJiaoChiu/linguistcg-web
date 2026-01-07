"""
应用配置
"""

import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """应用设置"""

    # 应用基础配置
    APP_NAME: str = "LinguistCG"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"

    # API 配置
    API_PREFIX: str = "/api"

    # CORS 配置 - 支持从环境变量添加额外的域名
    @property
    def ALLOWED_ORIGINS(self) -> List[str]:
        origins = [
            "http://localhost:3000",
            "http://localhost:8000",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:8000",
        ]
        # 从环境变量读取额外的允许域名（逗号分隔）
        extra_origins = os.getenv("ALLOWED_ORIGINS", "")
        if extra_origins:
            origins.extend([o.strip() for o in extra_origins.split(",") if o.strip()])
        return origins

    # 文件配置
    MAX_UPLOAD_SIZE: int = 100 * 1024 * 1024  # 100MB
    ALLOWED_EXTENSIONS: List[str] = [".srt"]

    # 路径配置
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    DICTIONARIES_DIR: Path = BASE_DIR.parent / "dictionaries"
    UPLOADS_DIR: Path = BASE_DIR / "uploads"
    PROCESSED_DIR: Path = BASE_DIR / "processed"
    BACKUP_DIR: Path = BASE_DIR / "backups"  # 源文件备份目录

    # 处理配置
    MAX_CONCURRENT_TASKS: int = 5
    TASK_TIMEOUT: int = 300  # 5分钟

    # 字典文件路径
    CORRECTION_DICT_PATH: Path = DICTIONARIES_DIR / "Correction.json"
    SHIELDING_DICT_PATH: Path = DICTIONARIES_DIR / "shielding.json"

    class Config:
        env_file = ".env"
        case_sensitive = True


# 创建全局配置实例
settings = Settings()
