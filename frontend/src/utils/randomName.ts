// Fun, locale-aware player-name generator. The vocabulary lives in i18n (`randomName.adjectives`,
// `randomName.format`); this file only picks a random adjective id and resolves it via `tGender`,
// which handles gender agreement (or its absence) through the `_m`/`_f` key convention.

import {unref} from 'vue'
import i18n from '@/assets/i18n'
import type {SupportedLocale} from '@/assets/i18n'
import {AVATARS} from '@/themes/avatars'
import {tGender} from '@/utils/tGender'

// Internal ids for the adjective pool — every locale must provide a base translation for each one;
// only locales that conjugate (currently French) add `_f` overrides for the ones that vary.
export const ADJECTIVE_IDS = [
  'rapide', 'rebelle', 'timide', 'feroce', 'increvable', 'drole', 'enorme', 'magique', 'cosmique',
  'tranquille', 'terrible', 'supreme', 'adorable', 'incroyable', 'invincible', 'sauvage', 'bizarre',
  'atomique', 'redoutable', 'legendaire', 'turbo', 'volcanique', 'indomptable',
  'fantastique', 'formidable', 'sympathique', 'extraordinaire', 'habile', 'agile', 'solide',
  'heroique', 'epique', 'galactique', 'stellaire', 'vorace', 'tenace', 'sublime', 'intrepide',
  'splendide',
  'affame', 'repu', 'monocle', 'moustachu', 'barbu', 'cornu', 'dodu', 'jaloux', 'amoureux',
  'anxieux', 'joyeux', 'curieux', 'confus', 'epuise', 'effronte', 'fache', 'etonne', 'ebouriffe',
  'chatouilleux', 'grognon',
] as const

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)]! // lists are non-empty
}

function currentLocale(): SupportedLocale {
  return String(unref(i18n.global.locale)) as SupportedLocale
}

function genderFor(avatarId: string): 'm' | 'f' | undefined {
  return AVATARS.find(a => a.id === avatarId)?.gender?.[currentLocale()]
}

// A shuffled copy of the adjective ids — a "bag" the UI consumes one at a time so a name never
// repeats until the bag empties.
export function shuffledAdjectiveIds(): string[] {
  const bag: string[] = [...ADJECTIVE_IDS]
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = bag[i]!
    bag[i] = bag[j]!
    bag[j] = tmp
  }

  return bag
}

// Resolves an adjective id to display text, agreeing with the given avatar's gender (if any).
export function adjectiveTextFor(adjectiveId: string, avatarId: string): string {
  return tGender(i18n.global, `randomName.adjectives.${adjectiveId}`, genderFor(avatarId))
}

// Assembles a name from an (already-localized) noun and adjective; word order is locale data
// (`randomName.format`), not a branch in this code.
export function formatName(noun: string, adjective: string): string {
  return String(i18n.global.t('randomName.format', {noun, adjective}))
}

// One-shot random name for an avatar (used for fresh defaults, not the bag-driven dice button).
export function nameForAvatar(avatarId: string): string {
  const noun = String(i18n.global.t(`avatars.${avatarId}`))
  return formatName(noun, adjectiveTextFor(pick(ADJECTIVE_IDS), avatarId))
}

// A random avatar plus a matching funny name — used for fresh defaults. Pass `exclude` to avoid
// picking the other player's avatar.
export function randomIdentity(exclude?: string): {avatar: string; name: string} {
  const candidates = AVATARS.filter(a => a.id !== exclude)
  const avatar = pick(candidates.length > 0 ? candidates : AVATARS)

  return {avatar: avatar.id, name: nameForAvatar(avatar.id)}
}
