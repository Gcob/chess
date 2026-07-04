import {describe, it, expect} from 'vitest'
import {getBoardPieces} from './board'
import {createGameSession} from '@/composables/factories/gameFactory'
import type {Board, CreateGamePayload} from '@/types/chess'

const payload: CreateGamePayload = {
  mode: 'local',
  players: {white: {name: 'Alice', avatar: 'circle'}, black: {name: 'Bob', avatar: 'square'}},
}

function freshBoard(): Board {
  return createGameSession(payload, 1).game.board
}

describe('getBoardPieces', () => {
  it('returns the 32 pieces of the initial position', () => {
    const pieces = getBoardPieces(freshBoard())
    expect(pieces).toHaveLength(32)
  })

  it('pairs each piece with the square it sits on', () => {
    const pieces = getBoardPieces(freshBoard())
    const e2 = pieces.find(p => p.square === 'e2')
    expect(e2?.piece.type).toBe('pawn')
    expect(e2?.piece.color).toBe('white')
  })

  it('exposes the stable id seeded from the start square', () => {
    const pieces = getBoardPieces(freshBoard())
    expect(pieces.find(p => p.square === 'e2')?.piece.id).toBe('Pe2')
    expect(pieces.find(p => p.square === 'a1')?.piece.id).toBe('Ra1')
    expect(pieces.find(p => p.square === 'e8')?.piece.id).toBe('Ke8')
  })

  it('ids are unique across all pieces', () => {
    const ids = getBoardPieces(freshBoard()).map(p => p.piece.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('skips empty squares', () => {
    const board = freshBoard()
    board.squares['e2'].piece = null
    expect(getBoardPieces(board)).toHaveLength(31)
  })
})
