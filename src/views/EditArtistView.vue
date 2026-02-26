<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  ArrowLeft,
  Loader2,
  Check,
  AlertCircle,
  CheckCircle2,
} from "lucide-vue-next";
import {
  updateArtist,
  getArtistUploadImageUrl,
} from "../services/artistService";
import { uploadImageToPresignedUrl } from "../services/albumService";
import { fetchArtistDetails } from "../services/fetchService";
import type { FetchArtistDetails } from "../types";
import ImageUploadButton from "../components/ImageUploadButton.vue";

const route = useRoute();
const router = useRouter();

const artistId = route.params.id as string;

// ─── State ────────────────────────────────────────────────────────────────────
const loadingData = ref(true);
const loadError = ref<string | null>(null);

const name = ref("");
const country = ref("");
const born_date = ref("");
const death_date = ref("");
const image_url = ref<string | null>(null);

const saving = ref(false);
const error = ref<string | null>(null);
const success = ref(false);

// ─── Load ─────────────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    const data = await fetchArtistDetails(artistId);
    const artist: FetchArtistDetails =
      (data as unknown as { artist: FetchArtistDetails }).artist ??
      (data as unknown as FetchArtistDetails);
    name.value = artist.name ?? "";
    country.value = artist.country ?? "";
    born_date.value = artist.born_date ?? "";
    death_date.value = artist.death_date ?? "";
    image_url.value = artist.image_url ?? null;
  } catch (e) {
    loadError.value =
      e instanceof Error ? e.message : "Erro ao carregar artista.";
  } finally {
    loadingData.value = false;
  }
});

// ─── Image upload ──────────────────────────────────────────────────────────────
async function handleImageUpload(file: File): Promise<string> {
  const { url, path } = await getArtistUploadImageUrl(artistId);
  await uploadImageToPresignedUrl(url, file);
  image_url.value = path;
  return path;
}

// ─── Submit ────────────────────────────────────────────────────────────────────
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
    await updateArtist(artistId, {
      name: name.value.trim(),
      country: country.value.trim() || null,
      born_date: born_date.value || null,
      death_date: death_date.value || null,
      image_url: image_url.value,
    });
    success.value = true;
    setTimeout(
      () => router.push({ name: "artist-detail", params: { id: artistId } }),
      800,
    );
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Erro ao salvar artista.";
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="min-h-full pb-12">
    <!-- Header -->
    <div
      class="flex items-center gap-3 px-4 sm:px-8 pt-6 pb-6 border-b border-[var(--color-border)]"
    >
      <button
        @click="router.back()"
        class="w-9 h-9 flex items-center justify-center rounded-xl text-muted hover:text-white hover:bg-[var(--color-surface)] transition-all"
      >
        <ArrowLeft class="w-5 h-5" />
      </button>
      <h1 class="text-lg font-bold text-white">Editar artista</h1>
    </div>

    <!-- Loading -->
    <div v-if="loadingData" class="flex justify-center py-20">
      <Loader2 class="w-8 h-8 text-muted animate-spin" />
    </div>

    <!-- Load error -->
    <div
      v-else-if="loadError"
      class="flex items-center gap-2 text-red-400 text-sm px-4 sm:px-8 py-10"
    >
      <AlertCircle class="w-4 h-4 flex-shrink-0" />
      {{ loadError }}
    </div>

    <div v-else class="px-4 sm:px-8 pt-8 max-w-lg">
      <form @submit.prevent="submit" class="space-y-5">
        <!-- Image upload -->
        <ImageUploadButton
          label="Foto do artista"
          :current-image-url="image_url"
          :on-upload="handleImageUpload"
          size="lg"
          shape="circle"
          @uploaded="(url) => (image_url = url)"
        />

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
            maxlength="120"
            class="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-4 py-3 text-sm text-white placeholder-muted focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <!-- Country -->
        <div class="space-y-1.5">
          <label
            class="text-xs font-semibold text-muted uppercase tracking-wider"
            >País</label
          >
          <select
            v-model="country"
            class="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
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
            <option value="ES">Espanha</option>
            <option value="IT">Itália</option>
            <option value="PT">Portugal</option>
            <option value="KR">Coreia do Sul</option>
            <option value="NU">Outro</option>
          </select>
        </div>

        <!-- Born date -->
        <div class="space-y-1.5">
          <label
            class="text-xs font-semibold text-muted uppercase tracking-wider"
            >Data de nascimento</label
          >
          <input
            v-model="born_date"
            type="date"
            class="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <!-- Death date -->
        <div class="space-y-1.5">
          <label
            class="text-xs font-semibold text-muted uppercase tracking-wider"
            >Data de falecimento</label
          >
          <input
            v-model="death_date"
            type="date"
            class="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <!-- Feedback -->
        <div
          v-if="error"
          class="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 rounded-2xl px-4 py-3"
        >
          <AlertCircle class="w-4 h-4 flex-shrink-0" />
          {{ error }}
        </div>
        <div
          v-if="success"
          class="flex items-center gap-2 text-secondary text-sm bg-secondary/10 rounded-2xl px-4 py-3"
        >
          <CheckCircle2 class="w-4 h-4 flex-shrink-0" />
          Artista atualizado!
        </div>

        <!-- Submit -->
        <button
          type="submit"
          :disabled="saving"
          class="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold rounded-2xl py-3 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
          <Check v-else class="w-4 h-4" />
          {{ saving ? "Salvando..." : "Salvar alterações" }}
        </button>
      </form>
    </div>
  </div>
</template>
