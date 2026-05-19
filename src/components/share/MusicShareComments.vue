<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Loader2, Send, MessageSquare, Trash2 } from 'lucide-vue-next'
import { getMusicShareComments, addMusicShareComment, deleteMusicShareComment } from '../../services/musicShareService'
import { useAuthStore } from '../../stores/auth'
import type { MusicShareCommentDTO } from '../../types'
import AppImage from '../AppImage.vue'

const props = defineProps<{
    shareId: string
    initialCount: number
}>()

const emit = defineEmits<{
    (e: 'countUpdated', count: number): void
}>()

const auth = useAuthStore()

const comments = ref<MusicShareCommentDTO[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const newComment = ref('')
const submitting = ref(false)
const deletingCommentId = ref<string | null>(null)

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
        comments.value = await getMusicShareComments(props.shareId)
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
        const created = await addMusicShareComment(props.shareId, content)
        comments.value.unshift(created)
        newComment.value = ''
        emit('countUpdated', comments.value.length)
    } catch {
        // silently ignore
    } finally {
        submitting.value = false
    }
}

async function handleDeleteComment(commentId: string) {
    if (deletingCommentId.value) return
    if (!confirm('Deseja realmente excluir este comentário?')) return

    deletingCommentId.value = commentId
    try {
        await deleteMusicShareComment(commentId)
        comments.value = comments.value.filter(c => c.id !== commentId)
        emit('countUpdated', comments.value.length)
    } catch (e) {
        alert('Erro ao excluir comentário.')
    } finally {
        deletingCommentId.value = null
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
        class="flex gap-3 p-3 rounded-2xl hover:bg-[var(--color-surface-2)] transition-colors group relative"
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
          <p class="text-sm text-[var(--color-text)] leading-relaxed pr-8">{{ comment.content }}</p>
        </div>

        <!-- Delete Comment Button (Only visible on hover/focus if owner) -->
        <button
          v-if="auth.user && comment.user.id === auth.user.id"
          @click="handleDeleteComment(comment.id)"
          class="absolute right-3 top-3 p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
          :disabled="deletingCommentId === comment.id"
          title="Excluir comentário"
        >
          <Loader2 v-if="deletingCommentId === comment.id" class="w-3.5 h-3.5 animate-spin" />
          <Trash2 v-else class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </div>
</template>
