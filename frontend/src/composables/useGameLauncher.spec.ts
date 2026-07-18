import {describe, it, expect, beforeEach} from 'vitest'
import {createPinia, setActivePinia} from 'pinia'
import {useGameLauncher} from './useGameLauncher'
import {useNewGameStore} from '@/stores/useNewGameStore'
import {useGamesStore} from '@/stores/useGamesStore'
import {DEV_SCENARIOS} from '@/dev/scenarios'

describe('useGameLauncher', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('opens a fresh session from the persisted form settings', () => {
    const {launch} = useGameLauncher()
    const session = launch()
    expect(useGamesStore().get(session.id)).toBe(session)
    expect(session.game.mode).toBe('local')
    expect(session.game.moves).toHaveLength(0)
  })

  it('seeds a dev launch with the selected scenario — the game stays a local game', () => {
    const settings = useNewGameStore().settings
    settings.mode = 'dev'
    settings.scenarioId = DEV_SCENARIOS[0]!.id
    const {launch} = useGameLauncher()
    const session = launch()
    expect(session.game.mode).toBe('local')
    expect(session.game.moves).toHaveLength(DEV_SCENARIOS[0]!.moves.length)
  })

  it('launches unseeded when the scenario id is unknown', () => {
    const settings = useNewGameStore().settings
    settings.mode = 'dev'
    settings.scenarioId = 'gone-scenario'
    const {launch} = useGameLauncher()
    expect(launch().game.moves).toHaveLength(0)
  })
})
