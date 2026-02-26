import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as authService from '../services/authService'
import * as userService from '../services/userService'
import type { AuthUser } from '../services/authService'

const TOKEN_KEY = 'salbum_access_token'
const TOKEN_EXP_KEY = 'salbum_token_exp'
const USER_KEY = 'salbum_user'

export const useAuthStore = defineStore('auth', () => {
    // ─── State ───────────────────────────────────────────────────────────────
    const user = ref<AuthUser | null>(loadUser())
    const accessToken = ref<string | null>(localStorage.getItem(TOKEN_KEY))

    // email guardado temporariamente durante fluxos MFA
    const pendingEmail = ref<string | null>(null)
    // contexto MFA: 'LOGIN' ou 'REGISTER'
    const mfaContext = ref<'LOGIN' | 'REGISTER' | null>(null)

    // ─── Getters ──────────────────────────────────────────────────────────────
    const isAuthenticated = computed(() => !!accessToken.value && !!user.value)

    // ─── Helpers privados ─────────────────────────────────────────────────────
    function loadUser(): AuthUser | null {
        try {
            const raw = localStorage.getItem(USER_KEY)
            return raw ? (JSON.parse(raw) as AuthUser) : null
        } catch {
            return null
        }
    }

    function saveSession(token: authService.Token, authUser: AuthUser) {
        accessToken.value = token.value
        user.value = authUser
        localStorage.setItem(TOKEN_KEY, token.value)
        localStorage.setItem(TOKEN_EXP_KEY, token.expire_at)
        localStorage.setItem(USER_KEY, JSON.stringify(authUser))
    }

    function clearSession() {
        accessToken.value = null
        user.value = null
        pendingEmail.value = null
        mfaContext.value = null
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(TOKEN_EXP_KEY)
        localStorage.removeItem(USER_KEY)
    }

    // ─── Actions ──────────────────────────────────────────────────────────────

    async function register(name: string, username: string, email: string, password: string) {
        const res = await authService.register({ name, username, email, password })

        if (res.status === 'MFA_REQUIRED') {
            pendingEmail.value = email
            mfaContext.value = 'REGISTER'
            return { mfaRequired: true }
        }

        if (res.status === 'SUCCESS' && res.access_token && res.user) {
            saveSession(res.access_token, res.user)
            return { mfaRequired: false }
        }

        throw new Error(res.message ?? 'Erro ao criar conta.')
    }

    async function login(email: string, password: string) {
        const res = await authService.login({ email, password })

        if (res.status === 'MFA_REQUIRED') {
            pendingEmail.value = email
            mfaContext.value = 'LOGIN'
            return { mfaRequired: true }
        }

        if (res.status === 'SUCCESS' && res.access_token && res.user) {
            saveSession(res.access_token, res.user)
            return { mfaRequired: false }
        }

        throw new Error(res.message ?? 'Email ou senha inválidos.')
    }

    async function validateCode(code: string) {
        if (!pendingEmail.value) throw new Error('Nenhum email pendente.')

        const fn = mfaContext.value === 'LOGIN'
            ? authService.validateCodeLogin
            : authService.validateEmail

        const res = await fn({ email: pendingEmail.value, code })

        if (res.status === 'SUCCESS' && res.access_token && res.user) {
            saveSession(res.access_token, res.user)
            pendingEmail.value = null
            mfaContext.value = null
            return
        }

        throw new Error(res.message ?? 'Código inválido.')
    }

    async function resendCode() {
        if (!pendingEmail.value || !mfaContext.value) throw new Error('Nenhum email pendente.')
        await authService.resendCode({ email: pendingEmail.value, context: mfaContext.value })
    }

    async function loginWithGoogle(idToken: string) {
        const res = await authService.loginGoogle({ id_token: idToken })
        if (res.status === 'SUCCESS' && res.access_token && res.user) {
            saveSession(res.access_token, res.user)
            return
        }
        throw new Error(res.message ?? 'Erro ao autenticar com Google.')
    }

    async function loginWithSpotify(code: string, redirectUri: string, codeVerifier: string) {
        const res = await authService.loginSpotify({ code, redirect_uri: redirectUri, code_verifier: codeVerifier })
        if (res.status === 'SUCCESS' && res.access_token && res.user) {
            saveSession(res.access_token, res.user)
            return
        }
        throw new Error(res.message ?? 'Erro ao autenticar com Spotify.')
    }

    async function refresh() {
        try {
            // web: backend lê o cookie HttpOnly — body pode ser vazio
            const res = await authService.refreshToken()
            accessToken.value = res.access_token.value
            localStorage.setItem(TOKEN_KEY, res.access_token.value)
            localStorage.setItem(TOKEN_EXP_KEY, res.access_token.expire_at)
            if (res.user) user.value = res.user
        } catch {
            clearSession()
            throw new Error('Sessão expirada. Faça login novamente.')
        }
    }

    async function resetPassword(email: string) {
        return authService.resetPassword({ email })
    }

    async function updateProfile(payload: userService.UpdateProfileRequest) {
        const updated = await userService.updateMe(payload)
        user.value = updated
        localStorage.setItem(USER_KEY, JSON.stringify(updated))
    }

    function logout() {
        clearSession()
    }

    return {
        // state
        user,
        accessToken,
        pendingEmail,
        mfaContext,
        // getters
        isAuthenticated,
        // actions
        register,
        login,
        validateCode,
        resendCode,
        loginWithGoogle,
        loginWithSpotify,
        refresh,
        resetPassword,
        updateProfile,
        logout,
    }
})
