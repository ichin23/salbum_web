# Architecture

## Pattern
Client-side rendered (CSR) Vue Single Page Application (SPA).

## Data Flow
- **State Management**: Vue Composition API `ref` and `computed`. Some global state might be managed via Pinia or shared composables.
- **Services**: Extracted into `src/services/` (e.g., `fetchService.ts`, `reviewService.ts`) for API communication.
- **Composables**: Extracted stateful logic in `src/composables/` (e.g., `useListenList.ts`, `useOAuth.ts`).

## Layers
1. **Views**: Page-level components in `src/views/` handling route parameters and orchestrating data.
2. **Components**: Reusable UI elements in `src/components/`.
3. **Services**: Stateless functions wrapping API calls.
4. **Types**: Centralized TypeScript definitions in `src/types/index.ts`.
