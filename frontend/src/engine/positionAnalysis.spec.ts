import {describe, it, expect} from 'vitest'
import {PositionAnalysis} from './positionAnalysis'
import {applyMove} from './move'
import {toSquareKey} from './board'
import {createGameSession} from '@/composables/factories/gameFactory'
import type {Board, CreateGamePayload} from '@/types/chess'

const payload: CreateGamePayload = {
  mode: 'local',
  players: {white: {name: 'Alice', avatar: 'circle'}, black: {name: 'Bob', avatar: 'square'}},
}

function freshBoard(): Board {
  return createGameSession(payload, 'test-id').game.board
}

describe('PositionAnalysis', () => {
  it('casts every slider ray, both colors', () => {
    const analysis = new PositionAnalysis(freshBoard())
    // Per color: 2 rooks × 4 + 2 bishops × 4 + 1 queen × 8 = 24
    expect(analysis.rays()).toHaveLength(48)
  })

  it('finds the kings', () => {
    const board = freshBoard()
    const analysis = new PositionAnalysis(board)
    expect(analysis.kingSquare('white')).toBe(board.squares['e1'])
    expect(analysis.kingSquare('black')).toBe(board.squares['e8'])
  })

  it('answers square safety', () => {
    const board = freshBoard()
    const analysis = new PositionAnalysis(board)
    expect(analysis.isAttacked(board.squares['d3'], 'white')).toBe(true) // c2/e2 pawns cover it
    expect(analysis.isAttacked(board.squares['d5'], 'white')).toBe(false)
  })

  it('reports checkers and check rays', () => {
    const board = freshBoard()
    applyMove(board, 'e2', 'a3') // open the e-file
    applyMove(board, 'a8', 'e5') // black rook checks e1
    const analysis = new PositionAnalysis(board)
    expect(analysis.checkers('white').map(toSquareKey)).toEqual(['e5'])
    expect(analysis.checkRays('white')).toHaveLength(1)
    expect(analysis.checkRays('black')).toHaveLength(0)
  })

  it('derives the pin ray: attacker→king segment, capture included', () => {
    const board = freshBoard()
    applyMove(board, 'e2', 'a3') // open the e-file
    applyMove(board, 'c1', 'e2') // white bishop shields the king…
    applyMove(board, 'a8', 'e6') // …and gets pinned by the black rook
    const analysis = new PositionAnalysis(board)
    expect(analysis.pinRayFor(board.squares['e2'])?.map(toSquareKey)).toEqual(['e6', 'e5', 'e4', 'e3', 'e2'])
    expect(analysis.pinRayFor(board.squares['d2'])).toBeNull() // unpinned pawn
    expect(analysis.pinRayFor(board.squares['e1'])).toBeNull() // the king is never pinned
  })

  it('derives the check responses: null, capture-or-block, capture only, double check', () => {
    const quiet = new PositionAnalysis(freshBoard())
    expect(quiet.checkResponseSquares('white')).toBeNull()

    const sliderCheck = freshBoard()
    applyMove(sliderCheck, 'e2', 'a3')
    applyMove(sliderCheck, 'a8', 'e5') // rook check: capture or interpose on the e-file
    expect(new PositionAnalysis(sliderCheck).checkResponseSquares('white')?.map(toSquareKey))
      .toEqual(['e5', 'e4', 'e3', 'e2'])

    const knightCheck = freshBoard()
    applyMove(knightCheck, 'g8', 'f3') // no ray to block: capture is the only answer
    expect(new PositionAnalysis(knightCheck).checkResponseSquares('white')?.map(toSquareKey))
      .toEqual(['f3'])

    const doubleCheck = freshBoard()
    applyMove(doubleCheck, 'e2', 'a3')
    applyMove(doubleCheck, 'a8', 'e5')
    applyMove(doubleCheck, 'g8', 'f3')
    expect(new PositionAnalysis(doubleCheck).checkResponseSquares('white')).toEqual([])
  })

  it('exposes the x-ray extension behind the checked king', () => {
    const board = freshBoard()
    applyMove(board, 'e1', 'e4')
    applyMove(board, 'a8', 'e6') // rook checks e4: e3 is only shielded by the king himself
    const analysis = new PositionAnalysis(board)
    expect(analysis.xRayExtensionSquares('white').map(toSquareKey)).toEqual(['e3'])
    expect(analysis.xRayExtensionSquares('black')).toEqual([])
  })
})
