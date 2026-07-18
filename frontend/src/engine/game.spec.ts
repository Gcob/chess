import {describe, it, expect} from 'vitest'
import {
  acceptDraw,
  declineDraw,
  flagTimeout,
  halfmovesSinceProgress,
  makeMove,
  offerDraw,
  oppositeColor,
  remainingSeconds,
  resign,
  startGame,
} from './game'
import {applyMove} from './move'
import {createGameSession} from '@/composables/factories/gameFactory'
import {keepOnly} from '@/test/board'
import type {CreateGamePayload, Game, SquareKey} from '@/types/chess'

const T0 = 1_700_000_000_000

const payload: CreateGamePayload = {
  mode: 'local',
  players: {white: {name: 'Alice', avatar: 'circle'}, black: {name: 'Bob', avatar: 'square'}},
}

function untimedGame(): Game {
  return createGameSession(payload, 'test-id').game
}

// 10 min + 5 s increment
function timedGame(): Game {
  return createGameSession({...payload, time: {minutes: 10, secondsIncrement: 5}}, 'test-id').game
}

describe('oppositeColor', () => {
  it('flips both colors', () => {
    expect(oppositeColor('white')).toBe('black')
    expect(oppositeColor('black')).toBe('white')
  })
})

describe('startGame', () => {
  it('activates a waiting game and stamps the clocks', () => {
    const game = untimedGame()
    startGame(game, T0)
    expect(game.status).toBe('active')
    expect(game.startedAt).toEqual(new Date(T0))
    expect(game.turnStartedAt).toBe(T0)
  })

  it('is a no-op on an active game', () => {
    const game = untimedGame()
    startGame(game, T0)
    startGame(game, T0 + 1000)
    expect(game.turnStartedAt).toBe(T0)
  })

  it('is a no-op on a finished game', () => {
    const game = untimedGame()
    resign(game, 'white')
    startGame(game, T0)
    expect(game.status).toBe('finished')
  })
})

