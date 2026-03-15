export default {
  app: {
    title: 'Chess Game',
  },
  common: {
    back: 'Back',
    close: 'Close',
  },
  settings: {
    title: 'Settings',
    toggleTheme: 'Toggle theme',
    theme: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    sound: 'Sound effects',
    boardTheme: 'Board theme',
    pieceStyle: 'Piece style'
  },
  home: {
    subtitle: 'A simple chess game built with Vue 3',
    playButton: 'New Game',
    rulesButton: "How to play"
  },
  newGame: {
    title: 'New Game',
    subtitle: 'Configure your game before starting.',
    startButton: 'Start',
  },
  chessRules: {
    title: "How to Play Chess",
    "objectiveTitle": "Objective",
    "objectiveText": "The goal of chess is to checkmate your opponent's king. This means the king is under attack and has no way to escape capture on the next move.",
    "setupTitle": "Board Setup",
    "setupText": "The board is an 8×8 grid with alternating light and dark squares. Each player starts with 16 pieces: one king, one queen, two rooks, two bishops, two knights, and eight pawns. The board is placed so each player has a light square in the bottom-right corner.",
    "piecesTitle": "How the Pieces Move",
    "king": "King ♚",
    "kingText": "Moves one square in any direction. The most important piece — if it's checkmated, you lose.",
    "queen": "Queen ♛",
    "queenText": "Moves any number of squares in any direction — horizontally, vertically, or diagonally. The most powerful piece on the board.",
    "rook": "Rook ♜",
    "rookText": "Moves any number of squares horizontally or vertically.",
    "bishop": "Bishop ♝",
    "bishopText": "Moves any number of squares diagonally. Each bishop stays on its starting color for the entire game.",
    "knight": "Knight ♞",
    "knightText": "Moves in an L-shape: two squares in one direction and one square perpendicular. The only piece that can jump over other pieces.",
    "pawn": "Pawn ♟",
    "pawnText": "Moves forward one square, or two squares from its starting position. Captures diagonally one square forward. If a pawn reaches the opposite end of the board, it must be promoted to another piece.",
    "specialTitle": "Special Moves",
    "castling": "Castling",
    "castlingText": "A special move involving the king and a rook. The king moves two squares toward a rook, and the rook jumps to the other side of the king. Only possible if neither piece has moved, the squares between them are empty, and the king is not in check or passing through check.",
    "enPassant": "En Passant",
    "enPassantText": "If a pawn moves two squares forward from its starting position and lands beside an opponent's pawn, the opponent can capture it as if it had moved only one square. This must be done immediately on the next move.",
    "promotion": "Promotion",
    "promotionText": "When a pawn reaches the opposite end of the board, it must be promoted to a queen, rook, bishop, or knight. Most players choose a queen.",
    "endTitle": "How the Game Ends",
    "endText": "The game ends by checkmate, resignation, or draw. A draw can occur by stalemate (no legal moves but not in check), threefold repetition, the fifty-move rule, insufficient material, or mutual agreement."
  }
}
