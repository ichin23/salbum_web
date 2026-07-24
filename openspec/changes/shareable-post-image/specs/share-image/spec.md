## ADDED Requirements

### Requirement: User can generate a shareable image from any post
The system SHALL provide a "Compartilhar como imagem" button on feed items (review, quick review, music share) and on detail views. Clicking the button SHALL generate a PNG image of the post content with a branded layout and open a preview modal.

#### Scenario: Share button visible on feed item
- **WHEN** a user views a feed item of type REVIEW, QUICK_REVIEW, or MUSIC_SHARE
- **THEN** the feed item SHALL display a "Compartilhar como imagem" action button

#### Scenario: Share button visible on detail view
- **WHEN** a user views a ReviewDetailView, QuickReviewDetailView, or MusicShareDetailView
- **THEN** the page SHALL display a "Compartilhar como imagem" action button

#### Scenario: Generate image from review
- **WHEN** a user clicks "Compartilhar como imagem" on a review
- **THEN** the system SHALL generate a PNG image that includes: user avatar, user name, post type label "Review", album cover art, album name, artist names, album score (if present), and review text (if present)

#### Scenario: Generate image from quick review
- **WHEN** a user clicks "Compartilhar como imagem" on a quick review
- **THEN** the system SHALL generate a PNG image that includes: user avatar, user name, post type label "Quick Review", album cover art, album name, star rating, sentiment badge (if present), favorite track info (if present), and considerations text (if present)

#### Scenario: Generate image from music share
- **WHEN** a user clicks "Compartilhar como imagem" on a music share
- **THEN** the system SHALL generate a PNG image that includes: user avatar, user name, post type label "Compartilhou", cover art (album/music/artist), title, subtitle, and comment text (if present)

### Requirement: Generated image has branded layout
The generated image SHALL have a consistent branded layout including a Salbum logo/watermark, dark background matching the app theme (or a clean light background), and dimensions optimized for Instagram sharing.

#### Scenario: Image dimensions are Instagram-optimized
- **WHEN** an image is generated
- **THEN** the image dimensions SHALL be 1080×1350 pixels (portrait 4:5 ratio)

#### Scenario: Image includes Salbum branding
- **WHEN** an image is generated
- **THEN** the image SHALL include a "Salbum" watermark or logo at the bottom

#### Scenario: High DPI capture
- **WHEN** an image is generated
- **THEN** the capture SHALL use a scale factor of at least 2 to ensure sharp text and images

### Requirement: Preview modal with download and share options
After generation, the system SHALL display a modal with the generated image preview, a download button, and a share button (using the Web Share API when available).

#### Scenario: Preview modal opens automatically
- **WHEN** image generation completes successfully
- **THEN** a modal SHALL open showing the generated image preview

#### Scenario: Download image
- **WHEN** a user clicks the download button in the modal
- **THEN** the image SHALL be downloaded as a PNG file named "salbum-post-{timestamp}.png"

#### Scenario: Share via native share sheet
- **WHEN** a user clicks the share button and the Web Share API is available
- **THEN** the system SHALL call `navigator.share()` with the image as a File

#### Scenario: Copy image
- **WHEN** a user clicks the copy button in the modal
- **THEN** the image SHALL be copied to the clipboard if supported

### Requirement: Cross-origin images are handled gracefully
If any external image (album art, avatar) cannot be rendered due to CORS restrictions, the system SHALL use a placeholder or solid color fallback.

#### Scenario: Missing album art uses placeholder
- **WHEN** an album has no image_url or the image fails to load
- **THEN** the image layout SHALL use the album initial letter on a colored background as fallback

#### Scenario: CORS-blocked image renders placeholder
- **WHEN** an external image URL fails CORS during capture
- **THEN** the system SHALL fall back to a placeholder without breaking the image generation
