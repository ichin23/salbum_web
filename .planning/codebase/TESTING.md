# Testing

## Current State
- No obvious testing framework (Jest/Vitest) configuration files are actively used in the current focus scope.
- Manual testing and browser verification appear to be the primary validation method.

## Recommendations
- Introduce `Vitest` for fast unit testing of composables and services.
- Implement component testing with `Vue Test Utils` to ensure UI regressions do not occur during major refactors (like the upcoming PWA transition).
