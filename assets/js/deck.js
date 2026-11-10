/* ===========================================
   SLIDE PRESENTATION CONTROLLER
   - ย่อ/ขยายเวที 1920×1080 ให้พอดีจอ (ไม่จัดเลย์เอาต์ใหม่)
   - ← → Space PageUp PageDown Home End / ปัดจอ / ล้อเมาส์
   - .frag = แสดงทีละขั้นภายในสไลด์เดียว
   - T = สารบัญ, F = เต็มจอ, URL #12 หรือ #id ไปสไลด์นั้นได้
   =========================================== */
(function () {
    'use strict';

    class SlidePresentation {
        constructor() {
            this.stage = document.getElementById('deckStage');
            this.slides = Array.from(this.stage.querySelectorAll(':scope > .slide'));
            this.current = 0;
            this.buildChrome();
            this.buildControls();
            this.setupStageScale();
            this.setupKeyboardNav();
            this.setupTouchNav();
            this.setupWheelNav();
            this.setupIdle();
            window.addEventListener('hashchange', () => this.fromHash());
            if (!this.fromHash()) this.show(0);
        }

        /* --- ใส่กรอบบน/ล่างและเลขหน้าให้ทุกสไลด์ (ยกเว้นปก)
               data-tag บนสไลด์ = ป้ายหัวข้อ ใช้ต่อไปจนกว่าจะเจอ data-tag ใหม่ --- */
        buildChrome() {
            const total = this.slides.length;
            const head = this.stage.dataset.head || '';
            const foot = this.stage.dataset.foot || '';
            let tag = '';
            this.slides.forEach((s, i) => {
                if (s.dataset.tag) tag = s.dataset.tag;
                if (s.classList.contains('cover')) return;
                if (!s.querySelector('.chrome.top')) {
                    s.insertAdjacentHTML('afterbegin', `<div class="chrome top"><span class="tag">${s.dataset.tag || tag}</span><span>${head}</span></div>`);
                }
                if (!s.querySelector('.chrome.bottom')) {
                    s.insertAdjacentHTML('beforeend', `<div class="chrome bottom"><span>${foot}</span><span class="pg"></span></div>`);
                }
                s.querySelector('.chrome .pg').textContent = (i + 1) + ' / ' + total;
            });
        }

        buildControls() {
            const bar = document.createElement('nav');
            bar.className = 'deck-controls';
            bar.setAttribute('aria-label', 'ควบคุมสไลด์');
            bar.innerHTML = `
                <button type="button" data-act="prev" aria-label="สไลด์ก่อนหน้า">◀</button>
                <span class="count" aria-live="polite"></span>
                <button type="button" data-act="next" aria-label="สไลด์ถัดไป">▶</button>
                <button type="button" data-act="toc" title="สารบัญ (T)">สารบัญ</button>
                <button type="button" data-act="full" title="เต็มจอ (F)">เต็มจอ</button>`;
            document.body.appendChild(bar);
            this.bar = bar;
            this.count = bar.querySelector('.count');
            bar.addEventListener('click', e => {
                const b = e.target.closest('button'); if (!b) return;
                ({ prev: () => this.prev(), next: () => this.next(), toc: () => this.toggleToc(), full: () => this.fullscreen() })[b.dataset.act]();
            });

            const prog = document.createElement('div');
            prog.className = 'deck-progress';
            document.body.appendChild(prog);
            this.prog = prog;

            /* สารบัญ */
            const toc = document.createElement('div');
            toc.className = 'toc';
            const items = this.slides.map((s, i) => {
                const t = s.dataset.title || (s.querySelector('h1,h2') || {}).textContent || ('สไลด์ ' + (i + 1));
                const sec = s.classList.contains('section') || s.classList.contains('cover');
                return `<li value="${i + 1}" data-i="${i}" class="${sec ? 'sec' : ''}">${t.replace(/\s+/g, ' ').trim()}</li>`;
            }).join('');
            toc.innerHTML = `<div class="toc-panel" role="dialog" aria-label="สารบัญสไลด์"><h3>สารบัญ — คลิกเพื่อไปยังสไลด์</h3><ol>${items}</ol></div>`;
            toc.addEventListener('click', e => {
                const li = e.target.closest('li[data-i]');
                if (li) { this.show(+li.dataset.i); this.toggleToc(false); }
                else if (e.target === toc) this.toggleToc(false);
            });
            document.body.appendChild(toc);
            this.toc = toc;
        }

        setupStageScale() {
            const scale = () => {
                const f = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
                const x = (window.innerWidth - 1920 * f) / 2;
                const y = (window.innerHeight - 1080 * f) / 2;
                this.stage.style.transform = `translate(${x}px, ${y}px) scale(${f})`;
            };
            scale();
            window.addEventListener('resize', scale);
        }

        setupKeyboardNav() {
            document.addEventListener('keydown', e => {
                if (e.target.closest('input, textarea, select, [contenteditable]')) return;
                if (e.ctrlKey || e.metaKey || e.altKey) return;
                const k = e.key;
                if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(k)) { e.preventDefault(); this.next(); }
                else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(k)) { e.preventDefault(); this.prev(); }
                else if (k === 'Home') this.show(0);
                else if (k === 'End') this.show(this.slides.length - 1);
                else if (k === 't' || k === 'T') this.toggleToc();
                else if (k === 'f' || k === 'F') this.fullscreen();
                else if (k === 'Escape') this.toggleToc(false);
            });
        }

        setupTouchNav() {
            let sx = 0, sy = 0;
            document.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
            document.addEventListener('touchend', e => {
                const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
                if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { dx < 0 ? this.next() : this.prev(); }
            });
        }

        setupWheelNav() {
            let lock = 0;
            document.addEventListener('wheel', e => {
                if (this.toc.classList.contains('open')) return;
                const now = Date.now();
                if (now - lock < 650 || Math.abs(e.deltaY) < 30) return;
                lock = now;
                e.deltaY > 0 ? this.next() : this.prev();
            }, { passive: true });
        }

        /* ซ่อนแถบควบคุมเมื่อไม่ขยับเมาส์ */
        setupIdle() {
            let t;
            const wake = () => { this.bar.classList.remove('idle'); clearTimeout(t); t = setTimeout(() => this.bar.classList.add('idle'), 2800); };
            ['mousemove', 'touchstart', 'keydown'].forEach(ev => document.addEventListener(ev, wake, { passive: true }));
            wake();
        }

        frags(i) { return Array.from(this.slides[i].querySelectorAll('.frag')); }

        next() {
            const hidden = this.frags(this.current).filter(f => !f.classList.contains('shown'));
            if (hidden.length) { hidden[0].classList.add('shown'); return; }
            if (this.current < this.slides.length - 1) this.show(this.current + 1);
        }

        prev() {
            const shown = this.frags(this.current).filter(f => f.classList.contains('shown'));
            if (shown.length) { shown[shown.length - 1].classList.remove('shown'); return; }
            if (this.current > 0) this.show(this.current - 1, true);
        }

        show(i, allFrags) {
            this.current = Math.max(0, Math.min(i, this.slides.length - 1));
            this.slides.forEach((s, j) => {
                const on = j === this.current;
                s.classList.toggle('active', on);
                s.classList.toggle('visible', on);
                s.setAttribute('aria-hidden', on ? 'false' : 'true');
            });
            this.frags(this.current).forEach(f => f.classList.toggle('shown', !!allFrags));
            const n = this.current + 1, total = this.slides.length;
            this.count.textContent = n + ' / ' + total;
            this.prog.style.width = (n / total * 100) + '%';
            this.toc.querySelectorAll('li').forEach(li => li.classList.toggle('cur', +li.dataset.i === this.current));
            const id = this.slides[this.current].id;
            const h = '#' + (id || n);
            if (location.hash !== h) history.replaceState(null, '', h);
        }

        fromHash() {
            const h = decodeURIComponent(location.hash.slice(1));
            if (!h) return false;
            const byId = this.slides.findIndex(s => s.id === h);
            if (byId >= 0) { this.show(byId); return true; }
            if (/^\d+$/.test(h)) { this.show(+h - 1); return true; }
            return false;
        }

        toggleToc(force) {
            const open = force == null ? !this.toc.classList.contains('open') : force;
            this.toc.classList.toggle('open', open);
            if (open) { const c = this.toc.querySelector('li.cur'); if (c) c.scrollIntoView({ block: 'center' }); }
        }

        fullscreen() {
            if (!document.fullscreenElement) document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
            else document.exitFullscreen && document.exitFullscreen();
        }
    }

    window.addEventListener('DOMContentLoaded', () => {
        if (window.Gates) { Gates.render(document); Gates.initSims(document); }
        window.deck = new SlidePresentation();
    });

    /* พิมพ์: แสดง fragment ทั้งหมด */
    window.addEventListener('beforeprint', () => document.querySelectorAll('.frag').forEach(f => f.classList.add('shown')));
})();
