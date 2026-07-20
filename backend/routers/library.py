import json
import logging
from pathlib import Path
from datetime import datetime, timezone
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from models import VoiceResponse, VoiceListResponse, ClipResponse, ClipListResponse
from services.storage import save_voice, delete_voice, delete_clip
from services.audio_service import get_duration_secs

logger = logging.getLogger(__name__)

router = APIRouter()
META_FILE_VOICES = Path("data/voices_meta.json")
META_FILE_CLIPS = Path("data/clips_meta.json")


def _load_meta(path: Path) -> dict:
    if not path.exists():
        return {}
    return json.loads(path.read_text())


def _save_meta(path: Path, meta: dict):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(meta, indent=2))


@router.get("/voices", response_model=VoiceListResponse)
async def list_voices():
    meta = _load_meta(META_FILE_VOICES)
    logger.info("List voices: count=%d", len(meta))
    voices = []
    for vid, info in meta.items():
        voices.append(VoiceResponse(
            id=vid,
            name=info["name"],
            filename=info["filename"],
            duration_secs=info["duration_secs"],
            created_at=info["created_at"],
        ))
    voices.sort(key=lambda v: v.created_at, reverse=True)
    return VoiceListResponse(voices=voices)


@router.post("/voices", response_model=VoiceResponse)
async def save_voice_endpoint(
    name: str = Form(...),
    audio: UploadFile = File(...),
):
    audio_bytes = await audio.read()
    filename = save_voice(audio_bytes)
    duration = get_duration_secs(audio_bytes)
    logger.info("Save voice: name=%s filename=%s size=%d duration=%.1fs", name, filename, len(audio_bytes), duration)
    voice_id = filename.replace(".wav", "")
    meta = _load_meta(META_FILE_VOICES)
    meta[voice_id] = {
        "name": name,
        "filename": filename,
        "duration_secs": duration,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _save_meta(META_FILE_VOICES, meta)
    return VoiceResponse(
        id=voice_id,
        name=name,
        filename=filename,
        duration_secs=duration,
        created_at=meta[voice_id]["created_at"],
    )


@router.delete("/voices/{voice_id}", status_code=204)
async def delete_voice_endpoint(voice_id: str):
    meta = _load_meta(META_FILE_VOICES)
    info = meta.pop(voice_id, None)
    if not info:
        logger.warning("Delete voice failed: voice=%s not found", voice_id)
        raise HTTPException(404, "Voice not found")
    logger.info("Delete voice: voice=%s filename=%s", voice_id, info["filename"])
    delete_voice(info["filename"])
    _save_meta(META_FILE_VOICES, meta)


@router.get("/clips", response_model=ClipListResponse)
async def list_clips():
    meta = _load_meta(META_FILE_CLIPS)
    logger.info("List clips: count=%d", len(meta))
    clips = []
    for cid, info in meta.items():
        clips.append(ClipResponse(
            id=cid,
            name=info["name"],
            filename=info["filename"],
            duration_secs=info["duration_secs"],
            created_at=info["created_at"],
            source_job_id=info.get("source_job_id", ""),
        ))
    clips.sort(key=lambda c: c.created_at, reverse=True)
    return ClipListResponse(clips=clips)


@router.delete("/clips/{clip_id}", status_code=204)
async def delete_clip_endpoint(clip_id: str):
    meta = _load_meta(META_FILE_CLIPS)
    info = meta.pop(clip_id, None)
    if not info:
        logger.warning("Delete clip failed: clip=%s not found", clip_id)
        raise HTTPException(404, "Clip not found")
    logger.info("Delete clip: clip=%s filename=%s", clip_id, info["filename"])
    delete_clip(info["filename"])
    _save_meta(META_FILE_CLIPS, meta)
