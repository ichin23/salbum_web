<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Album } from '../../types'
import { Star } from 'lucide-vue-next'

const props = defineProps<{
  album: Album
}>()

const router = useRouter()

function goToAlbum() {
  router.push({ name: 'album-detail', params: { id: props.album.id } })
}

const ratingColor = computed(() => {
  const r = props.album.averageRating ?? 0
  if (r >= 90) return 'text-secondary'
  if (r >= 70) return 'text-yellow-400'
  return 'text-muted'
})
</script>

<template>
  <div
    class="group relative cursor-pointer"
    @click="goToAlbum"
  >
    <!-- Cover -->
    <div class="relative aspect-square rounded-2xl overflow-hidden bg-[var(--color-surface-2)]">
      <img
        :src="album.coverUrl"
        :alt="album.title"
        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />

      <!-- Hover overlay -->
      <div class="absolute inset-0 bg-dark/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
        <button class="btn-primary text-sm px-5 py-2">
          Ver álbum
        </button>
      </div>

      <!-- Rating badge -->
      <div
        v-if="album.averageRating"
        class="absolute top-2 right-2 flex items-center gap-1 bg-dark/80 backdrop-blur-sm rounded-xl px-2 py-1"
      >
        <Star class="w-3 h-3 text-yellow-400" fill="currentColor" />
        <span class="text-xs font-bold" :class="ratingColor">
          {{ album.averageRating }}
        </span>
      </div>
    </div>

    <!-- Info -->
    <div class="mt-3 space-y-0.5">
      <p class="text-sm font-semibold text-white truncate group-hover:text-primary transition-colors">
        {{ album.title }}
      </p>
      <p class="text-xs text-muted truncate">
        {{ album.artist.name }} · {{ album.releaseYear }}
      </p>
    </div>
  </div>
</template>
