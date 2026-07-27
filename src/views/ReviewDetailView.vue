<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Star, Loader2, AlertCircle, Heart, ExternalLink, MessageSquare, Share2 } from 'lucide-vue-next'
import { getReview, likeReview, unlikeReview } from '../services/reviewService'
import { useSeoMeta } from '../composables/useSeoMeta'
import { useJsonLd, buildReviewSchema } from '../composables/useJsonLd'
import type { FullReviewDTO } from '../types'
import AppImage from '../components/AppImage.vue'
import EmotionChart from '../components/review/EmotionChart.vue'
import ReviewComments from '../components/review/ReviewComments.vue'
import ShareImageLayout from '../components/ShareImageLayout.vue'
import ShareImageModal from '../components/ShareImageModal.vue'
import ShareMenu from '../components/share/ShareMenu.vue'
import { useShareImage } from '../composables/useShareImage'

const route = useRoute()
const router = useRouter()

const review = ref<FullReviewDTO | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const liking = ref(false)
const localCommentCount = ref(0)
const commentsSection = ref<HTMLElement | null>(null)

const formattedDate = computed(() => {
    if (!review.value) return ''
    return new Date(review.value.review.createdAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    })
})

const hasTracks = computed(() => !!review.value?.review.trackScores?.length)

onMounted(async () => {
    try {
        loading.value = true
        const id = route.params.id as string
        review.value = await getReview(id)
        localCommentCount.value = review.value.commentCount

        // SEO meta after data loads
        if (review.value) {
            const artistNames = review.value.review.album.artists?.map(a => a.name).join(", ") ?? ""
            useSeoMeta({
                title: computed(() => `Review de ${review.value?.review.user.username} sobre ${review.value?.review.album.name}`),
                description: computed(() => {
                    const r = review.value?.review
                    if (!r) return ""
                    const parts = [`${r.user.username} avaliou ${r.album.name}`]
                    if (artistNames) parts[0] += ` por ${artistNames}`
                    if (r.albumScore != null) parts.push(`Nota: ${r.albumScore}/100`)
                    if (r.content) parts.push(r.content.slice(0, 155))
                    return parts.join(". ")
                }),
                image: computed(() => review.value?.review.album.image_url || null),
                type: "article",
            })

            useJsonLd(computed(() => buildReviewSchema({
                author: review.value!.review.user.username,
                albumName: review.value!.review.album.name,
                artists: review.value!.review.album.artists?.map(a => a.name) ?? [],
                content: review.value!.review.content,
                score: review.value!.review.albumScore,
                datePublished: review.value!.review.createdAt,
                url: window.location.href,
            })))
        }
    } catch (e) {
        error.value = e instanceof Error ? e.message : 'Erro ao carregar review'
    } finally {
        loading.value = false
    }
})

async function toggleLike() {
    if (!review.value || liking.value) return
    liking.value = true
    try {
        if (review.value.likedByCurrentUser) {
            await unlikeReview(review.value.review.id)
            review.value.likedByCurrentUser = false
            review.value.likeCount--
        } else {
            await likeReview(review.value.review.id)
            review.value.likedByCurrentUser = true
            review.value.likeCount++
        }
    } catch {
        // silently ignore
    } finally {
        liking.value = false
    }
}

const showShareModal = ref(false)
const showShareMenu = ref(false)
const shareLayoutRef = ref<InstanceType<typeof ShareImageLayout> | null>(null)
const shareBackground = ref<'cartaz' | 'fita' | 'estudio'>('cartaz')
const { state: shareState, setElement, generate, reset } = useShareImage(2)
const shareBlob = computed(() => shareState.value.blob)
const shareReviewData = computed(() => {
  if (!review.value) return null
  return {
    review: review.value.review,
    likeCount: review.value.likeCount,
    likedByCurrentUser: review.value.likedByCurrentUser,
    commentCount: review.value.commentCount,
  } as any
})

function openShareMenu() {
  showShareMenu.value = true
}

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

