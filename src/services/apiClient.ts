/**
 * Cliente HTTP centralizado com interceptor de 401.
 * Ao receber 401, tenta chamar /auth/refreshToken (cookie HttpOnly)
 * e refaz a requisição original com o novo token.
 * Se o refresh também falhar, redireciona para /login.
 */

// Em desenvolvimento o Vite proxy redireciona /api → backend (evita CORS).
// Em produção, VITE_API_BASE_URL deve apontar para o backend real.
const API_BASE = import.meta.env.DEV
    ? '/api'
    : (import.meta.env.VITE_API_BASE_URL ?? '')

const TOKEN_KEY = 'salbum_access_token'
const TOKEN_EXP_KEY = 'salbum_token_exp'
const USER_KEY = 'salbum_user'

// Flag para evitar múltiplos refreshes simultâneos
let refreshPromise: Promise<string> | null = null

function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
}

function saveToken(value: string, expireAt: string) {
    localStorage.setItem(TOKEN_KEY, value)
    localStorage.setItem(TOKEN_EXP_KEY, expireAt)
}

function clearSession() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(TOKEN_EXP_KEY)
    localStorage.removeItem(USER_KEY)
}

async function doRefresh(): Promise<string> {
    const res = await fetch(`${API_BASE}/auth/refreshToken`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Client-Type': 'web' },
        credentials: 'include', // envia o cookie HttpOnly com o refresh token
        body: JSON.stringify({}),
    })

    if (!res.ok) {
        clearSession()
        window.location.href = '/login'
        throw new Error('Sessão expirada. Faça login novamente.')
    }

    const data = await res.json()
    const newToken: string = data.access_token?.value
    const expireAt: string = data.access_token?.expire_at ?? ''

    if (!newToken) {
        clearSession()
        window.location.href = '/login'
        throw new Error('Refresh token inválido.')
    }

    saveToken(newToken, expireAt)

    // Atualiza o user no store se disponível (evita import circular com Pinia)
    if (data.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    }

    return newToken
}

function buildHeaders(extra?: HeadersInit): Record<string, string> {
    const token = getToken()
    return {
        'Content-Type': 'application/json',
        'X-Client-Type': 'web',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(extra as Record<string, string> ?? {}),
    }
}

export type RequestOptions = {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    body?: unknown
    headers?: HeadersInit
    /** Se true, não adiciona o Bearer token (usado nas rotas de auth) */
    skipAuth?: boolean
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers: extraHeaders, skipAuth = false } = options

    const url = path.startsWith('http') ? path : `${API_BASE}${path}`

    // Sempre usa Record<string, string> para poder fazer spread no retry
    const headers: Record<string, string> = skipAuth
        ? { 'Content-Type': 'application/json', 'X-Client-Type': 'web', ...(extraHeaders as Record<string, string> ?? {}) }
        : buildHeaders(extraHeaders) as Record<string, string>

    const init: RequestInit = {
        method,
        headers,
        credentials: 'include',
        body: body !== undefined ? JSON.stringify(body) : undefined,
    }

    let res = await fetch(url, init)

    // ── Interceptor de 401 ──────────────────────────────────────────────────
    if (res.status === 401 && !skipAuth) {
        console.warn('[apiClient] 401 recebido, tentando refresh token...')
        try {
            if (!refreshPromise) {
                refreshPromise = doRefresh().finally(() => {
                    refreshPromise = null
                })
            }
            const newToken = await refreshPromise
            console.info('[apiClient] Refresh OK, refazendo requisição...')

            res = await fetch(url, {
                ...init,
                headers: { ...headers, Authorization: `Bearer ${newToken}` },
            })
        } catch (e) {
            // doRefresh já redireciona para /login
            console.error('[apiClient] Refresh falhou:', e)
            throw new Error('Sessão expirada.')
        }
    }
    // ────────────────────────────────────────────────────────────────────────

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
        const msg =
            (data as { message?: string; error?: string }).message ??
            (data as { message?: string; error?: string }).error ??
            `Erro ${res.status}`
        throw new Error(msg)
    }

    return data as T
}
