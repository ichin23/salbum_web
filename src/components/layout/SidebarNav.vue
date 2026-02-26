<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { Home, Search, User, ListMusic, LogOut } from "lucide-vue-next";
import { useAuthStore } from "../../stores/auth";

const router = useRouter();
const auth = useAuthStore();
const searchQuery = ref("");

function handleSearch() {
  if (searchQuery.value.trim()) {
    router.push({ name: "search", query: { q: searchQuery.value } });
  }
}

function handleLogout() {
  auth.logout();
  router.replace({ name: "login" });
}

const navItems = [
  { name: "Início", icon: Home, route: "/" },
  { name: "Buscar", icon: Search, route: "/search" },
  { name: "Perfil", icon: User, route: "/profile" },
  { name: "Listen List", icon: ListMusic, route: "/lists" },
];
</script>

<template>
  <aside
    class="h-full bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col flex-shrink-0 w-16 lg:w-64 transition-all duration-300"
  >
    <!-- Logo -->
    <div
      class="p-4 lg:p-6 lg:pb-4 flex items-center justify-center lg:justify-start"
    >
      <RouterLink to="/" class="flex items-center gap-3">
        <img
          src="../../assets/salbum_logo.svg"
          alt="Salbum"
          class="w-7 h-auto flex-shrink-0"
        />
        <span
          class="hidden lg:block text-2xl text-white"
          style="font-family: var(--font-display); letter-spacing: 0.05em"
          >Salbum</span
        >
      </RouterLink>
    </div>

    <!-- Search (lg+ only) -->
    <div class="hidden lg:block px-4 pb-4">
      <form @submit.prevent="handleSearch" class="relative">
        <Search
          class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted"
        />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar álbuns, artistas..."
          class="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-muted)] rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
        />
      </form>
    </div>

    <!-- Search icon on md (icon-only) -->
    <div class="lg:hidden px-2 pb-3">
      <button
        @click="router.push('/search')"
        class="w-full flex items-center justify-center p-2.5 rounded-xl text-muted hover:text-white hover:bg-[var(--color-surface-2)] transition-all"
        title="Buscar"
      >
        <Search class="w-5 h-5" />
      </button>
    </div>

    <!-- Nav -->
    <nav class="flex-1 px-2 lg:px-3 space-y-1">
      <RouterLink
        v-for="item in navItems"
        :key="item.route"
        :to="item.route"
        class="flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group"
        :class="[
          $route.path === item.route
            ? 'bg-primary/10 text-primary'
            : 'text-muted hover:text-white hover:bg-[var(--color-surface-2)]',
        ]"
        :title="item.name"
      >
        <component
          :is="item.icon"
          class="w-5 h-5 flex-shrink-0 transition-colors"
          :class="
            $route.path === item.route
              ? 'text-primary'
              : 'text-muted group-hover:text-white'
          "
        />
        <span class="hidden lg:block">{{ item.name }}</span>
      </RouterLink>
    </nav>

    <!-- Footer -->
    <div class="p-2 lg:p-4 border-t border-[var(--color-border)]">
      <button
        @click="handleLogout"
        class="w-full flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-3 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-white hover:bg-[var(--color-surface-2)] transition-all duration-200 group"
        title="Sair"
      >
        <LogOut class="w-5 h-5 group-hover:text-white transition-colors" />
        <span class="hidden lg:block">Sair</span>
      </button>
    </div>
  </aside>
</template>
