# AI Voice Studio MVP -- Design Spec

**Date:** 2026-07-06
**Status:** Approved

## Overview

A FastAPI + React app for exploring Nvidia's speech and audio models. The MVP covers Voice Cloning, Studio Recorder (full pipeline), and a Library for saved voices and clips. Deployed as a single-user local studio with no authentication.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Async handling | Polling (POST creates job, GET /jobs/:id polls) | Simple, no connection issues, works with 5-30s NIM latencies |
| File storage | Local filesystem under `backend/uploads/` | Simplest for MVP, no external infra |
| UI layout | Left sidebar navigation + main content region (single-page, screens swap in place) | Matches Figma reference, studio/pro-tool feel, room for persistent "MODELS ACTIVE" status footer |
| Auth | None (no login, no accounts) | Single-user MVP, keep it simple |
| Architecture | Orchestrated backend with job queue | Backend owns all business logic, frontend is thin UI |
| Voice sample input | Upload + Record (both options) | Maximum flexibility for users |
| Studio Recorder scope | Full pipeline (record -> clean -> transcribe -> translate -> re-voice) | Complete workflow experience |
| Library scope | Voices + Clips | Covers both cloning and studio workflows |

## Nvidia Models Used (MVP)

| Model | Purpose | Endpoint |
|-------|---------|----------|
| `magpie-tts-zeroshot` | Zero-shot voice cloning TTS | `/api/tts/clone` |
| `canary-1b-asr` | Speech-to-text + translation | `/api/asr`, `/api/asr/translate` |
| `bnr` | Background noise removal | `/api/clean` |

## System Architecture

```
Frontend (React + Vite + TailwindCSS)
  ├── Sidebar: brand + nav (Voice Cloning, Studio Recorder, Library) + Models Active footer
  ├── Main region: active screen renders here
  ├── api.ts: single HTTP fetch wrapper
  └── Hooks: useJobPolling, useRecorder, useAudioPlayer

Backend (FastAPI + Uvicorn)
  ├── Routers: tts, asr, cleanup, studio, library, jobs
  ├── nvidia_client.py: single httpx async client for all NIM APIs
  ├── job_manager.py: in-memory job queue (create/poll/cleanup)
  └── services/: audio_service.py, storage.py (local FS)
```

## Backend

### File Structure

```
backend/
├── main.py                  # FastAPI app, CORS, static files, router mounts
├── config.py                # Settings from env (NVIDIA_API_KEY, API_BASE_URL)
├── models.py                # Pydantic schemas: requests, responses, enums
├── nvidia_client.py         # Single httpx async client for all NIM API calls
├── job_manager.py           # In-memory job queue: create, poll, cleanup
├── routers/
│   ├── tts.py               # POST /tts/clone
│   ├── asr.py               # POST /asr, /asr/translate
│   ├── cleanup.py           # POST /clean
│   ├── studio.py            # POST /studio/pipeline
│   ├── library.py           # GET/POST/DELETE /voices, /clips
│   └── jobs.py              # GET /jobs/:id
├── services/
│   ├── audio_service.py     # WAV read/write, format conversion, duration validation
│   └── storage.py           # File save/load/delete on local filesystem
├── uploads/
│   ├── voices/              # Saved voice reference samples (.wav)
│   ├── clips/               # Generated TTS audio files (.wav)
│   └── recordings/          # Temporary raw recordings from frontend
└── requirements.txt
```

### API Surface

| Method | Path | Description | Returns |
|--------|------|-------------|---------|
| `POST` | `/api/tts/clone` | Zero-shot voice cloning TTS | `{ job_id }` |
| `POST` | `/api/asr` | Speech-to-text transcription | `{ job_id }` |
| `POST` | `/api/asr/translate` | ASR + translation | `{ job_id }` |
| `POST` | `/api/clean` | Background noise removal | `{ job_id }` |
| `POST` | `/api/studio/pipeline` | Full pipeline (steps array) | `{ job_id }` |
| `GET` | `/api/jobs/{job_id}` | Poll job status | `{ status, progress, result, error }` |
| `GET` | `/api/voices` | List saved voice samples | `[{ id, name, duration, created_at }]` |
| `POST` | `/api/voices` | Save a voice sample | `{ id, name }` |
| `DELETE` | `/api/voices/{id}` | Delete a voice sample | 204 |
| `GET` | `/api/clips` | List saved audio clips | `[{ id, name, duration, created_at }]` |
| `DELETE` | `/api/clips/{id}` | Delete a clip | 204 |
| `GET` | `/api/models` | List available NIM models | `[{ id, name, status }]` |

