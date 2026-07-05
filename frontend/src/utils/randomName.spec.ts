import {describe, it, expect} from 'vitest'
import {nameForAvatar, randomIdentity, shuffledAdjectiveIds, adjectiveTextFor, ADJECTIVE_IDS} from './randomName'
import {AVATAR_IDS} from '@/themes/avatars'
import i18n from '@/assets/i18n'

// i18n.global.locale is typed ambiguously between legacy/composition modes (same reason
// randomName.ts reads it through `unref`): in composition mode it's a Ref-like object with a
// `.value` setter, in legacy mode it's a plain string property on `i18n.global`. Handle both so
// this helper doesn't throw if the project's i18n mode ever changes.
function setLocale(locale: 'fr' | 'en') {
  const current = i18n.global.locale as unknown
  if (current && typeof current === 'object' && 'value' in current) {
    (current as {value: 'fr' | 'en'}).value = locale
  } else {
    (i18n.global as unknown as {locale: 'fr' | 'en'}).locale = locale
  }
}

describe('nameForAvatar', () => {
  it('fills the localized avatar noun into the formatted name', () => {
    setLocale('en')
    try {
      for (let i = 0; i < 30; i++) {
        const name = nameForAvatar('fox')
        // en word order is "Adjective Noun" (randomName.format) — the noun must be the last word.
        expect(name).toMatch(/ Fox$/)
      }
    } finally {
      setLocale('en')
    }
  })

  it('always picks an adjective form matching the avatar gender', () => {
    setLocale('fr')
    try {
      const messages = i18n.global.getLocaleMessage('fr') as unknown as {
        randomName: {adjectives: Record<string, string>}
      }
      const adjectives = messages.randomName.adjectives
      // Masculine forms that have a distinct `_f` override — these must never show up for a
      // feminine avatar (e.g. "Affamé" must never appear for "Licorne", only "Affamée").
      const masculineOnlyForms = ADJECTIVE_IDS
        .filter(id => adjectives[`${id}_f`] !== undefined)
        .map(id => adjectives[id])

      const noun = 'Licorne' // unicorn — feminine in French
      for (let i = 0; i < 30; i++) {
        const adjective = nameForAvatar('unicorn').slice(noun.length + 1)
        expect(masculineOnlyForms).not.toContain(adjective)
      }
    } finally {
      setLocale('en')
    }
  })
})

describe('shuffledAdjectiveIds', () => {
  it('returns a full permutation with no repeats', () => {
    const bag = shuffledAdjectiveIds()
    expect(bag.length).toBe(ADJECTIVE_IDS.length)
    expect(new Set(bag).size).toBe(bag.length)
  })
})

describe('adjectiveTextFor', () => {
  it('agrees with the given avatar gender in French', () => {
    setLocale('fr')
    try {
      expect(adjectiveTextFor('starving', 'unicorn')).toBe('Affamée') // feminine
      expect(adjectiveTextFor('starving', 'lion')).toBe('Affamé') // masculine
    } finally {
      setLocale('en')
    }
  })

  it('ignores gender in English', () => {
    expect(adjectiveTextFor('starving', 'unicorn')).toBe('Starving')
    expect(adjectiveTextFor('starving', 'lion')).toBe('Starving')
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

describe('translation parity', () => {
  it('has a base translation for every adjective id in both locales', () => {
    for (const id of ADJECTIVE_IDS) {
      expect(i18n.global.te(`randomName.adjectives.${id}`, 'fr')).toBe(true)
      expect(i18n.global.te(`randomName.adjectives.${id}`, 'en')).toBe(true)
    }
  })
})
