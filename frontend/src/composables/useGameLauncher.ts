import {useNewGameStore} from '@/stores/useNewGameStore'
import {useGamesStore} from '@/stores/useGamesStore'
import {toBackendPayload} from '@/composables/factories/gameFactory'
import {replayMoves} from '@/engine/game'
import {DEV_SCENARIOS} from '@/dev/scenarios'
import type {CreateGamePayload, Game, GameSession} from '@/types/chess'

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

  // Rematch: the same two people, the same time control, colours SWAPPED — the chess convention,
  // so nobody plays white twice in a row. Built from the finished game rather than from the
  // new-game form: the rematch belongs to the game that just ended, and the persisted form
  // settings are the viewer's own business, untouched here.
  function rematch(game: Game): GameSession {
    const payload: CreateGamePayload = {
      mode: game.mode,
      players: {
        // metas.image is optional on a Player but required on the payload — an empty id resolves
        // to no glyph downstream, which is the right degradation for an avatar-less player.
        white: {name: game.players.black.metas.name, avatar: game.players.black.metas.image ?? ''},
        black: {name: game.players.white.metas.name, avatar: game.players.white.metas.image ?? ''},
      },
      time: game.time,
    }

    return gamesStore.open(payload)
  }

  return {launch, rematch}
}
