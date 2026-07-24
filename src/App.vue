<script setup lang="ts">
import TestImage from './components/TestImage.vue';
import { useWebsocketStore } from './stores/websocket'

// Initialize websocket store which will automatically connect/disconnect based on auth state
useWebsocketStore()
</script>

<template>
  <TestImage />
</template>
