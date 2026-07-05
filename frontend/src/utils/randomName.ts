// Fun, locale-aware player-name generator. The vocabulary lives in i18n: nouns are avatar names
// (`avatars.{id}`), adjectives are `randomName.adjectives`. This file keeps only the logic; the
// word order per locale is fr "Nom Adjectif" / en "Adjective Noun".

import {unref} from 'vue'
import i18n from '@/assets/i18n'
import {AVATAR_IDS} from '@/themes/avatars'

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)]! // lists are non-empty
}

// getLocaleMessage returns the raw messages, so the adjectives come back as a plain string array.
export function adjectives(): string[] {
  const locale = String(unref(i18n.global.locale))
  const messages = i18n.global.getLocaleMessage(locale) as unknown as {randomName: {adjectives: string[]}}
  return messages.randomName.adjectives
}

// A shuffled copy of the adjectives — a "bag" the UI consumes one at a time so a name never repeats
// until the bag empties.
export function shuffledAdjectives(): string[] {
  const bag = [...adjectives()]
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = bag[i]!
    bag[i] = bag[j]!
    bag[j] = tmp
  }

  return bag
}

// Assembles a name from an (already-localized) noun and adjective, in the locale's word order.
export function formatName(noun: string, adjective: string): string {
  const locale = String(unref(i18n.global.locale))
  return locale === 'fr' ? `${noun} ${adjective}` : `${adjective} ${noun}`
}

// One-shot random name for a noun (used for fresh defaults, not the bag-driven dice button).
export function nameForNoun(noun: string): string {
  return formatName(noun, pick(adjectives()))
}

// A random avatar plus a matching funny name — used for fresh defaults. Pass `exclude` to avoid
// picking the other player's avatar.
export function randomIdentity(exclude?: string): {avatar: string; name: string} {
  let avatar = pick(AVATAR_IDS)
  for (let guard = 0; avatar === exclude && guard < 10; guard++) {
    avatar = pick(AVATAR_IDS)
  }

  return {avatar, name: nameForNoun(String(i18n.global.t(`avatars.${avatar}`)))}
}