function scrollToComments() {
    commentsSection.value?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <div v-if="loading" class="flex items-center justify-center min-h-[60vh]">
    <Loader2 class="w-8 h-8 text-primary animate-spin" />
  </div>

  <div v-else-if="error" class="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-8">
    <div class="w-16 h-16 bg-red-500/10 rounded-3xl flex items-center justify-center">
      <AlertCircle class="w-8 h-8 text-red-400" />
    </div>
    <h3 class="text-lg font-semibold text-white">Erro ao carregar review</h3>
    <p class="text-muted text-sm">{{ error }}</p>
    <button @click="router.back()" class="btn-primary text-sm px-5 py-2">
      Voltar
    </button>
  </div>

  <div v-else-if="review" class="min-h-full pb-20">
    <!-- Hero Header using album cover as blurred background -->
    <div class="relative">
      <div
        v-if="review.review.album.image_url"
        class="absolute inset-0 bg-cover bg-center blur-3xl opacity-20 scale-110"
        :style="{ backgroundImage: `url(${review.review.album.image_url})` }"
      />
      <div class="absolute inset-0 bg-gradient-to-b from-dark/40 via-dark/70 to-dark" />

      <div class="relative px-4 sm:px-8 pt-6 sm:pt-8 pb-8">
        <button
          @click="router.back()"
          class="flex items-center gap-2 text-muted hover:text-white transition-colors mb-6 text-sm"
        >
          <ArrowLeft class="w-4 h-4" />
          Voltar
        </button>

      </div>
    </div>

    <!-- Main Content Container (Centered max-w-4xl) -->
    <div class="px-4 sm:px-8 max-w-4xl mx-auto space-y-8 relative z-10 -mt-2">
        <!-- User Info Bar -->
        <div class="flex items-center gap-2 bg-[var(--color-surface-2)]/50 backdrop-blur-md rounded-xl py-1.5 px-3 w-fit">
            <router-link :to="{ name: 'user-profile', params: { id: review.review.user.id } }" class="flex items-center gap-2 group cursor-pointer">
                <div class="w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0">
                  <AppImage
                      :src="review.review.user.imageUrl"
                      :alt="review.review.user.username"
                      :initial="(review.review.user.username[0] ?? '?').toUpperCase()"
                      type="artist"
                      rounded="full"
                  />
                </div>
                <div class="leading-tight">
                  <div class="flex items-center gap-1">
                    <span class="text-white text-xs font-semibold group-hover:text-primary transition-colors">
                      {{ review.review.user.username }}
                    </span>
                  </div>
                  <p class="text-[9px] text-muted leading-none mt-0.5">
                    escreveu uma review · {{ formattedDate }}
                  </p>
                </div>
            </router-link>
        </div>

        <!-- Album Showcase Card -->
        <div 
          class="flex flex-col md:flex-row gap-6 p-6 items-center md:items-start bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-2)] border border-[var(--color-border)] rounded-3xl shadow-2xl relative overflow-hidden group cursor-pointer transition-all hover:border-primary/30"
          @click="router.push({ name: 'album-detail', params: { id: review.review.album.id } })"
        >
          <!-- Absolute background glow -->
          <div class="absolute -right-16 -top-16 w-36 h-36 bg-primary/15 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/25 transition-all duration-500" />
          
          <!-- Album Cover Art -->
          <div class="w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 flex-shrink-0 shadow-2xl relative rounded-2xl overflow-hidden transition-transform group-hover:scale-[1.02] duration-300 mx-auto md:mx-0">
              <AppImage
                  :src="review.review.album.image_url"
                  :alt="review.review.album.name"
                  type="album"
                  rounded="2xl"
                  class="w-full h-full object-cover"
              />
          </div>

          <!-- Album details -->
          <div class="flex-grow text-center md:text-left space-y-3 mt-4 md:mt-0 flex flex-col justify-center min-w-0 md:pt-2">
              <div class="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                <span class="text-[10px] font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/25 px-2.5 py-1 rounded-full">
                  Álbum
                </span>
                <!-- Score badge -->
                <div
                  v-if="review.review.albumScore != null"
                  class="flex items-center gap-1 bg-yellow-400/10 border border-yellow-400/20 rounded-full px-2.5 py-0.5"
                >
                  <Star class="w-3 h-3 text-yellow-400" fill="currentColor" />
                  <span class="text-white font-bold text-[10px]">{{ review.review.albumScore }}</span>
                  <span class="text-muted text-[8px]">/100</span>
                </div>
              </div>
              
              <h1 class="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight group-hover:text-primary transition-colors truncate">
                  {{ review.review.album.name }}
              </h1>
              
              <div class="space-y-1">
                <p class="text-base text-[var(--color-text)] font-semibold leading-relaxed truncate">
                    por {{ review.review.album.artists?.map((a) => a.name).join(", ") }}
                </p>
              </div>
          </div>
        </div>
        <div v-if="review.review.content" class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 sm:p-8 shadow-xl">
            <p class="text-[var(--color-text)] leading-relaxed whitespace-pre-wrap text-lg">{{ review.review.content }}</p>
        </div>

        <!-- Emotion Chart & Tracks -->
        <div v-if="hasTracks" class="grid lg:grid-cols-2 gap-8 items-start">
            <!-- Emotion Chart -->
            <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 shadow-xl sticky top-24">
                <h3 class="text-white font-bold text-lg mb-4 flex items-center gap-2">
                    <span class="text-xl">📈</span> Gráfico Emocional
                </h3>
                <EmotionChart :review-id="review.review.id" />
            </div>

            <!-- Track Scores -->
            <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 shadow-xl">
                <h3 class="text-white font-bold text-lg mb-4">Faixa a Faixa</h3>
                <div class="space-y-2">
                    <div v-for="ts in review.review.trackScores" :key="ts.trackId" class="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[var(--color-surface-2)] transition-colors">
                        <span class="text-xs text-muted w-6 text-right flex-shrink-0">{{ ts.trackNumber }}.</span>
                        <span class="text-sm text-[var(--color-text)] flex-1 truncate font-medium">{{ ts.trackName }}</span>
                        
                        <span v-if="ts.feeling" class="text-xs font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 whitespace-nowrap"
                            :class="{
                                'bg-green-500/10 border-green-500/25 text-green-400': ['EUPHORIC', 'ENERGIZED', 'EMPOWERED', 'HAPPY', 'NOSTALGIC', 'INSPIRED', 'IN_LOVE', 'HOPEFUL'].includes(ts.feeling),
                                'bg-red-500/10 border-red-500/25 text-red-400': ['MELANCHOLIC', 'ANXIOUS', 'TENSE', 'LONELY', 'DEVASTATED', 'ANGRY', 'BORED'].includes(ts.feeling),
                                'bg-[var(--color-surface-2)] border-[var(--color-border)] text-muted': ['CALM', 'FOCUSED', 'DREAMY', 'INDIFFERENT', 'SKIPPED'].includes(ts.feeling)
                            }"
                        >{{ ts.feeling }}</span>
                        
                        <span v-if="ts.score != null" class="text-sm font-bold tabular-nums flex-shrink-0 w-8 text-right"
                            :class="ts.feeling ? 'text-primary' : 'text-white'"
                        >{{ ts.score }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Interaction Bar -->
        <div class="flex items-center gap-4 py-4 border-t border-[var(--color-border)] mt-8">
            <button
                @click="toggleLike"
                class="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-semibold transition-all"
                :class="review.likedByCurrentUser ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-[var(--color-surface-2)] text-white hover:bg-[var(--color-surface)] border border-[var(--color-border)]'"
                :disabled="liking"
            >
                <Heart class="w-5 h-5" :fill="review.likedByCurrentUser ? 'currentColor' : 'none'" :class="liking ? 'animate-pulse' : ''" />
                {{ review.likeCount }} curtidas
            </button>

            <button @click="scrollToComments" class="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-semibold bg-[var(--color-surface-2)] text-white hover:bg-[var(--color-surface)] border border-[var(--color-border)] transition-all">
                <MessageSquare class="w-5 h-5" />
                {{ localCommentCount }} comentários
            </button>
            
            <a v-if="review.review.album.spotify_url" :href="review.review.album.spotify_url" target="_blank" class="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-semibold text-[#1DB954] bg-[#1DB954]/10 hover:bg-[#1DB954]/20 border border-[#1DB954]/20 transition-all">
                <ExternalLink class="w-4 h-4" />
                Spotify
            </a>
            <button
                @click="openShareMenu"
                class="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-semibold bg-[var(--color-surface-2)] text-white hover:bg-[var(--color-surface)] border border-[var(--color-border)] transition-all"
                title="Compartilhar"
            >
                <Share2 class="w-4 h-4" />
            </button>
        </div>

        <!-- Comments Section -->
        <div ref="commentsSection" class="mt-8">
            <ReviewComments
                :review-id="review.review.id"
                :initial-count="localCommentCount"
                @count-updated="localCommentCount = $event"
            />
        </div>
    </div>
  </div>

  <!-- Hidden share image layout -->
  <div style="position: fixed; left: -9999px; top: 0; width: 1080px; height: 1350px; pointer-events: none; z-index: -1;">
    <ShareImageLayout
      ref="shareLayoutRef"
      post-type="review"
      :review="shareReviewData"
      :quick-review="null"
      :music-share="null"
      :background="shareBackground"
    />
  </div>

  <ShareMenu
    :show="showShareMenu"
    @close="showShareMenu = false"
    @open-image="openShareImage"
  />

  <ShareImageModal
    :show="showShareModal"
    :state="shareState"
    :blob="shareBlob"
    :background="shareBackground"
    @close="onShareModalClose"
    @update:background="onShareBackgroundChange"
  />
</template>
