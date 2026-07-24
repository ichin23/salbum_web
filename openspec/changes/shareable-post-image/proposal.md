## Why

Users want to share their reviews, quick reviews, and music shares on social media (Instagram, WhatsApp, etc.) as images. Currently there is no way to export a post as a shareable image — users can only share links. Generating a branded image with the post content, album art, score, and user info will increase engagement and bring new users to Salbum.

## What Changes

- Add a "Compartilhar como imagem" button to feed items (FeedItem.vue), ReviewCard.vue, QuickReviewCard.vue, and MusicShare detail views
- Add a new composable `useShareImage` that renders a DOM element to a PNG blob using `html-to-image`
- Create a `ShareImageModal` component that shows a preview of the generated image with download and native share options
- Install `html-to-image` as a new dependency
- The generated image will include: user avatar + name, album art, post type indicator, content text, score (when applicable), and a Salbum watermark/branding

## Capabilities

### New Capabilities
- `share-image`: Generate a shareable PNG image from any post (review, quick review, music share) with branded layout, preview in a modal, download, and native Share API support

### Modified Capabilities
- None

## Impact

- **New dependency**: `html-to-image` (~10KB gzipped)
- **Components**: Add `ShareImageModal.vue`, update `FeedItem.vue`, `ReviewCard.vue`, `QuickReviewCard.vue`, `MusicShareDetailView.vue`, `QuickReviewDetailView.vue`
- **Composables**: New `useShareImage.ts` composable
- **No API changes** — all work is client-side DOM rendering
