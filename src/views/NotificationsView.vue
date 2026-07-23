<script setup lang="ts">
import { useNotificationsStore } from '../stores/notifications'
import { Bell, Loader2 } from 'lucide-vue-next'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const notificationsStore = useNotificationsStore()
const router = useRouter()

onMounted(async () => {
  if (notificationsStore.notifications.length === 0) {
    await notificationsStore.fetchNotifications(0)
  }
  if (notificationsStore.hasUnread) {
    notificationsStore.markAllAsRead()
  }
})

function loadMore() {
  if (!notificationsStore.isLoading && notificationsStore.hasMore) {
    notificationsStore.fetchNotifications(notificationsStore.currentPage + 1)
  }
}

function handleNotificationClick(notification: any, index: number) {
  if (!notification.read) {
    notificationsStore.markAsRead(index)
  }
  if (notification.link) {
    // Se o link for uma URL absoluta
    if (notification.link.startsWith('http')) {
      window.open(notification.link, '_blank')
    } else {
      // Se for uma rota interna
      router.push(notification.link)
    }
  }
}
</script>

<template>
  <div class="h-full flex flex-col p-4 lg:p-8 max-w-4xl mx-auto w-full">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Bell class="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-white">Notificações</h1>
          <p class="text-muted text-sm mt-1">Fique por dentro do que acontece.</p>
        </div>
      </div>
    </div>

    <div v-if="notificationsStore.isLoading && notificationsStore.notifications.length === 0" class="flex-1 flex items-center justify-center">
      <Loader2 class="w-8 h-8 animate-spin text-primary" />
    </div>

    <div v-else-if="notificationsStore.notifications.length === 0" class="flex-1 flex flex-col items-center justify-center text-center mt-12">
      <div class="w-24 h-24 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center mb-4">
        <Bell class="w-10 h-10 text-muted/50" />
      </div>
      <h3 class="text-xl font-bold text-white mb-2">Nenhuma notificação</h3>
      <p class="text-muted max-w-sm">Você ainda não tem novas notificações. Quando algo acontecer, aparecerá aqui.</p>
    </div>

    <div v-else class="space-y-4">
      <div 
        v-for="(notification, index) in notificationsStore.notifications" 
        :key="notification.id || index"
        @click="handleNotificationClick(notification, index)"
        class="p-4 rounded-2xl bg-[var(--color-surface)] border transition-all flex gap-4"
        :class="[
          notification.read 
            ? 'border-[var(--color-border)] opacity-70' 
            : 'border-primary/50 bg-primary/5 cursor-pointer hover:bg-primary/10'
        ]"
      >
        <img 
          v-if="notification.sender?.imageUrl" 
          :src="notification.sender.imageUrl" 
          alt="Avatar" 
          class="w-12 h-12 rounded-full object-cover bg-[var(--color-surface-2)]"
        />
        <div v-else class="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
          {{ notification.sender?.username?.[0]?.toUpperCase() || 'S' }}
        </div>
        
        <div class="flex-1">
          <div class="flex items-start justify-between gap-2">
            <h4 class="text-white font-medium mb-1" :class="{ 'font-bold': !notification.read }">{{ notification.title }}</h4>
            <div v-if="!notification.read" class="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0"></div>
          </div>
          <p class="text-muted text-sm">{{ notification.body }}</p>
          <div v-if="notification.createdAt" class="text-xs text-muted/60 mt-2">
            {{ new Date(notification.createdAt).toLocaleString() }}
          </div>
        </div>
      </div>

      <div v-if="notificationsStore.hasMore" class="pt-4 flex justify-center">
        <button 
          @click="loadMore" 
          :disabled="notificationsStore.isLoading"
          class="px-4 py-2 rounded-xl text-sm font-medium bg-[var(--color-surface-2)] text-white hover:bg-[var(--color-border)] transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <Loader2 v-if="notificationsStore.isLoading" class="w-4 h-4 animate-spin" />
          {{ notificationsStore.isLoading ? 'Carregando...' : 'Ver mais antigas' }}
        </button>
      </div>
    </div>
  </div>
</template>
