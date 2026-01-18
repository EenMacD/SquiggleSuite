import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

import './assets/main.css'
import 'shepherd.js/dist/css/shepherd.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')

// Request persistent storage to reduce eviction risk on mobile
// Optional and safe: browsers may ignore if unsupported
// See https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - optional chaining handles unsupported environments
if (navigator.storage?.persist) {
  navigator.storage.persist().catch(() => {
    // ignore
  })
}
