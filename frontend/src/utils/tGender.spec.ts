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
    const i18n = fakeTranslator({starving: 'Affamé', starving_f: 'Affamée'})
    expect(tGender(i18n, 'starving', 'f')).toBe('Affamée')
    expect(tGender(i18n, 'starving', 'm')).toBe('Affamé')
  })

  it('falls back to the base key when the gendered key does not exist', () => {
    const i18n = fakeTranslator({swift: 'Rapide'})
    expect(tGender(i18n, 'swift', 'f')).toBe('Rapide')
    expect(tGender(i18n, 'swift', 'm')).toBe('Rapide')
  })

  it('uses the base key directly when gender is undefined', () => {
    const i18n = fakeTranslator({starving: 'Affamé', starving_f: 'Affamée'})
    expect(tGender(i18n, 'starving')).toBe('Affamé')
  })
})
