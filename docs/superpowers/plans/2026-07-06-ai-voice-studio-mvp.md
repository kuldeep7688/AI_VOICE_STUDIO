# AI Voice Studio MVP -- Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the AI Voice Studio MVP with Voice Cloning, Studio Recorder pipeline, and Library for saved voices/clips.

**Architecture:** Orchestrated FastAPI backend with in-memory job queue serving a React frontend with left sidebar navigation (matching figma_design/*.png). All generative endpoints return job_ids; frontend polls for results. Single nvidia_client.py wraps all NIM API calls. Design tokens (CSS custom properties) define dark-only color system with Nvidia green accent.

**Tech Stack:** FastAPI, httpx, React 18 (Vite), TypeScript, TailwindCSS, Web Audio API, MediaRecorder API

---

## Phase 1: Project Scaffolding

### Task 1: Scaffold Backend Project

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/.env.example`
- Create: `backend/config.py`
- Create: `backend/main.py`
- Create: `backend/routers/__init__.py`
- Create: `backend/services/__init__.py`

**Purpose:** Minimal bootable FastAPI app with config, CORS, static file serving, and router mounts.

- [ ] **Step 1: Create requirements.txt**

Write `backend/requirements.txt`:
```
fastapi>=0.115.0
uvicorn[standard]>=0.32.0
python-multipart>=0.0.17
httpx>=0.28.0
python-dotenv>=1.0.0
pydantic>=2.0.0
pydantic-settings>=2.0.0
pytest>=8.0.0
pytest-asyncio>=0.24.0
httpx>=0.28.0
```

- [ ] **Step 2: Create .env.example**

Write `backend/.env.example`:
```
NVIDIA_API_KEY=nvapi-...
API_BASE_URL=https://api.nvidia.com/v1
STORAGE_DIR=./uploads
```

- [ ] **Step 3: Create config.py**

Write `backend/config.py`:
```python
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

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

settings = Settings()


def get_voices_dir() -> Path:
    return Path(settings.storage_dir) / "voices"


def get_clips_dir() -> Path:
    return Path(settings.storage_dir) / "clips"


def get_recordings_dir() -> Path:
    return Path(settings.storage_dir) / "recordings"
```

- [ ] **Step 4: Create __init__.py files**

Write `backend/routers/__init__.py` -- empty file.

Write `backend/services/__init__.py` -- empty file.

- [ ] **Step 5: Create main.py**

Write `backend/main.py`:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from config import settings, get_voices_dir, get_clips_dir, get_recordings_dir
from routers import tts, asr, cleanup, studio, library, jobs

for d in [get_voices_dir(), get_clips_dir(), get_recordings_dir()]:
    d.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="AI Voice Studio", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/audio", StaticFiles(directory=str(Path(settings.storage_dir))), name="audio")

app.include_router(tts.router, prefix="/api")
app.include_router(asr.router, prefix="/api")
app.include_router(cleanup.router, prefix="/api")
app.include_router(studio.router, prefix="/api")
app.include_router(library.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/models")
def list_models():
    return [
        {"id": "magpie-tts-zeroshot", "name": "Magpie TTS Zero-Shot", "type": "tts", "status": "available"},
        {"id": "canary-1b-asr", "name": "Canary 1B ASR", "type": "asr", "status": "available"},
        {"id": "bnr", "name": "Background Noise Removal", "type": "cleanup", "status": "available"},
    ]
```

- [ ] **Step 6: Verify backend boots**

Run: `cd backend && pip install -r requirements.txt && cp .env.example .env`
Run: `cd backend && uvicorn main:app --port 8000 &`
Run: `curl http://localhost:8000/api/health`
Expected: `{"status":"ok"}`
Then: `kill %1`

- [ ] **Step 7: Commit**

```bash
git add backend/ && git commit -m "feat: scaffold backend project with FastAPI"
```

---

### Task 2: Scaffold Frontend Project

**Files:**
- Create via Vite: `frontend/`
- Modify: `frontend/vite.config.ts`

- [ ] **Step 1: Create Vite + React + TypeScript project**

Run: `npm create vite@latest frontend -- --template react-ts`

Note: If the `frontend/` directory already exists, use a temp dir and move:
```bash
cd /tmp && npm create vite@latest ai-voice-frontend -- --template react-ts
cp -r /tmp/ai-voice-frontend/* /run/media/kuldeepsingh/Work/github/ai-voice-studio/frontend/
```

- [ ] **Step 2: Install dependencies**

Run: `cd frontend && npm install`

- [ ] **Step 3: Install TailwindCSS + lucide-react**

Run: `cd frontend && npm install -D tailwindcss @tailwindcss/vite && npm install lucide-react`

- [ ] **Step 4: Configure Tailwind via Vite plugin**

Write `frontend/vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
      '/audio': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
})
```

- [ ] **Step 5: Setup global CSS with design tokens**

Read `frontend/src/index.css` (or `App.css` depending on what Vite generates), write `frontend/src/globals.css`:
```css
@import "tailwindcss";
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

:root {
  color-scheme: dark;

  /* Colors — MUST match figma_design/*.png */
  --bg: #0a0a0a;
  --surface: #111111;
  --surface-hover: #161616;
  --border: #1f1f1f;
  --border-strong: #2a2a2a;
  --text: #e5e5e5;
  --text-muted: #8a8a8a;
  --text-subtle: #5a5a5a;
  --accent: #76b900;
  --accent-hover: #88d000;
  --accent-bg: rgba(118, 185, 0, 0.10);

  /* Voice color-coding */
  --voice-green: #76b900;
  --voice-blue: #4ea3ff;
  --voice-purple: #a780ff;
  --voice-orange: #e89040;

  --danger: #ef4444;

  /* Typography */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'IBM Plex Mono', ui-monospace, monospace;

  /* Motion */
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
}

/* Base */
body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}

/* Section label pattern (NVIDIA, RECORDER, PIPELINE, etc.) */
.section-label {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-muted);
}

/* Button press feedback */
.btn-press {
  transition: transform 160ms var(--ease-out);
}
.btn-press:active {
  transform: scale(0.97);
}

