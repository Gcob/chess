import {describe, it, expect} from 'vitest'
import {randomPlayerName} from './randomName'

describe('randomPlayerName', () => {
  it('returns two capitalized words for each locale', () => {
    for (const locale of ['fr', 'en']) {
      for (let i = 0; i < 20; i++) {
        expect(randomPlayerName(locale)).toMatch(/^\p{Lu}[\p{L}-]+ \p{Lu}[\p{L}-]+$/u)
      }
    }
  })
})
