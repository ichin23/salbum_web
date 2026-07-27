import { watch } from 'vue'
import { useRouter } from 'vue-router'
import { trackPageView, trackError } from '../services/firebase/analytics'
import { getFirebaseAnalytics } from '../services/firebase'

export function useAnalytics() {
  const router = useRouter()

  watch(
    () => router.currentRoute.value,
    (to) => {
      const analytics = getFirebaseAnalytics()
      if (!analytics) return

      const name = to.name ? String(to.name) : 'unknown'
      const path = to.fullPath || '/'
      trackPageView(name, path)
    },
    { immediate: true },
  )
}

export function useGlobalErrorHandler() {
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      trackError(event.error || new Error(event.message))
    })

    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason))
      trackError(error)
    })
  }
}
