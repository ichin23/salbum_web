<script setup lang="ts">
import { Home, Search, User, ListMusic, Bell } from 'lucide-vue-next'
import { useNotificationsStore } from '../../stores/notifications'

const notificationsStore = useNotificationsStore()

const navItems = [
  { name: 'Início', icon: Home, route: '/' },
  { name: 'Buscar', icon: Search, route: '/search' },
  { name: 'Notificações', icon: Bell, route: '/notifications' },
  { name: 'Lista', icon: ListMusic, route: '/lists' },
  { name: 'Perfil', icon: User, route: '/profile' },
]
</script>

<template>
  <nav class="fixed bottom-0 inset-x-0 z-40 bg-[var(--color-surface)] border-t border-[var(--color-border)] flex items-center justify-around px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
    <RouterLink
      v-for="item in navItems"
      :key="item.route"
      :to="item.route"
      class="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-200 min-w-0"
      :class="[
        $route.path === item.route
          ? 'text-primary'
          : 'text-muted hover:text-white'
      ]"
    >
      <div class="relative flex items-center justify-center">
        <component
          :is="item.icon"
          class="w-5 h-5 transition-transform duration-200"
          :class="$route.path === item.route ? 'scale-110' : ''"
        />
        <div 
          v-if="item.route === '/notifications' && notificationsStore.hasUnread" 
          class="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-[var(--color-surface)]"
        ></div>
      </div>
      <span class="text-[10px] font-medium truncate">{{ item.name }}</span>
    </RouterLink>
  </nav>
</template>
