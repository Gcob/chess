import {describe, it, expect} from 'vitest'
import {Ray} from './ray'
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

describe('Ray', () => {
  it('walks to the board edge through every piece, blockers in order', () => {
    const board = freshBoard()
    const ray = new Ray(board.squares['a1'], 'top')
    expect(ray.squares.map(toSquareKey)).toEqual(['a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8'])
    expect(ray.blockers.map(toSquareKey)).toEqual(['a2', 'a7', 'a8'])
  })

  it('walks diagonals the same way', () => {
    const board = freshBoard()
    const ray = new Ray(board.squares['c1'], 'top-right')
    expect(ray.squares.map(toSquareKey)).toEqual(['d2', 'e3', 'f4', 'g5', 'h6'])
    expect(ray.blockers.map(toSquareKey)).toEqual(['d2'])
  })

  it('attacks directly only up to the first blocker', () => {
    const board = freshBoard()
    const ray = new Ray(board.squares['a1'], 'top')
    expect(ray.attacksDirectly(board.squares['a2'])).toBe(true)
    expect(ray.attacksDirectly(board.squares['a3'])).toBe(false)
  })

  it('sees through pieces, but never off the ray', () => {
    const board = freshBoard()
    const ray = new Ray(board.squares['a1'], 'top')
    expect(ray.seesThrough(board.squares['a8'])).toBe(true)
    expect(ray.seesThrough(board.squares['b2'])).toBe(false)
  })

  it('lists the blockers and squares strictly before a square', () => {
    const board = freshBoard()
    const ray = new Ray(board.squares['a1'], 'top')
    expect(ray.blockersBefore(board.squares['a8']).map(toSquareKey)).toEqual(['a2', 'a7'])
    expect(ray.blockersBefore(board.squares['a2'])).toEqual([])
    expect(ray.squaresBefore(board.squares['a7']).map(toSquareKey)).toEqual(['a2', 'a3', 'a4', 'a5', 'a6'])
  })

  it('exposes the square beyond — null at the edge or off the ray', () => {
    const board = freshBoard()
    const ray = new Ray(board.squares['a1'], 'top')
    expect(ray.squareBeyond(board.squares['a7'])).toBe(board.squares['a8'])
    expect(ray.squareBeyond(board.squares['a8'])).toBeNull()
    expect(ray.squareBeyond(board.squares['b2'])).toBeNull()
  })
})
