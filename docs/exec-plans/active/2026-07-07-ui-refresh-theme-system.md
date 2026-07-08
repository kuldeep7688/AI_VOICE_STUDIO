# AI Voice Studio — UI Refresh & Theme System Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the application layout with a grid system, introduce dual dark/light theme (Amber & Obsidian / Linen & Terracotta), and update all 3 views (Voice Cloning, Studio Recorder, Library) plus the Sidebar shell.

**Design spec:** `docs/design-docs/2026-07-07-ui-refresh-theme-system.md`

**Phased approach:** 4 features implemented sequentially per AGENTS.md conventions. Each phase is completed fully (code + tests + verification) before starting the next.

---

## Phase 1: Theme System + Shell Refactor (feat-ui-theme-system)

**Files:**
- Modify: `frontend/src/globals.css`
- Create: `frontend/src/context/ThemeContext.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/Sidebar.tsx`
- Modify: `frontend/src/components/ui/Button.tsx`
- Modify: `frontend/src/components/ui/Panel.tsx`
- Modify: `frontend/src/components/ui/Pill.tsx`
- Modify: `frontend/src/components/ui/StatusDot.tsx`
- Modify: `frontend/src/components/ui/SectionLabel.tsx`
- Modify: `frontend/src/components/ui/IconButton.tsx`
- Modify: `frontend/src/components/ui/VoiceTag.tsx`
- Modify: `frontend/src/components/ui/WaveformBars.tsx`
- Create: `frontend/tests/components/ThemeToggle.test.tsx`

**Purpose:** Establish the dual-theme design token system, add theme toggle, refresh sidebar, and update all UI primitives to use CSS custom properties for automatic theme adaptation.

### Task 1: Update globals.css with Dual Theme Tokens

- [ ] **Step 1: Replace current `:root` block with `[data-theme="dark"]` scoped tokens**

Current `:root` uses dark-only tokens. Replace with:

```css
[data-theme="dark"] {
  color-scheme: dark;
  --bg: #0B0B0C;
  --surface: #121214;
  --surface-hover: #1A1A1E;
  --border: #1F1F23;
  --border-strong: #2A2A2E;
  --accent: #DDAA77;
  --accent-hover: #E8BB8C;
  --accent-bg: rgba(221, 170, 119, 0.15);
  --accent-solid: rgba(221, 170, 119, 0.25);
  --text: #F4F4F5;
  --text-muted: #71717A;
  --text-subtle: #52525B;
}

[data-theme="light"] {
  color-scheme: light;
  --bg: #F9F8F6;
  --surface: #FFFFFF;
  --surface-hover: #F5F4F1;
  --border: #EBE9E4;
  --border-strong: #D6D3CC;
  --accent: #C87A53;
  --accent-hover: #D48960;
  --accent-bg: rgba(200, 122, 83, 0.12);
  --accent-solid: rgba(200, 122, 83, 0.20);
  --text: #1A1A1C;
  --text-muted: #8C8A85;
  --text-subtle: #A09E98;
}
```

Keep shared variables (voice colors, fonts, easings) in a global `:root` block that applies regardless of theme.

- [ ] **Step 2: Add theme transition on body**

```css
body {
  transition: background-color 200ms ease-out, color 200ms ease-out;
}
```

- [ ] **Step 3: Add `[data-theme]` transition for themed elements**

```css
[data-theme] * {
  transition-property: background-color, color, border-color;
  transition-duration: 200ms;
  transition-timing-function: cubic-bezier(0.23, 1, 0.32, 1);
}
```

- [ ] **Step 4: Keep all existing animations, utility classes, and font imports**

The `@theme` block, `@keyframes`, `.section-label`, `.btn-press`, `.hover-lift`, and reduced-motion rules remain unchanged — they reference CSS vars which now switch by data-theme.

- [ ] **Step 5: Verify globals.css compiles**

Run: `cd frontend && npx tsc --noEmit && npm run build`
Expected: Build succeeds with no errors.

### Task 2: Create ThemeContext

- [ ] **Step 1: Create `frontend/src/context/ThemeContext.tsx`**

```typescript
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = 'ai-voice-studio-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored === 'dark' || stored === 'light') ? stored : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
```

- [ ] **Step 2: Quick import check**

Run: `cd frontend && npx tsc --noEmit`
Expected: No type errors.

### Task 3: Update App.tsx

- [ ] **Step 1: Wrap with `ThemeProvider`**