describe('makeMove', () => {
  it('auto-starts a waiting game on the first move', () => {
    const game = untimedGame()
    makeMove(game, 'e2', 'e4', T0)
    expect(game.status).toBe('active')
    expect(game.startedAt).toEqual(new Date(T0))
    expect(game.moves).toHaveLength(1)
  })

  it('refuses to move on a finished game', () => {
    const game = untimedGame()
    resign(game, 'white')
    makeMove(game, 'e2', 'e4', T0)
    expect(game.moves).toHaveLength(0)
  })

  it('enforces the turn — only the active color may move', () => {
    const game = untimedGame()
    makeMove(game, 'e7', 'e5', T0) // black piece on white's turn
    expect(game.moves).toHaveLength(0)
    expect(game.board.squares.e7.piece?.id).toBe('Pe7')
  })

  it('refuses an empty origin square', () => {
    const game = untimedGame()
    makeMove(game, 'e4', 'e5', T0)
    expect(game.moves).toHaveLength(0)
  })

  it('does not auto-start a waiting game on an invalid attempt', () => {
    const game = untimedGame()
    makeMove(game, 'e4', 'e5', T0) // empty origin
    makeMove(game, 'e7', 'e5', T0) // wrong color
    makeMove(game, 'e2', 'e2', T0) // non-move
    expect(game.status).toBe('waiting')
    expect(game.startedAt).toBeNull()
    expect(game.turnStartedAt).toBeNull()
  })

  it('flips the active color after a move', () => {
    const game = untimedGame()
    makeMove(game, 'e2', 'e4', T0)
    expect(game.activeColor).toBe('black')
    makeMove(game, 'e7', 'e5', T0 + 1000)
    expect(game.activeColor).toBe('white')
  })

  it('records the move with naive SAN', () => {
    const game = untimedGame()
    makeMove(game, 'e2', 'e4', T0)
    makeMove(game, 'g8', 'f6', T0 + 1000)
    expect(game.moves.map(m => m.san)).toEqual(['e4', 'Nf6'])
    expect(game.moves[0]).toMatchObject({color: 'white', from: 'e2', to: 'e4'})
  })

  it('records a capture with SAN x notation', () => {
    const game = untimedGame()
    makeMove(game, 'e2', 'e4', T0)
    makeMove(game, 'd7', 'd5', T0)
    makeMove(game, 'e4', 'd5', T0)
    const move = game.moves[2]!
    expect(move.san).toBe('exd5')
    expect(move.capture?.capturedPiece.id).toBe('Pd7')
  })

  it('uses the piece letter in a capture SAN', () => {
    const game = untimedGame()
    makeMove(game, 'b1', 'c3', T0)
    makeMove(game, 'd7', 'd5', T0)
    makeMove(game, 'c3', 'd5', T0)
    expect(game.moves[2]!.san).toBe('Nxd5')
  })

  it('updates the isInCheck snapshot as checks appear and get blocked', () => {
    const game = untimedGame()
    makeMove(game, 'e2', 'e4', T0)
    makeMove(game, 'd7', 'd5', T0)
    makeMove(game, 'f1', 'b5', T0) // Bb5+ through the freed d7 square
    expect(game.players.black.isInCheck).toBe(true)
    expect(game.players.white.isInCheck).toBe(false)

    makeMove(game, 'c7', 'c6', T0) // blocks the diagonal
    expect(game.players.black.isInCheck).toBe(false)
  })

  it('records elapsed seconds per move', () => {
    const game = untimedGame()
    makeMove(game, 'e2', 'e4', T0)
    makeMove(game, 'e7', 'e5', T0 + 8000)
    expect(game.moves[0]!.elapsedSeconds).toBe(0)
    expect(game.moves[1]!.elapsedSeconds).toBe(8)
  })

  it('debits the elapsed time and adds the increment to the mover clock', () => {
    const game = timedGame()
    makeMove(game, 'e2', 'e4', T0)
    makeMove(game, 'e7', 'e5', T0 + 8000)
    // black: 600 - 8 elapsed + 5 increment
    expect(game.players.black.timer?.secondsRemaining).toBe(597)
    expect(game.players.white.timer?.secondsRemaining).toBe(605)
  })

  it('turns a move on an expired clock into a timeout', () => {
    const game = timedGame()
    makeMove(game, 'e2', 'e4', T0)
    makeMove(game, 'e7', 'e5', T0 + 700_000) // black took 700 s of a 600 s clock
    expect(game.status).toBe('finished')
    expect(game.result).toEqual({winner: 'white', reason: 'timeout'})
    expect(game.moves).toHaveLength(1)
    expect(game.board.squares.e7.piece?.id).toBe('Pe7')
  })

  it('declines a pending draw offer', () => {
    const game = untimedGame()
    makeMove(game, 'e2', 'e4', T0)
    offerDraw(game, 'black')
    makeMove(game, 'e7', 'e5', T0 + 1000)
    expect(game.drawOffer).toBeNull()
    expect(game.status).toBe('active')
  })
})

describe('resign', () => {
  it('finishes the game with the opponent as winner', () => {
    const game = untimedGame()
    startGame(game, T0)
    resign(game, 'white')
    expect(game.status).toBe('finished')
    expect(game.result).toEqual({winner: 'black', reason: 'resignation'})
    expect(game.turnStartedAt).toBeNull()
  })

  it('works on a waiting game', () => {
    const game = untimedGame()
    resign(game, 'black')
    expect(game.result).toEqual({winner: 'white', reason: 'resignation'})
  })

  it('is a no-op on a finished game', () => {
    const game = untimedGame()
    resign(game, 'white')
    resign(game, 'black')
    expect(game.result?.winner).toBe('black')
  })
})

