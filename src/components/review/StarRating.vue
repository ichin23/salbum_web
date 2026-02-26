<script setup lang="ts">
import { computed } from 'vue'
import { Star } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  modelValue?: number
  readonly?: boolean
  max?: number
  size?: 'sm' | 'md' | 'lg'
}>(), {
  modelValue: 0,
  readonly: false,
  max: 10,
  size: 'md',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const starCount = 5
const starsValue = computed(() => (props.modelValue / props.max) * starCount)

function getStarFill(index: number): number {
  const diff = starsValue.value - index
  if (diff >= 1) return 1
  if (diff > 0) return diff
  return 0
}

function handleClick(index: number, half: boolean) {
  if (props.readonly) return
  const raw = half ? index + 0.5 : index + 1
  emit('update:modelValue', (raw / starCount) * props.max)
}

const sizeClass = computed(() => ({
  sm: 'w-3.5 h-3.5',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
}[props.size]))
</script>

<template>
  <div class="flex items-center gap-0.5">
    <div
      v-for="i in starCount"
      :key="i"
      class="relative"
      :class="readonly ? '' : 'cursor-pointer'"
    >
      <!-- Background star (empty) -->
      <Star
        :class="[sizeClass, 'text-[var(--color-border)]']"
        :fill="'none'"
        :stroke="'currentColor'"
      />
      <!-- Foreground star (filled) with clip -->
      <div
        class="absolute inset-0 overflow-hidden"
        :style="{ width: `${getStarFill(i - 1) * 100}%` }"
      >
        <Star
          :class="[sizeClass, 'text-yellow-400']"
          fill="currentColor"
          stroke="currentColor"
        />
      </div>
      <!-- Click zones -->
      <template v-if="!readonly">
        <button
          class="absolute inset-y-0 left-0 w-1/2"
          @click="handleClick(i - 1, true)"
          type="button"
        />
        <button
          class="absolute inset-y-0 right-0 w-1/2"
          @click="handleClick(i - 1, false)"
          type="button"
        />
      </template>
    </div>
  </div>
</template>
