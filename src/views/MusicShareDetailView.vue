<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Loader2, AlertCircle, Heart, MessageSquare, ExternalLink } from 'lucide-vue-next'
import { getMusicShareById, likeMusicShare, unlikeMusicShare } from '../services/musicShareService'
import type { FullMusicShareDTO } from '../types'
import AppImage from '../components/AppImage.vue'
import MusicShareComments from '../components/share/MusicShareComments.vue'

const route = useRoute()
const router = useRouter()

const fullShare = ref<FullMusicShareDTO | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const liking = ref(false)
const localCommentCount = ref(0)
const commentsSection = ref<HTMLElement | null>(null)

const share = computed(() => fullShare.value?.musicShare ?? null)

const formattedDate = computed(() => {
    if (!share.value) return ''
    return new Date(share.value.createdAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    })
})

const shareTitle = computed(() => {
    const s = share.value
    if (!s) return ''
    if (s.music) return s.music.name
    if (s.album) return s.album.name
    if (s.artist) return s.artist.name
    return ''
})

const shareSubtitle = computed(() => {
    const s = share.value
    if (!s) return ''
    if (s.music) return s.music.album?.name ?? ''
    if (s.album) return s.album.artists?.map((a) => a.name).join(', ') ?? ''
    if (s.artist) return s.artist.country ?? ''
    return ''
})

const shareCover = computed((): string | null => {
    const s = share.value
    if (!s) return null
    if (s.music) return s.music.album?.image_url ?? null
    if (s.album) return s.album.image_url ?? null
    if (s.artist) return s.artist.image_url ?? null
    return null
})

const shareImageType = computed((): 'album' | 'music' | 'artist' => {
    const s = share.value
    if (!s) return 'album'
    if (s.artist) return 'artist'
    if (s.music) return 'music'
    return 'album'
})

const shareRoute = computed(() => {
    const s = share.value
    if (!s) return null
    if (s.music?.album?.id)
        return { name: 'album-detail', params: { id: s.music.album.id } }
    if (s.album) return { name: 'album-detail', params: { id: s.album.id } }
    if (s.artist) return { name: 'artist-detail', params: { id: s.artist.id } }
    return null
})

const shareInitial = computed(() => {
    const s = share.value
    if (s?.artist) return (s.artist.name?.[0] ?? '?').toUpperCase()
    return ''
})

const shareTypeName = computed(() => {
    const s = share.value
    if (!s) return ''
    if (s.music) return 'Música'
    if (s.album) return 'Álbum'
    if (s.artist) return 'Artista'
    return ''
})

const spotifyUrl = computed(() => {
    const s = share.value
    if (!s) return null
    if (s.music?.album?.spotify_url) return s.music.album.spotify_url
    if (s.album?.spotify_url) return s.album.spotify_url
    return null
})

onMounted(async () => {
    try {
        loading.value = true
        const id = route.params.id as string
        fullShare.value = await getMusicShareById(id)
        localCommentCount.value = fullShare.value.commentCount
    } catch (e) {
        error.value = e instanceof Error ? e.message : 'Erro ao carregar compartilhamento'
    } finally {
        loading.value = false
    }
})

async function toggleLike() {
    if (!fullShare.value || liking.value) return
    liking.value = true
    try {
        const id = fullShare.value.musicShare.id
        if (fullShare.value.likedByCurrentUser) {
            await unlikeMusicShare(id)
            fullShare.value.likedByCurrentUser = false
            fullShare.value.likeCount--
        } else {
            await likeMusicShare(id)
            fullShare.value.likedByCurrentUser = true
            fullShare.value.likeCount++
        }
    } catch {
        // silently ignore
    } finally {
        liking.value = false
    }
}

function scrollToComments() {
    commentsSection.value?.scrollIntoView({ behavior: 'smooth' })
}

