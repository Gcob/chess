import type {Board, MoveTypeId, PieceColor, PieceType, Square, SquareKey} from '@/types/chess'

// ─── Pure move logic ───────────────────────────────────────────────────────────
// Vue-agnostic. Could one day live in a backend shared by both players.
//
// Rules are being filled in incrementally. Everything not yet checked (piece movement
// patterns, turns, check…) is still permitted — for now only the basics below apply.


export function canMove(board: Board, from: SquareKey, to: SquareKey): boolean {
  const piece = board.squares[from].piece
  if (!piece) {
    return false
  }

  if (from === to) {
    return false
  }

  // Can't capture your own piece.
  const target = board.squares[to].piece
  if (target && target.color === piece.color) {
    return false
  }

  const pieceMoveTypes = getPieceMoveTypes(piece.type)
  const availableSquares = getSquaresRelativeToMoveTypes(board, from, to, pieceMoveTypes, piece.color)
  console.log(availableSquares)
  return availableSquares.some(square => square == to);
}

// Applies a move in place. Overwriting the target square is how a capture happens.
export function applyMove(board: Board, from: SquareKey, to: SquareKey): void {
  const piece = board.squares[from].piece
  if (!piece) {
    return
  }

  board.squares[to].piece = piece
  board.squares[from].piece = null
  piece.hasMoved = true
}

function getPieceMoveTypes(pieceType: PieceType): MoveTypeId[] {
  switch (pieceType) {
    case 'king':
      return ['simple', 'castling'];
    case 'pawn':
      return ['linear-forward', 'linear-forward-double', 'diagonal-forward-capture', 'en-passant', 'promotion'];
    case 'queen':
      return ['diagonal', 'linear'];
    case 'rook':
      return ['linear'];
    case 'bishop':
      return ['diagonal'];
    case 'knight':
      return ['l-shape'];
    default:
      return [];
  }
}

function getSquaresRelativeToMoveTypes(board: Board, from: SquareKey, to: SquareKey, pieceMoveTypes: MoveTypeId[], color: PieceColor): SquareKey[] {
  const departureSquare = board.squares[from]
  let squares = []

  pieceMoveTypes.forEach((type: MoveTypeId) => {
    switch (type) {
      case 'linear-forward':
        squares = squares.concat(getAvailableSquaresForLinearForward(board, departureSquare, color))
        break
      case 'linear-forward-double':
        squares = squares.concat(getAvailableSquaresForLinearForwardDouble(board, departureSquare, color))
        break
    }
  })

  return squares.map((square: Square) => square.file + square.rank)
}

function getAvailableSquaresForLinearForward(board: Board, from: Square, color: PieceColor): Square[] {
  const nextSquare = color === 'white' ? from.neighbors.top : from.neighbors.bottom

  if (!nextSquare || nextSquare.piece) {
    return []
  }

  return [nextSquare]
}

function getAvailableSquaresForLinearForwardDouble(board: Board, from: Square, color: PieceColor): Square[] {
  if ((color === 'white' && from.rank !== 2) || (color === 'black' && from.rank !== 7)) {
    return []
  }

  const nextSquare = color === 'white' ? from.neighbors.top?.neighbors?.top : from.neighbors.bottom?.neighbors?.bottom

  if (!nextSquare || nextSquare.piece) {
    return []
  }

  return [nextSquare]
}
