/**
 * useOAuth — Google e Spotify OAuth para web.
 *
 * Ambos usam Authorization Code Flow com redirect completo (sem popup).
 *
 * Google:
 *   Redireciona para accounts.google.com com state (CSRF).
 *   Volta para /auth/callback/google?code=&state=
 *   OAuthCallbackView valida state e envia POST /auth/login/google { code, redirect_uri }.
 *
 * Spotify:
 *   Redireciona para accounts.spotify.com com state + PKCE.
 *   Volta para /auth/callback/spotify?code=&state=
 *   OAuthCallbackView valida state/PKCE e envia POST /auth/login/spotify { code, redirect_uri, code_verifier }.
 */
import CryptoJS from 'crypto-js'

// ─── Config ────────────────────────────────────────────────────────────────────
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''
const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID ?? ''

const BASE_URL = window.location.origin
export const GOOGLE_REDIRECT_URI = `${BASE_URL}/auth/callback/google`
export const SPOTIFY_REDIRECT_URI = `${BASE_URL}/auth/callback/spotify`

// ─── Shared utils ──────────────────────────────────────────────────────────────

function generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
    const array = new Uint8Array(length)
    if (window.crypto && window.crypto.getRandomValues) {
        window.crypto.getRandomValues(array)
    } else {
        for (let i = 0; i < length; i++) {
            array[i] = Math.floor(Math.random() * 256)
        }
    }
    return Array.from(array, b => chars[b % chars.length]).join('')
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

// ─── Google — Implicit Flow (id_token direto no hash) ─────────────────────────

/**
 * Redireciona para o Google com response_type=id_token (Implicit Flow).
 * O Google retorna o id_token JWT no fragmento da URL:
 *   /auth/callback/google#id_token=...&state=...
 * Sem popup, sem COOP, sem exchange de code.
 */
export function loginWithGoogle(): void {
    const state = generateRandomString(16)
    const nonce = generateRandomString(16)
    saveState('google', state)
    sessionStorage.setItem('oauth_nonce_google', nonce)

    const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: GOOGLE_REDIRECT_URI,
        response_type: 'id_token',
        scope: 'openid email profile',
        prompt: 'select_account',
        state,
        nonce,
    })

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

// ─── Spotify — PKCE redirect ───────────────────────────────────────────────────

async function sha256(plain: string): Promise<ArrayBuffer> {
    if (window.crypto && window.crypto.subtle) {
        const encoder = new TextEncoder()
        return crypto.subtle.digest('SHA-256', encoder.encode(plain))
    } else {
        // Fallback for non-secure contexts (HTTP over network)
        const hash = CryptoJS.SHA256(plain)
        const typedArray = new Uint8Array(hash.sigBytes)
        for (let i = 0; i < hash.sigBytes; i++) {
            typedArray[i] = ((hash as any).words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff
        }
        return typedArray.buffer
    }
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
