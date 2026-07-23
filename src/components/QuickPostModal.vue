<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { X, Search, Loader2, Music, Zap, PencilLine, Share2 } from 'lucide-vue-next'
import { fetchSearch } from '../services/fetchService'
import AppImage from './AppImage.vue'
import type { FetchAlbum, FetchMusicResult } from '../types'

export type QuickPostTarget = {
    type: 'album' | 'music'
    id: string
    title: string
    subtitle: string
    coverUrl: string | null
    albumId: string
    albumTitle: string
    artistNames: string
}

type SearchResult = FetchAlbum | FetchMusicResult

const props = defineProps<{
    show: boolean
}>()

const emit = defineEmits<{
    close: []
    quickReview: [target: QuickPostTarget]
    share: [target: QuickPostTarget]
}>()

const router = useRouter()

const query = ref('')
const results = ref<SearchResult[]>([])
const loading = ref(false)
const selected = ref<SearchResult | null>(null)
const step = ref<'search' | 'choose'>('search')

watch(query, (val) => {
    if (val.length < 2) {
        results.value = []
        return
    }
    loading.value = true
    fetchSearch({ q: val, limit: 8 })
        .then((res) => {
            results.value = (res.data as SearchResult[]).filter(
                (r) => 'image_url' in r || 'album' in r,
            )
        })
        .catch(() => {})
        .finally(() => { loading.value = false })
})

function selectItem(item: SearchResult) {
    selected.value = item
    step.value = 'choose'
}

function goBack() {
    step.value = 'search'
    selected.value = null
}

function isAlbum(item: SearchResult): item is FetchAlbum {
    return 'image_url' in item && !('album' in item)
}

function isMusic(item: SearchResult): item is FetchMusicResult {
    return 'album' in item
}

function getCover(item: SearchResult): string | null {
    if (isAlbum(item)) return item.image_url
    if (isMusic(item)) return item.album?.image_url ?? null
    return null
}

function getTitle(item: SearchResult): string {
    if (isAlbum(item)) return item.name
    if (isMusic(item)) return item.name
    return ''
}

function getSubtitle(item: SearchResult): string {
    if (isAlbum(item)) return item.artists?.map(a => a.name).join(', ') ?? ''
    if (isMusic(item)) return item.artists?.map(a => a.name).join(', ') ?? ''
    return ''
}

function getAlbumId(item: SearchResult): string {
    if (isAlbum(item)) return item.id
    if (isMusic(item)) return item.album?.id ?? item.id
    return ''
}

function getAlbumTitle(item: SearchResult): string {
    if (isAlbum(item)) return item.name
    if (isMusic(item)) return item.album?.name ?? ''
    return ''
}

function buildTarget(item: SearchResult): QuickPostTarget {
    return {
        type: isMusic(item) ? 'music' : 'album',
        id: item.id,
        title: getTitle(item),
        subtitle: getSubtitle(item),
        coverUrl: getCover(item),
        albumId: getAlbumId(item),
        albumTitle: getAlbumTitle(item),
        artistNames: getSubtitle(item),
    }
}

function handleQuickReview() {
    if (!selected.value) return
    emit('quickReview', buildTarget(selected.value))
    reset()
}

function handleReview() {
    if (!selected.value) return
    const id = getAlbumId(selected.value)
    reset()
    router.push({ name: 'write-review', params: { id } })
}

function handleShare() {
    if (!selected.value) return
    emit('share', buildTarget(selected.value))
    reset()
}

function reset() {
    query.value = ''
    results.value = []
    selected.value = null
    step.value = 'search'
    emit('close')
}

