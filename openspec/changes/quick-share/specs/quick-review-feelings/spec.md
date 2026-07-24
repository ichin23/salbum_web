## ADDED Requirements

### Requirement: System provides sentiment options for Quick Reviews
The system SHALL fetch available sentiment options from GET `/reviews/quick/feelings` and display them as selectable badges.

#### Scenario: Load feelings on Quick Review form open
- **WHEN** the Quick Review creation form opens
- **THEN** the system fetches sentiment options from `/reviews/quick/feelings` and renders them as colored badges grouped by category

#### Scenario: Select sentiment via badge
- **WHEN** user clicks a sentiment badge (e.g., "Energético")
- **THEN** the badge becomes selected and its label is set as the sentiment value

#### Scenario: Custom sentiment text
- **WHEN** user types a sentiment not matching any badge
- **THEN** the typed text is sent as the sentiment value (free text, max 255 chars)
