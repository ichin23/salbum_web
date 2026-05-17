---
wave: 1
depends_on: Phase 2
autonomous: true
requirements: [COM-01, COM-02, COM-03]
files_modified:
  - src/services/reviewService.ts
  - src/components/review/ReviewComments.vue
  - src/views/ReviewDetailView.vue
  - src/components/review/ReviewCard.vue
  - src/components/FeedItem.vue
---

# Phase 3: Comments Integration

<objective>
Integrate the comments section into the review details page: fetch and display comments, allow posting new comments, and show comment counts on review cards and feed items.
</objective>

<tasks>

### [1] Add comment API functions to reviewService.ts

<read_first>
- src/services/reviewService.ts
- src/types/index.ts (ReviewCommentDTO at L403-409)
</read_first>

<action>
Add two functions to `src/services/reviewService.ts`:
1. `getReviewComments(reviewId: string): Promise<ReviewCommentDTO[]>` — calls `GET /reviews/${reviewId}/comments`
2. `addReviewComment(reviewId: string, content: string): Promise<ReviewCommentDTO>` — calls `POST /reviews/${reviewId}/comments` with body `{ content }`
Import `ReviewCommentDTO` from `../types` in the existing import statement.
</action>

<acceptance_criteria>
- `src/services/reviewService.ts` contains `export function getReviewComments(reviewId: string): Promise<ReviewCommentDTO[]>`
- `src/services/reviewService.ts` contains `export function addReviewComment(reviewId: string, content: string): Promise<ReviewCommentDTO>`
- `getReviewComments` maps to `GET /reviews/${reviewId}/comments`
- `addReviewComment` maps to `POST /reviews/${reviewId}/comments` with body `{ content }`
- `ReviewCommentDTO` is imported from `../types`
</acceptance_criteria>

### [2] Create ReviewComments.vue component

<read_first>
- src/types/index.ts (ReviewCommentDTO, UserInfoDTO)
- src/components/review/ReviewCard.vue (design patterns, card styles)
- src/views/ReviewDetailView.vue (dark-mode glassmorphism design tokens: bg-[var(--color-surface)], border-[var(--color-border)], rounded-3xl)
- src/components/AppImage.vue (avatar rendering)
</read_first>

<action>
Create `src/components/review/ReviewComments.vue` with:

Props: `reviewId: string`, `initialCount: number`
Emits: `countUpdated(newCount: number)`

Script setup:
- Import `getReviewComments`, `addReviewComment` from `../../services/reviewService`
- Import `AppImage` from `../AppImage.vue`
- Import `Loader2`, `Send`, `MessageSquare` from `lucide-vue-next`
- `comments` ref array of `ReviewCommentDTO`, `loading` ref, `error` ref
- `newComment` ref string, `submitting` ref boolean
- On mount, fetch comments via `getReviewComments(props.reviewId)`
- `submitComment` async function: validates non-empty, calls `addReviewComment`, unshifts result into `comments`, clears `newComment`, emits `countUpdated` with new count
- Format date helper using `pt-BR` locale (same pattern as ReviewCard)

Template:
- Outer div with `bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 sm:p-8 shadow-xl`
- Header: `h3` with MessageSquare icon + "Comentários" title
- Comment form at top: textarea with `bg-[var(--color-surface-2)]` styling, Send button with `bg-primary` styling, disabled when empty or submitting
- Loading state: `Loader2` spinner
- Empty state: muted text "Nenhum comentário ainda. Seja o primeiro!"
- Comment list: each comment shows user avatar (AppImage, type="artist", rounded="full"), username (router-link to user-profile), formatted date, and content text
</action>

<acceptance_criteria>
- `src/components/review/ReviewComments.vue` exists and compiles
- Component accepts `reviewId` and `initialCount` props
- Component emits `countUpdated` event when a new comment is posted
- Comments are fetched on mount using `getReviewComments`
- New comments can be submitted via `addReviewComment`
- Comment form has a textarea and submit button
- Each comment displays user avatar, username, date, and content
- Design uses project dark-mode tokens (--color-surface, --color-border, etc.)
</acceptance_criteria>

### [3] Integrate ReviewComments into ReviewDetailView.vue

