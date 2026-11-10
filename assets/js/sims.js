/* ===========================================
   Sims — กิจกรรมในสไลด์ (คลิกได้ ไม่ทำให้สไลด์เลื่อน)
   ดัดแปลงจากวิชาอุปกรณ์อิเล็กทรอนิกส์และวงจร
   - <div data-timer="300"></div>                       ตัวจับเวลานับถอยหลัง (วินาที)
   - <div class="vote" data-answer="1"> <button class="opt">…</button> … <button class="reveal">เฉลย</button> <div class="why">…</div></div>
   - <div data-board="6"></div>                         กระดานคะแนนกลุ่ม (ใช้คะแนนชุดเดียวกันทุกสไลด์ของสัปดาห์)
   - <div data-picker="40" data-label="เลขที่"></div>   สุ่มเลขที่ / สุ่มกลุ่ม
   - <div data-video="YouTubeID" data-title="…" data-credit="…" data-len="1:09" data-start="0" data-end="0"></div>
                                                        วิดีโอ YouTube แบบกดแล้วค่อยโหลด หยุดเองเมื่อเปลี่ยนสไลด์
   - <div class="hunt"> <svg>… <g class="spot">…</g> …</svg> <ol class="hunt-list"><li>…</li></ol> </div>
                                                        เกมล่าจุดเสี่ยง: คลิกจุดในภาพ → เปิดรายการข้อเดียวกัน
   =========================================== */
