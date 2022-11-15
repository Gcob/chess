import Board from "./board";

export default class Game {
    isWhitesTurn = false

    constructor() {
        this.board = new Board(document.querySelector(".board"))
        this.updateTurn()
    }

    updateTurn() {
        this.isWhitesTurn = !this.isWhitesTurn
        document.querySelector(".info-container .turn").innerHTML = this.isWhitesTurn ? "blancs" : "noirs"
    }
}