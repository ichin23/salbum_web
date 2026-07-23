import { apiRequest } from './apiClient'
import type { FeedResponseDTO, UserActivityResponseDTO, ActivityItemDTO } from '../types'

export interface ActivityFeedParams {
    limit?: number
    cursor?: string   // ISO-8601 timestamp string
    onlyFollowing?: boolean
}

/**
 * GET /activity/feed
 * Returns paginated ActivityItemDTO list from users the authenticated user follows or all users.
 */
export async function getActivityFeed(params: ActivityFeedParams = {}): Promise<FeedResponseDTO> {
    const qs = new URLSearchParams()
    if (params.limit) qs.set('limit', String(params.limit))
    if (params.cursor) qs.set('cursor', params.cursor)
    if (params.onlyFollowing !== undefined) qs.set('onlyFollowing', String(params.onlyFollowing))

    const query = qs.toString() ? `?${qs.toString()}` : ''
    const raw = await apiRequest<FeedResponseDTO>(`/activity/feed${query}`)

    return {
        data: raw.data ?? [],
        nextCursor: raw.nextCursor ?? null,
        hasMore: raw.hasMore ?? false,
    }
}

/**
 * GET /activity/user/{userId}
 * Returns { reviews, music_shares } — normalized to ActivityItemDTO[]
 */
export async function getUserActivityFeed(userId: string): Promise<ActivityItemDTO[]> {
    const raw = await apiRequest<UserActivityResponseDTO>(`/activity/user/${userId}`)

    const reviewItems: ActivityItemDTO[] = (raw.reviews ?? []).map(r => ({
        type: 'REVIEW' as const,
        timestamp: r.review.createdAt,
        review: r,
        musicShare: null,
        quickReview: null,
    }))

    const shareItems: ActivityItemDTO[] = (raw.music_shares ?? []).map(s => ({
        type: 'MUSIC_SHARE' as const,
        timestamp: s.createdAt,
        review: null,
        musicShare: {
            musicShare: s,
            likeCount: 0,
            likedByCurrentUser: false,
            commentCount: 0
        },
        quickReview: null,
    }))

    const quickReviewItems: ActivityItemDTO[] = (raw.quick_reviews ?? []).map(q => ({
        type: 'QUICK_REVIEW' as const,
        timestamp: q.createdAt,
        review: null,
        musicShare: null,
        quickReview: {
            quickReview: q,
            likeCount: 0,
            likedByCurrentUser: false,
            commentCount: 0,
        },
    }))

    return [...reviewItems, ...shareItems, ...quickReviewItems].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
}
