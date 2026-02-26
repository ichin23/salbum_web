<script setup lang="ts">
/**
 * AppImage — imagem com fallback robusto.
 *
 * Trata:
 *  - src nulo / vazio / string "null" / URL terminando em "/null"
 *  - erro de carregamento (@error) → mostra fallback visual
 *
 * Tipos de fallback:
 *  - "album"  → ícone de disco (quadrado)
 *  - "artist" → inicial do nome / ícone de usuário (círculo ou quadrado)
 *  - "music"  → ícone de nota musical (quadrado)
 */
import { ref, computed } from "vue";
import { Disc3, User, Music } from "lucide-vue-next";

const props = withDefaults(
  defineProps<{
    src: string | null | undefined;
    alt?: string;
    type?: "album" | "artist" | "music";
    /** Inicial a exibir quando não há foto (artista). Se vazio usa ícone. */
    initial?: string;
    rounded?: "lg" | "xl" | "2xl" | "3xl" | "full";
  }>(),
  {
    alt: "",
    type: "album",
    initial: "",
    rounded: "2xl",
  },
);

const failed = ref(false);

function isValid(url: string | null | undefined): url is string {
  return !!url && url !== "null" && !url.endsWith("/null") && url.trim() !== "";
}

const effectiveSrc = computed(() => (isValid(props.src) ? props.src : null));

function onError() {
  failed.value = true;
}

const showImg = computed(() => effectiveSrc.value !== null && !failed.value);

const roundedClass = computed(() => ({
  "rounded-lg": props.rounded === "lg",
  "rounded-xl": props.rounded === "xl",
  "rounded-2xl": props.rounded === "2xl",
  "rounded-3xl": props.rounded === "3xl",
  "rounded-full": props.rounded === "full",
}));
</script>

<template>
  <div
    class="relative overflow-hidden bg-[var(--color-surface-2)] w-full h-full flex items-center justify-center"
    :class="roundedClass"
  >
    <!-- Imagem real -->
    <img
      v-if="showImg"
      :src="effectiveSrc!"
      :alt="alt"
      class="w-full h-full object-cover"
      loading="lazy"
      @error="onError"
    />

    <!-- Fallback visual -->
    <template v-else>
      <!-- Artista com inicial -->
      <span
        v-if="type === 'artist' && initial"
        class="font-bold text-muted select-none leading-none"
        style="font-size: 40%"
        >{{ initial[0]?.toUpperCase() }}</span
      >

      <!-- Ícone genérico -->
      <Disc3 v-else-if="type === 'album'" class="w-2/5 h-2/5 text-muted/40" />
      <Music v-else-if="type === 'music'" class="w-2/5 h-2/5 text-muted/40" />
      <User v-else class="w-2/5 h-2/5 text-muted/40" />
    </template>
  </div>
</template>
