---
wave: 1
depends_on: Phase 1
autonomous: true
requirements: [REV-01, REV-02]
---

# Phase 2: Review Details Page

## Objective
Create the dedicated route and view for a single review.

## Tasks

### [1] Add `getReview` API method
<action>
Modify `src/services/reviewService.ts`:
Add `export function getReview(id: string): Promise<FullReviewDTO> { return apiRequest<FullReviewDTO>(`/reviews/${id}`) }`
</action>
<read_first>
- src/services/reviewService.ts
</read_first>
<acceptance_criteria>
- `src/services/reviewService.ts` contains `export function getReview(id: string)` and maps to `GET /reviews/${id}`
</acceptance_criteria>

### [2] Create `ReviewDetailView.vue`
<action>
Create `src/views/ReviewDetailView.vue`.
Must use `getReview` from `reviewService` using `route.params.id` on mount.
Design: Should display the album cover prominently, user details, full content, track scores, emotion chart (reuse `EmotionChart` component), and like button.
Must use modern, rich aesthetics (dark mode, glassmorphism, dynamic design) as per project guidelines. 
Handle loading and error states.
</action>
<read_first>
- src/components/review/ReviewCard.vue
- src/views/AlbumDetailView.vue
</read_first>
<acceptance_criteria>
- `src/views/ReviewDetailView.vue` is created and uses `getReview` to fetch data.
- UI displays author details, album information, review content, and score.
</acceptance_criteria>

### [3] Add route for Review Details
<action>
Modify `src/router/index.ts` to add the route `reviews/:id` mapped to `ReviewDetailView.vue` under the main `AppLayout` children.
Name the route `review-detail`.
</action>
<read_first>
- src/router/index.ts
</read_first>
<acceptance_criteria>
- `src/router/index.ts` contains `{ path: 'reviews/:id', name: 'review-detail', component: () => import('../views/ReviewDetailView.vue') }`
</acceptance_criteria>

### [4] Make `ReviewCard.vue` clickable
<action>
Modify `src/components/review/ReviewCard.vue`.
Make the outer `div` clickable (add `@click="navigateToReview"` and `cursor-pointer`).
In `navigateToReview`, call `router.push({ name: 'review-detail', params: { id: review.value.id } })`.
Ensure existing interactive elements (user profile link, action menu, like button, expand/collapse tracklist, spotify link, edit inputs) have `@click.stop` so they don't trigger the card click.
</action>
<read_first>
- src/components/review/ReviewCard.vue
</read_first>
<acceptance_criteria>
- Clicking the body of a ReviewCard triggers a router navigation to `review-detail`.
- The card has `cursor-pointer` class.
- Interactive elements do not trigger navigation.
</acceptance_criteria>

## Verification Criteria
- `npm run build` succeeds (no typescript errors)
- `grep "getReview" src/services/reviewService.ts` returns the function definition
- `src/router/index.ts` has the new route.

## Must Haves
- `ReviewCard.vue` outer div is clickable and routes to `review-detail`
- `ReviewDetailView.vue` fetches and displays review data correctly
