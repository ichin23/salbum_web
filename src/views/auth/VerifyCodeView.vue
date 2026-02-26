<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";

const router = useRouter();
const auth = useAuthStore();

const CODE_LENGTH = 6;
const digits = reactive(Array(CODE_LENGTH).fill(""));
const inputs = ref<HTMLInputElement[]>([]);

function setInput(el: unknown, i: number) {
  if (el) inputs.value[i] = el as HTMLInputElement;
}
const loading = ref(false);
const resending = ref(false);
const error = ref<string | null>(null);
const resendSuccess = ref(false);

const isComplete = computed(() => digits.every((d) => d !== ""));

// redireciona se não há email pendente
onMounted(() => {
  if (!auth.pendingEmail) {
    router.replace({ name: "login" });
  }
});

function onInput(index: number, event: Event) {
  const target = event.target as HTMLInputElement;
  const val = target.value.replace(/\D/g, "");
  digits[index] = val.slice(-1);

  if (val && index < CODE_LENGTH - 1) {
    inputs.value[index + 1]?.focus();
  }
}

function onKeydown(index: number, event: KeyboardEvent) {
  if (event.key === "Backspace" && !digits[index] && index > 0) {
    inputs.value[index - 1]?.focus();
  }
}

function onPaste(event: ClipboardEvent) {
  event.preventDefault();
  const text = event.clipboardData?.getData("text").replace(/\D/g, "") ?? "";
  text
    .split("")
    .slice(0, CODE_LENGTH)
    .forEach((char, i) => {
      digits[i] = char;
    });
  const nextEmpty = digits.findIndex((d) => !d);
  const focusIndex = nextEmpty === -1 ? CODE_LENGTH - 1 : nextEmpty;
  inputs.value[focusIndex]?.focus();
}

async function handleVerify() {
  error.value = null;
  loading.value = true;
  try {
    await auth.validateCode(digits.join(""));
    router.replace({ name: "home" });
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Código inválido.";
    // limpa os campos
    digits.fill("");
    inputs.value[0]?.focus();
  } finally {
    loading.value = false;
  }
}

async function handleResend() {
  error.value = null;
  resendSuccess.value = false;
  resending.value = true;
  try {
    await auth.resendCode();
    resendSuccess.value = true;
    setTimeout(() => {
      resendSuccess.value = false;
    }, 4000);
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Erro ao reenviar código.";
  } finally {
    resending.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-dark flex items-center justify-center p-4">
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl"
      />
    </div>

    <div class="relative w-full max-w-sm">
      <div class="text-center mb-8">
        <div class="flex items-center justify-center gap-3">
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
      </div>

      <div class="card p-8 space-y-8">
        <div class="text-center">
          <div
            class="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4"
          >
            <svg
              class="w-7 h-7 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 class="text-xl font-bold text-white">Verifique seu e-mail</h2>
          <p class="text-muted text-sm mt-2">
            Enviamos um código de 6 dígitos para o seu e-mail. Digite-o abaixo.
          </p>
        </div>

        <!-- Digit inputs -->
        <div class="flex gap-3 justify-center" @paste="onPaste">
          <input
            v-for="(_, i) in digits"
            :key="i"
            :ref="(el) => setInput(el, i)"
            :value="digits[i]"
            type="text"
            inputmode="numeric"
            maxlength="1"
            class="w-12 h-14 text-center text-xl font-bold bg-[var(--color-surface-2)] border border-[var(--color-border)] text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 caret-transparent"
            @input="onInput(i, $event)"
            @keydown="onKeydown(i, $event)"
          />
        </div>

        <div class="space-y-3">
          <button
            @click="handleVerify"
            class="btn-primary w-full flex items-center justify-center gap-2"
            :disabled="loading || !isComplete"
          >
            <span
              v-if="loading"
              class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
            />
            {{ loading ? "Verificando..." : "Verificar" }}
          </button>

          <p v-if="error" class="text-sm text-red-400 text-center">
            {{ error }}
          </p>
          <p v-if="resendSuccess" class="text-sm text-secondary text-center">
            Código reenviado!
          </p>

          <p class="text-center text-sm text-muted">
            Não recebeu?
            <button
              @click="handleResend"
              :disabled="resending"
              class="text-primary hover:text-primary-hover font-medium transition-colors disabled:opacity-50"
            >
              {{ resending ? "Reenviando..." : "Reenviar código" }}
            </button>
          </p>

          <p class="text-center text-xs text-muted">
            Email: <span class="text-white">{{ auth.pendingEmail }}</span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
