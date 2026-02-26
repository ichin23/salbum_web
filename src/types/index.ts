// ─── User ───────────────────────────────────────────────────────────────────
export interface User {
    id: number
    username: string
    avatarUrl?: string
}

// ─── Artist ──────────────────────────────────────────────────────────────────
export interface Artist {
    id: number
    name: string
    imageUrl?: string
}

export interface ArtistDetails {
    id: number
    name: string
    country?: string
    mbid?: string
    bornDate?: string    // ISO 8601 date string
    deathDate?: string   // ISO 8601 date string
    imageUrl?: string
    albums: AlbumInfo[]
}

// Lightweight album reference used inside ArtistDetails
export interface AlbumInfo {
    id: number
    title: string
    coverUrl: string
    releaseYear: number
    genre: string
    averageRating?: number
    totalReviews?: number
}

// ─── Music (Track) ───────────────────────────────────────────────────────────
export interface Music {
    id: number
    title: string
    durationMs: number
    trackNumber: number
    averageRating?: number
}

// ─── Album ───────────────────────────────────────────────────────────────────
export interface Album {
    id: number
    title: string
    artist: Artist
    coverUrl: string
    releaseYear: number
    genre: string
    label?: string
    musics: Music[]
    averageRating?: number
    totalReviews?: number
}

// ─── Review ──────────────────────────────────────────────────────────────────
export type ReviewMode = 'comment' | 'rating' | 'music-by-music'

export interface MusicRating {
    musicId: number
    musicTitle: string
    rating: number
}

export interface Review {
    id: number
    user: User
    album: Pick<Album, 'id' | 'title' | 'coverUrl'>
    mode: ReviewMode
    comment?: string
    rating?: number          // 0–100 scale
    musicRatings?: MusicRating[]
    createdAt: string        // ISO 8601
    likesCount: number
}

// ─── MusicShare ───────────────────────────────────────────────────────────────
export type MusicShareTargetType = 'album' | 'track' | 'artist'

export interface MusicShare {
    id: number
    user: User
    targetType: MusicShareTargetType
    // Album share
    album?: Pick<Album, 'id' | 'title' | 'coverUrl'> & { artistName: string }
    // Track share
    track?: { id: number; title: string; trackNumber: number }
    // Artist share
    artist?: Pick<Artist, 'id' | 'name' | 'imageUrl'>
    comment?: string
    createdAt: string        // ISO 8601
    likesCount: number
}

// ─── Fetch / Search ──────────────────────────────────────────────────────────
export interface FetchArtist {
    id: string
    name: string
    mbid: string | null
    country: string | null
    image_url: string | null
}

export interface FetchAlbum {
    id: string
    name: string
    type: string
    country: string | null
    rate: number | null
    mbid: string | null
    artists: FetchArtist[]
    genres: string[]
    release_date: string | null
    spotify_url: string | null
    image_url: string | null
}

export interface FetchMusicResult {
    id: string
    name: string
    length: number | null
    mbid: string | null
    artists: FetchArtist[]
    album: {
        id: string
        name: string
        image_url: string | null
        release_date: string | null
    }
}

export interface FetchResult {
    data: FetchAlbum[] | FetchArtist[] | FetchMusicResult[]
    type: string
}

export interface FetchMusic {
    id: string
    name: string
    length: number       // ms
    mbid: string | null
    position: number
    artists: FetchArtist[]
}

export interface FetchAlbumDetails extends Omit<FetchAlbum, 'artists'> {
    musics: FetchMusic[]
    artists: FetchArtist[]
}

export interface FetchReleaseDetailsResponse {
    album: FetchAlbumDetails
    userReview: ReviewDTO | null
    spotify_url: string | null
}

export interface FetchArtistDetails extends FetchArtist {
    albums: FetchAlbum[]
    born_date: string | null       // ISO date
    death_date: string | null      // ISO date
}

export interface FetchArtistDetailsResponse {
    artist: FetchArtistDetails
    userReview: unknown | null
}

// ─── Spotify Recently Played ─────────────────────────────────────────────────
export interface SpotifyImage {
    url: string
    height: number
    width: number
}

export interface SpotifyArtistRef {
    id: string
    name: string
}

export interface SpotifyAlbumRef {
    id: string
    name: string
    release_date: string
    images: SpotifyImage[]
    artists: SpotifyArtistRef[]
}

export interface SpotifyTrack {
    id: string
    name: string
    album: SpotifyAlbumRef
    artists: SpotifyArtistRef[]
}

export interface RecentlyPlayedItem {
    played_at: string
    track: SpotifyTrack
}

export interface RecentlyPlayedResponse {
    items: RecentlyPlayedItem[]
    limit: number
    cursors: {
        after: string
        before: string
    }
}

export interface TopAlbumDTO {
    id: string
    name: string
    releaseDate: string
    images: SpotifyImage[]
    artists: SpotifyArtistRef[]
    playCount: number
}

// ─── Review (API) ────────────────────────────────────────────────────────────
export interface UserInfoDTO {
    id: string
    username: string
    name: string
    imageUrl: string | null
}

