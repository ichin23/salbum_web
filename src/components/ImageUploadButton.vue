<script setup lang="ts">
import { ref } from 'vue'
import { Upload, Loader2, CheckCircle2, AlertCircle, Camera } from 'lucide-vue-next'

const props = defineProps<{
  /** Função que recebe o File e faz o upload, retorna a URL/path final da imagem */
  onUpload: (file: File) => Promise<string>
  /** URL atual da imagem, para preview */
  currentImageUrl?: string | null
  /** Texto do label */
  label?: string
  /** Tamanho do preview: 'sm' | 'md' | 'lg' */
  size?: 'sm' | 'md' | 'lg'
  /** Shape do preview: 'circle' | 'rounded' */
  shape?: 'circle' | 'rounded'
}>()

const emit = defineEmits<{
  (e: 'uploaded', url: string): void
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const uploadError = ref<string | null>(null)
const uploadDone = ref(false)
const previewUrl = ref<string | null>(props.currentImageUrl ?? null)

const sizeClass = {
  sm: 'w-14 h-14',
  md: 'w-20 h-20',
  lg: 'w-28 h-28',
}[props.size ?? 'md']

const shapeClass = (props.shape ?? 'rounded') === 'circle' ? 'rounded-full' : 'rounded-2xl'

function openPicker() {
  fileInput.value?.click()
}

async function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  // Validate type
  if (!file.type.startsWith('image/')) {
    uploadError.value = 'Selecione um arquivo de imagem válido.'
    return
  }
  // Validate size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    uploadError.value = 'Imagem muito grande. Máximo 5 MB.'
    return
  }

  // Local preview
  const reader = new FileReader()
  reader.onload = (ev) => {
    previewUrl.value = ev.target?.result as string
  }
  reader.readAsDataURL(file)

  uploading.value = true
  uploadError.value = null
  uploadDone.value = false

  try {
    const resultUrl = await props.onUpload(file)
    uploadDone.value = true
    emit('uploaded', resultUrl)
  } catch (err) {
    uploadError.value = err instanceof Error ? err.message : 'Erro ao fazer upload.'
    // revert preview on error
    previewUrl.value = props.currentImageUrl ?? null
  } finally {
    uploading.value = false
    // reset input so same file can be re-selected
    if (fileInput.value) fileInput.value.value = ''
  }
}
</script>

<template>
  <div class="flex flex-col items-start gap-2">
    <p v-if="label" class="text-xs font-semibold text-muted uppercase tracking-wider">{{ label }}</p>

    <div class="flex items-center gap-4">
      <!-- Preview -->
      <div
        class="relative flex-shrink-0 overflow-hidden bg-[var(--color-surface-2)] border border-[var(--color-border)]"
        :class="[sizeClass, shapeClass]"
      >
        <img
          v-if="previewUrl"
          :src="previewUrl"
          alt="preview"
          class="w-full h-full object-cover"
        />
        <div v-else class="w-full h-full flex items-center justify-center">
          <Camera class="w-5 h-5 text-muted" />
        </div>

        <!-- Overlay spinner while uploading -->
        <div
          v-if="uploading"
          class="absolute inset-0 bg-black/50 flex items-center justify-center"
          :class="shapeClass"
        >
          <Loader2 class="w-5 h-5 text-white animate-spin" />
        </div>
      </div>

      <!-- Action area -->
      <div class="space-y-1.5">
        <button
          type="button"
          :disabled="uploading"
          @click="openPicker"
          class="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl border transition-colors disabled:opacity-50"
          :class="uploadDone
            ? 'bg-secondary/10 border-secondary/30 text-secondary hover:bg-secondary/20'
            : 'bg-[var(--color-surface-2)] border-[var(--color-border)] text-muted hover:text-white hover:border-[var(--color-muted)]/50'"
        >
          <CheckCircle2 v-if="uploadDone && !uploading" class="w-4 h-4" />
          <Loader2 v-else-if="uploading" class="w-4 h-4 animate-spin" />
          <Upload v-else class="w-4 h-4" />
          {{ uploading ? 'Enviando…' : uploadDone ? 'Imagem enviada!' : 'Escolher imagem' }}
        </button>

        <p class="text-[11px] text-muted">JPG, PNG ou WEBP · máx. 5 MB</p>

        <p v-if="uploadError" class="flex items-center gap-1.5 text-xs text-red-400">
          <AlertCircle class="w-3.5 h-3.5 flex-shrink-0" />
          {{ uploadError }}
        </p>
      </div>
    </div>

    <!-- Hidden input -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="onFileChange"
    />
  </div>
</template>