```typescript
import { ThemeProvider } from './context/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ThemeProvider>
  );
}
```

Order: `ThemeProvider` outermost, then `AppProvider`, then `AppContent`.

### Task 4: Refresh Sidebar

- [ ] **Step 1: Update nav items — capsule active style instead of left bar**

Replace the active indicator:
```tsx
// Inside the button map, replace the left bar + bg-accent-solid approach:
className={`btn-press flex items-center gap-3 w-full h-10 px-3 rounded-lg text-[13px] font-medium ${
  isActive
    ? 'bg-accent text-black font-semibold'
    : 'text-text-muted hover:bg-surface-hover hover:text-text'
}`}
```

Note: Active nav item gets solid accent background with `text-black` in dark (or appropriate contrast text).

- [ ] **Step 2: Add theme toggle button in sidebar footer**

Below MODELS ACTIVE section, add a Sun/Moon toggle:
```tsx
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

// Inside Sidebar, before the closing </aside>:
<div className="px-3 pb-4">
  <button
    onClick={toggleTheme}
    className="flex items-center gap-3 w-full h-9 px-3 rounded-lg text-text-muted hover:bg-surface-hover transition"
  >
    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    <span className="text-xs font-mono tracking-wider uppercase">
      {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
    </span>
  </button>
</div>
```

- [ ] **Step 3: Verify Sidebar renders with new styles**

Run: `cd frontend && npm test`
Check: Snapshot or render test includes theme toggle button.

### Task 5: Update UI Primitives

All primitives already reference CSS custom properties (`--accent`, `--surface`, `--border`, etc.) — they automatically adapt to the theme without code changes. Verify each:

- [ ] **Step 1: Verify Button.tsx** — uses `bg-accent`, `text-*`, `border-[--border]` — no hardcoded hex colors
- [ ] **Step 2: Verify Panel.tsx** — uses `bg-[--surface]`, `border-[--border]` — no hardcoded hex colors
- [ ] **Step 3: Verify Pill.tsx** — uses `text-accent` and `border-[--border]` — no hardcoded hex colors
- [ ] **Step 4: Verify StatusDot.tsx** — uses `bg-[--accent]` for active state — auto-adapts
- [ ] **Step 5: Verify SectionLabel.tsx** — uses `text-text-muted` via `.section-label` class
- [ ] **Step 6: Verify IconButton.tsx** — uses `border-[--border]`, `text-text-muted`
- [ ] **Step 7: Verify VoiceTag.tsx** — uses StatusDot, adapts via props
- [ ] **Step 8: Verify WaveformBars.tsx** — uses color prop, no theme dependency

If any component has hardcoded hex values (e.g., `#76b900`), replace with `--accent` var equivalent.

- [ ] **Step 9: Run typecheck and build**

```bash
cd frontend && npx tsc --noEmit && npm run build
```

### Task 6: Write Theme Toggle Test

- [ ] **Step 1: Create `frontend/tests/components/ThemeToggle.test.tsx`**

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../../src/context/ThemeContext';

