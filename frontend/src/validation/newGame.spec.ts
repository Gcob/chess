import {describe, it, expect} from 'vitest'
import {validateNewGamePlayers, type NewGamePlayersInput} from './newGame'

function input(overrides: Partial<NewGamePlayersInput> = {}): NewGamePlayersInput {
  return {
    playerWhiteName: 'Alice',
    playerBlackName: 'Bob',
    playerWhiteAvatar: 'circle',
    playerBlackAvatar: 'square',
    ...overrides,
  }
}

describe('validateNewGamePlayers', () => {
  it('passes for distinct names and avatars', () => {
    expect(validateNewGamePlayers(input())).toEqual({})
  })

  it('flags empty (or whitespace-only) names as required', () => {
    const errors = validateNewGamePlayers(input({playerWhiteName: '  ', playerBlackName: ''}))
    expect(errors.playerWhiteName).toBe('required')
    expect(errors.playerBlackName).toBe('required')
  })

  it('flags identical names on the second field', () => {
    const errors = validateNewGamePlayers(input({playerWhiteName: 'Bob', playerBlackName: 'Bob'}))
    expect(errors.playerBlackName).toBe('sameName')
    expect(errors.playerWhiteName).toBeUndefined()
  })

  it('treats names equal after trimming as identical', () => {
    const errors = validateNewGamePlayers(input({playerWhiteName: 'Bob', playerBlackName: '  Bob  '}))
    expect(errors.playerBlackName).toBe('sameName')
  })

  it('flags identical avatars', () => {
    const errors = validateNewGamePlayers(input({playerWhiteAvatar: 'ring', playerBlackAvatar: 'ring'}))
    expect(errors.playerBlackAvatar).toBe('sameImage')
  })
})
