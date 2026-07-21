# Stitch Studio UI — Implementation Plan

**Date:** 2026-07-18
**Status:** Active
**Reference:** `docs/design-docs/2026-07-18-stitch-studio-ui.md`

## Overview

7-phase implementation of the dual-theme Stitch Studio UI design. Each phase produces working code, updates relevant tests, and passes lint/typecheck. No placeholder code.

---

## Phase 1 — Design System Foundation

### Task 1.1: Update globals.css with dual-theme tokens

**Files:** `frontend/src/globals.css`

Replace current single-theme CSS with `[data-theme]` scoped tokens for both dark and light.

Changes:
- Import Inter, JetBrains Mono, Manrope, Geist fonts
- Define `:root` and `[data-theme="dark"]` with dark theme colors (studio_ai)
- Define `[data-theme="light"]` with light theme colors (visual_framework)
- Glass-panel utility classes for both themes
- Keep motion, easing, animation keyframes
- Update `@theme` block to reference CSS variables
- Remove hardcoded colors

### Task 1.2: Update tailwind.config.ts

**Files:** `frontend/tailwind.config.ts`

Extend theme with both color palettes, typography, spacing, radius, and font families from both design systems.

### Task 1.3: Refactor ThemeContext

**Files:** `frontend/src/context/ThemeContext.tsx`

- Support 'dark' | 'light' modes
- Persist to localStorage
- Toggle function
- Set `data-theme` and `class` on `<html>` element
- Smooth transition on theme change (300ms ease-out color/bg)

### Task 1.4: Replace lucide-react with Material Symbols

**Files:** `frontend/index.html`, `frontend/package.json`

- Add Google Fonts CDN link for Material Symbols
- Add `@material-symbols/react-400` npm package (or use CDN-only approach)
- Remove `lucide-react` dependency

### Task 1.5: Verify

- `npm run typecheck` passes
- `npm run build` succeeds

---

## Phase 2 — Layout Shell

### Task 2.1: New Sidebar

**Files:** `frontend/src/components/Sidebar.tsx`

Based on the code.html reference:
- Width: w-64 (256px)
- Brand: icon box + "AI Voice Studio" + "Pro Audio Engine" subtext
- "New Project" button: full-width, primary bg, py-3, rounded-lg
- Nav items: Studio (`mic_external_on`), Cloning (`settings_voice`), Library (`library_music`)
  - Active item: `bg-primary-container text-on-primary-container rounded-lg font-bold translate-x-1` (dark) / `bg-primary text-on-primary-container rounded-lg font-bold` (light)
  - Inactive: `text-on-surface-variant hover:text-on-surface hover:bg-white/5`
- Footer: Status link + Help link

Props: `activeScreen: Screen; onNavigate: (screen: Screen) => void`
Uses Material Symbols icons.

### Task 2.2: New TopAppBar

**Files:** `frontend/src/components/TopAppBar.tsx`

- Sticky, full-width, h-16
- `bg-surface/80 backdrop-blur-xl border-b border-white/10`
- Left: screen title (prop: `title: string`)
- Right: search input (rounded-full, hidden on studio recorder), notification bell, settings gear, user avatar (rounded-full, placeholder div)

### Task 2.3: New Footer

**Files:** `frontend/src/components/AppFooter.tsx`

- Fixed bottom, h-8, left-64
- `bg-surface-container-lowest border-t border-white/10`
- Left: "AI Voice Studio Engine v2.4.0" + processing status dot (pulsing green `w-2 h-2 rounded-full bg-primary`)
- Right: "API Docs" + "Support" links

### Task 2.4: Update App.tsx layou

**Files:** `frontend/src/App.tsx`

- Remove old Sidebar + main region layout
- New layout: Sidebar (fixed left) + main wrapper (ml-64)
- Main wrapper contains: TopAppBar (sticky) + content area + Footer (fixed)
- Content area renders active screen
- Wire ScreenHeader into TopAppBar title system

### Task 2.5: Update ScreenHeader

**Files:** `frontend/src/components/ScreenHeader.tsx`

Simplify: now just renders a section title inline (since TopAppBar handles the top bar). The model pill stays as an inline element next to section title in content area.

### Task 2.6: Verify

- App renders all structural elements
- `npm run typecheck` passes
- `npm run build` succeeds

---

## Phase 3 — UI Primitives

### Task 3.1: GlassPanel component

**Files:** `frontend/src/components/ui/GlassPanel.tsx`

New component. Uses `backdrop-filter: blur(12px)` + semi-transparent bg + 1px border.
Dark: `rgba(19, 27, 46, 0.8)` bg with `rgba(255,255,255,0.08)` border
Light: `rgba(255, 255, 255, 0.7)` bg with `rgba(0,0,0,0.05)` border + subtle shadow

