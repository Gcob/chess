import {describe, it, expect} from 'vitest'
import {DEV_SCENARIOS} from './scenarios'
import {replayMoves} from '@/engine/game'
import {createGameSession} from '@/composables/factories/gameFactory'
import type {CreateGamePayload} from '@/types/chess'

const payload: CreateGamePayload = {
  mode: 'local',
  players: {white: {name: 'Alice', avatar: 'circle'}, black: {name: 'Bob', avatar: 'square'}},
}

describe('DEV_SCENARIOS', () => {
  it('has unique ids', () => {
    const ids = DEV_SCENARIOS.map(scenario => scenario.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  // The registry's contract: a scenario seeds a LIVE game — replayMoves already throws on any
  // illegal move, so a typo in a move list fails this suite instead of a QA session.
  it.each(DEV_SCENARIOS.map(scenario => [scenario.id, scenario] as const))(
    'replays scenario %s into a live position',
    (_id, scenario) => {
      const game = createGameSession(payload, 'scenario-test').game
      replayMoves(game, scenario.moves)
      expect(game.status).toBe('active')
      expect(game.moves).toHaveLength(scenario.moves.length)
    },
  )
})
