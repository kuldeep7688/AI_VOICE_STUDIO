# Stitch Studio UI — Dual Theme Design System

**Date:** 2026-07-18
**Status:** Approved
**Source:** `docs/stitch_nvidia_ai_voice_studio/`

## Overview

Complete visual redesign of AI Voice Studio implementing two distinct design systems:
- **Dark theme** (`studio_ai/DESIGN.md`) — Deep navy glassmorphism with Nvidia green accent, for studio/professional environments
- **Light theme** (`studio_ai_visual_framework/DESIGN.md`) — White/light lavender with Manrope/Geist typography, for general/office environments

Both themes use Material Symbols icons (Google Fonts), glassmorphism panels, a fixed top bar + sidebar + footer layout, and 12-column responsive grids.

---

## Dark Theme (studio_ai)

### Color Tokens
| Token | Value | Usage |
|-------|-------|-------|
| `background` | `#0b1326` | App background |
| `surface` | `#131b2e` | Sidebar, secondary panels |
| `surface-container-lowest` | `#060e20` | Input fields, deepest surfaces |
| `surface-container` | `#171f33` | Card/panel surfaces |
| `surface-container-high` | `#222a3d` | Hover states, elevated panels |
| `surface-container-highest` | `#2d3449` | Active states |
| `on-surface` | `#dae2fd` | Primary text |
| `on-surface-variant` | `#c1cab1` | Muted text, metadata |
| `outline` | `#8c947d` | Borders, dividers |
| `outline-variant` | `#424936` | Subtle borders |
| `primary` | `#94da32` | Accent green, CTAs |
| `on-primary` | `#203700` | Text on primary bg |
| `primary-container` | `#76b900` | Active nav, secondary buttons |
| `on-primary-container` | `#284400` | Text on primary-container |
| `secondary` | `#bdf4ff` | Signal processing, waveform viz |
| `tertiary` | `#c0c1ff` | Auxiliary tools, metadata grouping |
| `error` | `#ffb4ab` | Errors, recording state |

### Typography
| Token | Font | Size | Weight | Line Ht | Letter Spacing |
|-------|------|------|--------|---------|----------------|
| Body | Inter | 14px | 400 | 1.5 | — |
| headline-lg | Inter | 32px | 600 | 1.2 | — |
| headline-md | Inter | 24px | 500 | 1.3 | — |
| mono-label | JetBrains Mono | 12px | 500 | 1.0 | 0.05em |
| mono-data | JetBrains Mono | 13px | 400 | 1.0 | — |

### Shape Tokens
| Level | Radius | Usage |
|-------|--------|-------|
| DEFAULT | 2px (0.125rem) | Base |
| lg | 4px (0.25rem) | Buttons, inputs |
| xl | 8px (0.5rem) | Cards, panels |
| full | 12px (0.75rem) | Pills |

### Glass Panel
```css
.glass-panel {
  background: rgba(19, 27, 46, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
```

---

## Light Theme (visual_framework)

### Color Tokens
| Token | Value | Usage |
|-------|-------|-------|
| `background` | `#fdfcff` | App background |
| `surface` | `#fdfcff` | Main surface |
| `surface-bright` | `#fdf8ff` | Content area bg |
| `surface-container-lowest` | `#ffffff` | Input fields, cards |
| `surface-container` | `#f3edf7` | Panel surfaces |
| `surface-container-high` | `#ece6f0` | Hover states |
| `surface-container-highest` | `#e6e1e5` | Active states |
| `on-surface` | `#1c1b1f` | Primary text |
| `on-surface-variant` | `#49454f` | Muted text |
| `outline` | `#948e9d` | Borders |
| `outline-variant` | `#cac4d0` | Subtle borders |
| `primary` | `#cebdff` | Lavender accent |
| `inverse-primary` | `#674bb5` | Dark purple for CTAs |
| `on-primary` | `#ffffff` | Text on primary |
| `primary-container` | `#eaddff` | Light lavender bg |
| `on-primary-container` | `#21005d` | Text on primary-container |
| `secondary` | `#becca3` | Sage green |
| `secondary-fixed-dim` | `#becca3` | Sage for success states |
| `tertiary` | `#ecbbba` | Dusty rose |
| `error` | `#b3261e` | Errors |

