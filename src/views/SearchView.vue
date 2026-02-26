<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Search, X, Disc3, Music2, User, Music, Plus } from "lucide-vue-next";
import { fetchSearch } from "../services/fetchService";
import type { FetchAlbum, FetchArtist, FetchMusicResult } from "../types";
import AppImage from "../components/AppImage.vue";

const route = useRoute();
const router = useRouter();

const query = ref((route.query.q as string) ?? "");
const searchType = ref<"album" | "artist" | "music">("album");
const albumResults = ref<FetchAlbum[]>([]);
const artistResults = ref<FetchArtist[]>([]);
const musicResults = ref<FetchMusicResult[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const searched = ref(false);

let debounceTimer: ReturnType<typeof setTimeout>;

function getAlbumArtists(album: FetchAlbum): string {
  return album.artists.map((a) => a.name).join(", ") || "—";
}

function getReleaseYear(album: FetchAlbum): string {
  if (!album.release_date) return "";
  return new Date(album.release_date).getFullYear().toString();
}

function formatDuration(ms: number | null): string {
  if (!ms) return "";
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const totalResults = computed(() => {
  if (searchType.value === "artist") return artistResults.value.length;
  if (searchType.value === "music") return musicResults.value.length;
  return albumResults.value.length;
});

async function doSearch(q: string) {
  if (!q.trim()) {
    albumResults.value = [];
    artistResults.value = [];
    musicResults.value = [];
    searched.value = false;
    return;
  }
  loading.value = true;
  error.value = null;
  searched.value = true;
  try {
    const data = await fetchSearch({ q: q.trim(), type: searchType.value });
    albumResults.value = [];
    artistResults.value = [];
    musicResults.value = [];
    if (data.type === "artist") {
      artistResults.value = data.data as FetchArtist[];
    } else if (data.type === "music") {
      musicResults.value = data.data as FetchMusicResult[];
    } else {
      albumResults.value = data.data as FetchAlbum[];
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Erro ao buscar";
  } finally {
    loading.value = false;
  }
}

function onInput() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    router.replace({ query: query.value.trim() ? { q: query.value } : {} });
    doSearch(query.value);
  }, 400);
}

function selectType(type: "album" | "artist" | "music") {
  if (searchType.value === type) return;
  searchType.value = type;
  if (query.value.trim()) doSearch(query.value);
}

function clearSearch() {
  query.value = "";
  albumResults.value = [];
  artistResults.value = [];
  musicResults.value = [];
  searched.value = false;
  error.value = null;
  router.replace({ query: {} });
}

function goToAlbum(id: string) {
  router.push({ name: "album-detail", params: { id } });
}

function goToArtist(id: string) {
  router.push({ name: "artist-detail", params: { id } });
}

onMounted(() => {
  if (route.query.q) {
    query.value = route.query.q as string;
    doSearch(query.value);
  }
});