function navigateToItem() {
    if (shareRoute.value) {
        router.push(shareRoute.value)
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
    <h3 class="text-lg font-semibold text-white">Erro ao carregar compartilhamento</h3>
    <p class="text-muted text-sm">{{ error }}</p>
    <button @click="router.back()" class="btn-primary text-sm px-5 py-2">
      Voltar
    </button>
  </div>

  <div v-else-if="fullShare" class="min-h-full pb-20">
    <!-- Hero Header using shared cover as blurred background -->
    <div class="relative">
      <div
        v-if="shareCover"
        class="absolute inset-0 bg-cover bg-center blur-3xl opacity-20 scale-110"
        :style="{ backgroundImage: `url(${shareCover})` }"
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
            <router-link :to="{ name: 'user-profile', params: { id: share!.user.id } }" class="flex items-center gap-2 group cursor-pointer">
                <div class="w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0">
                  <AppImage
                      :src="share!.user.imageUrl"
                      :alt="share!.user.username"
                      :initial="(share!.user.username[0] ?? '?').toUpperCase()"
                      type="artist"
                      rounded="full"
                  />
                </div>
                <div class="leading-tight">
                  <div class="flex items-center gap-1">
                    <span class="text-white text-xs font-semibold group-hover:text-primary transition-colors">
                      {{ share!.user.username }}
                    </span>
                  </div>
                  <p class="text-[9px] text-muted leading-none mt-0.5">
                    compartilhou um(a) {{ shareTypeName.toLowerCase() }} · {{ formattedDate }}
                  </p>
                </div>
            </router-link>
        </div>

        <!-- Shared Item Showcase Card -->
        <div 
          class="flex flex-col md:flex-row gap-6 p-6 items-center md:items-start bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-2)] border border-[var(--color-border)] rounded-3xl shadow-2xl relative overflow-hidden group cursor-pointer transition-all hover:border-primary/30"
          @click="navigateToItem"
        >
          <!-- Absolute background glow -->
          <div class="absolute -right-16 -top-16 w-36 h-36 bg-primary/15 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/25 transition-all duration-500" />
          
          <!-- Shared Cover Art -->
          <div class="w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 flex-shrink-0 shadow-2xl relative rounded-2xl overflow-hidden transition-transform group-hover:scale-[1.02] duration-300 mx-auto md:mx-0">
              <AppImage
                  :src="shareCover"
                  :alt="shareTitle"
                  :type="shareImageType"
                  :initial="shareInitial"
                  rounded="2xl"
                  class="w-full h-full object-cover"
              />
          </div>

          <!-- Shared details -->
          <div class="flex-grow text-center md:text-left space-y-3 mt-4 md:mt-0 flex flex-col justify-center min-w-0 md:pt-2">
              <div class="flex justify-center md:justify-start">
                <span class="text-[10px] font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/25 px-2.5 py-1 rounded-full">
                  {{ shareTypeName }}
                </span>
              </div>
              
              <h1 class="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight group-hover:text-primary transition-colors truncate">
                  {{ shareTitle }}
              </h1>
              
              <div class="space-y-1">
                <p v-if="shareSubtitle" class="text-base text-[var(--color-text)] font-semibold leading-relaxed truncate">
                    {{ shareSubtitle }}
                </p>
                <p v-if="share?.music?.artists" class="text-sm text-muted truncate">
                    por {{ share.music.artists.map(a => a.name).join(', ') }}
                </p>
              </div>
          </div>
        </div>

        <!-- Share Content / Comment -->
        <div v-if="share!.comment" class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 sm:p-8 shadow-xl">
            <p class="text-[var(--color-text)] leading-relaxed whitespace-pre-wrap text-lg italic">
              "{{ share!.comment }}"
            </p>
        </div>

        <!-- Interaction Bar -->
        <div class="flex flex-wrap items-center gap-2.5 sm:gap-4 py-4 border-t border-[var(--color-border)] mt-8">
            <button
                @click="toggleLike"
                class="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-2xl font-semibold text-sm sm:text-base transition-all"
                :class="fullShare.likedByCurrentUser ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-[var(--color-surface-2)] text-white hover:bg-[var(--color-surface)] border border-[var(--color-border)]'"
                :disabled="liking"
            >
                <Heart class="w-4 h-4 sm:w-5 sm:h-5" :fill="fullShare.likedByCurrentUser ? 'currentColor' : 'none'" :class="liking ? 'animate-pulse' : ''" />
                <span>{{ fullShare.likeCount }} curtidas</span>
            </button>

            <button @click="scrollToComments" class="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-2xl font-semibold text-sm sm:text-base bg-[var(--color-surface-2)] text-white hover:bg-[var(--color-surface)] border border-[var(--color-border)] transition-all">
                <MessageSquare class="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{{ localCommentCount }} comentários</span>
            </button>
            
            <a v-if="spotifyUrl" :href="spotifyUrl" target="_blank" class="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-2xl font-semibold text-sm sm:text-base text-[#1DB954] bg-[#1DB954]/10 hover:bg-[#1DB954]/20 border border-[#1DB954]/20 transition-all sm:ml-auto w-full sm:w-auto mt-2 sm:mt-0">
                <ExternalLink class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Spotify
            </a>
        </div>

        <!-- Comments Section -->
        <div ref="commentsSection" class="mt-8">
            <MusicShareComments
                :share-id="share!.id"
                :initial-count="localCommentCount"
                @count-updated="localCommentCount = $event"
            />
        </div>
    </div>
  </div>
</template>
