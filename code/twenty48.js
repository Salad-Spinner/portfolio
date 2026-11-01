// Core horizontal merge logic from the 2048 game.
// `score`, `grid`, `moves` and the rendering helpers live in the page scope.

function slide(row) {
    const values = row.filter((value) => value !== 0);
    const result = [];

    for (let i = 0; i < values.length; i++) {
        if (i + 1 < values.length && values[i] === values[i + 1]) {
            const merged = values[i] * 2;
            result.push(merged);
            score += merged;
            i++;
        } else {
            result.push(values[i]);
        }
    }

    while (result.length < 4) result.push(0);
    return result;
}

function move(direction) {
    if (gameOver) return;

    let moved = false;
    const scoreBefore = score;

    for (let row = 0; row < 4; row++) {
        const original = grid[row].slice();
        let line = original.slice();

        if (direction === 'right') line.reverse();
        let merged = slide(line);
        if (direction === 'right') merged.reverse();

        if (merged.join(',') !== original.join(',')) moved = true;
        grid[row] = merged;
    }

    if (!moved) {
        score = scoreBefore;
        return;
    }

    moves++;
    addRandomTile();
    updateHud();
    render();

    if (isGameOver()) endGame();
}
