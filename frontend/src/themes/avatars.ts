// Player avatars — a fun emoji set (matches the playful random names). Rendered directly as
// glyphs, so zero assets; the exact look varies a little per OS.

export interface Avatar {
  id: string
  emoji: string
}

export const AVATARS: Avatar[] = [
  {id: 'fox', emoji: '🦊'},
  {id: 'frog', emoji: '🐸'},
  {id: 'octopus', emoji: '🐙'},
  {id: 'cat', emoji: '🐱'},
  {id: 'owl', emoji: '🦉'},
  {id: 'penguin', emoji: '🐧'},
  {id: 'unicorn', emoji: '🦄'},
  {id: 'turtle', emoji: '🐢'},
  {id: 'dino', emoji: '🦖'},
  {id: 'panda', emoji: '🐼'},
  {id: 'lion', emoji: '🦁'},
  {id: 'monkey', emoji: '🐵'},
  {id: 'robot', emoji: '🤖'},
  {id: 'alien', emoji: '👽'},
  {id: 'ghost', emoji: '👻'},
  {id: 'dog', emoji: '🐶'},
  {id: 'patate', emoji: '🥔'},
  {id: 'brocoli', emoji: '🥦'},
  {id: 'moustache', emoji: '🥸'},
  {id: 'chaussette', emoji: '🧦'},
  {id: 'casquette', emoji: '🧢'},
  {id: 'pantoufle', emoji: '🥿'},
  {id: 'cactus', emoji: '🌵'},
  {id: 'ketchup', emoji: '🍅'},
  {id: 'gaufre', emoji: '🧇'},
  {id: 'nouille', emoji: '🍜'},
  {id: 'guimauve', emoji: '🍬'},
  {id: 'citrouille', emoji: '🎃'},
  {id: 'concombre', emoji: '🥒'},
  {id: 'ecureuil', emoji: '🐿️'},
]

export const AVATAR_IDS = AVATARS.map(a => a.id)