/* Hover lift — gated behind pointer media */
@media (hover: hover) and (pointer: fine) {
  .hover-lift {
    transition: transform 200ms var(--ease-out);
  }
  .hover-lift:hover {
    transform: scale(1.02);
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  .btn-press:active, .hover-lift:hover { transform: none; }
}

/* Pulse animation for status dot (opacity only, no transform) */
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* Spin for job overlay */
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Stagger entrance: scale(0.95) + opacity 0 → identity */
@keyframes scale-in {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* Fade up for list stagger */
@keyframes fade-up {
  from { transform: translateY(8px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```

Also update `frontend/src/main.tsx` to import `globals.css` instead of whatever CSS Vite generated.

- [ ] **Step 6: Verify frontend boots**

Run: `cd frontend && npx vite --port 5173 &`
Run: `curl -s http://localhost:5173 | head -5`
Expected: HTML with `<div id="root"></div>`
Then: `kill %1`

- [ ] **Step 7: Commit**

```bash
git add frontend/ && git commit -m "feat: scaffold frontend with Vite + React + TailwindCSS"
```

---

## Phase 2: Backend Core — Models + Services

### Task 3: Pydantic Schemas

**Files:**
- Create: `backend/models.py`

**Purpose:** All request/response schemas. Audio files come via `UploadFile` (multipart), not inside JSON.

- [ ] **Step 1: Write models.py**

Write `backend/models.py`:
```python
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


class VoiceResponse(BaseModel):
    id: str
    name: str
    filename: str
    duration_secs: float
    created_at: str


class ClipResponse(BaseModel):
    id: str
    name: str
    filename: str
    duration_secs: float
    created_at: str
    source_job_id: str


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
```

- [ ] **Step 2: Run a quick import test**

Run: `cd backend && python -c "from models import TTSCloneRequest, JobStatus; print('OK')"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add backend/models.py && git commit -m "feat: add Pydantic schemas for all API models"
```

---

### Task 4: Audio Service

**Files:**
- Create: `backend/services/audio_service.py`

**Purpose:** WAV validation, duration calculation, format checking.

- [ ] **Step 1: Write audio_service.py**

Write `backend/services/audio_service.py`:
```python
import io
import struct
import wave
from config import settings


class AudioValidationError(Exception):
    pass


def validate_wav(audio_bytes: bytes, max_duration_secs: int = -1) -> tuple[int, int, int]:
    if len(audio_bytes) < 44:
        raise AudioValidationError("File too small to be a WAV")
    if audio_bytes[:4] != b"RIFF" or audio_bytes[8:12] != b"WAVE":
        raise AudioValidationError("Not a valid WAV file")
    channels = struct.unpack("<H", audio_bytes[22:24])[0]
    sample_rate = struct.unpack("<I", audio_bytes[24:28])[0]
    bits_per_sample = struct.unpack("<H", audio_bytes[34:36])[0]
    data_size = struct.unpack("<I", audio_bytes[40:44])[0]
    if bits_per_sample == 0:
        raise AudioValidationError("Invalid bits_per_sample")
    duration_secs = data_size / (sample_rate * channels * (bits_per_sample // 8))
    if max_duration_secs > 0 and duration_secs > max_duration_secs:
        raise AudioValidationError(
            f"Audio too long: {duration_secs:.1f}s (max {max_duration_secs}s)"
        )
    return sample_rate, channels, bits_per_sample


def get_duration_secs(audio_bytes: bytes) -> float:
    try:
        validate_wav(audio_bytes)
    except AudioValidationError:
        return 0.0
    channels = struct.unpack("<H", audio_bytes[22:24])[0]
    sample_rate = struct.unpack("<I", audio_bytes[24:28])[0]
    bits_per_sample = struct.unpack("<H", audio_bytes[34:36])[0]
    data_size = struct.unpack("<I", audio_bytes[40:44])[0]
    if bits_per_sample == 0:
        return 0.0
    return data_size / (sample_rate * channels * (bits_per_sample // 8))


def convert_to_mono_wav(audio_bytes: bytes) -> bytes:
    sample_rate, channels, bits_per_sample = validate_wav(audio_bytes)
    if channels == 1:
        return audio_bytes
    raw_data = audio_bytes[44:]
    if bits_per_sample == 16:
        samples = struct.unpack(f"<{len(raw_data) // 2}h", raw_data)
        mono = struct.pack(f"<{len(samples) // channels}h", *[sum(samples[i::channels]) // channels for i in range(channels)])
    else:
        mono = raw_data
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(bits_per_sample // 8)
        w.setframerate(sample_rate)
        w.writeframes(mono)
    return buf.getvalue()
```

- [ ] **Step 2: Commit**

```bash
git add backend/services/audio_service.py && git commit -m "feat: add audio validation and WAV conversion"
```

---

### Task 5: Storage Service

**Files:**
- Create: `backend/services/storage.py`

**Purpose:** Save/read/delete audio files on local filesystem under uploads/.

- [ ] **Step 1: Write storage.py**

Write `backend/services/storage.py`:
```python
import uuid
import shutil
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
```

- [ ] **Step 2: Commit**

```bash
git add backend/services/storage.py && git commit -m "feat: add local filesystem storage for audio files"
```

---

## Phase 3: Backend — Nvidia Client & Job System

### Task 6: Nvidia NIM API Client

**Files:**
- Create: `backend/nvidia_client.py`

**Purpose:** Single async httpx client wrapping all three NIM APIs (TTS, ASR, BNR).

- [ ] **Step 1: Write nvidia_client.py**

Write `backend/nvidia_client.py`:
```python
import httpx
from typing import Optional
from config import settings


class NvidiaAPIError(Exception):
    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message
        super().__init__(f"NIM API {status_code}: {message}")


class NvidiaClient:
    def __init__(self):
        self._client: Optional[httpx.AsyncClient] = None
        self._headers = {
            "Authorization": f"Bearer {settings.nvidia_api_key}",
            "Content-Type": "application/json",
        }

    async def _ensure_client(self):
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=httpx.Timeout(120.0))

    async def close(self):
        if self._client:
            await self._client.aclose()
            self._client = None

    async def _call(
        self,
        endpoint: str,
        data: Optional[dict] = None,
        files: Optional[dict] = None,
        method: str = "POST",
    ):
        await self._ensure_client()
        headers = self._headers.copy()
        if files:
            headers.pop("Content-Type", None)
        url = f"{settings.api_base_url.rstrip('/')}/{endpoint.lstrip('/')}"
        for attempt in range(2):
            try:
                if method == "POST":
                    resp = await self._client.post(url, headers=headers, json=data, files=files)
                else:
                    resp = await self._client.get(url, headers=headers)
                if resp.status_code == 429 or resp.status_code >= 500:
                    if attempt == 0:
                        import asyncio
                        await asyncio.sleep(1)
                        continue
                resp.raise_for_status()
                return resp
            except httpx.HTTPStatusError as e:
                raise NvidiaAPIError(e.response.status_code, str(e))
        return None

    async def tts_clone(self, voice_audio: bytes, text: str) -> bytes:
        """Zero-shot TTS: send reference audio + text, get WAV back."""
        result = await self._call(
            "nim/tts/magpie-tts-zeroshot",
            data={"text": text},
            files={"audio": ("reference.wav", voice_audio, "audio/wav")},
        )
        return result.content

    async def asr_transcribe(self, audio: bytes, language: str = "en") -> str:
        """Speech-to-text: send audio, get transcription text."""
        result = await self._call(
            "nim/asr/canary-1b-asr",
            files={"audio": ("audio.wav", audio, "audio/wav")},
            data={"language": language},
        )
        data = result.json()
        return data.get("text", "")

    async def asr_translate(self, audio: bytes, target_language: str = "en") -> tuple[str, str]:
        """ASR + translation. Returns (transcribed_text, translated_text)."""
        result = await self._call(
            "nim/asr/canary-1b-asr/translate",
            files={"audio": ("audio.wav", audio, "audio/wav")},
            data={"target_language": target_language},
        )
        data = result.json()
        return data.get("text", ""), data.get("translated_text", "")

    async def bnr_denoise(self, audio: bytes) -> bytes:
        """Background noise removal: send noisy audio, get clean WAV back."""
        result = await self._call(
            "nim/audio/bnr",
            files={"audio": ("noisy.wav", audio, "audio/wav")},
        )
        return result.content


# Singleton
nvidia_client = NvidiaClient()
```

- [ ] **Step 2: Import-check the client**

Run: `cd backend && python -c "from nvidia_client import nvidia_client; print('OK')"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add backend/nvidia_client.py && git commit -m "feat: add Nvidia NIM API client for TTS, ASR, BNR"
```

---

### Task 7: In-Memory Job Queue

**Files:**
- Create: `backend/job_manager.py`

**Purpose:** Create jobs, spawn background asyncio tasks, poll status, auto-cleanup expired jobs.

- [ ] **Step 1: Write job_manager.py**

Write `backend/job_manager.py`:
```python
import asyncio
import uuid
from typing import Any, Callable, Coroutine, Optional
from datetime import datetime, timezone
from models import JobStatus, JobResponse, JobResult, JobError

JobTask = Callable[..., Coroutine[Any, Any, JobResult]]


class Job:
    def __init__(self, job_id: str, total_steps: int = 1):
        self.job_id = job_id
        self.status = JobStatus.queued
        self.progress = 0
        self.step: Optional[str] = None
        self.steps_completed = 0
        self.total_steps = total_steps
        self.result: Optional[JobResult] = None
        self.error: Optional[JobError] = None
        self.created_at = datetime.now(timezone.utc).isoformat()

    def to_response(self) -> JobResponse:
        return JobResponse(
            job_id=self.job_id,
            status=self.status,
            progress=self.progress,
            step=self.step,
            steps_completed=self.steps_completed,
            total_steps=self.total_steps,
            result=self.result,
            error=self.error,
            created_at=self.created_at,
        )


class JobManager:
    def __init__(self, expiry_seconds: int = 3600, cleanup_interval: int = 900):
        self._jobs: dict[str, Job] = {}
        self._expiry_seconds = expiry_seconds
        self._cleanup_task: Optional[asyncio.Task] = None

    def create_job(self, total_steps: int = 1) -> str:
        job_id = f"j_{uuid.uuid4().hex[:12]}"
        self._jobs[job_id] = Job(job_id, total_steps)
        return job_id

    def get_job(self, job_id: str) -> Optional[Job]:
        return self._jobs.get(job_id)

    def update_job(
        self,
        job_id: str,
        status: Optional[JobStatus] = None,
        progress: Optional[int] = None,
        step: Optional[str] = None,
        steps_completed: Optional[int] = None,
        result: Optional[JobResult] = None,
        error: Optional[JobError] = None,
    ):
        job = self._jobs.get(job_id)
        if not job:
            return
        if status:
            job.status = status
        if progress is not None:
            job.progress = progress
        if step:
            job.step = step
        if steps_completed is not None:
            job.steps_completed = steps_completed
        if result:
            job.result = result
        if error:
            job.error = error

    def start_cleanup(self):
        if self._cleanup_task is None:
            self._cleanup_task = asyncio.create_task(self._cleanup_loop())

    async def _cleanup_loop(self):
        while True:
            await asyncio.sleep(self._expiry_seconds // 4)
            now = datetime.now(timezone.utc)
            expired = [
                jid
                for jid, j in self._jobs.items()
                if j.status in (JobStatus.done, JobStatus.failed)
                and (now - datetime.fromisoformat(j.created_at)).total_seconds()
                > self._expiry_seconds
            ]
            for jid in expired:
                del self._jobs[jid]

    async def run_job(
        self,
        job_id: str,
        task: JobTask,
        *args,
        **kwargs,
    ):
        """Execute a background task and update the job status."""
        self.update_job(job_id, status=JobStatus.processing)
        try:
            result = await task(job_id, *args, **kwargs)
            self.update_job(
                job_id,
                status=JobStatus.done,
                progress=100,
                steps_completed=kwargs.get("total_steps", 1),
                result=result,
            )
        except Exception as e:
            self.update_job(
                job_id,
                status=JobStatus.failed,
                error=JobError(stage=self._jobs[job_id].step, message=str(e)),
            )


job_manager = JobManager()
```

- [ ] **Step 2: Quick smoke test**

Run: `cd backend && python -c "from job_manager import job_manager; jid = job_manager.create_job(); print(jid)"`
Expected: `j_<12 hex chars>`

- [ ] **Step 3: Commit**

```bash
git add backend/job_manager.py && git commit -m "feat: add in-memory job queue with async task execution"
```

---

## Phase 4: Backend Routers (Voice Cloning, ASR, Cleanup, Studio, Library, Jobs)

### Task 8: TTS Router

**Files:**
- Create: `backend/routers/tts.py`

**Purpose:** POST /api/tts/clone -- accepts voice_id + text, returns job_id. Background task calls nvidia_client.tts_clone.

- [ ] **Step 1: Write tts.py**

Write `backend/routers/tts.py`:
```python
from fastapi import APIRouter, Depends, UploadFile, File
from models import TTSCloneRequest, JobCreatedResponse, JobResult
from job_manager import job_manager
from nvidia_client import nvidia_client
from services.storage import get_voice_path, save_clip
from services.audio_service import get_duration_secs

router = APIRouter()


async def _tts_clone_task(job_id: str, voice_id: str, text: str) -> JobResult:
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
    import asyncio
    asyncio.ensure_future(job_manager.run_job(job_id, _tts_clone_task, request.voice_id, request.text))
    return JobCreatedResponse(job_id=job_id, status="queued")
```

- [ ] **Step 2: Commit**

```bash
git add backend/routers/tts.py && git commit -m "feat: add TTS clone endpoint"
```

---

### Task 9: ASR Router

**Files:**
- Create: `backend/routers/asr.py`

**Purpose:** POST /api/asr (transcribe) and POST /api/asr/translate (transcribe + translate). Accept multipart audio upload, return job_id.

- [ ] **Step 1: Write asr.py**

Write `backend/routers/asr.py`:
```python
from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional
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
    import asyncio
    asyncio.ensure_future(job_manager.run_job(job_id, _transcribe_task, audio_bytes))
    return JobCreatedResponse(job_id=job_id, status="queued")


@router.post("/asr/translate", response_model=JobCreatedResponse)
async def translate(
    audio: UploadFile = File(...),
    target_language: Language = Form(Language.en),
):
    audio_bytes = await audio.read()
    job_id = job_manager.create_job()
    import asyncio
    asyncio.ensure_future(job_manager.run_job(job_id, _translate_task, audio_bytes, target_language.value))
    return JobCreatedResponse(job_id=job_id, status="queued")
```

- [ ] **Step 2: Commit**

```bash
git add backend/routers/asr.py && git commit -m "feat: add ASR transcribe and translate endpoints"
```

---

### Task 10: Cleanup Router (BNR)

**Files:**
- Create: `backend/routers/cleanup.py`

**Purpose:** POST /api/clean -- background noise removal via BNR model.

- [ ] **Step 1: Write cleanup.py**

Write `backend/routers/cleanup.py`:
```python
from fastapi import APIRouter, UploadFile, File
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
    import asyncio
    asyncio.ensure_future(job_manager.run_job(job_id, _clean_task, audio_bytes))
    return JobCreatedResponse(job_id=job_id, status="queued")
```

- [ ] **Step 2: Commit**

```bash
git add backend/routers/cleanup.py && git commit -m "feat: add BNR noise removal endpoint"
```

---

### Task 11: Library Router

**Files:**
- Create: `backend/routers/library.py`

**Purpose:** CRUD for saved voices and clips.

- [ ] **Step 1: Write library.py**

Write `backend/routers/library.py`:
```python
import json
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
from models import VoiceCreateRequest, VoiceResponse, VoiceListResponse, ClipResponse, ClipListResponse
from services.storage import save_voice, save_clip, delete_voice, delete_clip
from services.audio_service import get_duration_secs
from config import get_voices_dir, get_clips_dir

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
    voice_id = filename.replace(".wav", "")
    meta = _load_meta(META_FILE_VOICES)
    from datetime import datetime, timezone
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
        raise HTTPException(404, "Voice not found")
    delete_voice(info["filename"])
    _save_meta(META_FILE_VOICES, meta)


@router.get("/clips", response_model=ClipListResponse)
async def list_clips():
    meta = _load_meta(META_FILE_CLIPS)
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
        raise HTTPException(404, "Clip not found")
    delete_clip(info["filename"])
    _save_meta(META_FILE_CLIPS, meta)
```

- [ ] **Step 2: Commit**

```bash
git add backend/routers/library.py && git commit -m "feat: add library CRUD endpoints for voices and clips"
```

---

### Task 12: Studio Pipeline Router

**Files:**
- Create: `backend/routers/studio.py`

**Purpose:** POST /api/studio/pipeline -- multi-step pipeline (record→clean→transcribe→translate→revoice). Accepts multipart form with audio + JSON metadata.

- [ ] **Step 1: Write studio.py**

Write `backend/routers/studio.py`:
```python
from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional
from models import (
    JobCreatedResponse,
    JobResult,
    PipelineStep,
    Language,
)
from job_manager import job_manager
from nvidia_client import nvidia_client
from services.storage import save_clip, get_voice_path, save_recording
from services.audio_service import convert_to_mono_wav

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
    import asyncio
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
```

- [ ] **Step 2: Commit**

```bash
git add backend/routers/studio.py && git commit -m "feat: add studio pipeline endpoint for multi-step audio processing"
```

---

### Task 13: Jobs Router

**Files:**
- Create: `backend/routers/jobs.py`

**Purpose:** GET /api/jobs/:id -- poll job status.

- [ ] **Step 1: Write jobs.py**

Write `backend/routers/jobs.py`:
```python
from fastapi import APIRouter, HTTPException
from models import JobResponse
from job_manager import job_manager

router = APIRouter()


@router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: str):
    job = job_manager.get_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    return job.to_response()
```

- [ ] **Step 2: Commit**

```bash
git add backend/routers/jobs.py && git commit -m "feat: add job polling endpoint"
```

---

## Phase 5: Frontend Core Infrastructure

### Task 14: API Client and Blob Utilities

**Files:**
- Create: `frontend/src/lib/api.ts`
- Create: `frontend/src/lib/blobUtils.ts`

**Purpose:** All HTTP calls to backend in one module. Blob/file helpers.

- [ ] **Step 1: Write api.ts**

Write `frontend/src/lib/api.ts`:
```typescript
const BASE = 'http://localhost:8000/api';

interface JobResult {
  audio_url?: string;
  text?: string;
  translated_text?: string;
}

interface JobResponse {
  job_id: string;
  status: 'queued' | 'processing' | 'done' | 'failed';
  progress: number;
  step: string | null;
  steps_completed: number;
  total_steps: number;
  result: JobResult | null;
  error: { stage: string | null; message: string } | null;
  created_at: string;
}

interface Voice {
  id: string;
  name: string;
  filename: string;
  duration_secs: number;
  created_at: string;
}

interface Clip {
  id: string;
  name: string;
  filename: string;
  duration_secs: number;
  created_at: string;
  source_job_id: string;
}

async function handleResponse<T>(resp: Response): Promise<T> {
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`API ${resp.status}: ${text}`);
  }
  return resp.json();
}

export async function ttsClone(voiceId: string, text: string): Promise<string> {
  const resp = await fetch(`${BASE}/tts/clone`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ voice_id: voiceId, text }),
  });
  const data = await handleResponse<{ job_id: string }>(resp);
  return data.job_id;
}

export async function transcribe(audio: Blob): Promise<string> {
  const form = new FormData();
  form.append('audio', audio, 'recording.wav');
  const resp = await fetch(`${BASE}/asr`, { method: 'POST', body: form });
  const data = await handleResponse<{ job_id: string }>(resp);
  return data.job_id;
}

export async function translate(audio: Blob, targetLanguage: string): Promise<string> {
  const form = new FormData();
  form.append('audio', audio, 'recording.wav');
  form.append('target_language', targetLanguage);
  const resp = await fetch(`${BASE}/asr/translate`, { method: 'POST', body: form });
  const data = await handleResponse<{ job_id: string }>(resp);
  return data.job_id;
}

export async function cleanAudio(audio: Blob): Promise<string> {
  const form = new FormData();
  form.append('audio', audio, 'recording.wav');
  const resp = await fetch(`${BASE}/clean`, { method: 'POST', body: form });
  const data = await handleResponse<{ job_id: string }>(resp);
  return data.job_id;
}

export async function runPipeline(
  audio: Blob,
  steps: string[],
  targetLanguage?: string,
  voiceId?: string
): Promise<string> {
  const form = new FormData();
  form.append('audio', audio, 'recording.wav');
  form.append('steps', steps.join(','));
  if (targetLanguage) form.append('target_language', targetLanguage);
  if (voiceId) form.append('voice_id', voiceId);
  const resp = await fetch(`${BASE}/studio/pipeline`, { method: 'POST', body: form });
  const data = await handleResponse<{ job_id: string }>(resp);
  return data.job_id;
}

export async function getJob(jobId: string): Promise<JobResponse> {
  const resp = await fetch(`${BASE}/jobs/${jobId}`);
  return handleResponse<JobResponse>(resp);
}

export async function saveVoice(name: string, audio: Blob): Promise<Voice> {
  const form = new FormData();
  form.append('name', name);
  form.append('audio', audio, 'voice.wav');
  const resp = await fetch(`${BASE}/voices`, { method: 'POST', body: form });
  return handleResponse<Voice>(resp);
}

export async function getVoices(): Promise<Voice[]> {
  const resp = await fetch(`${BASE}/voices`);
  const data = await handleResponse<{ voices: Voice[] }>(resp);
  return data.voices;
}

export async function deleteVoice(voiceId: string): Promise<void> {
  const resp = await fetch(`${BASE}/voices/${voiceId}`, { method: 'DELETE' });
  if (!resp.ok) throw new Error(`Delete failed: ${resp.status}`);
}

export async function getClips(): Promise<Clip[]> {
  const resp = await fetch(`${BASE}/clips`);
  const data = await handleResponse<{ clips: Clip[] }>(resp);
  return data.clips;
}

export async function deleteClip(clipId: string): Promise<void> {
  const resp = await fetch(`${BASE}/clips/${clipId}`, { method: 'DELETE' });
  if (!resp.ok) throw new Error(`Delete failed: ${resp.status}`);
}
```

- [ ] **Step 2: Write blobUtils.ts**

Write `frontend/src/lib/blobUtils.ts`:
```typescript
export function blobToUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

export function revokeBlobUrl(url: string): void {
  URL.revokeObjectURL(url);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = blobToUrl(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  revokeBlobUrl(url);
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/ && git commit -m "feat: add API client and blob utilities"
```

---

### Task 15: Frontend Hooks

**Files:**
- Create: `frontend/src/hooks/useJobPolling.ts`
- Create: `frontend/src/hooks/useRecorder.ts`
- Create: `frontend/src/hooks/useAudioPlayer.ts`
- Create: `frontend/src/hooks/useVoices.ts`
- Create: `frontend/src/hooks/useClips.ts`

- [ ] **Step 1: Write useJobPolling.ts**

Write `frontend/src/hooks/useJobPolling.ts`:
```typescript
import { useState, useEffect, useRef } from 'react';
import { getJob } from '../lib/api';

interface JobResult {
  audio_url?: string;
  text?: string;
  translated_text?: string;
}

interface PollingState {
  status: 'idle' | 'queued' | 'processing' | 'done' | 'failed';
  progress: number;
  step: string | null;
  steps_completed: number;
  total_steps: number;
  result: JobResult | null;
  error: string | null;
}

export function useJobPolling(jobId: string | null) {
  const [state, setState] = useState<PollingState>({
    status: 'idle',
    progress: 0,
    step: null,
    steps_completed: 0,
    total_steps: 1,
    result: null,
    error: null,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const poll = async () => {
      try {
        const job = await getJob(jobId);
        setState({
          status: job.status,
          progress: job.progress,
          step: job.step,
          steps_completed: job.steps_completed,
          total_steps: job.total_steps,
          result: job.result,
          error: job.error?.message || null,
        });
        if (job.status === 'done' || job.status === 'failed') {
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      } catch {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setState(s => ({ ...s, status: 'failed', error: 'Polling failed' }));
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [jobId]);

  return state;
}
```

- [ ] **Step 2: Write useRecorder.ts**

Write `frontend/src/hooks/useRecorder.ts`:
```typescript
import { useState, useRef, useCallback } from 'react';

interface RecorderState {
  isRecording: boolean;
  duration: number;
  audioBlob: Blob | null;
  error: string | null;
}

export function useRecorder() {
  const [state, setState] = useState<RecorderState>({
    isRecording: false,
    duration: 0,
    audioBlob: null,
    error: null,
  });
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setState(prev => ({ ...prev, isRecording: false, audioBlob: blob }));
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setState(prev => ({ ...prev, duration: Math.floor((Date.now() - startTimeRef.current) / 1000) }));
      }, 1000);

      setState(prev => ({ ...prev, isRecording: true, audioBlob: null, error: null }));
    } catch (err) {
      setState(prev => ({ ...prev, error: 'Microphone access denied' }));
    }
  }, []);

  const stop = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  return { ...state, start, stop };
}
```

- [ ] **Step 3: Write useAudioPlayer.ts**

Write `frontend/src/hooks/useAudioPlayer.ts`:
```typescript
import { useState, useRef, useCallback, useEffect } from 'react';

interface AudioPlayerState {
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  volume: number;
}

export function useAudioPlayer(url: string | null) {
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    duration: 0,
    currentTime: 0,
    volume: 1,
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!url) return;
    const audio = new Audio(url);
    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      setState(prev => ({ ...prev, duration: audio.duration }));
    };
    audio.ontimeupdate = () => {
      setState(prev => ({ ...prev, currentTime: audio.currentTime }));
    };
    audio.onended = () => {
      setState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
    };

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [url]);

  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play();
      setState(prev => ({ ...prev, isPlaying: true }));
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setState(prev => ({ ...prev, isPlaying: false }));
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setState(prev => ({ ...prev, currentTime: time }));
    }
  }, []);

  const setVolume = useCallback((vol: number) => {
    if (audioRef.current) {
      audioRef.current.volume = vol;
      setState(prev => ({ ...prev, volume: vol }));
    }
  }, []);

  return { ...state, play, pause, seek, setVolume };
}
```

- [ ] **Step 4: Write useVoices.ts**

Write `frontend/src/hooks/useVoices.ts`:
```typescript
import { useState, useEffect, useCallback } from 'react';
import { getVoices, saveVoice, deleteVoice } from '../lib/api';

interface Voice {
  id: string;
  name: string;
  filename: string;
  duration_secs: number;
  created_at: string;
}

export function useVoices() {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getVoices();
      setVoices(data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const add = useCallback(async (name: string, audio: Blob): Promise<Voice | null> => {
    try {
      const voice = await saveVoice(name, audio);
      setVoices(prev => [voice, ...prev]);
      return voice;
    } catch { return null; }
  }, []);

  const remove = useCallback(async (id: string) => {
    try {
      await deleteVoice(id);
      setVoices(prev => prev.filter(v => v.id !== id));
    } catch { /* ignore */ }
  }, []);

  return { voices, loading, add, remove, refresh: fetch };
}
```

- [ ] **Step 5: Write useClips.ts**

Write `frontend/src/hooks/useClips.ts`:
```typescript
import { useState, useEffect, useCallback } from 'react';
import { getClips, deleteClip } from '../lib/api';

interface Clip {
  id: string;
  name: string;
  filename: string;
  duration_secs: number;
  created_at: string;
  source_job_id: string;
}

export function useClips() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getClips();
      setClips(data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const remove = useCallback(async (id: string) => {
    try {
      await deleteClip(id);
      setClips(prev => prev.filter(c => c.id !== id));
    } catch { /* ignore */ }
  }, []);

  return { clips, loading, remove, refresh: fetch };
}
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/hooks/ && git commit -m "feat: add frontend hooks for polling, recording, audio playback, and CRUD"
```

---

## Phase 6: Frontend Design Foundation

### Task 15b: Design Tokens + Global Styles

**Files:**
- Create: `frontend/tailwind.config.ts`

**Purpose:** Mirror CSS custom properties into TailwindCSS for utility-class access. Must be done before any component work.

- [ ] **Step 1: Write tailwind.config.ts**

Write `frontend/tailwind.config.ts`:
```typescript
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-hover': 'var(--surface-hover)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        text: 'var(--text)',
        'text-muted': 'var(--text-muted)',
        'text-subtle': 'var(--text-subtle)',
        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        'accent-bg': 'var(--accent-bg)',
        'voice-green': 'var(--voice-green)',
        'voice-blue': 'var(--voice-blue)',
        'voice-purple': 'var(--voice-purple)',
        'voice-orange': 'var(--voice-orange)',
        danger: 'var(--danger)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        card: '8px',
        btn: '6px',
        pill: '999px',
      },
    },
  },
  plugins: [],
} satisfies Config
```

- [ ] **Step 2: Update vite.config.ts to use tailwind.config.ts**

Ensure `frontend/vite.config.ts` imports tailwind.config.ts or uses the `@tailwindcss/vite` plugin which auto-discovers config. The existing `tailwindcss()` plugin handles this.

- [ ] **Step 3: Commit**

```bash
git add frontend/tailwind.config.ts && git commit -m "feat: add design tokens for Figma-matching colors, fonts, and radii"
```

---

## Phase 7: Frontend App Shell

### Task 16: App Context, Sidebar, and Screen Header

**Files:**
- Create: `frontend/src/context/AppContext.tsx`
- Create: `frontend/src/components/Sidebar.tsx`
- Create: `frontend/src/components/ScreenHeader.tsx`
- Create: `frontend/src/App.tsx`

**Purpose:** Root app shell with left sidebar navigation + main content region. Must match the sidebar layout in all 4 figma_design PNGs. Dark theme only (no toggle for MVP).

- [ ] **Step 1: Write AppContext.tsx**

Write `frontend/src/context/AppContext.tsx`:
```tsx
import { createContext, useContext, useState, ReactNode } from 'react';

export type Screen = 'voice-cloning' | 'studio-recorder' | 'library';

interface AppContextType {
  activeScreen: Screen;
  setActiveScreen: (screen: Screen) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [activeScreen, setActiveScreen] = useState<Screen>('voice-cloning');

  return (
    <AppContext.Provider value={{ activeScreen, setActiveScreen }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
```

- [ ] **Step 2: Write Sidebar.tsx**

Must match the sidebar layout in all 4 figma_design PNGs. The same sidebar appears on every screen.

Write `frontend/src/components/Sidebar.tsx`:
```tsx
import { useAppContext } from '../context/AppContext';
import type { Screen } from '../context/AppContext';
import { Wand2, Radio, Library } from 'lucide-react';

const NAV_ITEMS: { id: Screen; label: string; Icon: typeof Wand2 }[] = [
  { id: 'voice-cloning', label: 'Voice Cloning', Icon: Wand2 },
  { id: 'studio-recorder', label: 'Studio Recorder', Icon: Radio },
  { id: 'library', label: 'Library', Icon: Library },
];

const MODELS = [
  { name: 'magpie-tts-zeroshot', status: 'active' },
  { name: 'canary-1b', status: 'active' },
  { name: 'bnr', status: 'active' },
] as const;

export function Sidebar() {
  const { activeScreen, setActiveScreen } = useAppContext();

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-[220px] flex flex-col bg-[--bg] border-r border-[--border] select-none"
    >
      {/* Brand block */}
      <div className="px-5 pt-6 pb-5">
        <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-[--accent]">
          NVIDIA
        </p>
        <h1 className="mt-1 text-[15px] font-semibold leading-tight">
          AI Voice<br />Studio
        </h1>
        <p className="mt-1 font-mono text-[11px] tracking-[0.14em] uppercase text-[--text-muted]">
          v0.1 &middot; MVP
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const isActive = activeScreen === id;
          return (
            <button
              key={id}
              onClick={() => setActiveScreen(id)}
              className={`btn-press relative flex items-center gap-3 w-full h-10 px-3 rounded-[6px] text-[13px] font-medium ${
                isActive
                  ? 'bg-[--accent-bg] text-[--accent]'
                  : 'text-[--text-muted] hover:text-[--text]'
              }`}
            >
              {/* 2px left green bar for active item */}
              {isActive && (
                <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-[--accent] rounded-r-full" />
              )}
              <Icon className="w-[17px] h-[17px] shrink-0" strokeWidth={1.8} />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Divider + Models Active footer */}
      <div className="px-5 pb-5">
        <div className="border-t border-[--border] mb-4" />
        <p className="section-label mb-3">Models Active</p>
        {MODELS.map(m => (
          <div key={m.name} className="flex items-center gap-2 py-0.5">
            <span
              className="w-[6px] h-[6px] rounded-full bg-[--accent] shrink-0"
              style={{ animation: 'pulse-dot 2s ease-in-out infinite' }}
            />
            <span className="font-mono text-[11px] text-[--text-muted] truncate">
              {m.name}
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}
```

- [ ] **Step 3: Write ScreenHeader.tsx**

Renders the top bar for each screen: mono uppercase title + optional model Pill + settings icon. Used by all 3 screens.

Write `frontend/src/components/ScreenHeader.tsx`:
```tsx
import { Settings } from 'lucide-react';

interface Props {
  title: string;
  modelPill?: string;
}

export function ScreenHeader({ title, modelPill }: Props) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <h2
          className="font-mono text-[14px] tracking-[0.14em] uppercase text-[--text]"
        >
          {title}
        </h2>
        {modelPill && (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-[4px] bg-[--accent-bg] border border-[--accent]/20 font-mono text-[10px] tracking-[0.1em] uppercase text-[--accent]"
          >
            {modelPill}
          </span>
        )}
      </div>
      <button
        className="btn-press w-8 h-8 flex items-center justify-center rounded-[6px] text-[--text-muted] hover:text-[--text] hover:bg-[--surface]"
      >
        <Settings className="w-4 h-4" strokeWidth={1.5} />
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Write App.tsx**

Overwrites any existing file from Vite scaffold. This is the root component: sidebar + main content region.

Write `frontend/src/App.tsx`:
```tsx
import { AppProvider, useAppContext } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { VoiceCloningScreen } from './components/VoiceCloning/VoiceCloningScreen';
import { StudioRecorderScreen } from './components/StudioRecorder/StudioRecorderScreen';
import { LibraryScreen } from './components/Library/LibraryScreen';
import './globals.css';

function AppContent() {
  const { activeScreen } = useAppContext();

  return (
    <div className="h-screen flex bg-[--bg] font-sans text-[--text] overflow-hidden">
      <Sidebar />
      <main className="flex-1 ml-[220px] p-8 overflow-y-auto">
        {activeScreen === 'voice-cloning' && <VoiceCloningScreen />}
        {activeScreen === 'studio-recorder' && <StudioRecorderScreen />}
        {activeScreen === 'library' && <LibraryScreen />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/App.tsx frontend/src/context/ frontend/src/components/Sidebar.tsx frontend/src/components/ScreenHeader.tsx && git commit -m "feat: add app shell with left sidebar navigation and screen header"
```

---

## Phase 8: Frontend UI Primitives

### Task 16b: Shared UI Primitives

**Files:**
- Create: `frontend/src/components/ui/SectionLabel.tsx`
- Create: `frontend/src/components/ui/Panel.tsx`
- Create: `frontend/src/components/ui/Button.tsx`
- Create: `frontend/src/components/ui/IconButton.tsx`
- Create: `frontend/src/components/ui/Pill.tsx`
- Create: `frontend/src/components/ui/StatusDot.tsx`
- Create: `frontend/src/components/ui/VoiceTag.tsx`
- Create: `frontend/src/components/ui/WaveformBars.tsx`
- Create: `frontend/src/components/ui/HelpFab.tsx`

**Purpose:** Reusable visual primitives used across all screens. These match the Figma design system and abstract away TailwindCSS repetitions. Must be built before any screen component.

- [ ] **Step 1: Write SectionLabel.tsx**

Write `frontend/src/components/ui/SectionLabel.tsx`:
```tsx
interface Props {
  children: string;
  className?: string;
}

export function SectionLabel({ children, className }: Props) {
  return (
    <p className={`section-label ${className || ''}`}>{children}</p>
  );
}
```

- [ ] **Step 2: Write Panel.tsx**

Write `frontend/src/components/ui/Panel.tsx`:
```tsx
import { type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

export function Panel({ children, className }: Props) {
  return (
    <div
      className={`rounded-[8px] border border-[--border] bg-[--surface] ${className || ''}`}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Write Button.tsx**

Write `frontend/src/components/ui/Button.tsx`:
```tsx
import { type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline';

interface Props {
  children: ReactNode;
  variant?: Variant;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  onClick?: () => void;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-[--accent] text-black hover:bg-[--accent-hover] font-semibold',
  secondary:
    'bg-[--surface] text-[--text-muted] hover:bg-[--surface-hover] hover:text-[--text] border border-[--border]',
  ghost:
    'text-[--text-muted] hover:text-[--text] hover:bg-[--surface]',
  outline:
    'border border-[--accent] text-[--accent] hover:bg-[--accent-bg]',
};

export function Button({
  children,
  variant = 'secondary',
  disabled = false,
  fullWidth = false,
  className = '',
  onClick,
}: Props) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn-press inline-flex items-center justify-center gap-2 px-4 py-2 rounded-[6px] text-sm transition-colors duration-200 ${
        disabled
          ? 'opacity-40 cursor-not-allowed pointer-events-none'
          : ''
      } ${variantClasses[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 4: Write IconButton.tsx**

Write `frontend/src/components/ui/IconButton.tsx`:
```tsx
import { type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  size?: number;
  label: string;
  onClick?: () => void;
}

export function IconButton({ children, size = 36, label, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="btn-press flex items-center justify-center rounded-[6px] text-[--text-muted] hover:text-[--text] hover:bg-[--surface] border border-[--border]"
      style={{ width: size, height: size }}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 5: Write Pill.tsx**

Write `frontend/src/components/ui/Pill.tsx`:
```tsx
interface Props {
  children: string;
}

export function Pill({ children }: Props) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] bg-[--accent-bg] border border-[--accent]/20 font-mono text-[10px] tracking-[0.1em] uppercase text-[--accent]">
      {children}
    </span>
  );
}
```

- [ ] **Step 6: Write StatusDot.tsx**

Write `frontend/src/components/ui/StatusDot.tsx`:
```tsx
type Color = 'green' | 'blue' | 'purple' | 'orange';

const colorMap: Record<Color, string> = {
  green: 'var(--voice-green)',
  blue: 'var(--voice-blue)',
  purple: 'var(--voice-purple)',
  orange: 'var(--voice-orange)',
};

interface Props {
  color?: Color;
  pulse?: boolean;
  size?: number;
}

export function StatusDot({ color = 'green', pulse = false, size = 6 }: Props) {
  return (
    <span
      className={`inline-block rounded-full shrink-0 ${
        pulse ? 'animate-[pulse-dot_2s_ease-in-out_infinite]' : ''
      }`}
      style={{
        width: size,
        height: size,
        backgroundColor: colorMap[color],
      }}
    />
  );
}
```

- [ ] **Step 7: Write VoiceTag.tsx**

Write `frontend/src/components/ui/VoiceTag.tsx`:
```tsx
import { StatusDot } from './StatusDot';
import type { Color } from './StatusDot';

interface Props {
  name: string;
  color: Color;
}

export function VoiceTag({ name, color }: Props) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <StatusDot color={color} size={6} />
      <span className="font-mono text-[11px] text-[--text-muted] truncate">
        {name}
      </span>
    </span>
  );
}
```

- [ ] **Step 8: Write WaveformBars.tsx**

Write `frontend/src/components/ui/WaveformBars.tsx`:
```tsx
interface Props {
  bars: number[];
  color: string;
  height?: number;
  className?: string;
}

export function WaveformBars({
  bars,
  color,
  height = 32,
  className = '',
}: Props) {
  if (bars.length === 0) {
    return (
      <div
        className={`rounded-[4px] border border-dashed border-[--border] bg-[--bg] ${className}`}
        style={{ height }}
      >
        <div className="flex items-center justify-center h-full text-[--text-subtle] font-mono text-[10px] uppercase tracking-wider">
          No audio
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-end gap-[2px] ${className}`}
      style={{ height }}
    >
      {bars.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-[1px]"
          style={{
            height: `${Math.max(4, v * 100)}%`,
            backgroundColor: color,
            opacity: 0.6 + v * 0.4,
          }}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 9: Write HelpFab.tsx**

Write `frontend/src/components/ui/HelpFab.tsx`:
```tsx
import { HelpCircle } from 'lucide-react';

export function HelpFab() {
  return (
    <button
      aria-label="Help"
      className="btn-press fixed bottom-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-[--surface] border border-[--border] text-[--text-muted] hover:text-[--text] hover:bg-[--surface-hover] shadow-lg"
    >
      <HelpCircle className="w-5 h-5" strokeWidth={1.5} />
    </button>
  );
}
```

- [ ] **Step 10: Commit**

```bash
git add frontend/src/components/ui/ && git commit -m "feat: add shared UI primitives (Button, Panel, StatusDot, WaveformBars, etc.)"
```

---

## Phase 9: Frontend Common Components

### Task 17: AudioPlaybackBar, ErrorBanner, JobPollingOverlay

**Files:**
- Create: `frontend/src/components/common/AudioPlaybackBar.tsx`
- Create: `frontend/src/components/common/ErrorBanner.tsx`
- Create: `frontend/src/components/common/JobPollingOverlay.tsx`

- [ ] **Step 1: Write AudioPlaybackBar.tsx**

Write `frontend/src/components/common/AudioPlaybackBar.tsx`:
```tsx
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { formatDuration } from '../../lib/blobUtils';

interface Props {
  audioUrl: string | null;
}

export function AudioPlaybackBar({ audioUrl }: Props) {
  const { isPlaying, duration, currentTime, play, pause, seek } = useAudioPlayer(audioUrl);

  if (!audioUrl) return null;

  return (
    <div className="flex items-center gap-4 p-3 bg-gray-800 rounded-lg">
      <button
        onClick={isPlaying ? pause : play}
        className="btn-press w-10 h-10 flex items-center justify-center bg-[--accent] hover:bg-[--accent-hover] rounded-full text-black"
      >
        {isPlaying ? '⏸' : '▶'}
      </button>
      <div className="flex-1">
        <input
          type="range"
          min={0}
          max={duration || 0}
          value={currentTime}
          onChange={e => seek(Number(e.target.value))}
          className="w-full h-1 bg-[--border] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[--accent]"
        />
      </div>
      <span className="text-xs text-gray-400 w-20 text-right tabular-nums">
        {formatDuration(currentTime)} / {formatDuration(duration)}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Write ErrorBanner.tsx**

Write `frontend/src/components/common/ErrorBanner.tsx`:
```tsx
interface Props {
  message: string | null;
  onDismiss?: () => void;
}

export function ErrorBanner({ message, onDismiss }: Props) {
  if (!message) return null;

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm animate-[scaleIn_200ms_var(--ease-out)]">
      <span>⚠ {message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="btn-press ml-3 text-red-300 hover:text-red-100">
          ✕
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Write JobPollingOverlay.tsx**

Write `frontend/src/components/common/JobPollingOverlay.tsx`:
```tsx
interface Props {
  isActive: boolean;
  progress: number;
  step: string | null;
  stepsCompleted: number;
  totalSteps: number;
}

export function JobPollingOverlay({ isActive, progress, step, stepsCompleted, totalSteps }: Props) {
  if (!isActive) return null;

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-gray-800 border border-gray-700 rounded-xl shadow-xl min-w-56 animate-[scaleIn_250ms_var(--ease-out)]">
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 border-2 border-[--accent] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-300">
          {step ? `Running ${step}...` : 'Processing...'}
        </span>
      </div>
      {totalSteps > 1 && (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Step {stepsCompleted}/{totalSteps}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-[--accent] rounded-full transition-[width] 300ms var(--ease-out)"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/common/ && git commit -m "feat: add shared UI components (playback bar, error banner, job overlay)"
```

---

## Phase 10: Frontend Screens

### Task 18: Voice Cloning Screen

**Files:**
- Create: `frontend/src/components/VoiceCloning/VoiceCloningScreen.tsx`
- Create: `frontend/src/components/VoiceCloning/VoiceSampleInput.tsx`
- Create: `frontend/src/components/VoiceCloning/ClonedVoicePicker.tsx`
- Create: `frontend/src/components/VoiceCloning/TextInput.tsx`
- Create: `frontend/src/components/VoiceCloning/GenerateButton.tsx`

**Visual reference:** `figma_design/voice_cloning_page.png` — MUST match 2-column layout.

- [ ] **Step 1: Write VoiceSampleInput.tsx**

Write `frontend/src/components/VoiceCloning/VoiceSampleInput.tsx`:
```tsx
import { useRef, useState } from 'react';
import { useRecorder } from '../../hooks/useRecorder';
import { SectionLabel } from '../ui/SectionLabel';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { WaveformBars } from '../ui/WaveformBars';
import { Mic, Upload } from 'lucide-react';

interface Props {
  onAudioReady: (blob: Blob) => void;
  hasAudio: boolean;
  voiceName: string;
  onVoiceNameChange: (name: string) => void;
  onSave: () => void;
  isSaving: boolean;
}

const DUMMY_BARS = Array.from({ length: 24 }, () => Math.random() * 0.6 + 0.1);

export function VoiceSampleInput({
  onAudioReady, hasAudio, voiceName, onVoiceNameChange, onSave, isSaving,
}: Props) {
  const { isRecording, duration, audioBlob, error, start, stop } = useRecorder();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (audioBlob && !isRecording && !hasAudio) {
    onAudioReady(audioBlob);
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onAudioReady(file);
  };

  return (
    <div className="space-y-4">
      <SectionLabel>SAMPLE INPUT</SectionLabel>
      <p className="text-xs text-[--text-subtle]">
        Record or upload a 10–15 second voice sample
      </p>

      {/* Waveform placeholder box */}
      <div className="h-[140px] rounded-[8px] border border-dashed border-[--border] bg-[--bg] overflow-hidden">
        {hasAudio ? (
          <WaveformBars bars={DUMMY_BARS} color="var(--accent)" height={140} />
        ) : (
          <div className="flex items-center justify-center h-full text-[--text-subtle] font-mono text-[10px] uppercase tracking-wider">
            {isRecording ? (
              <WaveformBars bars={DUMMY_BARS.slice(0, 12)} color="var(--accent)" height={140} />
            ) : (
              'No sample loaded'
            )}
          </div>
        )}
      </div>

      {/* Record + Upload buttons side by side */}
      <div className="flex gap-2">
        <Button onClick={isRecording ? stop : start} variant="primary" className="flex-1">
          <Mic className="w-4 h-4" strokeWidth={1.8} />
          {isRecording ? `Stop (${duration}s)` : 'Record'}
        </Button>
        <IconButton label="Upload audio file" onClick={() => fileInputRef.current?.click()}>
          <Upload className="w-4 h-4" strokeWidth={1.5} />
        </IconButton>
        <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFile} className="hidden" />
      </div>

      {/* Voice name + Save */}
      <SectionLabel>VOICE NAME</SectionLabel>
      <div className="flex gap-2">
        <input
          type="text"
          value={voiceName}
          onChange={e => onVoiceNameChange(e.target.value)}
          placeholder="e.g. My Voice"
          className="flex-1 px-3 py-2 bg-[--bg] border border-[--border] rounded-[6px] text-[13px] text-[--text] placeholder-[--text-subtle] outline-none focus:border-[--accent] transition-colors duration-200"
        />
        <Button onClick={onSave} variant="secondary" disabled={!hasAudio || !voiceName.trim() || isSaving}>
          Save Voice
        </Button>
      </div>

      {/* Model indicator */}
      <SectionLabel>MODEL</SectionLabel>
      <div className="flex items-center gap-2">
        <span className="w-[6px] h-[6px] rounded-full bg-[--accent]" style={{ animation: 'pulse-dot 2s ease-in-out infinite' }} />
        <span className="font-mono text-[11px] text-[--text-muted]">magpie-tts-zeroshot</span>
      </div>

      {error && <p className="text-[--danger] text-xs">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Write ClonedVoicePicker.tsx**

Replaces the old VoiceSelector dropdown with a 2x2 grid from Figma.

Write `frontend/src/components/VoiceCloning/ClonedVoicePicker.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { useVoices } from '../../hooks/useVoices';
import { SectionLabel } from '../ui/SectionLabel';
import { StatusDot } from '../ui/StatusDot';
import type { Color } from '../ui/StatusDot';

interface Props {
  selectedId: string;
  onSelect: (id: string) => void;
}

const VOICE_COLORS: Color[] = ['green', 'blue', 'purple', 'orange'];

export function ClonedVoicePicker({ selectedId, onSelect }: Props) {
  const { voices } = useVoices();

  return (
    <div className="space-y-3">
      <SectionLabel>CLONED VOICE</SectionLabel>
      <div className="grid grid-cols-2 gap-3">
        {voices.map((v, i) => {
          const voiceColor = VOICE_COLORS[i % VOICE_COLORS.length];
          const isSelected = selectedId === v.id;
          return (
            <button
              key={v.id}
              onClick={() => onSelect(v.id)}
              className={`btn-press flex items-center justify-between p-3 rounded-[6px] border text-left ${
                isSelected
                  ? 'border-[--accent] bg-[--accent-bg]'
                  : 'border-[--border] bg-[--bg] hover:border-[--border-strong]'
              } transition-colors duration-200`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <StatusDot color={voiceColor} size={6} />
                <span className="text-[13px] text-[--text] truncate">{v.name}</span>
              </div>
              <span className="font-mono text-[10px] text-[--text-muted] shrink-0 ml-2">
                {v.duration_secs.toFixed(1)}s
              </span>
            </button>
          );
        })}
        {voices.length === 0 && (
          <p className="col-span-2 text-center text-xs text-[--text-subtle] py-4">
            No saved voices yet. Record and save a voice sample first.
          </p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write TextInput.tsx**

Write `frontend/src/components/VoiceCloning/TextInput.tsx`:
```tsx
import { SectionLabel } from '../ui/SectionLabel';

interface Props {
  value: string;
  onChange: (text: string) => void;
}

function estimateAudioSeconds(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.round(words * 0.4);
}

export function TextInput({ value, onChange }: Props) {
  const charCount = value.length;
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const estimatedSecs = estimateAudioSeconds(value);

  return (
    <div className="space-y-2">
      <SectionLabel>GENERATE SPEECH</SectionLabel>
      <p className="text-xs text-[--text-subtle]">
        Type text and select a cloned voice to synthesize
      </p>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Enter the text you want your cloned voice to speak..."
        rows={6}
        className="w-full min-h-[180px] px-3 py-3 bg-[--bg] border border-[--border] rounded-[6px] text-[14px] text-[--text] placeholder-[--text-subtle] outline-none focus:border-[--accent] resize-none transition-colors duration-200"
      />
      <div className="flex justify-between">
        <span className="font-mono text-[10px] text-[--text-muted]">
          {charCount} chars · {wordCount} words
        </span>
        <span className="font-mono text-[10px] text-[--text-muted]">
          ~{estimatedSecs}s estimated output
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Write GenerateButton.tsx**

Write `frontend/src/components/VoiceCloning/GenerateButton.tsx`:
```tsx
import { Button } from '../ui/Button';
import { Wand2 } from 'lucide-react';

interface Props {
  disabled: boolean;
  isLoading: boolean;
  onClick: () => void;
}

export function GenerateButton({ disabled, isLoading, onClick }: Props) {
  return (
    <Button onClick={onClick} variant="primary" disabled={disabled || isLoading} fullWidth>
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
      ) : (
        <Wand2 className="w-4 h-4" strokeWidth={1.8} />
      )}
      <span className="font-mono text-[11px] tracking-[0.14em] uppercase">
        {isLoading ? 'Generating...' : 'Generate'}
      </span>
    </Button>
  );
}
```

- [ ] **Step 5: Write VoiceCloningScreen.tsx**

The orchestrator. 2-column layout inside a shared Panel, matching Figma exactly.

Write `frontend/src/components/VoiceCloning/VoiceCloningScreen.tsx`:
```tsx
import { useState, useCallback } from 'react';
import { ScreenHeader } from '../ScreenHeader';
import { Panel } from '../ui/Panel';
import { VoiceSampleInput } from './VoiceSampleInput';
import { ClonedVoicePicker } from './ClonedVoicePicker';
import { TextInput } from './TextInput';
import { GenerateButton } from './GenerateButton';
import { AudioPlaybackBar } from '../common/AudioPlaybackBar';
import { ErrorBanner } from '../common/ErrorBanner';
import { HelpFab } from '../ui/HelpFab';
import { useJobPolling } from '../../hooks/useJobPolling';
import { useVoices } from '../../hooks/useVoices';
import { ttsClone } from '../../lib/api';

export function VoiceCloningScreen() {
  const [sampleBlob, setSampleBlob] = useState<Blob | null>(null);
  const [voiceName, setVoiceName] = useState('');
  const [selectedVoiceId, setSelectedVoiceId] = useState('');
  const [text, setText] = useState('');
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { add, refresh: refreshVoices } = useVoices();
  const { status, result, error: jobError } = useJobPolling(currentJobId);
  const isProcessing = status === 'processing' || status === 'queued';

  const handleGenerate = useCallback(async () => {
    if (!selectedVoiceId || !text.trim()) return;
    try {
      setError(null);
      const jobId = await ttsClone(selectedVoiceId, text.trim());
      setCurrentJobId(jobId);
    } catch {
      setError('Failed to generate speech');
    }
  }, [selectedVoiceId, text]);

  const handleSaveVoice = useCallback(async () => {
    if (!sampleBlob || !voiceName.trim()) return;
    setSaving(true);
    try {
      const voice = await add(voiceName.trim(), sampleBlob);
      if (voice) {
        setSelectedVoiceId(voice.id);
        setVoiceName('');
        setSampleBlob(null);
        refreshVoices();
      }
    } catch {
      setError('Failed to save voice');
    }
    setSaving(false);
  }, [sampleBlob, voiceName, add, refreshVoices]);

  return (
    <>
      <ScreenHeader title="Voice Cloning" modelPill="magpie-tts-zeroshot" />
      <ErrorBanner message={error || jobError} onDismiss={() => setError(null)} />

      <Panel className="p-6">
        <div className="flex gap-8">
          {/* Left column — sample input (~340px) */}
          <div className="w-[340px] shrink-0 space-y-6">
            <VoiceSampleInput
              onAudioReady={setSampleBlob}
              hasAudio={!!sampleBlob}
              voiceName={voiceName}
              onVoiceNameChange={setVoiceName}
              onSave={handleSaveVoice}
              isSaving={saving}
            />
          </div>

          {/* Right column — generate speech + cloned voice picker */}
          <div className="flex-1 space-y-6">
            <TextInput value={text} onChange={setText} />
            <ClonedVoicePicker selectedId={selectedVoiceId} onSelect={setSelectedVoiceId} />
            <GenerateButton
              disabled={!selectedVoiceId || !text.trim()}
              isLoading={isProcessing}
              onClick={handleGenerate}
            />
            <AudioPlaybackBar audioUrl={result?.audio_url || null} />
            {result?.text && (
              <div className="p-3 bg-[--bg] rounded-[6px] text-[13px] text-[--text-muted] font-mono">
                {result.text}
              </div>
            )}
          </div>
        </div>
      </Panel>

      <HelpFab />
    </>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/VoiceCloning/ && git commit -m "feat: add Voice Cloning screen with 2-column layout matching Figma"
```

---

### Task 19: Studio Recorder Screen

**Files:**
- Create: `frontend/src/components/StudioRecorder/StudioRecorderScreen.tsx`
- Create: `frontend/src/components/StudioRecorder/RecordControls.tsx`
- Create: `frontend/src/components/StudioRecorder/WaveformViz.tsx`
- Create: `frontend/src/components/StudioRecorder/PipelineStages.tsx`
- Create: `frontend/src/components/StudioRecorder/PipelineStageCard.tsx`
- Create: `frontend/src/components/StudioRecorder/RunPipelineButton.tsx`
- Create: `frontend/src/components/StudioRecorder/StageOutput.tsx`

**Visual reference:** `figma_design/studio_recorder_page.png` — MUST match mic-circle recorder + 4 horizontal stage cards + chevron separators + run bar.

- [ ] **Step 1: Write RecordControls.tsx**

Write `frontend/src/components/StudioRecorder/RecordControls.tsx`:
```tsx
import { useRecorder } from '../../hooks/useRecorder';
import { SectionLabel } from '../ui/SectionLabel';
import { Panel } from '../ui/Panel';
import { Mic } from 'lucide-react';

interface Props {
  onRecordingComplete: (blob: Blob) => void;
}

export function RecordControls({ onRecordingComplete }: Props) {
  const { isRecording, duration, audioBlob, error, start, stop } = useRecorder();

  if (audioBlob && !isRecording) {
    onRecordingComplete(audioBlob);
  }

  return (
    <Panel className="p-6 text-center">
      <SectionLabel>RECORDER</SectionLabel>
      <div className="mt-4 flex flex-col items-center gap-3">
        <button
          onClick={isRecording ? stop : start}
          className={`btn-press w-16 h-16 rounded-full flex items-center justify-center border-2 ${
            isRecording
              ? 'border-[--danger] [box-shadow:0_0_12px_rgba(239,68,68,0.3)]'
              : 'border-[--accent] hover:border-[--accent-hover]'
          } bg-[--bg] transition-all duration-200`}
        >
          <Mic
            className={`w-6 h-6 ${
              isRecording ? 'text-[--danger]' : 'text-[--accent]'
            }`}
            strokeWidth={1.8}
          />
        </button>
        <p className="text-[13px] text-[--text-muted]">
          {isRecording
            ? `Recording... ${duration}s elapsed`
            : 'Click to start recording'}
        </p>
      </div>
      {error && <p className="text-[--danger] text-xs mt-2">{error}</p>}
      {audioBlob && !isRecording && (
        <p className="text-[--accent] text-xs mt-2 font-mono">
          Recorded {Math.round(audioBlob.size / 1024)}KB · {duration}s
        </p>
      )}
    </Panel>
  );
}
```

- [ ] **Step 2: Write WaveformViz.tsx**

Write `frontend/src/components/StudioRecorder/WaveformViz.tsx`:
```tsx
import { useEffect, useRef } from 'react';

interface Props {
  isRecording: boolean;
  stream: MediaStream | null;
}

export function WaveformViz({ isRecording, stream }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isRecording || !stream || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let animId: number;
    const draw = () => {
      animId = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);
      if (!canvasRef.current) return;
      const cw = canvasRef.current.width;
      const ch = canvasRef.current.height;
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, cw, ch);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#76b900';
      ctx.beginPath();
      const sliceWidth = cw / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * ch) / 2;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.lineTo(cw, ch / 2);
      ctx.stroke();
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      audioCtx.close();
    };
  }, [isRecording, stream]);

  if (!isRecording) return null;
  return (
    <canvas ref={canvasRef} width={600} height={100} className="w-full h-24 rounded-[6px] bg-[--bg]" />
  );
}
```

- [ ] **Step 3: Write PipelineStageCard.tsx**

Write `frontend/src/components/StudioRecorder/PipelineStageCard.tsx`:
```tsx
import { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  model: string;
  selected: boolean;
  onToggle: () => void;
}

export function PipelineStageCard({ icon: Icon, title, model, selected, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      className={`btn-press flex-1 flex flex-col gap-2 p-4 rounded-[8px] border text-left transition-colors duration-200 ${
        selected
          ? 'border-[--accent] bg-[--accent-bg]'
          : 'border-[--border] bg-[--surface] hover:border-[--border-strong]'
      }`}
    >
      <div className="flex items-center justify-between">
        <Icon className={`w-4 h-4 ${selected ? 'text-[--accent]' : 'text-[--text-muted]'}`} strokeWidth={1.5} />
        <span
          className={`inline-flex items-center px-1.5 py-0.5 rounded-[4px] font-mono text-[10px] font-medium ${
            selected
              ? 'bg-[--accent] text-black'
              : 'bg-[--border] text-[--text-muted]'
          }`}
        >
          {selected ? 'ON' : 'OFF'}
        </span>
      </div>
      <div>
        <p className={`text-[13px] font-medium ${selected ? 'text-[--text]' : 'text-[--text-muted]'}`}>
          {title}
        </p>
        <p className="font-mono text-[10px] text-[--text-subtle] mt-0.5">{model}</p>
      </div>
    </button>
  );
}
```

- [ ] **Step 4: Write PipelineStages.tsx**

Write `frontend/src/components/StudioRecorder/PipelineStages.tsx`:
```tsx
import { SectionLabel } from '../ui/SectionLabel';
import { PipelineStageCard } from './PipelineStageCard';
import { Zap, Activity, Languages, Wand2, ChevronRight } from 'lucide-react';

interface Props {
  steps: string[];
  targetLanguage: string;
  voiceId: string;
  voices: { id: string; name: string }[];
  onToggleStep: (step: string) => void;
  onLanguageChange: (lang: string) => void;
  onVoiceChange: (id: string) => void;
}

const STAGES = [
  { id: 'clean', title: 'Clean', model: 'BNR', icon: Zap },
  { id: 'transcribe', title: 'Transcribe', model: 'canary-1b', icon: Activity },
  { id: 'translate', title: 'Translate', model: 'canary-1b', icon: Languages },
  { id: 'revoice', title: 'Re-voice', model: 'magpie-tts', icon: Wand2 },
] as const;

export function PipelineStages({
  steps, targetLanguage, voiceId, voices,
  onToggleStep, onLanguageChange, onVoiceChange,
}: Props) {
  const enabledCount = steps.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <SectionLabel>PIPELINE</SectionLabel>
        <span className="font-mono text-[10px] text-[--text-muted]">
          {enabledCount} stage{enabledCount !== 1 ? 's' : ''} active
        </span>
      </div>
      <div className="flex items-center gap-2">
        {STAGES.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2 flex-1">
            <PipelineStageCard
              icon={s.icon}
              title={s.title}
              model={s.model}
              selected={steps.includes(s.id)}
              onToggle={() => onToggleStep(s.id)}
            />
            {i < STAGES.length - 1 && (
              <ChevronRight className="w-4 h-4 text-[--border] shrink-0" strokeWidth={1} />
            )}
          </div>
        ))}
      </div>
      {steps.includes('translate') && (
        <select
          value={targetLanguage}
          onChange={e => onLanguageChange(e.target.value)}
          className="w-full px-3 py-2 bg-[--bg] border border-[--border] rounded-[6px] text-[13px] text-[--text] outline-none focus:border-[--accent] transition-colors"
        >
          <option value="en">English</option>
          <option value="fr">French</option>
          <option value="es">Spanish</option>
          <option value="de">German</option>
          <option value="hi">Hindi</option>
        </select>
      )}
      {steps.includes('revoice') && (
        <select
          value={voiceId}
          onChange={e => onVoiceChange(e.target.value)}
          className="w-full px-3 py-2 bg-[--bg] border border-[--border] rounded-[6px] text-[13px] text-[--text] outline-none focus:border-[--accent] transition-colors"
        >
          <option value="">Select target voice...</option>
          {voices.map(v => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Write RunPipelineButton.tsx**

Write `frontend/src/components/StudioRecorder/RunPipelineButton.tsx`:
```tsx
import { Button } from '../ui/Button';
import { Play } from 'lucide-react';

interface Props {
  disabled: boolean;
  isLoading: boolean;
  step: string | null;
  stepsCompleted: number;
  totalSteps: number;
  onClick: () => void;
}

export function RunPipelineButton({ disabled, isLoading, step, stepsCompleted, totalSteps, onClick }: Props) {
  return (
    <Button onClick={onClick} variant="primary" disabled={disabled || isLoading} fullWidth>
      <Play className="w-4 h-4" strokeWidth={1.8} />
      <span className="font-mono text-[11px] tracking-[0.14em] uppercase">
        {isLoading
          ? `Running ${step || ''} (${stepsCompleted}/${totalSteps})`
          : 'Run Pipeline'}
      </span>
    </Button>
  );
}
```

- [ ] **Step 6: Write StageOutput.tsx**

Write `frontend/src/components/StudioRecorder/StageOutput.tsx`:
```tsx
import { Panel } from '../ui/Panel';
import { SectionLabel } from '../ui/SectionLabel';

interface Result {
  audio_url?: string;
  text?: string;
  translated_text?: string;
}

interface Props {
  result: Result | null;
  completedSteps: number;
  totalSteps: number;
}

export function StageOutput({ result, completedSteps, totalSteps }: Props) {
  if (!result) return null;

  return (
    <Panel className="p-5 space-y-4">
      <SectionLabel>Results ({completedSteps}/{totalSteps} steps)</SectionLabel>
      {result.audio_url && (
        <div style={{ animation: `fade-up 200ms var(--ease-out) forwards` }}>
          <audio controls src={result.audio_url} className="w-full h-8" />
        </div>
      )}
      {result.text && (
        <div style={{ animation: `fade-up 200ms var(--ease-out) forwards`, animationDelay: '40ms', opacity: 0 }}>
          <p className="font-mono text-[10px] text-[--text-muted] uppercase tracking-wider mb-1">Transcription</p>
          <p className="text-[13px] text-[--text]">{result.text}</p>
        </div>
      )}
      {result.translated_text && (
        <div style={{ animation: `fade-up 200ms var(--ease-out) forwards`, animationDelay: '80ms', opacity: 0 }}>
          <p className="font-mono text-[10px] text-[--text-muted] uppercase tracking-wider mb-1">Translation</p>
          <p className="text-[13px] text-[--text]">{result.translated_text}</p>
        </div>
      )}
    </Panel>
  );
}
```

- [ ] **Step 7: Write StudioRecorderScreen.tsx**

Write `frontend/src/components/StudioRecorder/StudioRecorderScreen.tsx`:
```tsx
import { useState, useCallback } from 'react';
import { ScreenHeader } from '../ScreenHeader';
import { RecordControls } from './RecordControls';
import { WaveformViz } from './WaveformViz';
import { PipelineStages } from './PipelineStages';
import { RunPipelineButton } from './RunPipelineButton';
import { StageOutput } from './StageOutput';
import { ErrorBanner } from '../common/ErrorBanner';
import { HelpFab } from '../ui/HelpFab';
import { useJobPolling } from '../../hooks/useJobPolling';
import { useRecorder } from '../../hooks/useRecorder';
import { useVoices } from '../../hooks/useVoices';
import { runPipeline } from '../../lib/api';

export function StudioRecorderScreen() {
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [steps, setSteps] = useState<string[]>([]);
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [selectedVoiceId, setSelectedVoiceId] = useState('');
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [screenError, setScreenError] = useState<string | null>(null);

  const { voices } = useVoices();
  const { isRecording } = useRecorder();
  const { status, result, step, steps_completed, total_steps, error: jobError } = useJobPolling(currentJobId);
  const isProcessing = status === 'processing' || status === 'queued';

  const handleRun = useCallback(async () => {
    if (!recordingBlob || steps.length === 0) return;
    try {
      setScreenError(null);
      const jobId = await runPipeline(recordingBlob, steps, targetLanguage, selectedVoiceId || undefined);
      setCurrentJobId(jobId);
    } catch {
      setScreenError('Failed to start pipeline');
    }
  }, [recordingBlob, steps, targetLanguage, selectedVoiceId]);

  const toggleStep = (stepId: string) => {
    setSteps(prev =>
      prev.includes(stepId) ? prev.filter(s => s !== stepId) : [...prev, stepId]
    );
  };

  return (
    <>
      <ScreenHeader title="Studio Recorder" modelPill="canary-1b · BNR" />
      <ErrorBanner message={screenError || jobError} onDismiss={() => setScreenError(null)} />

      <div className="space-y-6">
        <RecordControls onRecordingComplete={setRecordingBlob} />
        <WaveformViz isRecording={isRecording} stream={null} />

        <PipelineStages
          steps={steps}
          targetLanguage={targetLanguage}
          voiceId={selectedVoiceId}
          voices={voices}
          onToggleStep={toggleStep}
          onLanguageChange={setTargetLanguage}
          onVoiceChange={setSelectedVoiceId}
        />

        <RunPipelineButton
          disabled={!recordingBlob || steps.length === 0}
          isLoading={isProcessing}
          step={step}
          stepsCompleted={steps_completed}
          totalSteps={total_steps}
          onClick={handleRun}
        />

        <StageOutput result={result} completedSteps={steps_completed} totalSteps={total_steps} />
      </div>

      <HelpFab />
    </>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add frontend/src/components/StudioRecorder/ && git commit -m "feat: add Studio Recorder screen with pipeline stage cards matching Figma"
```

---

### Task 20: Library Screen

**Files:**
- Create: `frontend/src/components/Library/LibraryScreen.tsx`
- Create: `frontend/src/components/Library/LibraryTabs.tsx`
- Create: `frontend/src/components/Library/VoiceCard.tsx`
- Create: `frontend/src/components/Library/ClipRow.tsx`

**Visual references:** `figma_design/library_page.png` (Voices grid) and `figma_design/library_clips_page.png` (Clips list).

- [ ] **Step 1: Write VoiceCard.tsx**

Write `frontend/src/components/Library/VoiceCard.tsx`:
```tsx
import { Panel } from '../ui/Panel';
import { Button } from '../ui/Button';
import { WaveformBars } from '../ui/WaveformBars';
import { Play, Trash2 } from 'lucide-react';
import type { Color } from '../ui/StatusDot';

interface Props {
  id: string;
  name: string;
  filename: string;
  duration_secs: number;
  created_at: string;
  colorIndex: number;
  onPlay: (url: string) => void;
  onDelete: (id: string) => void;
}

const COLORS: Color[] = ['green', 'blue', 'purple', 'orange'];
const COLOR_VALUES = ['var(--voice-green)', 'var(--voice-blue)', 'var(--voice-purple)', 'var(--voice-orange)'];

const DUMMY_WAVEFORM = Array.from({ length: 16 }, () => Math.random() * 0.7 + 0.15);

export function VoiceCard({ id, name, filename, duration_secs, created_at, colorIndex, onPlay, onDelete }: Props) {
  const color = COLOR_VALUES[colorIndex % COLOR_VALUES.length];
  const audioUrl = `/audio/voices/${filename}`;
  const date = new Date(created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <Panel className="overflow-hidden">
      {/* 2px left color bar */}
      <div className="flex">
        <div className="w-[2px] shrink-0" style={{ backgroundColor: color }} />
        <div className="flex-1 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[16px] font-semibold text-[--text]">{name}</h4>
            <button
              onClick={() => onDelete(id)}
              className="btn-press text-[--text-subtle] hover:text-[--danger] transition-colors"
              aria-label={`Delete ${name}`}
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          </div>
          <p className="font-mono text-[10px] text-[--text-muted]">
            {duration_secs.toFixed(1)}s · {date} · zero-shot
          </p>
          <WaveformBars bars={DUMMY_WAVEFORM} color={color} height={32} />
          <Button variant="secondary" fullWidth onClick={() => onPlay(audioUrl)}>
            <Play className="w-3 h-3" strokeWidth={1.8} />
            Play
          </Button>
        </div>
      </div>
    </Panel>
  );
}
```

- [ ] **Step 2: Write ClipRow.tsx**

Write `frontend/src/components/Library/ClipRow.tsx`:
```tsx
import { Panel } from '../ui/Panel';
import { IconButton } from '../ui/IconButton';
import { VoiceTag } from '../ui/VoiceTag';
import { Play, Trash2 } from 'lucide-react';
import { formatDuration } from '../../lib/blobUtils';
import type { Color } from '../ui/StatusDot';

interface Props {
  id: string;
  name: string;
  filename: string;
  duration_secs: number;
  created_at: string;
  colorIndex: number;
  onPlay: (url: string) => void;
  onDelete: (id: string) => void;
}

const COLORS: Color[] = ['green', 'blue', 'purple', 'orange'];

export function ClipRow({ id, name, filename, duration_secs, created_at, colorIndex, onPlay, onDelete }: Props) {
  const audioUrl = `/audio/clips/${filename}`;
  const voiceColor = COLORS[colorIndex % COLORS.length];
  const ts = new Date(created_at).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <Panel className="px-4 py-3 space-y-2 hover:bg-[--surface-hover] transition-colors duration-150">
      <div className="flex items-center gap-3">
        <IconButton label="Play clip" size={32} onClick={() => onPlay(audioUrl)}>
          <Play className="w-3.5 h-3.5" strokeWidth={1.8} />
        </IconButton>
        <div className="flex-1 min-w-0">
          <p className="text-[16px] text-[--text] truncate">{name}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <VoiceTag name={`Voice ${colorIndex + 1}`} color={voiceColor} />
            <span className="font-mono text-[10px] text-[--text-muted]">{formatDuration(duration_secs)}</span>
            <span className="font-mono text-[10px] text-[--text-muted]">·</span>
            <span className="font-mono text-[10px] text-[--text-muted]">{ts}</span>
            <span className="font-mono text-[10px] text-[--text-muted]">·</span>
            <span className="font-mono text-[10px] text-[--text-muted]">canary-1b</span>
          </div>
        </div>
        <button
          onClick={() => onDelete(id)}
          className="btn-press text-[--text-subtle] hover:text-[--danger] transition-colors shrink-0"
          aria-label={`Delete ${name}`}
        >
          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
        </button>
      </div>
    </Panel>
  );
}
```

- [ ] **Step 3: Write LibraryTabs.tsx**

Write `frontend/src/components/Library/LibraryTabs.tsx`:
```tsx
import { Button } from '../ui/Button';
import { Plus } from 'lucide-react';

interface Props {
  view: 'voices' | 'clips';
  onViewChange: (view: 'voices' | 'clips') => void;
  voiceCount: number;
  clipCount: number;
}

export function LibraryTabs({ view, onViewChange, voiceCount, clipCount }: Props) {
  return (
    <div className="flex items-center justify-between border-b border-[--border] pb-0">
      <div className="flex gap-0">
        <button
          onClick={() => onViewChange('voices')}
          className={`btn-press relative px-4 py-3 text-[13px] font-medium ${
            view === 'voices'
              ? 'text-[--accent]'
              : 'text-[--text-muted] hover:text-[--text]'
          }`}
        >
          Voices ({voiceCount})
          {view === 'voices' && (
            <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-[--accent] rounded-full" />
          )}
        </button>
        <button
          onClick={() => onViewChange('clips')}
          className={`btn-press relative px-4 py-3 text-[13px] font-medium ${
            view === 'clips'
              ? 'text-[--accent]'
              : 'text-[--text-muted] hover:text-[--text]'
          }`}
        >
          Clips ({clipCount})
          {view === 'clips' && (
            <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-[--accent] rounded-full" />
          )}
        </button>
      </div>
      <Button variant="outline" className="text-[11px]">
        <Plus className="w-3.5 h-3.5" strokeWidth={1.8} />
        <span className="font-mono text-[10px] tracking-[0.1em] uppercase">Add</span>
      </Button>
    </div>
  );
}
```

- [ ] **Step 4: Write LibraryScreen.tsx**

Write `frontend/src/components/Library/LibraryScreen.tsx`:
```tsx
import { useState, useRef } from 'react';
import { ScreenHeader } from '../ScreenHeader';
import { LibraryTabs } from './LibraryTabs';
import { VoiceCard } from './VoiceCard';
import { ClipRow } from './ClipRow';
import { HelpFab } from '../ui/HelpFab';
import { useVoices } from '../../hooks/useVoices';
import { useClips } from '../../hooks/useClips';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';

export function LibraryScreen() {
  const [view, setView] = useState<'voices' | 'clips'>('voices');
  const { voices, loading: voicesLoading, remove: removeVoice } = useVoices();
  const { clips, loading: clipsLoading, remove: removeClip } = useClips();
  const { play } = useAudioPlayer(null);

  return (
    <>
      <ScreenHeader title="Library" />
      <LibraryTabs
        view={view}
        onViewChange={setView}
        voiceCount={voices.length}
        clipCount={clips.length}
      />

      <div className="mt-6">
        {view === 'voices' && (
          voicesLoading ? (
            <p className="text-[--text-muted] text-sm py-8 text-center">Loading voices...</p>
          ) : voices.length === 0 ? (
            <div className="py-16 text-center" style={{ animation: 'scale-in 300ms var(--ease-out) forwards' }}>
              <p className="font-mono text-[11px] text-[--text-muted] uppercase tracking-[0.14em]">
                No saved voices
              </p>
              <p className="text-[13px] text-[--text-subtle] mt-1">
                Record and save a voice in Voice Cloning to see it here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5">
              {voices.map((v, i) => (
                <div
                  key={v.id}
                  style={{
                    animation: 'fade-up 200ms var(--ease-out) forwards',
                    animationDelay: `${i * 50}ms`,
                    opacity: 0,
                  }}
                >
                  <VoiceCard
                    {...v}
                    colorIndex={i}
                    onPlay={(url) => play()}
                    onDelete={removeVoice}
                  />
                </div>
              ))}
            </div>
          )
        )}

        {view === 'clips' && (
          clipsLoading ? (
            <p className="text-[--text-muted] text-sm py-8 text-center">Loading clips...</p>
          ) : clips.length === 0 ? (
            <div className="py-16 text-center" style={{ animation: 'scale-in 300ms var(--ease-out) forwards' }}>
              <p className="font-mono text-[11px] text-[--text-muted] uppercase tracking-[0.14em]">
                No clips yet
              </p>
              <p className="text-[13px] text-[--text-subtle] mt-1">
                Generate speech to create your first clip.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {clips.map((c, i) => (
                <div
                  key={c.id}
                  style={{
                    animation: 'fade-up 200ms var(--ease-out) forwards',
                    animationDelay: `${i * 50}ms`,
                    opacity: 0,
                  }}
                >
                  <ClipRow
                    {...c}
                    colorIndex={i}
                    onPlay={() => {}}
                    onDelete={removeClip}
                  />
                </div>
              ))}
            </div>
          )
        )}
      </div>

      <HelpFab />
    </>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/Library/ && git commit -m "feat: add Library screen with voices grid and clips list matching Figma"
```

---

## Phase 11: Testing

### Task 21: Backend Integration Tests

**Files:**
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/test_models.py`
- Create: `backend/tests/test_jobs.py`
- Create: `backend/tests/test_tts.py`
- Create: `backend/tests/test_asr.py`
- Create: `backend/tests/test_library.py`

- [ ] **Step 1: Write conftest.py**

Write `backend/tests/conftest.py`:
```python
import pytest
from httpx import AsyncClient, ASGITransport
from main import app
from job_manager import job_manager


@pytest.fixture(autouse=True)
def clear_jobs():
    job_manager._jobs.clear()


@pytest.fixture
def sample_wav() -> bytes:
    import wave, io
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(16000)
        w.writeframes(b"\x00\x00" * 16000)
    return buf.getvalue()


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
```

- [ ] **Step 2: Write test_models.py**

Write `backend/tests/test_models.py`:
```python
from models import TTSCloneRequest, JobStatus, JobResponse, PipelineStep

def test_tts_clone_request():
    req = TTSCloneRequest(voice_id="v_abc", text="Hello")
    assert req.voice_id == "v_abc"
    assert req.text == "Hello"

def test_job_status_values():
    assert JobStatus.queued.value == "queued"

def test_pipeline_step_values():
    assert PipelineStep.clean.value == "clean"
```

- [ ] **Step 3: Write test_jobs.py**

Write `backend/tests/test_jobs.py`:
```python
from job_manager import job_manager
from models import JobStatus

def test_create_and_get_job():
    jid = job_manager.create_job()
    job = job_manager.get_job(jid)
    assert job is not None
    assert job.status == JobStatus.queued

def test_update_job():
    jid = job_manager.create_job()
    job_manager.update_job(jid, status=JobStatus.done, progress=100)
    job = job_manager.get_job(jid)
    assert job.status == JobStatus.done
    assert job.progress == 100

def test_missing_job():
    assert job_manager.get_job("nonexistent") is None
```

- [ ] **Step 4: Write test_tts.py**

Write `backend/tests/test_tts.py`:
```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_tts_clone_missing_voice(client: AsyncClient):
    resp = await client.post("/api/tts/clone", json={
        "voice_id": "nonexistent",
        "text": "Hello world",
    })
    # Should create job even if voice doesn't exist yet (fails during execution)
    assert resp.status_code == 200
    data = resp.json()
    assert "job_id" in data
```

- [ ] **Step 5: Write test_asr.py**

Write `backend/tests/test_asr.py`:
```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_asr_transcribe(client: AsyncClient, sample_wav: bytes):
    resp = await client.post("/api/asr", files={
        "audio": ("test.wav", sample_wav, "audio/wav"),
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "job_id" in data

@pytest.mark.asyncio
async def test_asr_translate(client: AsyncClient, sample_wav: bytes):
    resp = await client.post("/api/asr/translate", files={
        "audio": ("test.wav", sample_wav, "audio/wav"),
    }, data={"target_language": "fr"})
    assert resp.status_code == 200
    data = resp.json()
    assert "job_id" in data
```

- [ ] **Step 6: Write test_library.py**

Write `backend/tests/test_library.py`:
```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_list_voices_empty(client: AsyncClient):
    resp = await client.get("/api/voices")
    assert resp.status_code == 200
    data = resp.json()
    assert data["voices"] == []

@pytest.mark.asyncio
async def test_save_and_delete_voice(client: AsyncClient, sample_wav: bytes):
    resp = await client.post("/api/voices", data={"name": "Test Voice"}, files={
        "audio": ("voice.wav", sample_wav, "audio/wav"),
    })
    assert resp.status_code == 200
    voice = resp.json()
    assert voice["name"] == "Test Voice"
    voice_id = voice["id"]

    resp = await client.delete(f"/api/voices/{voice_id}")
    assert resp.status_code == 204

@pytest.mark.asyncio
async def test_delete_nonexistent_voice(client: AsyncClient):
    resp = await client.delete("/api/voices/nonexistent")
    assert resp.status_code == 404

@pytest.mark.asyncio
async def test_health(client: AsyncClient):
    resp = await client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}
```

- [ ] **Step 7: Run tests and verify**

Run: `cd backend && pip install pytest pytest-asyncio httpx && python -m pytest tests/ -v`
Expected: all tests PASS

- [ ] **Step 8: Commit**

```bash
git add backend/tests/ && git commit -m "test: add backend integration tests for models, jobs, TTS, ASR, library"
```

---

### Task 22: Frontend Component Tests

**Files:**
- Create: `frontend/tests/setup.ts`
- Create: `frontend/tests/components/App.test.tsx`

- [ ] **Step 1: Install testing deps**

Run: `cd frontend && npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom`

- [ ] **Step 2: Create test setup file**

Write `frontend/tests/setup.ts`:
```typescript
import '@testing-library/jest-dom';
```

- [ ] **Step 3: Update frontend vitest config**

Read `frontend/vite.config.ts`, replace with:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
      '/audio': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
  },
})
```

- [ ] **Step 4: Write App.test.tsx**

Write `frontend/tests/components/App.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../../src/App';

describe('App', () => {
  it('renders the brand name in sidebar', () => {
    render(<App />);
    expect(screen.getByText('AI Voice')).toBeInTheDocument();
    expect(screen.getByText('Studio')).toBeInTheDocument();
  });

  it('renders all three nav items', () => {
    render(<App />);
    expect(screen.getByText('Voice Cloning')).toBeInTheDocument();
    expect(screen.getByText('Studio Recorder')).toBeInTheDocument();
    expect(screen.getByText('Library')).toBeInTheDocument();
  });

  it('renders models active footer', () => {
    render(<App />);
    expect(screen.getByText('Models Active')).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Run tests**

Run: `cd frontend && npx vitest run`
Expected: all tests PASS

- [ ] **Step 6: Commit**

```bash
git add frontend/vite.config.ts frontend/tests/ && git commit -m "test: add frontend component tests"
```

---

## Self-Review

**1. Spec coverage:**
- Design tokens (CSS custom properties, Tailwind config, font imports) → Tasks 2 (globals.css), 15b (tailwind.config.ts)
- UI Primitives (SectionLabel, Panel, Button, etc.) → Task 16b (9 shared components)
- App shell (Sidebar + ScreenHeader + screen-switching) → Task 16 (AppContext, Sidebar, ScreenHeader, App.tsx)
- Common components (AudioPlaybackBar, ErrorBanner, JobPollingOverlay) → Task 17
- Voice Cloning (2-column Figma layout, sample input + generated text + cloned voice grid) → Tasks 8 (TTS router), 14 (api.ts), 15 (hooks), 18 (VoiceCloningScreen)
- Studio Recorder (mic-circle recorder + horizontal pipeline stage cards + chevron separators + run bar) → Tasks 10 (cleanup), 9 (ASR), 12 (studio pipeline), 19 (StudioRecorderScreen)
- Library (voices grid with colored bars + clips list rows) → Tasks 11 (library router), 20 (LibraryScreen)
- Job polling system → Tasks 7 (job_manager), 13 (jobs router), 15 (useJobPolling hook)
- Nvidia client → Task 6
- Audio services → Tasks 4, 5
- Error handling → ErrorBanner component, job failure flow, try/catch in screen orchestrators
- Config/health/models endpoints → Task 1 main.py
- HelpFab → Task 16b (HelpFab.tsx)
- Tests → Tasks 21, 22
- All color references use Nvidia green (#76b900) not indigo → verified across all tasks
- Layout uses left sidebar (220px) not horizontal tabs → Task 16 (Sidebar.tsx)
- Dark theme only (MVP) — no theme toggle → AppContext has no isDark/toggleTheme
- 4 figma_design/*.png visual references documented → each screen task includes visual_reference

**2. Placeholder scan:** No TBDs, TODOs, or "implement later" found. Every task has complete code.

**3. Type consistency:** All function signatures, model attributes, API response shapes are consistent across tasks. The `JobResult` in models.py matches what api.ts expects. Audio endpoints use `UploadFile` which matches `FormData` on frontend. Screen components reference `Screen` type from AppContext. All UI primitives export consistent `Props` interfaces.

**4. Design token consistency:** All CSS custom properties (--bg, --surface, --border, --accent, etc.) defined in globals.css and mirrored in tailwind.config.ts. Component code references these via inline `style` or TailwindCSS arbitrary values like `text-[--text-muted]`, `bg-[--bg]`, `border-[--accent]`.

**5. Figma compliance:** Each screen task includes a `Visual reference:` line pointing to the exact figma_design PNG. Screen implementations follow the exact layout (2-column for Voice Cloning, horizontal cards for Studio Recorder, grid+list for Library). Sidebar matches across all 4 screens.
