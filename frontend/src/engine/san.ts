import {getBoardPieces} from './board'
import {canMove} from './move'
import type {MoveRecord} from './moveRecord'
import {PIECE_DATA} from './piece'

// ─── Standard Algebraic Notation ────────────────────────────────────────────────
// The move as chess writes it, read from the record of the move on the position it is played
// FROM — the same board the engine validated it against. Type-only import of MoveRecord: the
// notation is one of the record's answers, never a runtime dependency of it.
// Check and mate marks (+ / #) need the position AFTER the move: they join later.

export function buildSan(record: MoveRecord): string {
  const {piece, from, to, promotion, castling, capturedPiece} = record

  if (castling) {
    return castling === 'king-side' ? 'O-O' : 'O-O-O'
  }

  if (piece.type === 'pawn') {
    const base = capturedPiece ? `${from[0]}x${to}` : to
    return promotion ? `${base}=${PIECE_DATA[promotion].short}` : base
  }

  return `${PIECE_DATA[piece.type].short}${disambiguation(record)}${capturedPiece ? 'x' : ''}${to}`
}

// When another piece of the same kind could land on the same square, the departure is spelled
// out: its file if that alone tells them apart, else its rank, else the whole square. Pawns
// are exempt (a pawn capture already names its file) and so is the king (there is only one).
// Legality, not geometry — a pinned twin can't actually go there, so it creates no ambiguity.
function disambiguation({board, piece, from, to, enPassantTarget}: MoveRecord): string {
  if (piece.type === 'pawn' || piece.type === 'king') {
    return ''
  }

  const rivals = getBoardPieces(board)
    .filter(({piece: other, square}) =>
      square !== from
      && other.type === piece.type
      && other.color === piece.color
      && canMove(board, square, to, enPassantTarget),
    )
    .map(({square}) => square)

  if (rivals.length === 0) {
    return ''
  }

  if (rivals.every(square => square[0] !== from[0])) {
    return from[0]!
  }

  if (rivals.every(square => square[1] !== from[1])) {
    return from[1]!
  }

  return from
}
