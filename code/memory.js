// Card matching and scoring from the Memory Match game.
// `deck`, `flipped`, `lock`, `moves` and `matchedPairs` live in the page scope.

const SYMBOLS = ['★', '●', '▲', '◆', '♥', '♣', '☀', '☂'];

function buildDeck() {
    return shuffle(SYMBOLS.concat(SYMBOLS)).map((symbol, index) => ({
        id: index,
        symbol: symbol,
        matched: false
    }));
}

function flip(index) {
    if (lock || finished || flipped.includes(index) || deck[index].matched) return;

    flipped.push(index);

    if (flipped.length < 2) {
        render();
        return;
    }

    moves++;
    const first = flipped[0];
    const second = flipped[1];

    if (deck[first].symbol === deck[second].symbol) {
        deck[first].matched = true;
        deck[second].matched = true;
        matchedPairs++;
        flipped = [];
        score = matchedPairs * 100;
        render();

        if (matchedPairs === SYMBOLS.length) finish();
    } else {
        lock = true;
        render();

        setTimeout(() => {
            flipped = [];
            lock = false;
            render();
        }, 760);
    }
}

function finish() {
    finished = true;
    score = matchedPairs * 100
        + Math.max(0, 300 - moves * 10)
        + Math.max(0, 240 - seconds * 2);
    updateHud();
    render();
    showOverlay('You found every pair!', 'Final score: ' + score + '.');
}
