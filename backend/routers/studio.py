from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional
import asyncio
from models import (
    JobCreatedResponse,
    JobResult,
    PipelineStep,
)
from job_manager import job_manager
from nvidia_client import nvidia_client
from services.storage import save_clip, get_voice_path

router = APIRouter()


async def _pipeline_task(
    job_id: str,
    audio_bytes: bytes,
    steps: list[PipelineStep],
    target_language: Optional[str] = None,
    voice_id: Optional[str] = None,
    total_steps: int = 1,
) -> JobResult:
    result = JobResult()
    current_audio = audio_bytes

    for i, step in enumerate(steps):
        job_manager.update_job(job_id, step=step.value, steps_completed=i, progress=int(i / total_steps * 100))

        if step == PipelineStep.clean:
            current_audio = await nvidia_client.bnr_denoise(current_audio)
            filename = save_clip(current_audio)
            result.audio_url = f"/audio/clips/{filename}"

        elif step == PipelineStep.transcribe:
            text = await nvidia_client.asr_transcribe(current_audio)
            result.text = text

        elif step == PipelineStep.translate:
            lang = target_language or "en"
            text, translated = await nvidia_client.asr_translate(current_audio, lang)
            if not result.text:
                result.text = text
            result.translated_text = translated

        elif step == PipelineStep.revoice:
            if not voice_id:
                raise ValueError("voice_id required for revoice step")
            voice_path = get_voice_path(voice_id + ".wav")
            if not voice_path:
                voice_path = get_voice_path(voice_id)
                if not voice_path:
                    raise FileNotFoundError(f"Voice {voice_id} not found")
            voice_audio = voice_path.read_bytes()
            text_to_speak = result.translated_text or result.text
            if not text_to_speak:
                raise ValueError("No text available for revoice (need transcribe or translate step first)")
            revoiced_audio = await nvidia_client.tts_clone(voice_audio, text_to_speak)
            filename = save_clip(revoiced_audio)
            result.audio_url = f"/audio/clips/{filename}"

    job_manager.update_job(job_id, steps_completed=total_steps, progress=100)
    return result


@router.post("/studio/pipeline", response_model=JobCreatedResponse)
async def run_pipeline(
    audio: UploadFile = File(...),
    steps: str = Form(...),
    target_language: Optional[str] = Form(None),
    voice_id: Optional[str] = Form(None),
):
    audio_bytes = await audio.read()
    parsed_steps = [PipelineStep(s.strip()) for s in steps.split(",")]
    total = len(parsed_steps)
    job_id = job_manager.create_job(total_steps=total)
    asyncio.ensure_future(
        job_manager.run_job(
            job_id,
            _pipeline_task,
            audio_bytes,
            parsed_steps,
            target_language,
            voice_id,
            total_steps=total,
        )
    )
    return JobCreatedResponse(job_id=job_id, status="queued")
