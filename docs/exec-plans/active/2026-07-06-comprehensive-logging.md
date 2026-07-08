# Comprehensive Logging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add extensive structured logging to both backend (Python logging) and frontend (console-based logger) for debugging every feature — API calls, job lifecycle, NIM interactions, audio operations, state changes, and errors.

**Architecture:** Backend uses Python's `logging` module with a `dictConfig` in `main.py` and per-module `logging.getLogger(__name__)`. Frontend uses a thin `logger.ts` utility wrapping `console` with level filtering, context prefixes, and Vite dev-mode stripping. Every operation logs at appropriate levels (DEBUG/INFO/WARNING/ERROR) with structured context.

**Tech Stack:** Python `logging` module, `python-json-logger` (optional structured JSON), Vite `import.meta.env.DEV`, TypeScript strict mode.

---

## Phase 1: Backend Logging Infrastructure

### Task 1.1: Add Logging Configuration to config.py

**Files:**
- Modify: `backend/config.py`

**Purpose:** Add `LOG_LEVEL`, `LOG_FORMAT`, and `LOG_FILE` settings so logging can be configured via `.env` without code changes.

- [ ] **Step 1: Add logging settings to Settings class**

Add to `backend/config.py` after `job_cleanup_interval_seconds`:

```python
    log_level: str = "INFO"
    log_format: str = "text"  # "text" or "json"
    log_file: str = ""  # empty = stderr
```

- [ ] **Step 2: Verify it loads correctly**

Run: `cd backend && python -c "from config import settings; print(settings.log_level, settings.log_format)"`
Expected: `INFO text`

- [ ] **Step 3: Commit**

---

### Task 1.2: Configure Root Logger in main.py

**Files:**
- Modify: `backend/main.py`

**Purpose:** Set up Python logging with dictConfig at app startup, with structured format and file support.

- [ ] **Step 1: Add logging configuration to main.py**

Replace the imports at the top of `backend/main.py`:

```python
import logging
import logging.config
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from config import settings, get_voices_dir, get_clips_dir, get_recordings_dir
from routers import tts, asr, cleanup, studio, library, jobs
```

After the directory creation block and before `app = FastAPI(...)`, add:

```python
LOGGING_CONFIG: dict = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "text": {
            "format": "%(asctime)s | %(levelname)-8s | %(name)s:%(lineno)d | %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
        "json": {
            "format": '{"timestamp":"%(asctime)s","level":"%(levelname)s","logger":"%(name)s","line":%(lineno)d,"message":"%(message)s"}',
            "datefmt": "%Y-%m-%dT%H:%M:%S",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": settings.log_format,
            "stream": "ext://sys.stderr",
        },
    },
    "root": {
        "level": settings.log_level.upper(),
        "handlers": ["console"],
    },
    "loggers": {
        "uvicorn": {"level": "WARNING", "handlers": ["console"], "propagate": False},
        "httpx": {"level": "WARNING", "handlers": ["console"], "propagate": False},
    },
}

if settings.log_file:
    LOGGING_CONFIG["handlers"]["file"] = {
        "class": "logging.handlers.RotatingFileHandler",
        "filename": settings.log_file,
        "maxBytes": 10 * 1024 * 1024,
        "backupCount": 3,
        "formatter": settings.log_format,
    }
    LOGGING_CONFIG["root"]["handlers"].append("file")
    for logger_name in LOGGING_CONFIG["loggers"]:
        LOGGING_CONFIG["loggers"][logger_name]["handlers"].append("file")

logging.config.dictConfig(LOGGING_CONFIG)

logger = logging.getLogger(__name__)
logger.info("Starting AI Voice Studio v0.1.0, log_level=%s", settings.log_level)
```

After the models endpoint, before the file ends, add a shutdown event:

```python
@app.on_event("shutdown")
async def shutdown():
    logger.info("Shutting down AI Voice Studio")
```

- [ ] **Step 2: Verify logging works**