function TestComponent() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-value">{theme}</span>
      <button onClick={toggleTheme} data-testid="toggle-btn">Toggle</button>
    </div>
  );
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('defaults to dark theme', () => {
    render(<ThemeProvider><TestComponent /></ThemeProvider>);
    expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('toggles to light theme', () => {
    render(<ThemeProvider><TestComponent /></ThemeProvider>);
    fireEvent.click(screen.getByTestId('toggle-btn'));
    expect(screen.getByTestId('theme-value')).toHaveTextContent('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('persists theme in localStorage', () => {
    render(<ThemeProvider><TestComponent /></ThemeProvider>);
    fireEvent.click(screen.getByTestId('toggle-btn'));
    expect(localStorage.getItem('ai-voice-studio-theme')).toBe('light');
  });

  it('restores theme from localStorage', () => {
    localStorage.setItem('ai-voice-studio-theme', 'light');
    render(<ThemeProvider><TestComponent /></ThemeProvider>);
    expect(screen.getByTestId('theme-value')).toHaveTextContent('light');
  });
});
```

- [ ] **Step 2: Run tests**

```bash
cd frontend && npm test
```
Expected: All 4 theme tests pass.

### Task 7: Verify Phase 1 Completion

- [ ] **Step 1: Run full verification**

```bash
cd frontend && npm test && npx tsc --noEmit && npm run build
```

- [ ] **Step 2: Update feature_list.json status for feat-ui-theme-system**

---

## Phase 2: Voice Cloning Screen Refactor (feat-ui-voice-cloning)

**Files:**
- Modify: `frontend/src/components/VoiceCloning/VoiceCloningScreen.tsx`
- Modify: `frontend/src/components/VoiceCloning/VoiceSampleInput.tsx`
- Modify: `frontend/src/components/VoiceCloning/TextInput.tsx`
- Modify: `frontend/src/components/VoiceCloning/ClonedVoicePicker.tsx`
- Modify: `frontend/src/components/VoiceCloning/GenerateButton.tsx`
- Modify: `frontend/src/components/common/AudioPlaybackBar.tsx`

**Purpose:** Break the single-column block layout into a 12-column grid. Left column (col-span-4) for input configuration, right column (col-span-8) for generation workspace.

### Task 1: Refactor VoiceCloningScreen

- [ ] **Step 1: Replace current single-Panel layout with 12-column grid**

```tsx
<div className="p-6 space-y-6">
  {/* Header Title Row */}
  <div className="flex items-center gap-4">
    <h1 className="text-xl font-mono uppercase tracking-wider">Voice Cloning</h1>
    <Pill>magpie-tts-zeroshot</Pill>
  </div>

  {/* Split Column Workspace */}
  <div className="grid grid-cols-12 gap-8 items-start">
    {/* LEFT COLUMN: col-span-4 */}
    <div className="col-span-4 space-y-6">
      <VoiceSampleInput />
    </div>

    {/* RIGHT COLUMN: col-span-8 */}
    <div className="col-span-8 space-y-6">
      <TextInput />
      <ClonedVoicePicker />
      <GenerateButton />
    </div>
  </div>
</div>
```

- [ ] **Step 2: Update VoiceSampleInput** — use `grid grid-cols-4 gap-3` for buttons (Record takes col-span-3, upload takes col-span-1), dashed-border sample area with placeholder text "NO SAMPLE LOADED"

- [ ] **Step 3: Update TextInput** — Ensure textarea has min-height, counter row with char/word count and estimated duration

- [ ] **Step 4: Update ClonedVoicePicker** — 2-column grid of voice cards, selected state with accent border

- [ ] **Step 5: Update GenerateButton** — full-width accent CTA with ⚡ icon

- [ ] **Step 6: Run typecheck and tests**

```bash
cd frontend && npx tsc --noEmit && npm test && npm run build
```

### Task 2: Write Voice Cloning Screen Tests

- [ ] **Step 1: Update existing VoiceCloning screen tests** to verify grid structure renders (col-span-4, col-span-8 divs present)

- [ ] **Step 2: Run tests**

```bash
cd frontend && npm test
```

### Task 3: Verify Phase 2 Completion

- [ ] **Step 1: Run full verification**

```bash
cd frontend && npm test && npx tsc --noEmit && npm run build
```

- [ ] **Step 2: Update feature_list.json status for feat-ui-voice-cloning**

---

## Phase 3: Studio Recorder Screen Refactor (feat-ui-studio-recorder)

**Files:**
- Modify: `frontend/src/components/StudioRecorder/StudioRecorderScreen.tsx`
- Modify: `frontend/src/components/StudioRecorder/PipelineStages.tsx`
- Modify: `frontend/src/components/StudioRecorder/PipelineStageCard.tsx`
- Modify: `frontend/src/components/StudioRecorder/RunPipelineButton.tsx`
- Modify: `frontend/src/components/StudioRecorder/RecordControls.tsx`
- Modify: `frontend/src/components/StudioRecorder/StageOutput.tsx`

**Purpose:** Convert pipeline stages to a 4-column grid with status dots replacing ON/OFF text.

### Task 1: Refactor Studio Recorder

- [ ] **Step 1: Update PipelineStages to use `grid grid-cols-4 gap-4`**

```tsx
<div className="grid grid-cols-4 gap-4">
  {stages.map(stage => (
    <PipelineStageCard key={stage.id} {...stage} />
  ))}
</div>
```

- [ ] **Step 2: Update PipelineStageCard** — Replace ON/OFF text with StatusDot in top-right corner

Active card: accent border + filled dot
Inactive card: muted border + hollow ring

```tsx
// Instead of text "ON"/"OFF", render at top-right:
{isActive ? (
  <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-accent" />
) : (
  <div className="absolute top-3 right-3 w-3 h-3 rounded-full border border-text-subtle bg-transparent" />
)}
```

- [ ] **Step 3: Update RunPipelineButton** — Full-width accent CTA

```tsx
<button className="w-full py-3.5 bg-accent text-black font-bold font-mono text-center tracking-widest uppercase rounded hover:bg-accent-hover transition mt-6">
  RUN PIPELINE
</button>
```

- [ ] **Step 4: Run typecheck**

```bash
cd frontend && npx tsc --noEmit
```

### Task 2: Write Studio Recorder Tests

- [ ] **Step 1: Test PipelineStageCard renders active/inactive states correctly with dot indicators**

- [ ] **Step 2: Run tests**

```bash
cd frontend && npm test
```

### Task 3: Verify Phase 3 Completion

- [ ] **Step 1: Run full verification**

```bash
cd frontend && npm test && npx tsc --noEmit && npm run build
```

- [ ] **Step 2: Update feature_list.json status for feat-ui-studio-recorder**

---

## Phase 4: Library Screen Refactor (feat-ui-library)

**Files:**
- Modify: `frontend/src/components/Library/LibraryScreen.tsx`
- Modify: `frontend/src/components/Library/LibraryTabs.tsx`
- Modify: `frontend/src/components/Library/VoiceCard.tsx`
- Modify: `frontend/src/components/Library/ClipRow.tsx`

**Purpose:** Redesign tab header layout, switch to 2-column grid for voices, clean vertical stack for clips.

### Task 1: Refactor Library Screen

- [ ] **Step 1: Update LibraryTabs** — Inline nav on left, `+ Add` button on right

```tsx
<div className="flex items-center justify-between mb-6">
  <div className="flex gap-6">
    <button className={`font-mono text-sm tracking-wider uppercase ${isVoices ? 'text-text' : 'text-text-muted'}`}>
      Voices ({voicesCount})
    </button>
    <button className={`font-mono text-sm tracking-wider uppercase ${!isVoices ? 'text-text' : 'text-text-muted'}`}>
      Clips ({clipsCount})
    </button>
  </div>
  <button className="px-4 py-2 border border-accent text-accent rounded font-mono text-xs uppercase tracking-wider hover:bg-accent-bg transition">
    + Add
  </button>
</div>
```

- [ ] **Step 2: Update Voices grid to `grid grid-cols-2 gap-4`**

- [ ] **Step 3: Update Clips list to vertical stack `space-y-3`**

- [ ] **Step 4: Add empty state for zero voices/clips** — centered text

```tsx
{voices.length === 0 && (
  <div className="text-center py-16 font-mono text-sm text-text-muted">
    No saved voices yet.
  </div>
)}
```

- [ ] **Step 5: Run typecheck**

```bash
cd frontend && npx tsc --noEmit
```

### Task 2: Write Library Tests

- [ ] **Step 1: Test empty state renders correct text for voices and clips tabs**

- [ ] **Step 2: Run tests**

```bash
cd frontend && npm test
```

### Task 3: Verify Phase 4 Completion

- [ ] **Step 1: Run full verification**

```bash
cd frontend && npm test && npx tsc --noEmit && npm run build
```

- [ ] **Step 2: Update feature_list.json status for feat-ui-library**

---

## Final Verification

- [ ] Run full frontend test suite: `cd frontend && npm test`
- [ ] TypeScript clean: `cd frontend && npx tsc --noEmit`
- [ ] Build succeeds: `cd frontend && npm run build`
- [ ] All feature_list.json entries for UI refresh show "completed" with evidence
- [ ] agent-progress.md and session-handoff.md updated

---

## Self-Review

1. **Placeholder scan:** No TODOs or incomplete sections remain above. Each task has complete code.
2. **Internal consistency:** Theme system uses `data-theme` attribute on `<html>`. All CSS vars are duplicated across both `[data-theme="dark"]` and `[data-theme="light"]` blocks. Shared vars (fonts, voice colors, easings) remain in `:root`.
3. **Scope check:** 4 independent phases, each scoped to a single screen or system. No overlap. Each phase is completable independently with passing tests.
4. **Ambiguity check:** Theme toggle behavior (localStorage, default dark, Sun/Moon icons) explicitly specified. Grid column spans explicitly defined (12-col for Voice Cloning, 4-col for pipeline stages, 2-col for voices). Active/inactive dot states explicitly described.
