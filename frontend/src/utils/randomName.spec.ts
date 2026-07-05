import {describe, it, expect} from 'vitest'
import {nameForNoun, randomIdentity, shuffledAdjectives} from './randomName'
import {AVATAR_IDS} from '@/themes/avatars'

describe('nameForNoun', () => {
  it('fills the given noun into a non-empty name', () => {
    for (let i = 0; i < 30; i++) {
      const name = nameForNoun('Renard')
      expect(name).toContain('Renard')
      expect(name.length).toBeGreaterThan('Renard'.length)
    }
  })
})

describe('shuffledAdjectives', () => {
  it('returns a full permutation with no repeats', () => {
    const bag = shuffledAdjectives()
    expect(bag.length).toBeGreaterThan(0)
    expect(new Set(bag).size).toBe(bag.length)
  })
})

describe('randomIdentity', () => {
  it('returns a valid avatar and a non-empty name', () => {
    for (let i = 0; i < 30; i++) {
      const {avatar, name} = randomIdentity()
      expect(AVATAR_IDS).toContain(avatar)
      expect(name.length).toBeGreaterThan(0)
    }
  })

  it('never returns the excluded avatar', () => {
    for (let i = 0; i < 30; i++) {
      expect(randomIdentity('fox').avatar).not.toBe('fox')
    }
  })
})
