<script setup lang="ts">
import { ref, computed } from "vue";
import { X, Search, Plus, Trash2, CheckCircle2, Loader2, AlertCircle } from "lucide-vue-next";
import { useAuthStore } from "../../stores/auth";
import { fetchSearch } from "../../services/fetchService";
import type { FetchAlbum, AlbumInfoDTO } from "../../types";
import AppImage from "../AppImage.vue";

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const auth = useAuthStore();
const MAX_PINNED = 4;

// Inicializa a lista local com os álbuns que já estão favoritados
const selectedAlbums = ref<AlbumInfoDTO[]>([...(auth.user?.pinned_albums || [])]);

const query = ref("");
const searchResults = ref<FetchAlbum[]>([]);
const searching = ref(false);
const saving = ref(false);
const error = ref<string | null>(null);

let searchTimeout: ReturnType<typeof setTimeout> | null = null;
function onSearchInput() {
  if (searchTimeout) clearTimeout(searchTimeout);
  if (!query.value.trim()) {
    searchResults.value = [];
    return;
  }
  searchTimeout = setTimeout(async () => {
    searching.value = true;
    error.value = null;
    try {
      const res = await fetchSearch({ q: query.value.trim(), type: "album" });
      searchResults.value = (res.data as FetchAlbum[]) || [];
    } catch (e) {
      error.value = "Erro ao buscar álbuns.";
    } finally {
      searching.value = false;
    }
  }, 500);
}

const canAddMore = computed(() => selectedAlbums.value.length < MAX_PINNED);

function isSelected(id: string) {
  return selectedAlbums.value.some((a) => a.id === id);
}

function addAlbum(album: FetchAlbum) {
  if (isSelected(album.id)) return;
  if (!canAddMore.value) return;

  // Convert FetchAlbum to AlbumInfoDTO subset needed for display
  selectedAlbums.value.push({
    id: album.id,
    name: album.name,
    image_url: album.image_url,
    artists: album.artists.map(a => ({ id: a.id, name: a.name })) as any,
    // other fields are not strictly necessary just for the modal preview
  } as AlbumInfoDTO);
}

function removeAlbum(id: string) {
  selectedAlbums.value = selectedAlbums.value.filter((a) => a.id !== id);
}

async function save() {
  saving.value = true;
  error.value = null;
  try {
    const ids = selectedAlbums.value.map(a => a.id);
    await auth.updatePinnedAlbums(ids);
    emit("close");
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Erro ao salvar álbuns.";
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="$emit('close')" />

    <!-- Modal -->
    <div class="relative w-full max-w-lg bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] flex-shrink-0">
        <h2 class="text-lg font-bold text-white">Álbuns favoritos</h2>
        <button
          @click="$emit('close')"
          class="p-2 -mr-2 rounded-xl text-muted hover:text-white hover:bg-[var(--color-surface-2)] transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto min-h-0 p-6 space-y-6">
        <!-- Selected Albums -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-white">Selecionados</h3>
            <span class="text-xs text-muted font-medium">{{ selectedAlbums.length }} / {{ MAX_PINNED }}</span>
          </div>

          <div v-if="selectedAlbums.length === 0" class="text-sm text-muted bg-[var(--color-surface-2)] rounded-2xl p-4 text-center">
            Nenhum álbum selecionado.
          </div>

          <div v-else class="grid grid-cols-2 gap-3">
            <div
              v-for="album in selectedAlbums"
              :key="album.id"
              class="relative flex items-center gap-2 bg-[var(--color-surface-2)] border border-[var(--color-border)] p-2 rounded-xl group"
            >
              <div class="w-10 h-10 flex-shrink-0">
                <AppImage
                  :src="album.image_url"
                  :alt="album.name"
                  type="album"
                  class="w-full h-full rounded-md"
                />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-semibold text-white truncate">{{ album.name }}</p>
                <p class="text-[10px] text-muted truncate">{{ album.artists?.[0]?.name }}</p>
              </div>
              <button
                @click="removeAlbum(album.id)"
                class="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <!-- Search -->
        <div class="space-y-3">
          <h3 class="text-sm font-semibold text-white">Buscar álbuns</h3>
          <div class="relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              v-model="query"
              @input="onSearchInput"
              type="text"
              placeholder="Digite o nome do álbum..."
              class="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-muted focus:outline-none focus:border-primary transition-colors"
            />
            <Loader2 v-if="searching" class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
          </div>

          <!-- Search Results -->
          <div v-if="query && !searching && searchResults.length === 0" class="text-sm text-muted text-center pt-2">
            Nenhum álbum encontrado.
          </div>

          <div v-if="searchResults.length > 0" class="space-y-2 mt-3 max-h-[30vh] overflow-y-auto pr-1 custom-scrollbar">
            <button
              v-for="album in searchResults"
              :key="album.id"
              @click="addAlbum(album)"
              :disabled="isSelected(album.id) || !canAddMore"
              class="w-full text-left flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-[var(--color-surface-2)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div class="flex items-center gap-3 min-w-0 flex-1">
                <div class="w-10 h-10 flex-shrink-0">
                  <AppImage
                    :src="album.image_url"
                    :alt="album.name"
                    type="album"
                    class="w-full h-full rounded-md"
                  />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-semibold text-white truncate">{{ album.name }}</p>
                  <p class="text-xs text-muted truncate">{{ album.artists.map(a => a.name).join(', ') }}</p>
                </div>
              </div>
              <div class="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full" :class="isSelected(album.id) ? 'text-primary' : 'bg-[var(--color-surface-2)] text-muted group-hover:bg-primary group-hover:text-white transition-colors'">
                <CheckCircle2 v-if="isSelected(album.id)" class="w-5 h-5" />
                <Plus v-else class="w-4 h-4" />
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-6 border-t border-[var(--color-border)] background-[var(--color-surface)] flex-shrink-0">
        <p v-if="error" class="text-red-400 text-xs flex items-center gap-1.5 mb-3">
          <AlertCircle class="w-3.5 h-3.5" />
          {{ error }}
        </p>
        <button
          @click="save"
          :disabled="saving"
          class="w-full btn-primary flex items-center justify-center gap-2 py-3"
        >
          <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
          <CheckCircle2 v-else class="w-4 h-4" />
          {{ saving ? "Salvando..." : "Salvar favoritos" }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--color-muted);
}
</style>