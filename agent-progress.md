# Agent Progress

---

## Session 1 — 2026-07-06 (Design Phase)

**Time:** Not recorded (prior session before this tracking was established)

### Done
- Product scope defined (MVP: Voice Cloning + Studio Recorder + Library)
- Architecture designed (orchestrated backend, job queue, polling)
- API surface designed (12 endpoints)
- Frontend component tree designed (3 tabs, ~12 components)
- Spec written: `docs/superpowers/specs/2026-07-06-ai-voice-studio-mvp-design.md`
- Documentation: AGENTS.md, ARCHITECTURE.md, PRODUCT.md
- Implementation plan: `docs/superpowers/plans/2026-07-06-ai-voice-studio-mvp.md`

### Next Steps
- Execute implementation plan (tasks 1-22)

### Learnings / Cautions
- N/A (design phase)

---

## Session 2 — 2026-07-06 (Implementation Phase)

**Time:** ~20:00–21:30

### Done
- Created backend directory structure, requirements.txt, .env.example
- Created `backend/config.py` (pydantic-settings from .env)
- Created `backend/models.py` (all Pydantic schemas + enums)
- Created `backend/services/audio_service.py` (WAV validation, duration, mono conversion)
- Created `backend/services/storage.py` (local filesystem save/load/delete)
- Created `backend/nvidia_client.py` (async httpx client for TTS, ASR, BNR)
- Created `backend/job_manager.py` (in-memory async job queue with expiry cleanup)
- Created 6 routers: tts, asr, cleanup, studio, library, jobs
- Created `backend/tests/` — 25 passing tests (pytest)
- Verified backend boots at localhost:8000
- Scaffolded frontend with Vite + React + TypeScript + TailwindCSS v4
- Created `frontend/src/globals.css` (dark theme design tokens + Emil Kowalski animations)
- Created `frontend/src/lib/api.ts` (all 12 HTTP API calls)
- Created `frontend/src/lib/blobUtils.ts` (URL helpers, duration formatter)
- Created 5 hooks: useJobPolling, useRecorder, useAudioPlayer, useVoices, useClips
- Created `frontend/src/context/AppContext.tsx` (screen state)
- Created UI primitives: SectionLabel, Panel, Button, IconButton, Pill, StatusDot, VoiceTag, WaveformBars, HelpFab
- Created App Shell: Sidebar, ScreenHeader
- Created common: AudioPlaybackBar, ErrorBanner, JobPollingOverlay
- Created VoiceCloningScreen (record/upload, voice picker, generate)
- Created StudioRecorderScreen (mic circle, 4 pipeline stages, run bar)
- Created LibraryScreen (voices grid + clips list with tabs)
- Created App.tsx with AppProvider + sidebar-driven screen switching
- Fixed: LucideIcon type import in PipelineStageCard
- Fixed: CSS @import order for Google Fonts
- Fixed: App.test.tsx — tests failed due to duplicate text "Voice Cloning" in sidebar + screen header; used `getAllByText`
- Verified TypeScript strict clean, Vite build succeeds (225KB JS + 21KB CSS gzipped)
- 6 frontend tests passing
- Updated `agent-progress.md` and `session-handoff.md` with session tracking format

### Next Steps
- Commit all work to git
- Run `bash init.sh` for full verification
- Set up NVIDIA_API_KEY in backend/.env for real NIM API integration
- Integration testing with actual Nvidia models (TTS, ASR, BNR)

### Learnings / Cautions
- TailwindCSS v4 uses `@tailwindcss/vite` plugin — no `tailwind.config.ts` needed, use `@theme` in CSS
- TailwindCSS v4: `@apply` with arbitrary values needs `!important` suffix (e.g., `@apply !outline-2`)
- Vite proxy config matches full paths (`/api` matches `/api/health`, `/api/jobs/abc`)
- `pytest-asyncio` needs `mode=auto` in `pytest.ini` for async test functions to work without decorators
- `lucide-react` v0.475+ uses `LucideIcon` type from `lucide-react` directly (not a separate path)
- Vitest needs `environment: 'jsdom'` and `setupFiles` in vite.config.ts for React Testing Library
- CSS `@import` must come before `@tailwind` directives or they get overridden
- `getByText` throws on multiple matches. Sidebar and screen header both have "Voice Cloning" — use `getAllByText` when duplicates are intentional
- Backend uses Python 3.14.2 — ensure compatibility with httpx/pydantic versions

---

