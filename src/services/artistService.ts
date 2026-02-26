import { apiRequest } from './apiClient'
import type { ArtistInfoDTO } from '../types'

export interface CreateArtistDTO {
    name: string
    country?: string | null
    born_date?: string | null   // ISO date "YYYY-MM-DD"
    death_date?: string | null
    image_url?: string | null
}

export interface ArtistDetailsDTO {
    id: string
    name: string
    mbid: string | null
    country: string | null
    description: string | null
    albums: ArtistInfoDTO[]
    image_url: string | null
    born_date: string | null
    death_date: string | null
}

/** POST /artists */
export function createArtist(payload: CreateArtistDTO): Promise<ArtistDetailsDTO> {
    return apiRequest<ArtistDetailsDTO>('/artists', { method: 'POST', body: payload })
}

/** PUT /artists/{id} — atualiza artista */
export function updateArtist(artistId: string, payload: CreateArtistDTO): Promise<ArtistDetailsDTO> {
    return apiRequest<ArtistDetailsDTO>(`/artists/${artistId}`, { method: 'PUT', body: payload })
}

/** GET /artists/{id}/uploadImageUrl */
export function getArtistUploadImageUrl(artistId: string): Promise<{ url: string; path: string }> {
    return apiRequest<{ url: string; path: string }>(`/artists/${artistId}/uploadImageUrl`)
}

/** GET /artists?query=... */
export function searchArtists(query: string): Promise<ArtistInfoDTO[]> {
    return apiRequest<ArtistInfoDTO[]>(`/artists?query=${encodeURIComponent(query)}`)
}
