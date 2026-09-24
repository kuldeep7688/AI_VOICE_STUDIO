# AI Voice Studio

A FastAPI + React app for exploring Nvidia's speech and audio models. Record, clone, clean, transcribe, translate, and re-voice audio with a studio-style UI.

Single-user local app: no authentication, no database. Audio and metadata are stored on the local filesystem.

## Tech Stack

- **Backend**: FastAPI (Python 3.11+), gRPC calls to hosted Nvidia NIM functions via `nvidia-riva-client`, in-memory async job queue
- **Frontend**: React 19 + TypeScript (strict) on Vite, TailwindCSS v4, Web Audio API, MediaRecorder API
- **Testing / tooling**: pytest + httpx (backend), Vitest + React Testing Library (frontend), ruff, oxlint
- **Storage**: Local filesystem (`backend/uploads/`, `backend/data/`)

## Nvidia Models Used

| Model | Purpose |
|-------|---------|
| `magpie-tts-zeroshot` | Zero-shot voice cloning: speak any text in a sampled voice |
| `canary-1b-asr` | Speech-to-text and speech translation |
| `bnr` (Background Noise Removal) | Clean up noisy recordings |

NVCF function IDs for these models are looked up automatically at startup using your API key. You can also set them yourself in `.env`.

## Features

### Voice Cloning Workshop
- **Voice sample**: record from the microphone or upload a short WAV sample (up to about 15s)
- **Save voices**: name a sample and save it to the voice library
- **Generate**: type text and hear it spoken in the cloned voice (`magpie-tts-zeroshot`)

### Studio Recorder
Record from the browser microphone with a live waveform, then run any combination of these pipeline stages:
- **Clean**: remove background noise with BNR
- **Transcribe**: convert speech to text with Canary ASR
- **Translate**: translate the speech into English, French, Spanish, German, or Hindi
- **Re-voice**: speak the transcript (or translation) again in a saved cloned voice

Each stage shows its progress and output as the job runs.

### Asset Library
- Browse, play, and delete saved voices and generated clips

### UX
- Dark theme by default, with a light theme toggle
- Background jobs with progress polling (every 2s) and error banners

## How the API Works

Every processing endpoint is asynchronous. The `POST` request returns a `job_id` right away. Poll `GET /api/jobs/{job_id}` until `status` is `done` or `failed`. The finished job's `result` holds `audio_url`, `text`, and/or `translated_text`. Jobs expire after 1 hour.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/tts/clone` | Clone TTS: JSON `{voice_id, text}` → job |
| `POST` | `/api/asr` | Transcribe an audio file (multipart `audio`) → job |
| `POST` | `/api/asr/translate` | Transcribe + translate (`audio`, `target_language`: `en`/`fr`/`es`/`de`/`hi`) → job |
| `POST` | `/api/clean` | Background noise removal (`audio`) → job |
| `POST` | `/api/studio/pipeline` | Multi-step pipeline (`audio`, `steps`=`clean,transcribe,translate,revoice`, optional `target_language`, `voice_id`) → job |
| `GET` | `/api/jobs/{job_id}` | Poll job status, progress, result, and error |
| `GET` | `/api/voices` | List saved voices |
| `POST` | `/api/voices` | Save a voice sample (multipart `name`, `audio`) |
| `DELETE` | `/api/voices/{voice_id}` | Delete a voice |
| `GET` | `/api/clips` | List generated clips |
| `DELETE` | `/api/clips/{clip_id}` | Delete a clip |
| `GET` | `/api/models` | List models in use |
| `GET` | `/api/health` | Health check |
| `GET` | `/audio/{voices,clips,recordings}/...` | Serve stored audio files |

## Project Structure

```
ai-voice-studio/
├── backend/
│   ├── main.py              # FastAPI app, routers, static /audio mount, startup discovery
│   ├── config.py            # Settings loaded from .env
│   ├── nvidia_client.py     # gRPC client for NIM (ASR, TTS, BNR) + function-id discovery
│   ├── job_manager.py       # In-memory job queue with auto-expiry
│   ├── models.py            # Pydantic schemas
│   ├── routers/
│   │   ├── tts.py           # /tts/clone
│   │   ├── asr.py           # /asr, /asr/translate
│   │   ├── cleanup.py       # /clean
│   │   ├── studio.py        # /studio/pipeline
│   │   ├── library.py       # /voices, /clips
│   │   └── jobs.py          # /jobs/{id}
│   ├── services/
│   │   ├── audio_service.py # WAV parsing / duration helpers
│   │   └── storage.py       # File storage for voices and clips
│   ├── data/                # Voice/clip metadata JSON (generated)
│   ├── uploads/             # voices/, clips/, recordings/ (generated)
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── VoiceCloning/    # Sample input, voice picker, text input, generate
│   │   │   ├── StudioRecorder/  # Record controls, waveform, pipeline stages
│   │   │   ├── Library/         # Voice cards, clip rows
│   │   │   ├── common/          # Audio player, job polling overlay, error banner
│   │   │   └── ui/              # Design-system primitives (Button, Knob, Panel, ...)
│   │   ├── context/             # AppContext, ThemeContext
│   │   ├── hooks/               # useRecorder, useAudioPlayer, useJobPolling, useVoices, useClips
│   │   ├── lib/                 # api.ts (all backend calls), logger, blob utils
│   │   └── App.tsx
│   └── tests/
├── docs/                    # Product specs, design docs, exec plans
├── notebooks/               # NIM model exploration notebook
├── init.sh                  # Environment + build sanity check
└── README.md
```

## Setup

Requirements: Python 3.11+, Node 18+, and an [Nvidia API key](https://build.nvidia.com).

```bash
# Optional: check the whole environment (venv, deps, server boot, typecheck, build)
bash init.sh

# Backend (http://localhost:8000)
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # add your NVIDIA_API_KEY
uvicorn main:app --reload

# Frontend (http://localhost:5173, proxies /api and /audio to :8000)
cd frontend
npm install
npm run dev
```

### Configuration (`backend/.env`)

| Variable | Default | Notes |
|----------|---------|-------|
| `NVIDIA_API_KEY` | — | Required |
| `STORAGE_DIR` | `./uploads` | Where audio files are stored |
| `GRPC_SERVER` | `grpc.nvcf.nvidia.com:443` | NIM gRPC endpoint |
| `TTS_FUNCTION_ID` / `ASR_FUNCTION_ID` / `BNR_FUNCTION_ID` | auto-discovered | Set these to pin specific NVCF functions |
| `LOG_LEVEL` / `LOG_FORMAT` / `LOG_FILE` | `INFO` / `text` / — | Logging |

## Development

```bash
# Backend tests and lint
cd backend && pytest -v
cd backend && ruff check .

# Frontend tests, type-check, lint, build
cd frontend && npm test
cd frontend && npx tsc --noEmit
cd frontend && npm run lint
cd frontend && npm run build
```

## Roadmap / Ideas

These features are not built yet:

- Multilingual TTS with a language and voice picker (`magpie-tts-multilingual`, `chatterbox-multilingual-tts`)
- Real-time streaming ASR and push-to-talk voice chat over WebSocket (`nemotron-asr-streaming` + LLM + TTS)
- Lip-Sync Studio (`LipSync`): sync a speaking-face video to generated audio
- Waveform trim/crop editor, playlist, keyboard shortcuts
- Demo ideas: "self-voiced podcast" (record → clean → transcribe → edit → re-voice), a real-time translator that speaks in your own voice
