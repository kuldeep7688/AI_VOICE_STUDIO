from fastapi import APIRouter, UploadFile, File, Form
import asyncio
from models import JobCreatedResponse, JobResult, Language
from job_manager import job_manager
from nvidia_client import nvidia_client

router = APIRouter()


async def _transcribe_task(job_id: str, audio_bytes: bytes) -> JobResult:
    text = await nvidia_client.asr_transcribe(audio_bytes)
    return JobResult(text=text)


async def _translate_task(job_id: str, audio_bytes: bytes, target_lang: str) -> JobResult:
    text, translated = await nvidia_client.asr_translate(audio_bytes, target_lang)
    return JobResult(text=text, translated_text=translated)


@router.post("/asr", response_model=JobCreatedResponse)
async def transcribe(audio: UploadFile = File(...)):
    audio_bytes = await audio.read()
    job_id = job_manager.create_job()
    asyncio.ensure_future(job_manager.run_job(job_id, _transcribe_task, audio_bytes))
    return JobCreatedResponse(job_id=job_id, status="queued")


@router.post("/asr/translate", response_model=JobCreatedResponse)
async def translate(
    audio: UploadFile = File(...),
    target_language: Language = Form(Language.en),
):
    audio_bytes = await audio.read()
    job_id = job_manager.create_job()
    asyncio.ensure_future(job_manager.run_job(job_id, _translate_task, audio_bytes, target_language.value))
    return JobCreatedResponse(job_id=job_id, status="queued")
