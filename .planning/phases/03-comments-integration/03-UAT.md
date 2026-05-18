---
status: testing
phase: 03-comments-integration
source: [.planning/phases/03-comments-integration/03-SUMMARY.md]
started: 2026-05-17T11:32:00-03:00
updated: 2026-05-17T11:32:00-03:00
---

## Current Test

number: 1
name: View Comments on Review Details Page
expected: |
  Navigate to a review's detail page (e.g., click a review card). Below the review body and interaction bar, a "Comentários" section appears, showing the list of existing comments with user avatars, usernames, Portuguese formatted timestamps, and the comments' text content.
awaiting: user response

## Tests

### 1. View Comments on Review Details Page
expected: |
  Navigate to a review's detail page (e.g., click a review card). Below the review body and interaction bar, a "Comentários" section appears, showing the list of existing comments with user avatars, usernames, Portuguese formatted timestamps, and the comments' text content.
result: [pending]

### 2. Add a Comment to a Review
expected: |
  On a review's detail page, write text in the comment composer textarea and click the "Comentar" button (or press Ctrl+Enter / Cmd+Enter). The comment is successfully posted, the composer is cleared, and the comment immediately appears at the top of the comment list with your user info.
result: [pending]

### 3. Smooth Scroll and Dynamic Comment Count
expected: |
  Clicking the comments count button in the interaction bar smoothly scrolls the viewport to the comments section. After a comment is successfully posted, the comment count in the interaction bar button increments dynamically.
result: [pending]

### 4. Comment Count on Review Cards and Feed Items
expected: |
  In the home feed and user profile pages, all review cards and activity items display the correct comment count next to a MessageSquare icon in their footers.
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0

## Gaps

[none yet]
