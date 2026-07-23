<script setup lang="ts">
import { ref, computed } from 'vue'
import {
    Heart,
    Star,
    MessageSquare,
    MoreHorizontal,
    Pencil,
    Trash2,
} from 'lucide-vue-next'
import {
    likeQuickReview,
    unlikeQuickReview,
    deleteQuickReview,
} from '../../services/quickReviewService'
import type { FullQuickReviewDTO } from '../../types'
import AppImage from '../AppImage.vue'
import { useAuthStore } from '../../stores/auth'

const props = defineProps<{
    item: FullQuickReviewDTO
}>()

const emit = defineEmits<{
    deleted: [id: number]
    edit: [review: FullQuickReviewDTO['quickReview']]
}>()

const auth = useAuthStore()
const review = computed(() => props.item.quickReview)
const liked = ref(props.item.likedByCurrentUser)
const likeCount = ref(props.item.likeCount)
const liking = ref(false)

const formattedDate = computed(() =>
    new Date(review.value.createdAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }),
)

const isOwner = computed(
    () => !!auth.user && auth.user.id === review.value.user.id,
)

async function toggleLike() {
    if (liking.value) return
    liking.value = true
    const wasLiked = liked.value
    liked.value = !wasLiked
    likeCount.value += wasLiked ? -1 : 1
    try {
        if (wasLiked) {
            await unlikeQuickReview(String(review.value.id))
        } else {
            await likeQuickReview(String(review.value.id))
        }
    } catch {
        liked.value = wasLiked
        likeCount.value += wasLiked ? 1 : -1
    } finally {
        liking.value = false
    }
}

const menuOpen = ref(false)
const deleting = ref(false)

function openMenu() {
    menuOpen.value = !menuOpen.value
}
function closeMenu() {
    menuOpen.value = false
}

async function confirmDelete() {
    closeMenu()
    if (deleting.value) return
    deleting.value = true
    try {
        await deleteQuickReview(String(review.value.id))
        emit('deleted', review.value.id)
    } catch {
        deleting.value = false
    }
}

function handleEdit() {
    closeMenu()
    emit('edit', review.value)
}
</script>

<template>
  <div
    class="card p-5 space-y-4 hover:border-[var(--color-muted)]/40 transition-colors duration-200"
    :class="deleting ? 'opacity-40 pointer-events-none' : ''"
  >
    <!-- Header -->
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-center gap-3 group cursor-pointer">
        <div class="w-9 h-9 flex-shrink-0">
          <AppImage
            :src="review.user.imageUrl"
            :alt="review.user.username"
            :initial="(review.user.username[0] ?? '?').toUpperCase()"
            type="artist"
            rounded="full"
            class="w-full h-full"
          />
        </div>
        <div>
          <p class="text-sm font-semibold text-white">
            {{ review.user.username }}
          </p>
          <p class="text-xs text-muted">{{ formattedDate }}</p>
        </div>
      </div>

      <div class="flex items-center gap-2 flex-shrink-0">
        <!-- Score stars -->
        <div class="flex items-center gap-1 bg-[var(--color-surface-2)] rounded-2xl px-3 py-1.5">
          <Star class="w-3.5 h-3.5 text-yellow-400" fill="currentColor" />
          <span class="text-white font-bold text-sm">{{ review.score }}</span>
          <span class="text-muted text-xs">/5</span>
        </div>

        <!-- Menu (owner only) -->
        <div v-if="isOwner" class="relative">
          <button
            @click.stop="openMenu"
            class="p-1.5 rounded-lg text-muted hover:text-white hover:bg-[var(--color-surface-2)] transition-colors"
          >
            <MoreHorizontal class="w-4 h-4" />
          </button>
          <div
            v-if="menuOpen"
            class="absolute right-0 top-full mt-1 z-20 w-36 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xl overflow-hidden"
            @click.stop
          >
            <button
              @click="handleEdit"
              class="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-left hover:bg-[var(--color-surface-2)] transition-colors"
            >
              <Pencil class="w-3.5 h-3.5 text-muted" />
              Editar
            </button>
            <button
              @click="confirmDelete"
              class="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-left text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 class="w-3.5 h-3.5" />
              Deletar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Overlay click-away for menu -->
    <div v-if="menuOpen" class="fixed inset-0 z-10" @click="closeMenu" />

    <!-- Sentiment badge -->
    <div v-if="review.sentiment" class="flex items-center gap-2">
      <span
        class="text-xs font-medium px-3 py-1 rounded-full border bg-primary/10 border-primary/25 text-primary"
      >
        {{ review.sentiment }}
      </span>
    </div>

    <!-- Photo -->
    <div v-if="review.photoUrl" class="rounded-2xl overflow-hidden">
      <img
        :src="review.photoUrl"
        alt="Quick review photo"
        class="w-full max-h-64 object-cover"
      />
    </div>

    <!-- Favorite track -->
    <div
      v-if="review.favoriteTrack"
      class="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-2xl p-3"
    >
      <p class="text-xs text-muted font-medium mb-1">Faixa favorita</p>
      <p class="text-sm text-white font-semibold">
        {{ review.favoriteTrack.name }}
      </p>
      <p v-if="review.favoriteTrackComment" class="text-xs text-muted mt-1">
        {{ review.favoriteTrackComment }}
      </p>
    </div>

    <!-- Considerations -->
    <p
      v-if="review.considerations"
      class="text-sm text-[var(--color-text)] leading-relaxed"
    >
      {{ review.considerations }}
    </p>

    <!-- Footer -->
    <div class="flex items-center gap-4 pt-1 border-t border-[var(--color-border)]">
      <button
        @click="toggleLike"
        class="flex items-center gap-1.5 text-xs transition-colors"
        :class="liked ? 'text-red-400' : 'text-muted hover:text-red-400'"
        :disabled="liking"
      >
        <Heart class="w-4 h-4" :fill="liked ? 'currentColor' : 'none'" />
        {{ likeCount }}
      </button>

      <span class="flex items-center gap-1.5 text-xs text-muted">
        <MessageSquare class="w-4 h-4" />
        {{ item.commentCount }}
      </span>
    </div>
  </div>
</template>
