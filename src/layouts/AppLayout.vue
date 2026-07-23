<script setup lang="ts">
import { ref } from 'vue'
import { Plus } from 'lucide-vue-next'
import SidebarNav from '../components/layout/SidebarNav.vue'
import BottomNav from '../components/layout/BottomNav.vue'
import QuickPostModal from '../components/QuickPostModal.vue'
import QuickReviewForm from '../components/review/QuickReviewForm.vue'
import MusicShareModal from '../components/share/MusicShareModal.vue'
import type { QuickPostTarget } from '../components/QuickPostModal.vue'
import type { QuickReviewFormTarget } from '../components/review/QuickReviewForm.vue'
import type { ShareTarget } from '../components/share/MusicShareModal.vue'
import { useNetwork } from '../composables/useNetwork'

const { isOnline } = useNetwork()

const showQuickPost = ref(false)

// Quick Review state
const showQuickReview = ref(false)
const quickReviewTarget = ref<QuickReviewFormTarget | null>(null)

// Share state
const showShare = ref(false)
const shareTarget = ref<ShareTarget | null>(null)

function openQuickPost() {
    showQuickPost.value = true
}

function handleQuickReview(target: QuickPostTarget) {
    quickReviewTarget.value = {
        targetType: target.type === 'music' ? 'MUSIC' : 'ALBUM',
        albumId: Number(target.albumId),
        albumTitle: target.albumTitle,
        albumCover: target.coverUrl,
        artistNames: target.artistNames,
        tracks: [],
    }
    if (target.type === 'music') {
        quickReviewTarget.value.musicId = Number(target.id)
        quickReviewTarget.value.musicName = target.title
    }
    showQuickReview.value = true
}

function handleShare(target: QuickPostTarget) {
    shareTarget.value = {
        type: target.type,
        id: target.id,
        title: target.title,
        subtitle: target.subtitle,
        coverUrl: target.coverUrl,
    }
    showShare.value = true
}
</script>

<template>
  <div class="flex h-screen bg-dark overflow-hidden relative">
    <!-- Offline Banner -->
    <Transition name="fade-offline">
      <div 
        v-if="!isOnline" 
        class="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg backdrop-blur-sm flex items-center gap-2"
      >
        <span class="w-2 h-2 rounded-full bg-white animate-pulse"></span>
        Você está offline
      </div>
    </Transition>

    <!-- Sidebar: hidden on mobile, visible on md+ -->
    <SidebarNav class="hidden md:flex" @open-quick-post="openQuickPost" />

    <!-- Main content -->
    <main class="flex-1 overflow-y-auto pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
      <RouterView v-slot="{ Component, route }">
        <Transition name="page" mode="out-in">
          <div :key="route.fullPath" class="w-full min-h-full">
            <component :is="Component" />
          </div>
        </Transition>
      </RouterView>
    </main>

    <!-- Bottom nav: visible on mobile only -->
    <BottomNav class="md:hidden" />

    <!-- Mobile FAB -->
    <button
      @click="openQuickPost"
      class="md:hidden fixed bottom-24 right-5 z-40 w-14 h-14 rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 transition-all active:scale-95 flex items-center justify-center"
    >
      <Plus class="w-7 h-7" />
    </button>

    <!-- Quick Post Modal -->
    <QuickPostModal
      :show="showQuickPost"
      @close="showQuickPost = false"
      @quick-review="handleQuickReview"
      @share="handleShare"
    />

    <!-- Quick Review Form -->
    <QuickReviewForm
      v-if="showQuickReview && quickReviewTarget"
      :target="quickReviewTarget"
      @close="showQuickReview = false; quickReviewTarget = null"
      @saved="showQuickReview = false; quickReviewTarget = null"
    />

    <!-- Share Modal -->
    <MusicShareModal
      v-if="showShare && shareTarget"
      :target="shareTarget"
      @close="showShare = false; shareTarget = null"
      @shared="showShare = false; shareTarget = null"
    />
  </div>
</template>

<style scoped>
.fade-offline-enter-active,
.fade-offline-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-offline-enter-from,
.fade-offline-leave-to {
  opacity: 0;
  transform: translate(-50%, -10px);
}
</style>
