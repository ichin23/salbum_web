import { apiRequest } from './apiClient'
import type { MusicShareDTO, FullMusicShareDTO, MusicShareCommentDTO } from '../types'

/**
 * POST /musicShare/album   body: { itemId, comment }
 * POST /musicShare/music   body: { itemId, comment }
 * POST /musicShare/artist  body: { itemId, comment }
 */
export type MusicShareType = 'album' | 'music' | 'artist'

export function createMusicShare(
    type: MusicShareType,
    itemId: string,
    comment: string,
): Promise<MusicShareDTO> {
    return apiRequest<MusicShareDTO>(`/musicShare/${type}`, {
        method: 'POST',
        body: { itemId, comment },
    })
}

/** PUT /musicShare/{shareId}  body: { comment } */
export function updateMusicShare(shareId: string, comment: string): Promise<MusicShareDTO> {
    return apiRequest<MusicShareDTO>(`/musicShare/${shareId}`, {
        method: 'PUT',
        body: { comment },
    })
}

/** DELETE /musicShare/{shareId} */
export function deleteMusicShare(shareId: string): Promise<void> {
    return apiRequest<void>(`/musicShare/${shareId}`, { method: 'DELETE' })
}

/** GET /musicShare/{shareId} */
export function getMusicShareById(shareId: string): Promise<FullMusicShareDTO> {
    return apiRequest<FullMusicShareDTO>(`/musicShare/${shareId}`)
}

/** POST /musicShare/{shareId}/like */
export function likeMusicShare(shareId: string): Promise<void> {
    return apiRequest<void>(`/musicShare/${shareId}/like`, { method: 'POST' })
}

/** DELETE /musicShare/{shareId}/like */
export function unlikeMusicShare(shareId: string): Promise<void> {
    return apiRequest<void>(`/musicShare/${shareId}/like`, { method: 'DELETE' })
}

/** GET /musicShare/{shareId}/comments */
export function getMusicShareComments(shareId: string): Promise<MusicShareCommentDTO[]> {
    return apiRequest<MusicShareCommentDTO[]>(`/musicShare/${shareId}/comments`)
}

/** POST /musicShare/{shareId}/comments */
export function addMusicShareComment(shareId: string, content: string): Promise<MusicShareCommentDTO> {
    return apiRequest<MusicShareCommentDTO>(`/musicShare/${shareId}/comments`, {
        method: 'POST',
        body: { content },
    })
}

/** DELETE /musicShare/comments/{commentId} */
export function deleteMusicShareComment(commentId: string): Promise<void> {
    return apiRequest<void>(`/musicShare/comments/${commentId}`, { method: 'DELETE' })
}
