<script setup lang="ts">
import { reactive } from 'vue'
import type { Music } from '../../types'
import StarRating from './StarRating.vue'

const props = defineProps<{
  musics: Music[]
  modelValue?: Record<number, number>
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<number, number>): void
}>()

const ratings = reactive<Record<number, number>>(props.modelValue ?? {})

function updateRating(musicId: number, value: number) {
  ratings[musicId] = value
  emit('update:modelValue', { ...ratings })
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
</script>

<template>
  <div class="space-y-1">
    <div
      v-for="music in musics"
      :key="music.id"
      class="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--color-surface-2)] transition-colors group"
    >
      <!-- Track number -->
      <span class="w-5 text-center text-xs text-muted font-mono flex-shrink-0">
        {{ music.trackNumber }}
      </span>

      <!-- Title + duration -->
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-white truncate">{{ music.title }}</p>
        <p class="text-xs text-muted">{{ formatDuration(music.durationMs) }}</p>
      </div>

      <!-- Star rating input -->
      <div class="flex items-center gap-2 flex-shrink-0">
        <StarRating
          :model-value="ratings[music.id] ?? 0"
          size="sm"
          @update:model-value="updateRating(music.id, $event)"
        />
        <span class="text-xs text-muted w-6 text-right">
          {{ ratings[music.id] != null ? ratings[music.id] : '—' }}
        </span>
      </div>
    </div>
  </div>
</template>
