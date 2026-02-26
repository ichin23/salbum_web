<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { getGoogleIdToken, loginWithSpotify } from "../../composables/useOAuth";
import { useAuthStore } from "../../stores/auth";

const router = useRouter();
const auth = useAuthStore();

const email = ref("");
const password = ref("");
const loading = ref(false);
const error = ref<string | null>(null);
const oauthLoading = ref<"google" | "spotify" | null>(null);

const forgotEmail = ref("");
const forgotLoading = ref(false);
const forgotSent = ref(false);
const showForgot = ref(false);

async function handleLogin() {
  error.value = null;
  loading.value = true;
  try {
    const result = await auth.login(email.value, password.value);
    if (result.mfaRequired) {
      router.push({ name: "verify" });
    } else {
      router.replace({ name: "home" });
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Erro ao fazer login.";
  } finally {
    loading.value = false;
  }
}

async function handleForgot() {
  forgotLoading.value = true;
  try {
    await auth.resetPassword(forgotEmail.value);
    forgotSent.value = true;
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Erro ao enviar email.";
  } finally {
    forgotLoading.value = false;
  }
}

async function handleGoogle() {
  oauthLoading.value = "google";
  error.value = null;
  try {
    const idToken = await getGoogleIdToken(); // abre popup GSI, resolve com id_token
    await auth.loginWithGoogle(idToken); // POST /auth/login/google
    router.replace({ name: "home" });
  } catch (e) {
    error.value =
      e instanceof Error ? e.message : "Erro ao autenticar com Google.";
    oauthLoading.value = null;
  }
}

async function handleSpotify() {
  oauthLoading.value = "spotify";
  try {
    await loginWithSpotify(); // redireciona — página vai trocar
  } catch {
    oauthLoading.value = null;
  }
}
</script>

<template>
  <div class="min-h-screen bg-dark flex items-center justify-center p-4">
    <!-- Background glow -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        class="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
      />
      <div
        class="absolute -bottom-40 -right-40 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"
      />
    </div>

    <div class="relative w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="flex items-center justify-center gap-3 mb-1">
          <img
            src="../../assets/salbum_logo.svg"
            alt="Salbum"
            class="w-8 h-auto"
          />
          <span
            class="text-4xl text-white"
            style="font-family: var(--font-display); letter-spacing: 0.05em"
            >Salbum</span
          >
        </div>
        <p class="text-muted text-sm mt-1">Sua jornada musical começa aqui</p>
      </div>

      <!-- Card -->
      <div class="card p-8 space-y-6">
        <div>
          <h2 class="text-xl font-bold text-white">Entrar</h2>
          <p class="text-muted text-sm mt-1">Bem-vindo de volta!</p>
        </div>

        <!-- ── OAuth buttons ───────────────────────────────────────── -->
        <div class="space-y-3">
          <!-- Google -->
          <button
            @click="handleGoogle"
            :disabled="!!oauthLoading"
            class="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] hover:bg-[var(--color-surface)] hover:border-[var(--color-muted)]/50 text-white text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span
              v-if="oauthLoading === 'google'"
              class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0"
            />
            <!-- Google logo SVG -->
            <svg
              v-else
              viewBox="0 0 24 24"
              class="w-5 h-5 flex-shrink-0"
              aria-hidden="true"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {{
              oauthLoading === "google"
                ? "Redirecionando…"
                : "Continuar com Google"
            }}
          </button>

          <!-- Spotify -->
          <button
            @click="handleSpotify"
            :disabled="!!oauthLoading"
            class="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl border border-[#1DB954]/30 bg-[#1DB954]/10 hover:bg-[#1DB954]/20 hover:border-[#1DB954]/60 text-white text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span
              v-if="oauthLoading === 'spotify'"
              class="w-4 h-4 border-2 border-white/30 border-t-[#1DB954] rounded-full animate-spin flex-shrink-0"
            />
            <!-- Spotify logo SVG -->
            <svg
              v-else
              viewBox="0 0 24 24"
              class="w-5 h-5 flex-shrink-0"
              fill="#1DB954"
              aria-hidden="true"
            >
              <path
                d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"
              />
            </svg>
            {{
              oauthLoading === "spotify"
                ? "Redirecionando…"
                : "Continuar com Spotify"
            }}
          </button>
        </div>

        <!-- Divider -->
        <div class="flex items-center gap-3">
          <div class="flex-1 h-px bg-[var(--color-border)]" />
          <span class="text-xs text-muted">ou entre com e-mail</span>
          <div class="flex-1 h-px bg-[var(--color-border)]" />
        </div>

        <!-- ── Email / password form ────────────────────────────────── -->
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div class="space-y-1">
            <label class="text-sm font-medium text-[var(--color-text)]"
              >E-mail</label
            >
            <input
              v-model="email"
              type="email"
              placeholder="seu@email.com"
              class="input-field"
              required
            />
          </div>

          <div class="space-y-1">
            <label class="text-sm font-medium text-[var(--color-text)]"
              >Senha</label
            >
            <input
              v-model="password"
              type="password"
              placeholder="••••••••"
              class="input-field"
              required
            />
          </div>

          <div class="flex justify-end">
            <button
              type="button"
              @click="showForgot = true"
              class="text-xs text-primary hover:text-primary-hover transition-colors"
            >
              Esqueceu a senha?
            </button>
          </div>

          <!-- Erro de login -->
          <p v-if="error" class="text-sm text-red-400 text-center -mt-1">
            {{ error }}
          </p>

          <button
            type="submit"
            class="btn-primary w-full flex items-center justify-center gap-2"
            :disabled="loading"
          >
            <span
              v-if="loading"
              class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
            />
            {{ loading ? "Entrando..." : "Entrar" }}
          </button>
        </form>

        <p class="text-center text-sm text-muted">
          Não tem uma conta?
          <RouterLink
            to="/register"
            class="text-primary hover:text-primary-hover font-medium transition-colors"
          >
            Criar conta
          </RouterLink>
        </p>
      </div>

      <!-- Privacy note -->
      <p class="text-center text-xs text-muted mt-4 leading-relaxed px-4">
        Ao continuar, você concorda com nossos
        <a href="#" class="text-primary hover:underline">Termos de Uso</a>
        e
        <a href="#" class="text-primary hover:underline"
          >Política de Privacidade</a
        >.
      </p>
    </div>
  </div>

  <!-- Modal: Esqueceu a senha -->
  <Teleport to="body">
    <div
      v-if="showForgot"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      @click.self="showForgot = false"
    >
      <div class="card w-full max-w-sm p-6 space-y-4">
        <h3 class="text-white font-semibold text-lg">Recuperar senha</h3>

        <template v-if="!forgotSent">
          <p class="text-muted text-sm">
            Digite seu e-mail e enviaremos um link para redefinir sua senha.
          </p>
          <input
            v-model="forgotEmail"
            type="email"
            placeholder="seu@email.com"
            class="input-field"
          />
          <div class="flex gap-3">
            <button
              @click="showForgot = false"
              class="flex-1 px-4 py-2 rounded-2xl border border-[var(--color-border)] text-muted text-sm hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              @click="handleForgot"
              :disabled="forgotLoading || !forgotEmail"
              class="flex-1 btn-primary flex items-center justify-center gap-2 text-sm"
            >
              <span
                v-if="forgotLoading"
                class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
              />
              {{ forgotLoading ? "Enviando..." : "Enviar" }}
            </button>
          </div>
        </template>

        <template v-else>
          <div class="text-center space-y-2">
            <div
              class="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto"
            >
              <svg
                class="w-6 h-6 text-secondary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p class="text-white font-medium">Email enviado!</p>
            <p class="text-muted text-sm">Verifique sua caixa de entrada.</p>
            <button
              @click="
                showForgot = false;
                forgotSent = false;
              "
              class="text-primary text-sm hover:text-primary-hover transition-colors"
            >
              Fechar
            </button>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>