(function (g) {
    'use strict';
    const WEEK = (location.pathname.match(/ch\d\d/) || ['ch02'])[0];
    const NS = 'beb-' + WEEK + '-board';

    /* คลิกหรือกดแป้นในกิจกรรมต้องไม่ทำให้สไลด์เลื่อน */
    function guard(el) {
        el.addEventListener('keydown', e => e.stopPropagation());
        el.addEventListener('click', e => { if (e.target.closest('button, input, select, label, a')) e.stopPropagation(); });
    }
    const blur = b => b && b.blur && b.blur();
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    /* ---------- ตัวจับเวลา ---------- */
    function timer(el) {
        const total = +el.dataset.timer || 300;
        let left = total, t = null;
        el.classList.add('timer');
        el.innerHTML = `<div class="tm-face" aria-live="polite"></div>
            <div class="tm-btns"><button type="button" data-a="go">▶ เริ่ม</button><button type="button" data-a="m">−1 นาที</button><button type="button" data-a="p">+1 นาที</button><button type="button" data-a="r">↺</button></div>`;
        const face = el.querySelector('.tm-face'), go = el.querySelector('[data-a=go]');
        const draw = () => {
            face.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
            el.classList.toggle('low', left > 0 && left <= 30);
            el.classList.toggle('done', left === 0);
        };
        const halt = () => { clearInterval(t); t = null; go.textContent = '▶ เริ่ม'; };
        el.addEventListener('click', e => {
            const b = e.target.closest('button'); if (!b) return;
            const a = b.dataset.a;
            if (a === 'go') {
                if (t) halt();
                else {
                    if (!left) left = total;
                    go.textContent = '⏸ หยุด';
                    t = setInterval(() => { left = Math.max(0, left - 1); draw(); if (!left) halt(); }, 1000);
                }
            } else if (a === 'm') left = Math.max(0, left - 60);
            else if (a === 'p') left += 60;
            else if (a === 'r') { halt(); left = total; }
            draw(); blur(b);
        });
        draw();
    }

    /* ---------- โหวต ก ข ค ง ---------- */
    function vote(el) {
        el.addEventListener('click', e => {
            const o = e.target.closest('.opt'), r = e.target.closest('.reveal');
            if (o) { el.querySelectorAll('.opt').forEach(x => x.classList.toggle('picked', x === o)); blur(o); }
            if (r) {
                el.classList.toggle('revealed');
                const ans = +el.dataset.answer;
                el.querySelectorAll('.opt').forEach((x, i) => x.classList.toggle('right', i === ans));
                r.textContent = el.classList.contains('revealed') ? 'ซ่อนเฉลย' : 'เฉลย';
                blur(r);
            }
        });
    }

    /* ---------- กระดานคะแนนกลุ่ม ---------- */
    const store = {
        get() { try { return JSON.parse(localStorage.getItem(NS)) || null; } catch (e) { return null; } },
        set(v) { try { localStorage.setItem(NS, JSON.stringify(v)); } catch (e) { /* ใช้ได้แม้บันทึกไม่ได้ */ } }
    };
    let scores = null;
    function boards() {
        document.querySelectorAll('[data-board]').forEach(el => {
            el.innerHTML = scores.map((s, i) => `<div class="bd-g"><div class="bd-n">กลุ่ม ${i + 1}</div><div class="bd-s">${s}</div>
                <div class="bd-b"><button type="button" data-g="${i}" data-d="-1">−</button><button type="button" data-g="${i}" data-d="1">+</button></div></div>`).join('')
                + `<button type="button" class="bd-reset">เริ่มนับใหม่</button>`;
        });
    }
    function board(el) {
        if (!scores) scores = store.get() || Array(+el.dataset.board || 6).fill(0);
        el.classList.add('board');
        el.addEventListener('click', e => {
            const b = e.target.closest('button'); if (!b) return;
            if (b.classList.contains('bd-reset')) scores = scores.map(() => 0);
            else scores[+b.dataset.g] = Math.max(0, scores[+b.dataset.g] + (+b.dataset.d));
            store.set(scores); boards();
        });
    }

    /* ---------- สุ่มเลขที่ / สุ่มกลุ่ม ---------- */
    function picker(el) {
        el.classList.add('picker');
        const label = el.dataset.label || 'เลขที่';
        el.innerHTML = `<label>${esc(label)} 1 ถึง <input type="number" min="2" max="60" value="${+el.dataset.picker || 40}"></label>
            <button type="button">สุ่ม${esc(label)}</button><div class="pk-num">?</div>`;
        const out = el.querySelector('.pk-num');
        el.querySelector('button').addEventListener('click', e => {
            const max = Math.max(2, +el.querySelector('input').value || 40);
            let n = 0;
            const t = setInterval(() => {
                out.textContent = 1 + Math.floor(Math.random() * max);
                if (++n > 14) { clearInterval(t); out.classList.remove('spin'); }
            }, 70);
            out.classList.add('spin'); blur(e.currentTarget);
        });
    }

    /* ---------- วิดีโอ YouTube: แสดงภาพปกก่อน กดแล้วจึงโหลด ----------
       เปิดผ่าน GitHub Pages (https) เท่านั้น ถ้าดับเบิลคลิกเปิดไฟล์ในเครื่อง YouTube จะไม่ยอมเล่นในกรอบ
       จึงมีลิงก์ "เปิดใน YouTube" สำรองไว้เสมอ */
    function video(el) {
        const id = el.dataset.video, s = +el.dataset.start || 0, e = +el.dataset.end || 0;
        const title = el.dataset.title || 'วิดีโอ', credit = el.dataset.credit || '', len = el.dataset.len || '';
        const watch = `https://www.youtube.com/watch?v=${id}${s ? '&t=' + s + 's' : ''}`;
        el.classList.add('vid');
        el.innerHTML = `<div class="vd-frame"></div>
            <div class="vd-cap"><span class="vd-c">${esc(credit)}${len ? ' · ' + esc(len) + ' นาที' : ''}</span>
            <a href="${watch}" target="_blank" rel="noopener">เปิดใน YouTube ↗</a></div>`;
        const frame = el.querySelector('.vd-frame');
        const poster = () => {
            frame.innerHTML = `<button type="button" class="vd-poster" aria-label="เล่นวิดีโอ: ${esc(title)}">
                <img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" loading="lazy">
                <span class="vd-play" aria-hidden="true">▶</span><span class="vd-t">${esc(title)}</span></button>`;
        };
        poster();
        frame.addEventListener('click', ev => {
            const b = ev.target.closest('.vd-poster'); if (!b) return;
            const q = new URLSearchParams({ autoplay: 1, rel: 0, modestbranding: 1, playsinline: 1 });
            if (s) q.set('start', s);
            if (e) q.set('end', e);
            frame.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?${q}" title="${esc(title)}"
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen
                referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
        });
        /* เปลี่ยนสไลด์แล้วหยุดวิดีโอ (คืนเป็นภาพปก) */
        const slide = el.closest('.slide');
        if (slide) new MutationObserver(() => {
            if (!slide.classList.contains('active') && frame.querySelector('iframe')) poster();
        }).observe(slide, { attributes: true, attributeFilter: ['class'] });
    }

    /* ---------- เกมล่าจุดเสี่ยง ---------- */
    function hunt(el) {
        const spots = Array.from(el.querySelectorAll('.spot'));
        const items = Array.from(el.querySelectorAll('.hunt-list li'));
        const n = el.querySelector('.hunt-n');
        const upd = () => { if (n) n.textContent = `${spots.filter(s => s.classList.contains('found')).length} / ${spots.length}`; };
        const mark = (i, on) => { spots[i].classList.toggle('found', on); if (items[i]) items[i].classList.toggle('found', on); };
        el.addEventListener('click', e => {
            const s = e.target.closest('.spot');
            if (s) { mark(spots.indexOf(s), true); upd(); return; }
            const b = e.target.closest('button[data-a]'); if (!b) return;
            spots.forEach((_, i) => mark(i, b.dataset.a === 'all'));
            upd(); blur(b);
        });
        upd();
    }

    function init(root) {
        root = root || document;
        root.querySelectorAll('[data-timer]').forEach(el => { timer(el); guard(el); });
        root.querySelectorAll('.vote').forEach(el => { vote(el); guard(el); });
        root.querySelectorAll('[data-board]').forEach(el => { board(el); guard(el); });
        if (scores) boards();
        root.querySelectorAll('[data-picker]').forEach(el => { picker(el); guard(el); });
        root.querySelectorAll('[data-video]').forEach(el => { video(el); guard(el); });
        root.querySelectorAll('.hunt').forEach(el => { hunt(el); guard(el); });
    }

    g.Sims = { init };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init(document));
    else init(document);
})(window);
