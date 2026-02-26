import { apiRequest } from './apiClient'
import type { FullReviewDTO, ReviewDTO, CreateReviewRequest, FeelingOptionDTO, TrackEmotionPointDTO } from '../types'

/** GET /reviews/album/{albumId} */
export function getAlbumReviews(albumId: string): Promise<FullReviewDTO[]> {
    return apiRequest<FullReviewDTO[]>(`/reviews/album/${albumId}`)
}

/** POST /reviews */
export function createReview(payload: CreateReviewRequest): Promise<ReviewDTO> {
    return apiRequest<ReviewDTO>('/reviews', {
        method: 'POST',
        body: payload,
    })
}

/** PUT /reviews/{id} */
export function updateReview(id: string, content: string): Promise<ReviewDTO> {
    return apiRequest<ReviewDTO>(`/reviews/${id}`, {
        method: 'PUT',
        body: { content },
    })
}

/** DELETE /reviews/{id} */
export function deleteReview(id: string): Promise<void> {
    return apiRequest<void>(`/reviews/${id}`, { method: 'DELETE' })
}

/** POST /reviews/{id}/like */
export function likeReview(id: string): Promise<void> {
    return apiRequest<void>(`/reviews/${id}/like`, { method: 'POST' })
}

/** DELETE /reviews/{id}/like */
export function unlikeReview(id: string): Promise<void> {
    return apiRequest<void>(`/reviews/${id}/like`, { method: 'DELETE' })
}

/** GET /reviews/feelings */
export function getFeelings(): Promise<FeelingOptionDTO[]> {
    return apiRequest<FeelingOptionDTO[]>('/reviews/feelings')
}

/** GET /reviews/{id}/emotion-chart */
export function getEmotionChart(reviewId: string): Promise<TrackEmotionPointDTO[]> {
    return apiRequest<TrackEmotionPointDTO[]>(`/reviews/${reviewId}/emotion-chart`)
}
