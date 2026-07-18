import {describe, it, expect, beforeEach} from 'vitest'
import {mount} from '@vue/test-utils'
import {createPinia, setActivePinia} from 'pinia'
import {createI18n} from 'vue-i18n'
import NewGameLocalForm from './NewGameLocalForm.vue'
import {useNewGameStore} from '@/stores/useNewGameStore'
import {useSettingsStore} from '@/stores/useSettingsStore'
import {stubMatchMedia} from '@/test/mediaQuery'

// Keys render as themselves — the spec asserts behaviour, never copy.
const i18n = createI18n({legacy: false, locale: 'en', missingWarn: false, fallbackWarn: false, messages: {en: {}}})

function mountForm() {
  const store = useNewGameStore()
  const wrapper = mount(NewGameLocalForm, {
    props: {settings: store.settings},
    global: {plugins: [i18n], directives: {tippy: {}}},
  })
  return {wrapper, settings: store.settings}
}

describe('NewGameLocalForm', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    stubMatchMedia(false)
  })

  it('renders the players and timer sections', () => {
    const {wrapper} = mountForm()
    expect(wrapper.find('.players-section').exists()).toBe(true)
    expect(wrapper.find('.timer-section').exists()).toBe(true)
  })

  it('exposes validate(), delegated to the players section', () => {
    const {wrapper, settings} = mountForm()
    expect(wrapper.vm.validate()).toBe(true)
    settings.playerWhiteName = ''
    expect(wrapper.vm.validate()).toBe(false)
  })

  it('hides the board auto-flip toggle on desktop', () => {
    const {wrapper} = mountForm()
    expect(wrapper.find('.board-section').exists()).toBe(false)
  })

  it('offers the auto-flip toggle on mobile, bound to the viewer setting', async () => {
    stubMatchMedia(true)
    const {wrapper} = mountForm()
    const toggle = wrapper.find('.board-section input[type="checkbox"]')
    expect((toggle.element as HTMLInputElement).checked).toBe(true)
    await toggle.setValue(false)
    expect(useSettingsStore().settings.autoFlipPieces).toBe(false)
  })
})
