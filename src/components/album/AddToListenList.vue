<script setup lang="ts">
import { ref, computed } from 'vue'
import { BookmarkPlus, BookmarkCheck, ChevronDown, Disc3, Music, Check } from 'lucide-vue-next'
import AppImage from '../AppImage.vue'
import { useListenList } from '../../composables/useListenList'
import type { FetchAlbumDetails } from '../../types'

const props = defineProps<{
  album: FetchAlbumDetails
}>()

const { hasAlbum, hasMusic, addAlbum, addMusic, removeAlbum, removeMusic } = useListenList()

const open = ref(false)
const justAdded = ref<string | 'album' | null>(null)

const albumInList = computed(() => hasAlbum(props.album.id))

function toggleAlbum() {
  if (albumInList.value) {
    removeAlbum(props.album.id)
  } else {
    addAlbum(props.album.id)
    flash('album')
  }
}

function toggleTrack(track: FetchAlbumDetails['musics'][number]) {
  if (hasMusic(track.id)) {
    removeMusic(track.id)
  } else {
    addMusic(track.id)
    flash(track.id)
  }
}

function flash(id: string | 'album') {
  justAdded.value = id
  setTimeout(() => { justAdded.value = null }, 1500)
}

// Close on outside click
function onClickOutside(e: MouseEvent) {
  const el = (e.target as HTMLElement).closest('[data-listenlist-dropdown]')
  if (!el) open.value = false
}

import { onMounted, onUnmounted } from 'vue'
onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
</script>

<template>
  <div class="relative" data-listenlist-dropdown>
    <!-- Main button -->
    <div class="flex items-center">
      <button
        @click="toggleAlbum"
        class="flex items-center gap-2 px-4 py-2 rounded-l-2xl text-sm font-medium transition-all duration-200 border-r"
        :class="albumInList
          ? 'bg-secondary/15 text-secondary border-secondary/30 hover:bg-secondary/25'
          : 'bg-[var(--color-surface-2)] text-muted hover:text-white border-[var(--color-border)] hover:bg-[var(--color-surface)]'"
      >
        <BookmarkCheck v-if="albumInList" class="w-4 h-4" />
        <BookmarkPlus v-else class="w-4 h-4" />
        <span>{{ albumInList ? 'Na lista' : 'Quero ouvir' }}</span>
      </button>

      <!-- Dropdown toggle -->
      <button
        @click.stop="open = !open"
        class="px-2 py-2 rounded-r-2xl text-sm font-medium transition-all duration-200"
        :class="albumInList
          ? 'bg-secondary/15 text-secondary hover:bg-secondary/25'
          : 'bg-[var(--color-surface-2)] text-muted hover:text-white hover:bg-[var(--color-surface)]'"
      >
        <ChevronDown class="w-4 h-4 transition-transform duration-200" :class="open ? 'rotate-180' : ''" />
      </button>
    </div>

    <!-- Dropdown panel -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-1 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-1 scale-95"
    >
      <div
        v-if="open"
        class="absolute right-0 top-full mt-2 w-72 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl z-50 overflow-hidden"
      >
        <!-- Album option -->
        <div class="p-2 border-b border-[var(--color-border)]">
          <button
            @click="toggleAlbum"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
            :class="albumInList
              ? 'text-secondary bg-secondary/10 hover:bg-secondary/20'
              : 'text-muted hover:text-white hover:bg-[var(--color-surface-2)]'"
          >
            <div class="w-8 h-8 flex-shrink-0">
              <AppImage :src="album.image_url" :alt="album.name" type="album" rounded="xl" class="w-8 h-8" />
            </div>
            <div class="flex-1 text-left min-w-0">
              <p class="font-semibold truncate">{{ album.name }}</p>
              <p class="text-xs opacity-70">Álbum completo</p>
            </div>
            <div class="flex-shrink-0">
              <Check v-if="albumInList || justAdded === 'album'" class="w-4 h-4 text-secondary" />
              <Disc3 v-else class="w-4 h-4 opacity-50" />
            </div>
          </button>
        </div>

        <!-- Track list -->
        <div class="max-h-72 overflow-y-auto p-2 space-y-0.5">
          <p class="text-[10px] font-semibold text-muted uppercase tracking-wider px-3 py-1.5">Faixas</p>
          <button
            v-for="track in album.musics"
            :key="track.id"
            @click="toggleTrack(track)"
            class="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all text-left"
            :class="hasMusic(track.id)
              ? 'text-secondary bg-secondary/10 hover:bg-secondary/20'
              : 'text-muted hover:text-white hover:bg-[var(--color-surface-2)]'"
          >
            <span class="w-5 text-right text-xs font-mono flex-shrink-0 opacity-60">{{ track.position }}</span>
            <span class="flex-1 truncate font-medium">{{ track.name }}</span>
            <div class="flex-shrink-0">
              <Check v-if="hasMusic(track.id) || justAdded === track.id" class="w-3.5 h-3.5 text-secondary" />
              <Music v-else class="w-3.5 h-3.5 opacity-30" />
            </div>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
