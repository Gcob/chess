// Player avatars — a fun emoji set (matches the playful random names). Rendered directly as
// glyphs, so zero assets; the exact look varies a little per OS.

import type {SupportedLocale} from '@/assets/i18n'

export interface Avatar {
  id: string
  emoji: string
  // Grammatical gender of the avatar's noun, per locale — gender is a language-specific concern
  // (French and a future Spanish could disagree), not a universal property of the avatar. Only
  // locales whose adjectives conjugate need an entry here; see randomName.ts / tGender.ts.
  gender?: Partial<Record<SupportedLocale, 'm' | 'f'>>
}

export const AVATARS: Avatar[] = [
  {id: 'fox', emoji: '🦊', gender: {fr: 'm'}},
  {id: 'frog', emoji: '🐸', gender: {fr: 'f'}},
  {id: 'octopus', emoji: '🐙', gender: {fr: 'f'}},
  {id: 'cat', emoji: '🐱', gender: {fr: 'm'}},
  {id: 'owl', emoji: '🦉', gender: {fr: 'm'}},
  {id: 'penguin', emoji: '🐧', gender: {fr: 'm'}},
  {id: 'unicorn', emoji: '🦄', gender: {fr: 'f'}},
  {id: 'turtle', emoji: '🐢', gender: {fr: 'f'}},
  {id: 'dino', emoji: '🦖', gender: {fr: 'm'}},
  {id: 'panda', emoji: '🐼', gender: {fr: 'm'}},
  {id: 'lion', emoji: '🦁', gender: {fr: 'm'}},
  {id: 'monkey', emoji: '🐵', gender: {fr: 'm'}},
  {id: 'robot', emoji: '🤖', gender: {fr: 'm'}},
  {id: 'alien', emoji: '👽', gender: {fr: 'm'}},
  {id: 'ghost', emoji: '👻', gender: {fr: 'm'}},
  {id: 'dog', emoji: '🐶', gender: {fr: 'm'}},
  {id: 'patate', emoji: '🥔', gender: {fr: 'f'}},
  {id: 'brocoli', emoji: '🥦', gender: {fr: 'm'}},
  {id: 'moustache', emoji: '🥸', gender: {fr: 'f'}},
  {id: 'chaussette', emoji: '🧦', gender: {fr: 'f'}},
  {id: 'casquette', emoji: '🧢', gender: {fr: 'f'}},
  {id: 'pantoufle', emoji: '🥿', gender: {fr: 'f'}},
  {id: 'cactus', emoji: '🌵', gender: {fr: 'm'}},
  {id: 'ketchup', emoji: '🍅', gender: {fr: 'm'}},
  {id: 'gaufre', emoji: '🧇', gender: {fr: 'f'}},
  {id: 'nouille', emoji: '🍜', gender: {fr: 'f'}},
  {id: 'guimauve', emoji: '🍬', gender: {fr: 'f'}},
  {id: 'citrouille', emoji: '🎃', gender: {fr: 'f'}},
  {id: 'concombre', emoji: '🥒', gender: {fr: 'm'}},
  {id: 'ecureuil', emoji: '🐿️', gender: {fr: 'm'}},
]

export const AVATAR_IDS = AVATARS.map(a => a.id)
