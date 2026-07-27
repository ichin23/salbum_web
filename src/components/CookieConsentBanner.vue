<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Cookie } from 'lucide-vue-next'
import { setConsent } from 'firebase/analytics'
import { getFirebaseAnalytics } from '../services/firebase'
import { saveConsent, getSavedConsent } from '../services/firebase/analytics'

const visible = ref(false)

onMounted(() => {
  if (!getSavedConsent()) {
    visible.value = true
  }
})

function accept() {
  saveConsent('granted')
  const analytics = getFirebaseAnalytics()
  if (analytics) {
    setConsent({ analytics_storage: 'granted' })
  }
  visible.value = false
}

function refuse() {
  saveConsent('denied')
  const analytics = getFirebaseAnalytics()
  if (analytics) {
    setConsent({ analytics_storage: 'denied' })
  }
  visible.value = false
}
</script>

<template>
  <Transition name="fade">
    <div
      v-if="visible"
      class="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6"
    >
      <div
        class="mx-auto max-w-2xl bg-surface border border-border rounded-3xl p-5 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4"
      >
        <div
          class="hidden sm:flex w-10 h-10 rounded-full bg-primary/10 items-center justify-center flex-shrink-0"
        >
          <Cookie class="w-5 h-5 text-primary" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm text-text font-medium">
            Este site usa cookies do Google Analytics para entender como você usa o app e melhorar sua experiência.
          </p>
          <p class="text-xs text-muted mt-1">
            Você pode aceitar ou recusar. Sua escolha será lembrada.
          </p>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
          <button
            @click="refuse"
            class="btn-ghost text-sm px-4 py-2"
          >
            Recusar
          </button>
          <button
            @click="accept"
            class="bg-primary hover:bg-primary-hover text-white text-sm font-semibold px-5 py-2 rounded-2xl transition-all duration-200 active:scale-95"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
