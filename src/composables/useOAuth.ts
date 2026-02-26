/**
 * useOAuth — Google e Spotify OAuth para web.
 *
 * Google:
 *   Usa Google Identity Services (GSI) em modo popup.
 *   O GSI retorna diretamente um id_token JWT, que é enviado ao backend
 *   via POST /auth/login/google { id_token }.
 *   Não há redirect — tudo acontece no popup.
 *
 * Spotify:
 *   Usa Authorization Code Flow + PKCE com redirect.
 *   O usuário é redirecionado para o Spotify, que volta para
 *   /auth/callback/spotify?code=...  O OAuthCallbackView envia
 *   o code ao backend via POST /auth/login/spotify { code, redirect_uri }.
 */

// ─── Config ───────────────────────────────────────────────────────────────────
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''
const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID ?? ''

const BASE_URL = window.location.origin
export const SPOTIFY_REDIRECT_URI = `${BASE_URL}/auth/callback/spotify`

// ─── Google — OAuth2 popup ────────────────────────────────────────────────────
// Usa window.open para abrir o fluxo OAuth2 do Google e receber o id_token
// via postMessage da página de callback.

export const GOOGLE_REDIRECT_URI = `${BASE_URL}/auth/callback/google`

declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize(config: {
                        client_id: string
                        callback: (response: { credential: string }) => void
                        auto_select?: boolean
                    }): void
                    prompt(): void
                    cancel(): void
                }
                oauth2: {
                    initCodeClient(config: {
                        client_id: string
                        scope: string
                        ux_mode: 'popup' | 'redirect'
                        redirect_uri?: string
                        callback: (response: { code?: string; error?: string }) => void
                    }): { requestCode(): void }
                    initTokenClient(config: {
                        client_id: string
                        scope: string
                        callback: (response: { access_token?: string; error?: string }) => void
                    }): { requestAccessToken(): void }
                }
            }
        }
    }
}

/**
 * Abre o popup do Google (oauth2 Authorization Code) e troca o code
 * por um id_token JWT no backend via POST /auth/login/google.
 *
 * Fluxo:
 *  1. GSI abre popup com Authorization Code Flow
 *  2. Google redireciona para /auth/callback/google?code=...
 *  3. OAuthCallbackView lê o code e chama auth.loginWithGoogle(code)
 *  4. authService envia POST /auth/login/google { id_token: code }
 *
 * Nota: o backend precisa fazer o exchange do code pelo id_token internamente,
 * ou o endpoint /auth/login/google deve aceitar o authorization code diretamente.
 */
export function getGoogleIdToken(): Promise<string> {
    return new Promise((resolve, reject) => {
        if (!window.google) {
            reject(new Error('Google Identity Services não carregado.'))
            return
        }

        const client = window.google.accounts.oauth2.initCodeClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: 'openid email profile',
            ux_mode: 'popup',
            redirect_uri: GOOGLE_REDIRECT_URI,
            callback: (response) => {
                if (response.code) {
                    resolve(response.code)
                } else {
                    reject(new Error(response.error ?? 'Erro ao obter código do Google.'))
                }
            },
        })

        client.requestCode()
    })
}

// ─── Spotify — PKCE redirect ──────────────────────────────────────────────────

function generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    return Array.from(array, b => chars[b % chars.length]).join('')
}

async function sha256(plain: string): Promise<ArrayBuffer> {
    const encoder = new TextEncoder()
    return crypto.subtle.digest('SHA-256', encoder.encode(plain))
}

function base64URLEncode(buffer: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
}

async function generatePKCE(): Promise<{ verifier: string; challenge: string }> {
    const verifier = generateRandomString(64)
    const challenge = base64URLEncode(await sha256(verifier))
    return { verifier, challenge }
}

function saveState(provider: string, state: string, verifier?: string) {
    sessionStorage.setItem(`oauth_state_${provider}`, state)
    if (verifier) sessionStorage.setItem(`oauth_verifier_${provider}`, verifier)
}

export function getStoredState(provider: string) {
    return sessionStorage.getItem(`oauth_state_${provider}`)
}

export function getStoredVerifier(provider: string) {
    return sessionStorage.getItem(`oauth_verifier_${provider}`)
}

export function clearOAuthStorage(provider: string) {
    sessionStorage.removeItem(`oauth_state_${provider}`)
    sessionStorage.removeItem(`oauth_verifier_${provider}`)
}

/**
 * Redireciona para o Spotify com PKCE.
 * O callback virá em /auth/callback/spotify.
 */
export async function loginWithSpotify(): Promise<void> {
    const { verifier, challenge } = await generatePKCE()
    const state = generateRandomString(16)

    saveState('spotify', state, verifier)

    const params = new URLSearchParams({
        client_id: SPOTIFY_CLIENT_ID,
        redirect_uri: SPOTIFY_REDIRECT_URI,
        response_type: 'code',
        scope: 'user-read-email user-read-private user-read-recently-played',
        state,
        code_challenge: challenge,
        code_challenge_method: 'S256',
    })

    window.location.href = `https://accounts.spotify.com/authorize?${params}`
}
