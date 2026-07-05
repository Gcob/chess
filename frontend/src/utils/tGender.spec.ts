import {describe, it, expect} from 'vitest'
import {tGender} from './tGender'

function fakeTranslator(messages: Record<string, string>) {
  return {
    t: (key: string) => messages[key] ?? key,
    te: (key: string) => key in messages,
  } as Parameters<typeof tGender>[0]
}

describe('tGender', () => {
  it('uses the gendered key when it exists', () => {
    const i18n = fakeTranslator({affame: 'Affamé', affame_f: 'Affamée'})
    expect(tGender(i18n, 'affame', 'f')).toBe('Affamée')
    expect(tGender(i18n, 'affame', 'm')).toBe('Affamé')
  })

  it('falls back to the base key when the gendered key does not exist', () => {
    const i18n = fakeTranslator({rapide: 'Rapide'})
    expect(tGender(i18n, 'rapide', 'f')).toBe('Rapide')
    expect(tGender(i18n, 'rapide', 'm')).toBe('Rapide')
  })

  it('uses the base key directly when gender is undefined', () => {
    const i18n = fakeTranslator({affame: 'Affamé', affame_f: 'Affamée'})
    expect(tGender(i18n, 'affame')).toBe('Affamé')
  })
})
