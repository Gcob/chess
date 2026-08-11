import {describe, it, expect, beforeEach, vi} from 'vitest'
import {flushPromises, mount} from '@vue/test-utils'
import {createPinia, setActivePinia} from 'pinia'
import {createI18n} from 'vue-i18n'
import {createRouter, createMemoryHistory, type Router} from 'vue-router'
import DevGamePanel from './DevGamePanel.vue'
import coreUI from '@/components/core-ui/core-ui'
import {useSettingsStore} from '@/stores/useSettingsStore'
import {useNewGameStore} from '@/stores/useNewGameStore'
import {useGamesStore} from '@/stores/useGamesStore'
import {useGameLauncher} from '@/composables/useGameLauncher'
import {buildPgn} from '@/engine/pgn'
import {DEV_SCENARIOS} from '@/dev/scenarios'

// Keys render as themselves — the spec asserts behaviour, never copy.
const i18n = createI18n({legacy: false, locale: 'en', missingWarn: false, fallbackWarn: false, messages: {en: {}}})

function makeRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      {path: '/new-game', name: 'new-game', component: {template: '<div />'}},
      {path: '/game/:id', name: 'game', component: {template: '<div />'}},
    ],
  })
}

async function mountPanel() {
  const session = useGameLauncher().launch()
  const router = makeRouter()
  await router.replace({name: 'game', params: {id: session.id}})
  const wrapper = mount(DevGamePanel, {global: {plugins: [i18n, router, coreUI]}})
  return {wrapper, router, session}
}

describe('DevGamePanel', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('stays hidden while the devMode setting is off', async () => {
    const {wrapper} = await mountPanel()
    expect(wrapper.find('.dev-panel').exists()).toBe(false)
  })

  it('shows the scenario choices once the setting is on', async () => {
    useSettingsStore().settings.devMode = true
    const {wrapper} = await mountPanel()
    expect(wrapper.findAll('.dev-panel option')).toHaveLength(DEV_SCENARIOS.length)
  })

  it('restarts in place: new seeded session, navigation, old session closed', async () => {
    useSettingsStore().settings.devMode = true
    const {wrapper, router, session} = await mountPanel()
    await wrapper.findAll('button').find(b => b.text().includes('restart'))!.trigger('click')
    await flushPromises()

    const gamesStore = useGamesStore()
    const newId = String(router.currentRoute.value.params.id)
    expect(newId).not.toBe(session.id)
    expect(gamesStore.get(session.id)).toBeUndefined()
    expect(gamesStore.get(newId)!.game.moves.length).toBeGreaterThan(0)
    expect(useNewGameStore().settings.mode).toBe('dev')
  })

  it('copies the current game PGN to the clipboard', async () => {
    useSettingsStore().settings.devMode = true
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {value: {writeText}, configurable: true})
    const {wrapper, session} = await mountPanel()
    await wrapper.findAll('button').find(b => b.text().includes('copyPgn'))!.trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenCalledWith(buildPgn(session.game))
  })
})
