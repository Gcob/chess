export default class Board {
    boardEl

    constructor(boardEl) {
        this.boardEl = boardEl
        let isDarkSquare = false

        for (let i = 8; i > 0; i--) {
            for (let j = 0; j < 8; j++) {
                const rowChar = String.fromCharCode(97 + j)
                boardEl.insertAdjacentHTML("beforeend", `
                    <div 
                        class="square${isDarkSquare ? " dark" : ""}" 
                        data-row="${rowChar}" 
                        data-col="${i}"
                        title="${rowChar + i}"
                    ></div>
                `);
                isDarkSquare = !isDarkSquare
            }
            isDarkSquare = !isDarkSquare
        }
    }


}