// Fun, locale-aware player-name generator.
//   fr → "{Nom} {Adjectif}"  e.g. "Castor Rebelle"
//   en → "{Adjective} {Noun}" e.g. "Rebel Beaver"
// Adjectives are chosen to read fine with any noun (gender-invariant in French).

const WORDS = {
  fr: {
    nouns: [
      'tracteur', 'poutine', 'patate', 'biscuit', 'brocoli', 'aspirateur', 'grille-pain',
      'cornichon', 'spaghetti', 'moustache', 'chaussette', 'tuque', 'pantoufle', 'cactus',
      'ketchup', 'gaufre', 'nouille', 'guimauve', 'citrouille', 'concombre', 'débarbouillette',
      'écureuil', 'pingouin', 'sasquatch',
    ],
    adjectives: [
      'rapide', 'rebelle', 'timide', 'féroce', 'increvable', 'drôle', 'énorme', 'magique',
      'cosmique', 'tranquille', 'terrible', 'suprême', 'adorable', 'incroyable', 'invincible',
      'sauvage', 'bizarre', 'atomique', 'redoutable', 'légendaire', 'électrique', 'turbo',
      'volcanique', 'indomptable',
    ],
  },
  en: {
    nouns: [
      'tractor', 'poutine', 'potato', 'biscuit', 'broccoli', 'vacuum', 'toaster', 'pickle',
      'spaghetti', 'mustache', 'sock', 'beanie', 'slipper', 'cactus', 'ketchup', 'waffle',
      'noodle', 'marshmallow', 'pumpkin', 'cucumber', 'muffin', 'squirrel', 'penguin', 'sasquatch',
    ],
    adjectives: [
      'swift', 'rebel', 'shy', 'fierce', 'sneaky', 'funny', 'giant', 'magic', 'cosmic',
      'chill', 'terrible', 'supreme', 'adorable', 'unstoppable', 'invincible', 'wild',
      'bizarre', 'atomic', 'fearless', 'legendary', 'electric', 'turbo', 'explosive', 'unhinged',
    ],
  },
}

function pick(list: readonly string[]): string {
  return list[Math.floor(Math.random() * list.length)]! // lists are non-empty
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

export function randomPlayerName(locale: string): string {
  const words = locale === 'fr' ? WORDS.fr : WORDS.en
  const noun = capitalize(pick(words.nouns))
  const adjective = capitalize(pick(words.adjectives))
  return locale === 'fr' ? `${noun} ${adjective}` : `${adjective} ${noun}`
}
