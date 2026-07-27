<script setup lang="ts">
import { ref } from 'vue'
import { X, Link2, Image as ImageIcon, Check } from 'lucide-vue-next'

const props = defineProps<{ show: boolean; url?: string }>()
const emit = defineEmits<{ close: []; openImage: [] }>()

const copied = ref(false)

async function copyLink() {
  try {
    await navigator.clipboard.writeText(props.url ?? window.location.href)
    copied.value = true
    setTimeout(() => {
      copied.value = false
      emit('close')
    }, 1500)
  } catch {
    // ignore
  }
}

function openImage() {
  emit('close')
  emit('openImage')
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="show"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:items-start sm:justify-center sm:pt-[20vh]"
        @click.self="emit('close')"
      >
        <Transition
          enter-active-class="transition-all duration-300 ease-out sm:duration-200"
          enter-from-class="translate-y-full sm:translate-y-0 sm:opacity-0 sm:scale-95"
          enter-to-class="translate-y-0 sm:opacity-100 sm:scale-100"
          leave-active-class="transition-all duration-200 ease-in sm:duration-150"
          leave-from-class="translate-y-0 sm:opacity-100 sm:scale-100"
          leave-to-class="translate-y-full sm:translate-y-0 sm:opacity-0 sm:scale-95"
          appear
        >
          <div
            v-if="show"
            class="absolute bottom-0 left-0 right-0 sm:relative sm:w-full sm:max-w-sm bg-[var(--color-surface)] border-t border-[var(--color-border)] sm:border sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden"
          >
            <!-- Handle (mobile only) -->
            <div class="relative flex items-center justify-center px-6 pt-4 pb-2 sm:hidden">
              <div class="w-10 h-1 bg-[var(--color-border)] rounded-full" />
            </div>

            <!-- Header (desktop only) -->
            <div class="hidden sm:flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
              <h3 class="text-sm font-bold text-white">Compartilhar</h3>
              <button
                @click="emit('close')"
                class="p-1.5 rounded-lg text-muted hover:text-white hover:bg-[var(--color-surface-2)] transition-colors"
              >
                <X class="w-4 h-4" />
              </button>
            </div>

            <div class="px-4 pb-8 sm:pb-4 pt-2 sm:pt-3 space-y-1">
              <p class="text-sm font-semibold text-white mb-2 sm:hidden">Compartilhar</p>
              <button
                @click="copyLink"
                class="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-medium text-white hover:bg-[var(--color-surface-2)] transition-colors"
              >
                <component
                  :is="copied ? Check : Link2"
                  class="w-5 h-5"
                  :class="copied ? 'text-green-400' : ''"
                />
                {{ copied ? 'Link copiado!' : 'Copiar link' }}
              </button>
              <button
                @click="openImage"
                class="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-medium text-white hover:bg-[var(--color-surface-2)] transition-colors"
              >
                <ImageIcon class="w-5 h-5" />
                Compartilhar como imagem
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
