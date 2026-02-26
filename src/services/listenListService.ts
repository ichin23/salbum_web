import { apiRequest } from './apiClient'
import type { ListenListApiItem } from '../types'

/**
 * GET /listenlist
 * Returns all items in the authenticated user's listen list.
 * Each item has only one of album | music | artist non-null.
 */
export function getListenList(): Promise<ListenListApiItem[]> {
    return apiRequest<ListenListApiItem[]>('/listenlist')
}

/**
 * POST /listenlist/album   body: { itemId: string }
 */
export function addAlbumToList(itemId: string): Promise<unknown> {
    return apiRequest('/listenlist/album', { method: 'POST', body: { itemId } })
}

/**
 * POST /listenlist/music   body: { itemId: string }
 */
export function addMusicToList(itemId: string): Promise<unknown> {
    return apiRequest('/listenlist/music', { method: 'POST', body: { itemId } })
}

/**
 * POST /listenlist/artist  body: { itemId: string }
 */
export function addArtistToList(itemId: string): Promise<unknown> {
    return apiRequest('/listenlist/artist', { method: 'POST', body: { itemId } })
}

/**
 * DELETE /listenlist/{entryId}
 * entryId is the UUID of the list entry (ListenListApiItem.id), NOT the content UUID.
 */
export function removeFromListenList(entryId: string): Promise<void> {
    return apiRequest<void>(`/listenlist/${entryId}`, { method: 'DELETE' })
}
