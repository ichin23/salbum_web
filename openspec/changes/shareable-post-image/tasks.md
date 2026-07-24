## 1. Setup

- [x] 1.1 Install `html-to-image` dependency via npm
- [x] 1.2 Create `useShareImage` composable at `src/composables/useShareImage.ts` encapsulating html-to-image capture logic with configurable scale factor

## 2. ShareImageLayout component

- [x] 2.1 Create `ShareImageLayout.vue` — a hidden off-screen component with a dedicated template for generating the share image, supporting review, quick review, and music share data via props
- [x] 2.2 Implement branded layout: dark background, rounded album art, user avatar + name, post type badge, content text, score/rating display, and "Salbum" watermark at bottom
- [x] 2.3 Handle fallback placeholders for missing or CORS-blocked images using initial letters on colored backgrounds

## 3. ShareImageModal component

- [x] 3.1 Create `ShareImageModal.vue` — a modal that shows the generated PNG preview, matching the existing modal patterns (overlay, close button, transitions)
- [x] 3.2 Add download button that saves the PNG as `salbum-post-{timestamp}.png`
- [x] 3.3 Add share button that calls `navigator.share()` with the image file when available
- [x] 3.4 Add copy-to-clipboard button for the image

## 4. Integrate into feed items

- [x] 4.1 Add "Compartilhar como imagem" button to `FeedItem.vue` for all three post types (review, quick review, music share)
- [x] 4.2 Wire up click to pass post data to the composable and open ShareImageModal

## 5. Integrate into detail views

- [x] 5.1 Add "Compartilhar como imagem" button to `ReviewDetailView.vue`
- [x] 5.2 Add "Compartilhar como imagem" button to `QuickReviewDetailView.vue`
- [x] 5.3 Add "Compartilhar como imagem" button to `MusicShareDetailView.vue`

## 6. Polish

- [x] 6.1 Test all three post types generate correct images
- [x] 6.2 Handle loading state while image is being generated (skeleton or spinner)
- [x] 6.3 Handle error state if image generation fails (show error message in modal)