<read_first>
- src/views/ReviewDetailView.vue
- src/components/review/ReviewComments.vue (the component created in task 2)
</read_first>

<action>
Modify `src/views/ReviewDetailView.vue`:
1. Import `ReviewComments` from `../components/review/ReviewComments.vue`
2. Add a `localCommentCount` ref initialized from `review.value.commentCount` (set after fetch completes in onMounted)
3. Add `ReviewComments` component after the interaction bar div (after L206), inside the `px-4 sm:px-8 max-w-4xl mx-auto` container. Pass `:review-id="review.review.id"` and `:initial-count="localCommentCount"`. Listen to `@countUpdated="localCommentCount = $event"`.
4. Replace the static comment count in the interaction bar button (L199) with `{{ localCommentCount }} comentários`
5. Wire the comment button `@click` to scroll to the comments section using a template ref
6. Remove the `<!-- TODO: Comments logic in next phase -->` comment at L196
</action>

<acceptance_criteria>
- `ReviewDetailView.vue` imports and renders `ReviewComments` component
- Comments section appears below the interaction bar
- The comment count button in the interaction bar scrolls to the comments section on click
- `localCommentCount` updates when a new comment is posted via the `countUpdated` event
- The TODO comment is removed
- `npm run build` succeeds
</acceptance_criteria>

### [4] Add comment count to ReviewCard.vue footer

<read_first>
- src/components/review/ReviewCard.vue (footer section L370-396)
</read_first>

<action>
Modify `src/components/review/ReviewCard.vue`:
1. Import `MessageSquare` from `lucide-vue-next` (add to the existing import destructuring)
2. In the footer div (L371-396), add a comment count display between the like button and the Spotify link:
   ```
   <span class="flex items-center gap-1.5 text-xs text-muted">
     <MessageSquare class="w-4 h-4" />
     {{ item.commentCount }}
   </span>
   ```
   This is a non-interactive display (clicking the card itself already navigates to the detail page where comments are shown).
</action>

<acceptance_criteria>
- `ReviewCard.vue` imports `MessageSquare` from `lucide-vue-next`
- The footer displays `item.commentCount` with a MessageSquare icon
- The comment count is styled as `text-xs text-muted` matching the existing footer aesthetic
- `npm run build` succeeds
</acceptance_criteria>

### [5] Add comment count to FeedItem.vue review footer

<read_first>
- src/components/FeedItem.vue (review footer L394-407)
</read_first>

<action>
Modify `src/components/FeedItem.vue`:
In the review footer div (L394-407), after the like button, add a comment count display:
```
<span class="flex items-center gap-1.5 text-xs text-muted">
  <MessageSquare class="w-3.5 h-3.5" />
  {{ review.commentCount }}
</span>
```
`MessageSquare` is already imported (L7). The `review` computed already provides access to `commentCount` via `FullReviewInfoDTO`.
</action>

<acceptance_criteria>
- `FeedItem.vue` review footer displays comment count with MessageSquare icon
- Uses the already-imported `MessageSquare` icon
- Styled consistently with the like button (`text-xs text-muted`)
- `npm run build` succeeds
</acceptance_criteria>

</tasks>

<verification>
1. `npm run build` — no TypeScript errors
2. `grep "getReviewComments\|addReviewComment" src/services/reviewService.ts` — both functions exist
3. `ls src/components/review/ReviewComments.vue` — component file exists
4. `grep "ReviewComments" src/views/ReviewDetailView.vue` — component is imported and used
5. `grep "MessageSquare" src/components/review/ReviewCard.vue` — icon imported
6. `grep "commentCount" src/components/FeedItem.vue` — count displayed
</verification>

<success_criteria>
- Comments are fetched and displayed on the review details page (COM-01)
- A form allows the user to submit a new comment (COM-02)
- The total comment count is shown on the review card and details page (COM-03)
</success_criteria>

<must_haves>
- ReviewComments component fetches and renders comment list
- Comment submission form with optimistic UI
- Comment count visible on ReviewCard footer
- Comment count visible on FeedItem review footer
- Comment count on ReviewDetailView updates after posting
</must_haves>
