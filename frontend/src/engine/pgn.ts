import type {Game, GameResult, GameTime, Move} from '@/types/chess'

// ─── PGN export ──────────────────────────────────────────────────────────────
// Pure serialization of a Game to Portable Game Notation. Zero Vue, zero module state —
// same mould as san.ts. Reads only the DTO: the SANs already stored on each Move, the
// result, players, time and creation date. Total: never throws (an ongoing game exports a
// '*' result and no Termination tag).

// PGN lines wrap at ≤ 80 columns, broken between tokens (PGN spec 8.2.2).
const MAX_LINE = 80

export function buildPgn(game: Game): string {
  return `${buildHeaders(game)}\n\n${buildMovetext(game.moves, game.result)}\n`
}

function buildHeaders(game: Game): string {
  const tags: Array<[string, string]> = [
    ['Event', '?'],
    ['Site', '?'],
    ['Date', formatDate(game.createdAt)],
    ['Round', '-'],
    ['White', escapeHeader(game.players.white.metas.name)],
    ['Black', escapeHeader(game.players.black.metas.name)],
    ['Result', resultToken(game.result)],
    ['TimeControl', timeControlTag(game.time)],
  ]

  // Termination only describes a game that actually ended.
  if (game.result) {
    tags.push(['Termination', terminationText(game.result)])
  }

  return tags.map(([name, value]) => `[${name} "${value}"]`).join('\n')
}

// The winner is named by color, per PGN convention — never the player's name.
function terminationText(result: GameResult): string {
  const winner = result.winner === 'white' ? 'White' : 'Black'
  switch (result.reason) {
    case 'checkmate':
      return `${winner} won by checkmate`
    case 'resignation':
      return `${winner} won by resignation`
    // The flag rule (FIDE 6.9): a timeout is a win only when the opponent could still mate.
    case 'timeout':
      return result.winner ? `${winner} won on time` : 'Game drawn on time (insufficient material)'
    case 'stalemate':
      return 'Game drawn by stalemate'
    case 'fifty-move-rule':
      return 'Game drawn by fifty-move rule'
    case 'threefold-repetition':
      return 'Game drawn by threefold repetition'
    case 'insufficient-material':
      return 'Game drawn by insufficient material'
    case 'draw-agreement':
      return 'Game drawn by agreement'
  }
}

function timeControlTag(time: GameTime | undefined): string {
  if (!time) {
    return '-'
  }

  return `${time.minutes * 60}+${time.secondsIncrement}`
}

// PGN dates are YYYY.MM.DD from local components, zero-padded.
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}

// PGN string tag values escape backslash and quote (PGN spec 8.1.1).
function escapeHeader(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

export function resultToken(result: GameResult | null): string {
  if (!result) {
    return '*'
  }

  if (result.winner === 'white') {
    return '1-0'
  }

  if (result.winner === 'black') {
    return '0-1'
  }

  return '1/2-1/2'
}

export function buildMovetext(moves: Move[], result: GameResult | null): string {
  const tokens: string[] = []
  moves.forEach((move, index) => {
    if (index % 2 === 0) {
      tokens.push(`${index / 2 + 1}.`)
    }

    tokens.push(move.san)
  })
  tokens.push(resultToken(result))

  return wrapTokens(tokens)
}

// Joins tokens into lines of at most MAX_LINE columns, breaking only between tokens.
function wrapTokens(tokens: string[]): string {
  const lines: string[] = []
  let line = ''
  for (const token of tokens) {
    if (line === '') {
      line = token
    } else if (line.length + 1 + token.length > MAX_LINE) {
      lines.push(line)
      line = token
    } else {
      line += ` ${token}`
    }
  }

  if (line !== '') {
    lines.push(line)
  }

  return lines.join('\n')
}
