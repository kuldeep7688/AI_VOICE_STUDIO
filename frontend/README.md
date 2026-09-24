# AI Voice Studio — Frontend

React 19 + TypeScript + Vite + TailwindCSS v4 UI for AI Voice Studio. See the [root README](../README.md) for the full project overview.

```bash
npm install
npm run dev        # http://localhost:5173 (proxies /api and /audio to http://localhost:8000)
npm test           # Vitest + React Testing Library
npx tsc --noEmit   # type-check
npm run lint       # oxlint
npm run build      # production build to dist/
```

The backend must be running on port 8000. All backend calls are in `src/lib/api.ts`, and job status is polled every 2s by `src/hooks/useJobPolling.ts`.