### Task 3.2: Update Button component

**Files:** `frontend/src/components/ui/Button.tsx`

Variants:
- `primary`: `bg-primary text-on-primary rounded-lg font-bold` (dark: green, light: lavender)
- `primary-container`: `bg-primary-container text-on-primary-container rounded-lg font-bold` (dark: `#76b900`, light: `#eaddff`)
- `secondary`: `border border-white/10 rounded-lg` (ghost style)
- `ghost`: transparent text

### Task 3.3: Update SectionLabel

**Files:** `frontend/src/components/ui/SectionLabel.tsx`

Uses `text-mono-label font-mono-label uppercase tracking-wider` in dark, `text-label-caps font-label-caps uppercase tracking-wider` in light.

### Task 3.4: New SegmentedControl component

**Files:** `frontend/src/components/ui/SegmentedControl.tsx`

Used for Library tab switching. Pill-shaped segmented control:
- Container: `rounded-full p-1`, dark: `bg-surface-container-highest`, light: `bg-surface-container-high`
- Active segment: `bg-primary-container text-on-primary-container rounded-full px-6 py-2` (dark) / `bg-inverse-primary text-on-primary rounded-full px-6 py-2` (light)
- Inactive segment: `text-on-surface-variant hover:text-on-surface`

### Task 3.5: Knob component

**Files:** `frontend/src/components/ui/Knob.tsx`

DAW-style circular knob for Studio Recorder pipeline sidebar.
- Renders a CSS conic-gradient circle
- Props: `value: number` (0-100), `label: string`, `display: string` (e.g. "+12dB")
- Dark: `bg: conic-gradient(from 180deg, #171f33, #2d3449)`, border: `rgba(255,255,255,0.1)`
- Light: `bg: conic-gradient(from 180deg, #ffffff, #e5e2e1)`, border: `rgba(0,0,0,0.1)` + shadow

### Task 3.6: Update existing UI primitives

**Files:** Various `frontend/src/components/ui/*.tsx`

- `Pill.tsx` — use `rounded-full` instead of `rounded-[4px]`, theme-aware colors
- `StatusDot.tsx` — keep as-is (already uses CSS vars)
- `VoiceTag.tsx` — keep structure, use theme-aware spacing
- `WaveformBars.tsx` — keep structure, use theme-aware colors

### Task 3.7: Remove obsolete components

**Files:** Delete `frontend/src/components/ui/HelpFab.tsx` (help is now in sidebar)

### Task 3.8: Verify

- All primitives render correctly
- `npm run typecheck` passes
- `npm run build` succeeds

---

## Phase 4 — Voice Cloning Screen

### Task 4.1: Rewrite VoiceCloningScreen

**Files:** `frontend/src/components/VoiceCloning/VoiceCloningScreen.tsx`

12-col grid layout matching code.html reference:
- Section "Create New Voice" (lg:col-span-7): header with icon + title + "V2 ENGINE" badge
  - 2-col grid for Upload Audio / Record 10s Sample cards
  - Upload card: border, drag-drop zone, "DRAG & DROP" text
  - Record card: timer display `00:00:00`, record button (tertiary in dark, tertiary in light)
  - Name input + "SAVE VOICE MODEL" button (full-width, primary-container style)
- Aside (lg:col-span-5): "Technical Specs"
  - Audio waveform visualization placeholder (animated bars)
  - "Pro Workshop Tips" panel with check_circle list
- Full-width "Test Voice Output" section (12 cols)
  - Left: textarea + "GENERATE SPEECH" button (secondary-fixed bg style)
  - Right: custom audio player component with seek bar, playback controls, volume, timeline, "Export Test Clip"

### Task 4.2: Custom AudioPlayer component

**Files:** `frontend/src/components/common/AudioPlayer.tsx`

Custom audio player for Test Voice Output section:
- Seek bar (1px height, rounded, filled portion with glow dot)
- Previous / Play-Pause / Next buttons
- Time display (current / total)
- Volume icon + slider
- "Export Test Clip" download button

### Task 4.3: Update VoiceSampleInput

**Files:** `frontend/src/components/VoiceCloning/VoiceSampleInput.tsx`

- Simplify to work within the new two-card layout (Upload card + Record card)
- Upload card: drag-drop zone logic
- Record card: timer + record button
- Only handles audio capture, naming moves to the parent section

### Task 4.4: Update remaining sub-components

**Files:**
- `frontend/src/components/VoiceCloning/TextInput.tsx` — keep textarea, adjust styling per new theme
- `frontend/src/components/VoiceCloning/ClonedVoicePicker.tsx` — update card styling
- `frontend/src/components/VoiceCloning/GenerateButton.tsx` — update to matched style

