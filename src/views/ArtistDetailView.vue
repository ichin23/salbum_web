<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Disc3,
  ExternalLink,
  Share2,
  Loader2,
  AlertCircle,
  BookmarkPlus,
  BookmarkCheck,
  Pencil,
} from "lucide-vue-next";
import { fetchArtistDetails } from "../services/fetchService";
import type { FetchArtistDetails, FetchAlbum } from "../types";
import MusicShareModal from "../components/share/MusicShareModal.vue";
import type { ShareTarget } from "../components/share/MusicShareModal.vue";
import { useListenList, fetchListenList } from "../composables/useListenList";
import AppImage from "../components/AppImage.vue";

const route = useRoute();
const router = useRouter();

// ─── State ────────────────────────────────────────────────────────────────────
const artist = ref<FetchArtistDetails | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

const { hasArtist, addArtist, removeArtist } = useListenList();

// ─── Load ─────────────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    const [data] = await Promise.all([
      fetchArtistDetails(route.params.id as string),
      fetchListenList(),
    ]);
    console.log("[ArtistDetail] raw response:", JSON.stringify(data));
    // O endpoint pode retornar o objeto direto ou com wrapper { artist }
    artist.value =
      (data as { artist?: FetchArtistDetails }).artist ??
      (data as unknown as FetchArtistDetails);
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Erro ao carregar artista";
  } finally {
    loading.value = false;
  }
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

const age = computed(() => {
  if (!artist.value?.born_date) return null;
  const end = artist.value.death_date
    ? new Date(artist.value.death_date)
    : new Date();
  return end.getFullYear() - new Date(artist.value.born_date).getFullYear();
});

function getReleaseYear(album: FetchAlbum): string {
  if (!album.release_date) return "";
  return new Date(album.release_date).getFullYear().toString();
}

// Sort albums by release_date desc
const sortedAlbums = computed<FetchAlbum[]>(() => {
  if (!artist.value?.albums) return [];
  return [...artist.value.albums].sort((a, b) => {
    const da = a.release_date ? new Date(a.release_date).getTime() : 0;
    const db = b.release_date ? new Date(b.release_date).getTime() : 0;
    return db - da;
  });
});

// ─── Share ────────────────────────────────────────────────────────────────────
const shareTarget = ref<ShareTarget | null>(null);

function shareArtist() {
  if (!artist.value) return;
  shareTarget.value = {
    type: "artist",
    id: artist.value.id,
    title: artist.value.name,
    subtitle: artist.value.country ?? "",
    imageUrl: artist.value.image_url ?? null,
  };
}

function onShared(comment: string) {
  console.log("MusicShare submitted:", shareTarget.value, comment);
  shareTarget.value = null;
}
</script>