### Job System

```
POST /api/tts/clone { voice_id, text }
  -> Backend creates job, spawns async background task
  -> Returns: { job_id: "j_<uuid>" }

GET /api/jobs/j_<uuid>
  -> { job_id, status: "queued"|"processing"|"done"|"failed",
       progress: 0-100,
       step: "tts"|"clean"|"transcribe"|"translate"|"revoice"|null,
       steps_completed: int,
       total_steps: int,
       result: { audio_url, text, translated_text } | null,
       error: { stage, message } | null }
```

Jobs auto-expire after 1 hour. Background cleanup task runs every 15 minutes.

### Pipeline Flow

```
POST /api/studio/pipeline
{
  audio: <multipart WAV file>,
  steps: ["clean", "transcribe", "translate", "revoice"],
  target_language: "fr",       // optional
  voice_id: "v_xyz"            // optional
}

Steps execute sequentially:
  clean        -> BNR API     -> cleaned WAV audio_url
  transcribe   -> ASR API     -> text
  translate    -> ASR API     -> translated_text (if target_language set)
  revoice      -> TTS clone   -> revoiced audio_url (if voice_id set)

Each step expands the result object. Polling shows { step, steps_completed, total_steps }.
```

### Error Handling

| Error Source | Handling |
|-------------|----------|
| NIM API errors | `nvidia_client.py` wraps all calls, maps to `NvidiaAPIError(code, message)`. Retries once on 429/503. |
| Job failures | Job.status = "failed", error = { stage, message }. Stage identifies which step failed. |
| File validation | Audio must be WAV. Max 60s for recordings, max 15s for voice samples. 422 on invalid input. |
| Upload limits | 16MB max via FastAPI middleware. 413 on oversize. |

### Testing

- **Backend:** pytest + httpx.AsyncClient integration tests. Mock `nvidia_client.py` via FastAPI dependency override to avoid real NIM calls.
- **Frontend:** Vitest + React Testing Library component tests. MSW for API mocking.

## Visual Design System

**Source of truth:** `figma_design/*.png` — 4 approved screen mockups. All UI work must match these visually.

| Screen | Reference file |
|--------|----------------|
| Voice Cloning | `figma_design/voice_cloning_page.png` |
| Studio Recorder | `figma_design/studio_recorder_page.png` |
| Library (Voices tab) | `figma_design/library_page.png` |
| Library (Clips tab) | `figma_design/library_clips_page.png` |

### Design tokens (map to `tailwind.config.ts` + `globals.css`)

**Colors (dark theme, default and only theme for MVP):**

| Token | Value (approx.) | Usage |
|-------|-----------------|-------|
| `--bg` | `#0a0a0a` | App background |
| `--surface` | `#111111` | Cards, panels |
| `--surface-hover` | `#161616` | Card hover |
| `--border` | `#1f1f1f` | Card borders, dividers |
| `--border-strong` | `#2a2a2a` | Focus ring, active borders |
| `--text` | `#e5e5e5` | Body text |
| `--text-muted` | `#8a8a8a` | Metadata, labels |
| `--text-subtle` | `#5a5a5a` | Placeholder, disabled |
| `--accent` | `#76b900` | Nvidia green — active nav, primary buttons, brand |
| `--accent-hover` | `#88d000` | Primary button hover |
| `--accent-bg` | `rgba(118,185,0,0.10)` | Active nav row background, primary button ghost |
| `--voice-green` | `#76b900` | Voice color-coding (My Voice) |
| `--voice-blue` | `#4ea3ff` | Voice color-coding (Studio Male) |
| `--voice-purple` | `#a780ff` | Voice color-coding (British Female) |
| `--voice-orange` | `#e89040` | Voice color-coding (Narration Voice) |
| `--danger` | `#ef4444` | Errors, destructive actions |

**Typography:**

- `--font-sans`: `Inter, system-ui, -apple-system, sans-serif` — body, headings, buttons
- `--font-mono`: `"JetBrains Mono", "IBM Plex Mono", ui-monospace, monospace` — brand block, section labels, timestamps, model tags, character counts

**Section-label pattern** (used everywhere in Figma — `NVIDIA`, `MODELS ACTIVE`, `RECORDER`, `PIPELINE`, `SAMPLE INPUT`, `VOICE NAME`, `MODEL`, `CLONED VOICE`, `GENERATE SPEECH`):
```
font-family: var(--font-mono);
font-size: 11px;
letter-spacing: 0.14em;
text-transform: uppercase;
color: var(--text-muted);
```