### Typography
| Token | Font | Size | Weight | Line Ht | Letter Spacing |
|-------|------|------|--------|---------|----------------|
| body-md | Geist | 16px | 400 | 1.5 | — |
| body-lg | Geist | 18px | 400 | 1.6 | — |
| headline-lg | Manrope | 32px | 600 | 1.25 | — |
| headline-md | Manrope | 24px | 500 | 1.33 | — |
| label-caps | Geist | 12px | 600 | 1.0 | 0.05em |
| code-sm | Geist | 14px | 400 | 1.0 | — |
| display-lg | Manrope | 48px | 700 | 1.1 | -0.02em |

### Shape Tokens
| Level | Radius | Usage |
|-------|--------|-------|
| DEFAULT | 4px (0.25rem) | Base |
| lg | 8px (0.5rem) | Buttons, inputs |
| xl | 12px (0.75rem) | Cards, panels |
| full | 16px (1rem) | Pills |

### Glass Panel (Light)
```css
.glass-panel {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 4px 24px -1px rgba(0, 0, 0, 0.04);
}
```

---

## Layout Shell

### Desktop Layout
```
┌──────────────────────────────────────────────────────────────┐
│ TopAppBar (h-16, sticky, backdrop-blur, search + notifications) │
├──────┬───────────────────────────────────────────────────────┤
│      │ Sub-header / Studio Toolbar (optional, h-12)          │
│ Side ├───────────────────────────────────────────────────────┤
│ bar  │ Main Content Area (scrollable, 12-col grid)           │
│ 256px│                                                       │
│      │                                                       │
├──────┴───────────────────────────────────────────────────────┤
│ Footer (h-8, fixed, engine version + status + links)         │
└──────────────────────────────────────────────────────────────┘
```

### Sidebar (256px)
- Brand icon (w-10 h-10 rounded) + "AI Voice Studio" + "Pro Audio Engine" subtext
- "New Project" button (primary bg, full-width)
- Nav items: Studio, Cloning, Library (icon + label, py-3 px-4)
  - Active: primary-container bg (dark) / primary bg (light)
- Footer: Status link + Help link

### TopAppBar (h-16, sticky)
- Left: screen title (or "AI Voice Studio" branding for Studio Recorder)
- Right: search bar (rounded-full), notifications bell, settings gear, user avatar

### Footer (h-8, fixed)
- Left: engine version + processing status dot
- Right: API Docs + Support links

---

## Per-Screen Layouts

### Voice Cloning Workshop
```
12-col grid, gap-6 (or gap-lg in light):
  ┌──────────────────────────────┬──────────────────────────────┐
  │  Create New Voice (7 cols)   │  Technical Specs (5 cols)   │
  │  ┌──────┬──────┐             │  ┌──────────────────────┐  │
  │  │Upload│Record│             │  │ Audio Visualization  │  │
  │  └──────┴──────┘             │  └──────────────────────┘  │
  │  ┌──────────────────┐        │  ┌──────────────────────┐  │
  │  │ Name + Save       │        │  │ Pro Workshop Tips    │  │
  │  └──────────────────┘        │  └──────────────────────┘  │
  ├────────────────────────────────────────────────────────────┤
  │  Test Voice Output (12 cols, full width)                   │
  │  ┌──────────────────────┬──────────────────────────────┐   │
  │  │ Text Input + Generate │ Custom Audio Player + Export │   │
  │  └──────────────────────┴──────────────────────────────┘   │
  └────────────────────────────────────────────────────────────┘
```

