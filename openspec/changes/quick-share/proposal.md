## Why

Users currently have two ways to express opinions: full reviews (detailed, music-by-music) and music shares (simple share with comment). There's no lightweight middle ground — a quick rating with a sentiment badge, optional photo, and favorite track. This gaps users who want to rate and share an opinion quickly without writing a full review. The backend already exposes `/reviews/quick/*` endpoints for this purpose; the frontend needs to implement the UI.

## What Changes

- **New "Quick Review" feature** accessible from the album detail page (and eventually music detail page)
- **Quick Review creation form** as a modal/sheet: star rating (0–5), sentiment badges + free text, optional photo upload, optional favorite track picker (album only), optional considerations text
- **Quick Review list** displayed on album detail page, separate from full reviews
- **Quick Review detail view** with like/comment support (reusing existing comment patterns)
- **Add "Quick Reviews" tab** to the album detail page alongside existing sections

## Capabilities

### New Capabilities

- `quick-review-crud`: Create, read, update, and delete Quick Reviews via `/reviews/quick/*` endpoints
- `quick-review-interaction`: Like/unlike and comment on Quick Reviews
- `quick-review-feelings`: Fetch and display sentiment badge options from `/reviews/quick/feelings`

### Modified Capabilities

- *(none — no existing spec requirements are changing)*

## Impact

- **New service**: `src/services/quickReviewService.ts`
- **New composer/store**: `src/composables/useQuickReview.ts` (or dedicated store if needed)
- **New types**: QuickReview DTOs in `src/types/index.ts`
- **New components**: `QuickReviewForm.vue`, `QuickReviewCard.vue`, `QuickReviewComments.vue` (or reuse `ReviewComments.vue` if adaptable), `SentimentBadgePicker.vue`
- **Modified components**: `AlbumDetailView.vue` — add Quick Review section with creation trigger and listing
- **New route**: `quick-reviews/:id` for quick review detail (or reuse review detail pattern)
- **New route**: maybe `album/:id/quick-review` for creation page (or modal)
