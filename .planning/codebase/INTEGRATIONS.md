# Integrations

## Backend API
- **Base URL**: Typically `http://localhost:8080` (Java Spring Boot REST API)
- **Endpoints**: `/fetch`, `/albums`, `/artists`, `/reviews`, `/musicShare`, `/listenlist`

## External Services
- **MusicBrainz**: Used for fetching album covers and metadata via backend.
- **Spotify**: OAuth authentication and fetching recent tracks/albums (`/spotify/me/recently-played`, `/auth/login/spotify`).
- **Google**: OAuth authentication (`/auth/login/google`).