describe('draw offers', () => {
  function activeGame(): Game {
    const game = untimedGame()
    startGame(game, T0)
    return game
  }

  it('registers an offer on an active game', () => {
    const game = activeGame()
    offerDraw(game, 'white')
    expect(game.drawOffer).toBe('white')
  })

  it('refuses an offer while one is pending', () => {
    const game = activeGame()
    offerDraw(game, 'white')
    offerDraw(game, 'black')
    expect(game.drawOffer).toBe('white')
  })

  it('refuses an offer on a waiting or finished game', () => {
    const waiting = untimedGame()
    offerDraw(waiting, 'white')
    expect(waiting.drawOffer).toBeNull()

    const finished = activeGame()
    resign(finished, 'white')
    offerDraw(finished, 'black')
    expect(finished.drawOffer).toBeNull()
  })

  it('accepting ends the game as a draw', () => {
    const game = activeGame()
    offerDraw(game, 'white')
    acceptDraw(game)
    expect(game.status).toBe('finished')
    expect(game.result).toEqual({winner: null, reason: 'draw-agreement'})
    expect(game.drawOffer).toBeNull()
  })

  it('accepting without a pending offer is a no-op', () => {
    const game = activeGame()
    acceptDraw(game)
    expect(game.status).toBe('active')
  })

  it('declining clears the offer and play continues', () => {
    const game = activeGame()
    offerDraw(game, 'white')
    declineDraw(game)
    expect(game.drawOffer).toBeNull()
    expect(game.status).toBe('active')
  })
})

describe('flagTimeout', () => {
  it('finishes the game and settles the clock at 0', () => {
    const game = timedGame()
    startGame(game, T0)
    flagTimeout(game, 'white')
    expect(game.status).toBe('finished')
    expect(game.result).toEqual({winner: 'black', reason: 'timeout'})
    expect(game.players.white.timer?.secondsRemaining).toBe(0)
  })

  it('scores a draw when the opponent of the flag cannot mate — the flag rule', () => {
    const game = timedGame()
    keepOnly(game.board, ['e1', 'd1', 'e8']) // white Ke1 + Qd1 vs a lone black king
    startGame(game, T0)
    flagTimeout(game, 'white') // white flags: black has no mating material
    expect(game.status).toBe('finished')
    expect(game.result).toEqual({winner: null, reason: 'timeout'})
  })

  it('is a no-op on an untimed game', () => {
    const game = untimedGame()
    startGame(game, T0)
    flagTimeout(game, 'white')
    expect(game.status).toBe('active')
  })

  it('is a no-op on a finished game', () => {
    const game = timedGame()
    startGame(game, T0)
    resign(game, 'white')
    flagTimeout(game, 'black')
    expect(game.result?.reason).toBe('resignation')
  })
})

describe('remainingSeconds', () => {
  it('returns null for an untimed game', () => {
    const game = untimedGame()
    startGame(game, T0)
    expect(remainingSeconds(game, 'white', T0)).toBeNull()
  })

  it('subtracts the running turn time for the color on the move only', () => {
    const game = timedGame()
    startGame(game, T0)
    expect(remainingSeconds(game, 'white', T0 + 30_000)).toBe(570)
    expect(remainingSeconds(game, 'black', T0 + 30_000)).toBe(600)
  })

  it('is frozen once the game is finished', () => {
    const game = timedGame()
    startGame(game, T0)
    resign(game, 'white')
    expect(remainingSeconds(game, 'white', T0 + 60_000)).toBe(600)
  })

  it('never goes below zero', () => {
    const game = timedGame()
    startGame(game, T0)
    expect(remainingSeconds(game, 'white', T0 + 700_000)).toBe(0)
  })
})

function playMoves(game: Game, moves: Array<[SquareKey, SquareKey]>): void {
  for (const [from, to] of moves) {
    makeMove(game, from, to, T0)
  }
}

describe('halfmovesSinceProgress', () => {
  it('counts quiet moves and resets on a pawn move', () => {
    const game = untimedGame()
    playMoves(game, [['b1', 'c3'], ['b8', 'c6']])
    expect(halfmovesSinceProgress(game)).toBe(2)
    playMoves(game, [['e2', 'e4']])
    expect(halfmovesSinceProgress(game)).toBe(0)
  })

  it('resets on a capture', () => {
    const game = untimedGame()
    playMoves(game, [['e2', 'e4'], ['d7', 'd5'], ['b1', 'c3'], ['b8', 'c6']])
    expect(halfmovesSinceProgress(game)).toBe(2)
    playMoves(game, [['c3', 'd5']]) // knight takes the pawn
    expect(halfmovesSinceProgress(game)).toBe(0)
  })
})

