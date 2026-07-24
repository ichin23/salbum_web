# Salbum Web — Agent Guide

## Tech stack

- **Vue 3** (`<script setup>` SFCs) + **TypeScript** + **Vite 7** + **Tailwind CSS 3**
- **Pinia** stores, **vue-router** (hash-free `createWebHistory`), **@vueuse/head** for SEO
- **Axios** HTTP client, **STOMP.js** for WebSocket notifications
- **PWA** via `vite-plugin-pwa` (auto-update, workbox caching for `/api/*` and images)

## Commands

```sh
npm run dev          # vite --host (dev server, proxies /api -> localhost:8080)
npm run build        # vue-tsc -b && vite build (typecheck + build)
npm run preview      # vite preview
```

There are no test, lint, or format scripts. `npm run build` is the only verification step.

## Architecture

- **Entry:** `src/main.ts` — mounts Vue, Pinia, vue-router, `@vueuse/head`
- **Layout:** Auth routes (`/login`, `/register`, `/verify`, `/auth/callback/:provider`) have no sidebar. App routes (`/` child routes) use `AppLayout.vue` (sidebar desktop, bottom nav mobile + FAB)
- **Auth flow:** Token stored in `localStorage` key `salbum_access_token`. Refresh via `POST /auth/refreshToken` (HttpOnly cookie). Guarded by `router.beforeEach`.
- **API client:** `src/services/apiClient.ts` — Axios instance at `/api`. Auto-injects Bearer token. 401 interceptor triggers refresh, refires original request.
- **Stores:** `auth` (Pinia), `notifications`, `websocket` (STOMP, connects on auth, disconnected on logout, reconnects on token refresh)
- **WebSocket:** Connects to `ws://localhost:8080/ws-notifications`, subscribes to `/user/queue/notifications`

## OAuth

- Google: implicit flow (`id_token` in URL fragment) — `src/composables/useOAuth.ts`
- Spotify: PKCE flow — stores code verifier in `sessionStorage`

## OpenSpec workflow

The project uses OpenSpec for feature planning. Artifacts live under `openspec/` (specs + changes). Skills under `.opencode/skills/openspec-*`. Commands:

- `/opsx-propose` — propose a change with design/specs/tasks
- `/opsx-apply` — implement a proposed change
- `/opsx-update` — revise planning artifacts
- `/opsx-sync` — sync delta specs to main specs
- `/opsx-explore` — explore ideas before committing
- `/opsx-archive` — archive completed change

## Key conventions

- **Dark theme only** — all colors defined in `tailwind.config.js` (primary `#234ED8`, backgrounds `#212121`/`#2a2a2a`, surface `#333333`, border `#3a3a3a`)
- **Fonts:** Inter (body), "Jersey 25" (display) — loaded via Google Fonts in `index.html`
- **Rating scale:** 0–100 for album/music scores
- **Review modes:** `comment`, `rating`, `music-by-music`
- **Mock data** in `src/mocks/index.ts` — used during development for local testing
- **TypeScript strict mode** with `noUnusedLocals` and `noUnusedParameters` — build will fail on unused vars
- **`vercel.json`** rewrites `/api/*` to `https://api.salbum.com.br/*` and all other routes to `index.html` (SPA fallback)

## Environment variables (`.env.local`)

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Backend URL (default `http://localhost:8080`) |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `VITE_SPOTIFY_CLIENT_ID` | Spotify OAuth client ID |
| `VITE_ADSENSE_CLIENT_ID` | Google AdSense publisher ID |

## Deployment

Deployed on Vercel. `npm run build` produces the `dist/` folder. The PWA service worker and manifest are generated at build time by `vite-plugin-pwa`.