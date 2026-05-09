# Roadmap: Milestone v1.1 Force Artist Search Fetch

## Phases

### Phase 1: Frontend Search Enhancements
- **Goal**: Implement the UI and API parameter logic to force an external artist search and bypass partial local matches.
- **Requirements**: SEARCH-01, SEARCH-02, SEARCH-03
- **Success Criteria**:
  1. A "Force Search" toggle or button is visible in the search UI.
  2. Search requests include `?force=true` when the user enables the option.
  3. When an artist is added (Create/Edit album views), the search API call also includes the `force=true` parameter.
