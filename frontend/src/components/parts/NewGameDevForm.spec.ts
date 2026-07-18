import {describe, it, expect, beforeEach} from 'vitest'
import {mount} from '@vue/test-utils'
import {createPinia, setActivePinia} from 'pinia'
import {createI18n} from 'vue-i18n'
import NewGameDevForm from './NewGameDevForm.vue'
import {useNewGameStore} from '@/stores/useNewGameStore'
import {DEV_SCENARIOS} from '@/dev/scenarios'
import {stubMatchMedia} from '@/test/mediaQuery'

// Keys render as themselves — the spec asserts behaviour, never copy.
const i18n = createI18n({legacy: false, locale: 'en', missingWarn: false, fallbackWarn: false, messages: {en: {}}})

function mountForm() {
  const store = useNewGameStore()
  const wrapper = mount(NewGameDevForm, {
    props: {settings: store.settings},
    global: {plugins: [i18n], directives: {tippy: {}}},
  })
  return {wrapper, settings: store.settings}
}

describe('NewGameDevForm', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    stubMatchMedia(false)
  })

  it('offers every scenario and defaults to the first one', () => {
    const {wrapper, settings} = mountForm()
    expect(settings.scenarioId).toBe(DEV_SCENARIOS[0]!.id)
    expect(wrapper.findAll('.scenario-section option')).toHaveLength(DEV_SCENARIOS.length)
    expect(wrapper.find('.scenario-section__desc').text()).toBe(DEV_SCENARIOS[0]!.description)
  })

  it('drops a persisted scenario id that no longer exists', () => {
    useNewGameStore().settings.scenarioId = 'removed-scenario'
    const {settings} = mountForm()
    expect(settings.scenarioId).toBe(DEV_SCENARIOS[0]!.id)
  })

  it('keeps the local sections and their validation', () => {
    const {wrapper, settings} = mountForm()
    expect(wrapper.find('.players-section').exists()).toBe(true)
    expect(wrapper.find('.timer-section').exists()).toBe(true)
    expect(wrapper.vm.validate()).toBe(true)
    settings.playerWhiteName = ''
    expect(wrapper.vm.validate()).toBe(false)
  })
})
