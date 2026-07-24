## 1. Types

- [x] 1.1 Add QuickReview DTOs types to `src/types/index.ts`: `CreateQuickReviewRequest`, `UpdateQuickReviewRequest`, `QuickReviewDTO`, `FullQuickReviewDTO`, `QuickReviewCommentDTO`, `QuickReviewFeelingOption`

## 2. API Service

- [x] 2.1 Create `src/services/quickReviewService.ts` with functions: `getQuickReviewsByAlbum`, `getQuickReviewById`, `createQuickReview`, `updateQuickReview`, `deleteQuickReview`, `likeQuickReview`, `unlikeQuickReview`, `checkQuickReviewLike`, `getQuickReviewComments`, `addQuickReviewComment`, `deleteQuickReviewComment`, `getQuickReviewFeelings`

## 3. Sentiment Badge Picker Component

- [x] 3.1 Create `src/components/review/SentimentBadgePicker.vue` — fetches feelings from `/reviews/quick/feelings`, renders colored badges grouped by category, allows free-text input alongside badges

## 4. Quick Review Form Component

- [x] 4.1 Create `src/components/review/QuickReviewForm.vue` — form with StarRating (max=5), SentimentBadgePicker, ImageUploadButton, favorite track dropdown (when targetType=ALBUM), considerations textarea
- [x] 4.2 Handle edit mode (pre-fill with existing QuickReviewDTO data)

## 5. Quick Review Card Component

- [x] 5.1 Create `src/components/review/QuickReviewCard.vue` — displays user info, score stars, sentiment badge, photo, favorite track, considerations, like button, comment toggle, edit/delete actions
- [x] 5.2 Add like/unlike interaction with optimistic UI

## 6. Quick Review Comments Component

- [x] 6.1 Create `src/components/review/QuickReviewComments.vue` — comment list with add/delete, adapting existing ReviewComments patterns to `/reviews/quick/` endpoints

## 7. Album Detail Integration

- [x] 7.1 Add "Avaliações Rápidas" section to `AlbumDetailView.vue` — fetch and display QuickReviewCard list
- [x] 7.2 Add "Avaliação Rápida" button to trigger QuickReviewForm modal
- [x] 7.3 Handle 409 conflict on duplicate review (show error if user already reviewed)
- [x] 7.4 Disable/create button if user already has a Quick Review for this album

## 8. Quick Review Detail Route

- [x] 8.1 Add route `/quick-reviews/:id` in `src/router/index.ts`
- [x] 8.2 Create simple detail view or repurpose existing detail pattern for FullQuickReviewDTO display

## 9. Error Handling & Polish

- [x] 9.1 Handle all error states: 400 validation, 403 forbidden, 404 not found, 409 conflict
- [x] 9.2 Add loading states and empty states for Quick Review list
- [x] 9.3 Ensure StarRating component works correctly with max=5 for the Quick Review score
