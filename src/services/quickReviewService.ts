import { apiRequest } from './apiClient'
import { uploadImageToPresignedUrl } from './albumService'
import type { QuickReviewDTO, FullQuickReviewDTO, CreateQuickReviewRequest, UpdateQuickReviewRequest, QuickReviewCommentDTO, QuickReviewFeelingOption } from '../types'

export function getQuickReviewsByAlbum(albumId: string): Promise<FullQuickReviewDTO[]> {
    return apiRequest<FullQuickReviewDTO[]>(`/reviews/quick/album/${albumId}`)
}

export function getQuickReviewById(id: string): Promise<FullQuickReviewDTO> {
    return apiRequest<FullQuickReviewDTO>(`/reviews/quick/${id}`)
}

export function createQuickReview(payload: CreateQuickReviewRequest): Promise<QuickReviewDTO> {
    return apiRequest<QuickReviewDTO>('/reviews/quick', {
        method: 'POST',
        body: payload,
    })
}

export function updateQuickReview(id: string, payload: UpdateQuickReviewRequest): Promise<QuickReviewDTO> {
    return apiRequest<QuickReviewDTO>(`/reviews/quick/${id}`, {
        method: 'PUT',
        body: payload,
    })
}

export function deleteQuickReview(id: string): Promise<void> {
    return apiRequest<void>(`/reviews/quick/${id}`, { method: 'DELETE' })
}

export function likeQuickReview(id: string): Promise<void> {
    return apiRequest<void>(`/reviews/quick/${id}/like`, { method: 'POST' })
}

export function unlikeQuickReview(id: string): Promise<void> {
    return apiRequest<void>(`/reviews/quick/${id}/like`, { method: 'DELETE' })
}

export function checkQuickReviewLike(id: string): Promise<boolean> {
    return apiRequest<boolean>(`/reviews/quick/${id}/likes/me`)
}

export function getQuickReviewComments(reviewId: string): Promise<QuickReviewCommentDTO[]> {
    return apiRequest<QuickReviewCommentDTO[]>(`/reviews/quick/${reviewId}/comments`)
}

export function addQuickReviewComment(reviewId: string, content: string): Promise<QuickReviewCommentDTO> {
    return apiRequest<QuickReviewCommentDTO>(`/reviews/quick/${reviewId}/comments`, {
        method: 'POST',
        body: { content },
    })
}

export function deleteQuickReviewComment(commentId: string): Promise<void> {
    return apiRequest<void>(`/reviews/quick/comments/${commentId}`, { method: 'DELETE' })
}

export function getQuickReviewFeelings(): Promise<QuickReviewFeelingOption[]> {
    return apiRequest<QuickReviewFeelingOption[]>('/reviews/quick/feelings')
}

export async function uploadQuickReviewPhoto(file: File): Promise<string> {
    const { url, path } = await apiRequest<{ url: string; path: string }>('/reviews/quick/upload-url', { method: 'GET' })
    await uploadImageToPresignedUrl(url, file)
    return path
}
