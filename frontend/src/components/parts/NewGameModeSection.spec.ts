import {describe, it, expect, beforeEach} from 'vitest'
import {mount} from '@vue/test-utils'
import {createPinia, setActivePinia} from 'pinia'
import {createI18n} from 'vue-i18n'
import NewGameModeSection from './NewGameModeSection.vue'
import {useNewGameStore} from '@/stores/useNewGameStore'
import {useSettingsStore} from '@/stores/useSettingsStore'

// Keys render as themselves — the spec asserts behaviour, never copy.
const i18n = createI18n({legacy: false, locale: 'en', missingWarn: false, fallbackWarn: false, messages: {en: {}}})

function mountSection() {
  const store = useNewGameStore()
  const wrapper = mount(NewGameModeSection, {
    props: {settings: store.settings},
    global: {plugins: [i18n]},
  })
  return {wrapper, settings: store.settings}
}

describe('NewGameModeSection', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('offers only the playable modes — no impossible choice', () => {
    const {wrapper} = mountSection()
    const cards = wrapper.findAll('.mode-section__card')
    expect(cards).toHaveLength(1)
    expect(cards[0]!.text()).toContain('newGame.mode.local')
  })

  it('marks the selected mode and describes it', () => {
    const {wrapper} = mountSection()
    expect(wrapper.find('.is-selected').text()).toContain('newGame.mode.local')
    expect(wrapper.find('.mode-section__selected-desc').text()).toContain('newGame.mode.localDesc')
  })

  it('offers the dev mode only when the devMode setting is on', () => {
    useSettingsStore().settings.devMode = true
    const {wrapper} = mountSection()
    const cards = wrapper.findAll('.mode-section__card')
    expect(cards).toHaveLength(2)
    expect(cards[1]!.text()).toContain('newGame.mode.dev')
  })

  it('drops a persisted dev selection once the setting is off', () => {
    const store = useNewGameStore()
    store.settings.mode = 'dev'
    const {settings} = mountSection()
    expect(settings.mode).toBe('local')
  })
})
