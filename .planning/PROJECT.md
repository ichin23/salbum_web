# Project Context

## What This Is
Salbum Web PWA Transformation. The application is an existing functional project for reviewing and sharing music, albums, and artists. The objective is to transform the mobile web application into a fluid, beautiful, and highly pleasant PWA (Progressive Web App) experience for daily use.

## Core Value
Providing a native-like, fluid, and visually appealing experience on mobile devices without requiring app store installation, allowing users to interact with music reviews and shares seamlessly on the go.

## Current State
- Existing Vue 3, Vite, and Tailwind CSS SPA.
- Integrated with backend at `localhost:8080`, MusicBrainz, Spotify, and Google OAuth.
- No PWA capabilities, caching, or offline support implemented yet.
- See `.planning/codebase/` for detailed architectural state.

## Requirements

### Validated
- ✓ Vue 3 SPA architecture — existing
- ✓ API integration with backend, Spotify, and MusicBrainz — existing
- ✓ Review and music sharing logic — existing

### Active
- [ ] Add Service Worker for caching and offline capabilities
- [ ] Create `manifest.json` for "Add to Home Screen" functionality
- [ ] Implement responsive UI adjustments for mobile fluidity
- [ ] Add touch-friendly interactions (swipes, pull-to-refresh)
- [ ] Implement smooth view transitions and animations

### Out of Scope
- [Backend modifications] — Focus is entirely on the frontend mobile experience.
- [App Store deployment] — Goal is PWA via browser.

## Key Decisions
| Decision | Rationale | Outcome |
|----------|-----------|---------|
| PWA Implementation | Provides app-like experience without app store friction | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-08 after initialization*
