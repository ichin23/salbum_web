<script setup lang="ts">
import { useWebsocketStore } from './stores/websocket'

// Initialize websocket store which will automatically connect/disconnect based on auth state
useWebsocketStore()
</script>

<template>
  <RouterView />
</template>
