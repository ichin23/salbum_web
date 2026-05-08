# Directory Structure

```text
src/
├── components/    # Reusable UI components (e.g., AppImage.vue, MusicShareModal.vue)
├── composables/   # Vue composables (e.g., useListenList.ts)
├── layouts/       # Layout components (e.g., AppLayout.vue)
├── services/      # API communication (e.g., fetchService.ts)
├── types/         # TypeScript interfaces (e.g., index.ts)
├── views/         # Page components (e.g., AlbumDetailView.vue, ArtistDetailView.vue)
├── main.ts        # App entry point
└── style.css      # Global styles
```

## Naming Conventions
- **Components/Views**: PascalCase (`AlbumDetailView.vue`, `AppImage.vue`)
- **Composables**: camelCase prefixed with `use` (`useListenList.ts`)
- **Services**: camelCase suffixed with `Service` (`fetchService.ts`)
