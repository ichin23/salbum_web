<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
  ListMusic,
  Disc3,
  Music,
  User,
  Trash2,
  ExternalLink,
  Loader2,
} from "lucide-vue-next";
import { useListenList, fetchListenList } from "../composables/useListenList";
import AppImage from "../components/AppImage.vue";
import type { ListenListApiItem } from "../types";

const {
  entries,
  loading,
  error,
  albumEntries,
  musicEntries,
  artistEntries,
  remove,
} = useListenList();

onMounted(() => fetchListenList());

type FilterTab = "all" | "albums" | "music" | "artists";
const activeTab = ref<FilterTab>("all");

const filtered = computed<ListenListApiItem[]>(() => {
  if (activeTab.value === "albums") return albumEntries.value;
  if (activeTab.value === "music") return musicEntries.value;
  if (activeTab.value === "artists") return artistEntries.value;
  return entries.value;
});

function itemType(entry: ListenListApiItem): "album" | "music" | "artist" {
  if (entry.album) return "album";
  if (entry.music) return "music";
  return "artist";
}

// function itemId is unused — kept commented in case needed
// function itemId(entry: ListenListApiItem): string {
//   return entry.album?.id ?? entry.music?.id ?? entry.artist?.id ?? entry.id;
// }

function itemTitle(entry: ListenListApiItem): string {
  return entry.album?.name ?? entry.music?.name ?? entry.artist?.name ?? "—";
}

function itemSubtitle(entry: ListenListApiItem): string {
  if (entry.album) return entry.album.artists.map((a) => a.name).join(", ");
  if (entry.music)
    return `${entry.music.artists.map((a) => a.name).join(", ")} — ${entry.music.album?.name ?? ""}`;
  if (entry.artist) return entry.artist.country ?? "Artista";
  return "";
}

function routeFor(entry: ListenListApiItem) {
  if (entry.album)
    return { name: "album-detail", params: { id: entry.album.id } };
  if (entry.music)
    return {
      name: "album-detail",
      params: { id: entry.music.album?.id ?? "" },
    };
  if (entry.artist)
    return { name: "artist-detail", params: { id: entry.artist.id } };
  return { name: "home" };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
</script>

<template>
  <div class="min-h-full pb-12">
    <!-- Header -->
    <div class="px-4 sm:px-8 pt-6 sm:pt-8 pb-6">
      <div class="flex items-center gap-3 mb-1">
        <div
          class="w-10 h-10 bg-primary/15 rounded-2xl flex items-center justify-center"
        >
          <ListMusic class="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 class="text-2xl font-black text-white">Listen List</h1>
          <p class="text-sm text-muted">
            {{ albumEntries.length }} álbum{{
              albumEntries.length !== 1 ? "s" : ""
            }}
            · {{ musicEntries.length }} música{{
              musicEntries.length !== 1 ? "s" : ""
            }}
            · {{ artistEntries.length }} artista{{
              artistEntries.length !== 1 ? "s" : ""
            }}
          </p>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="px-4 sm:px-8 mb-6">
      <div class="flex gap-1 bg-[var(--color-surface)] rounded-2xl p-1 w-fit">
        <button
          v-for="tab in [
            { key: 'all', label: 'Todos' },
            { key: 'albums', label: 'Álbuns' },
            { key: 'music', label: 'Músicas' },
            { key: 'artists', label: 'Artistas' },
          ]"
          :key="tab.key"
          @click="activeTab = tab.key as FilterTab"
          class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
          :class="
            activeTab === tab.key
              ? 'bg-primary text-white shadow-sm'
              : 'text-muted hover:text-white'
          "
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-24">
      <Loader2 class="w-8 h-8 text-primary animate-spin" />
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="flex flex-col items-center py-16 text-center px-4"
    >
      <p class="text-white font-semibold mb-1">Erro ao carregar lista</p>
      <p class="text-muted text-sm">{{ error }}</p>
      <button
        @click="fetchListenList()"
        class="btn-primary text-sm px-5 py-2 mt-4"
      >
        Tentar novamente
      </button>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="filtered.length === 0"
      class="flex flex-col items-center py-16 sm:py-24 text-center px-4 sm:px-8"
    >
      <div
        class="w-20 h-20 bg-[var(--color-surface)] rounded-3xl flex items-center justify-center mb-5"
      >
        <ListMusic class="w-10 h-10 text-muted" />
      </div>
      <p class="text-white font-semibold text-lg mb-2">Lista vazia</p>
      <p class="text-muted text-sm max-w-xs">
        Adicione álbuns, músicas e artistas que você quer ouvir.
      </p>
    </div>

    <!-- List -->
    <div v-else class="px-4 sm:px-8 space-y-3">
      <div
        v-for="entry in filtered"
        :key="entry.id"
        class="card flex items-center gap-4 p-4 group hover:border-[var(--color-muted)]/30 transition-all"
      >
        <!-- Cover -->
        <RouterLink :to="routeFor(entry)" class="flex-shrink-0 w-14 h-14">
          <AppImage
            :src="
              entry.album?.image_url ??
              entry.music?.album?.image_url ??
              entry.artist?.image_url
            "
            :alt="itemTitle(entry)"
            :type="itemType(entry)"
            :initial="
              itemType(entry) === 'artist' ? (entry.artist?.name ?? '') : ''
            "
            rounded="xl"
            class="w-14 h-14"
          />
        </RouterLink>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-0.5">
            <span
              class="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
              :class="{
                'bg-primary/15 text-primary': itemType(entry) === 'album',
                'bg-secondary/15 text-secondary': itemType(entry) === 'music',
                'bg-yellow-400/15 text-yellow-400':
                  itemType(entry) === 'artist',
              }"
            >
              <Disc3 v-if="itemType(entry) === 'album'" class="w-2.5 h-2.5" />
              <Music
                v-else-if="itemType(entry) === 'music'"
                class="w-2.5 h-2.5"
              />
              <User v-else class="w-2.5 h-2.5" />
              {{
                itemType(entry) === "album"
                  ? "Álbum"
                  : itemType(entry) === "music"
                    ? "Música"
                    : "Artista"
              }}
            </span>
          </div>

          <RouterLink :to="routeFor(entry)">
            <p
              class="text-sm font-semibold text-white truncate hover:text-primary transition-colors"
            >
              {{ itemTitle(entry) }}
            </p>
          </RouterLink>
          <p class="text-xs text-muted truncate">{{ itemSubtitle(entry) }}</p>
        </div>

        <!-- Date + actions -->
        <div class="flex items-center gap-2 flex-shrink-0">
          <span class="text-xs text-muted hidden sm:group-hover:block">{{
            formatDate(entry.createdAt)
          }}</span>
          <RouterLink
            :to="routeFor(entry)"
            class="w-8 h-8 flex items-center justify-center rounded-xl text-muted hover:text-white hover:bg-[var(--color-surface-2)] transition-all sm:opacity-0 sm:group-hover:opacity-100"
          >
            <ExternalLink class="w-4 h-4" />
          </RouterLink>
          <button
            @click="remove(entry)"
            class="w-8 h-8 flex items-center justify-center rounded-xl text-muted hover:text-red-400 hover:bg-red-400/10 transition-all sm:opacity-0 sm:group-hover:opacity-100"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
