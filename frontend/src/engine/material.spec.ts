import {describe, it, expect} from 'vitest'
import {getCapturedPieces, hasInsufficientMaterial, materialDiff, type CapturedByColor} from './material'
import {makeMove} from './game'
import {applyMove} from './move'
import {createGameSession} from '@/composables/factories/gameFactory'
import {keepOnly} from '@/test/board'
import type {Board, CreateGamePayload, SquareKey} from '@/types/chess'

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

describe('hasInsufficientMaterial', () => {
  const payload: CreateGamePayload = {
    mode: 'local',
    players: {white: {name: 'Alice', avatar: 'circle'}, black: {name: 'Bob', avatar: 'square'}},
  }

  // A sparse position: the standard board stripped to `keep`, survivors teleported if needed.
  function boardWith(keep: SquareKey[]): Board {
    const board = createGameSession(payload, 'test-id').game.board
    keepOnly(board, keep)
    return board
  }

  it('declares king vs king dead', () => {
    expect(hasInsufficientMaterial(boardWith(['e1', 'e8']))).toBe(true)
  })

  it('declares a lone minor dead — bishop or knight', () => {
    expect(hasInsufficientMaterial(boardWith(['e1', 'e8', 'c1']))).toBe(true) // K+B vs K
    expect(hasInsufficientMaterial(boardWith(['e1', 'e8', 'b8']))).toBe(true) // K vs K+N
  })

  it('declares bishops dead only when they all share one square colour', () => {
    // c1 and f8 both live on dark squares — no check is ever possible on a light one
    expect(hasInsufficientMaterial(boardWith(['e1', 'e8', 'c1', 'f8']))).toBe(true)
    // c1 (dark) vs c8 (light): opposite colours, helpmate possible
    expect(hasInsufficientMaterial(boardWith(['e1', 'e8', 'c1', 'c8']))).toBe(false)
  })

  it('keeps the classic bishop pair alive — it spans both colours', () => {
    expect(hasInsufficientMaterial(boardWith(['e1', 'e8', 'c1', 'f1']))).toBe(false)
  })

  it('keeps knights alive as soon as two minors meet', () => {
    expect(hasInsufficientMaterial(boardWith(['e1', 'e8', 'b1', 'b8']))).toBe(false) // K+N vs K+N
    expect(hasInsufficientMaterial(boardWith(['e1', 'e8', 'c1', 'b8']))).toBe(false) // K+B vs K+N
  })

  it('never triggers with a pawn, rook or queen on the board', () => {
    expect(hasInsufficientMaterial(boardWith(['e1', 'e8', 'a2']))).toBe(false)
    expect(hasInsufficientMaterial(boardWith(['e1', 'e8', 'a1']))).toBe(false)
    expect(hasInsufficientMaterial(boardWith(['e1', 'e8', 'd8']))).toBe(false)
  })

  it('is false on the initial position', () => {
    expect(hasInsufficientMaterial(createGameSession(payload, 'test-id').game.board)).toBe(false)
  })
})
