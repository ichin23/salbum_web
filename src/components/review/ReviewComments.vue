<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Loader2, Send, MessageSquare } from 'lucide-vue-next'
import { getReviewComments, addReviewComment } from '../../services/reviewService'
import type { ReviewCommentDTO } from '../../types'
import AppImage from '../AppImage.vue'

const props = defineProps<{
    reviewId: string
    initialCount: number
}>()

const emit = defineEmits<{
    (e: 'countUpdated', count: number): void
}>()

const comments = ref<ReviewCommentDTO[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const newComment = ref('')
const submitting = ref(false)

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

onMounted(async () => {
    try {
        comments.value = await getReviewComments(props.reviewId)
    } catch (e) {
        error.value = e instanceof Error ? e.message : 'Erro ao carregar comentários'
    } finally {
        loading.value = false
    }
})

async function submitComment() {
    const content = newComment.value.trim()
    if (!content || submitting.value) return

    submitting.value = true
    try {
        const created = await addReviewComment(props.reviewId, content)
        comments.value.unshift(created)
        newComment.value = ''
        emit('countUpdated', comments.value.length)
    } catch {
        // silently ignore
    } finally {
        submitting.value = false
    }
}
</script>

<template>
  <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 sm:p-8 shadow-xl">
    <!-- Header -->
    <h3 class="text-white font-bold text-lg mb-6 flex items-center gap-2">
      <MessageSquare class="w-5 h-5 text-primary" />
      Comentários
    </h3>

    <!-- Comment Form -->
    <div class="mb-6 space-y-3">
      <textarea
        v-model="newComment"
        rows="3"
        class="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-2xl px-4 py-3 text-sm text-[var(--color-text)] resize-none focus:outline-none focus:border-primary transition-colors placeholder:text-muted"
        placeholder="Escreva um comentário..."
        @keydown.meta.enter="submitComment"
        @keydown.ctrl.enter="submitComment"
      />
      <div class="flex justify-end">
        <button
          @click="submitComment"
          :disabled="!newComment.trim() || submitting"
          class="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-primary text-white hover:bg-primary/90"
        >
          <Loader2 v-if="submitting" class="w-4 h-4 animate-spin" />
          <Send v-else class="w-4 h-4" />
          Comentar
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <Loader2 class="w-6 h-6 text-primary animate-spin" />
    </div>

    <!-- Error -->
    <p v-else-if="error" class="text-sm text-red-400 text-center py-6">{{ error }}</p>

    <!-- Empty -->
    <p v-else-if="comments.length === 0" class="text-sm text-muted text-center py-6">
      Nenhum comentário ainda. Seja o primeiro!
    </p>

    <!-- Comment List -->
    <div v-else class="space-y-4">
      <div
        v-for="comment in comments"
        :key="comment.id"
        class="flex gap-3 p-3 rounded-2xl hover:bg-[var(--color-surface-2)] transition-colors"
      >
        <router-link
          :to="{ name: 'user-profile', params: { id: comment.user.id } }"
          class="flex-shrink-0 w-8 h-8 block"
        >
          <AppImage
            :src="comment.user.imageUrl"
            :alt="comment.user.username"
            :initial="(comment.user.username[0] ?? '?').toUpperCase()"
            type="artist"
            rounded="full"
          />
        </router-link>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <router-link
              :to="{ name: 'user-profile', params: { id: comment.user.id } }"
              class="text-sm font-semibold text-white hover:text-primary transition-colors"
            >
              {{ comment.user.username }}
            </router-link>
            <span class="text-xs text-muted">{{ formatDate(comment.createdAt) }}</span>
          </div>
          <p class="text-sm text-[var(--color-text)] leading-relaxed">{{ comment.content }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
