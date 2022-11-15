export default class Square {

    constructor(isDark, row, col, squaresContainerEl) {
        this.isDark = isDark
        this.row = row
        this.col = col
        this.rowChar = String.fromCharCode(97 + row)
        this.squaresContainerEl = squaresContainerEl

        squaresContainerEl.insertAdjacentHTML("beforeend", `
            <div 
                class="square ${isDark ? " dark" : ""}"
                data-row=""
                data-col=""
                title="${this.rowChar + this.col}"
            ></div>
        `);
    }

}