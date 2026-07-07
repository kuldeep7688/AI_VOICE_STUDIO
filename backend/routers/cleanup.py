from fastapi import APIRouter, UploadFile, File
import asyncio
from models import JobCreatedResponse, JobResult
from job_manager import job_manager
from nvidia_client import nvidia_client
from services.storage import save_clip

router = APIRouter()


async def _clean_task(job_id: str, audio_bytes: bytes) -> JobResult:
    clean_audio = await nvidia_client.bnr_denoise(audio_bytes)
    filename = save_clip(clean_audio)
    return JobResult(audio_url=f"/audio/clips/{filename}")


@router.post("/clean", response_model=JobCreatedResponse)
async def clean_audio(audio: UploadFile = File(...)):
    audio_bytes = await audio.read()
    job_id = job_manager.create_job()
    asyncio.ensure_future(job_manager.run_job(job_id, _clean_task, audio_bytes))
    return JobCreatedResponse(job_id=job_id, status="queued")