**Spacing scale:** Tailwind default (4px base). Card padding 20–24px. Grid gap 16–20px. Sidebar width 220px.

**Radii:** 6px (buttons, inputs), 8px (cards, panels), 999px (pills, mic circle, status dots).

**Motion:** All easing curves and durations per AGENTS.md "UI Design Principles" section. Reproduced key rules:
- `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`
- `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)`
- Every pressable element: `transform: scale(0.97)` on `:active`, 160ms `ease-out`
- Only animate `transform` and `opacity`
- `prefers-reduced-motion`: keep color/opacity, drop transforms

### Layout shell

```
┌─────────────┬──────────────────────────────────────────────┐
│ Sidebar     │ Screen header (SCREEN_NAME + optional model  │
│ 220px       │ tag pill, top-right settings icon)           │
│             ├──────────────────────────────────────────────┤
│ Brand       │                                              │
│ Nav items   │ Screen body (scrollable if needed)           │
│             │                                              │
│ ┈┈┈┈┈┈┈┈┈┈┈ │                                              │
│ Models      │                                              │
│ Active      │                                              │
└─────────────┴──────────────────────────────────────────────┘
                                                       [ ? ] ← help FAB, bottom-right
```

**Sidebar contents:**
- Brand block (top): `NVIDIA` (mono, small, accent green) / `AI VOICE STUDIO` (sans, 15px, bold, white) / `v0.1 · MVP` (mono, 11px, muted)
- Nav items: icon + label, 40px row height, active row has `--accent-bg` background + left green bar (2px × full height) + green text; inactive has muted text, hover raises to `--text`
- Divider (thin border)
- Footer `MODELS ACTIVE` label + 3 rows: pulsing green dot + mono model name (`magpie-tts-zeroshot`, `canary-1b`, `bnr`)

**Screen header:** Mono uppercase title (`VOICE CLONING`, `STUDIO RECORDER`, `LIBRARY`) at 14px letter-spaced, optional adjacent green-tinted pill showing the model used for this screen (`magpie-tts-zeroshot`, `canary-1b · BNR`). Settings gear icon top-right.

### Per-screen specs

**Voice Cloning** (`voice_cloning_page.png`)
- Two-column layout inside a shared surface panel. Left column ~340px, right column fills.
- Left column: `SAMPLE INPUT` label + helper text + waveform placeholder box (140px tall, dashed border when empty, animated bars when populated) + `[Record]` primary button (accent green, mic icon) side-by-side with square upload icon button + `VOICE NAME` label + text input + `[Save Voice]` disabled-style button + `MODEL` label + pulsing green dot with `magpie-tts-zeroshot`.
- Right column: `GENERATE SPEECH` label + helper text + large multi-line textarea (~180px min height) + row of `X chars · Y words` (left, mono muted) and `~Ns estimated output` (right, mono muted) + `CLONED VOICE` label + 2×2 grid of voice picker cards (colored dot + name + duration on right; selected card has accent-green border + accent-bg fill) + full-width `[GENERATE]` primary button (accent green, wand icon, mono uppercase text).

**Studio Recorder** (`studio_recorder_page.png`)
- Full-width recorder card: `RECORDER` label + centered ~64px mic circle (accent-green ring, dark fill, mic icon) + `Click to start recording` caption below. Card is ~260px tall with dashed inner border area suggesting the recording surface.
- `PIPELINE` label with right-aligned `N stages active` count (mono muted).
- 4 stage cards in a horizontal row, chevron `>` separators between them. Each card: top-left small icon + top-right checkbox pill (filled green when selected) / `Clean` / `BNR` (model name mono muted). Selected cards have accent-green border, unselected have subtle border and muted text.
- Full-width `RUN PIPELINE` button (accent-green background, dark text, mono uppercase).

**Library — Voices tab** (`library_page.png`)
- Tab bar row: `Voices (4)` and `Clips (4)` tabs (active has green underline + green text), right-aligned `[+ Add]` outline button (green border, green plus, mono `Add`).
- 2-column grid of voice cards. Card: 2px left color-bar in voice color + `Voice Name` (16px semibold) + row `{duration}s · {date} · zero-shot` (mono muted) + colored waveform (16 bars, voice color, varying heights) + full-width `[▷ Play]` button (subtle surface, muted text).

