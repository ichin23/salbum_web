<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
    ArrowLeft,
    Star,
    Heart,
    MessageSquare,
    Loader2,
    AlertCircle,
    Pencil,
    Trash2,
    MoreHorizontal,
    Share2,
} from 'lucide-vue-next'
import { getQuickReviewById, likeQuickReview, unlikeQuickReview, deleteQuickReview } from '../services/quickReviewService'
import type { FullQuickReviewDTO, QuickReviewDTO } from '../types'
import AppImage from '../components/AppImage.vue'
import QuickReviewComments from '../components/review/QuickReviewComments.vue'
import QuickReviewForm from '../components/review/QuickReviewForm.vue'
import ShareImageLayout from '../components/ShareImageLayout.vue'
import ShareImageModal from '../components/ShareImageModal.vue'
import { useShareImage } from '../composables/useShareImage'
import type { QuickReviewFormTarget } from '../components/review/QuickReviewForm.vue'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const item = ref<FullQuickReviewDTO | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const review = computed(() => item.value?.quickReview ?? null)
const liked = ref(false)
const likeCount = ref(0)
const liking = ref(false)
const deleting = ref(false)

const showComments = ref(false)

const formattedDate = computed(() => {
    if (!review.value) return ''
    return new Date(review.value.createdAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
})

const isOwner = computed(
    () => !!auth.user && review.value && auth.user.id === review.value.user.id,
)

onMounted(async () => {
    try {
        const id = route.params.id as string
        const data = await getQuickReviewById(id)
        item.value = data
        liked.value = data.likedByCurrentUser
        likeCount.value = data.likeCount
    } catch (e) {
        error.value = e instanceof Error ? e.message : 'Erro ao carregar avaliação'
    } finally {
        loading.value = false
    }
})

async function toggleLike() {
    if (!review.value || liking.value) return
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

// Edit state
const showForm = ref(false)
const editTarget = ref<QuickReviewFormTarget | null>(null)

function handleEdit() {
    if (!review.value) return
    editTarget.value = {
        targetType: 'ALBUM',
        albumId: Number(review.value.album?.id) || 0,
        albumTitle: '',
        albumCover: null,
        artistNames: '',
        tracks: [],
    }
    showForm.value = true
}

function onEditSaved(updated: QuickReviewDTO) {
    showForm.value = false
    editTarget.value = null
    if (item.value) {
        item.value.quickReview = updated
    }
}

async function confirmDelete() {
    if (!review.value || deleting.value) return
    deleting.value = true
    try {
        await deleteQuickReview(String(review.value.id))
        router.push({ name: 'album-detail', params: { id: String(review.value.album?.id) } })
    } catch {
        deleting.value = false
    }
}

const menuOpen = ref(false)

function toggleMenu() {
    menuOpen.value = !menuOpen.value
}

const showShareModal = ref(false)
const shareLayoutRef = ref<InstanceType<typeof ShareImageLayout> | null>(null)
const shareBackground = ref<'cartaz' | 'fita' | 'estudio'>('cartaz')
const { state: shareState, setElement, generate, reset } = useShareImage(2)
const shareBlob = computed(() => shareState.value.blob)
const shareQuickReviewData = computed(() => {
  if (!item.value) return null
  return item.value
})

async function openShareImage() {
  shareBackground.value = 'cartaz'
  showShareModal.value = true
  await generateShareImage()
}

async function generateShareImage() {
  reset()
  await nextTick()
  if (shareLayoutRef.value?.$el) {
    setElement(shareLayoutRef.value.$el as HTMLElement)
  }
  await generate()
}

function onShareBackgroundChange(val: 'cartaz' | 'fita' | 'estudio') {
  shareBackground.value = val
  generateShareImage()
}

function onShareModalClose() {
  showShareModal.value = false
  reset()
}
</script>

<template>
  <!-- Loading -->
  <div v-if="loading" class="flex items-center justify-center min-h-[60vh]">
    <Loader2 class="w-8 h-8 text-primary animate-spin" />
  </div>

  <!-- Error -->
  <div v-else-if="error || !review" class="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-8">
    <div class="w-16 h-16 bg-red-500/10 rounded-3xl flex items-center justify-center">
      <AlertCircle class="w-8 h-8 text-red-400" />
    </div>
    <h3 class="text-lg font-semibold text-white">Avaliação não encontrada</h3>
    <p class="text-muted text-sm">{{ error }}</p>
    <button @click="router.back()" class="btn-primary text-sm px-5 py-2">Voltar</button>
  </div>

  <!-- Content -->
  <div v-else-if="review" class="max-w-2xl mx-auto px-4 py-6 space-y-6">
    <!-- Back -->
    <button
      @click="router.back()"
      class="flex items-center gap-2 text-muted hover:text-white transition-colors text-sm"
    >
      <ArrowLeft class="w-4 h-4" />
      Voltar
    </button>

    <!-- Card -->
    <div class="card p-6 space-y-5" :class="deleting ? 'opacity-40 pointer-events-none' : ''">
      <!-- Header -->
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 flex-shrink-0">
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
            <p class="text-sm font-semibold text-white">{{ review.user.username }}</p>
            <p class="text-xs text-muted">{{ formattedDate }}</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <div class="flex items-center gap-1 bg-[var(--color-surface-2)] rounded-2xl px-3 py-1.5">
            <Star class="w-4 h-4 text-yellow-400" fill="currentColor" />
            <span class="text-white font-bold">{{ review.score }}</span>
            <span class="text-muted text-xs">/5</span>
          </div>

          <div v-if="isOwner" class="relative">
            <button @click="toggleMenu" class="p-1.5 rounded-lg text-muted hover:text-white hover:bg-[var(--color-surface-2)] transition-colors">
              <MoreHorizontal class="w-4 h-4" />
            </button>
            <div v-if="menuOpen" class="absolute right-0 top-full mt-1 z-20 w-36 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xl overflow-hidden" @click.stop>
              <button @click="handleEdit; menuOpen = false" class="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-left hover:bg-[var(--color-surface-2)] transition-colors">
                <Pencil class="w-3.5 h-3.5 text-muted" /> Editar
              </button>
              <button @click="confirmDelete" class="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-left text-red-400 hover:bg-red-500/10 transition-colors">
                <Trash2 class="w-3.5 h-3.5" /> Deletar
              </button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="menuOpen" class="fixed inset-0 z-10" @click="menuOpen = false" />

      <!-- Sentiment -->
      <div v-if="review.sentiment">
        <span class="text-xs font-medium px-3 py-1 rounded-full border bg-primary/10 border-primary/25 text-primary">
          {{ review.sentiment }}
        </span>
      </div>

      <!-- Photo -->
      <div v-if="review.photoUrl" class="rounded-2xl overflow-hidden">
        <img :src="review.photoUrl" alt="Photo" class="w-full max-h-80 object-cover" />
      </div>

      <!-- Album -->
      <RouterLink
        v-if="review.album"
        :to="{ name: 'album-detail', params: { id: review.album.id } }"
        class="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-2)] hover:bg-[var(--color-surface)] transition-colors group overflow-hidden"
      >
        <div class="w-12 h-12 flex-shrink-0 aspect-square">
          <AppImage
            :src="review.album.image_url ?? ''"
            :alt="review.album.name"
            type="album"
            :initial="review.album.name?.charAt(0).toUpperCase() ?? '?'"
            rounded="lg"
            class="w-full h-full"
          />
        </div>
        <div class="flex-1 min-w-0 overflow-hidden">
          <p class="text-sm font-semibold text-white truncate group-hover:text-primary transition-colors">
            {{ review.album.name }}
          </p>
          <p v-if="review.album.artists?.length" class="text-xs text-muted truncate">
            {{ review.album.artists.map(a => a.name).join(', ') }}
          </p>
        </div>
      </RouterLink>

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
      <p v-if="review.considerations" class="text-sm text-[var(--color-text)] leading-relaxed">
        {{ review.considerations }}
      </p>

      <!-- Actions -->
      <div class="flex items-center gap-4 pt-2 border-t border-[var(--color-border)]">
        <button
          @click="toggleLike"
          class="flex items-center gap-1.5 text-sm transition-colors"
          :class="liked ? 'text-red-400' : 'text-muted hover:text-red-400'"
          :disabled="liking"
        >
          <Heart class="w-4 h-4" :fill="liked ? 'currentColor' : 'none'" />
          {{ likeCount }}
        </button>

        <button
            @click="showComments = !showComments"
            class="flex items-center gap-1.5 text-sm text-muted hover:text-white transition-colors"
          >
            <MessageSquare class="w-4 h-4" />
            {{ item!.commentCount }}
          </button>
          <button
            @click="openShareImage"
            class="flex items-center gap-1.5 text-sm text-muted hover:text-primary transition-colors ml-auto"
            title="Compartilhar como imagem"
          >
            <Share2 class="w-4 h-4" />
          </button>
      </div>
    </div>

    <!-- Hidden share image layout -->
    <div style="position: fixed; left: -9999px; top: 0; width: 1080px; height: 1350px; pointer-events: none; z-index: -1;">
      <ShareImageLayout
        ref="shareLayoutRef"
        post-type="quick_review"
        :review="null"
        :quick-review="shareQuickReviewData"
        :music-share="null"
        :background="shareBackground"
      />
    </div>

    <ShareImageModal
      :show="showShareModal"
      :state="shareState"
      :blob="shareBlob"
      :background="shareBackground"
      @close="onShareModalClose"
      @update:background="onShareBackgroundChange"
    />

    <!-- Comments -->
    <QuickReviewComments
      v-if="showComments"
      :review-id="String(review.id)"
      :initial-count="item!.commentCount"
      @count-updated="(c) => { if (item) item.commentCount = c }"
    />
  </div>

  <QuickReviewForm
    v-if="showForm && editTarget"
    :target="editTarget"
    :existing-review="review"
    @close="showForm = false"
    @saved="onEditSaved"
  />
</template>
