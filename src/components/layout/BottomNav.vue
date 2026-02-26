<script setup lang="ts">
import { Home, Search, User, ListMusic } from 'lucide-vue-next'

const navItems = [
  { name: 'Início', icon: Home, route: '/' },
  { name: 'Buscar', icon: Search, route: '/search' },
  { name: 'Lista', icon: ListMusic, route: '/lists' },
  { name: 'Perfil', icon: User, route: '/profile' },
]
</script>

<template>
  <nav class="fixed bottom-0 inset-x-0 z-40 bg-[var(--color-surface)] border-t border-[var(--color-border)] flex items-center justify-around px-2 py-2 safe-area-bottom">
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
      <component
        :is="item.icon"
        class="w-5 h-5 transition-transform duration-200"
        :class="$route.path === item.route ? 'scale-110' : ''"
      />
      <span class="text-[10px] font-medium truncate">{{ item.name }}</span>
    </RouterLink>
  </nav>
</template>
