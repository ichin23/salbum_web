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
            <input
              v-model="password"
              type="password"
              placeholder="••••••••"
              class="input-field"
              required
            />
          </div>

          <div class="space-y-1">
            <label class="text-sm font-medium text-[var(--color-text)]"
              >Confirmar senha</label
            >
            <input
              v-model="confirmPassword"
              type="password"
              placeholder="••••••••"
              class="input-field"
              required
            />
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
