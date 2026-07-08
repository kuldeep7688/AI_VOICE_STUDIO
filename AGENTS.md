# AGENTS.md

## Project

AI Voice Studio — A FastAPI + React app for exploring Nvidia's speech and audio models. Record, clone, clean, transcribe, translate, and re-voice audio content with a clean studio-style UI.

## Startup

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

## Rules

- Features implemented one at a time — complete each feature fully (code, tests, verification) before starting the next
- Only update `feature_list.json` status to "completed" after solid evidence (tests passing, server booting, build succeeding)
- Always update `agent-progress.md` and `session-handoff.md` at the end of every session
- Verification before completion — run verification commands before claiming work is done

## Project Context

| File | Purpose |
|------|---------|
| `docs/product-specs/index.md` | Product requirements and user flows |
| `docs/design-docs/architecture.md` | System architecture and API design |
| `docs/design-docs/core-beliefs.md` | Core design philosophy and principles |
| `docs/design-docs/ai-voice-studio-mvp-design.md` | Approved design spec (visual system, components) |
| `docs/exec-plans/completed/2026-07-06-ai-voice-studio-mvp.md` | Implementation plan |
| `docs/exec-plans/tech-debt-tracker.md` | Technical debt tracking |
| `docs/generated/db-schema.md` | Database/storage schema reference |
| `backend/main.py` | FastAPI app entry point |
| `backend/config.py` | Environment config (NVIDIA_API_KEY, etc.) |
| `backend/nvidia_client.py` | Async NIM API client |
| `backend/job_manager.py` | In-memory job queue |
| `frontend/src/lib/api.ts` | All HTTP calls to backend |
| `frontend/src/hooks/useJobPolling.ts` | Polls job status every 2s |
| `feature_list.json` | Feature tracking with status and evidence |
| `agent-progress.md` | Chronological session log |
| `session-handoff.md` | Previous session summary for handoff |

## Docs Hierarchy

```
docs/
├── design-docs/
│   ├── index.md
│   ├── core-beliefs.md
│   ├── architecture.md
│   └── ai-voice-studio-mvp-design.md
├── exec-plans/
│   ├── active/
│   │   └── 2026-07-06-comprehensive-logging.md
│   ├── completed/
│   │   ├── 2026-07-06-ai-voice-studio-mvp.md
│   └── tech-debt-tracker.md
├── generated/
│   └── db-schema.md
└── product-specs/
    ├── index.md
    └── new-user-onboarding.md
```

## Conventions

- **API:** All API calls return job_ids — POST creates a job, GET /api/jobs/:id polls status
- **Backend routers:** Split by domain: tts, asr, cleanup, studio, library, jobs
- **NIM client:** Single `nvidia_client.py` — one httpx async client for all NIM API calls
- **Job queue:** In-memory dict with asyncio background tasks, auto-expire after 1 hour
- **Storage:** Audio files in `backend/uploads/{voices,clips,recordings}/`
- **Auth:** No authentication — single-user local studio
- **State:** React Context only — no Redux/Zustand
- **Theme:** TailwindCSS dark theme default — studio aesthetic
- **TypeScript:** Strict mode for frontend
- **Polling:** 2-second interval for job status updates

## Definition of Done

A feature is complete only when:
- [ ] Code implemented following conventions
- [ ] Tests written and passing (backend pytest, frontend vitest)
- [ ] TypeScript compiles without errors (`npm run typecheck`)
- [ ] Lint passes (backend ruff, frontend eslint)
- [ ] Vite build succeeds
- [ ] Server boots successfully
- [ ] Evidence recorded in `feature_list.json`
- [ ] Session documented in `agent-progress.md` and `session-handoff.md`

## Session Handoff

- **`agent-progress.md`** — Chronological log of all sessions with:
  - Date and time range
  - Things done in the session
  - Next steps
  - Learnings / cautions
- **`session-handoff.md`** — Only the previous session's info (overwritten each session)
- Always update both files before ending a session

## Testing

**Backend:** pytest + httpx.AsyncClient (ASGI transport, no real server needed)
- Tests in `backend/tests/`
- Unit tests for models, job_manager, audio_service, storage
- Integration tests for all 12 API endpoints using mocked `nvidia_client`
- Mock via FastAPI dependency override

**Frontend:** Vitest + React Testing Library
- Tests in `frontend/tests/`
- Component tests rendering with jsdom
- Hook tests for useJobPolling, useRecorder, useAudioPlayer

**Coverage targets:**
- All 12 API endpoints tested
- All components render-tested
- All hooks cover happy + error paths

## Clean State

Before starting work:
```bash
# Verify environment
bash init.sh

# Check backend
cd backend && source venv/bin/activate && pytest -v

# Check frontend
cd frontend && npm test && npx tsc --noEmit && npm run build
```

Expected state:
- Backend venv active, all tests passing
- Frontend node_modules installed, TypeScript clean, build succeeds
- `backend/.env` contains valid `NVIDIA_API_KEY`
- No uncommitted git changes unless feature work in progress
