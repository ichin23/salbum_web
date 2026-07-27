import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createHead } from '@vueuse/head'
import './style.css'
import App from './App.vue'
import router from './router'
import { registerSW } from 'virtual:pwa-register'
import { initFirebase } from './services/firebase'
import { applyConsent, getSavedConsent } from './services/firebase/analytics'
import { trackError } from './services/firebase/analytics'

async function bootstrap() {
  const app = createApp(App)
  const head = createHead()
  const pinia = createPinia()

  app.use(pinia)
  app.use(head)
  app.use(router)

  applyConsent()

  if (getSavedConsent() === 'granted' || !getSavedConsent()) {
    await initFirebase()
  }

  app.config.errorHandler = (err) => {
    const error = err instanceof Error ? err : new Error(String(err))
    trackError(error)
  }

  app.mount('#app')

  registerSW({ immediate: true })
}

bootstrap()
