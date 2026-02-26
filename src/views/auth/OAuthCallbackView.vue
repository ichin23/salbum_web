<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { CheckCircle, XCircle, Loader } from "lucide-vue-next";
import {
  getStoredState,
  getStoredVerifier,
  clearOAuthStorage,
  SPOTIFY_REDIRECT_URI,
} from "../../composables/useOAuth";
import { useAuthStore } from "../../stores/auth";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

type Status = "loading" | "success" | "error";
const status = ref<Status>("loading");
const errorMessage = ref("");

onMounted(async () => {
  const provider = route.params.provider as "google" | "spotify";
  const code = route.query.code as string | undefined;
  const state = route.query.state as string | undefined;
  const error = route.query.error as string | undefined;

  // ── Provider negou acesso ─────────────────────────────────────────────────
  if (error) {
    status.value = "error";
    errorMessage.value =
      error === "access_denied"
        ? "Acesso negado pelo usuário."
        : `Erro do provedor: ${error}`;
    return;
  }

  // ── Código ausente ────────────────────────────────────────────────────────
  if (!code) {
    status.value = "error";
    errorMessage.value = "Código de autorização não encontrado na URL.";
    return;
  }

  // ── CSRF: valida state (apenas Spotify usa state/PKCE) ───────────────────
  if (provider === "spotify") {
    const storedState = getStoredState(provider);
    if (!storedState || storedState !== state) {
      status.value = "error";
      errorMessage.value =
        "Falha na validação de segurança (state inválido). Tente novamente.";
      clearOAuthStorage(provider);
      return;
    }

    const verifier = getStoredVerifier(provider);
    if (!verifier) {
      status.value = "error";
      errorMessage.value = "Verificador PKCE não encontrado. Tente novamente.";
      clearOAuthStorage(provider);
      return;
    }

    clearOAuthStorage(provider);

    try {
      await auth.loginWithSpotify(code, SPOTIFY_REDIRECT_URI, verifier);
      status.value = "success";
      setTimeout(() => router.replace({ name: "home" }), 1200);
    } catch (err) {
      status.value = "error";
      errorMessage.value =
        err instanceof Error ? err.message : "Erro desconhecido.";
    }
    return;
  }

  // ── Google: POST /auth/login/google { id_token: code } ───────────────────
  try {
    await auth.loginWithGoogle(code);
    status.value = "success";
    setTimeout(() => router.replace({ name: "home" }), 1200);
  } catch (err) {
    status.value = "error";
    errorMessage.value =
      err instanceof Error ? err.message : "Erro desconhecido.";
  }
});

const providerLabel = (p: string) => (p === "google" ? "Google" : "Spotify");
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

    <div class="relative w-full max-w-sm text-center space-y-6">
      <!-- Logo -->
      <div class="flex items-center justify-center gap-3 mb-2">
        <img
          src="../../assets/salbum_logo.svg"
          alt="Salbum"
          class="w-7 h-auto"
        />
        <span
          class="text-3xl text-white"
          style="font-family: var(--font-display); letter-spacing: 0.05em"
          >Salbum</span
        >
      </div>

      <!-- Card -->
      <div class="card p-8 space-y-5">
        <!-- Loading -->
        <template v-if="status === 'loading'">
          <div class="flex justify-center">
            <Loader class="w-10 h-10 text-primary animate-spin" />
          </div>
          <div>
            <p class="text-white font-semibold text-lg">Autenticando…</p>
            <p class="text-muted text-sm mt-1">
              Verificando seu login com
              {{ providerLabel(String($route.params.provider)) }}
            </p>
          </div>
        </template>

        <!-- Success -->
        <template v-else-if="status === 'success'">
          <div class="flex justify-center">
            <CheckCircle class="w-12 h-12 text-secondary" />
          </div>
          <div>
            <p class="text-white font-semibold text-lg">Login realizado!</p>
            <p class="text-muted text-sm mt-1">Redirecionando para o início…</p>
          </div>
        </template>

        <!-- Error -->
        <template v-else>
          <div class="flex justify-center">
            <XCircle class="w-12 h-12 text-red-400" />
          </div>
          <div>
            <p class="text-white font-semibold text-lg">
              Falha na autenticação
            </p>
            <p class="text-muted text-sm mt-1 leading-relaxed">
              {{ errorMessage }}
            </p>
          </div>
          <RouterLink
            to="/login"
            class="btn-primary w-full flex items-center justify-center text-sm"
          >
            Voltar ao login
          </RouterLink>
        </template>
      </div>
    </div>
  </div>
</template>