describe('makeMove — automatic endings', () => {
  it('ends on checkmate — scholar\'s mate, white wins', () => {
    const game = untimedGame()
    playMoves(game, [
      ['e2', 'e4'], ['e7', 'e5'],
      ['f1', 'c4'], ['b8', 'c6'],
      ['d1', 'h5'], ['g8', 'f6'],
      ['h5', 'f7'],
    ])
    expect(game.status).toBe('finished')
    expect(game.result).toEqual({winner: 'white', reason: 'checkmate'})
    expect(game.players.black.isInCheck).toBe(true)
  })

  it('refuses any move after the mate', () => {
    const game = untimedGame()
    playMoves(game, [
      ['e2', 'e4'], ['e7', 'e5'],
      ['f1', 'c4'], ['b8', 'c6'],
      ['d1', 'h5'], ['g8', 'f6'],
      ['h5', 'f7'],
    ])
    makeMove(game, 'a7', 'a6', T0)
    expect(game.moves).toHaveLength(7)
  })

  it('ends on checkmate — fool\'s mate, black wins', () => {
    const game = untimedGame()
    playMoves(game, [
      ['f2', 'f3'], ['e7', 'e5'],
      ['g2', 'g4'], ['d8', 'h4'],
    ])
    expect(game.status).toBe('finished')
    expect(game.result).toEqual({winner: 'black', reason: 'checkmate'})
  })

  it('ends on stalemate — no legal reply, no check', () => {
    const game = untimedGame()
    // Sparse ending: white Ke1 + Qb1 vs a lone black Ka8. Qb6 then seals a7/b7/b8.
    keepOnly(game.board, ['e1', 'd1', 'e8'])
    applyMove(game.board, 'd1', 'b1')
    applyMove(game.board, 'e8', 'a8')
    makeMove(game, 'b1', 'b6', T0)
    expect(game.status).toBe('finished')
    expect(game.result).toEqual({winner: null, reason: 'stalemate'})
    expect(game.players.black.isInCheck).toBe(false)
  })

  it('ends on insufficient material — the capture leaves a dead position', () => {
    const game = untimedGame()
    keepOnly(game.board, ['e1', 'e8', 'c1', 'd7'])
    applyMove(game.board, 'd7', 'd2') // the black pawn checks the white king…
    makeMove(game, 'c1', 'd2', T0) // …the bishop takes it: K+B vs K, dead position
    expect(game.status).toBe('finished')
    expect(game.result).toEqual({winner: null, reason: 'insufficient-material'})
  })

  it('ends on the fifty-move rule — 100 quiet half-moves', () => {
    const game = untimedGame()
    // Knight shuffle: 4 quiet half-moves per cycle, 25 cycles = exactly 100.
    for (let cycle = 0; cycle < 25; cycle++) {
      playMoves(game, [['b1', 'c3'], ['b8', 'c6'], ['c3', 'b1'], ['c6', 'b8']])
    }
    expect(game.moves).toHaveLength(100)
    expect(game.status).toBe('finished')
    expect(game.result).toEqual({winner: null, reason: 'fifty-move-rule'})
  })

  it('stays active one half-move before the fifty-move limit', () => {
    const game = untimedGame()
    for (let cycle = 0; cycle < 24; cycle++) {
      playMoves(game, [['b1', 'c3'], ['b8', 'c6'], ['c3', 'b1'], ['c6', 'b8']])
    }
    playMoves(game, [['b1', 'c3'], ['b8', 'c6'], ['c3', 'b1']]) // 99
    expect(game.status).toBe('active')
  })

  it('leaves the game running on a simple check', () => {
    const game = untimedGame()
    playMoves(game, [['e2', 'e4'], ['f7', 'f5'], ['d1', 'h5']]) // Qh5+, blockable
    expect(game.status).toBe('active')
    expect(game.players.black.isInCheck).toBe(true)
    makeMove(game, 'g7', 'g6', T0) // the block — play resumes normally
    expect(game.status).toBe('active')
    expect(game.players.black.isInCheck).toBe(false)
  })
})