watch(
  () => route.query.q,
  (val) => {
    const v = (val as string) ?? "";
    if (v !== query.value) {
      query.value = v;
      doSearch(v);
    }
  },
);
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-white">Buscar</h1>
      <p class="text-muted text-sm mt-1">
        Encontre álbuns, artistas e muito mais
      </p>
    </div>

    <!-- Search input -->
    <div class="relative max-w-2xl">
      <Search
        class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none"
      />
      <input
        v-model="query"
        @input="onInput"
        type="text"
        placeholder="Buscar álbuns, artistas..."
        class="w-full bg-[var(--color-surface)] border border-[var(--color-border)] text-white placeholder-muted rounded-2xl pl-12 pr-12 py-4 text-base focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
      />
      <button
        v-if="query"
        @click="clearSearch"
        class="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
      >
        <X class="w-5 h-5" />
      </button>
    </div>

    <!-- Type chips -->
    <div class="flex items-center gap-2">
      <button
        v-for="chip in [
          { value: 'album', label: 'Álbuns', icon: Music },
          { value: 'artist', label: 'Artistas', icon: User },
          { value: 'music', label: 'Músicas', icon: Music2 },
        ]"
        :key="chip.value"
        @click="selectType(chip.value as 'album' | 'artist' | 'music')"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200"
        :class="
          searchType === chip.value
            ? 'bg-primary text-white border-primary shadow-sm shadow-primary/30'
            : 'text-muted border-[var(--color-border)] bg-[var(--color-surface)] hover:text-white hover:border-[var(--color-muted)]/50'
        "
      >
        <component :is="chip.icon" class="w-3.5 h-3.5" />
        {{ chip.label }}
      </button>
    </div>

    <!-- Skeleton loading: grid para álbuns/artistas -->
    <div
      v-if="loading && searchType !== 'music'"
      class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5"
    >
      <div v-for="i in 10" :key="i" class="animate-pulse">
        <div
          class="aspect-square rounded-2xl bg-[var(--color-surface-2)] mb-3"
        />
        <div class="h-3 bg-[var(--color-surface-2)] rounded-full w-3/4 mb-2" />
        <div class="h-2.5 bg-[var(--color-surface-2)] rounded-full w-1/2" />
      </div>
    </div>

    <!-- Skeleton loading: lista para músicas -->
    <div v-else-if="loading && searchType === 'music'" class="space-y-2">
      <div
        v-for="i in 8"
        :key="i"
        class="flex items-center gap-3 p-3 rounded-2xl bg-[var(--color-surface)] animate-pulse"
      >
        <div
          class="w-12 h-12 rounded-xl bg-[var(--color-surface-2)] shrink-0"
        />
        <div class="flex-1 space-y-2">
          <div class="h-3 bg-[var(--color-surface-2)] rounded-full w-2/3" />
          <div class="h-2.5 bg-[var(--color-surface-2)] rounded-full w-1/2" />
        </div>
        <div class="h-2.5 bg-[var(--color-surface-2)] rounded-full w-8" />
      </div>
    </div>

    <!-- Erro -->
    <div
      v-else-if="error"
      class="flex flex-col items-center justify-center py-20 text-center"
    >
      <div
        class="w-16 h-16 bg-red-500/10 rounded-3xl flex items-center justify-center mb-4"
      >
        <Music2 class="w-8 h-8 text-red-400" />
      </div>
      <h3 class="text-base font-semibold text-white mb-1">Erro na busca</h3>
      <p class="text-muted text-sm">{{ error }}</p>
    </div>

    <!-- Resultados: MÚSICAS -->
    <div v-else-if="searchType === 'music' && musicResults.length > 0">
      <p class="text-muted text-sm mb-4">
        {{ totalResults }} música{{ totalResults !== 1 ? "s" : "" }} para "<span
          class="text-white"
          >{{ query }}</span
        >"
      </p>
      <div class="space-y-2">
        <div
          v-for="music in musicResults"
          :key="music.id"
          class="flex items-center gap-3 p-3 rounded-2xl bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] cursor-pointer transition-colors group"
          @click="goToAlbum(music.album.id)"
        >
          <!-- Capa do álbum -->
          <div class="w-12 h-12 shrink-0">
            <AppImage
              :src="music.album.image_url"
              :alt="music.album.name"
              type="music"
              rounded="xl"
              class="w-12 h-12"
            />
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <p
              class="text-sm font-medium text-white truncate group-hover:text-primary transition-colors"
            >
              {{ music.name }}
            </p>
            <p class="text-xs text-muted truncate mt-0.5">
              {{ music.artists.map((a) => a.name).join(", ") }}
            </p>
            <p class="text-xs text-muted/60 truncate mt-0.5">
              {{ music.album.name }}
            </p>
          </div>

          <!-- Duração -->
          <span
            v-if="music.length"
            class="text-xs text-muted shrink-0 font-mono"
          >
            {{ formatDuration(music.length) }}
          </span>
        </div>
      </div>

      <!-- Create footer -->
      <div
        class="mt-8 flex items-center justify-center gap-3 text-sm text-muted"
      >
        <span>Não encontrou o que procura?</span>
        <button
          @click="router.push({ name: 'create-album' })"
          class="flex items-center gap-1.5 text-primary hover:text-primary/80 font-medium transition-colors"
        >
          <Plus class="w-3.5 h-3.5" />
          Criar álbum
        </button>
      </div>
    </div>

    <!-- Resultados: ARTISTAS -->
    <div v-else-if="searchType === 'artist' && artistResults.length > 0">
      <p class="text-muted text-sm mb-5">
        {{ artistResults.length }} artista{{
          artistResults.length !== 1 ? "s" : ""
        }}
        para "<span class="text-white">{{ query }}</span
        >"
      </p>
      <div
        class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5"
      >
        <div
          v-for="artist in artistResults"
          :key="artist.id"
          class="group cursor-pointer"
          @click="goToArtist(artist.id)"
        >
          <!-- Foto -->
          <div class="relative aspect-square rounded-2xl overflow-hidden">
            <AppImage
              :src="artist.image_url"
              :alt="artist.name"
              type="artist"
              :initial="artist.name"
              rounded="2xl"
              class="w-full h-full transition-transform duration-300 group-hover:scale-105"
            />
            <!-- Hover overlay -->
            <div
              class="absolute inset-0 bg-dark/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
            >
              <span
                class="text-xs font-semibold text-white px-3 py-1.5 bg-primary/90 rounded-full"
              >
                Ver artista
              </span>
            </div>
          </div>

          <!-- Info -->
          <div class="mt-3 space-y-0.5">
            <p
              class="text-sm font-semibold text-white truncate group-hover:text-primary transition-colors"
            >
              {{ artist.name }}
            </p>
            <p
              v-if="artist.country"
              class="text-xs text-muted truncate flex items-center gap-1"
            >
              <User class="w-3 h-3 flex-shrink-0" />
              {{ artist.country }}
            </p>
          </div>
        </div>
      </div>

      <!-- Create footer -->
      <div
        class="mt-8 flex items-center justify-center gap-3 text-sm text-muted"
      >
        <span>Não encontrou o que procura?</span>
        <button
          @click="router.push({ name: 'create-artist' })"
          class="flex items-center gap-1.5 text-primary hover:text-primary/80 font-medium transition-colors"
        >
          <Plus class="w-3.5 h-3.5" />
          Criar artista
        </button>
      </div>
    </div>

    <!-- Resultados: ÁLBUNS -->
    <div v-else-if="searchType === 'album' && albumResults.length > 0">
      <p class="text-muted text-sm mb-5">
        {{ totalResults }} resultado{{ totalResults !== 1 ? "s" : "" }} para
        "<span class="text-white">{{ query }}</span
        >"
      </p>
      <div
        class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5"
      >
        <div
          v-for="album in albumResults"
          :key="album.id"
          class="group cursor-pointer"
          @click="goToAlbum(album.id)"
        >
          <!-- Capa -->
          <div class="relative aspect-square rounded-2xl overflow-hidden">
            <AppImage
              :src="album.image_url"
              :alt="album.name"
              type="album"
              rounded="2xl"
              class="w-full h-full transition-transform duration-300 group-hover:scale-105"
            />
            <!-- Hover overlay -->
            <div
              class="absolute inset-0 bg-dark/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
            >
              <span
                class="text-xs font-semibold text-white px-3 py-1.5 bg-primary/90 rounded-full"
              >
                Ver álbum
              </span>
            </div>
            <!-- Rating badge -->
            <div
              v-if="album.rate"
              class="absolute top-2 right-2 flex items-center gap-1 bg-dark/80 backdrop-blur-sm rounded-xl px-2 py-1"
            >
              <span class="text-xs font-bold text-yellow-400">{{
                album.rate.toFixed(1)
              }}</span>
            </div>
          </div>

          <!-- Info -->
          <div class="mt-3 space-y-0.5">
            <p
              class="text-sm font-semibold text-white truncate group-hover:text-primary transition-colors"
            >
              {{ album.name }}
            </p>
            <p class="text-xs text-muted truncate">
              {{ getAlbumArtists(album) }}
            </p>
            <p v-if="getReleaseYear(album)" class="text-xs text-muted/60">
              {{ getReleaseYear(album) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Create footer -->
      <div
        class="mt-8 flex items-center justify-center gap-3 text-sm text-muted"
      >
        <span>Não encontrou o que procura?</span>
        <button
          @click="router.push({ name: 'create-album' })"
          class="flex items-center gap-1.5 text-primary hover:text-primary/80 font-medium transition-colors"
        >
          <Plus class="w-3.5 h-3.5" />
          Criar álbum
        </button>
      </div>
    </div>

    <!-- Estado inicial -->
    <div
      v-else-if="!searched && !loading"
      class="flex flex-col items-center justify-center py-24 text-center"
    >
      <div
        class="w-20 h-20 bg-[var(--color-surface)] rounded-3xl flex items-center justify-center mb-5"
      >
        <Disc3 class="w-10 h-10 text-muted" />
      </div>
      <h3 class="text-lg font-semibold text-white mb-2">
        Busque por álbuns, artistas ou músicas
      </h3>
      <p class="text-muted text-sm max-w-xs">
        Digite o nome de um álbum, artista ou música para começar.
      </p>
    </div>

    <!-- Sem resultados -->
    <div
      v-else-if="searched && !loading"
      class="flex flex-col items-center justify-center py-20 text-center"
    >
      <div
        class="w-20 h-20 bg-[var(--color-surface)] rounded-3xl flex items-center justify-center mb-5"
      >
        <Search class="w-10 h-10 text-muted" />
      </div>
      <h3 class="text-lg font-semibold text-white mb-2">Nenhum resultado</h3>
      <p class="text-muted text-sm max-w-xs mb-6">
        Nenhum resultado encontrado para "<span class="text-white">{{
          query
        }}</span
        >".
      </p>
      <div class="flex flex-col sm:flex-row items-center gap-3">
        <button
          v-if="searchType === 'album' || searchType === 'music'"
          @click="router.push({ name: 'create-album' })"
          class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus class="w-4 h-4" />
          Criar álbum
        </button>
        <button
          v-if="searchType === 'artist'"
          @click="router.push({ name: 'create-artist' })"
          class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus class="w-4 h-4" />
          Criar artista
        </button>
        <button
          @click="clearSearch"
          class="text-sm text-muted hover:text-white transition-colors"
        >
          Limpar busca
        </button>
      </div>
    </div>
  </div>
</template>
