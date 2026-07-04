import {describe, it, expect} from 'vitest'
import {materialDiff, type CapturedByColor} from './material'

const captured: CapturedByColor = {
  white: [{color: 'black', type: 'queen'}], // 9
  black: [{color: 'white', type: 'rook'}, {color: 'white', type: 'pawn'}], // 6
}

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
