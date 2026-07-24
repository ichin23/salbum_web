## ADDED Requirements

### Requirement: User can create a Quick Review
The system SHALL allow authenticated users to create a Quick Review on an album or music via POST `/reviews/quick`.

#### Scenario: Create Quick Review on album
- **WHEN** user submits the Quick Review form with valid data (score 0–5, sentiment "Energético", targetType "ALBUM", albumId)
- **THEN** the system sends POST `/reviews/quick` and displays the new QuickReviewDTO in the list

#### Scenario: Create Quick Review with favorite track
- **WHEN** user selects a favorite track and adds an optional comment
- **THEN** the system includes `favoriteTrackId` and `favoriteTrackComment` in the request body

#### Scenario: Create Quick Review with photo
- **WHEN** user uploads a photo (receives URL) and submits the form
- **THEN** the system includes `photoUrl` in the request body

#### Scenario: Duplicate Quick Review returns error
- **WHEN** user tries to create a second Quick Review for the same album
- **THEN** the system shows an error message and does not create the review

### Requirement: User can read Quick Reviews by album
The system SHALL display all Quick Reviews for a given album via GET `/reviews/quick/album/{albumId}`.

#### Scenario: Load Quick Reviews on album page
- **WHEN** album detail page loads
- **THEN** the system fetches and renders all Quick Reviews for that album

#### Scenario: Empty Quick Reviews list
- **WHEN** album has no Quick Reviews
- **THEN** the system shows an empty state message ("Nenhuma avaliação rápida ainda")

### Requirement: User can read a single Quick Review
The system SHALL return full Quick Review details (with like count, likedByCurrentUser, comment count) via GET `/reviews/quick/{id}`.

#### Scenario: View Quick Review detail
- **WHEN** user navigates to a Quick Review detail view
- **THEN** the system fetches `FullQuickReviewDTO` and renders it

### Requirement: User can update their own Quick Review
The system SHALL allow the review author to update score, sentiment, photoUrl, favoriteTrackId, favoriteTrackComment, and considerations via PUT `/reviews/quick/{id}`.

#### Scenario: Edit Quick Review
- **WHEN** user edits their own Quick Review and submits
- **THEN** the system sends PUT `/reviews/quick/{id}` and updates the displayed data

#### Scenario: Edit another user's Quick Review returns error
- **WHEN** user tries to edit a Quick Review they do not own
- **THEN** the system shows a 403 error

### Requirement: User can delete their own Quick Review
The system SHALL allow the review author to delete their Quick Review via DELETE `/reviews/quick/{id}`.

#### Scenario: Delete Quick Review
- **WHEN** user confirms deletion of their own Quick Review
- **THEN** the system sends DELETE `/reviews/quick/{id}` and removes it from the list