### Studio Recorder
```
┌─────────────────────────────────────┬────────────────────────┐
│  Waveform Viewport (flex-1)         │  Pipeline Sidebar (320px)│
│  ┌───────────────────────────────┐  │  ┌──────────────────┐   │
│  │ Waveform + Grid + Level Meter│  │  │ Clean (BNR) ☑    │   │
│  └───────────────────────────────┘  │  │ Transcribe ☑     │   │
│  ┌───────────────────────────────┐  │  │ Translate + lang │   │
│  │ Transport Controls (glass)    │  │  │ Re-voice + voice │   │
│  │  Stop  [🔴Record]  Pause     │  │  ├──────────────────┤   │
│  │  Live Transcription Preview   │  │  │ Sensitivity      │   │
│  └───────────────────────────────┘  │  │ Gain knob  Comp  │   │
│                                     │  ├──────────────────┤   │
│                                     │  │ Run Pipeline btn │   │
│                                     │  └──────────────────┘   │
└─────────────────────────────────────┴────────────────────────┘
```

### Library
```
┌──────────────────────────────────────────────────────────────┐
│  Title + description                                          │
│  [Saved Voices ●●●○] [Generated Clips ○○○●] (segmented pill)│
├──────────────────────────────────────────────────────────────┤
│  Voices tab (grid 2-4 cols):                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │ Voice card   │ │ Voice card   │ │ + Add card   │         │
│  │ icon+name    │ │ icon+name    │ │ Clone New    │         │
│  │ cat+waveform │ │ cat+waveform │ │ Voice        │         │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
│                                                               │
│  Clips tab (table):                                          │
│  ┌──────────────┬──────────┬──────────┬──────────┐          │
│  │ NAME         │ DURATION │ CREATED  │ ACTIONS  │          │
│  ├──────────────┼──────────┼──────────┼──────────┤          │
│  │ Project_v1   │ 02:45    │ Oct 24   │ ▶ ⬇ 🗑   │          │
│  └──────────────┴──────────┴──────────┴──────────┘          │
└──────────────────────────────────────────────────────────────┘
```

---

## Theme Switching

- ThemeContext persists choice in localStorage
- Toggle button in sidebar footer (or settings gear dropdown)
- CSS custom properties scoped via `[data-theme="dark"]` / `[data-theme="light"]` on `<html>`
- All components reference CSS variables only — no hardcoded theme colors
- Transitions between themes: `color 300ms ease-out, background-color 300ms ease-out`
- Both themes use `class="dark"` / `class="light"` on `<html>` for Tailwind dark mode compat

---

## Icons

Replace lucide-react with Material Symbols (Google Fonts):
- `mic_external_on` — Studio (nav)
- `settings_voice` — Cloning (nav)
- `library_music` — Library (nav)
- `add_circle` — Create New
- `cloud_upload` — Upload
- `mic` — Record
- `play_arrow` — Play
- `skip_previous` / `skip_next` — Skip track
- `search` — Search bar
- `notifications` — Notifications
- `settings` — Settings gear
- `save` — Save
- `auto_fix_high` — Generate
- `download` — Export/Download
- `delete` — Delete
- `edit` — Edit
- `check` — Checkbox check
- `expand_more` — Dropdown arrow
- `chevron_right` — Chevron
- `zoom_in` / `zoom_out` — Waveform zoom
- `stop` / `pause` — Transport controls
- `info` — Info tips
- `analytics` — Status
- `help_outline` — Help
- `add` — New Project
- `audio_file` — Audio file icon
- `folder_off` — Empty state
- `cloud_upload` — Drag/drop zone
- `check_circle` — Tips checkmark

Use `@material-symbols/react-<weight>` or direct Google Fonts CDN import.

---

## References

- `docs/stitch_nvidia_ai_voice_studio/studio_ai/DESIGN.md` — Dark theme tokens
- `docs/stitch_nvidia_ai_voice_studio/studio_ai_visual_framework/DESIGN.md` — Light theme tokens
- `docs/stitch_nvidia_ai_voice_studio/*/code.html` — Per-screen reference implementations
- `docs/stitch_nvidia_ai_voice_studio/*/screen.png` — Visual mockups per screen
