import cAccordion from '@/components/core-ui/cAccordion.vue'
import cButton from '@/components/core-ui/cButton.vue'
import cModal from '@/components/core-ui/cModal.vue'

export default function coreUI(app: any) {
  app.component('cAccordion', cAccordion)
  app.component('cButton', cButton)
  app.component('cModal', cModal)
}