### Task 4.5: Verify

- Screen renders without errors
- `npm run typecheck` passes

---

## Phase 5 — Studio Recorder Screen

### Task 5.1: Rewrite StudioRecorderScreen

**Files:** `frontend/src/components/StudioRecorder/StudioRecorderScreen.tsx`

New layout matching code.html reference:
- Main flex area (flex-1, vertical):
  - Studio Toolbar sub-header (h-12): project name, sample rate, recording timer (error color with pulse dot)
  - Waveform Viewport (flex-1): grid overlay, level meters, zoom controls
  - Transport Controls (glass-panel): Stop / Record (large red, w-20 h-20) / Pause buttons + labels
  - Live Transcription Preview container (scrollable)
- Right sidebar (w-80, shrink-0):
  - "Processing Pipeline" header
  - Pipeline stages as checkbox labels (not cards):
    - Clean (BNR) — checked by default
    - Transcribe (Canary-1B) — checked by default
    - Translate — with language dropdown (custom styled select)
    - Re-voice — with voice dropdown
  - "Sensitivity" section with Gain + Comp knobs
  - "Run Pipeline" button (primary-container bg, full-width, bolt icon)

### Task 5.2: Update PipelineStages and PipelineStageCard

**Files:** 
- `frontend/src/components/StudioRecorder/PipelineStages.tsx` — simplified: now passes stage definitions
- `frontend/src/components/StudioRecorder/PipelineStageCard.tsx` — replaced by checkbox labels in sidebar; can be deleted or simplified

### Task 5.3: Update remaining sub-components

**Files:**
- `frontend/src/components/StudioRecorder/RecordControls.tsx` — simplified, record button is in transport controls now
- `frontend/src/components/StudioRecorder/StageOutput.tsx` — keep as-is
- `frontend/src/components/StudioRecorder/RunPipelineButton.tsx` — update styling to match pipeline sidebar button

### Task 5.4: Verify

- Screen renders without errors
- `npm run typecheck` passes

---

## Phase 6 — Library Screen

### Task 6.1: Rewrite LibraryScreen

**Files:** `frontend/src/components/Library/LibraryScreen.tsx`

New layout matching code.html reference:
- Header: title "Asset Library" + description text
- SegmentedControl for Voices/Clips tabs
- Voices tab: grid of glass cards (responsive: 1-4 cols)
  - Each card: icon + name + category label + play button + waveform preview
  - "Clone New Voice" dashed border add card
- Clips tab: table view in glass panel
  - Columns: NAME, DURATION, CREATED, ACTIONS
  - Actions: play, download, delete
- Empty state: centered icon + text + "Go to Studio" button

### Task 6.2: Rewrite VoiceCard

**Files:** `frontend/src/components/Library/VoiceCard.tsx`

Glass card style:
- Icon box (w-10 h-10 rounded) with color accent
- Voice name (body-lg font-bold)
- Category label (label-caps, uppercase)
- Play button (w-10 h-10 rounded-full primary bg) + waveform preview
- Hover: show edit + delete action buttons
- Hover: border-primary/50 transition

### Task 6.3: Rewrite ClipRow

**Files:** `frontend/src/components/Library/ClipRow.tsx`

Table row style (or keep as panel rows that look like table rows):
- Each row: name with audio_file icon, duration (mono-data), created date, action buttons (play_circle, download, delete)

### Task 6.4: Update LibraryTabs

**Files:** `frontend/src/components/Library/LibraryTabs.tsx`

Replace with SegmentedControl. Remove old underline tab style.

### Task 6.5: Verify

- Screen renders with voices + clips + empty state
- `npm run typecheck` passes

---

## Phase 7 — Polish & Verification

### Task 7.1: Update tests

**Files:** `frontend/tests/components/App.test.tsx`, other test files

- Update App tests for new shell layout (sidebar, topbar, footer)
- Update component tests for new UI primitives
- Add basic smoke tests for GlassPanel, SegmentedControl, Knob

### Task 7.2: Run verification suite

```bash
cd frontend && npx tsc --noEmit && npm run lint && npm run build
cd backend && source venv/bin/activate && ruff check . && pytest -v
bash init.sh
```

### Task 7.3: Clean up

- Remove `figma_design/` directory (old design references no longer relevant)
- Remove old design doc `docs/design-docs/2026-07-07-ui-refresh-theme-system.md`
- Remove old plan `docs/exec-plans/active/2026-07-07-ui-refresh-theme-system.md`
- Update `docs/product-specs/index.md` if needed

### Task 7.4: Feature list evidence

- Record evidence in `feature_list.json` for all new features
- Update `agent-progress.md` and `session-handoff.md`
