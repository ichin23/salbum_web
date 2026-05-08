---
wave: 1
depends_on: []
files_modified:
  - vite.config.ts
  - src/composables/useNetwork.ts
  - src/layouts/AppLayout.vue
autonomous: false
requirements: ["Advanced Caching & Offline Support"]
---

# Plan: Advanced Caching & Offline Support

## Objective
Enable offline support by implementing Workbox runtime caching strategies for API requests and external images. Inform users of their network status via an offline banner in the main layout.

## Tasks

<task>
<objective>Configure runtime caching for API and Images</objective>
<read_first>
- vite.config.ts
</read_first>
<action>
1. In `vite.config.ts`, expand the `VitePWA` configuration object to include `workbox.runtimeCaching`.
2. Add a `NetworkFirst` strategy for `/api/` endpoints (to ensure fresh data when online, but fallback to cache when offline).
3. Add a `CacheFirst` strategy for external image domains (e.g., last.fm, spotify images if they match a pattern, or general image requests) with expiration and cacheability plugins.
</action>
<acceptance_criteria>
- `vite.config.ts` contains `workbox` configuration with `runtimeCaching` array.
- A `NetworkFirst` rule is configured for URL patterns matching `/api/`.
- A `CacheFirst` rule is configured for image destination types or specific CDNs.
</acceptance_criteria>
</task>

<task>
<objective>Create a network status composable</objective>
<read_first>
- src/composables/useNetwork.ts
</read_first>
<action>
1. Create a new file `src/composables/useNetwork.ts`.
2. Export a function `useNetwork()` that returns a reactive `isOnline` boolean ref.
3. Initialize the ref using `navigator.onLine`.
4. Setup `window.addEventListener('online')` and `offline` to update the ref, ensuring listeners are added in `onMounted` and removed in `onUnmounted` (using Vue's lifecycle hooks).
</action>
<acceptance_criteria>
- `src/composables/useNetwork.ts` exists.
- The composable tracks network status using `online` and `offline` window events.
</acceptance_criteria>
</task>

<task>
<objective>Add offline indicator to layout</objective>
<read_first>
- src/layouts/AppLayout.vue
- src/composables/useNetwork.ts
</read_first>
<action>
1. In `src/layouts/AppLayout.vue`, import and use the `useNetwork` composable.
2. Add a small fixed banner at the top or bottom of the screen (e.g. `div.fixed.bottom-20.left-1/2` with Tailwind styling) that displays "Você está offline" when `!isOnline`.
3. Use a `<Transition name="fade">` or similar to smoothly animate the banner entering and leaving.
</action>
<acceptance_criteria>
- `AppLayout.vue` imports `useNetwork`.
- A visible offline banner is rendered conditionally based on the network status.
</acceptance_criteria>
</task>

## Verification
- Run `npm run build` to verify the service worker compiles the new Workbox rules successfully.
- Start the preview server and use Chrome DevTools to simulate "Offline" mode.
- Verify that the "Você está offline" banner appears.
- Verify that previous API requests are served from the cache (DevTools Network tab shows Service Worker responding).

## Must Haves
- Runtime caching must not break the application functionality when online.
- The offline banner must be unobtrusive but clearly visible when the connection drops.
