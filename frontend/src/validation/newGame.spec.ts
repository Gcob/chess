import {describe, it, expect} from 'vitest'
import {validateNewGamePlayers} from './newGame'

describe('validateNewGamePlayers', () => {
  it('passes for two distinct non-empty names', () => {
    expect(validateNewGamePlayers({playerWhiteName: 'Alice', playerBlackName: 'Bob'})).toEqual({})
  })

  it('flags empty (or whitespace-only) names as required', () => {
    const errors = validateNewGamePlayers({playerWhiteName: '  ', playerBlackName: ''})
    expect(errors.playerWhiteName).toBe('required')
    expect(errors.playerBlackName).toBe('required')
  })

  it('flags identical names on the second field', () => {
    const errors = validateNewGamePlayers({playerWhiteName: 'Bob', playerBlackName: 'Bob'})
    expect(errors.playerBlackName).toBe('sameName')
    expect(errors.playerWhiteName).toBeUndefined()
  })

  it('treats names equal after trimming as identical', () => {
    const errors = validateNewGamePlayers({playerWhiteName: 'Bob', playerBlackName: '  Bob  '})
    expect(errors.playerBlackName).toBe('sameName')
  })
})