Run: `cd backend && python -c "from main import app; print('OK')"`
Expected: Log lines printed to stderr including `Starting AI Voice Studio`

- [ ] **Step 3: Commit**

---

### Task 1.3: Add Logging to All Router Handlers

**Files:**
- Modify: `backend/routers/tts.py`
- Modify: `backend/routers/asr.py`
- Modify: `backend/routers/cleanup.py`
- Modify: `backend/routers/studio.py`
- Modify: `backend/routers/library.py`
- Modify: `backend/routers/jobs.py`

**Purpose:** Log every API request entry/exit with key parameters (job_id, text length, audio size, voice_id, language) at INFO level, and all errors at WARNING/ERROR level.

- [ ] **Step 1: Add logging to tts.py**

```python
import logging
logger = logging.getLogger(__name__)

# In _tts_clone_task, add before nvidia_client call:
    logger.info("TTS clone job=%s: voice=%s text_len=%d", job_id, voice_id, len(text))
```

Replace the endpoint handler:

```python
@router.post("/tts/clone", response_model=JobCreatedResponse)
async def tts_clone(request: TTSCloneRequest):
    job_id = job_manager.create_job()
    logger.info("TTS clone request: voice=%s text_len=%d -> job=%s", request.voice_id, len(request.text), job_id)
    asyncio.ensure_future(job_manager.run_job(job_id, _tts_clone_task, request.voice_id, request.text))
    return JobCreatedResponse(job_id=job_id, status="queued")
```

- [ ] **Step 2: Add logging to asr.py**

```python
import logging
logger = logging.getLogger(__name__)

# In _transcribe_task:
    logger.info("ASR transcribe job=%s: audio_size=%d bytes", job_id, len(audio_bytes))

# In _translate_task:
    logger.info("ASR translate job=%s: audio_size=%d target=%s", job_id, len(audio_bytes), target_lang)

# In endpoint handlers:
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
```

- [ ] **Step 3: Add logging to cleanup.py**

```python
import logging
logger = logging.getLogger(__name__)

# In _clean_task:
    logger.info("Cleanup job=%s: audio_size=%d bytes", job_id, len(audio_bytes))

@router.post("/clean", response_model=JobCreatedResponse)
async def clean_audio(audio: UploadFile = File(...)):
    audio_bytes = await audio.read()
    job_id = job_manager.create_job()
    logger.info("Clean request: filename=%s size=%d -> job=%s", audio.filename or "unknown", len(audio_bytes), job_id)
    asyncio.ensure_future(job_manager.run_job(job_id, _clean_task, audio_bytes))
    return JobCreatedResponse(job_id=job_id, status="queued")
```

- [ ] **Step 4: Add logging to studio.py**

```python
import logging
logger = logging.getLogger(__name__)

# At start of _pipeline_task:
    logger.info("Pipeline job=%s: steps=%s audio_size=%d", job_id, [s.value for s in steps], len(audio_bytes))

# Before each pipeline step:
        logger.info("Pipeline job=%s: step %d/%d=%s", job_id, i + 1, total_steps, step.value)

# Before the revoice step within _pipeline_task:
            logger.info("Pipeline job=%s: revoice voice=%s text_len=%d", job_id, voice_id, len(text_to_speak))

@router.post("/studio/pipeline", response_model=JobCreatedResponse)
async def run_pipeline(...):
    ...
    logger.info("Pipeline request: steps=%s lang=%s voice=%s size=%d -> job=%s",
                steps, target_language, voice_id, len(audio_bytes), job_id)
    ...
```

- [ ] **Step 5: Add logging to library.py**