export interface FeelingOptionDTO {
    value: string       // enum key, e.g. "EUPHORIC"
    label: string       // human-readable label
    emoji: string       // emoji representation
    intensity: number   // -2 to +2
    category: string    // "positive" | "neutral" | "negative"
}

export interface TrackScoreDTO {
    trackId: string
    trackNumber: number
    trackName: string
    score?: number | null
    feeling?: string | null
}

export interface TrackEmotionPointDTO {
    trackNumber: number
    trackName: string
    score: number | null
    feeling: string | null
    intensity: number | null
}

export interface ReviewDTO {
    id: string
    user: UserInfoDTO
    content: string | null
    album: AlbumInfoDTO
    albumScore: number | null
    trackScores: TrackScoreDTO[] | null
    createdAt: string
    updatedAt: string
}

/** ReviewInfoDTO — used inside FullReviewInfoDTO (feed/activity). No updatedAt. */
export interface ReviewInfoDTO {
    id: string
    user: UserInfoDTO
    content: string | null
    album: AlbumInfoDTO
    albumScore: number | null
    trackScores: TrackScoreDTO[] | null
    createdAt: string
}

/** FullReviewDTO — returned by GET /reviews/album/{id} */
export interface FullReviewDTO {
    review: ReviewDTO
    likeCount: number
    likedByCurrentUser: boolean
    commentCount: number
}

/** FullReviewInfoDTO — used in ActivityItemDTO (feed). review is ReviewInfoDTO. */
export interface FullReviewInfoDTO {
    review: ReviewInfoDTO
    likeCount: number
    likedByCurrentUser: boolean
    commentCount: number
}

export interface CreateReviewRequest {
    albumId: string
    content?: string
    albumScore?: number
    trackScores?: TrackScoreDTO[]
}

// ─── Listen List ─────────────────────────────────────────────────────────────
// Shape returned by GET /listenlist.
// Only one of album | music | artist is non-null — that field defines the item type.
export interface ListenListApiItem {
    id: string                         // UUID of the list entry (used for DELETE)
    album: AlbumInfoDTO | null
    music: MusicInfoDTO | null
    artist: ArtistInfoDTO | null
    itemType: string                   // 'album' | 'music' | 'artist'
    createdAt: string                  // ISO 8601
}

export type ListenListItemType = 'album' | 'music' | 'artist'

// ─── Activity / Feed (API) ───────────────────────────────────────────────────

/** AlbumInfoDTO — album reference used in feed/share DTOs */
export interface AlbumInfoDTO {
    id: string
    name: string
    type: string | null
    country: string | null
    release_date: string | null
    rate: number | null
    mbid: string | null
    spotify_url: string | null
    image_url: string | null
    artists: ArtistInfoDTO[]
}

/** ArtistInfoDTO — artist reference used in feed/share DTOs */
export interface ArtistInfoDTO {
    id: string
    name: string
    mbid: string | null
    country: string | null
    image_url: string | null
}

/** MusicInfoDTO — track reference inside MusicShareDTO */
export interface MusicInfoDTO {
    id: string
    name: string
    length: number | null
    mbid: string | null
    position: number | null
    artists: ArtistInfoDTO[]
    album: AlbumInfoDTO | null
}

/** MusicShareDTO — returned by feed and activity endpoints */
export interface MusicShareDTO {
    id: string
    user: UserInfoDTO
    album: AlbumInfoDTO | null
    music: MusicInfoDTO | null
    artist: ArtistInfoDTO | null
    comment: string | null
    createdAt: string
    updatedAt: string
}

/** ReviewInfoDTO — lightweight review used in feed (no trackScores) */
// (defined above near FullReviewInfoDTO)

/**
 * ActivityItemDTO — single item from GET /activity/feed
 * type: "REVIEW" | "MUSIC_SHARE" ("RATING" treated as REVIEW)
 */
export interface ActivityItemDTO {
    type: 'REVIEW' | 'RATING' | 'MUSIC_SHARE'
    timestamp: string          // Instant → ISO-8601 string
    review: FullReviewInfoDTO | null
    musicShare: MusicShareDTO | null
}

/** GET /activity/feed response */
export interface FeedResponseDTO {
    data: ActivityItemDTO[]
    nextCursor: string | null
    hasMore: boolean
}

/** Raw response from GET /activity/user/{userId} — matches backend UserActivitiesDTO */
export interface UserActivityResponseDTO {
    reviews: FullReviewInfoDTO[]
    music_shares: MusicShareDTO[]
}

/** UserDTO — returned by /users/me, /users/{id}, /users/search, followers/following lists */
export interface UserDTO {
    id: string
    name: string
    username: string
    image_url: string | null
    bio: string | null
    followers_count: number
    following_count: number
    is_following: boolean
}

/** ReviewCommentDTO — comment on a review */
export interface ReviewCommentDTO {
    id: string
    user: UserInfoDTO
    content: string
    createdAt: string
}

// ─── User Profile ─────────────────────────────────────────────────────────────
export interface UserProfile extends User {
    bio?: string
    followersCount: number
    followingCount: number
    reviewsCount: number
    sharesCount: number
    joinedAt: string         // ISO 8601
}
