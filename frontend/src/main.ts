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
    // Touch trigger shows the tooltip AND fires the underlying click at once, so on action
    // buttons (all our tippy usages) it can outlive the click's effect — e.g. a leftover
    // tooltip floating over a modal the click just opened. Tooltips are a hover affordance
    // anyway; touch devices have no hover, so just skip them there.
    touch: false,
  },
})

app.mount('#app')
