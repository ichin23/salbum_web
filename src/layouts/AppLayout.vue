<script setup lang="ts">
import SidebarNav from '../components/layout/SidebarNav.vue'
import BottomNav from '../components/layout/BottomNav.vue'
import { useNetwork } from '../composables/useNetwork'

const { isOnline } = useNetwork()
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
    <SidebarNav class="hidden md:flex" />

    <!-- Main content -->
    <main class="flex-1 overflow-y-auto pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>

    <!-- Bottom nav: visible on mobile only -->
    <BottomNav class="md:hidden" />
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
