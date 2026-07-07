# AGENTS.md

## Project: AI Voice Studio

A FastAPI + React app for exploring Nvidia's speech and audio models. Record, clone, clean, transcribe, translate, and re-voice audio content with a clean studio-style UI.

## Tech Stack

- **Backend:** FastAPI (Python 3.11+), httpx (async NIM API calls), Uvicorn
- **Frontend:** React 18 (Vite), TypeScript, TailwindCSS, Web Audio API, MediaRecorder API
- **Nvidia NIM Models:** magpie-tts-zeroshot, canary-1b-asr, bnr

## Commands

```bash
# Init check (verify project compiles, server boots)
bash init.sh

# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # add your NVIDIA_API_KEY
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev

# Backend tests
cd backend && pytest -v

# Frontend tests
cd frontend && npm test

# Type-check frontend
cd frontend && npx tsc --noEmit

# Lint
cd backend && ruff check .
cd frontend && npm run lint
```

## UI Design Principles (Emil Kowalski)

- **Button press feedback:** `transform: scale(0.97)` on `:active`, 160ms `ease-out` — every pressable element
- **Custom easing curves:** No built-in CSS easings. Use `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`, `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)`
- **Never animate from `scale(0)`** — start from `scale(0.95)` with `opacity: 0`
- **No animation on keyboard actions** — Space/play, R/record, Esc/stop trigger instantly
- **Hover animations** gated behind `@media (hover: hover) and (pointer: fine)`
- **UI animations < 300ms** — tooltips 125-200ms, dropdowns 150-250ms, modals 200-500ms
- **`prefers-reduced-motion`** — keep opacity/color transitions, remove transforms
- **Only animate `transform` and `opacity`** — never `padding`, `margin`, `height`, `width`
- **Popovers scale from trigger** via `transform-origin: var(--radix-popover-content-transform-origin)`
- **Stagger list entries** with 30-80ms delay between items, `translateY(8px)` + `opacity`
- **Exit faster than enter** — asymmetric timing (e.g., enter 300ms, exit 150ms)

## Testing

- **Backend:** pytest + httpx.AsyncClient (ASGI transport, no real server needed). Tests in `backend/tests/`.
  - Unit tests for models, job_manager, audio_service, storage
  - Integration tests for all API endpoints using mocked `nvidia_client`
- **Frontend:** Vitest + React Testing Library. Tests in `frontend/tests/`.
  - Component tests rendering with jsdom
  - Hook tests for useJobPolling, useRecorder, useAudioPlayer
- **Coverage targets:** All 12 API endpoints tested, all components render-tested, all hooks cover happy + error paths
- **Mock strategy:** `nvidia_client.py` is the only external dependency — mock via FastAPI dependency override during tests

## Conventions

- **All API calls return job_ids** -- POST creates a job, GET /api/jobs/:id polls status
- **Backend routers** split by domain: tts, asr, cleanup, studio, library, jobs
- **One nvidia_client.py** -- single httpx async client for all NIM API calls
- **In-memory job queue** -- no Redis/Postgres for MVP
- **Audio files stored** in backend/uploads/{voices,clips,recordings}/
- **No authentication** -- single-user local studio
- **React Context only** -- no Redux/Zustand for state management
- **TailwindCSS dark theme default** -- studio aesthetic
- **TypeScript strict mode** for frontend

## Key Files

| File | Purpose |
|------|---------|
| `docs/superpowers/specs/2026-07-06-ai-voice-studio-mvp-design.md` | Approved design spec |
| `backend/main.py` | FastAPI app entry point |
| `backend/config.py` | Environment config (NVIDIA_API_KEY, etc.) |
| `backend/nvidia_client.py` | Async NIM API client |
| `backend/job_manager.py` | In-memory job queue |
| `frontend/src/lib/api.ts` | All HTTP calls to backend |
| `frontend/src/hooks/useJobPolling.ts` | Polls job status every 2s |
