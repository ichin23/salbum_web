import { apiRequest } from './apiClient'
import type { AuthUser } from './authService'

export interface UpdateProfileRequest {
    name?: string
    username?: string
    bio?: string
    image_url?: string | null
}

/** PUT /users/me — atualiza dados do perfil do usuário autenticado */
export function updateMe(payload: UpdateProfileRequest): Promise<AuthUser> {
    return apiRequest<AuthUser>('/users/me', { method: 'PUT', body: payload })
}

/** GET /users/me — dados atuais do usuário autenticado */
export function getMe(): Promise<AuthUser> {
    return apiRequest<AuthUser>('/users/me')
}
