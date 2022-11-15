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
        `);

        const squaresContainerEl = boardEl.querySelector(".squares-container")
        const lettersContainerEl = boardEl.querySelector(".letters-container")
        const numbersContainerEl = boardEl.querySelector(".numbers-container")

        for (let i = 1; i < 9; i++) {
            numbersContainerEl.insertAdjacentHTML("afterbegin", `<div class="number">${i}</div>`)
            lettersContainerEl.insertAdjacentHTML("beforeend", `<div class="letter">${String.fromCharCode(96 + i)}</div>`)
        }

        for (let i = 8; i > 0; i--) {
            for (let j = 0; j < 8; j++) {
                this.squares.push(new Square(isDarkSquare, j, i, squaresContainerEl))
                isDarkSquare = !isDarkSquare
            }
            isDarkSquare = !isDarkSquare
        }
    }


}