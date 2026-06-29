import {describe, it, expect} from 'vitest'
import {squareToCoords, coordsToSquare} from './boardCoords'
import type {SquareKey} from '@/types/chess'

describe('squareToCoords', () => {
  it('places a8 top-left and h1 bottom-right for white', () => {
    expect(squareToCoords('a8', 'white')).toEqual({col: 0, row: 0})
    expect(squareToCoords('h1', 'white')).toEqual({col: 7, row: 7})
  })

  it('flips the board for black', () => {
    expect(squareToCoords('a8', 'black')).toEqual({col: 7, row: 7})
    expect(squareToCoords('h1', 'black')).toEqual({col: 0, row: 0})
  })
})

describe('coordsToSquare', () => {
  it('returns null outside the grid', () => {
    expect(coordsToSquare(-1, 0, 'white')).toBeNull()
    expect(coordsToSquare(0, 8, 'white')).toBeNull()
  })

  it('is the exact inverse of squareToCoords for every square and orientation', () => {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
    for (const orientation of ['white', 'black'] as const) {
      for (const file of files) {
        for (let rank = 1; rank <= 8; rank++) {
          const square = `${file}${rank}` as SquareKey
          const {col, row} = squareToCoords(square, orientation)
          expect(coordsToSquare(col, row, orientation)).toBe(square)
        }
      }
    }
  })
})
