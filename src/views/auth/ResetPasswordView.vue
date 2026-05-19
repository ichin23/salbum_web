<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { changePassword } from "../../services/authService";

const route = useRoute();

// ─── Token validation ─────────────────────────────────────────────────────────

const token = ref<string | null>(null);
const tokenError = ref<string | null>(null);

function isValidJwt(value: string): boolean {
  // JWT tem exatamente 3 partes separadas por "."
  const parts = value.split(".");
  if (parts.length !== 3) return false;
  try {
    // Tenta decodificar o payload para verificar expiração
    const part = parts[1];
    if (!part) return false;
    const payload = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return false; // token expirado
    }
    return true;
  } catch {
    return false;
  }
}

onMounted(() => {
  const raw = route.query.token as string | undefined;

  if (!raw) {
    tokenError.value = "Link inválido. Nenhum token encontrado.";
    return;
  }

  if (!isValidJwt(raw)) {
    tokenError.value = "Token inválido ou expirado. Solicite um novo link de redefinição.";
    return;
  }

  token.value = raw;
});

// ─── Form ─────────────────────────────────────────────────────────────────────

const newPassword = ref("");
const confirmPassword = ref("");
const showNew = ref(false);
const showConfirm = ref(false);
const loading = ref(false);
const success = ref(false);
const error = ref<string | null>(null);

const passwordsMatch = computed(
  () => !confirmPassword.value || newPassword.value === confirmPassword.value
);

const isStrong = computed(() => {
  const p = newPassword.value;
  return p.length >= 8 && /[A-Z]/.test(p) && /[0-9]/.test(p);
});

const strengthLabel = computed(() => {
  if (!newPassword.value) return "";
  if (newPassword.value.length < 6) return "Muito fraca";
  if (!isStrong.value) return "Fraca";
  if (newPassword.value.length >= 12) return "Forte";
  return "Média";
});

const strengthColor = computed(() => {
  switch (strengthLabel.value) {
    case "Forte": return "var(--color-secondary)";
    case "Média": return "#f59e0b";
    case "Fraca": return "#f97316";
    case "Muito fraca": return "#ef4444";
    default: return "transparent";
  }
});

const strengthWidth = computed(() => {
  switch (strengthLabel.value) {
    case "Forte": return "100%";
    case "Média": return "65%";
    case "Fraca": return "35%";
    case "Muito fraca": return "15%";
    default: return "0%";
  }
});

