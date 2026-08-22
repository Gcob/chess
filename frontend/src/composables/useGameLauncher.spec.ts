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

  describe('rematch', () => {
    it('swaps the colours — nobody plays white twice in a row', () => {
      const settings = useNewGameStore().settings
      settings.playerWhiteName = 'Ada'
      settings.playerWhiteAvatar = 'fox'
      settings.playerBlackName = 'Linus'
      settings.playerBlackAvatar = 'panda'

      const {launch, rematch} = useGameLauncher()
      const played = launch()
      const revenge = rematch(played.game)

      expect(revenge.game.players.white.metas.name).toBe('Linus')
      expect(revenge.game.players.white.metas.image).toBe('panda')
      expect(revenge.game.players.black.metas.name).toBe('Ada')
      expect(revenge.game.players.black.metas.image).toBe('fox')
    })

    it('keeps the mode and the time control, and starts from a clean board', () => {
      const settings = useNewGameStore().settings
      settings.timerEnabled = true
      settings.timerMinutes = 3
      settings.timerIncrement = 2

      const {launch, rematch} = useGameLauncher()
      const revenge = rematch(launch().game)

      expect(revenge.game.mode).toBe('local')
      expect(revenge.game.time).toEqual({minutes: 3, secondsIncrement: 2})
      expect(revenge.game.moves).toHaveLength(0)
      expect(revenge.game.status).toBe('waiting')
      expect(revenge.game.result).toBeNull()
    })

    it('carries an untimed game over as untimed', () => {
      useNewGameStore().settings.timerEnabled = false
      const {launch, rematch} = useGameLauncher()
      expect(rematch(launch().game).game.time).toBeUndefined()
    })

    it('registers the rematch as its own session, leaving the previous one alone', () => {
      const {launch, rematch} = useGameLauncher()
      const played = launch()
      const revenge = rematch(played.game)

      expect(revenge.id).not.toBe(played.id)
      expect(useGamesStore().get(played.id)).toBe(played)
      expect(useGamesStore().get(revenge.id)).toBe(revenge)
    })

    it('does not touch the persisted form settings', () => {
      const settings = useNewGameStore().settings
      settings.playerWhiteName = 'Ada'
      settings.playerBlackName = 'Linus'

      const {launch, rematch} = useGameLauncher()
      rematch(launch().game)

      expect(settings.playerWhiteName).toBe('Ada')
      expect(settings.playerBlackName).toBe('Linus')
    })
  })
})
