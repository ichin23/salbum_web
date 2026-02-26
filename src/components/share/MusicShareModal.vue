<script setup lang="ts">
import { ref } from 'vue'
import { X, Share2, CheckCircle, AlertCircle } from 'lucide-vue-next'
import { createMusicShare } from '../../services/musicShareService'
import AppImage from '../AppImage.vue'

export type ShareTarget = {
  type: 'album'
  id: string
  title: string
  subtitle: string
  coverUrl: string | null
} | {
  type: 'music'
  id: string
  title: string
  subtitle: string
  coverUrl: string | null
} | {
  type: 'artist'
  id: string
  title: string
  subtitle: string
  imageUrl?: string | null
}

const props = defineProps<{
  target: ShareTarget
}>()

const emit = defineEmits<{
  close: []
  shared: [comment: string]
}>()

const comment = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref(false)

async function submit() {
  error.value = null
  loading.value = true
  try {
    await createMusicShare(props.target.type, props.target.id, comment.value)
    success.value = true
    setTimeout(() => {
      emit('shared', comment.value)
      success.value = false
    }, 900)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao compartilhar'
  } finally {
    loading.value = false
  }
}

const typeLabel = { album: 'Álbum', music: 'Música', artist: 'Artista' }
// const TypeIcon = { album: Disc3, music: Music, artist: User }

function coverSrc(target: ShareTarget): string | null | undefined {
  if (target.type === 'artist') return target.imageUrl
  return target.coverUrl
}
</script>

<template>
  <!-- Backdrop -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        @click.self="emit('close')"
      >
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-2"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-2"
          appear
        >
          <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <!-- Header -->
            <div class="flex items-center justify-between px-6 pt-6 pb-4">
              <div class="flex items-center gap-2">
                <Share2 class="w-5 h-5 text-primary" />
                <h2 class="text-lg font-bold text-white">Compartilhar</h2>
              </div>
              <button
                @click="emit('close')"
                class="w-8 h-8 flex items-center justify-center rounded-xl text-muted hover:text-white hover:bg-[var(--color-surface-2)] transition-all"
              >
                <X class="w-4 h-4" />
              </button>
            </div>

            <!-- Target preview -->
            <div class="px-6 pb-4">
              <div class="flex items-center gap-4 bg-[var(--color-surface-2)] rounded-2xl p-4">
                <!-- Cover / avatar -->
                <div class="flex-shrink-0 w-14 h-14">
                  <AppImage
                    :src="coverSrc(target)"
                    :alt="target.title"
                    :type="target.type === 'artist' ? 'artist' : 'album'"
                    :initial="target.type === 'artist' ? target.title : ''"
                    rounded="xl"
                    class="w-14 h-14"
                  />
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-1.5 mb-1">
                    <span
                      class="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      :class="{
                        'bg-primary/15 text-primary': target.type === 'album',
                        'bg-secondary/15 text-secondary': target.type === 'music',
                        'bg-purple-500/15 text-purple-400': target.type === 'artist',
                      }"
                    >
                      {{ typeLabel[target.type] }}
                    </span>
                  </div>
                  <p class="text-sm font-semibold text-white truncate">{{ target.title }}</p>
                  <p class="text-xs text-muted truncate">{{ target.subtitle }}</p>
                </div>
              </div>
            </div>

            <!-- Comment textarea -->
            <div class="px-6 pb-6">
              <label class="block text-sm font-medium text-muted mb-2">
                Comentário <span class="text-xs">(opcional)</span>
              </label>
              <textarea
                v-model="comment"
                rows="4"
                placeholder="O que você quer dizer sobre isso?"
                class="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-muted)] rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />

              <!-- Error -->
              <p v-if="error" class="flex items-center gap-1.5 text-sm text-red-400 mt-3">
                <AlertCircle class="w-4 h-4 flex-shrink-0" />
                {{ error }}
              </p>

              <!-- Actions -->
              <div class="flex gap-3 mt-4">
                <button
                  @click="emit('close')"
                  class="flex-1 px-4 py-2.5 rounded-2xl text-sm font-medium text-muted bg-[var(--color-surface-2)] hover:text-white hover:bg-[var(--color-surface)] border border-[var(--color-border)] transition-all"
                >
                  Cancelar
                </button>
                <button
                  @click="submit"
                  :disabled="loading || success"
                  class="flex-1 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  :class="success ? 'bg-secondary text-white' : 'bg-primary text-white hover:bg-primary/90'"
                >
                  <span v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <CheckCircle v-else-if="success" class="w-4 h-4" />
                  <Share2 v-else class="w-4 h-4" />
                  {{ loading ? 'Compartilhando...' : success ? 'Compartilhado!' : 'Compartilhar' }}
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