function close() {
    reset()
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
        v-if="show"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex sm:items-center sm:justify-center"
        @click.self="close"
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
            v-if="show"
            class="
              bg-[var(--color-surface)] border-t sm:border border-[var(--color-border)]
              sm:rounded-3xl w-full sm:max-w-lg max-h-[85vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl
              absolute bottom-0 left-0 right-0 sm:relative sm:mx-4
              rounded-t-3xl
            "
          >
            <!-- Header -->
            <div class="sticky top-0 bg-[var(--color-surface)] z-10">
              <div class="flex items-center justify-center w-full py-2 sm:hidden">
                <div class="w-10 h-1 bg-[var(--color-border)] rounded-full" />
              </div>
              <div class="flex items-center justify-between px-6 pb-4 sm:pt-6">
                <div class="flex items-center gap-2">
                  <template v-if="step === 'choose'">
                    <button
                      @click="goBack"
                      class="w-8 h-8 flex items-center justify-center rounded-xl text-muted hover:text-white hover:bg-[var(--color-surface-2)] transition-all"
                    >
                      <X class="w-4 h-4 rotate-45" />
                    </button>
                  </template>
                  <h2 class="text-sm sm:text-lg font-bold text-white">
                    {{ step === 'search' ? 'Novo Post' : 'Tipo de Post' }}
                  </h2>
                </div>
                <button
                  @click="close"
                  class="w-8 h-8 flex items-center justify-center rounded-xl text-muted hover:text-white hover:bg-[var(--color-surface-2)] transition-all"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Step 1: Search -->
            <div v-if="step === 'search'" class="px-6 pb-6 space-y-4">
              <div class="relative">
                <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  v-model="query"
                  type="text"
                  placeholder="Buscar álbuns ou músicas..."
                  class="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl pl-10 pr-4 py-3 text-sm text-[var(--color-text)] placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
                  autofocus
                />
              </div>

              <div v-if="loading" class="flex justify-center py-8">
                <Loader2 class="w-6 h-6 text-primary animate-spin" />
              </div>

              <div v-else-if="results.length === 0 && query.length >= 2" class="text-center py-8 text-muted text-sm">
                Nenhum resultado encontrado
              </div>

              <div v-else class="space-y-1">
                <button
                  v-for="item in results"
                  :key="item.id"
                  @click="selectItem(item)"
                  class="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-[var(--color-surface-2)] transition-colors text-left"
                >
                  <div class="w-10 h-10 flex-shrink-0">
                    <AppImage
                      :src="getCover(item)"
                      :alt="getTitle(item)"
                      :type="isAlbum(item) ? 'album' : 'music'"
                      :initial="getTitle(item).charAt(0).toUpperCase()"
                      rounded="lg"
                      class="w-full h-full"
                    />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-white truncate">{{ getTitle(item) }}</p>
                    <p class="text-xs text-muted truncate">{{ getSubtitle(item) }}</p>
                  </div>
                  <Music v-if="isMusic(item)" class="w-3.5 h-3.5 text-muted flex-shrink-0" />
                </button>
              </div>
            </div>

            <!-- Step 2: Choose post type -->
            <div v-if="step === 'choose' && selected" class="px-6 pb-6 space-y-4">
              <!-- Selected item preview -->
              <div class="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-2)]">
                <div class="w-12 h-12 flex-shrink-0">
                  <AppImage
                    :src="getCover(selected)"
                    :alt="getTitle(selected)"
                    :type="isAlbum(selected) ? 'album' : 'music'"
                    :initial="getTitle(selected).charAt(0).toUpperCase()"
                    rounded="lg"
                    class="w-full h-full"
                  />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-white truncate">{{ getTitle(selected) }}</p>
                  <p class="text-xs text-muted truncate">{{ getSubtitle(selected) }}</p>
                </div>
              </div>

              <div class="space-y-2">
                <button
                  @click="handleQuickReview"
                  class="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl bg-[var(--color-surface-2)] hover:bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-yellow-500/30 transition-all text-left group"
                >
                  <div class="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-yellow-500/20 transition-colors">
                    <Zap class="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-white">Avaliação rápida</p>
                    <p class="text-xs text-muted">Nota, sentimento, foto</p>
                  </div>
                </button>

                <button
                  v-if="isAlbum(selected)"
                  @click="handleReview"
                  class="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl bg-[var(--color-surface-2)] hover:bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-primary/30 transition-all text-left group"
                >
                  <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <PencilLine class="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-white">Review completa</p>
                    <p class="text-xs text-muted">Música a música, sentimentos</p>
                  </div>
                </button>

                <button
                  @click="handleShare"
                  class="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl bg-[var(--color-surface-2)] hover:bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-secondary/30 transition-all text-left group"
                >
                  <div class="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-secondary/20 transition-colors">
                    <Share2 class="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-white">Compartilhar</p>
                    <p class="text-xs text-muted">Comente e compartilhe</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