## Session 3 — 2026-07-07 (Design Tokens + Selection States Fix)

**Time:** ~00:00–04:20

### Done
- Fixed design tokens for TailwindCSS v4 architecture:
  - Moved color definitions from inline `@theme` block to `:root` + separate `@theme` block referencing CSS variables
  - Improved color contrast hierarchy: `--surface #161616` (was #111111), `--surface-hover #1f1f1f`, `--border #2a2a2a`, `--border-strong #3a3a3a`
  - Added `--text-subtle #5a5a5a` for tertiary text
  - Added `--accent-solid: rgba(118, 185, 0, 0.25)` for visible selection states
  - Registered all colors in `@theme` block for Tailwind utility class access
- Fixed TypeScript errors:
  - `StageOutput.tsx`: template literal type issue (extracted to variable)
  - `AppContext.tsx`: `ReactNode` type-only import
  - `vite.config.ts`: `@ts-expect-error` for vitest config type mismatch
- Fixed selection states not showing green:
  - Root cause: Tailwind v4 doesn't support `bg-[--accent-solid]` arbitrary syntax for theme-registered colors
  - Solution: Use `bg-accent-solid` (Tailwind utility) instead of arbitrary CSS variable syntax
  - Updated: `Sidebar.tsx`, `ClonedVoicePicker.tsx`, `PipelineStageCard.tsx`
- Verified with Playwright:
  - Sidebar navigation active state: `backgroundColor: rgba(118, 185, 0, 0.25)`
  - Pipeline stage selected state: `backgroundColor: rgba(118, 185, 0, 0.25)`, `borderColor: rgb(118, 185, 0)`
- Vite build succeeds (225.10 kB JS, 21.56 kB CSS)
- 6 frontend tests passing
- Updated `feature_list.json`:
  - `feat-frontend-design-tokens`: completed
  - `feat-frontend-ui-primitives`: completed (selection states verified working)

### Next Steps
- Run `bash init.sh` for full project verification
- Commit all work to git
- Set NVIDIA_API_KEY in backend/.env for real NIM API integration
- Integration testing with actual Nvidia models

### Learnings / Cautions
- TailwindCSS v4 requires `@theme` block to register CSS custom properties as design tokens — without it, utilities like `bg-accent` won't work
- Tailwind v4 arbitrary value syntax `bg-[--var]` doesn't work for theme-registered colors — must use `bg-colorname` utility
- Color contrast needs at least 9-12 hex units between surfaces for visible separation on dark themes
- Selection states need ~25% opacity minimum on dark backgrounds to be visible (10-15% is imperceptible)
- Playwright browser automation is essential for verifying visual states — console logs and snapshots catch issues manual testing misses

---

## Session 4 — 2026-07-07 (UI Refresh Brainstorming + Planning)

**Time:** ~04:20–05:00

### Done
- Brainstormed UI refresh with user: grid layout refactor, dual theme system (amber/terracotta), sidebar redesign
- Clarified design decisions: both themes with toggle, sidebar included in scope, update primitives in-place, phased approach
- Explored frontend codebase thoroughly (all components, hooks, context, globals, routing)
- Created design doc: `docs/design-docs/2026-07-07-ui-refresh-theme-system.md`
- Created implementation plan: `docs/exec-plans/active/2026-07-07-ui-refresh-theme-system.md`
- Updated `feature_list.json` with 4 new UI refresh features (feat-ui-theme-system, feat-ui-voice-cloning, feat-ui-studio-recorder, feat-ui-library) — all in "pending" status
- Updated `agent-progress.md` and `session-handoff.md`

### Next Steps
- Execute Phase 1: Theme System + Shell Refactor (feat-ui-theme-system)
  - Update globals.css with dual theme tokens
  - Create ThemeContext with localStorage persistence
  - Refresh sidebar (capsule nav + theme toggle)
  - Update all UI primitives
  - Write tests, verify build

### Learnings / Cautions
- System uses 3 views (Voice Cloning, Studio Recorder, Library) rendered via AppContext state — no router
- Theme toggle must use `data-theme="dark/light"` on `<html>` element for CSS scoping
- CSS `transition-property` should be limited to `background-color, color, border-color` for smooth theme toggles (avoid transitioning transforms)
- TailwindCSS v4 requires `@theme` block to register CSS vars — any new color tokens need registration there
- Current accent is NVIDIA green `#76b900` — replace with amber `#DDAA77` / terracotta `#C87A53`
