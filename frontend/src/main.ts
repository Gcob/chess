import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@/assets/styles/main.scss'
import coreUI from "@/components/core-ui/core-ui.ts";

import App from './App.vue'
import router from './router'
import i18n from './assets/i18n'

const app = createApp(App)
coreUI(app);

app.use(createPinia())
app.use(router)
app.use(i18n)

app.mount('#app')