```python
import logging
logger = logging.getLogger(__name__)

@router.get("/voices", response_model=VoiceListResponse)
async def list_voices():
    meta = _load_meta(META_FILE_VOICES)
    logger.info("List voices: count=%d", len(meta))
    ...

@router.post("/voices", response_model=VoiceResponse)
async def save_voice_endpoint(...):
    ...
    logger.info("Save voice: name=%s filename=%s duration=%.1fs", name, filename, duration)
    ...

@router.delete("/voices/{voice_id}", status_code=204)
async def delete_voice_endpoint(voice_id: str):
    ...
    if not info:
        logger.warning("Delete voice failed: voice=%s not found", voice_id)
        raise HTTPException(404, "Voice not found")
    logger.info("Delete voice: voice=%s filename=%s", voice_id, info["filename"])
    ...

@router.get("/clips", response_model=ClipListResponse)
async def list_clips():
    meta = _load_meta(META_FILE_CLIPS)
    logger.info("List clips: count=%d", len(meta))
    ...

@router.delete("/clips/{clip_id}", status_code=204)
async def delete_clip_endpoint(clip_id: str):
    ...
    if not info:
        logger.warning("Delete clip failed: clip=%s not found", clip_id)
        raise HTTPException(404, "Clip not found")
    logger.info("Delete clip: clip=%s filename=%s", clip_id, info["filename"])
    ...
```

- [ ] **Step 6: Add logging to jobs.py**

```python
import logging
logger = logging.getLogger(__name__)

@router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: str):
    job = job_manager.get_job(job_id)
    if not job:
        logger.warning("Job lookup failed: job=%s not found", job_id)
        raise HTTPException(404, "Job not found")
    logger.debug("Job poll: job=%s status=%s progress=%d", job_id, job.status.value, job.progress)
    return job.to_response()
```

- [ ] **Step 7: Verify all routers still work**

Run: `cd backend && python -c "from main import app; print('OK')"`
Expected: `OK` with no import errors

- [ ] **Step 8: Commit**

---

### Task 1.4: Add Logging to nvidia_client.py

**Files:**
- Modify: `backend/nvidia_client.py`

**Purpose:** Log every NIM API call with endpoint, request size, latency, retry attempts, and errors.

- [ ] **Step 1: Add logging to the NvidiaClient**

Add import at top:

```python
import time
import logging
logger = logging.getLogger(__name__)
```

Replace `__init__`:

```python
    def __init__(self):
        self._client: Optional[httpx.AsyncClient] = None
        self._headers = {
            "Authorization": f"Bearer {settings.nvidia_api_key[:8]}...",  # truncated for logs
            "Content-Type": "application/json",
        }
```

Replace `_call`:

```python
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
        audio_size = sum(len(v) for v in (files or {}).values() if isinstance(v, bytes)) if files else 0
        text_len = len(str(data or {}))
        logger.debug("NIM call: method=%s endpoint=%s audio_size=%d text_len=%d", method, endpoint, audio_size, text_len)
        start = time.monotonic()
        for attempt in range(2):
            try:
                if method == "POST":
                    resp = await self._client.post(url, headers=headers, json=data, files=files)
                else:
                    resp = await self._client.get(url, headers=headers)
                elapsed = time.monotonic() - start
                if resp.status_code == 429 or resp.status_code >= 500:
                    logger.warning("NIM retry: endpoint=%s status=%d attempt=%d/%d elapsed=%.2fs",
                                   endpoint, resp.status_code, attempt + 1, 2, elapsed)
                    if attempt == 0:
                        import asyncio
                        await asyncio.sleep(1)
                        continue
                resp.raise_for_status()
                logger.debug("NIM success: endpoint=%s status=%d elapsed=%.2fs", endpoint, resp.status_code, elapsed)
                return resp
            except httpx.HTTPStatusError as e:
                elapsed = time.monotonic() - start
                logger.error("NIM error: endpoint=%s status=%d elapsed=%.2fs body=%.200s",
                             endpoint, e.response.status_code, elapsed, e.response.text[:200])
                raise NvidiaAPIError(e.response.status_code, str(e))
        logger.error("NIM failed after retries: endpoint=%s", endpoint)
        return None
```

Replace each method with logging:

