(function () {
    const defaults = {
        color: '#fcfdff',
        radius: 10,
        spacing: 4,
        maxDots: 60,
        maxRaw: 8192,
        hold: 3000,
        fade: 600,
        resumeGap: 4000,
        ramp: 2,
        minStep: 0.5,
        flash: 5,
        flashColor: '#4da3ff',
        moveWithScroll: false,
        zIndex: 9999
    };
    const opts = Object.assign({}, defaults, window.CursorTrail);

    function parseColor(value) {
        const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value || '');

        if (!match) {
            return null;
        }

        let digits = match[1];

        if (digits.length === 3) {
            digits = digits.replace(/./g, (c) => c + c);
        }

        return [
            parseInt(digits.slice(0, 2), 16),
            parseInt(digits.slice(2, 4), 16),
            parseInt(digits.slice(4, 6), 16)
        ];
    }

    const baseRgb = parseColor(opts.color);
    const flashRgb = parseColor(opts.flashColor);

    function dotColor(index, lastIndex) {
        if (!opts.flash || !flashRgb || lastIndex < 1) {
            return opts.color;
        }

        const k = (lastIndex - index) / opts.flash;

        if (k <= 0) {
            return opts.flashColor;
        }

        if (k >= 1 || !baseRgb) {
            return opts.color;
        }

        const r = Math.round(flashRgb[0] + (baseRgb[0] - flashRgb[0]) * k);
        const g = Math.round(flashRgb[1] + (baseRgb[1] - flashRgb[1]) * k);
        const b = Math.round(flashRgb[2] + (baseRgb[2] - flashRgb[2]) * k);

        return `rgb(${r},${g},${b})`;
    }

    const raw = [];
    const pool = [];
    let layer = null;
    let live = null;
    let lastMove = 0;
    let outside = false;
    let lastScrollX = null;
    let lastScrollY = null;

    function stamp(event) {
        return typeof event.timeStamp === 'number' && event.timeStamp > 0
            ? event.timeStamp
            : performance.now();
    }

    function record(x, y, t) {
        const last = raw[raw.length - 1];

        if (last) {
            const dist = Math.hypot(x - last.x, y - last.y);

            if (dist < opts.minStep) {
                return;
            }

            if (dist > opts.maxDots * opts.spacing) {
                raw.length = 0;
            }
        }

        if (last && t - last.t > opts.resumeGap) {
            raw.length = 0;
        }

        raw.push({ x, y, t });

        if (raw.length > opts.maxRaw) {
            raw.shift();
        }

        lastMove = t;
    }

    function onMove(event) {
        if (outside) {
            outside = false;
            raw.length = 0;
        }

        const batch = event.getCoalescedEvents ? event.getCoalescedEvents() : null;

        if (batch && batch.length) {
            for (const point of batch) {
                record(point.clientX, point.clientY, stamp(point));
            }
        } else {
            record(event.clientX, event.clientY, stamp(event));
        }

        live = { x: event.clientX, y: event.clientY, t: stamp(event) };
    }

    function followScroll() {
        const sx = window.scrollX || 0;
        const sy = window.scrollY || 0;

        if (lastScrollX === null) {
            lastScrollX = sx;
            lastScrollY = sy;
            return;
        }

        const dx = sx - lastScrollX;
        const dy = sy - lastScrollY;

        lastScrollX = sx;
        lastScrollY = sy;

        if (!opts.moveWithScroll || (!dx && !dy)) {
            return;
        }

        for (let i = 0; i < raw.length; i++) {
            raw[i].x -= dx;
            raw[i].y -= dy;
        }
    }

    function trim() {
        const limit = opts.maxDots * opts.spacing;
        let walked = 0;

        for (let i = raw.length - 1; i > 0; i--) {
            walked += Math.hypot(raw[i].x - raw[i - 1].x, raw[i].y - raw[i - 1].y);

            if (walked > limit) {
                raw.splice(0, i);
                return;
            }
        }
    }

    function resample(points) {
        const dots = [];
        let since = 0;

        for (let i = 1; i < points.length; i++) {
            const a = points[i - 1];
            const b = points[i];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const span = Math.hypot(dx, dy);

            if (span < opts.minStep) {
                continue;
            }

            let d = opts.spacing - since;

            while (d <= span) {
                const step = d / span;
                dots.push({ x: a.x + dx * step, y: a.y + dy * step });
                d += opts.spacing;
            }

            since = span - (d - opts.spacing);
        }

        const newest = points[points.length - 1];
        const last = dots.length ? dots[dots.length - 1] : null;

        if (last && Math.hypot(newest.x - last.x, newest.y - last.y) < opts.minStep) {
            last.x = newest.x;
            last.y = newest.y;
        } else {
            dots.push({ x: newest.x, y: newest.y });
        }

        return dots;
    }

    function draw(dots, fade) {
        const lastIndex = dots.length - 1;

        for (let i = 0; i <= lastIndex; i++) {
            let element = pool[i];

            if (!element) {
                element = document.createElement('i');
                layer.appendChild(element);
                pool[i] = element;
            }

            const age = lastIndex > 0 ? i / lastIndex : 1;
            const color = dotColor(i, lastIndex);

            element.style.opacity = String(i === lastIndex ? 1 : fade);
            element.style.transform =
                `translate(${dots[i].x}px, ${dots[i].y}px) translate(-50%, -50%) scale(${Math.pow(age, opts.ramp)})`;

            if (element._color !== color) {
                element.style.background = color;
                element._color = color;
            }
        }

        for (let i = lastIndex + 1; i < pool.length; i++) {
            pool[i].style.opacity = '0';
        }
    }

    function tick(now) {
        followScroll();

        if (live) {
            record(live.x, live.y, live.t);
            live = null;
        }

        if (outside) {
            draw([], 1);
            requestAnimationFrame(tick);
            return;
        }

        trim();

        const idle = now - lastMove;
        let fade = 1;

        if (idle > opts.hold) {
            const elapsed = idle - opts.hold;
            fade = elapsed >= opts.fade ? 0 : 1 - elapsed / opts.fade;

            if (fade <= 0 && raw.length > 1) {
                raw.splice(0, raw.length - 1);
            }
        }

        const dots = raw.length ? resample(raw) : [];

        if (dots.length > opts.maxDots) {
            dots.splice(0, dots.length - opts.maxDots);
        }

        draw(dots, fade);

        requestAnimationFrame(tick);
    }

    function boot() {
        if (!document.body || document.querySelector('.ct-layer')) {
            return;
        }

        const style = document.createElement('style');
        style.textContent =
            '.ct-layer{position:fixed;inset:0;z-index:' + opts.zIndex +
            ';pointer-events:none;overflow:hidden}' +
            '.ct-layer i{position:absolute;top:0;left:0;width:' + opts.radius * 2 +
            'px;height:' + opts.radius * 2 +
            'px;box-sizing:border-box;background:' + opts.color +
            ';border-radius:50%;will-change:transform}';
        document.head.appendChild(style);

        layer = document.createElement('div');
        layer.className = 'ct-layer';
        document.body.appendChild(layer);

        addEventListener('pointermove', onMove, { passive: true });
        addEventListener('pointerleave', () => { outside = true; }, { passive: true });
        addEventListener('pointerout', (event) => {
            if (!event.relatedTarget) {
                outside = true;
            }
        }, { passive: true });

        requestAnimationFrame(tick);
    }

    if (document.body) {
        boot();
    } else {
        addEventListener('DOMContentLoaded', boot, { once: true });
    }
})();
