import { apiRequest } from './apiClient'
import type { RecentlyPlayedResponse, TopAlbumDTO } from '../types'

export function getRecentlyPlayed(params?: {
    limit?: number
    before?: string
    after?: string
}): Promise<RecentlyPlayedResponse> {
    const query = new URLSearchParams()
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.before) query.set('before', params.before)
    if (params?.after) query.set('after', params.after)
    const qs = query.toString()
    return apiRequest<RecentlyPlayedResponse>(`/spotify/me/recently-played${qs ? `?${qs}` : ''}`)
}

export function getTopAlbumsLastWeek(): Promise<TopAlbumDTO[]> {
    return apiRequest<TopAlbumDTO[]>('/spotify/me/top-albums-last-week')
}