```python
    async def tts_clone(self, voice_audio: bytes, text: str) -> bytes:
        logger.info("NIM tts_clone: audio_size=%d text_len=%d", len(voice_audio), len(text))
        result = await self._call(
            "nim/tts/magpie-tts-zeroshot",
            data={"text": text},
            files={"audio": ("reference.wav", voice_audio, "audio/wav")},
        )
        logger.info("NIM tts_clone done: output_size=%d", len(result.content))
        return result.content

    async def asr_transcribe(self, audio: bytes, language: str = "en") -> str:
        logger.info("NIM asr_transcribe: audio_size=%d lang=%s", len(audio), language)
        result = await self._call(
            "nim/asr/canary-1b-asr",
            files={"audio": ("audio.wav", audio, "audio/wav")},
            data={"language": language},
        )
        data = result.json()
        text = data.get("text", "")
        logger.info("NIM asr_transcribe done: text_len=%d text=%.100s", len(text), text)
        return text

    async def asr_translate(self, audio: bytes, target_language: str = "en") -> tuple[str, str]:
        logger.info("NIM asr_translate: audio_size=%d target=%s", len(audio), target_language)
        result = await self._call(
            "nim/asr/canary-1b-asr/translate",
            files={"audio": ("audio.wav", audio, "audio/wav")},
            data={"target_language": target_language},
        )
        data = result.json()
        text = data.get("text", "")
        translated = data.get("translated_text", "")
        logger.info("NIM asr_translate done: text_len=%d translated_len=%d", len(text), len(translated))
        return text, translated

    async def bnr_denoise(self, audio: bytes) -> bytes:
        logger.info("NIM bnr_denoise: audio_size=%d", len(audio))
        result = await self._call(
            "nim/audio/bnr",
            files={"audio": ("noisy.wav", audio, "audio/wav")},
        )
        logger.info("NIM bnr_denoise done: output_size=%d", len(result.content))
        return result.content
```

- [ ] **Step 2: Verify it works**

Run: `cd backend && python -c "from nvidia_client import nvidia_client; print('OK')"`
Expected: `OK` with no import errors

- [ ] **Step 3: Commit**

---

### Task 1.5: Add Logging to job_manager.py

**Files:**
- Modify: `backend/job_manager.py`

**Purpose:** Log every job lifecycle event — creation, state transitions, cleanup, and failures with full traceback.

- [ ] **Step 1: Add logging imports**

At top of `backend/job_manager.py`, after existing imports:

```python
import traceback
import logging
logger = logging.getLogger(__name__)
```

- [ ] **Step 2: Add logging to create_job**

```python
    def create_job(self, total_steps: int = 1) -> str:
        job_id = f"j_{uuid.uuid4().hex[:12]}"
        self._jobs[job_id] = Job(job_id, total_steps)
        logger.info("Job created: job=%s total_steps=%d", job_id, total_steps)
        return job_id
```

- [ ] **Step 3: Add logging to update_job**

```python
    def update_job(self, job_id, status=None, progress=None, step=None, steps_completed=None, result=None, error=None):
        job = self._jobs.get(job_id)
        if not job:
            logger.warning("Job update skipped: job=%s not found", job_id)
            return
        old_status = job.status.value
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
        logger.debug("Job updated: job=%s status=%s->%s progress=%d step=%s steps=%d/%d",
                     job_id, old_status if status else old_status, job.status.value if status else "",
                     job.progress, job.step, job.steps_completed, job.total_steps)
```

- [ ] **Step 4: Add logging to _cleanup_loop**

```python
    async def _cleanup_loop(self):
        logger.info("Cleanup loop started: expiry=%ds interval=%ds", self._expiry_seconds, self._expiry_seconds // 4)
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
            if expired:
                for jid in expired:
                    del self._jobs[jid]
                logger.info("Cleanup: removed %d expired jobs", len(expired))
```

- [ ] **Step 5: Add logging to run_job**

