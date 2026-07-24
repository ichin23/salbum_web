## ADDED Requirements

### Requirement: User can like a Quick Review
The system SHALL allow authenticated users to like a Quick Review via POST `/reviews/quick/{id}/like`.

#### Scenario: Like Quick Review
- **WHEN** user clicks the like button on a Quick Review they haven't liked
- **THEN** the system sends POST `/reviews/quick/{id}/like` and the like count increments, button becomes active

#### Scenario: Unlike Quick Review
- **WHEN** user clicks the like button on a Quick Review they already liked
- **THEN** the system sends DELETE `/reviews/quick/{id}/like` and the like count decrements, button becomes inactive

#### Scenario: Check if user liked a Quick Review
- **WHEN** the Quick Review detail loads
- **THEN** the system sends GET `/reviews/quick/{id}/likes/me` and sets the initial liked state

### Requirement: User can comment on a Quick Review
The system SHALL allow authenticated users to add, view, and delete comments on Quick Reviews.

#### Scenario: Add comment
- **WHEN** user submits a comment on a Quick Review
- **THEN** the system sends POST `/reviews/quick/{id}/comments` with `{ "content": "..." }` and displays the new comment

#### Scenario: View comments
- **WHEN** user expands comments on a Quick Review
- **THEN** the system sends GET `/reviews/quick/{id}/comments` and renders the comment list

#### Scenario: Delete comment
- **WHEN** user deletes their own comment
- **THEN** the system sends DELETE `/reviews/quick/comments/{commentId}` and removes it from the list
