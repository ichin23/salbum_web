## Context

Salbum-web is a Vue 3 + TypeScript SPA with Pinia stores, Vue Router, Axios (via `apiClient.ts`), and TailwindCSS. It already has full review (detailed) and music share features with patterns for CRUD, likes, comments, and feelings. The Quick Review feature mirrors the backend's `/reviews/quick/*` endpoints and follows existing conventions.

The backend already exposes all required endpoints. No backend changes are needed — this is a pure frontend implementation.

## Goals / Non-Goals

**Goals:**
- Allow users to create Quick Reviews from the album detail page via a modal/sheet
- Display Quick Reviews in a dedicated section on the album detail page
- Support inline editing/deletion by the review author
- Support likes and comments on Quick Reviews
- Fetch and display sentiment badge options from `/reviews/quick/feelings`

**Non-Goals:**
- Quick Review on music detail page (future scope)
- WebSocket real-time updates for new Quick Reviews (can be added later)
- Push notifications for Quick Review interactions
- Quick Review in the activity feed (backend integration scope)

## Decisions

1. **Modal over dedicated route** — Creating a Quick Review will use a modal component triggered from the album detail page, not a separate route. Rationale: the form is lightweight (less fields than a full review). Matches the existing `MusicShareModal` pattern (`components/share/MusicShareModal.vue`), which is also a modal.

2. **Separate service file** — A new `quickReviewService.ts` following the exact pattern of `reviewService.ts` and `musicShareService.ts`. Each endpoint maps to a typed function using `apiRequest<T>()`.

3. **New types in types/index.ts** — Add QuickReview-specific DTOs (`QuickReviewDTO`, `FullQuickReviewDTO`, `CreateQuickReviewRequest`, `UpdateQuickReviewRequest`, `QuickReviewCommentDTO`, `FeelingOption`) alongside existing review types. The feelings endpoint returns a simpler structure than the existing `/reviews/feelings` (no emoji/intensity fields).

4. **Dedicated components** — Create `QuickReviewCard.vue` (display card), `SentimentBadgePicker.vue` (badge selector + free text), `QuickReviewForm.vue` (creation/editing form). Reuse existing `StarRating.vue` (with `max=5` instead of default 10), `ImageUploadButton.vue`, and `MusicShareModal.vue` styling patterns.

5. **Inline list on album page** — Quick Reviews display in a vertical list below the album info, in a new "Avaliações Rápidas" tab/section alongside existing sections. No dedicated feed page — they live where they're created.

6. **Comment component reuse** — Create `QuickReviewComments.vue` adapting `ReviewComments.vue` to the QuickReview endpoints. The logic is identical but the endpoints differ (`/reviews/quick/{id}/comments` vs `/reviews/{id}/comments`).

7. **No Pinia store** — Use a composable (`useQuickReview.ts`) for API calls and state management per-component, following the lightweight pattern of `useListenList.ts`. A store is unnecessary since Quick Review state is page-scoped.

## Risks / Trade-offs

- **1 Quick Review per user per album** → The backend returns 409 on duplicates. The UI must handle this gracefully (show error toast/message). Consider disabling the "New Quick Review" button if user already has one.
- **Sentiment free-text vs badge** → User can pick a badge OR type freely. The free-text input acts as both a search/filter over badges and a custom input. If the typed text matches a badge value, send the value. Otherwise send the raw text.
- **StarRating max=5** → The existing `StarRating` defaults to `max=10` (converting to 5 half-stars). For Quick Review, we need `max=5` (5 full stars). The component already supports this via the `max` prop.
- **Photo upload** → Uses the same `ImageUploadButton.vue` with an upload callback, same as album/artist image upload flow.

## Open Questions

- Should Quick Reviews appear in the activity feed? The backend may already include them; unclear from docs.
