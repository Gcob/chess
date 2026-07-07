import {describe, it, expect} from 'vitest'
import {getCapturedPieces, materialDiff, type CapturedByColor} from './material'
import {makeMove} from './game'
import {createGameSession} from '@/composables/factories/gameFactory'
import type {CreateGamePayload} from '@/types/chess'

const captured: CapturedByColor = {
  white: [{color: 'black', type: 'queen'}], // 9
  black: [{color: 'white', type: 'rook'}, {color: 'white', type: 'pawn'}], // 6
}

describe('getCapturedPieces', () => {
  const payload: CreateGamePayload = {
    mode: 'local',
    players: {white: {name: 'Alice', avatar: 'circle'}, black: {name: 'Bob', avatar: 'square'}},
  }

  it('is empty when no capture happened', () => {
    const {game} = createGameSession(payload, 'test-id')
    makeMove(game, 'e2', 'e4')
    expect(getCapturedPieces(game)).toEqual({white: [], black: []})
  })

  it('derives captures from the move history, keyed by capturing color', () => {
    const {game} = createGameSession(payload, 'test-id')
    makeMove(game, 'e2', 'e4')
    makeMove(game, 'd7', 'd5')
    makeMove(game, 'e4', 'd5') // white pawn takes black pawn
    makeMove(game, 'd8', 'd5') // black queen takes back
    expect(getCapturedPieces(game)).toEqual({
      white: [{color: 'black', type: 'pawn'}],
      black: [{color: 'white', type: 'pawn'}],
    })
  })
})

describe('materialDiff', () => {
  it('is positive for the player ahead and negative for the one behind', () => {
    expect(materialDiff(captured, 'white')).toBe(3)
    expect(materialDiff(captured, 'black')).toBe(-3)
  })

  it('is 0 when material is even', () => {
    const even: CapturedByColor = {
      white: [{color: 'black', type: 'knight'}],
      black: [{color: 'white', type: 'bishop'}],
    }
    expect(materialDiff(even, 'white')).toBe(0)
  })
})
