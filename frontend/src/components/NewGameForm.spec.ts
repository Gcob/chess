import {describe, it, expect, beforeEach} from 'vitest'
import {mount} from '@vue/test-utils'
import {createPinia, setActivePinia} from 'pinia'
import {createI18n} from 'vue-i18n'
import NewGameForm from './NewGameForm.vue'
import NewGameLocalForm from '@/components/parts/NewGameLocalForm.vue'
import coreUI from '@/components/core-ui/core-ui'
import {useNewGameStore} from '@/stores/useNewGameStore'

// Keys render as themselves — the spec asserts behaviour, never copy.
const i18n = createI18n({legacy: false, locale: 'en', missingWarn: false, fallbackWarn: false, messages: {en: {}}})

function mountForm() {
  return mount(NewGameForm, {
    global: {
      // coreUI registers cButton, resolved globally in the app
      plugins: [i18n, coreUI],
      directives: {tippy: {}},
      // the cancel cButton renders a router-link — no router in the spec
      stubs: {'router-link': true},
    },
  })
}

// The start cButton is the only <button> in the actions row (cancel is a router-link).
function clickStart(wrapper: ReturnType<typeof mountForm>): Promise<void> {
  return wrapper.find('.new-game-form__actions button').trigger('click')
}

describe('NewGameForm', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('renders the strategy form of the selected mode', () => {
    const wrapper = mountForm()
    expect(wrapper.findComponent(NewGameLocalForm).exists()).toBe(true)
  })

  it('emits start only when the mode form validates', async () => {
    const wrapper = mountForm()
    const {settings} = useNewGameStore()

    settings.playerWhiteName = ''
    await clickStart(wrapper)
    expect(wrapper.emitted('start')).toBeUndefined()

    settings.playerWhiteName = 'Alice'
    await clickStart(wrapper)
    expect(wrapper.emitted('start')).toHaveLength(1)
  })
})
