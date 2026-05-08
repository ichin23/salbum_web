# Concerns

## Technical Debt & Areas for Improvement
- **PWA Capabilities**: The application currently lacks Service Worker configuration, manifest setup, and caching strategies required for a fluid mobile PWA experience. This is the primary target for improvement.
- **Global Error Handling**: Errors are handled per-component rather than centrally, which might lead to duplicated logic and inconsistent user feedback.
- **Offline Support**: Without PWA features, the app is entirely dependent on network connectivity.
- **State Management**: Heavy reliance on composables. As the app scales (e.g., adding offline sync queues), a more robust store like Pinia may become necessary.