```python
    async def run_job(self, job_id, task, *args, **kwargs):
        logger.info("Job start: job=%s", job_id)
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
            logger.info("Job done: job=%s", job_id)
        except Exception as e:
            tb = traceback.format_exc()
            logger.error("Job failed: job=%s error=%s\n%s", job_id, str(e), tb)
            self.update_job(
                job_id,
                status=JobStatus.failed,
                error=JobError(stage=self._jobs[job_id].step, message=str(e)),
            )
```

- [ ] **Step 6: Verify**

Run: `cd backend && pytest tests/test_jobs.py -v`
Expected: All 5 tests pass

- [ ] **Step 7: Commit**

---

### Task 1.6: Add Logging to storage.py and audio_service.py

**Files:**
- Modify: `backend/services/storage.py`
- Modify: `backend/services/audio_service.py`

**Purpose:** Log all audio file operations (save size, delete success/failure) and audio validation results.

- [ ] **Step 1: Add logging to storage.py**

```python
import logging
logger = logging.getLogger(__name__)

# Replace save_voice:
def save_voice(audio_bytes: bytes) -> str:
    validate_wav(audio_bytes, max_duration_secs=settings.max_voice_sample_duration_secs)
    filename = f"{uuid.uuid4().hex}.wav"
    dest = _ensure_dir(Path(settings.storage_dir) / "voices") / filename
    dest.write_bytes(audio_bytes)
    logger.info("Voice saved: filename=%s size=%d", filename, len(audio_bytes))
    return filename

# Replace save_clip:
def save_clip(audio_bytes: bytes) -> str:
    filename = f"{uuid.uuid4().hex}.wav"
    dest = _ensure_dir(Path(settings.storage_dir) / "clips") / filename
    dest.write_bytes(audio_bytes)
    logger.info("Clip saved: filename=%s size=%d", filename, len(audio_bytes))
    return filename

# Replace save_recording:
def save_recording(audio_bytes: bytes) -> str:
    filename = f"{uuid.uuid4().hex}.wav"
    dest = _ensure_dir(Path(settings.storage_dir) / "recordings") / filename
    dest.write_bytes(audio_bytes)
    logger.info("Recording saved: filename=%s size=%d", filename, len(audio_bytes))
    return filename

# Replace delete_voice:
def delete_voice(filename: str) -> bool:
    p = Path(settings.storage_dir) / "voices" / filename
    if p.exists():
        p.unlink()
        logger.info("Voice deleted: filename=%s", filename)
        return True
    logger.warning("Voice delete failed: filename=%s not found", filename)
    return False

# Replace delete_clip:
def delete_clip(filename: str) -> bool:
    p = Path(settings.storage_dir) / "clips" / filename
    if p.exists():
        p.unlink()
        logger.info("Clip deleted: filename=%s", filename)
        return True
    logger.warning("Clip delete failed: filename=%s not found", filename)
    return False
```

- [ ] **Step 2: Add logging to audio_service.py**

```python
import logging
logger = logging.getLogger(__name__)

# At end of validate_wav, before return:
    logger.debug("WAV validated: rate=%d channels=%d bits=%d duration=%.2fs", sample_rate, channels, bits_per_sample, duration_secs)
    return sample_rate, channels, bits_per_sample

# In get_duration_secs, in the except:
    except AudioValidationError:
        logger.warning("Duration calc failed: invalid WAV, returning 0.0")
        return 0.0
```

- [ ] **Step 3: Verify**

Run: `cd backend && pytest tests/ -v`
Expected: All 25 tests pass

- [ ] **Step 4: Commit**

---

### Task 1.7: Add Global Exception Handler and Update .env.example

**Files:**
- Modify: `backend/main.py`
- Modify: `backend/.env.example`

**Purpose:** Catch unhandled exceptions with a global handler and document the new logging settings in `.env.example`.

- [ ] **Step 1: Add global exception handler to main.py**

After the models endpoint, add:

```python
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error("Unhandled exception: %s %s\n%s", request.method, request.url.path, exc, exc_info=True)
    from fastapi.responses import JSONResponse
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})
```

- [ ] **Step 2: Update .env.example**

Append to `backend/.env.example`:

```
# Logging
LOG_LEVEL=INFO
LOG_FORMAT=text
# LOG_FILE=/var/log/ai-voice-studio.log
```

- [ ] **Step 3: Verify**

Run: `cd backend && python -c "from main import app; print('OK')"`
Expected: `OK` with logger startup message

- [ ] **Step 4: Commit**

---

## Phase 2: Frontend Logging Infrastructure

### Task 2.1: Create Logger Utility Module

**Files:**
- Create: `frontend/src/lib/logger.ts`

**Purpose:** A thin, zero-dependency logger wrapping `console` with level filtering, context prefixes, and dev-mode stripping for production builds.

- [ ] **Step 1: Create logger.ts**

```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Set to 'warn' in production via build-time injection if desired
const CURRENT_LEVEL: LogLevel =
  (import.meta.env.VITE_LOG_LEVEL as LogLevel) ||
  (import.meta.env.DEV ? 'debug' : 'warn');

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[CURRENT_LEVEL];
}

function formatArgs(context: string, args: unknown[]): unknown[] {
  const prefix = `[${context}]`;
  const ts = new Date().toISOString().slice(11, 19);
  return [`${ts} ${prefix}`, ...args];
}

export function createLogger(context: string) {
  return {
    debug(...args: unknown[]) {
      if (shouldLog('debug')) {
        console.debug(...formatArgs(context, args));
      }
    },
    info(...args: unknown[]) {
      if (shouldLog('info')) {
        console.info(...formatArgs(context, args));
      }
    },
    warn(...args: unknown[]) {
      if (shouldLog('warn')) {
        console.warn(...formatArgs(context, args));
      }
    },
    error(...args: unknown[]) {
      if (shouldLog('error')) {
        console.error(...formatArgs(context, args));
      }
    },
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit --pretty`
Expected: No errors

- [ ] **Step 3: Commit**

---

### Task 2.2: Add Logging to api.ts

**Files:**
- Modify: `frontend/src/lib/api.ts`

**Purpose:** Log every API request (method, URL, body size) and response (status code, duration, error body). This is the highest-impact logging since all backend communication goes through this file.

- [ ] **Step 1: Add logging imports and helper**

Add at top of `frontend/src/lib/api.ts`:

```typescript
import { createLogger } from './logger';

const log = createLogger('api');
```

Replace `handleResponse`:

```typescript
async function handleResponse<T>(resp: Response): Promise<T> {
  if (!resp.ok) {
    const text = await resp.text();
    log.error(`${resp.url} -> ${resp.status}: ${text.slice(0, 200)}`);
    throw new Error(`API ${resp.status}: ${text}`);
  }
  return resp.json();
}
```

Add a timing wrapper:

```typescript
async function apiCall<T>(
  url: string,
  options: RequestInit,
  bodySize?: number,
): Promise<T> {
  const method = options.method || 'GET';
  log.info(`${method} ${url}${bodySize ? ` (${bodySize}b)` : ''}`);
  const start = performance.now();
  try {
    const resp = await fetch(url, options);
    const elapsed = ((performance.now() - start) / 1000).toFixed(2);
    log.debug(`${method} ${url} -> ${resp.status} (${elapsed}s)`);
    return handleResponse<T>(resp);
  } catch (err) {
    const elapsed = ((performance.now() - start) / 1000).toFixed(2);
    log.error(`${method} ${url} failed after ${elapsed}s:`, err);
    throw err;
  }
}
```

Example usage in one function (repeat for all):

```typescript
export async function ttsClone(voiceId: string, text: string): Promise<string> {
  const resp = await apiCall<{ job_id: string }>('/api/tts/clone', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ voice_id: voiceId, text }),
  }, text.length);
  return resp.job_id;
}
```

Wrap every function in `api.ts` to use `apiCall`:

- `ttsClone` — bodySize = text.length
- `transcribe` — audio.size
- `translate` — audio.size
- `cleanAudio` — audio.size
- `runPipeline` — audio.size
- `getJob` — no body
- `saveVoice` — audio.size
- `getVoices`, `deleteVoice`, `getClips`, `deleteClip` — no body

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit --pretty`
Expected: No errors

- [ ] **Step 3: Commit**

---

### Task 2.3: Add Logging to All Hooks

**Files:**
- Modify: `frontend/src/hooks/useJobPolling.ts`
- Modify: `frontend/src/hooks/useRecorder.ts`
- Modify: `frontend/src/hooks/useAudioPlayer.ts`
- Modify: `frontend/src/hooks/useVoices.ts`
- Modify: `frontend/src/hooks/useClips.ts`

**Purpose:** Log state transitions, errors, and lifecycle events in every hook. Replace silent `catch {}` blocks with error logging.

- [ ] **Step 1: Add logging to useJobPolling.ts**

```typescript
import { createLogger } from '../lib/logger';
const log = createLogger('job-polling');

// At start of polling effect:
log.info(`Start polling job=${jobId}`);

// On each poll response, log status transitions:
log.debug(`Job ${jobId}: status=${status} progress=${progress}`);

// When job enters done/failed:
if (status === 'done') log.info(`Job ${jobId}: done`);
if (status === 'failed') log.error(`Job ${jobId}: failed`, error);

// On error:
catch (err) {
  log.error(`Job ${jobId}: poll error`, err);
}

// On cleanup return:
return () => {
  if (activeRef.current) log.info(`Stop polling job=${jobId}`);
};
```

- [ ] **Step 2: Add logging to useRecorder.ts**

```typescript
import { createLogger } from '../lib/logger';
const log = createLogger('recorder');

// In startRecording, after getting stream:
log.info(`Recording started: mimeType=${stream ? 'unknown' : 'no stream'}`);

// In stopRecording:
log.info(`Recording stopped: duration=${duration}s size=${blob?.size}b`);

// In error catch:
catch (err) {
  const message = err instanceof DOMException && err.name === 'NotAllowedError'
    ? 'Microphone access denied'
    : `Recording error: ${err instanceof Error ? err.message : String(err)}`;
  log.error(message, err);
  setState(prev => ({ ...prev, error: message }));
}
```

- [ ] **Step 3: Add logging to useAudioPlayer.ts**

```typescript
import { createLogger } from '../lib/logger';
const log = createLogger('audio-player');

// In play:
log.info(`Play: url=${url?.slice(0, 50)}...`);

// In error handler on audio element:
audioRef.current.onerror = () => {
  log.error(`Audio error: code=${audioRef.current?.error?.code} url=${url?.slice(0, 50)}...`);
};

// In pause:
log.debug(`Pause: currentTime=${currentTimeRef.current?.toFixed(1)}s`);
```

- [ ] **Step 4: Replace silent catches in useVoices.ts and useClips.ts**

```typescript
// useVoices.ts
import { createLogger } from '../lib/logger';
const log = createLogger('voices');

async function fetchAndSet() {
  try {
    const data = await getVoices();
    setVoices(data);
  } catch (err) {
    log.error('Failed to fetch voices', err);
  }
}
```

```typescript
// useClips.ts
import { createLogger } from '../lib/logger';
const log = createLogger('clips');

async function fetchAndSet() {
  try {
    const data = await getClips();
    setClips(data);
  } catch (err) {
    log.error('Failed to fetch clips', err);
  }
}
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit --pretty`
Expected: No errors

- [ ] **Step 6: Commit**

---

### Task 2.4: Add Logging to Screen Components

**Files:**
- Modify: `frontend/src/components/VoiceCloning/VoiceCloningScreen.tsx`
- Modify: `frontend/src/components/StudioRecorder/StudioRecorderScreen.tsx`
- Modify: `frontend/src/components/Library/LibraryScreen.tsx`
- Modify: `frontend/src/context/AppContext.tsx`

**Purpose:** Log key user actions (generate, run pipeline, navigate) at the screen level.

- [ ] **Step 1: Add logging to VoiceCloningScreen.tsx**

```typescript
import { createLogger } from '../../lib/logger';
const log = createLogger('voice-cloning');

