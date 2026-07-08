# UI Refresh: Amber & Terracotta Theme System

> **Status:** Approved design  
> **Target version:** v0.2  
> **Designer:** AI Voice Studio

## Overview

Refactor the application layout to match a grid-based spatial system with a premium, soft, and muted color palette. Introduce both dark (Amber & Obsidian) and light (Linen & Terracotta) themes with a toggle.

---

## 1. Color Palettes

### Dark Mode: Amber & Obsidian

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#0B0B0C` | Global background |
| `--surface` | `#121214` | Cards & containers |
| `--border` | `#1F1F23` | Borders |
| `--accent` | `#DDAA77` | Muted amber primary |
| `--accent-hover` | `#E8BB8C` | Hover state |
| `--accent-bg` | `rgba(221, 170, 119, 0.15)` | Accent background |
| `--accent-solid` | `rgba(221, 170, 119, 0.25)` | Selected state |
| `--text` | `#F4F4F5` | Active/white text |
| `--text-muted` | `#71717A` | Muted text |
| `--text-subtle` | `#52525B` | Subtle text |

### Light Mode: Linen & Terracotta

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#F9F8F6` | Soft warm cream |
| `--surface` | `#FFFFFF` | Pure white cards |
| `--border` | `#EBE9E4` | Soft warm border |
| `--accent` | `#C87A53` | Muted terracotta |
| `--accent-hover` | `#D48960` | Hover state |
| `--accent-bg` | `rgba(200, 122, 83, 0.12)` | Accent background |
| `--accent-solid` | `rgba(200, 122, 83, 0.20)` | Selected state |
| `--text` | `#1A1A1C` | Active/dark text |
| `--text-muted` | `#8C8A85` | Muted text |
| `--text-subtle` | `#A09E98` | Subtle text |

### Voice Color Palette (shared across themes)

- Voice Green: `#76b900`
- Voice Blue: `#4ea3ff`
- Voice Purple: `#a780ff`
- Voice Orange: `#e89040`

---

## 2. Theme Toggle

- Persist choice in `localStorage` under key `theme`
- Default to `dark` on first visit
- Toggle button placed at the bottom of the Sidebar (above MODELS ACTIVE section)
- Icon: Sun/Moon from lucide-react
- Transition: 200ms ease-out on `background-color`, `color`, `border-color` — no transform animations on theme switch
- Apply via `data-theme="dark"` / `data-theme="light"` on `<html>` element

---

## 3. Global Shell & Sidebar

- Sidebar nav items use `rounded-lg` capsule on active state with accent background
- Active nav item: full capsule fill with `--accent-bg` + accent text color, NO left bar indicator
- Model status dots: `--accent` colored, pulsing dot (same as current but uses new accent color)
- Theme toggle button at sidebar bottom

---

## 4. Voice Cloning View (`/voice-cloning`)

- **Layout:** `grid grid-cols-12 gap-8 items-start`
- **Left (col-span-4):** Sample Input (record/upload area + buttons), Voice Name (input + save)
- **Right (col-span-8):** Generate Speech (textarea), Cloned Voice (voice picker grid), Generate CTA
- **Generous padding** — no wrapping single Panel, content sits directly in the grid

---

## 5. Studio Recorder View (`/studio-recorder`)

- **Pipeline grid:** `grid grid-cols-4 gap-4` for the 4 pipeline stage cards
- **Status dots:** Replace `ON`/`OFF` text with a colored geometric dot (top-right of each card)
- **Active state:** Accent border + filled dot
- **Inactive state:** Muted border + hollow ring
- **Run Pipeline:** Full-width accent CTA below pipeline grid

---

## 6. Library View (`/library`)

- **Tab header:** Inline nav on left `Voices (X)` / `Clips (Y)`, `+ Add` button anchored right
- **Voices:** `grid grid-cols-2 gap-4` of VoiceCards
- **Clips:** Vertical stack (`space-y-3`) of ClipRows
- **Empty state:** Centered text "No saved voices yet."

---

## 7. Component Updates

All existing UI primitives (`Button`, `Panel`, `Pill`, `StatusDot`, `SectionLabel`, `IconButton`, `VoiceTag`, `WaveformBars`) updated in-place to use CSS custom properties for theming. No new primitive components needed.

---

## Phased Implementation Plan

| Phase | Feature | Scope |
|-------|---------|-------|
| 1 | Theme System + Shell Refactor | globals.css, ThemeContext, Sidebar, ui primitives |
| 2 | Voice Cloning Screen Refactor | Grid layout, amber/terracotta palette |
| 3 | Studio Recorder Screen Refactor | Pipeline grid, status dots, CTA |
| 4 | Library Screen Refactor | Tab header, grid/list, empty state |

Features implemented one at a time per AGENTS.md conventions.
