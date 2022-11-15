let idCounter = 0

export default class Piece {

    constructor(square, type, isDark, board) {
        this.square = square
        this.type = type
        this.isDark = isDark
        this.id = idCounter++

        board.piecesContainer.insertAdjacentHTML("beforeend", `<div class="piece ${type}${isDark ? " dark" : ""}" data-piece-id="${this.id}"></div>`)
        this.pieceEl = board.piecesContainer.querySelector(`.piece[data-piece-id="${this.id}"]`)

        this.moveToPosition()
    }

    getId() {
        return this.id
    }

    moveToPosition(transitionDuration = 0) {
        setTimeout(()=>{
            const oneSizeUnit = this.pieceEl.offsetWidth
            this.pieceEl.style.top = ((7 - this.square.col) * oneSizeUnit) + "px"
            this.pieceEl.style.left = (this.square.row * oneSizeUnit) + "px"
        },1)
    }

}