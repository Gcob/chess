import {describe, it, expect} from 'vitest'
import {
  acceptDraw,
  declineDraw,
  enPassantTarget,
  flagTimeout,
  halfmovesSinceProgress,
  makeMove,
  offerDraw,
  oppositeColor,
  remainingSeconds,
  replayMoves,
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

describe('replayMoves', () => {
  it('replays a move list through the real engine', () => {
    const game = untimedGame()
    replayMoves(game, [['e2', 'e4'], ['d7', 'd5'], ['e4', 'd5']], T0)
    expect(game.moves.map(m => m.san)).toEqual(['e4', 'd5', 'exd5'])
    expect(game.activeColor).toBe('black')
    expect(game.status).toBe('active')
  })

  it('debits no clock time — every move replays on the same instant', () => {
    const game = timedGame()
    replayMoves(game, [['e2', 'e4'], ['e7', 'e5']], T0)
    // 600 base − 0 elapsed + the 5s per-move increment, exactly like an instant real move.
    expect(game.players.white.timer?.secondsRemaining).toBe(605)
    expect(game.players.black.timer?.secondsRemaining).toBe(605)
  })

  it('throws loudly on a refused move — a broken scenario must scream', () => {
    const game = untimedGame()
    expect(() => replayMoves(game, [['e2', 'e4'], ['e4', 'e5']], T0))
      .toThrowError(/e4-e5/)
    expect(game.moves).toHaveLength(1) // the legal prefix stands
  })
})

describe('enPassantTarget', () => {
  it('exposes the crossed square right after a double push, both colors', () => {
    const game = untimedGame()
    makeMove(game, 'e2', 'e4', T0)
    expect(enPassantTarget(game.moves)).toBe('e3')
    makeMove(game, 'd7', 'd5', T0)
    expect(enPassantTarget(game.moves)).toBe('d6')
  })

  it('expires on the very next move', () => {
    const game = untimedGame()
    playMoves(game, [['e2', 'e4'], ['g8', 'f6']])
    expect(enPassantTarget(game.moves)).toBeNull()
  })

  it('ignores single pushes and an empty history', () => {
    const game = untimedGame()
    expect(enPassantTarget(game.moves)).toBeNull()
    makeMove(game, 'e2', 'e3', T0)
    expect(enPassantTarget(game.moves)).toBeNull()
  })
})

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

  // Quiet non-repeating grind: each rook loops its own cycle (6 vs 10 squares — first full
  // coincidence at lcm = ply 60), so no position ever occurs 3 times before ply 100 and the
  // fifty-move rule is what fires. The rooks never check anybody from the a/b and g/h files.
  const WHITE_ROOK_CYCLE: SquareKey[] = ['a1', 'a2', 'a3', 'b3', 'b2', 'b1']
  const BLACK_ROOK_CYCLE: SquareKey[] = ['h8', 'h7', 'h6', 'h5', 'h4', 'g4', 'g5', 'g6', 'g7', 'g8']

  function grindQuietPlies(game: Game, plies: number): void {
    keepOnly(game.board, ['e1', 'a1', 'e8', 'h8'])
    for (let i = 0; i * 2 < plies; i++) {
      makeMove(game, WHITE_ROOK_CYCLE[i % 6]!, WHITE_ROOK_CYCLE[(i + 1) % 6]!, T0)
      if (i * 2 + 1 < plies) {
        makeMove(game, BLACK_ROOK_CYCLE[i % 10]!, BLACK_ROOK_CYCLE[(i + 1) % 10]!, T0)
      }
    }
  }

  it('ends on the fifty-move rule — 100 quiet half-moves', () => {
    const game = untimedGame()
    grindQuietPlies(game, 100)
    expect(game.moves).toHaveLength(100)
    expect(game.status).toBe('finished')
    expect(game.result).toEqual({winner: null, reason: 'fifty-move-rule'})
  })

  it('stays active one half-move before the fifty-move limit', () => {
    const game = untimedGame()
    grindQuietPlies(game, 99)
    expect(game.status).toBe('active')
  })

  it('ends on threefold repetition — the knight shuffle', () => {
    const game = untimedGame()
    // The starting position recurs after each 4-ply cycle: 3rd occurrence at ply 8.
    playMoves(game, [['b1', 'c3'], ['b8', 'c6'], ['c3', 'b1'], ['c6', 'b8']])
    playMoves(game, [['b1', 'c3'], ['b8', 'c6'], ['c3', 'b1']])
    expect(game.status).toBe('active') // 7 plies: only 2 occurrences so far
    playMoves(game, [['c6', 'b8']])
    expect(game.status).toBe('finished')
    expect(game.result).toEqual({winner: null, reason: 'threefold-repetition'})
  })

  it('tells identical placements apart by a live en passant right', () => {
    const game = untimedGame()
    // After 3. e4 the black d4 pawn could capture en passant — that position carries the
    // right; the knight shuffles rebuild the same placement without it.
    playMoves(game, [['a2', 'a3'], ['d7', 'd5'], ['h2', 'h3'], ['d5', 'd4'], ['e2', 'e4']])
    const cycle: Array<[SquareKey, SquareKey]> = [['g8', 'f6'], ['g1', 'f3'], ['f6', 'g8'], ['f3', 'g1']]
    playMoves(game, cycle)
    playMoves(game, cycle)
    expect(game.status).toBe('active') // ep-less placement seen twice only — no draw
    playMoves(game, cycle)
    expect(game.status).toBe('finished') // third ep-less occurrence
    expect(game.result).toEqual({winner: null, reason: 'threefold-repetition'})
  })

  it('tells identical placements apart by their castling rights', () => {
    const game = untimedGame()
    playMoves(game, [['g1', 'f3'], ['g8', 'f6']]) // knights out — h-rook rights still alive
    // Each h-rook round trip rebuilds the same placement, but the FIRST occurrence (right
    // after the knights came out) still carried castling rights: it does not count.
    playMoves(game, [['h1', 'g1'], ['h8', 'g8'], ['g1', 'h1'], ['g8', 'h8']])
    playMoves(game, [['h1', 'g1'], ['h8', 'g8'], ['g1', 'h1'], ['g8', 'h8']])
    expect(game.status).toBe('active') // rights-less placement seen twice only — no draw
    playMoves(game, [['h1', 'g1'], ['h8', 'g8']])
    expect(game.status).toBe('finished') // rooks-on-g placement: 3rd rights-identical occurrence
    expect(game.result).toEqual({winner: null, reason: 'threefold-repetition'})
  })

  it('records a castling move — rook brought over, side and SAN settled', () => {
    const game = untimedGame()
    playMoves(game, [['g1', 'f3'], ['g8', 'f6'], ['e2', 'e3'], ['e7', 'e6'], ['f1', 'e2'], ['f8', 'e7']])
    makeMove(game, 'e1', 'g1', T0) // white castles king-side
    expect(game.board.squares['g1'].piece?.type).toBe('king')
    expect(game.board.squares['f1'].piece?.id).toBe('Rh1')
    expect(game.moves[game.moves.length - 1]).toMatchObject({san: 'O-O', castling: 'king-side', from: 'e1', to: 'g1'})
  })

  it('records a queen-side castling as O-O-O', () => {
    const game = untimedGame()
    playMoves(game, [['d2', 'd4'], ['d7', 'd5'], ['c1', 'f4'], ['c8', 'f5'], ['b1', 'c3'], ['b8', 'c6'], ['d1', 'd2'], ['d8', 'd7']])
    makeMove(game, 'e1', 'c1', T0) // white castles queen-side
    expect(game.board.squares['c1'].piece?.type).toBe('king')
    expect(game.board.squares['d1'].piece?.id).toBe('Ra1')
    expect(game.moves[game.moves.length - 1]).toMatchObject({san: 'O-O-O', castling: 'queen-side'})
  })

  it('plays an en passant capture — victim recorded, marker and SAN settled', () => {
    const game = untimedGame()
    playMoves(game, [['e2', 'e4'], ['a7', 'a6'], ['e4', 'e5'], ['d7', 'd5']])
    makeMove(game, 'e5', 'd6', T0) // exd6 e.p.
    expect(game.moves[game.moves.length - 1]).toMatchObject({san: 'exd6', enPassant: true, from: 'e5', to: 'd6'})
    expect(game.moves[game.moves.length - 1]!.capture?.capturedPiece.id).toBe('Pd7')
    expect(game.board.squares['d5'].piece).toBeNull()
  })

  it('refuses an en passant one move too late', () => {
    const game = untimedGame()
    playMoves(game, [['e2', 'e4'], ['a7', 'a6'], ['e4', 'e5'], ['d7', 'd5'], ['h2', 'h3'], ['h7', 'h6']])
    makeMove(game, 'e5', 'd6', T0) // the right expired with black's quiet move
    expect(game.moves).toHaveLength(6)
  })

  it('sees the en passant escape — no false stalemate after a double push', () => {
    const game = untimedGame()
    keepOnly(game.board, ['e1', 'e8', 'd1', 'f7', 'f2', 'g2'])
    applyMove(game.board, 'e8', 'a8') // black king boxed by the queen…
    applyMove(game.board, 'd1', 'b6') // …covering a7, b7 and b8, without check
    applyMove(game.board, 'f7', 'f4') // black pawn — blocked ahead once f3 arrives
    applyMove(game.board, 'f2', 'f3')
    makeMove(game, 'g2', 'g4', T0) // the double push — fxg3 e.p. is black's ONLY move
    expect(game.status).toBe('active') // not a stalemate
    makeMove(game, 'f4', 'g3', T0)
    expect(game.board.squares['g4'].piece).toBeNull()
    expect(game.moves).toHaveLength(2)
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
