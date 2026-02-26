<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  TrendingUp,
  ChevronRight,
  Music2,
  Loader2,
  X,
  Plus,
} from "lucide-vue-next";
import { getTopAlbumsLastWeek } from "../../services/spotifyService";
import { fetchSearch } from "../../services/fetchService";
import type { TopAlbumDTO, FetchAlbum } from "../../types";

const router = useRouter();

const items = ref<TopAlbumDTO[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

// Tracks which Spotify album ID is currently being resolved
const resolvingId = ref<string | null>(null);

// "Not found" modal state
interface NotFoundInfo {
  albumName: string;
  artistName: string;
  coverUrl: string;
}
const notFound = ref<NotFoundInfo | null>(null);

onMounted(async () => {
  try {
    items.value = await getTopAlbumsLastWeek();
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Erro ao carregar";
  } finally {
    loading.value = false;
  }
});

function getCoverUrl(album: TopAlbumDTO): string {
  return album.images[1]?.url ?? album.images[0]?.url ?? "";
}

function getArtistNames(album: TopAlbumDTO): string {
  return album.artists.map((a) => a.name).join(", ");
}

const normalize = (s: string) => s.toLowerCase().trim();

function findMatch(
  albums: FetchAlbum[],
  albumName: string,
  artistName: string,
): FetchAlbum | null {
  const exact = albums.find(
    (a) =>
      normalize(a.name) === normalize(albumName) &&
      a.artists.some((ar) => normalize(ar.name) === normalize(artistName)),
  );
  if (exact) return exact;

  const nameOnly = albums.find(
    (a) => normalize(a.name) === normalize(albumName),
  );
  if (nameOnly) return nameOnly;

  const partial = albums.find(
    (a) =>
      a.artists.some((ar) => normalize(ar.name) === normalize(artistName)) &&
      normalize(a.name).includes(normalize(albumName)),
  );
  if (partial) return partial;

  return null;
}

async function goToAlbum(album: TopAlbumDTO) {
  if (resolvingId.value) return;
  resolvingId.value = album.id;

  const albumName = album.name;
  const artistName = album.artists[0]?.name ?? "";

  try {
    const result = await fetchSearch({
      q: albumName,
      type: "album",
      artist: artistName,
    });
    const albums = result.data as FetchAlbum[];
    const match = findMatch(albums, albumName, artistName);

    if (match?.id) {
      router.push({ name: "album-detail", params: { id: match.id } });
    } else {
      notFound.value = {
        albumName,
        artistName,
        coverUrl: getCoverUrl(album),
      };
    }
  } catch {
    // silently ignore
  } finally {
    resolvingId.value = null;
  }
}
</script>

<template>
  <section>
    <div class="flex items-center justify-between mb-5">
      <div class="flex items-center gap-2">
        <TrendingUp class="w-5 h-5 text-green-400" />
        <h2 class="text-lg font-bold text-white">Mais ouvidos esta semana</h2>
      </div>
      <button
        class="flex items-center gap-1 text-xs text-muted hover:text-primary transition-colors"
        @click="$router.push({ name: 'search' })"
      >
        Ver mais <ChevronRight class="w-3.5 h-3.5" />
      </button>
    </div>

    <!-- Skeleton loading -->
    <div
      v-if="loading"
      class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3"
    >
      <div v-for="i in 8" :key="i" class="animate-pulse">
        <div class="aspect-square rounded-xl bg-surface-2 mb-2" />
        <div class="h-3 bg-surface-2 rounded-full w-3/4 mb-1.5" />
        <div class="h-2.5 bg-surface-2 rounded-full w-1/2" />
      </div>
    </div>

    <!-- Erro: não tem integração Spotify -->
    <div
      v-else-if="error"
      class="flex flex-col items-center justify-center gap-3 py-10 rounded-2xl bg-surface-2 border border-white/5"
    >
      <div
        class="w-12 h-12 rounded-full bg-surface flex items-center justify-center"
      >
        <Music2 class="w-6 h-6 text-muted" />
      </div>
      <div class="text-center">
        <p class="text-sm font-medium text-white">Conecte sua conta Spotify</p>
        <p class="text-xs text-muted mt-1">
          Faça login com Spotify para ver seus top álbuns
        </p>
      </div>
    </div>

    <!-- Vazio -->
    <div
      v-else-if="items.length === 0"
      class="flex flex-col items-center justify-center gap-3 py-10 rounded-2xl bg-surface-2 border border-white/5"
    >
      <Music2 class="w-8 h-8 text-muted" />
      <p class="text-sm text-muted">Nenhum álbum ouvido esta semana</p>
    </div>

    <!-- Grid de álbuns -->
    <div
      v-else
      class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3"
    >
      <div
        v-for="album in items"
        :key="album.id"
        class="group cursor-pointer"
        :class="resolvingId === album.id ? 'pointer-events-none' : ''"
        @click="goToAlbum(album)"
      >
        <!-- Capa -->
        <div
          class="relative aspect-square rounded-xl overflow-hidden bg-surface-2"
        >
          <img
            :src="getCoverUrl(album)"
            :alt="album.name"
            class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <!-- Overlay: resolving spinner -->
          <div
            v-if="resolvingId === album.id"
            class="absolute inset-0 bg-dark/70 flex items-center justify-center"
          >
            <Loader2 class="w-6 h-6 text-white animate-spin" />
          </div>
          <!-- Overlay hover -->
          <div
            v-else
            class="absolute inset-0 bg-dark/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
          >
            <span
              class="text-xs font-semibold text-white px-3 py-1.5 bg-primary/90 rounded-full"
            >
              Ver álbum
            </span>
          </div>
          <!-- Badge play count -->
          <div
            class="absolute bottom-1.5 left-1.5 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-1.5 py-0.5"
          >
            <TrendingUp class="w-2.5 h-2.5 text-[#1DB954]" />
            <span class="text-[10px] font-bold text-white">{{ album.playCount }}</span>
          </div>
        </div>

        <!-- Info -->
        <div class="mt-2 space-y-0.5">
          <p
            class="text-xs font-semibold text-white truncate group-hover:text-primary transition-colors"
          >
            {{ album.name }}
          </p>
          <p class="text-xs text-muted truncate">
            {{ getArtistNames(album) }}
          </p>
          <p class="text-[10px] text-[#1DB954]/80 font-medium">
            {{ album.playCount }} play{{ album.playCount !== 1 ? 's' : '' }}
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- Not-found modal -->
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="notFound"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        @click.self="notFound = null"
      >
        <div
          class="w-full max-w-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden"
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-5 pt-5 pb-3">
            <p class="text-sm font-semibold text-white">Álbum não encontrado</p>
            <button
              @click="notFound = null"
              class="text-muted hover:text-white transition-colors"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Album preview -->
          <div class="flex items-center gap-3 px-5 pb-4">
            <img
              :src="notFound.coverUrl"
              :alt="notFound.albumName"
              class="w-12 h-12 rounded-xl object-cover flex-shrink-0"
            />
            <div class="min-w-0">
              <p class="text-sm font-semibold text-white truncate">
                {{ notFound.albumName }}
              </p>
              <p class="text-xs text-muted truncate">
                {{ notFound.artistName }}
              </p>
            </div>
          </div>

          <p class="text-xs text-muted px-5 pb-4 leading-relaxed">
            Este álbum ainda não está no catálogo. Deseja importá-lo agora?
          </p>

          <!-- Actions -->
          <div class="flex gap-2 px-5 pb-5">
            <button
              @click="notFound = null"
              class="flex-1 px-4 py-2.5 text-sm font-medium text-muted border border-[var(--color-border)] rounded-xl hover:text-white hover:border-[var(--color-muted)]/50 transition-colors"
            >
              Cancelar
            </button>
            <button
              @click="
                () => {
                  notFound = null;
                  router.push({ name: 'create-album' });
                }
              "
              class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
            >
              <Plus class="w-4 h-4" />
              Criar álbum
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