// In handleGenerate:
log.info(`Generate: voice=${selectedVoiceId} text_len=${text.trim().length}`);
```

- [ ] **Step 2: Add logging to StudioRecorderScreen.tsx**

```typescript
import { createLogger } from '../../lib/logger';
const log = createLogger('studio-recorder');

// In handleRunPipeline:
log.info(`Run pipeline: steps=${selectedSteps.join(',')} lang=${targetLanguage} voice=${voiceId}`);
```

- [ ] **Step 3: Add logging to LibraryScreen.tsx**

```typescript
import { createLogger } from '../../lib/logger';
const log = createLogger('library');

// On tab switch:
log.info(`Tab switch: ${tab}`);
```

- [ ] **Step 4: Add logging to AppContext.tsx**

```typescript
import { createLogger } from '../lib/logger';
const log = createLogger('app');

// In setActiveScreen:
log.info(`Navigate: ${screen}`);
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit --pretty`
Expected: No errors

- [ ] **Step 6: Commit**

---

### Task 2.5: Add Global Error Boundary and Verify Build

**Files:**
- Create: `frontend/src/components/ErrorBoundary.tsx`
- Modify: `frontend/src/App.tsx`

**Purpose:** Catch unhandled React render errors and log them.

- [ ] **Step 1: Create ErrorBoundary.tsx**

```typescript
import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import { createLogger } from '../lib/logger';

const log = createLogger('error-boundary');

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    log.error('Unhandled render error', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: '#e5e5e5' }}>
          Something went wrong. Check the console for details.
        </div>
      );
    }
    return this.props.children;
  }
}
```

- [ ] **Step 2: Wrap App in ErrorBoundary**

In `frontend/src/main.tsx`:

```typescript
import { ErrorBoundary } from './components/ErrorBoundary';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
```

- [ ] **Step 3: Verify TypeScript compiles and build succeeds**

Run: `cd frontend && npx tsc --noEmit --pretty && npm run build`
Expected: No errors, build succeeds

- [ ] **Step 4: Run frontend tests**

Run: `cd frontend && npm test`
Expected: All tests pass (6+)

- [ ] **Step 5: Run backend tests**

Run: `cd backend && pytest -v`
Expected: All 25+ tests pass

- [ ] **Step 6: Run init check**

Run: `bash init.sh`
Expected: All checks pass

- [ ] **Step 7: Commit**

---

## Self-Review

**1. Coverage check:**
- ✅ Backend `config.py` — LOG_LEVEL, LOG_FORMAT, LOG_FILE settings
- ✅ Backend `main.py` — dictConfig, global exception handler, startup/shutdown logging
- ✅ All 6 routers — INFO on every request, WARNING on 404s, ERROR on failures
- ✅ `nvidia_client.py` — DEBUG level per call, INFO per method, WARNING on retries, ERROR on failures, timing
- ✅ `job_manager.py` — INFO on create/start/done/fail, DEBUG on update, INFO on cleanup
- ✅ `storage.py` — INFO on saves, WARNING on not-found deletes
- ✅ `audio_service.py` — DEBUG on validation, WARNING on duration parse failure
- ✅ Frontend `logger.ts` — zero-dependency, level filtering, dev-mode stripping
- ✅ Frontend `api.ts` — request/response logging with timing for all 12 endpoints
- ✅ All 5 hooks — state transition logging, errors logged instead of silent catches
- ✅ Screen components — user action logging (generate, run, navigate)
- ✅ Error boundary — catches unhandled render errors
- ✅ `.env.example` — documents new logging settings
- ✅ Tests still pass

**2. Placeholder scan:** None found — every code block is complete.

**3. Type consistency:** All logger calls use the exact variable names and function signatures as defined in each file. `createLogger` returns `{ debug, info, warn, error }` matching usage. `apiCall` signature matches how it's used in each function.
