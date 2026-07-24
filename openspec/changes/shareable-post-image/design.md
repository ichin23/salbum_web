## Context

Salbum is a Vue 3 SPA that renders three post types (review, quick review, music share) in a unified feed (`FeedItem.vue`) and in detail views. Currently there is no way to export a post as an image. The app uses Tailwind CSS with CSS custom properties for theming (`--color-surface`, `--color-primary`, etc.), has no canvas/DOM-to-image libraries installed, and targets modern browsers with the Share API available on mobile.

## Goals / Non-Goals

**Goals:**
- Add a "Compartilhar como imagem" button to feed items and detail views
- Generate a PNG image by rendering a hidden DOM element with `html-to-image`
- Show a preview modal with download and native Share Sheet (Web Share API) options
- Support all three post types with a consistent branded layout
- Keep image dimensions Instagram-optimal (e.g., 1080×1080 or 1080×1350)

**Non-Goals:**
- Server-side image generation (all client-side)
- Video generation
- Editing the image before sharing
- Batch/multi-post image generation

## Decisions

1. **html-to-image over html2canvas**
   - `html-to-image` is lighter, uses modern `toBlob` API with `dom-to-image` internals rewritten in TypeScript, and has better TypeScript support. `html2canvas` is heavier and has known layout quirks.

2. **Hidden DOM element over Canvas API**
   - Rendering a hidden DOM element with `html-to-image` reuses existing Vue templates and Tailwind styling, avoiding manual canvas drawing. A hidden wrapper div is rendered off-screen with `position: fixed; left: -9999px`.

3. **ShareImageModal over inline preview**
   - A modal gives users full control to preview, download, or use the native share sheet. It matches the existing modal pattern (`QuickPostModal`, `MusicShareModal`).

4. **Separate composable `useShareImage`**
   - Encapsulates the capture logic (DOM setup → html-to-image → blob → actions) so it can be reused from any component without duplication.

5. **Instagram-optimized portrait format (1080×1350)**
   - Portrait 4:5 ratio is the most shareable format for Instagram feeds and Stories. Landscape photos are cropped or padded.

## Risks / Trade-offs

- **[Image quality]** `html-to-image` may produce lower-quality text rendering compared to manual canvas → Mitigation: use high DPI scale factor (2x or 3x) when capturing
- **[Cross-origin images]** Album art and user avatars from external URLs may fail to render if CORS headers are missing → Mitigation: ensure images are fetched with `crossOrigin="anonymous"` or pre-converted; in worst case, fall back to placeholder
- **[DOM complexity]** Capturing complex nested layouts may produce visual artifacts → Mitigation: keep the share layout simple with a dedicated template separate from the feed card
