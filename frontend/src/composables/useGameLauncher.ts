import {useNewGameStore} from '@/stores/useNewGameStore'
import {useGamesStore} from '@/stores/useGamesStore'
import {toBackendPayload} from '@/composables/factories/gameFactory'
import {replayMoves} from '@/engine/game'
import {DEV_SCENARIOS} from '@/dev/scenarios'
import type {GameSession} from '@/types/chess'

// Opens a game session from the persisted new-game settings — the one launch path shared by
// the new-game form and the in-game dev panel. A dev-mode launch seeds the fresh (and
// genuinely local) game with the selected QA scenario.
export function useGameLauncher() {
  const newGameStore = useNewGameStore()
  const gamesStore = useGamesStore()

  function launch(): GameSession {
    const settings = newGameStore.settings
    const session = gamesStore.open(toBackendPayload(settings))

    if (settings.mode === 'dev') {
      const scenario = DEV_SCENARIOS.find(s => s.id === settings.scenarioId)
      if (scenario) {
        replayMoves(session.game, scenario.moves)
      }
    }

    return session
  }

  return {launch}
}
