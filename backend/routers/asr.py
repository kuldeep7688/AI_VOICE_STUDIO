import logging
from fastapi import APIRouter, UploadFile, File, Form
import asyncio
from models import JobCreatedResponse, JobResult, Language
from job_manager import job_manager
from nvidia_client import nvidia_client

logger = logging.getLogger(__name__)

router = APIRouter()


async def _transcribe_task(job_id: str, audio_bytes: bytes) -> JobResult:
    logger.info("ASR transcribe job=%s: audio_size=%d bytes", job_id, len(audio_bytes))
    text = await nvidia_client.asr_transcribe(audio_bytes)
    return JobResult(text=text)


async def _translate_task(job_id: str, audio_bytes: bytes, target_lang: str) -> JobResult:
    logger.info("ASR translate job=%s: audio_size=%d target=%s", job_id, len(audio_bytes), target_lang)
    text, translated = await nvidia_client.asr_translate(audio_bytes, target_lang)
    return JobResult(text=text, translated_text=translated)


@router.post("/asr", response_model=JobCreatedResponse)
async def transcribe(audio: UploadFile = File(...)):
    audio_bytes = await audio.read()
    job_id = job_manager.create_job()
    logger.info("ASR transcribe request: filename=%s size=%d -> job=%s", audio.filename or "unknown", len(audio_bytes), job_id)
    asyncio.ensure_future(job_manager.run_job(job_id, _transcribe_task, audio_bytes))
    return JobCreatedResponse(job_id=job_id, status="queued")


@router.post("/asr/translate", response_model=JobCreatedResponse)
async def translate(
    audio: UploadFile = File(...),
    target_language: Language = Form(Language.en),
):
    audio_bytes = await audio.read()
    job_id = job_manager.create_job()
    logger.info("ASR translate request: filename=%s size=%d lang=%s -> job=%s", audio.filename or "unknown", len(audio_bytes), target_language.value, job_id)
    asyncio.ensure_future(job_manager.run_job(job_id, _translate_task, audio_bytes, target_language.value))
    return JobCreatedResponse(job_id=job_id, status="queued")
