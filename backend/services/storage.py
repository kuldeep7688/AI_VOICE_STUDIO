import uuid
from pathlib import Path
from typing import Optional
from config import settings
from services.audio_service import validate_wav


class StorageError(Exception):
    pass


def _ensure_dir(d: Path) -> Path:
    d.mkdir(parents=True, exist_ok=True)
    return d


def save_voice(audio_bytes: bytes) -> str:
    validate_wav(audio_bytes, max_duration_secs=settings.max_voice_sample_duration_secs)
    filename = f"{uuid.uuid4().hex}.wav"
    dest = _ensure_dir(Path(settings.storage_dir) / "voices") / filename
    dest.write_bytes(audio_bytes)
    return filename


def save_clip(audio_bytes: bytes) -> str:
    filename = f"{uuid.uuid4().hex}.wav"
    dest = _ensure_dir(Path(settings.storage_dir) / "clips") / filename
    dest.write_bytes(audio_bytes)
    return filename


def save_recording(audio_bytes: bytes) -> str:
    filename = f"{uuid.uuid4().hex}.wav"
    dest = _ensure_dir(Path(settings.storage_dir) / "recordings") / filename
    dest.write_bytes(audio_bytes)
    return filename


def get_voice_path(filename: str) -> Optional[Path]:
    p = Path(settings.storage_dir) / "voices" / filename
    return p if p.exists() else None


def get_clip_path(filename: str) -> Optional[Path]:
    p = Path(settings.storage_dir) / "clips" / filename
    return p if p.exists() else None


def delete_voice(filename: str) -> bool:
    p = Path(settings.storage_dir) / "voices" / filename
    if p.exists():
        p.unlink()
        return True
    return False


def delete_clip(filename: str) -> bool:
    p = Path(settings.storage_dir) / "clips" / filename
    if p.exists():
        p.unlink()
        return True
    return False


def get_path(url_path: str) -> Optional[Path]:
    """Resolve an /audio/voices/xxx.wav URL to a filesystem path."""
    parts = url_path.split("/audio/", 1)
    if len(parts) != 2:
        return None
    p = Path(settings.storage_dir) / parts[1]
    return p if p.exists() else None
