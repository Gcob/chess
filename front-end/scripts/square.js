export default class Square {

    constructor(isDark, row, col, squaresContainerEl) {
        this.isDark = isDark
        this.rowChar = String.fromCharCode(97 + row)
        this.id = this.rowChar + col
        this.col = col - 1
        this.row = row
        this.squaresContainerEl = squaresContainerEl

        squaresContainerEl.insertAdjacentHTML("beforeend", `
            <div 
                class="square square-${this.id} ${isDark ? " dark" : ""}"
                title="${this.id}"
            ></div>
        `);
    }

    getHTMLElement() {
        return this.squaresContainerEl.querySelector(".square-" + this.id)
    }

}