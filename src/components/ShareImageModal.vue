<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { X, Download, Share2, Copy, Loader2, AlertCircle } from 'lucide-vue-next'
import type { ShareImageState } from '../composables/useShareImage'

const props = defineProps<{
  show: boolean
  state: ShareImageState
  blob: Blob | null
  background: string
}>()

const emit = defineEmits<{
  close: []
  'update:background': [value: 'cartaz' | 'fita' | 'estudio']
}>()

const backgroundOptions = [
  { id: 'cartaz', label: 'Cartaz', icon: '🖼️' },
  { id: 'fita', label: 'Fita', icon: '📼' },
  { id: 'estudio', label: 'Estúdio', icon: '🎧' },
]

const imgUrl = ref<string | null>(null)
const copySuccess = ref(false)

watch(() => props.blob, (blob) => {
  if (blob) {
    imgUrl.value = URL.createObjectURL(blob)
  } else {
    imgUrl.value = null
  }
})

onMounted(() => {
  if (props.blob) {
    imgUrl.value = URL.createObjectURL(props.blob)
  }
})

function getFilename() {
  const ts = Date.now()
  return `salbum-post-${ts}.png`
}

function download() {
  if (!props.blob) return
  const url = URL.createObjectURL(props.blob)
  const a = document.createElement('a')
  a.href = url
  a.download = getFilename()
  a.click()
  URL.revokeObjectURL(url)
}

async function share() {
  if (!props.blob) return
  if (navigator.share) {
    try {
      const file = new File([props.blob], getFilename(), { type: 'image/png' })
      await navigator.share({
        files: [file],
        title: 'Salbum',
      })
    } catch {
      // user cancelled or API not supported
    }
  } else {
    download()
  }
}

async function copyToClipboard() {
  if (!props.blob) return
  try {
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': props.blob }),
    ])
    copySuccess.value = true
    setTimeout(() => { copySuccess.value = false }, 2000)
  } catch {
    // fallback: download
    download()
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      @click.self="emit('close')"
    >
      <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        class="relative bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h3 class="text-lg font-bold text-white">Compartilhar imagem</h3>
          <button
            @click="emit('close')"
            class="p-1.5 rounded-lg text-muted hover:text-white hover:bg-[var(--color-surface-2)] transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Body -->
        <div class="p-4">
          <!-- Loading -->
          <div v-if="state.generating" class="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 class="w-10 h-10 text-primary animate-spin" />
            <p class="text-sm text-muted">Gerando imagem...</p>
          </div>

          <!-- Error -->
          <div v-else-if="state.error" class="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <AlertCircle class="w-10 h-10 text-red-400" />
            <p class="text-sm text-red-400">{{ state.error }}</p>
          </div>

          <!-- Preview -->
          <div v-else-if="imgUrl" class="space-y-4">
            <!-- Style selector -->
            <div class="flex gap-2 justify-center">
              <button
                v-for="opt in backgroundOptions"
                :key="opt.id"
                @click="emit('update:background', opt.id as 'cartaz' | 'fita' | 'estudio')"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border"
                :class="background === opt.id
                  ? 'bg-primary/15 border-primary/30 text-primary'
                  : 'bg-[var(--color-surface-2)] border-[var(--color-border)] text-muted hover:text-white hover:border-muted/30'"
              >
                <span>{{ opt.icon }}</span>
                {{ opt.label }}
              </button>
            </div>
            <div
              class="rounded-2xl overflow-hidden border border-[var(--color-border)]"
              style="aspect-ratio: 4/5; max-height: 500px;"
            >
              <img
                :src="imgUrl"
                alt="Preview"
                class="w-full h-full object-contain bg-black"
              />
            </div>

            <!-- Actions -->
            <div class="flex gap-2">
              <button
                @click="download"
                class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl font-semibold text-sm bg-primary text-white hover:bg-primary/90 transition-colors"
              >
                <Download class="w-4 h-4" />
                Download
              </button>
              <button
                @click="share"
                class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl font-semibold text-sm bg-[var(--color-surface-2)] text-white hover:bg-[var(--color-surface)] border border-[var(--color-border)] transition-colors"
              >
                <Share2 class="w-4 h-4" />
                Compartilhar
              </button>
              <button
                @click="copyToClipboard"
                class="flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl font-semibold text-sm bg-[var(--color-surface-2)] text-white hover:bg-[var(--color-surface)] border border-[var(--color-border)] transition-colors"
                :class="copySuccess ? 'border-green-500/40 text-green-400' : ''"
              >
                <Copy v-if="!copySuccess" class="w-4 h-4" />
                <span v-else class="text-green-400">Copiado!</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
