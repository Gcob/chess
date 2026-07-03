import { createApp } from 'vue'
import { createPinia } from 'pinia'
import VueTippy from 'vue-tippy'
import 'tippy.js/dist/tippy.css'
import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'
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
app.use(VueTippy, {
  defaultProps: {
    delay: 0,
    arrow: true,
  },
})

app.mount('#app')
