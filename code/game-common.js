(function () {
    const body = document.body;
    const key = body.dataset.gameKey || '';
    const loggedIn = body.dataset.loggedIn === '1';
    const redirect = body.dataset.redirect || '';
    const justLoggedIn = body.dataset.justLoggedIn === '1';
    const toastEl = document.getElementById('toast');
    let toastTimer = null;

    function showToast(message, duration) {
        if (!toastEl) return;
        toastEl.textContent = message;
        toastEl.classList.add('is-visible');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            toastEl.classList.remove('is-visible');
        }, duration || 2400);
    }

    function goToLogin() {
        window.location.href = '../login.php?redirect=' + encodeURIComponent(redirect);
    }

    function requireLogin() {
        if (loggedIn) return true;
        showToast('Log in to save your progress');
        setTimeout(goToLogin, 650);
        return false;
    }

    async function saveProgress(progress) {
        if (!requireLogin()) return null;
        try {
            const response = await fetch('../api/save_progress.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ game_key: key, progress: progress })
            });
            const json = await response.json();
            if (!json.success) {
                showToast('Save failed: ' + (json.error || 'unknown error'));
                return null;
            }
            showToast(json.high_score_updated ? 'New world record!' : 'Progress saved');
            fetchWorldHigh();
            return json;
        } catch (error) {
            showToast('Could not save. Try again.');
            return null;
        }
    }

    async function loadProgress() {
        if (!requireLogin()) return null;
        try {
            const response = await fetch('../api/load_progress.php?game_key=' + encodeURIComponent(key));
            const json = await response.json();
            if (json.success && json.progress) {
                showToast('Progress loaded');
                return json.progress;
            }
            showToast('No saved progress yet');
            return null;
        } catch (error) {
            showToast('Could not load progress');
            return null;
        }
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[character];
        });
    }

    async function fetchWorldHigh() {
        if (!key) return;
        try {
            const response = await fetch('../api/get_world_high_score.php?game_key=' + encodeURIComponent(key), { cache: 'no-store' });
            const json = await response.json();
            if (!json.success) return;

            const scores = Array.isArray(json.scores) ? json.scores : [];
            const top = scores.length ? scores[0].score : null;

            document.querySelectorAll('[data-world-high]').forEach(function (element) {
                element.textContent = top === null ? '—' : top;
            });

            const list = document.querySelector('[data-world-list]');
            if (list) {
                if (!scores.length) {
                    list.innerHTML = '<li class="muted">No scores yet — be the first!</li>';
                } else {
                    list.innerHTML = scores.map(function (entry, index) {
                        return '<li><span>' + (index + 1) + '. ' + escapeHtml(entry.username || 'Unknown') +
                            '</span><strong>' + escapeHtml(entry.score) + '</strong></li>';
                    }).join('');
                }
            }
        } catch (error) {
            /* High scores are optional; ignore network errors. */
        }
    }

    function bindSaveLoad(getState, applyState) {
        const saveButton = document.getElementById('saveBtn');
        const loadButton = document.getElementById('loadBtn');

        if (saveButton) {
            saveButton.addEventListener('click', function () {
                saveProgress(getState());
            });
        }

        if (loadButton) {
            loadButton.addEventListener('click', async function () {
                const progress = await loadProgress();
                if (progress) applyState(progress);
            });
        }
    }

    function onJustLoggedIn(callback) {
        if (!justLoggedIn) return;
        if (document.readyState === 'complete') {
            callback();
        } else {
            window.addEventListener('load', callback);
        }
    }

    window.AHLF = {
        key: key,
        loggedIn: loggedIn,
        showToast: showToast,
        requireLogin: requireLogin,
        saveProgress: saveProgress,
        loadProgress: loadProgress,
        fetchWorldHigh: fetchWorldHigh,
        bindSaveLoad: bindSaveLoad,
        onJustLoggedIn: onJustLoggedIn
    };
})();
