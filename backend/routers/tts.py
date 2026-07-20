import logging
from fastapi import APIRouter
import asyncio
from models import TTSCloneRequest, JobCreatedResponse, JobResult
from job_manager import job_manager
from nvidia_client import nvidia_client
from services.storage import get_voice_path, save_clip

logger = logging.getLogger(__name__)

router = APIRouter()


async def _tts_clone_task(job_id: str, voice_id: str, text: str) -> JobResult:
    logger.info("TTS clone job=%s: voice=%s text_len=%d", job_id, voice_id, len(text))
    voice_path = get_voice_path(voice_id + ".wav")
    if not voice_path:
        voice_path = get_voice_path(voice_id)
        if not voice_path:
            raise FileNotFoundError(f"Voice {voice_id} not found")
    voice_audio = voice_path.read_bytes()
    result_audio = await nvidia_client.tts_clone(voice_audio, text)
    filename = save_clip(result_audio)
    return JobResult(audio_url=f"/audio/clips/{filename}")


@router.post("/tts/clone", response_model=JobCreatedResponse)
async def tts_clone(request: TTSCloneRequest):
    job_id = job_manager.create_job()
    logger.info("TTS clone request: voice=%s text_len=%d -> job=%s", request.voice_id, len(request.text), job_id)
    asyncio.ensure_future(job_manager.run_job(job_id, _tts_clone_task, request.voice_id, request.text))
    return JobCreatedResponse(job_id=job_id, status="queued")
