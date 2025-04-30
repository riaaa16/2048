const HEADER = document.getElementById("header");
const GAME = document.getElementById("2048");
const RESTART = document.getElementById("restart");
const SCORE = document.getElementById("score");
const BEST = document.getElementById("best");

const CONFETTI = new JSConfetti();
const WIN = 2048;

let score = 0;
let best = Number(localStorage.getItem("bestScore")) || 0;
let won = false;

const GRID = new Array(4); // Create 4x4 array

function syncHeaderWidth() {
    HEADER.style.width = `${GAME.getBoundingClientRect().width}px`;
}

function updateScore(num) {
    score += num; // Add to score
    SCORE.innerText = score; // Update score display

    if (score > best) { // If new best score, update best score
        best = score;
        BEST.innerText = best;
        localStorage.setItem("bestScore", best);
    }
}

function resetScore() {
    score = 0; // Reset score
    SCORE.innerText = score;
    BEST.innerText = best;
}

function init(restart = false) {
    resetScore(); // Reset score

    if (!restart) {
        // Adding divs to container and GRID
        for (let row = 0; row < GRID.length; row++) {
            GRID[row] = [];
            for (col = 0 ; col < 4; col++) {
                const div = document.createElement("div"); // Create div
                GRID[row][col] = div; // Add div to GRID
                GAME.appendChild(div); // Add div to container
            }
        }

        // Add event listener to restart game
        RESTART.addEventListener("click", () => init(true));

        // Sync after window load
        window.addEventListener("load", () => {
            syncHeaderWidth();
            setTimeout(syncHeaderWidth, 100);
        });

        // Sync on resize
        window.addEventListener("resize", syncHeaderWidth);

    } else { // Restart logic
        // Clear tiles
        const tiles = getTiles();
        tiles.forEach(tile => { changeTile(tile, ""); });
        // Reset won
        won = false;
    }

    // Add event listener for arrow key movements to play
    window.addEventListener("keydown", play);

    // Start with 2 random tiles)
    randomTile();
    randomTile();

}

function play(e) {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault(); // Prevent default scrolling behavior
        move(e.key); // Call move function with appropriate direction
    }
}

function getTiles() {
    const children = GAME.children // Select all children of 2048
    const tiles = Array.from(children); // Convert HTML collection to array
    return tiles;
}

function isGridFull() {
    return ( getTiles().filter(val => val.innerText).length === 16 );
}

function randomTile() {
    const empty = getTiles().filter(div => div.innerText === ""); // Filter for empty divs
    if (empty.length === 0) return; // If no empty divs, return

    const randomDiv = empty[Math.floor(Math.random() * empty.length)]; // Select a random empty div
    const number = Math.random() < 0.9 ? 2 : 4; // If random number is less than 0.9, set number 2, else set to 4

    changeTile(randomDiv, number, true); // Change tile to random number

    // If grid full, check for game over
    if (isGridFull()) { checkGame() };
}

function changeTile(div, num, isNew = false) {
    div.innerText = num; // Set innerText
    div.className = num; // Set class name

    if (isNew) {
        div.classList.add("new"); // Add new class to animate
    } else if (num === WIN) {
        win();
    }

}

function move(direction) {
    const row = direction === "ArrowLeft" || direction === "ArrowRight";
    const reverse = direction === "ArrowRight" || direction === "ArrowDown";
    let noMoves = true;

    for (let i = 0; i < 4 ; i++) {
        let line = [];

        for (let j = 0; j < 4 ; j++) {
            // Get tile
            // if LR = GRID[ROW][COL]
            // else if UD = GRID[COL][ROW]
            let tile = row ? GRID[i][j] : GRID[j][i];
            line.push(parseInt(tile.innerText)); // Add tile values to line
        }

        if (reverse) line.reverse(); // If moving right or down, reverse elements to iterate in correct direction
        let newLine = slideAndMerge(line); // Slide and merge values in line
        if (reverse) newLine.reverse(); // Reverse again to return to original order

        for (let j = 0; j < 4 ; j++) {
            // Get tile
            // if LR = GRID[ROW][COL]
            // else if UD = GRID[COL][ROW]
            let tile = row ? GRID[i][j] : GRID[j][i];
             // Update tile values if they are different
            if (tile.innerText != newLine[j]) {
                changeTile(tile, newLine[j]);
                noMoves = false; // Set noMoves to false
            };
        }

    }

    // If no moves can be made
    if (noMoves) {
        // If grid is full, check for game over
        if (isGridFull()) {
            checkGame();
        }
        return;
    }

    randomTile(); // Add new tile if game hasn't ended and moves are available
}

function slideAndMerge(line) {
    let newLine = line.filter(val => val); // Remove blanks

    for (let i = 0 ; i < newLine.length - 1; i++) { // Iterate through array
        if (newLine[i] === newLine[i + 1]) { // If values are the same, merge
            newLine[i]*=2; // Double first value
            newLine[i + 1] = ""; // Empty second value
            updateScore(newLine[i]); // Update score
        }
    }

    newLine = newLine.filter(val => val); // Filter again to get rid of spaces inbetween
    while (newLine.length < 4) newLine.push(""); // Add empty tiles to make array length 4

    return newLine;
}

function checkGame() {
    let gameOver = true;

    for (let row = 0; row <= 3; row++) {
        for (let col = 0; col <= 3; col++) {
            let current = GRID[row][col].innerText;
            // Check right neighbor
            if (col <= 2 && current === GRID[row][col + 1].innerText) {
                gameOver = false;
            }
            // Check bottom neighbor
            if (row <= 2 && current === GRID[row + 1][col].innerText) {
                gameOver = false;
            }
        }
    }

    if (gameOver) {
        endGame();
    } else if (getTiles().filter(val => parseInt(val.innerText) === WIN).length > 0) {
        win();
    }
}

function win() {
    if (!won) {
        // Winners get nerd emoji-attacked
        CONFETTI.addConfetti({
            emojis: ['🤓'],
            emojiSize: 75,
        });
        won = true; // Set won to true
    }
}

function endGame() {
    // GAME_OVER.classList.remove("hide"); // Show game over message
    window.removeEventListener("keydown", play); // Remove event listener for keydown

    // Losers get pensive emoji-attacked
    CONFETTI.addConfetti({
        emojis: ['😔'],
        emojiSize: 75,
    });
}

// Start game
init();