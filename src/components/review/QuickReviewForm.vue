<script setup lang="ts">
import { ref, computed } from 'vue'
import {
    X,
    Star,
    CheckCircle,
    AlertCircle,
    Loader2,
    Image,
} from 'lucide-vue-next'
import { createQuickReview, updateQuickReview, uploadQuickReviewPhoto } from '../../services/quickReviewService'
import StarRating from './StarRating.vue'
import SentimentBadgePicker from './SentimentBadgePicker.vue'
import type { QuickReviewDTO, FetchMusic } from '../../types'

export type QuickReviewFormTarget = {
    targetType: 'ALBUM' | 'MUSIC'
    albumId: number
    albumTitle: string
    albumCover: string | null
    artistNames: string
    musicId?: number
    musicName?: string
    tracks: Pick<FetchMusic, 'id' | 'name' | 'position'>[]
}

const props = withDefaults(defineProps<{
    target: QuickReviewFormTarget
    existingReview?: QuickReviewDTO | null
}>(), {
    existingReview: null,
})

const emit = defineEmits<{
    close: []
    saved: [review: QuickReviewDTO]
}>()

const isEdit = computed(() => !!props.existingReview)

const score = ref(props.existingReview?.score ?? 0)
const sentiment = ref(props.existingReview?.sentiment ?? '')
const considerations = ref(props.existingReview?.considerations ?? '')
const favoriteTrackId = ref<number | null>(props.existingReview?.favoriteTrack?.id ? Number(props.existingReview.favoriteTrack.id) : null)
const favoriteTrackComment = ref(props.existingReview?.favoriteTrackComment ?? '')
const photoUrl = ref<string | null>(props.existingReview?.photoUrl ?? null)

const submitting = ref(false)
const error = ref<string | null>(null)
const success = ref(false)

async function handlePhotoUpload(file: File): Promise<string> {
    const url = await uploadQuickReviewPhoto(file)
    photoUrl.value = url
    return url
}

async function submit() {
    if (submitting.value) return
    error.value = null
    submitting.value = true

    try {
        if (isEdit.value && props.existingReview) {
            const updated = await updateQuickReview(String(props.existingReview.id), {
                score: score.value,
                sentiment: sentiment.value,
                photoUrl: photoUrl.value,
                favoriteTrackId: favoriteTrackId.value,
                favoriteTrackComment: favoriteTrackComment.value || null,
                considerations: considerations.value || null,
            })
            success.value = true
            setTimeout(() => emit('saved', updated), 600)
        } else {
            const payload: Record<string, unknown> = {
                targetType: props.target.targetType,
                albumId: props.target.albumId,
                score: score.value,
                sentiment: sentiment.value,
            }
            if (props.target.targetType === 'MUSIC' && props.target.musicId) {
                payload.musicId = props.target.musicId
            }
            if (photoUrl.value) payload.photoUrl = photoUrl.value
            if (favoriteTrackId.value) {
                payload.favoriteTrackId = favoriteTrackId.value
                if (favoriteTrackComment.value) payload.favoriteTrackComment = favoriteTrackComment.value
            }
            if (considerations.value) payload.considerations = considerations.value

            const created = await createQuickReview(payload as any)
            success.value = true
            setTimeout(() => emit('saved', created), 600)
        }
    } catch (e) {
        error.value = e instanceof Error ? e.message : 'Erro ao salvar avaliação'
    } finally {
        submitting.value = false
    }
}
</script>

