import { apiRequest } from './apiClient'
import type { MusicShareDTO } from '../types'

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
