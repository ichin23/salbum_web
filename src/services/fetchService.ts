import { apiRequest } from './apiClient'
import type { FetchResult, FetchReleaseDetailsResponse, FetchArtistDetailsResponse } from '../types'

export function fetchSearch(params: {
    q: string
    type?: 'album' | 'artist' | 'music'
    artist?: string
    force?: boolean
}): Promise<FetchResult> {
    const query = new URLSearchParams({ q: params.q })
    if (params.type) query.set('type', params.type)
    if (params.artist) query.set('artist', params.artist)
    if (params.force) query.set('force', 'true')
    return apiRequest<FetchResult>(`/fetch?${query}`)
}

export function fetchReleaseDetails(id: string, force = false): Promise<FetchReleaseDetailsResponse> {
    const query = force ? '?force=true' : ''
    return apiRequest<FetchReleaseDetailsResponse>(`/fetch/releaseDetails/${id}${query}`)
}

export function fetchArtistDetails(id: string, force = false): Promise<FetchArtistDetailsResponse> {
    const query = force ? '?force=true' : ''
    return apiRequest<FetchArtistDetailsResponse>(`/artists/${id}${query}`)
}

export function fetchAlbumImage(albumId: string): Promise<{ imageUrl: string }> {
    return apiRequest<{ imageUrl: string }>(`/fetch/album/${albumId}/fetchImage`)
}
