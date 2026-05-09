# Milestone v1.1 Requirements

## Force Search Option
- [ ] **SEARCH-01**: User can toggle a "force external search" option in the search view UI.
- [ ] **SEARCH-02**: The search API calls (`/artists` and `/search`) send a `force=true` parameter when the option is enabled.
- [ ] **SEARCH-03**: When adding a new artist (in Create/Edit album flow), the system automatically forces the external fetch to ensure accurate and complete data is retrieved.

## Future Requirements
- Allow users to force-refresh an existing artist's profile data manually from their page (sync).

## Out of Scope
- Backend implementation (assumed to be handled separately or already supporting `force=true`).