**Library — Clips tab** (`library_clips_page.png`)
- Same tab row + Add button.
- Vertical list of clip rows (~72px tall). Each row: left-aligned square play button (subtle surface, play triangle) + text preview (16px, `Hello, this is my AI voice...`) + metadata row below: colored dot + voice name (mono) + `{duration}s` (mono) + timestamp (mono muted) + model name (mono muted).

### Shared primitives (build once, reuse across screens)

Place under `frontend/src/components/ui/`:

| Component | Purpose |
|-----------|---------|
| `Sidebar.tsx` | The 220px left rail (brand + nav + models active footer) |
| `ScreenHeader.tsx` | `SCREEN NAME` + optional model tag pill + settings icon |
| `SectionLabel.tsx` | Mono uppercase small-caps label with letter-spacing |
| `Panel.tsx` | Standard bordered surface card (radius 8, `--border`) |
| `Button.tsx` | Variants: `primary` (green), `secondary` (surface), `ghost`, `outline`. All get `:active` scale(0.97). |
| `IconButton.tsx` | Square icon-only button (used for upload, settings, help FAB) |
| `Pill.tsx` | Small mono uppercase tag (used for model name in screen header) |
| `StatusDot.tsx` | Colored circle, optional `pulse` prop |
| `VoiceTag.tsx` | `StatusDot` + mono voice name (used in clip rows, cloned-voice picker) |
| `WaveformBars.tsx` | Renders N vertical bars (props: `bars: number[]`, `color`). Static, no animation. |
| `PipelineStageCard.tsx` | Studio Recorder stage card (icon + title + model + checkbox) |
| `VoiceCard.tsx` | Library grid card |
| `ClipRow.tsx` | Library list row |
| `HelpFab.tsx` | Bottom-right `?` circular button |

### Icons

Use `lucide-react` throughout. Approximate mapping visible in Figma:
- Voice Cloning nav: `wand-2` (or `sparkles`)
- Studio Recorder nav: `radio` (or `mic`)
- Library nav: `library` (or `folder-audio`)
- Recorder mic circle: `mic`
- Pipeline stages: `zap` (clean), `activity` (transcribe), `languages` (translate), `wand-2` (re-voice)
- Settings gear: `settings`
- Play triangle: `play`
- Upload: `upload`
- Add: `plus`
- Help FAB: `help-circle`

## Frontend

### File Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── App.tsx                 # Root: Sidebar + main region with active screen
│   │   ├── Sidebar.tsx             # Brand + nav (Voice Cloning, Studio Recorder, Library) + Models Active footer
│   │   ├── ScreenHeader.tsx        # Screen title (mono) + optional model tag pill + settings icon
│   │   ├── ui/                     # Shared visual primitives (see Visual Design System > Shared primitives)
│   │   │   ├── SectionLabel.tsx
│   │   │   ├── Panel.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── IconButton.tsx
│   │   │   ├── Pill.tsx
│   │   │   ├── StatusDot.tsx
│   │   │   ├── VoiceTag.tsx
│   │   │   ├── WaveformBars.tsx
│   │   │   └── HelpFab.tsx
│   │   ├── VoiceCloning/
│   │   │   ├── VoiceCloningScreen.tsx # Orchestrates cloning workflow
│   │   │   ├── VoiceSampleInput.tsx  # Upload/Record sample + "Save to Library" button
│   │   │   ├── ClonedVoicePicker.tsx  # 2x2 grid of saved voices (replaces dropdown from earlier spec)
│   │   │   ├── TextInput.tsx         # Multi-line text with char/word count + estimated output
│   │   │   └── GenerateButton.tsx    # Trigger TTS clone
│   │   ├── StudioRecorder/
│   │   │   ├── StudioRecorderScreen.tsx
│   │   │   ├── WaveformViz.tsx       # Live waveform during recording
│   │   │   ├── RecordControls.tsx    # Mic circle, "Click to start recording", timer
│   │   │   ├── PipelineStages.tsx    # 4 horizontal PipelineStageCards + chevron separators
│   │   │   ├── PipelineStageCard.tsx # Single stage card (icon + title + model + checkbox)
│   │   │   ├── RunPipelineButton.tsx # Full-width run bar
│   │   │   └── StageOutput.tsx       # Per-stage result display
│   │   ├── Library/
│   │   │   ├── LibraryScreen.tsx
│   │   │   ├── LibraryTabs.tsx       # Voices (N) | Clips (N) tab toggle + Add button
│   │   │   ├── VoiceCard.tsx         # Grid card with colored waveform + Play
│   │   │   └── ClipRow.tsx           # List row with play + text + metadata
│   │   └── common/
│   │       ├── AudioPlaybackBar.tsx  # Play/pause/seek waveform bar
│   │       ├── JobPollingOverlay.tsx # Spinner + progress for jobs
│   │       └── ErrorBanner.tsx       # Dismissible error display
│   ├── hooks/
│   │   ├── useJobPolling.ts        # Poll /api/jobs/:id every 2s
│   │   ├── useRecorder.ts          # Browser MediaRecorder API
│   │   ├── useAudioPlayer.ts       # Web Audio API play/pause/seek
│   │   ├── useVoices.ts            # CRUD for saved voices
│   │   └── useClips.ts             # CRUD for saved clips
│   ├── lib/
│   │   ├── api.ts                  # All HTTP calls to backend
│   │   └── blobUtils.ts            # Blob <-> File <-> base64 helpers
│   ├── context/
│   │   └── AppContext.tsx          # Active tab, theme, job registry
│   └── main.tsx
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

