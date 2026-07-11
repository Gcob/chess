import {describe, it, expect} from 'vitest'
import {Board, getBoardPieces} from './board'
import {applyMove} from './move'
import {createGameSession} from '@/composables/factories/gameFactory'
import type {Board as BoardDto, CreateGamePayload} from '@/types/chess'

const payload: CreateGamePayload = {
  mode: 'local',
  players: {white: {name: 'Alice', avatar: 'circle'}, black: {name: 'Bob', avatar: 'square'}},
}

function freshBoard(): BoardDto {
  return createGameSession(payload, 'test-id').game.board
}

describe('Board', () => {
  it('casts every slider ray, both colors', () => {
    const board = new Board(freshBoard())
    // Per color: 2 rooks × 4 + 2 bishops × 4 + 1 queen × 8 = 24
    expect(board.rays()).toHaveLength(48)
  })

  it('finds the kings', () => {
    const board = new Board(freshBoard())
    expect(board.kingSquare('white')).toBe(board.square('e1'))
    expect(board.kingSquare('black')).toBe(board.square('e8'))
  })

  it('answers square safety', () => {
    const board = new Board(freshBoard())
    expect(board.isAttacked(board.square('d3'), 'white')).toBe(true) // c2/e2 pawns cover it
    expect(board.isAttacked(board.square('d5'), 'white')).toBe(false)
  })

  it('reports checkers and check rays', () => {
    const dto = freshBoard()
    applyMove(dto, 'e2', 'a3') // open the e-file
    applyMove(dto, 'a8', 'e5') // black rook checks e1
    const board = new Board(dto)
    expect(board.checkers('white').map(square => square.key)).toEqual(['e5'])
    expect(board.checkRays('white')).toHaveLength(1)
    expect(board.checkRays('black')).toHaveLength(0)
  })

  it('derives the pin ray: attacker→king segment, capture included', () => {
    const dto = freshBoard()
    applyMove(dto, 'e2', 'a3') // open the e-file
    applyMove(dto, 'c1', 'e2') // white bishop shields the king…
    applyMove(dto, 'a8', 'e6') // …and gets pinned by the black rook
    const board = new Board(dto)
    expect(board.pinRayFor(board.square('e2'))?.map(square => square.key))
      .toEqual(['e6', 'e5', 'e4', 'e3', 'e2'])
    expect(board.pinRayFor(board.square('d2'))).toBeNull() // unpinned pawn
    expect(board.pinRayFor(board.square('e1'))).toBeNull() // the king is never pinned
  })

  it('derives the check responses: null, capture-or-block, capture only, double check', () => {
    const quiet = new Board(freshBoard())
    expect(quiet.checkResponseSquares('white')).toBeNull()

    const sliderCheck = freshBoard()
    applyMove(sliderCheck, 'e2', 'a3')
    applyMove(sliderCheck, 'a8', 'e5') // rook check: capture or interpose on the e-file
    expect(new Board(sliderCheck).checkResponseSquares('white')?.map(square => square.key))
      .toEqual(['e5', 'e4', 'e3', 'e2'])

    const knightCheck = freshBoard()
    applyMove(knightCheck, 'g8', 'f3') // no ray to block: capture is the only answer
    expect(new Board(knightCheck).checkResponseSquares('white')?.map(square => square.key))
      .toEqual(['f3'])

    const doubleCheck = freshBoard()
    applyMove(doubleCheck, 'e2', 'a3')
    applyMove(doubleCheck, 'a8', 'e5')
    applyMove(doubleCheck, 'g8', 'f3')
    expect(new Board(doubleCheck).checkResponseSquares('white')).toEqual([])
  })

  it('exposes the x-ray extension behind the checked king', () => {
    const dto = freshBoard()
    applyMove(dto, 'e1', 'e4')
    applyMove(dto, 'a8', 'e6') // rook checks e4: e3 is only shielded by the king himself
    const board = new Board(dto)
    expect(board.xRayExtensionSquares('white').map(square => square.key)).toEqual(['e3'])
    expect(board.xRayExtensionSquares('black')).toEqual([])
  })
})

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
