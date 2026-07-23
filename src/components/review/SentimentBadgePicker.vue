<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Loader2, AlertCircle } from 'lucide-vue-next'
import { getQuickReviewFeelings } from '../../services/quickReviewService'
import type { QuickReviewFeelingOption } from '../../types'

const props = withDefaults(defineProps<{
    modelValue?: string
    disabled?: boolean
}>(), {
    modelValue: '',
    disabled: false,
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
}>()

const feelings = ref<QuickReviewFeelingOption[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const grouped = computed(() => {
    const map = new Map<string, QuickReviewFeelingOption[]>()
    for (const f of feelings.value) {
        if (!map.has(f.category)) map.set(f.category, [])
        map.get(f.category)!.push(f)
    }
    return map
})

const categoryColors: Record<string, string> = {
    'Vibes': 'bg-green-500/10 border-green-500/25 text-green-400 hover:bg-green-500/20',
    'Experiência': 'bg-blue-500/10 border-blue-500/25 text-blue-400 hover:bg-blue-500/20',
    'Formato': 'bg-purple-500/10 border-purple-500/25 text-purple-400 hover:bg-purple-500/20',
    'Outros': 'bg-[var(--color-surface-2)] border-[var(--color-border)] text-muted hover:bg-[var(--color-surface)]',
}

onMounted(async () => {
    try {
        feelings.value = await getQuickReviewFeelings()
    } catch (e) {
        error.value = e instanceof Error ? e.message : 'Erro ao carregar sentimentos'
    } finally {
        loading.value = false
    }
})

const customText = ref(props.modelValue)

function selectFeeling(value: string) {
    if (props.disabled) return
    customText.value = value
    emit('update:modelValue', value)
}

function onCustomInput() {
    emit('update:modelValue', customText.value)
}

function getActiveClass(value: string) {
    return props.modelValue === value
        ? 'ring-2 ring-primary ring-offset-2 ring-offset-[var(--color-surface)]'
        : ''
}
</script>

<template>
  <div class="space-y-3">
    <p class="text-xs font-semibold text-muted uppercase tracking-wider">
      Sentimento
    </p>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center gap-2 py-2">
      <Loader2 class="w-4 h-4 text-primary animate-spin" />
      <span class="text-sm text-muted">Carregando sentimentos...</span>
    </div>

    <!-- Error -->
    <p v-else-if="error" class="flex items-center gap-1.5 text-sm text-red-400">
      <AlertCircle class="w-4 h-4" />
      {{ error }}
    </p>

    <!-- Badge groups -->
    <div v-else class="space-y-3">
      <div v-for="[category, options] in grouped" :key="category">
        <p class="text-xs text-muted mb-2 font-medium">{{ category }}</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="option in options"
            :key="option.value"
            type="button"
            :disabled="disabled"
            class="text-xs font-medium px-3 py-1.5 rounded-full border transition-all"
            :class="[
              categoryColors[category] || categoryColors['Outros'],
              getActiveClass(option.value),
            ]"
            @click="selectFeeling(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Free text input -->
    <div>
      <input
        v-model="customText"
        :disabled="disabled"
        type="text"
        maxlength="255"
        placeholder="Ou digite seu sentimento..."
        class="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-muted focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
        @input="onCustomInput"
      />
      <p class="text-[11px] text-muted mt-1">Máximo 255 caracteres</p>
    </div>
  </div>
</template>