async function handleSubmit() {
  error.value = null;

  if (!passwordsMatch.value) {
    error.value = "As senhas não coincidem.";
    return;
  }

  if (!isStrong.value) {
    error.value = "A senha precisa ter ao menos 8 caracteres, uma letra maiúscula e um número.";
    return;
  }

  loading.value = true;
  try {
    await changePassword({ newPassword: newPassword.value, token: token.value! });
    success.value = true;
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Erro ao redefinir a senha.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-dark flex items-center justify-center p-4">
    <!-- Background glows -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
    </div>

    <div class="relative w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="flex items-center justify-center gap-3 mb-1">
          <img src="../../assets/salbum_logo.svg" alt="Salbum" class="w-8 h-auto" />
          <span
            class="text-4xl text-white"
            style="font-family: var(--font-display); letter-spacing: 0.05em"
          >Salbum</span>
        </div>
        <p class="text-muted text-sm mt-1">Redefinição de senha</p>
      </div>

      <!-- Card -->
      <div class="card p-8 space-y-6">

        <!-- ── Token inválido ──────────────────────────────────────────────── -->
        <template v-if="tokenError">
          <div class="text-center space-y-4">
            <div
              class="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
              style="background: rgba(239,68,68,0.12)"
            >
              <svg class="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                />
              </svg>
            </div>
            <div>
              <p class="text-white font-semibold text-lg">Link inválido</p>
              <p class="text-muted text-sm mt-1">{{ tokenError }}</p>
            </div>
            <RouterLink
              to="/login"
              class="btn-primary inline-flex items-center gap-2 text-sm px-6 py-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              Voltar ao login
            </RouterLink>
          </div>
        </template>

        <!-- ── Sucesso ─────────────────────────────────────────────────────── -->
        <template v-else-if="success">
          <div class="text-center space-y-4">
            <div
              class="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
              style="background: rgba(var(--color-secondary-rgb, 29, 185, 84), 0.12)"
            >
              <svg class="w-7 h-7 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p class="text-white font-semibold text-lg">Senha redefinida!</p>
              <p class="text-muted text-sm mt-1">
                Sua senha foi alterada com sucesso. Você já pode fazer login.
              </p>
            </div>
            <RouterLink
              to="/login"
              class="btn-primary inline-flex items-center gap-2 text-sm px-6 py-2"
            >
              Ir para o login
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </RouterLink>
          </div>
        </template>

        <!-- ── Formulário ──────────────────────────────────────────────────── -->
        <template v-else>
          <div>
            <h2 class="text-xl font-bold text-white">Nova senha</h2>
            <p class="text-muted text-sm mt-1">Escolha uma senha segura para sua conta.</p>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-4">
            <!-- Nova senha -->
            <div class="space-y-1">
              <label class="text-sm font-medium text-[var(--color-text)]">Nova senha</label>
              <div class="relative">
                <input
                  id="new-password"
                  v-model="newPassword"
                  :type="showNew ? 'text' : 'password'"
                  placeholder="••••••••"
                  class="input-field pr-10"
                  required
                  autocomplete="new-password"
                />
                <button
                  type="button"
                  @click="showNew = !showNew"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-[var(--color-text)] transition-colors"
                  :aria-label="showNew ? 'Ocultar senha' : 'Mostrar senha'"
                >
                  <svg v-if="!showNew" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-4.753 4.753m4.753-4.753L3.596 3.039m10.318 10.318L21 21M3 3l18 18" />
                  </svg>
                </button>
              </div>

              <!-- Barra de força -->
              <div v-if="newPassword" class="mt-2 space-y-1">
                <div class="h-1 rounded-full bg-[var(--color-border)] overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-300"
                    :style="{ width: strengthWidth, backgroundColor: strengthColor }"
                  />
                </div>
                <p class="text-xs" :style="{ color: strengthColor }">{{ strengthLabel }}</p>
              </div>
            </div>

            <!-- Confirmar senha -->
            <div class="space-y-1">
              <label class="text-sm font-medium text-[var(--color-text)]">Confirmar senha</label>
              <div class="relative">
                <input
                  id="confirm-password"
                  v-model="confirmPassword"
                  :type="showConfirm ? 'text' : 'password'"
                  placeholder="••••••••"
                  class="input-field pr-10"
                  :class="{ 'border-red-500/60 focus:border-red-500': confirmPassword && !passwordsMatch }"
                  required
                  autocomplete="new-password"
                />
                <button
                  type="button"
                  @click="showConfirm = !showConfirm"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-[var(--color-text)] transition-colors"
                  :aria-label="showConfirm ? 'Ocultar senha' : 'Mostrar senha'"
                >
                  <svg v-if="!showConfirm" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-4.753 4.753m4.753-4.753L3.596 3.039m10.318 10.318L21 21M3 3l18 18" />
                  </svg>
                </button>
              </div>
              <p v-if="confirmPassword && !passwordsMatch" class="text-xs text-red-400">
                As senhas não coincidem.
              </p>
            </div>

            <!-- Hints -->
            <ul class="space-y-1 text-xs text-muted">
              <li class="flex items-center gap-2">
                <span
                  class="w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors"
                  :style="{ backgroundColor: newPassword.length >= 8 ? 'var(--color-secondary)' : 'var(--color-border)' }"
                >
                  <svg v-if="newPassword.length >= 8" class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                Pelo menos 8 caracteres
              </li>
              <li class="flex items-center gap-2">
                <span
                  class="w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors"
                  :style="{ backgroundColor: /[A-Z]/.test(newPassword) ? 'var(--color-secondary)' : 'var(--color-border)' }"
                >
                  <svg v-if="/[A-Z]/.test(newPassword)" class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                Uma letra maiúscula
              </li>
              <li class="flex items-center gap-2">
                <span
                  class="w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors"
                  :style="{ backgroundColor: /[0-9]/.test(newPassword) ? 'var(--color-secondary)' : 'var(--color-border)' }"
                >
                  <svg v-if="/[0-9]/.test(newPassword)" class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                Um número
              </li>
            </ul>

            <!-- Erro da API -->
            <p v-if="error" class="text-sm text-red-400 text-center">{{ error }}</p>

            <button
              type="submit"
              id="reset-password-submit"
              class="btn-primary w-full flex items-center justify-center gap-2"
              :disabled="loading || !passwordsMatch || !isStrong"
            >
              <span
                v-if="loading"
                class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
              />
              {{ loading ? "Salvando..." : "Redefinir senha" }}
            </button>
          </form>

          <p class="text-center text-sm text-muted">
            <RouterLink to="/login" class="text-primary hover:text-primary-hover transition-colors">
              ← Voltar ao login
            </RouterLink>
          </p>
        </template>

      </div>
    </div>
  </div>
</template>
