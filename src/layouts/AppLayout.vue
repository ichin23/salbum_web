<script setup lang="ts">
import SidebarNav from '../components/layout/SidebarNav.vue'
import BottomNav from '../components/layout/BottomNav.vue'
</script>

<template>
  <div class="flex h-screen bg-dark overflow-hidden">
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
