import Square from "./square";

export default class Board {
    boardEl
    squares = []

    constructor(boardEl) {
        this.boardEl = boardEl
        let isDarkSquare = false

        boardEl.insertAdjacentHTML("beforeend", `
            <div class="squares-container"></div>
            <div class="letters-container"></div>
            <div class="numbers-container"></div>
            <div class="pieces-container"></div>
        `);

        this.squaresContainerEl = boardEl.querySelector(".squares-container")
        this.lettersContainerEl = boardEl.querySelector(".letters-container")
        this.numbersContainerEl = boardEl.querySelector(".numbers-container")
        this.piecesContainer = boardEl.querySelector(".pieces-container")

        for (let i = 1; i < 9; i++) {
            this.numbersContainerEl.insertAdjacentHTML("afterbegin", `<div class="number">${i}</div>`)
            this.lettersContainerEl.insertAdjacentHTML("beforeend", `<div class="letter">${String.fromCharCode(96 + i)}</div>`)
        }

        for (let i = 8; i > 0; i--) {
            for (let j = 0; j < 8; j++) {
                this.squares.push(new Square(isDarkSquare, j, i, this.squaresContainerEl))
                isDarkSquare = !isDarkSquare
            }
            isDarkSquare = !isDarkSquare
        }
    }

    getSquareById(squareId) {
        return this.squares.find(s => s.id === squareId);
    }

    getSquareByPos(row, col) {
        return this.squares.find(s => s.row === row && s.col === col);
    }
}