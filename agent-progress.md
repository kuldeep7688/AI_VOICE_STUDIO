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

---

## Session 5 — 2026-07-18 (Stitch Studio UI Implementation)

**Time:** ~01:45–02:00

### Done
- Implemented **Stitch Studio UI** 7-phase implementation plan:
  - **Phase 1:** Design System Foundation — dual-theme `globals.css` (dark: navy/green accents; light: white/lavender), `@theme` block with all tokens, `[data-theme]` CSS variables, glass-panel utilities, theme transition. `index.html` with Material Symbols CDN + theme-preservation inline script. `ThemeContext.tsx` with localStorage persistence. Removed `lucide-react`, created `Icon.tsx` (Material Symbols wrapper), updated 11 source files
  - **Phase 2:** Layout Shell — `Sidebar.tsx` (256px w-64, brand + "AI Voice Studio" + "Pro Audio Engine", New Project button, nav items Studio/Cloning/Library with active state, Status/Help footer with theme toggle). `TopAppBar.tsx` (sticky h-16 with backdrop-blur, search bar, notification/settings/avatar). `AppFooter.tsx` (fixed bottom left-64, engine version v2.4.0, pulse status dot, API Docs/Support). `App.tsx` with ThemeProvider + layout. `ScreenHeader.tsx` simplified (title + model pill only)
  - **Phase 3:** UI Primitives — `GlassPanel.tsx` (glassmorphism with backdrop-blur, optional onClick). `Button.tsx` (4 variants: primary, primary-container, secondary, ghost — all theme-aware). `SegmentedControl.tsx` (pill-shaped rounded-full tab switcher). `Knob.tsx` (DAW-style conic-gradient rotary control). `Pill.tsx` (rounded-full badge). Removed `HelpFab.tsx` from all screens
  - **Phase 4:** Voice Cloning Screen — 12-col grid: Create New Voice (7 cols) with Upload/Record two-card `VoiceSampleInput`, naming input + Save button. Technical Specs aside (5 cols) with audio visualization placeholder + Pro Workshop Tips panel. Full-width Test Voice Output with textarea + generate + custom `AudioPlayer` (seek bar with glow dot, transport controls, volume slider, Export button)
  - **Phase 5:** Studio Recorder Screen — Main canvas: Studio Toolbar (project name/sample rate/timer), waveform viewport with grid overlay + zoom. Transport controls glass panel (Stop/Record/Pause with labels). Live Transcription preview. Right sidebar (w-80): pipeline checkbox stages (Clean/Transcribe/Translate with language dropdown/Re-voice with voice dropdown), Sensitivity section with Gain+Comp Knobs, Run Pipeline button
  - **Phase 6:** Library Screen — `SegmentedControl` for Voices/Clips tabs. Voices grid: glass cards with waveform preview, play button, hover actions (play/delete), dashed "Clone New Voice" add card. Clips table in `GlassPanel` with Name/Duration/Created/Actions columns (play/download/delete). Empty states with "Go to Studio" buttons. Created `VoiceCard.tsx` and `ClipRow.tsx`
  - **Phase 7:** Tests & Verification — Updated `App.test.tsx` for new shell. Verified: `npx tsc --noEmit` clean, `npm run build` succeeds, 11 frontend tests pass, backend 25 tests pass, server boots and responds to health

### Next Steps
- Visual verification of Stitch Studio UI in browser (manual)
- Integration testing with NVIDIA_API_KEY for real NIM API calls
- Remove old `figma_design/` directory if it exists

### Learnings / Cautions
- TailwindCSS v4 uses CSS `@theme` block — no separate `tailwind.config.ts` needed
- Material Symbols replaced lucide-react across 11 files, 14 icon instances
- Theme transition on `<html>`: `transition: color 300ms ease-out, background-color 300ms ease-out`
- Backward-compatible CSS variable aliases (`--text`, `--accent`, `--border`) prevent breaking existing components during migration
- Glass panel pattern: `bg-white/[var(--glass-opacity)] backdrop-blur-xl border border-white/10`

---

## Session 6 — 2026-07-18 (Comprehensive Logging Implementation)

**Time:** ~09:50–10:02

### Done
- **Phase 1: Backend Logging Infrastructure (7 tasks)**
  - Added `LOG_LEVEL`, `LOG_FORMAT`, `LOG_FILE` settings to `config.py`
  - Configured root logger via `dictConfig` in `main.py` with text/JSON formatters, console + optional rotating file handler, suppressed uvicorn/httpx to WARNING, startup/shutdown messages
  - Added global error middleware in `main.py` catching unhandled exceptions with full stack traces
  - Added `logging.getLogger(__name__)` to all 6 routers (tts, asr, cleanup, studio, library, jobs) with INFO on request entry, WARNING on 404s, DEBUG on job poll
  - Added logging to `nvidia_client.py`: DEBUG `_call` with timing + retry warnings + error logs, INFO on all 4 method entry/exit with sizes
  - Added logging to `job_manager.py`: INFO create/start/done/fail, DEBUG update status transitions, INFO cleanup loop, ERROR with full traceback
  - Added logging to `storage.py` (INFO saves, WARNING deletes) and `audio_service.py` (DEBUG validation, WARNING duration parse)
  - Updated `.env.example` with LOG_LEVEL/LOG_FORMAT/LOG_FILE documentation
- **Phase 2: Frontend Logging Infrastructure (5 tasks)**
  - Created `frontend/src/lib/logger.ts`: zero-dependency `createLogger(context)` with level filtering, timestamp prefix, dev-mode debug/prod-mode warn
  - Wrapped all 12 api.ts functions with `apiCall<T>()` with request/response timing and error logging
  - Added `createLogger` to all 5 hooks (useJobPolling, useRecorder, useAudioPlayer, useVoices, useClips) — replaced silent catches with `log.error()`
  - Added `createLogger` to 3 screen components (VoiceCloningScreen, StudioRecorderScreen, LibraryScreen) and AppContext for user action logging
  - Created `ErrorBoundary.tsx` (class component, logs unhandled React render errors) and wrapped App in `main.tsx`
- **Verification:** 25 backend tests pass, 11 frontend tests pass, TypeScript clean, lint passes, Vite build succeeds (236KB JS + 34KB CSS)

### Next Steps
- Commit all logging work
- Run `bash init.sh` for full end-to-end check

### Learnings / Cautions
- FastAPI `on_event("shutdown")` is deprecated — should migrate to lifespan handlers in future cleanup
- `npx tsc -b` (build mode) is stricter than `npx tsc --noEmit` — caught unused `React` import in ErrorBoundary that `--noEmit` didn't
- With React 18+ JSX transform, `import React` is unnecessary for JSX — just import `Component`, `ReactNode`, `ErrorInfo`
- Backend logging via Python's `logging` module works seamlessly across routers/services without DI
- Frontend logger with `import.meta.env.DEV` auto-switches between debug (dev) and warn (prod) levels — Vite dead-code-eliminates debug calls in production build
