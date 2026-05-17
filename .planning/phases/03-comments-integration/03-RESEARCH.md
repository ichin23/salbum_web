# Phase 3: Comments Integration — Research

## Existing Infrastructure

### Types Already Defined
- `ReviewCommentDTO` in `src/types/index.ts` (L403-409): `{ id, user: UserInfoDTO, content, createdAt }`
- `commentCount` field exists on both `FullReviewDTO` (L283) and `FullReviewInfoDTO` (L291)
- Comment count is already displayed in `ReviewDetailView.vue` (L199) as a static button (`{{ review.commentCount }} comentários`) with a `<!-- TODO: Comments logic in next phase -->` marker

### Backend API Endpoints (Inferred from Pattern)
Following the same convention as likes (`/reviews/{id}/like`), the comment endpoints are:
- `GET /reviews/{id}/comments` → `ReviewCommentDTO[]`
- `POST /reviews/{id}/comments` → body: `{ content: string }` → `ReviewCommentDTO`

### Existing Patterns to Follow
1. **Service layer pattern** (`reviewService.ts`): Each function wraps `apiRequest<T>()` from `apiClient.ts` with a JSDoc comment describing the endpoint.
2. **Like toggle pattern** (`ReviewDetailView.vue` L41-59): Optimistic UI with `liking` ref to prevent double-clicks, try/catch with silent ignore on failure.
3. **ReviewCard footer** (`ReviewCard.vue` L370-396): Currently shows like button and Spotify link. Comment count is NOT shown here yet.
4. **FeedItem review footer** (`FeedItem.vue` L394-407): Same pattern — likes only, no comment count.

### ReviewDetailView.vue Integration Points
- **Interaction bar** (L184-206): Already has the comment count button at L196-200, just needs to be wired up to scroll to/toggle the comments section.
- The view already imports `MessageSquare` icon from lucide.
- Component follows dark-mode glassmorphism design with `bg-[var(--color-surface)]`, `border-[var(--color-border)]`, `rounded-3xl` cards.

### ReviewCard.vue Integration Points
- Footer at L370-396 is the insertion point for comment count display.
- The card already uses `@click.stop` on interactive elements to prevent card navigation.

### FeedItem.vue Integration Points
- Review footer at L394-407 needs comment count badge.
- Already imports `MessageSquare` (L7).

## Implementation Approach

### 1. Comment Service Functions
Add to `reviewService.ts`:
- `getReviewComments(reviewId: string): Promise<ReviewCommentDTO[]>`
- `addReviewComment(reviewId: string, content: string): Promise<ReviewCommentDTO>`

### 2. Comments Section Component
Create `src/components/review/ReviewComments.vue`:
- Props: `reviewId: string`
- Fetches comments on mount via `getReviewComments`
- Displays comment list with user avatar, username, content, date
- Includes a form (textarea + submit button) for adding new comments
- Optimistic UI: append new comment immediately, rollback on error
- Loading and empty states

### 3. ReviewDetailView.vue Updates
- Import and mount `ReviewComments` below the interaction bar
- Wire the comment count button to scroll to the comments section
- Update `commentCount` locally when a new comment is added

### 4. Comment Count on Cards
- `ReviewCard.vue`: Add `MessageSquare` icon + `item.commentCount` in footer alongside the like button
- `FeedItem.vue`: Add comment count in the review footer section

## Risk Assessment
- **Low risk**: All types are pre-defined, API pattern is well-established
- **No routing changes needed**: Comments render on the existing review detail page
- **No new dependencies**: Uses existing lucide icons and `apiRequest` helper

## RESEARCH COMPLETE
