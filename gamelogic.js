const HEADER = document.getElementById("header");
const GAME = document.getElementById("2048");
const RESTART = document.getElementById("restart");
const SCORE = document.getElementById("score");
const BEST = document.getElementById("best");

const CONFETTI = new JSConfetti();
const WIN = 2048;

let values = JSON.parse(localStorage.getItem("values")) || new Array(16).fill("");
let score = 0;
let best = Number(localStorage.getItem("bestScore")) || 0;
let won = false;

let swipeStartHandler, swipeEndHandler, keydownHandler;

const GRID = new Array(4); // Create 4x4 array

// --- Utility Functions ---
function syncHeaderWidth() {
    HEADER.style.width = `${GAME.getBoundingClientRect().width}px`;
}

function getTiles() {
    const children = GAME.children // Select all children of 2048
    const tiles = Array.from(children); // Convert HTML collection to array
    return tiles;
}

function saveValues() {
    values = getTiles().map(val => val.innerText || "");
    localStorage.setItem("values", JSON.stringify(values));
}

function isValuesEmpty() {
    const values = JSON.parse(localStorage.getItem("values")) || new Array(16).fill("");
    return values.every(val => val === ""); // Check if all values are empty
}

function isGridFull() {
    return ( getTiles().filter(val => val.innerText).length === 16 );
}

// --- Score Functions ---
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

// --- Tile/Board Functions ---
function changeTile(div, num, isNew = false, save = true) {
    div.innerText = num; // Set innerText
    div.className = num; // Set class name

    if (isNew) div.classList.add("new"); // Animate new tiles
    if (num === WIN) win(); // Call win() if tile meets win condition
    if (isGridFull()) checkGame(); // Check grid & game state
    if (save) saveValues(); // Save values
}

function randomTile() {
    const empty = getTiles().filter(div => div.innerText === ""); // Filter for empty divs
    if (empty.length === 0) return; // If no empty divs, return

    const randomDiv = empty[Math.floor(Math.random() * empty.length)]; // Select a random empty div
    const number = Math.random() < 0.9 ? 2 : 4; // If random number is less than 0.9, set number 2, else set to 4

    changeTile(randomDiv, number, true); // Change tile to random number
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

function move(direction) {
    const row = direction === "ArrowLeft" || direction === "ArrowRight";
    const reverse = direction === "ArrowRight" || direction === "ArrowDown";

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
            };
        }

    }

    randomTile(); // Add new tile if game hasn't ended and moves are available
}

// --- Game State Functions ---
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
        CONFETTI.addConfetti({ emojis: ['🤓'], emojiSize: 75 });
        won = true; // Set won to true
    }
}

function endGame() {
    // Remove event listeners to disable unnecessary input
    window.removeEventListener("keydown", play);
    removeSwipeListener();
    // Losers get pensive emoji-attacked
    CONFETTI.addConfetti({ emojis: ['😔'], emojiSize: 75 });
}

// --- Input Functions ---
function play(e) {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault(); // Prevent default scrolling behavior
        move(e.key); // Call move function with appropriate direction
    }
}

function addSwipeListener() {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    swipeStartHandler = function (e) {
        if (e.touches.length > 0) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }
    };

    swipeEndHandler = function (e) {
        if (e.changedTouches.length > 0) {
            touchEndX = e.changedTouches[0].clientX;
            touchEndY = e.changedTouches[0].clientY;

            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;

            if (Math.abs(dx) > Math.abs(dy)) {
                if (dx > 30) {
                    play({ key: "ArrowRight", preventDefault: () => {} });
                } else if (dx < -30) {
                    play({ key: "ArrowLeft", preventDefault: () => {} });
                }
            } else {
                if (dy > 30) {
                    play({ key: "ArrowDown", preventDefault: () => {} });
                } else if (dy < -30) {
                    play({ key: "ArrowUp", preventDefault: () => {} });
                }
            }
        }
    };

    window.addEventListener("touchstart", swipeStartHandler);
    window.addEventListener("touchend", swipeEndHandler);
    keydownHandler = play;
    window.addEventListener("keydown", keydownHandler);
}

function removeSwipeListener() {
    if (swipeStartHandler) window.removeEventListener("touchstart", swipeStartHandler);
    if (swipeEndHandler) window.removeEventListener("touchend", swipeEndHandler);
    if (keydownHandler) window.removeEventListener("keydown", keydownHandler);
}

// --- Initialization ---
function init(restart = false) { // Handles initializing game and restarts
    resetScore(); // Reset score

    if (!restart) { // Initialization logic
        for (let row = 0; row < GRID.length; row++) {
            GRID[row] = [];
            for (let col = 0 ; col < 4; col++) {
                // Creating divs
                const div = document.createElement("div");
                GRID[row][col] = div;
                GAME.appendChild(div);

                // Loading pre-existing tiles
                if (!isValuesEmpty()) {
                    const index = row * 4 + col;
                    const val = values[index];
                    changeTile(GRID[row][col], val, true, false);
                }
            }
        }

        // Add event listeners
        RESTART.addEventListener("click", () => init(true)); // For restart
        window.addEventListener("load", () => { // To sync header width on load
            syncHeaderWidth();
            setTimeout(syncHeaderWidth, 100);
        });
        window.addEventListener("resize", syncHeaderWidth); // To sync header witdh on resize

    } else { // Restart logic
        // Clear tiles
        const tiles = getTiles();
        tiles.forEach(tile => { changeTile(tile, ""); });
        won = false; // Reset flag
    }

    // Add event listener to play
    window.addEventListener("keydown", play);
    addSwipeListener(); // For swipe events

    // Start with 2 random tiles if there are no values saved
    if (isValuesEmpty()) {
        randomTile();
        randomTile();
    }

    saveValues();
}

// --- Start Game ---
init();