<template>
  <!-- Loading -->
  <div v-if="loading" class="flex items-center justify-center min-h-[60vh]">
    <Loader2 class="w-8 h-8 text-primary animate-spin" />
  </div>

  <!-- Erro -->
  <div
    v-else-if="error"
    class="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-8"
  >
    <div
      class="w-16 h-16 bg-red-500/10 rounded-3xl flex items-center justify-center"
    >
      <AlertCircle class="w-8 h-8 text-red-400" />
    </div>
    <h3 class="text-lg font-semibold text-white">Erro ao carregar artista</h3>
    <p class="text-muted text-sm">{{ error }}</p>
    <button @click="router.back()" class="btn-primary text-sm px-5 py-2">
      Voltar
    </button>
  </div>

  <!-- Conteúdo -->
  <div v-else-if="artist" class="min-h-full pb-12">
    <!-- Hero -->
    <div class="relative">
      <div
        v-if="artist.image_url && !artist.image_url.endsWith('/null')"
        class="absolute inset-0 bg-cover bg-center blur-3xl opacity-15 scale-110"
        :style="{ backgroundImage: `url(${artist.image_url})` }"
      />
      <div
        class="absolute inset-0 bg-gradient-to-b from-dark/30 via-dark/70 to-dark"
      />

      <div class="relative px-4 sm:px-8 pt-6 sm:pt-8 pb-8 sm:pb-10">
        <!-- Back -->
        <button
          @click="router.back()"
          class="flex items-center gap-2 text-muted hover:text-white transition-colors mb-8 text-sm"
        >
          <ArrowLeft class="w-4 h-4" />
          Voltar
        </button>

        <!-- Artist info -->
        <div class="flex flex-col sm:flex-row gap-5 sm:gap-8 sm:items-end">
          <div
            class="flex-shrink-0 w-24 h-24 sm:w-40 sm:h-40 shadow-2xl ring-2 ring-white/10 rounded-2xl sm:rounded-3xl overflow-hidden"
          >
            <AppImage
              :src="artist.image_url"
              :alt="artist.name"
              type="artist"
              :initial="artist.name"
              rounded="2xl"
              class="w-full h-full"
            />
          </div>

          <!-- Details -->
          <div class="space-y-3 pb-1">
            <p
              class="text-xs font-semibold text-muted uppercase tracking-widest"
            >
              Artista
            </p>
            <h1
              class="text-3xl sm:text-5xl font-black text-white leading-tight"
            >
              {{ artist.name }}
            </h1>

            <!-- Meta chips -->
            <div class="flex flex-wrap items-center gap-2 pt-1">
              <span
                v-if="artist.country"
                class="inline-flex items-center gap-1.5 text-sm text-muted bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-full px-3 py-1"
              >
                <MapPin class="w-3.5 h-3.5" />
                {{ artist.country }}
              </span>

              <span
                v-if="artist.born_date"
                class="inline-flex items-center gap-1.5 text-sm text-muted bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-full px-3 py-1"
              >
                <Calendar class="w-3.5 h-3.5" />
                {{ formatDate(artist.born_date) }}
                <template v-if="age"> · {{ age }} anos</template>
              </span>

              <span
                v-if="artist.death_date"
                class="inline-flex items-center gap-1.5 text-sm text-red-400/80 bg-red-400/10 border border-red-400/20 rounded-full px-3 py-1"
              >
                <Calendar class="w-3.5 h-3.5" />
                † {{ formatDate(artist.death_date) }}
              </span>

              <a
                v-if="artist.mbid"
                :href="`https://musicbrainz.org/artist/${artist.mbid}`"
                target="_blank"
                rel="noopener"
                class="inline-flex items-center gap-1.5 text-sm text-muted hover:text-white bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:border-[var(--color-muted)]/50 rounded-full px-3 py-1 transition-colors"
              >
                <ExternalLink class="w-3.5 h-3.5" />
                MusicBrainz
              </a>
            </div>

            <!-- Stats + actions -->
            <div class="flex items-center gap-3 flex-wrap">
              <p class="text-muted text-sm">
                {{ sortedAlbums.length }} álbum{{
                  sortedAlbums.length !== 1 ? "s" : ""
                }}
              </p>
              <button
                v-if="artist"
                @click="
                  hasArtist(artist.id)
                    ? removeArtist(artist.id)
                    : addArtist(artist.id)
                "
                class="inline-flex items-center gap-1.5 text-sm border rounded-full px-3 py-1 transition-colors"
                :class="
                  hasArtist(artist.id)
                    ? 'bg-secondary/15 text-secondary border-secondary/30 hover:bg-secondary/25'
                    : 'text-muted bg-[var(--color-surface-2)] border-[var(--color-border)] hover:text-white hover:border-[var(--color-muted)]/50'
                "
              >
                <BookmarkCheck
                  v-if="hasArtist(artist.id)"
                  class="w-3.5 h-3.5"
                />
                <BookmarkPlus v-else class="w-3.5 h-3.5" />
                {{ hasArtist(artist.id) ? "Na lista" : "Quero ouvir" }}
              </button>
              <button
                @click="shareArtist"
                class="inline-flex items-center gap-1.5 text-sm text-muted bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:text-white hover:border-[var(--color-muted)]/50 rounded-full px-3 py-1 transition-colors"
              >
                <Share2 class="w-3.5 h-3.5" />
                Compartilhar
              </button>
              <RouterLink
                :to="{ name: 'edit-artist', params: { id: artist.id } }"
                class="inline-flex items-center gap-1.5 text-sm text-muted bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:text-white hover:border-[var(--color-muted)]/50 rounded-full px-3 py-1 transition-colors"
              >
                <Pencil class="w-3.5 h-3.5" />
                Editar
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Albums section -->
    <div class="px-4 sm:px-8 pt-4">
      <h2 class="text-lg font-bold text-white mb-5 flex items-center gap-2">
        <Disc3 class="w-5 h-5 text-primary" />
        Discografia
      </h2>

      <div
        v-if="sortedAlbums.length > 0"
        class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4"
      >
        <RouterLink
          v-for="album in sortedAlbums"
          :key="album.id"
          :to="{ name: 'album-detail', params: { id: album.id } }"
          class="group block"
        >
          <!-- Cover -->
          <div class="relative aspect-square rounded-2xl overflow-hidden mb-3">
            <AppImage
              :src="album.image_url"
              :alt="album.name"
              type="album"
              rounded="2xl"
              class="w-full h-full transition-transform duration-300 group-hover:scale-105"
            />
            <!-- Overlay -->
            <div
              class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center"
            >
              <div
                class="opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
              >
                <Disc3 class="w-5 h-5 text-white" />
              </div>
            </div>
            <!-- Rating badge -->
            <div
              v-if="album.rate"
              class="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-lg"
            >
              ★ {{ album.rate.toFixed(1) }}
            </div>
          </div>

          <!-- Info -->
          <p
            class="text-sm font-semibold text-white truncate group-hover:text-primary transition-colors"
          >
            {{ album.name }}
          </p>
          <p class="text-xs text-muted mt-0.5">
            {{ getReleaseYear(album) }}
            <template v-if="album.type">· {{ album.type }}</template>
          </p>
        </RouterLink>
      </div>

      <!-- Empty -->
      <div v-else class="flex flex-col items-center py-16 text-center">
        <div
          class="w-16 h-16 bg-[var(--color-surface)] rounded-3xl flex items-center justify-center mb-4"
        >
          <Disc3 class="w-8 h-8 text-muted" />
        </div>
        <p class="text-white font-semibold mb-1">Nenhum álbum cadastrado</p>
      </div>
    </div>
  </div>

  <!-- MusicShare modal -->
  <MusicShareModal
    v-if="shareTarget"
    :target="shareTarget"
    @close="shareTarget = null"
    @shared="onShared"
  />
</template>
