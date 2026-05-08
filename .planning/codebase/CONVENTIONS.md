# Conventions

## Code Style
- Vue Single File Components (SFCs) using `<script setup lang="ts">`.
- Strict typing with TypeScript interfaces defined in `src/types/index.ts`.
- Use of Vue `ref` and `computed` for reactivity.

## Error Handling
- Standard `try/catch` blocks in asynchronous `onMounted` hooks.
- Errors are stored in an `error.value` ref and displayed in the UI using fallback templates (`v-else-if="error"`).
- API wrappers return typed Promises.

## UI Patterns
- Extensive use of Lucide icons (`lucide-vue-next`).
- Fallback images and loading spinners (`Loader2 animate-spin`) during data fetching.
- CSS utility classes for styling and responsive design.
