# Core Beliefs

Design principles that guide every decision in AI Voice Studio.

## Visual

- **Dark theme only** — studio aesthetic, matches pro audio tools
- **Nvidia green (`#76b900`)** as the single accent color — brand alignment
- **Mono typography for labels** — `JetBrains Mono` at 11px, 0.14em letter-spacing, uppercase. Used for section labels, model tags, timestamps.
- **Desktop-first** — min-width 1280px. Below 1024px sidebar collapses to icons. Below 768px not supported.

## Motion

- **Only animate `transform` and `opacity`** — never `padding`, `margin`, `height`, `width`
- **Never animate from `scale(0)`** — start from `scale(0.95)` with `opacity: 0`
- **Button press:** `scale(0.97)` on `:active`, 160ms `ease-out`
- **Custom easing:** `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`, `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)`
- **Exit faster than enter** — asymmetric timing
- **No animation on keyboard actions** — Space/play, R/record, Esc/stop trigger instantly
- **`prefers-reduced-motion`** — keep color/opacity transitions, remove transforms
- **Hover animations** gated behind `@media (hover: hover) and (pointer: fine)`

## Architecture

- **Orchestrated backend** — all business logic lives in FastAPI, frontend is thin UI
- **Polling over WebSockets** — simpler, works with 5-30s NIM latencies, no connection issues
- **Job-based async** — every generative operation returns a `job_id`, client polls `GET /api/jobs/:id`
- **Single NIM client** — one `nvidia_client.py` wraps all three Nvidia APIs
- **In-memory state** — no database, no Redis. Job queue in memory, audio on local filesystem.
- **No authentication** — single-user local studio tool

## State

- **React Context only** — no Redux, no Zustand. Tab-local state via `useState`/`useReducer`.
- **Tab-local ownership** — each screen owns its state. Shared state (active tab) via context.
