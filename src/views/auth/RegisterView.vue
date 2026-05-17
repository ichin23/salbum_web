<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";

const router = useRouter();
const auth = useAuthStore();

const name = ref("");
const username = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const loading = ref(false);
const error = ref<string | null>(null);

async function handleRegister() {
  error.value = null;

  if (password.value !== confirmPassword.value) {
    error.value = "As senhas não coincidem.";
    return;
  }

  loading.value = true;
  try {
    const result = await auth.register(
      name.value,
      username.value,
      email.value,
      password.value,
    );
    if (result.mfaRequired) {
      router.push({ name: "verify" });
    } else {
      router.replace({ name: "home" });
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Erro ao criar conta.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-dark flex items-center justify-center p-4">
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        class="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
      />
      <div
        class="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"
      />
    </div>

    <div class="relative w-full max-w-md">
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
        <p class="text-muted text-sm mt-1">
          Crie sua conta e comece a explorar
        </p>
      </div>

      <div class="card p-8 space-y-6">
        <div>
          <h2 class="text-xl font-bold text-white">Criar conta</h2>
          <p class="text-muted text-sm mt-1">Preencha os dados abaixo</p>
        </div>

        <form @submit.prevent="handleRegister" class="space-y-4">
          <div class="space-y-1">
            <label class="text-sm font-medium text-[var(--color-text)]"
              >Nome completo</label
            >
            <input
              v-model="name"
              type="text"
              placeholder="Seu nome"
              class="input-field"
              required
            />
          </div>

          <div class="space-y-1">
            <label class="text-sm font-medium text-[var(--color-text)]"
              >Nome de usuário</label
            >
            <input
              v-model="username"
              type="text"
              placeholder="seu_usuario"
              class="input-field"
              required
            />
          </div>

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
            <div class="relative">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                class="input-field pr-10"
                required
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-[var(--color-text)] transition-colors"
                :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
              >
                <svg
                  v-if="!showPassword"
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                <svg
                  v-else
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-4.753 4.753m4.753-4.753L3.596 3.039m10.318 10.318L21 21M3 3l18 18"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-sm font-medium text-[var(--color-text)]"
              >Confirmar senha</label
            >
            <div class="relative">
              <input
                v-model="confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="••••••••"
                class="input-field pr-10"
                required
              />
              <button
                type="button"
                @click="showConfirmPassword = !showConfirmPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-[var(--color-text)] transition-colors"
                :aria-label="showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'"
              >
                <svg
                  v-if="!showConfirmPassword"
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                <svg
                  v-else
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-4.753 4.753m4.753-4.753L3.596 3.039m10.318 10.318L21 21M3 3l18 18"
                  />
                </svg>
              </button>
            </div>
          </div>

          <p v-if="error" class="text-sm text-red-400 text-center">
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
            {{ loading ? "Criando conta..." : "Criar conta" }}
          </button>
        </form>

        <p class="text-center text-sm text-muted">
          Já tem uma conta?
          <RouterLink
            to="/login"
            class="text-primary hover:text-primary-hover font-medium transition-colors"
          >
            Entrar
          </RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>
