import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios'

/**
 * Cliente HTTP centralizado com interceptors do Axios.
 *
 * - Sempre usa /api como base (Vite proxy em dev, Vercel proxy em prod).
 * - Injeta Bearer token automaticamente via request interceptor.
 * - Interceptor de resposta 401: tenta refresh token (cookie HttpOnly)
 *   e refaz a requisição original com o novo access token.
 * - Se o refresh falhar, limpa sessão e redireciona para /login.
 */

// ── Constantes ─────────────────────────────────────────────────────────────────
const API_BASE = '/api'
const TOKEN_KEY = 'salbum_access_token'
const TOKEN_EXP = 'salbum_token_exp'
const USER_KEY = 'salbum_user'

// ── Helpers de sessão ──────────────────────────────────────────────────────────
export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
}

export function saveToken(value: string, expireAt: string) {
    localStorage.setItem(TOKEN_KEY, value)
    localStorage.setItem(TOKEN_EXP, expireAt)
}

export function clearSession() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(TOKEN_EXP)
    localStorage.removeItem(USER_KEY)
}

// ── Instância Axios ────────────────────────────────────────────────────────────
export const api: AxiosInstance = axios.create({
    baseURL: API_BASE,
    withCredentials: true,           // envia cookies HttpOnly em todas as requests
    headers: {
        'Content-Type': 'application/json',
        'X-Client-Type': 'web',
    },
})

// ── Request interceptor — injeta Bearer token ──────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = getToken()
    if (token && !config.headers['X-Skip-Auth']) {
        config.headers.Authorization = `Bearer ${token}`
    }
    // Remove o header de controle interno antes de enviar
    delete config.headers['X-Skip-Auth']
    return config
})

// ── Refresh token (flag para evitar múltiplas chamadas simultâneas) ────────────
let refreshPromise: Promise<string> | null = null

async function doRefresh(): Promise<string> {
    const { data } = await axios.post(
        `${API_BASE}/auth/refreshToken`,
        {},
        {
            withCredentials: true,
            headers: { 'Content-Type': 'application/json', 'X-Client-Type': 'web' },
        },
    )

    const newToken: string = data.access_token?.value
    const expireAt: string = data.access_token?.expire_at ?? ''

    if (!newToken) throw new Error('Refresh token inválido.')

    saveToken(newToken, expireAt)

    if (data.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    }

    return newToken
}

// ── Response interceptor — trata 401 e erros de API ───────────────────────────
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

        const status = error.response?.status

        // Tenta refresh apenas uma vez por request, apenas para rotas autenticadas
        if (status === 401 && !original._retry && !original.headers['X-Skip-Auth']) {
            original._retry = true

            try {
                if (!refreshPromise) {
                    refreshPromise = doRefresh().finally(() => { refreshPromise = null })
                }

                const newToken = await refreshPromise
                original.headers.Authorization = `Bearer ${newToken}`
                return api(original)
            } catch {
                clearSession()
                window.location.href = '/login'
                return Promise.reject(new Error('Sessão expirada. Faça login novamente.'))
            }
        }

        // Extrai mensagem de erro da resposta da API
        const msg =
            error.response?.data?.message ??
            error.response?.data?.error ??
            error.message ??
            'Erro desconhecido'

        return Promise.reject(new Error(msg))
    },
)

// ── Helper tipado (mantém retrocompatibilidade com services existentes) ─────────
export type RequestOptions = {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    body?: unknown
    headers?: Record<string, string>
    /** Se true, não injeta o Bearer token */
    skipAuth?: boolean
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers, skipAuth = false } = options

    const config: AxiosRequestConfig = {
        method,
        url: path,
        data: body,
        headers: {
            ...headers,
            ...(skipAuth ? { 'X-Skip-Auth': '1' } : {}),
        },
    }

    const { data } = await api.request<T>(config)
    return data
}
