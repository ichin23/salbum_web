import { ref } from 'vue'
import { toPng } from 'html-to-image'

export interface ShareImageState {
  generating: boolean
  blob: Blob | null
  error: string | null
}

export function useShareImage(scale = 2) {
  const state = ref<ShareImageState>({
    generating: false,
    blob: null,
    error: null,
  })

  let hiddenEl: HTMLElement | null = null

  function setElement(el: HTMLElement | null) {
    hiddenEl = el
  }

  async function generate(): Promise<Blob | null> {
    if (!hiddenEl) {
      state.value.error = 'Elemento não encontrado'
      return null
    }

    state.value.generating = true
    state.value.error = null
    state.value.blob = null

    try {
      const dataUrl = await toPng(hiddenEl, {
        pixelRatio: scale,
      })
      const res = await fetch(dataUrl)
      const blob = await res.blob()
      state.value.blob = blob
      return blob
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erro ao gerar imagem'
      state.value.error = message
      return null
    } finally {
      state.value.generating = false
    }
  }

  function reset() {
    state.value = { generating: false, blob: null, error: null }
  }

  return { state, setElement, generate, reset }
}
