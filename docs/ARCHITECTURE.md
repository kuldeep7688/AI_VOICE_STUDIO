# ARCHITECTURE.md

## AI Voice Studio -- Architecture

### Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite + TailwindCSS)      │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐               │
│  │VoiceClone│  │StudioRecorder│  │ Library  │  Tab switcher  │
│  └────┬─────┘  └──────┬───────┘  └────┬─────┘               │
│       │               │               │                       │
│  ┌────┴───────────────┴───────────────┴────┐                  │
│  │           api.ts (fetch wrapper)         │  HTTP + poll   │
│  └────────────────────┬────────────────────┘                  │
└───────────────────────┼──────────────────────────────────────┘
                        │
┌───────────────────────┼──────────────────────────────────────┐
│              Backend (FastAPI + Uvicorn)                      │
│                       │                                       │
│  ┌────────────┐  ┌───┴────┐  ┌──────────┐  ┌──────────┐    │
│  │ router/tts │  │router/ │  │router/   │  │router/   │    │
│  │ /clone,etc │  │asr     │  │clean     │  │studio/lb │    │
│  └─────┬──────┘  └───┬────┘  └────┬─────┘  └────┬──────┘    │
│        └──────────────┼───────────┼─────────────┘           │
│                       │                                      │
│  ┌────────────────────┴─────────────────────────────┐       │
│  │              nvidia_client.py (httpx async)       │       │
│  └──────────────────────┬───────────────────────────┘       │
└─────────────────────────┼────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    [magpie-tts]    [canary-1b-asr]    [bnr]
    Nvidia NIM      Nvidia NIM        Nvidia NIM
```

### Backend Architecture

```
backend/
├── main.py              # FastAPI app, CORS, static files
├── config.py            # Settings (NVIDIA_API_KEY, API_BASE_URL)
├── models.py            # Pydantic schemas
├── nvidia_client.py     # Async NIM API client (httpx)
├── job_manager.py       # In-memory job queue
├── routers/
│   ├── tts.py           # POST /api/tts/clone
│   ├── asr.py           # POST /api/asr, /api/asr/translate
│   ├── cleanup.py       # POST /api/clean
│   ├── studio.py        # POST /api/studio/pipeline
│   ├── library.py       # GET/POST/DELETE /api/voices, /api/clips
│   └── jobs.py          # GET /api/jobs/:id
├── services/
│   ├── audio_service.py # WAV read/write, format validation
│   └── storage.py       # Local filesystem CRUD
└── uploads/
    ├── voices/          # Voice reference samples
    ├── clips/           # Generated audio
    └── recordings/      # Temp recordings
```

### API Design

All generative endpoints return a `job_id`. The client polls `GET /api/jobs/:id` for status.

**Job Response:**
```json
{
  "job_id": "j_abc123",
  "status": "processing",
  "progress": 60,
  "step": "transcribe",
  "steps_completed": 2,
  "total_steps": 4,
  "result": { "audio_url": null, "text": "Hello world", "translated_text": null },
  "error": null
}
```

**API Surface (12 endpoints):**

| Method | Path | Returns |
|--------|------|---------|
| POST | /api/tts/clone | { job_id } |
| POST | /api/asr | { job_id } |
| POST | /api/asr/translate | { job_id } |
| POST | /api/clean | { job_id } |
| POST | /api/studio/pipeline | { job_id } |
| GET | /api/jobs/{job_id} | Job status |
| GET | /api/voices | Voice[] |
| POST | /api/voices | { id, name } |
| DELETE | /api/voices/{id} | 204 |
| GET | /api/clips | Clip[] |
| DELETE | /api/clips/{id} | 204 |
| GET | /api/models | Model[] |

### Data Flow

**Voice Cloning:**
```
Record/Upload → Save voice (POST /api/voices) → Select voice → Type text
→ POST /api/tts/clone { voice_id, text } → Poll job → Play audio → Save clip
```

**Studio Pipeline:**
```
Record audio → Check stages (clean/transcribe/translate/revoice)
→ Select voice (if revoice) → POST /api/studio/pipeline
→ Poll job → View per-stage results → Play/save output
```

### Job System

- In-memory dict: `Map<job_id, JobState>`
- Jobs run as asyncio background tasks
- Auto-expire after 1 hour
- Cleanup task runs every 15 minutes
- Polling interval: 2 seconds from frontend

### Frontend Architecture

```
App.tsx
├── TopBar (title + theme toggle)
├── TabBar [Voice Cloning | Studio Recorder | Library]
└── [Active Tab]
    ├── VoiceCloningTab
    │   ├── VoiceSampleInput (upload/record + save)
    │   ├── VoiceSelector (saved voices dropdown)
    │   ├── TextInput (multi-line text)
    │   ├── GenerateButton
    │   └── AudioPlaybackBar (play/pause/seek)
    │
    ├── StudioRecorderTab
    │   ├── RecordControls (record/stop/timer)
    │   ├── WaveformViz (live waveform)
    │   ├── PipelineStages (checkboxes + voice selector)
    │   ├── StageOutput (per-stage results)
    │   └── AudioPlaybackBar
    │
    └── LibraryTab
        ├── [Voices | Clips] toggle
        ├── VoiceCard[] (play/rename/delete)
        └── ClipCard[] (play/download/delete)
```

**Hooks:**
- `useJobPolling(jobId)` -- polls /api/jobs/:id every 2s, returns { status, result, error }
- `useRecorder()` -- MediaRecorder API wrapper, returns { start, stop, audioBlob, isRecording }
- `useAudioPlayer(url)` -- Web Audio API, returns { play, pause, seek, duration, currentTime }

**State Management:**
- `AppContext` -- active tab, theme
- `JobContext` -- Map<jobId, JobStatus> with polling registry
- Tab-local state via useState/useReducer

### Error Handling

| Layer | Strategy |
|-------|----------|
| NIM API | nvidia_client.py wraps all calls, maps errors, retries on 429/503 |
| Jobs | status: "failed", error: { stage, message } |
| Files | WAV only, max 60s recordings, max 15s voice samples, 16MB upload limit |
| Frontend | api.ts handles all HTTP errors uniformly, ErrorBanner for display |

### NIM Models Used

| Model | Endpoint |
|-------|----------|
| magpie-tts-zeroshot | /api/tts/clone |
| canary-1b-asr | /api/asr, /api/asr/translate |
| bnr | /api/clean |
