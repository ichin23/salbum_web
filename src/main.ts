import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createHead } from '@vueuse/head'
import './style.css'
import App from './App.vue'
import router from './router'
import { registerSW } from 'virtual:pwa-register'

const app = createApp(App)
const head = createHead()
app.use(createPinia())
app.use(head)
app.use(router)
app.mount('#app')

registerSW({ immediate: true })
