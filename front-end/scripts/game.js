import Board from "./board";
import Piece from "./piece";

export default class Game {
    isWhitesTurn = false
    pieces = []

    constructor() {
        this.board = new Board(document.querySelector(".board"))

        for (let i = 0; i < 8; i++) {
            this.pieces.push(new Piece(this.board.getSquareByPos(i, 1), "pawn", false, this.board))
            this.pieces.push(new Piece(this.board.getSquareByPos(i, 6), "pawn", true, this.board))
        }

        this.pieces.push(new Piece(this.board.getSquareById("a1"), "rook", false, this.board))
        this.pieces.push(new Piece(this.board.getSquareById("h1"), "rook", false, this.board))
        this.pieces.push(new Piece(this.board.getSquareById("a8"), "rook", true, this.board))
        this.pieces.push(new Piece(this.board.getSquareById("h8"), "rook", true, this.board))

        this.pieces.push(new Piece(this.board.getSquareById("b1"), "knight", false, this.board))
        this.pieces.push(new Piece(this.board.getSquareById("g1"), "knight", false, this.board))
        this.pieces.push(new Piece(this.board.getSquareById("b8"), "knight", true, this.board))
        this.pieces.push(new Piece(this.board.getSquareById("g8"), "knight", true, this.board))

        this.pieces.push(new Piece(this.board.getSquareById("c1"), "bishop", false, this.board))
        this.pieces.push(new Piece(this.board.getSquareById("f1"), "bishop", false, this.board))
        this.pieces.push(new Piece(this.board.getSquareById("c8"), "bishop", true, this.board))
        this.pieces.push(new Piece(this.board.getSquareById("f8"), "bishop", true, this.board))

        this.pieces.push(new Piece(this.board.getSquareById("d1"), "queen", false, this.board))
        this.pieces.push(new Piece(this.board.getSquareById("d8"), "queen", true, this.board))

        this.pieces.push(new Piece(this.board.getSquareById("e1"), "king", false, this.board))
        this.pieces.push(new Piece(this.board.getSquareById("e8"), "king", true, this.board))

        console.log(this.board.getSquareById("e8").getHTMLElement())

        this.updateTurn()
    }

    updateTurn() {
        this.isWhitesTurn = !this.isWhitesTurn
        document.querySelector(".info-container .turn").innerHTML = this.isWhitesTurn ? "blancs" : "noirs"
    }
}