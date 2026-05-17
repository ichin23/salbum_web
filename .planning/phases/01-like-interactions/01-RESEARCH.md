# Phase 01: Like Interactions - Research

## Goal
Research how to implement Phase 1: Like Interactions.
"What do I need to know to PLAN this phase well?"

## Current State Analysis
1. **API & Service Layer**: 
   - The backend API already supports likes (`POST /reviews/{id}/like` and `DELETE /reviews/{id}/like`).
   - `src/services/reviewService.ts` already has `likeReview` and `unlikeReview` exported.
   - The frontend types `FullReviewDTO` and `FullReviewInfoDTO` in `src/types/index.ts` already have `likeCount` and `likedByCurrentUser` fields.

2. **UI Layer - `ReviewCard.vue`**:
   - `src/components/review/ReviewCard.vue` (used in `AlbumDetailView.vue`) **already implements** `toggleLike` logic and the Heart UI component perfectly. It holds local `liked` and `likeCount` state to optimistically update the UI.

3. **UI Layer - `FeedItem.vue`**:
   - The feed (Home, Profile) uses `src/components/FeedItem.vue`.
   - `FeedItem.vue` does **not** have the like logic or the Like UI button. It only displays the review content, emotion chart, and an edit/delete menu.

## Gap Analysis (What needs to be done)
To satisfy LIKE-01, LIKE-02, and LIKE-03 across the app (Feed and Details):
- We must add the Like UI and logic to `FeedItem.vue` for review items.
- The logic will mirror `ReviewCard.vue`: local `ref`s for `liked` and `likeCount` initialized from `props.item.review`, and an async `toggleLike()` method that calls the API and updates the local state.
- Add the Heart button to the bottom of the review content in `FeedItem.vue`.

## Implementation Considerations
- **Phase 2 (Details Page)**: The details page doesn't exist yet, but once it does, it will likely use `ReviewCard.vue` which already supports likes. We only need to focus on adding likes to `FeedItem.vue` so that the feed supports it.
- **MusicShares**: The requirements only mention "review cards", and backend `MusicShareDTO` does not currently include `likedByCurrentUser` in the types. We will only implement the Like button for items where `isReview` is true.

## Conclusion for Planning
The work is purely frontend and highly localized.
The planner only needs to instruct the modification of `src/components/FeedItem.vue` to add the like toggling logic and UI (using `lucide-vue-next`'s `Heart` icon) for review items, matching the UX pattern already established in `ReviewCard.vue`.
