from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    nvidia_api_key: str = ""
    api_base_url: str = "https://api.nvidia.com/v1"
    storage_dir: str = "./uploads"
    max_upload_size_bytes: int = 16 * 1024 * 1024
    max_recording_duration_secs: int = 60
    max_voice_sample_duration_secs: int = 15
    job_expiry_seconds: int = 3600
    job_cleanup_interval_seconds: int = 900
    log_level: str = "INFO"
    log_format: str = "text"
    log_file: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}

settings = Settings()


def get_voices_dir() -> Path:
    return Path(settings.storage_dir) / "voices"


def get_clips_dir() -> Path:
    return Path(settings.storage_dir) / "clips"


def get_recordings_dir() -> Path:
    return Path(settings.storage_dir) / "recordings"