### Component Tree

```
App.tsx
├── Sidebar
│   ├── Brand block (NVIDIA / AI VOICE STUDIO / v0.1 · MVP)
│   ├── Nav items (Voice Cloning, Studio Recorder, Library) — active row uses --accent-bg + green bar
│   └── Models Active footer (StatusDot rows for magpie-tts-zeroshot, canary-1b, bnr)
├── Main region
│   ├── ScreenHeader (title + optional model Pill + settings IconButton)
│   └── [Active Screen]
│       ├── VoiceCloningScreen
│       │   ├── VoiceSampleInput (waveform placeholder + Record + upload IconButton + name input + Save)
│       │   ├── TextInput (textarea + chars/words + estimated output)
│       │   ├── ClonedVoicePicker (2x2 grid of VoiceTag-based cards)
│       │   └── GenerateButton (primary, full-width)
│       │
│       ├── StudioRecorderScreen
│       │   ├── RecorderPanel (mic circle + caption + WaveformViz when recording)
│       │   ├── PipelineStages (4 × PipelineStageCard + chevrons + "N stages active" counter)
│       │   ├── RunPipelineButton
│       │   └── StageOutput (per-stage results, staggered entrance)
│       │
│       └── LibraryScreen
│           ├── LibraryTabs (Voices (N) | Clips (N) + Add button)
│           ├── VoiceCard[] (grid, Voices tab)
│           └── ClipRow[] (list, Clips tab)
│
├── HelpFab (bottom-right, fixed)
└── JobPollingOverlay (when jobs active)
```

### State Management

React Context only (no external library):
- `AppContext` -- active tab, theme (dark/light)
- `JobContext` -- Map<jobId, JobStatus>, registers polling intervals
- Tab-local state via `useState`/`useReducer` in each Tab component

### Data Flow: Studio Pipeline

```
1. User records audio via RecordControls -> audio_blob in state
2. User checks pipeline stages (clean, transcribe, translate, revoice)
3. If "revoice" checked -> VoiceSelector appears, user picks voice_id
4. If "translate" checked -> target language dropdown appears
5. User hits Run -> POST /api/studio/pipeline (multipart: audio_blob + JSON body)
6. Response: { job_id }
7. useJobPolling(job_id) -> step-by-step progress
8. StageOutput renders per-stage results (cleaned audio, text, translated text, revoiced audio)
```

### Data Flow: Voice Cloning

```
1. User uploads/records sample -> POST /api/voices { name, audio_blob }
2. User selects saved voice -> voice_id stored in state
3. User types text, hits Generate -> POST /api/tts/clone { voice_id, text }
4. Response: { job_id }
5. useJobPolling(job_id) polls GET /api/jobs/:job_id every 2s
6. Job done -> result.audio_url -> AudioPlaybackBar plays it
7. User can save clip -> POST /api/clips { name, audio_url }
```

### Styling

- TailwindCSS utility classes; all design tokens declared as CSS custom properties in `globals.css` and mirrored in `tailwind.config.ts` under `theme.extend`
- **Dark theme only for MVP** (no light theme toggle) — matches Figma reference
- Accent color is **Nvidia green** (`#76b900`), NOT indigo
- Layout is desktop-first (min-width 1280px). Below `lg` (1024px), sidebar collapses to icon-only rail; below `md` (768px) not supported for MVP.
- Keyboard shortcuts: Space=play/pause, R=record, Esc=stop
- All visual output must match `figma_design/*.png` — see "Visual Design System" section above
