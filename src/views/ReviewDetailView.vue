<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Star, Loader2, AlertCircle, Heart, ExternalLink, MessageSquare } from 'lucide-vue-next'
import { getReview, likeReview, unlikeReview } from '../services/reviewService'
import type { FullReviewDTO } from '../types'
import AppImage from '../components/AppImage.vue'
import EmotionChart from '../components/review/EmotionChart.vue'

const route = useRoute()
const router = useRouter()

const review = ref<FullReviewDTO | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const liking = ref(false)

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

        <!-- User Info & Album Summary -->
        <div class="flex flex-col sm:flex-row gap-5 items-start">
            <div class="w-20 h-20 sm:w-28 sm:h-28 flex-shrink-0 shadow-xl relative z-10 group cursor-pointer" @click="router.push({ name: 'album-detail', params: { id: review.review.album.id } })">
                <AppImage
                    :src="review.review.album.image_url"
                    :alt="review.review.album.name"
                    type="album"
                    rounded="xl"
                    class="w-full h-full group-hover:opacity-80 transition-opacity"
                />
            </div>

            <div class="space-y-2 mt-2 sm:mt-0 flex-1">
                <div class="flex items-center gap-3">
                    <router-link :to="{ name: 'user-profile', params: { id: review.review.user.id } }" class="flex items-center gap-2 group cursor-pointer">
                        <AppImage
                            :src="review.review.user.imageUrl"
                            :alt="review.review.user.username"
                            :initial="(review.review.user.username[0] ?? '?').toUpperCase()"
                            type="artist"
                            rounded="full"
                            class="w-8 h-8"
                        />
                        <span class="text-white font-semibold group-hover:text-primary transition-colors">{{ review.review.user.username }}</span>
                    </router-link>
                    <span class="text-muted text-sm px-2">·</span>
                    <span class="text-muted text-sm">{{ formattedDate }}</span>
                </div>

                <div class="pt-1">
                    <span class="text-xs text-muted font-medium uppercase tracking-wider">Review de</span>
                    <h1 class="text-xl sm:text-2xl font-black text-white hover:text-primary transition-colors cursor-pointer inline-flex items-center gap-2 ml-1" @click="router.push({ name: 'album-detail', params: { id: review.review.album.id } })">
                        {{ review.review.album.name }}
                    </h1>
                </div>

                <!-- Score Badge -->
                <div v-if="review.review.albumScore != null" class="flex items-center gap-2 mt-3 bg-[var(--color-surface-2)] w-fit rounded-2xl px-4 py-2 border border-[var(--color-border)]">
                    <Star class="w-4 h-4 text-yellow-400" fill="currentColor" />
                    <span class="text-white font-bold text-lg">{{ review.review.albumScore }}</span>
                    <span class="text-muted text-sm">/100</span>
                </div>
            </div>
        </div>
      </div>
    </div>

    <!-- Review Content -->
    <div class="px-4 sm:px-8 max-w-4xl mx-auto space-y-10 relative z-10 -mt-2">
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

            <!-- TODO: Comments logic in next phase -->
            <button class="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-semibold bg-[var(--color-surface-2)] text-white hover:bg-[var(--color-surface)] border border-[var(--color-border)] transition-all">
                <MessageSquare class="w-5 h-5" />
                {{ review.commentCount }} comentários
            </button>
            
            <a v-if="review.review.album.spotify_url" :href="review.review.album.spotify_url" target="_blank" class="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-2xl font-semibold text-[#1DB954] bg-[#1DB954]/10 hover:bg-[#1DB954]/20 border border-[#1DB954]/20 transition-all">
                <ExternalLink class="w-4 h-4" />
                Spotify
            </a>
        </div>
    </div>
  </div>
</template>
