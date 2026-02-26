import { apiRequest } from './apiClient'

export interface CreateMusicDTO {
    name: string
    length?: number | null   // milliseconds
    position: number
    artistIds?: string[]
}

export interface CreateAlbumDTO {
    name: string
    type?: string | null
    country?: string | null
    musics?: CreateMusicDTO[]
    artistIds: string[]
    release_date?: string | null  // "YYYY-MM-DD"
    image_url?: string | null
    spotify_url?: string | null
    genres?: string[]
}

// Retorno do POST /albums
export interface AlbumDetailsDTO {
    id: string
    name: string
    type: string | null
    country: string | null
    rate: number | null
    mbid: string | null
    image_url: string | null
    release_date: string | null
    musics: {
        id: string
        name: string
        length: number | null
        position: number
        artists: { id: string; name: string; image_url: string | null }[]
    }[]
    artists: { id: string; name: string; image_url: string | null }[]
    genres: string[]
}

// Retorno do PUT /albums/:id (AlbumInfoDTO — schema diferente)
export interface AlbumInfoDTO {
    id: string
    name: string
    type: string | null
    country: string | null
    rate: number | null
    mbid: string | null
    image_url: string | null
    release_date: string | null
    artists: { id: string; name: string; mbid: string | null; country: string | null; image_url: string | null }[]
    genres: string[]
}

/** POST /albums */
export function createAlbum(payload: CreateAlbumDTO): Promise<AlbumDetailsDTO> {
    return apiRequest<AlbumDetailsDTO>('/albums', { method: 'POST', body: payload })
}

/** GET /albums/{id}/uploadImageUrl */
export function getAlbumUploadImageUrl(albumId: string): Promise<{ url: string; path: string }> {
    return apiRequest<{ url: string; path: string }>(`/albums/${albumId}/uploadImageUrl`)
}

/** PUT presigned URL — faz upload do arquivo diretamente para o storage */
export async function uploadImageToPresignedUrl(presignedUrl: string, file: File): Promise<void> {
    const res = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'image/jpeg' },
    })
    if (!res.ok) throw new Error(`Upload falhou: ${res.status}`)
}

/** PUT /albums/:id */
export function updateAlbum(id: string, payload: CreateAlbumDTO): Promise<AlbumInfoDTO> {
    return apiRequest<AlbumInfoDTO>(`/albums/${id}`, { method: 'PUT', body: payload })
}
