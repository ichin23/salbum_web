<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { ArrowLeft, Loader2, Check } from "lucide-vue-next";
import { createArtist } from "../services/artistService";

const router = useRouter();

const name = ref("");
const country = ref("");
const born_date = ref("");
const death_date = ref("");

const saving = ref(false);
const error = ref<string | null>(null);
const success = ref(false);

function validate(): string | null {
  if (!name.value.trim()) return "Nome é obrigatório.";
  return null;
}

async function submit() {
  error.value = null;
  const err = validate();
  if (err) {
    error.value = err;
    return;
  }
  saving.value = true;
  try {
    const artist = await createArtist({
      name: name.value.trim(),
      country: country.value.trim() || null,
      born_date: born_date.value || null,
      death_date: death_date.value || null,
    });
    success.value = true;
    setTimeout(
      () => router.push({ name: "artist-detail", params: { id: artist.id } }),
      800,
    );
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Erro ao criar artista.";
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="max-w-lg mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <button
        @click="router.back()"
        class="p-2 rounded-xl text-muted hover:text-white hover:bg-[var(--color-surface-2)] transition-colors"
      >
        <ArrowLeft class="w-5 h-5" />
      </button>
      <div>
        <h1 class="text-xl font-bold text-white">Criar artista</h1>
        <p class="text-xs text-muted mt-0.5">Adicione um artista ao catálogo</p>
      </div>
    </div>

    <form @submit.prevent="submit" class="space-y-4">
      <!-- Name -->
      <div class="space-y-1.5">
        <label
          class="text-xs font-semibold text-muted uppercase tracking-wider"
        >
          Nome <span class="text-red-400">*</span>
        </label>
        <input
          v-model="name"
          type="text"
          placeholder="Nome do artista"
          class="w-full bg-[var(--color-surface)] border border-[var(--color-border)] text-white placeholder-muted rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      <!-- Country -->
      <div class="space-y-1.5">
        <label class="text-xs font-semibold text-muted uppercase tracking-wider"
          >País</label
        >
        <select
          v-model="country"
          class="w-full bg-[var(--color-surface)] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
        >
          <option value="">Selecionar...</option>
          <option value="BR">Brasil</option>
          <option value="US">Estados Unidos</option>
          <option value="GB">Reino Unido</option>
          <option value="DE">Alemanha</option>
          <option value="FR">França</option>
          <option value="JP">Japão</option>
          <option value="SE">Suécia</option>
          <option value="NO">Noruega</option>
          <option value="IS">Islândia</option>
          <option value="AU">Austrália</option>
          <option value="CA">Canadá</option>
          <option value="IE">Irlanda</option>
          <option value="NZ">Nova Zelândia</option>
          <option value="NG">Nigéria</option>
          <option value="ZA">África do Sul</option>
          <option value="JM">Jamaica</option>
          <option value="CO">Colômbia</option>
          <option value="AR">Argentina</option>
          <option value="MX">México</option>
          <option value="CU">Cuba</option>
          <option value="ES">Espanha</option>
          <option value="IT">Itália</option>
          <option value="PT">Portugal</option>
          <option value="KR">Coreia do Sul</option>
          <option value="NU">Outro</option>
        </select>
      </div>

      <!-- Dates -->
      <div class="grid grid-cols-2 gap-3">
        <div class="space-y-1.5">
          <label
            class="text-xs font-semibold text-muted uppercase tracking-wider"
          >
            Data de nascimento
          </label>
          <input
            v-model="born_date"
            type="date"
            class="w-full bg-[var(--color-surface)] border border-[var(--color-border)] text-white placeholder-muted rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <div class="space-y-1.5">
          <label
            class="text-xs font-semibold text-muted uppercase tracking-wider"
          >
            Data de morte
          </label>
          <input
            v-model="death_date"
            type="date"
            class="w-full bg-[var(--color-surface)] border border-[var(--color-border)] text-white placeholder-muted rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      <!-- Error -->
      <p v-if="error" class="text-sm text-red-400">{{ error }}</p>

      <!-- Submit -->
      <button
        type="submit"
        :disabled="saving || success"
        class="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-60"
        :class="
          success
            ? 'bg-green-500 text-white'
            : 'bg-primary text-white hover:bg-primary/90'
        "
      >
        <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
        <Check v-else-if="success" class="w-4 h-4" />
        {{
          success ? "Artista criado!" : saving ? "Salvando..." : "Criar artista"
        }}
      </button>
    </form>
  </div>
</template>