<template>
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
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex sm:items-center sm:justify-center"
        @click.self="emit('close')"
      >
        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="translate-y-full sm:translate-y-0 sm:opacity-0 sm:scale-95"
          enter-to-class="translate-y-0 sm:opacity-100 sm:scale-100"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="translate-y-0 sm:opacity-100 sm:scale-100"
          leave-to-class="translate-y-full sm:translate-y-0 sm:opacity-0 sm:scale-95"
          appear
        >
          <div
            class="
              bg-[var(--color-surface)] border-t sm:border border-[var(--color-border)]
              sm:rounded-3xl w-full sm:max-w-lg max-h-[85vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl
              absolute bottom-0 left-0 right-0 sm:relative sm:mx-4
              rounded-t-3xl sm:rounded-t-3xl
            "
          >
            <!-- Header -->
            <div class="sticky top-0 bg-[var(--color-surface)] z-10">
              <!-- Mobile handle -->
              <div class="flex items-center justify-center w-full py-2 sm:hidden">
                <div class="w-10 h-1 bg-[var(--color-border)] rounded-full" />
              </div>
              <div class="flex items-center justify-between px-6 pb-4 sm:pt-6">
                <div class="flex items-center gap-2">
                  <Star class="w-5 h-5 text-yellow-400 sm:block hidden" fill="currentColor" />
                  <h2 class="text-sm sm:text-lg font-bold text-white">
                    {{ isEdit ? 'Editar' : 'Nova' }} Avaliação Rápida
                  </h2>
                </div>
                <button
                  @click="emit('close')"
                  class="w-8 h-8 flex items-center justify-center rounded-xl text-muted hover:text-white hover:bg-[var(--color-surface-2)] transition-all"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>

            <div class="px-6 pb-6 space-y-6">
              <!-- Success state -->
              <div v-if="success" class="flex flex-col items-center py-8 gap-3">
                <div class="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center">
                  <CheckCircle class="w-8 h-8 text-secondary" />
                </div>
                <p class="text-white font-semibold">
                  {{ isEdit ? 'Avaliação atualizada!' : 'Avaliação criada!' }}
                </p>
              </div>

              <template v-else>
                <!-- Score -->
                <div class="space-y-2">
                  <p class="text-xs font-semibold text-muted uppercase tracking-wider">Nota</p>
                  <StarRating v-model="score" :max="5" size="lg" />
                </div>

                <!-- Sentiment -->
                <SentimentBadgePicker v-model="sentiment" :disabled="submitting" />

                <!-- Photo -->
                <div class="space-y-2">
                  <p class="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
                    <Image class="w-3.5 h-3.5" />
                    Foto <span class="text-[10px] font-normal">(opcional)</span>
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    @change="async (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0]
                      if (file) {
                        try {
                          await handlePhotoUpload(file)
                        } catch {}
                      }
                    }"
                    class="w-full text-sm text-muted file:mr-3 file:py-2 file:px-4 file:rounded-2xl file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90"
                  />
                  <p v-if="photoUrl" class="text-xs text-primary truncate">Foto carregada ✓</p>
                </div>

                <!-- Favorite track (album only) -->
                <div class="space-y-2">
                  <p class="text-xs font-semibold text-muted uppercase tracking-wider">
                    Faixa favorita <span class="text-[10px] font-normal">(opcional)</span>
                  </p>
                  <select
                    v-model="favoriteTrackId"
                    :disabled="submitting"
                    class="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                  >
                    <option :value="null">Nenhuma</option>
                    <option
                      v-for="track in target.tracks"
                      :key="track.id"
                      :value="track.id"
                    >
                      {{ track.position }}. {{ track.name }}
                    </option>
                  </select>
                  <input
                    v-if="favoriteTrackId"
                    v-model="favoriteTrackComment"
                    type="text"
                    maxlength="500"
                    placeholder="Comentário sobre a faixa (opcional)"
                    class="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <!-- Considerations -->
                <div class="space-y-2">
                  <p class="text-xs font-semibold text-muted uppercase tracking-wider">
                    Considerações <span class="text-[10px] font-normal">(opcional)</span>
                  </p>
                  <textarea
                    v-model="considerations"
                    rows="3"
                    maxlength="1000"
                    placeholder="O que você achou?"
                    class="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-muted resize-none focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <!-- Error -->
                <p v-if="error" class="flex items-center gap-1.5 text-sm text-red-400">
                  <AlertCircle class="w-4 h-4 flex-shrink-0" />
                  {{ error }}
                </p>

                <!-- Actions -->
                <div class="flex gap-3 pt-2">
                  <button
                    @click="emit('close')"
                    :disabled="submitting"
                    class="flex-1 px-4 py-2.5 rounded-2xl text-sm font-medium text-muted bg-[var(--color-surface-2)] hover:text-white hover:bg-[var(--color-surface)] border border-[var(--color-border)] transition-all disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    @click="submit"
                    :disabled="submitting || score === 0 || !sentiment"
                    class="flex-1 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all disabled:opacity-60 bg-primary text-white hover:bg-primary/90 flex items-center justify-center gap-2"
                  >
                    <Loader2 v-if="submitting" class="w-4 h-4 animate-spin" />
                    <Star v-else class="w-4 h-4" />
                    {{ isEdit ? 'Salvar' : 'Avaliar' }}
                  </button>
                </div>
              </template>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
