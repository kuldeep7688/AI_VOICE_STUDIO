from pydantic import BaseModel, Field
from enum import Enum
from typing import Optional


class JobStatus(str, Enum):
    queued = "queued"
    processing = "processing"
    done = "done"
    failed = "failed"


class PipelineStep(str, Enum):
    clean = "clean"
    transcribe = "transcribe"
    translate = "translate"
    revoice = "revoice"


class Language(str, Enum):
    en = "en"
    fr = "fr"
    es = "es"
    de = "de"
    hi = "hi"


class TTSCloneRequest(BaseModel):
    voice_id: str
    text: str = Field(..., min_length=1, max_length=5000)


class StudioPipelineRequest(BaseModel):
    steps: list[PipelineStep]
    target_language: Optional[Language] = None
    voice_id: Optional[str] = None


class VoiceCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class JobCreatedResponse(BaseModel):
    job_id: str
    status: str


class VoiceResponse(BaseModel):
    id: str
    name: str
    filename: str
    duration_secs: float
    created_at: str


class VoiceListResponse(BaseModel):
    voices: list[VoiceResponse]


class ClipResponse(BaseModel):
    id: str
    name: str
    filename: str
    duration_secs: float
    created_at: str
    source_job_id: str


class ClipListResponse(BaseModel):
    clips: list[ClipResponse]


class JobError(BaseModel):
    stage: Optional[str] = None
    message: str


class JobResult(BaseModel):
    audio_url: Optional[str] = None
    text: Optional[str] = None
    translated_text: Optional[str] = None


class JobResponse(BaseModel):
    job_id: str
    status: JobStatus
    progress: int = 0
    step: Optional[str] = None
    steps_completed: int = 0
    total_steps: int = 1
    result: Optional[JobResult] = None
    error: Optional[JobError] = None
    created_at: str
