import { apiRequest } from './apiClient'

function request<T>(path: string, body?: unknown): Promise<T> {
    return apiRequest<T>(path, { method: 'POST', body, skipAuth: true })
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface Token {
    value: string
    expire_at: string
}

export interface AuthUser {
    id: string
    name: string
    username: string
    email: string
    image_url: string | null
    bio: string | null
    followers_count: number
    following_count: number
    email_validated: boolean
    spotify_linked: boolean
}

export type AuthStatus = 'SUCCESS' | 'MFA_REQUIRED' | 'FAILURE'

export interface AuthResponseDTO {
    status: AuthStatus
    user: AuthUser | null
    context_info: string | null   // 'LOGIN' | 'REGISTER'
    access_token: Token | null
    refresh_token: Token | null
    message: string | null
}

export interface TokenResponseDTO {
    access_token: Token
    token_type: string
    refresh_token: Token
    user: AuthUser
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

export function register(payload: {
    name: string
    username: string
    email: string
    password: string
}): Promise<AuthResponseDTO> {
    return request('/auth/register', payload)
}

export function login(payload: {
    email: string
    password: string
}): Promise<AuthResponseDTO> {
    return request('/auth/login', payload)
}

export function validateCodeLogin(payload: {
    email: string
    code: string
}): Promise<AuthResponseDTO> {
    return request('/auth/validateCodeLogin', payload)
}

export function validateEmail(payload: {
    email: string
    code: string
}): Promise<AuthResponseDTO> {
    return request('/auth/validateEmail', payload)
}

export function resendCode(payload: {
    email: string
    context: 'LOGIN' | 'REGISTER'
}): Promise<AuthResponseDTO> {
    return request('/auth/resendCode', payload)
}

export function loginGoogle(payload: {
    id_token: string
}): Promise<AuthResponseDTO> {
    return request('/auth/login/google', payload)
}

export function loginSpotify(payload: {
    code: string
    redirect_uri: string
    code_verifier: string
}): Promise<AuthResponseDTO> {
    return request('/auth/login/spotify', payload)
}

export function refreshToken(payload?: {
    refreshToken?: string
}): Promise<TokenResponseDTO> {
    return request('/auth/refreshToken', payload ?? {})
}

export function resetPassword(payload: {
    email: string
}): Promise<{ message: string }> {
    return request('/auth/resetPassword', payload)
}

export function changePassword(payload: {
    newPassword: string
    token: string
}): Promise<void> {
    return request('/auth/changePassword', payload)
}
