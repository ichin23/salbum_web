<script setup lang="ts">
import { useWebsocketStore } from './stores/websocket'
import { useAnalytics, useGlobalErrorHandler } from './composables/useAnalytics'
import CookieConsentBanner from './components/CookieConsentBanner.vue'

useWebsocketStore()
useAnalytics()
useGlobalErrorHandler()
</script>

<template>
  <RouterView />
  <CookieConsentBanner />
</template>
