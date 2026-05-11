import { apiRequest } from './apiClient'
import type { AuthUser } from './authService'

export interface UpdateProfileRequest {
    name?: string
    username?: string
    bio?: string
    image_url?: string | null
}

export interface UserDTO {
    id: string
    name: string
    username: string
    image_url: string | null
    followers_count: number
    following_count: number
    is_following: boolean
    bio: string | null
    pinned_albums?: import('../types').AlbumInfoDTO[]
}

/** PUT /users/me — atualiza dados do perfil do usuário autenticado */
export function updateMe(payload: UpdateProfileRequest): Promise<AuthUser> {
    return apiRequest<AuthUser>('/users/me', { method: 'PUT', body: payload })
}

/** GET /users/me — dados atuais do usuário autenticado */
export function getMe(): Promise<AuthUser> {
    return apiRequest<AuthUser>('/users/me')
}

/** GET /users/{id} — dados de um usuário por ID */
export function getUserById(id: string): Promise<UserDTO> {
    return apiRequest<UserDTO>(`/users/${id}`)
}

/** GET /users/search?q= — busca usuários por nome ou username */
export function searchUsers(q: string): Promise<UserDTO[]> {
    return apiRequest<UserDTO[]>(`/users/search?q=${encodeURIComponent(q)}`)
}

/** POST /users/{id}/follow — seguir um usuário */
export function followUser(id: string): Promise<void> {
    return apiRequest<void>(`/users/${id}/follow`, { method: 'POST' })
}

/** DELETE /users/{id}/follow — deixar de seguir um usuário */
export function unfollowUser(id: string): Promise<void> {
    return apiRequest<void>(`/users/${id}/follow`, { method: 'DELETE' })
}

/** PUT /users/me/pinned-albums — atualiza álbuns favoritos do usuário autenticado */
export function updatePinnedAlbums(albumIds: string[]): Promise<AuthUser> {
    return apiRequest<AuthUser>('/users/me/pinned-albums', { method: 'PUT', body: albumIds })
}

/** GET /users/me/profile-picture/upload-url */
export function getUserUploadImageUrl(): Promise<{ url: string; path: string }> {
    return apiRequest<{ url: string; path: string }>('/users/me/profile-picture/upload-url')
}

/** PATCH /users/me/profile-picture */
export function confirmProfileImage(key: string): Promise<AuthUser> {
    return apiRequest<AuthUser>('/users/me/profile-picture', { method: 'PATCH', body: { key } })
}
