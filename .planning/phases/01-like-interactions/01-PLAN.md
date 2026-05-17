---
phase: 1
status: pending
---

# Phase 1: Like Interactions - Execution Plan

## 1. Goal
Implement like/unlike functionality and like counts on the existing review cards in the feed, satisfying LIKE-01, LIKE-02, and LIKE-03.

## 2. Approach
The existing `ReviewCard.vue` component already fully implements the Like functionality, including optimistic UI updates and API integration. However, the feed uses `FeedItem.vue` which does not currently have this implementation for reviews.

We will update `src/components/FeedItem.vue` to:
- Maintain local reactive state for `liked` and `likeCount`, initialized from the `props.item.review` object (when the item is a review).
- Implement a `toggleLike` function identical to the one in `ReviewCard.vue`.
- Render the Heart icon in the footer of the `FeedItem.vue` article (for reviews only).

## 3. Implementation Steps

### Wave 1: UI and Logic Updates

**Task 1.1: Add Local State and Logic to `FeedItem.vue`**
- In `<script setup lang="ts">`, add `import { likeReview, unlikeReview } from "../services/reviewService";`.
- Add local refs for `liked` and `likeCount`. Initialize them from `review.value?.review.likedByCurrentUser` and `review.value?.review.likeCount` respectively.
- Implement the `toggleLike` async function (using `liking` ref to prevent double-clicks).
- Ensure this state only applies when `isReview` is true.

**Task 1.2: Add Heart Icon to the UI**
- Add `Heart` from `lucide-vue-next` to the imports if not already imported.
- In the template, inside the `v-if="isReview && review"` block (at the bottom, alongside the emotion chart toggle and Spotify link), add the Like button.
- The button should display the `likeCount` and have a visual indication (e.g., filled red icon) if `liked` is true.

## 4. Verification

Since there are no automated UI tests, validation will be performed manually:
1. Open the application feed (`HomeView`).
2. Find a review card.
3. Verify that the like count is displayed.
4. Click the heart icon; verify that the count increments and the heart turns red (if previously unliked).
5. Refresh the page and verify the like status is preserved.

<automated_tests>
npm run build
</automated_tests>
