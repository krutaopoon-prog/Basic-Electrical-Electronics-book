/* ===========================================
   Meters — ภาพเครื่องวัดของบทที่ 2 (วาดใหม่ตามรูปในหนังสือ ไม่ใส่ยี่ห้อ)
   ใช้ได้ทุกหน้า: สไลด์ แบบฝึกหัด แบบทดสอบ เฉลย และห้องแล็บเสมือน (vlab.js)

   <span data-meter="face" data-frac="0.64"></span>          หน้าปัดมิเตอร์เข็ม เข็มชี้ที่สัดส่วน 0–1 ของสเกล
        data-frac="0.94,0.7,0.32,0.1" data-nums="1"          หลายเข็ม มีเลขกำกับปลายเข็ม
        data-ohm="42"                                        ให้เข็มชี้ค่าบนสเกลโอห์ม (แทน data-frac)
        data-labels="1"                                      เลขชี้ส่วนประกอบสเกล 1–8 (รูปที่ 2.3)
   <span data-meter="analog" data-sel="dcv50" data-hl="dcv" data-labels="1"></span>
                                                             ตัวมิเตอร์เข็มทั้งเครื่อง (รูปที่ 2.2) hl = เน้นกลุ่มย่าน
   <span data-meter="dmm" data-sel="diode" data-disp="000" data-labels="1"></span>
                                                             มัลติมิเตอร์ดิจิทัล (รูปที่ 2.13)
   <span data-meter="conn" data-kind="dcv|acv|dca|ohm|zero|lab" data-dmm="1"></span>
                                                             วงจรการต่อวัด
   <span data-meter="scope" data-marks="1"></span>             จอออสซิลโลสโคป (รูปที่ 2.21)
   <span data-meter="wave" data-wave="sine|square|tri|pulse|saw"></span>
   =========================================== */
(function (g) {
    'use strict';
    const F = 'font-family="Prompt, Kanit, sans-serif"';
    const FT = 'font-family="Kanit, Sarabun, sans-serif"';
    const r1 = n => Math.round(n * 10) / 10;
    const rad = d => d * Math.PI / 180;

    /* ---------- หน้าปัดมิเตอร์เข็ม ----------
       จุดหมุนเข็ม (500, 660) สเกลกวาด −45° ถึง +45° จากแนวตั้ง
       สเกลโอห์มคิดแบบมิเตอร์เข็มทั่วไป: ค่ากลางสเกล 20 (ตำแหน่ง = 20 / (20 + R)) */
    const PX = 500, PY = 660, SPAN = 90;
    const ang = f => -SPAN / 2 + SPAN * f;
    const pt = (f, r) => {
        const a = rad(ang(f));
        return [r1(PX + r * Math.sin(a)), r1(PY - r * Math.cos(a))];
    };
    const arc = (r, f0, f1) => {
        const [x0, y0] = pt(f0, r), [x1, y1] = pt(f1, r);
        return `M${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1}`;
    };
    const ohmF = R => (R === Infinity ? 0 : 20 / (20 + R));
    /* สเกลแดง AC 10 V: ช่วงต้นถูกบีบไปทางซ้าย (ไดโอดในมิเตอร์กินแรงดันไปส่วนหนึ่ง)
       ตั้งค่าให้ตรงตัวอย่างที่ 2.2 หน้า 28: เข็มที่ 3.6 บนสเกลดำ อ่านสเกลแดงได้ 3.8 V */
    const AC_VD = 0.3125;
    const ac10F = v => Math.max(0, (v - AC_VD) / (10 - AC_VD));
    const ac10V = f => f * (10 - AC_VD) + AC_VD;
    const tick = (f, ra, rb, w, c) => { const [a, b] = pt(f, ra), [x, y] = pt(f, rb); return `<path d="M${a} ${b} L${x} ${y}" stroke="${c || '#222'}" stroke-width="${w || 2}"/>`; };
    // ตัวเลขบนสเกล เอียงตามแนวโค้งแบบหน้าปัดจริง
    const lbl = (f, r, s, size, c, extra) => { const [x, y] = pt(f, r); return `<text x="${x}" y="${y}" font-size="${size || 26}" ${F} font-weight="500" text-anchor="middle" dominant-baseline="middle" fill="${c || '#222'}" transform="rotate(${r1(ang(f))} ${x} ${y})" ${extra || ''}>${s}</text>`; };
    const FACE_DEFS = `<defs>
        <linearGradient id="mtFaceG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fcfaf2"/><stop offset="1" stop-color="#eee8d6"/></linearGradient>
        <linearGradient id="mtMirG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8d9aa3"/><stop offset=".42" stop-color="#e3eaee"/><stop offset=".5" stop-color="#fbfdfe"/><stop offset=".58" stop-color="#dfe6ea"/><stop offset="1" stop-color="#85929b"/></linearGradient>
        <radialGradient id="mtPivG" cx=".5" cy="1" r="1"><stop offset="0" stop-color="#6a6a6a"/><stop offset=".7" stop-color="#2a2a2a"/><stop offset="1" stop-color="#111"/></radialGradient>
    </defs>`;

    /* เข็ม (วาดชี้ขึ้นแล้วหมุน) — แยกออกมาให้ห้องแล็บใช้ทำเข็มเคลื่อนที่ */
    function needle(f, o) {
        o = o || {};
        const ff = Math.max(-0.06, Math.min(1.06, f));
        const shape = `M${PX - 5} ${PY} L${PX - 1.3} ${PY - 548} L${PX + 1.3} ${PY - 548} L${PX + 5} ${PY} Z`;
        let s = `<g class="mt-needle" ${o.id ? `id="${o.id}"` : ''} transform="rotate(${Math.round(ang(ff) * 1000) / 1000} ${PX} ${PY})">
            <path d="${shape}" fill="#000" opacity=".16" transform="translate(6 8)"/>
            <path d="${shape}" fill="#111"/>
            <path d="M${PX - 1.3} ${PY - 548} L${PX + 1.3} ${PY - 548} L${PX + 2} ${PY - 470} L${PX - 2} ${PY - 470} Z" fill="#c62828"/>
        </g>`;
        if (o.num) {
            const [nx, ny] = pt(ff, 575);
            s += `<circle cx="${nx}" cy="${ny}" r="17" fill="#2e9b57"/><text x="${nx}" y="${ny + 1}" font-size="22" ${F} font-weight="700" fill="#fff" text-anchor="middle" dominant-baseline="middle">${o.num}</text>`;
        }
        return s;
    }
    const PIVOT = `<path d="M420 621 A80 80 0 0 1 580 621 Z" fill="url(#mtPivG)"/><path d="M440 621 A60 60 0 0 1 560 621" fill="none" stroke="#777" stroke-width="2" opacity=".6"/>`;

    function faceInner(o) {
        o = o || {};
        let s = FACE_DEFS + `<rect x="0" y="80" width="1000" height="540" rx="18" fill="url(#mtFaceG)" stroke="#bbb" stroke-width="3"/>`;
        // แถบเน้นแถวที่ต้องอ่าน (ห้องแล็บเปิดด้วยคลาส hl-…)
        const band = (cls, r, f0, f1, w) => `<path class="mt-band ${cls}" d="${arc(r, f0, f1)}" fill="none" stroke="#ffb347" stroke-width="${w}" stroke-linecap="round" opacity="0"/>`;
        s += band('b-ohm', 516, 0, 1, 44) + band('b-10', 410, 0, 1, 30) + band('b-50', 377, 0, 1, 30) + band('b-250', 344, 0, 1, 30) + band('b-ac10', 290, ac10F(1), 1, 36);

        // สเกลโอห์ม (บนสุด) 0 อยู่ขวา ∞ อยู่ซ้าย
        s += `<path d="${arc(500, 0, 1)}" fill="none" stroke="#222" stroke-width="3.5"/>`;
        [[0, 2, 0.5], [2, 10, 1], [10, 20, 2], [20, 50, 5], [50, 100, 10], [100, 200, 20], [200, 500, 50], [500, 1000, 100], [1000, 2000, 500]]
            .forEach(([a, b, st]) => { for (let R = a; R < b - 1e-9; R += st) s += tick(ohmF(R), 500, 489, 1.6); });
        [0, 1, 2, 5, 10, 20, 30, 50, 100, 200].forEach(R => { s += tick(ohmF(R), 500, 476, 3) + lbl(ohmF(R), 528, R, 27); });
        [500, 1000, 2000].forEach(R => { s += tick(ohmF(R), 500, 478, 2.4); });
        s += tick(0, 500, 470, 3);
        s += lbl(ohmF(500), 528, '500', 17) + lbl(ohmF(1000), 548, '1k', 16) + lbl(ohmF(2000), 570, '2k', 16)
            + lbl(-0.04, 500, '∞', 30) + lbl(1.05, 512, 'Ω', 30);

        // กระจกเงา
        s += `<path d="${arc(470, 0, 1)}" fill="none" stroke="url(#mtMirG)" stroke-width="22"/>`;
        s += `<path d="${arc(459, 0, 1)}" fill="none" stroke="#7d8a92" stroke-width="1.5"/><path d="${arc(481, 0, 1)}" fill="none" stroke="#7d8a92" stroke-width="1.5"/>`;

        // สเกลดำ DCV.A & ACV (ใต้กระจก) 0 อยู่ซ้าย แบ่ง 50 ช่อง ตัวเลข 3 แถว
        s += `<path d="${arc(450, 0, 1)}" fill="none" stroke="#222" stroke-width="3"/>`;
        for (let i = 0; i <= 50; i++) s += tick(i / 50, 450, i % 5 ? 440 : 425, i % 5 ? 1.8 : 3);
        for (let i = 0; i < 50; i++) s += tick((i + 0.5) / 50, 450, 445, 1);
        [[10, 410], [50, 377], [250, 344]].forEach(([full, r]) => {
            s += `<g class="mt-row r-${full}">`;
            for (let k = 0; k <= 5; k++) s += lbl(k / 5, r, full * k / 5, 25);
            s += `</g>`;
        });
        s += `<text x="40" y="404" font-size="21" ${F} font-weight="600" fill="#222">DCV.A</text><text x="40" y="428" font-size="21" ${F} font-weight="600" fill="#222">&amp;ACV</text>`;
        s += `<text x="960" y="404" font-size="21" ${F} font-weight="600" fill="#222" text-anchor="end">DCV.A</text><text x="960" y="428" font-size="21" ${F} font-weight="600" fill="#222" text-anchor="end">&amp;ACV</text>`;

        // สเกลแดง AC 10 V (ใช้เฉพาะย่าน ACV 10 V)
        s += `<path d="${arc(312, ac10F(1), 1)}" fill="none" stroke="#c0392b" stroke-width="3"/>`;
        for (let k = 5; k <= 50; k++) { const v = k / 5, maj = k % 5 === 0; s += tick(ac10F(v), 312, maj ? 297 : 304, maj ? 2.4 : 1.3, '#c0392b'); }
        s += `<g class="mt-row r-ac10">`;
        for (let v = 2; v <= 10; v += 2) s += lbl(ac10F(v), 282, v, 21, '#c0392b');
        s += `</g><text x="120" y="480" font-size="21" ${F} font-weight="600" fill="#c0392b">AC10V</text><text x="880" y="480" font-size="21" ${F} font-weight="600" fill="#c0392b" text-anchor="end">AC10V</text>`;

        // สเกลย่อยอื่น (hFE, LI · LV, dB) มีบนเครื่องจริง ไม่ใช้อ่านในบทนี้
        s += `<path d="${arc(258, 0.03, 0.97)}" fill="none" stroke="#2c6fbb" stroke-width="2.5"/>`;
        for (let k = 0; k <= 10; k++) s += tick(0.03 + 0.94 * k / 10, 258, k % 5 ? 251 : 246, 1.6, '#2c6fbb');
        [0, 200, 400, 600, 800, 1000].forEach((v, k) => { s += lbl(0.03 + 0.94 * k / 5, 236, v, 15, '#2c6fbb'); });
        s += `<path d="${arc(214, 0.05, 0.95)}" fill="none" stroke="#555" stroke-width="2"/>`;
        for (let k = 0; k <= 10; k++) s += tick(0.05 + 0.9 * k / 10, 214, 208, 1.4, '#555');
        s += `<path d="${arc(188, ac10F(0.775), ac10F(9.76))}" fill="none" stroke="#c0392b" stroke-width="2"/>`;
        for (let d = 0; d <= 22; d += 2) s += tick(ac10F(0.775 * Math.pow(10, d / 20)), 188, d % 10 ? 183 : 179, 1.4, '#c0392b');
        [0, 10, 20].forEach(d => { s += lbl(ac10F(0.775 * Math.pow(10, d / 20)), 168, (d ? '+' : '') + d, 14, '#c0392b'); });
        s += `<text x="232" y="520" font-size="19" ${F} fill="#2c6fbb">hFE</text><text x="262" y="550" font-size="17" ${F} fill="#555">LI · LV</text><text x="300" y="578" font-size="17" ${F} fill="#c0392b">dB</text>`;
        s += `<text x="40" y="116" font-size="18" ${F} fill="#888">CONTINUITY</text><circle class="mt-led" data-part="2" cx="58" cy="140" r="10" fill="#8e2a2a" stroke="#555" stroke-width="2"/><circle data-part="2" cx="58" cy="140" r="34" fill="transparent"/>`;

        // เข็ม
        (o.fracs || []).forEach((f, i) => { s += needle(f, { num: o.nums ? i + 1 : 0 }); });
        s += PIVOT;
        // เลขชี้ส่วนประกอบสเกล (รูปที่ 2.3)
        if (o.labels) {
            const call = (n, x, y, tx, ty) => `<path d="M${x} ${y} L${tx} ${ty}" stroke="#d6455d" stroke-width="2.5"/><circle cx="${x}" cy="${y}" r="20" fill="#d6455d"/><text x="${x}" y="${y + 1}" font-size="24" ${F} font-weight="700" fill="#fff" text-anchor="middle" dominant-baseline="middle">${n}</text>`;
            const [a1, b1] = pt(0.03, 500), [a8, b8] = pt(0.97, 470), [a2, b2] = pt(0.02, 445), [a3, b3] = pt(0.12, 312);
            s += call(1, 40, 210, a1, b1) + call(2, 30, 300, a2 + 4, b2) + call(3, 105, 430, a3, b3)
                + call(4, 190, 515, 232, 512) + call(5, 960, 470, pt(0.96, 214)[0], pt(0.96, 214)[1]) + call(6, 960, 540, pt(0.94, 214)[0], pt(0.94, 214)[1])
                + call(7, 330, 600, 306, 576) + call(8, 960, 260, a8, b8);
        }
        return s;
    }
    function face(o) {
        return `<svg class="mt-svg" viewBox="${o.labels ? '-20 70 1040 560' : '0 80 1000 540'}" role="img" aria-label="หน้าปัดมิเตอร์เข็ม">${faceInner(o)}</svg>`;
    }

    /* ---------- ตัวมิเตอร์เข็มทั้งเครื่อง (รูปที่ 2.2) ----------
       หน้าปัดย่อ 0.53 เท่า วางในกรอบหน้าต่าง · ปุ่มหมุนอยู่ที่ (400, 662) */
    const FACE_T = 'translate(135 56) scale(0.53) translate(0 -80)';
    const AK = { cx: 400, cy: 662, R: 172, screw: [400, 384], adj: [630, 436], com: [175, 850], pos: [625, 850], out: [180, 452] };
    // ตำแหน่งสวิตช์เลือกย่าน: มุมตามเข็มนาฬิกาจากด้านบน
    const ASEL = [
        ['off', 0, 'OFF', 'off'],
        ['acv1000', 18, '1000', 'acv'], ['acv250', 36, '250', 'acv'], ['acv50', 54, '50', 'acv'], ['acv10', 72, '10', 'acv'],
        ['x10k', 92, '×10k', 'ohm'], ['x1k', 110, '×1k', 'ohm'], ['x100', 128, '×100', 'ohm'], ['x10', 146, '×10', 'ohm'], ['x1', 164, '×1', 'ohm'],
        ['ma250', 186, '250', 'dca'], ['ma25', 204, '25', 'dca'], ['ma2.5', 222, '2.5', 'dca'],
        ['dcv0.1', 240, '0.1', 'dcv'], ['dcv0.5', 256, '0.5', 'dcv'], ['dcv2.5', 272, '2.5', 'dcv'], ['dcv10', 288, '10', 'dcv'], ['dcv50', 304, '50', 'dcv'], ['dcv250', 320, '250', 'dcv'], ['dcv1000', 338, '1000', 'dcv']
    ];
    const GCOL = { acv: '#ff5a4a', ohm: '#fff', dca: '#fff', dcv: '#fff', off: '#7ddc7d' };
    const atA = (deg, r) => [r1(AK.cx + r * Math.sin(rad(deg))), r1(AK.cy - r * Math.cos(rad(deg)))];
    const BODY_DEFS = `<defs>
        <linearGradient id="mtBodyG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b3d42"/><stop offset=".5" stop-color="#2a2b2f"/><stop offset="1" stop-color="#1c1d20"/></linearGradient>
        <radialGradient id="mtKnobG" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#4a4b50"/><stop offset=".7" stop-color="#1d1e21"/><stop offset="1" stop-color="#0d0d0f"/></radialGradient>
        <linearGradient id="mtCopG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a4f22"/><stop offset=".5" stop-color="#d08a4c"/><stop offset="1" stop-color="#8a4f22"/></linearGradient>
        <radialGradient id="mtJackG" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000"/><stop offset=".55" stop-color="#1a1a1a"/><stop offset=".56" stop-color="#9a9a9a"/><stop offset="1" stop-color="#5a5a5a"/></radialGradient>
    </defs>`;
    function analogBody(o) {
        o = o || {};
        const { cx, cy, R } = AK;
        let s = BODY_DEFS + `<rect x="100" y="20" width="600" height="880" rx="46" fill="url(#mtBodyG)"/>
            <rect x="104" y="24" width="592" height="872" rx="43" fill="none" stroke="#5a5c62" stroke-width="2"/>
            <rect x="122" y="40" width="556" height="378" rx="16" fill="#121214"/>
            <rect x="132" y="50" width="536" height="358" rx="10" fill="#eee8d6"/>
            <g data-part="1">${`<g transform="${FACE_T}">${faceInner({})}</g>`}</g>
            <text x="150" y="398" font-size="15" ${F} font-weight="600" fill="#555" letter-spacing="1">ANALOG MULTITESTER</text>
            <path d="M132 50 L330 50 L190 408 L132 408 Z" fill="#fff" opacity=".07" pointer-events="none"/>
            <text x="${AK.adj[0]}" y="${AK.adj[1] + 60}" font-size="21" ${F} fill="#eee" text-anchor="middle">0Ω ADJ</text>
            <g data-part="6" data-jack="out"><circle cx="${AK.out[0]}" cy="${AK.out[1]}" r="22" fill="url(#mtJackG)"/></g>
            <text x="${AK.out[0]}" y="${AK.out[1] + 46}" font-size="19" ${F} fill="#ff5a4a" text-anchor="middle">OUTPUT</text>`;
        // ไฮไลต์กลุ่มย่าน
        if (o.hl) {
            const its = ASEL.filter(a => a[3] === o.hl);
            const a0 = its[0][1] - 9, a1 = its[its.length - 1][1] + 9;
            const [x0, y0] = atA(a0, R), [x1, y1] = atA(a1, R);
            s += `<path d="M${x0} ${y0} A${R} ${R} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}" fill="none" stroke="#f2a65a" stroke-width="64" opacity=".85"/>`;
        }
        // วงแบ่งกลุ่มย่าน (เส้นขาวแบบหน้าเครื่องจริง)
        const seg = (d0, d1, c) => { const [x0, y0] = atA(d0, R + 26), [x1, y1] = atA(d1, R + 26); return `<path d="M${x0} ${y0} A${R + 26} ${R + 26} 0 ${d1 - d0 > 180 ? 1 : 0} 1 ${x1} ${y1}" fill="none" stroke="${c}" stroke-width="2.5" opacity=".75"/>`; };
        s += seg(10, 80, '#ff5a4a') + seg(84, 172, '#fff') + seg(178, 230, '#fff') + seg(233, 346, '#fff');
        ASEL.forEach(([id, deg, t, grp]) => {
            const [x, y] = atA(deg, R);
            const [dx, dy] = atA(deg, R - 34);
            s += `<circle cx="${dx}" cy="${dy}" r="4.5" fill="${GCOL[grp]}"/>`;
            s += `<text data-sel="${id}" x="${x}" y="${y}" font-size="${t.length > 3 ? 21 : 24}" ${F} font-weight="500" fill="${GCOL[grp]}" text-anchor="middle" dominant-baseline="middle" style="cursor:pointer">${t}</text>`;
        });
        const glab = (deg, t, c) => { const [x, y] = atA(deg, R + 50); return `<text x="${x}" y="${y}" font-size="26" ${F} font-weight="700" fill="${c}" text-anchor="middle" dominant-baseline="middle">${t}</text>`; };
        s += glab(46, 'ACV', '#ff5a4a') + glab(128, 'Ω', '#fff') + glab(204, 'DCmA', '#fff') + glab(290, 'DCV', '#fff');
        s += `<text x="214" y="768" font-size="14" ${F} fill="#ddd" text-anchor="middle">50µA</text>`;
        // ขั้วเสียบสาย
        s += `<text x="${AK.com[0]}" y="806" font-size="22" ${F} fill="#fff" text-anchor="middle">−COM</text>
              <g data-part="9" data-jack="com"><circle cx="${AK.com[0]}" cy="${AK.com[1]}" r="30" fill="url(#mtJackG)"/></g>
              <rect x="580" y="812" width="92" height="76" rx="16" fill="#c0392b"/>
              <g data-part="8" data-jack="pos"><circle cx="${AK.pos[0]}" cy="${AK.pos[1]}" r="28" fill="url(#mtJackG)"/></g>
              <text x="664" y="806" font-size="28" ${F} fill="#fff" text-anchor="middle">+</text>`;
        return s;
    }
    function analogScrew(deg) {
        const [x, y] = AK.screw;
        return `<g data-part="4" data-drag="screw" transform="rotate(${r1(deg || 0)} ${x} ${y})" style="cursor:grab"><circle cx="${x}" cy="${y}" r="38" fill="transparent"/><circle cx="${x}" cy="${y}" r="17" fill="#1d1d1d" stroke="#8a8a8a" stroke-width="3"/><path d="M${x - 11} ${y} H${x + 11}" stroke="#bbb" stroke-width="4" stroke-linecap="round"/></g>`;
    }
    function analogAdj(deg) {
        const [x, y] = AK.adj;
        let r = '';
        for (let i = 0; i < 30; i++) r += `<path d="M${x} ${y - 38} V${y - 31}" stroke="#555" stroke-width="3" transform="rotate(${i * 12} ${x} ${y})"/>`;
        return `<g data-part="5" data-drag="adj" style="cursor:grab"><g transform="rotate(${r1(deg || 0)} ${x} ${y})"><circle cx="${x}" cy="${y}" r="40" fill="url(#mtKnobG)" stroke="#3a3a3a" stroke-width="2"/>${r}<path d="M${x} ${y - 28} V${y - 12}" stroke="#eee" stroke-width="4" stroke-linecap="round"/></g></g>`;
    }
    function analogKnob(sel) {
        const { cx, cy } = AK;
        const it = ASEL.find(a => a[0] === sel) || ASEL[0];
        let ridges = '';
        for (let i = 0; i < 36; i++) ridges += `<path d="M${cx} ${cy - 126} V${cy - 116}" stroke="#333" stroke-width="5" transform="rotate(${i * 10} ${cx} ${cy})"/>`;
        return `<g data-part="7" data-drag="knob" style="cursor:grab"><circle cx="${cx}" cy="${cy}" r="128" fill="url(#mtKnobG)" stroke="#444" stroke-width="3"/>${ridges}
            <g class="mt-knob" transform="rotate(${it[1]} ${cx} ${cy})">
              <rect x="${cx - 21}" y="${cy - 116}" width="42" height="232" rx="21" fill="url(#mtCopG)"/>
              <path d="M${cx} ${cy - 104} V${cy + 104}" stroke="#f3e2c8" stroke-width="4" stroke-linecap="round" opacity=".55"/>
              <path d="M${cx} ${cy - 104} V${cy - 10}" stroke="#fff" stroke-width="7" stroke-linecap="round"/>
              <path d="M${cx - 9} ${cy - 92} L${cx} ${cy - 110} L${cx + 9} ${cy - 92} Z" fill="#fff"/>
            </g></g>`;
    }
    function analog(o) {
        let s = analogBody(o) + analogScrew(0) + analogAdj(0) + analogKnob(o.sel || 'off');
        s += `<g transform="${FACE_T}">${(o.fracs && o.fracs.length ? o.fracs : [0]).map(f => needle(f)).join('')}${PIVOT}</g>`;
        let vb = '100 20 600 880';
        if (o.labels) {
            vb = '0 10 800 900';
            const call = (n, x, y, tx, ty) => `<path d="M${x} ${y} L${tx} ${ty}" stroke="#d6455d" stroke-width="3"/><circle cx="${x}" cy="${y}" r="24" fill="#d6455d"/><text x="${x}" y="${y + 1}" font-size="26" ${F} font-weight="700" fill="#fff" text-anchor="middle" dominant-baseline="middle">${n}</text>`;
            s += call(1, 750, 120, 640, 150) + call(2, 50, 80, 162, 90) + call(3, 50, 230, 330, 292)
                + call(4, 50, 384, 382, 384) + call(5, 750, 436, 670, 436) + call(6, 50, 452, 158, 452)
                + call(7, 750, 662, 528, 662) + call(8, 750, 850, 653, 850) + call(9, 50, 850, 145, 850);
        }
        return `<svg class="mt-svg" viewBox="${vb}" role="img" aria-label="มัลติมิเตอร์ชนิดแอนะลอก">${s}</svg>`;
    }

    /* ---------- ตัวเลข 7 ส่วนแบบจอ LCD ----------
       str จัดชิดขวา 4 หลัก เช่น "-9.00" "150.0" "1   " (เกินย่าน แสดง 1 หลักซ้ายสุด) "" (ปิดเครื่อง) */
    const SEG = { '0': 'abcdef', '1': 'bc', '2': 'abdeg', '3': 'abcdg', '4': 'bcfg', '5': 'acdfg', '6': 'acdefg', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg', '-': 'g', ' ': '', 'L': 'def', 'o': 'cdeg' };
    function seg7(str, x, y, h, col) {
        col = col || '#1d2318';
        const w = h * 0.54, t = h * 0.13, pitch = h * 0.8;
        let neg = false;
        str = String(str == null ? '' : str);
        if (str[0] === '-') { neg = true; str = str.slice(1); }
        const cells = [];
        for (const c of str) { if (c === '.') { if (cells.length) cells[cells.length - 1].dp = true; } else cells.push({ ch: c, dp: false }); }
        while (cells.length < 4) cells.unshift({ ch: ' ', dp: false });
        const H = (x0, yy) => `${r1(x0 + t * 0.6)},${r1(yy)} ${r1(x0 + t * 1.1)},${r1(yy - t / 2)} ${r1(x0 + w - t * 1.1)},${r1(yy - t / 2)} ${r1(x0 + w - t * 0.6)},${r1(yy)} ${r1(x0 + w - t * 1.1)},${r1(yy + t / 2)} ${r1(x0 + t * 1.1)},${r1(yy + t / 2)}`;
        const V = (xx, y0, y1) => `${r1(xx)},${r1(y0 + t * 0.6)} ${r1(xx + t / 2)},${r1(y0 + t * 1.1)} ${r1(xx + t / 2)},${r1(y1 - t * 1.1)} ${r1(xx)},${r1(y1 - t * 0.6)} ${r1(xx - t / 2)},${r1(y1 - t * 1.1)} ${r1(xx - t / 2)},${r1(y0 + t * 1.1)}`;
        const segPts = (x0) => {
            const top = y, mid = y + h / 2, bot = y + h;
            return { a: H(x0, top + t / 2), g: H(x0, mid), d: H(x0, bot - t / 2), f: V(x0 + t / 2, top, mid), b: V(x0 + w - t / 2, top, mid), e: V(x0 + t / 2, mid, bot), c: V(x0 + w - t / 2, mid, bot) };
        };
        let s = '';
        cells.slice(-4).forEach((c, i) => {
            const x0 = x + i * pitch, P = segPts(x0), on = SEG[c.ch] || '';
            'abcdefg'.split('').forEach(k => { s += `<polygon points="${P[k]}" fill="${col}" opacity="${on.includes(k) ? 1 : 0.07}"/>`; });
            s += `<circle cx="${r1(x0 + w + t * 0.75)}" cy="${r1(y + h - t / 2)}" r="${r1(t * 0.55)}" fill="${col}" opacity="${c.dp ? 1 : 0.07}"/>`;
        });
        const mx = x - pitch * 0.62;
        s += `<polygon points="${H(mx, y + h / 2)}" fill="${col}" opacity="${neg ? 1 : 0.07}"/>`;
        return `<g transform="translate(${x} ${y + h}) skewX(-6) translate(${-x} ${-(y + h)})">${s}</g>`;
    }

    /* ---------- มัลติมิเตอร์ดิจิทัล (ย่านแบบรุ่นราคาถูกที่ใช้ในหนังสือ รูปที่ 2.13) ---------- */
    const DK = { cx: 380, cy: 480, R: 205, a10: [560, 760], vma: [560, 840], com: [560, 920], lcd: [196, 72, 368, 122] };
    const DSEL = [
        ['off', 0, 'OFF', 'off'],
        ['acv750', 20, '750', 'acv'], ['acv200', 36, '200', 'acv'],
        ['a200u', 58, '200µ', 'dca'], ['a2000u', 74, '2000µ', 'dca'], ['a20m', 90, '20m', 'dca'], ['a200m', 106, '200m', 'dca'],
        ['a10', 126, '10A', 'a10'], ['hfe', 146, 'hFE', 'hfe'], ['diode', 168, '→|', 'diode'],
        ['o200', 192, '200', 'ohm'], ['o2000', 208, '2000', 'ohm'], ['o20k', 224, '20k', 'ohm'], ['o200k', 240, '200k', 'ohm'], ['o2000k', 256, '2000k', 'ohm'],
        ['v200m', 278, '200m', 'dcv'], ['v2000m', 294, '2000m', 'dcv'], ['v20', 310, '20', 'dcv'], ['v200', 326, '200', 'dcv'], ['v1000', 342, '1000', 'dcv']
    ];
    const atD = (deg, r) => [r1(DK.cx + r * Math.sin(rad(deg))), r1(DK.cy - r * Math.cos(rad(deg)))];
    const DMM_DEFS = `<defs>
        <linearGradient id="mtYelG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd84a"/><stop offset=".6" stop-color="#f6c315"/><stop offset="1" stop-color="#e2aa00"/></linearGradient>
        <radialGradient id="mtDKnobG" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="#ffcf4a"/><stop offset=".75" stop-color="#f0a514"/><stop offset="1" stop-color="#c97e00"/></radialGradient>
        <linearGradient id="mtLcdG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9d4b6"/><stop offset="1" stop-color="#b3c09d"/></linearGradient>
        <radialGradient id="mtJackY" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000"/><stop offset=".5" stop-color="#1a1a1a"/><stop offset=".52" stop-color="#d9a400"/><stop offset="1" stop-color="#9c7500"/></radialGradient>
    </defs>`;
    function dmmBody(o) {
        o = o || {};
        const { cx, cy, R } = DK;
        const [lx, ly, lw, lh] = DK.lcd;
        let s = DMM_DEFS + `<rect x="130" y="20" width="500" height="960" rx="54" fill="#d79f00"/>
            <rect x="142" y="32" width="476" height="936" rx="46" fill="url(#mtYelG)"/>
            <rect x="${lx - 16}" y="${ly - 14}" width="${lw + 32}" height="${lh + 28}" rx="12" fill="#3b3b3b"/>
            <rect x="${lx}" y="${ly}" width="${lw}" height="${lh}" rx="6" fill="url(#mtLcdG)"/>
            <path d="M${lx} ${ly} L${lx + 150} ${ly} L${lx + 90} ${ly + lh} L${lx} ${ly + lh} Z" fill="#fff" opacity=".1"/>`;
        // เส้นสีเขียวแบ่งกลุ่มย่านแบบเครื่องจริง
        const segD = (d0, d1) => { const [x0, y0] = atD(d0, R + 30), [x1, y1] = atD(d1, R + 30); return `<path d="M${x0} ${y0} A${R + 30} ${R + 30} 0 ${d1 - d0 > 180 ? 1 : 0} 1 ${x1} ${y1}" fill="none" stroke="#2e7d32" stroke-width="3.5"/>`; };
        s += segD(10, 44) + segD(50, 114) + segD(183, 264) + segD(270, 350);
        DSEL.forEach(([id, deg, t]) => {
            const [x, y] = atD(deg, R);
            s += `<circle cx="${atD(deg, R - 34)[0]}" cy="${atD(deg, R - 34)[1]}" r="5" fill="#222"/>`;
            s += `<text data-sel="${id}" x="${x}" y="${y}" font-size="${t.length > 4 ? 20 : 23}" ${F} font-weight="600" fill="#222" text-anchor="middle" dominant-baseline="middle" style="cursor:pointer">${t}</text>`;
        });
        const glab = (deg, t, r) => { const [x, y] = atD(deg, r || R + 52); return `<text x="${x}" y="${y}" font-size="26" ${F} font-weight="700" fill="#222" text-anchor="middle" dominant-baseline="middle">${t}</text>`; };
        s += glab(28, 'V~') + `<text x="592" y="300" font-size="26" ${F} font-weight="700" fill="#222" text-anchor="middle">A⎓</text>` + glab(224, 'Ω') + glab(310, 'V⎓');
        // ช่องเสียบทรานซิสเตอร์และขั้วสาย
        s += `<circle cx="230" cy="790" r="46" fill="#3949ab" stroke="#283593" stroke-width="3"/>`;
        [[-18, -14], [0, -20], [18, -14], [-18, 14], [0, 20], [18, 14]].forEach(([dx, dy]) => { s += `<circle cx="${230 + dx}" cy="${790 + dy}" r="4" fill="#111"/>`; });
        s += `<text x="230" y="866" font-size="19" ${F} fill="#222" text-anchor="middle">NPN · PNP</text>
              <g data-jack="a10"><circle cx="${DK.a10[0]}" cy="${DK.a10[1]}" r="27" fill="url(#mtJackY)"/></g><text x="488" y="767" font-size="22" ${F} font-weight="700" fill="#222" text-anchor="middle">10A</text>
              <g data-jack="vma"><circle cx="${DK.vma[0]}" cy="${DK.vma[1]}" r="27" fill="url(#mtJackY)"/></g><text x="478" y="847" font-size="22" ${F} font-weight="700" fill="#c0392b" text-anchor="middle">VΩmA</text>
              <g data-jack="com"><circle cx="${DK.com[0]}" cy="${DK.com[1]}" r="27" fill="url(#mtJackY)"/></g><text x="486" y="927" font-size="22" ${F} font-weight="700" fill="#222" text-anchor="middle">COM</text>
              <text x="300" y="930" font-size="18" ${F} font-weight="700" fill="#222" text-anchor="middle">DIGITAL MULTIMETER</text>`;
        return s;
    }
    function dmmLCD(str) { const [lx, ly] = DK.lcd; return seg7(str, lx + 72, ly + 16, 90); }
    function dmmKnob(sel) {
        const { cx, cy } = DK;
        const it = DSEL.find(a => a[0] === sel) || DSEL[0];
        return `<g data-drag="knob" style="cursor:grab"><circle cx="${cx}" cy="${cy}" r="152" fill="url(#mtDKnobG)" stroke="#b97800" stroke-width="4"/>
            <circle cx="${cx}" cy="${cy}" r="132" fill="none" stroke="#e39a00" stroke-width="2"/>
            <g class="mt-knob" transform="rotate(${it[1]} ${cx} ${cy})">
              <rect x="${cx - 24}" y="${cy - 132}" width="48" height="264" rx="24" fill="#3949ab"/>
              <rect x="${cx - 24}" y="${cy - 132}" width="16" height="264" rx="8" fill="#5c6bc0" opacity=".7"/>
              <path d="M${cx - 12} ${cy - 96} L${cx} ${cy - 122} L${cx + 12} ${cy - 96} Z" fill="#e53935"/>
            </g></g>`;
    }
    function dmm(o) {
        let s = dmmBody(o) + dmmLCD(o.disp == null ? '000' : o.disp) + dmmKnob(o.sel || 'off');
        let vb = '130 20 500 960';
        if (o.labels) {
            vb = '0 10 760 990';
            const R = DK.R;
            const call = (n, x, y, tx, ty) => `<path d="M${x} ${y} L${tx} ${ty}" stroke="#d6455d" stroke-width="3"/><circle cx="${x}" cy="${y}" r="24" fill="#d6455d"/><text x="${x}" y="${y + 1}" font-size="24" ${F} font-weight="700" fill="#fff" text-anchor="middle" dominant-baseline="middle">${n}</text>`;
            const P = id => atD(DSEL.find(a => a[0] === id)[1], R + 14);
            s += call(1, 60, 130, 196, 130) + call(2, 60, 560, 330, 540) + call(3, 60, 790, 184, 790)
                + call(4, 700, 760, 587, 760) + call(5, 700, 840, 587, 840) + call(6, 700, 920, 587, 920)
                + call(7, 60, 210, ...atD(0, R + 4)) + call(8, 60, 390, ...P('v200')) + call(9, 700, 200, ...P('acv200'))
                + call(10, 700, 330, ...P('a2000u')) + call(11, 60, 680, ...P('o200k')) + call(12, 700, 560, ...P('a10'))
                + call(13, 700, 640, ...P('hfe')) + call(14, 600, 700, ...P('diode'));
        }
        return `<svg class="mt-svg" viewBox="${vb}" role="img" aria-label="มัลติมิเตอร์ชนิดดิจิทัล">${s}</svg>`;
    }

    /* ---------- วงจรการต่อวัด ---------- */
    const W = (pts, c, w, dash) => `<path d="M${pts.map(p => p.join(' ')).join(' L')}" fill="none" stroke="${c || '#333'}" stroke-width="${w || 5}" stroke-linejoin="round" ${dash ? 'stroke-dasharray="14 10"' : ''}/>`;
    const dot = (x, y) => `<circle cx="${x}" cy="${y}" r="8" fill="#333"/>`;
    const T = (x, y, t, size, c, anchor, wt) => `<text x="${x}" y="${y}" font-size="${size || 26}" ${FT} font-weight="${wt || 500}" fill="${c || '#333'}" text-anchor="${anchor || 'middle'}" dominant-baseline="middle">${t}</text>`;
    const batt = (x, y) => `<path d="M${x - 34} ${y - 12} H${x + 34} M${x - 18} ${y + 12} H${x + 18}" stroke="#333" stroke-width="5"/><path d="M${x - 18} ${y + 12} H${x + 18}" stroke="#333" stroke-width="12"/>${T(x - 52, y - 16, '+', 30, '#c0392b', 'middle', 700)}${T(x - 52, y + 18, '−', 30, '#333', 'middle', 700)}`;
    const acsrc = (x, y) => `<circle cx="${x}" cy="${y}" r="40" fill="#fff" stroke="#333" stroke-width="5"/><path d="M${x - 24} ${y} C${x - 14} ${y - 22}, ${x - 4} ${y - 22}, ${x} ${y} S${x + 14} ${y + 22}, ${x + 24} ${y}" fill="none" stroke="#333" stroke-width="4"/>`;
    const lamp = (x, y) => `<circle cx="${x}" cy="${y}" r="32" fill="#fff8d6" stroke="#333" stroke-width="5"/><path d="M${x - 22} ${y - 22} L${x + 22} ${y + 22} M${x + 22} ${y - 22} L${x - 22} ${y + 22}" stroke="#333" stroke-width="4"/>`;
    const res = (x, y, v) => `<rect x="${x - 50}" y="${y - 18}" width="100" height="36" fill="#fff" stroke="#333" stroke-width="5"/>${T(x, y - 46, v || 'R', 26)}`;
    function meterIcon(x, y, sym, dig) {
        // ตัวมิเตอร์ย่อ: กล่องมีจอ ขั้วแดง (+ / VΩmA) ขวา ขั้วดำ (−COM) ซ้าย
        const body = dig ? '#f5c518' : '#2b2c30', screen = dig ? '#c9d3b8' : '#fbfaf4', ink = dig ? '#222' : '#fff';
        return `<rect x="${x - 80}" y="${y - 70}" width="160" height="150" rx="16" fill="${body}"/>
            <rect x="${x - 62}" y="${y - 56}" width="124" height="62" rx="6" fill="${screen}"/>
            ${dig ? T(x, y - 24, sym, 32, '#222', 'middle', 600) : `<path d="M${x - 46} ${y - 4} A60 60 0 0 1 ${x + 46} ${y - 4}" fill="none" stroke="#333" stroke-width="3"/><path d="M${x} ${y + 4} L${x + 22} ${y - 44}" stroke="#111" stroke-width="3"/>`}
            <circle cx="${x - 44}" cy="${y + 50}" r="11" fill="#111" stroke="#999" stroke-width="3"/><circle cx="${x + 44}" cy="${y + 50}" r="11" fill="#c0392b" stroke="#eee" stroke-width="3"/>
            ${T(x, y + 26, dig ? 'COM · VΩmA' : sym, dig ? 16 : 24, ink, 'middle', 700)}`;
    }
    const RED = '#d0312d', BLK = '#222';
    function conn(o) {
        const k = o.kind || 'dcv', dig = !!o.dmm;
        let s = '', vb = '0 0 900 470';
        if (k === 'dcv' || k === 'acv' || k === 'dca') {
            // แหล่งจ่ายซ้าย หลอด 2 ดวงต่ออนุกรม
            s += k === 'acv' ? acsrc(110, 235) + T(128, 320, 'ไฟสลับ', 22, '#333', 'start') : batt(110, 235) + T(128, 320, 'แบตเตอรี่', 22, '#333', 'start');
            s += W([[110, k === 'acv' ? 195 : 223], [110, 70], [330, 70]]) + lamp(362, 70) + W([[394, 70], [600, 70], [600, 160]]);
            s += lamp(600, 192) + W([[600, 224], [600, 400]]);
            s += T(362, 22, 'หลอดที่ 1', 24) + T(560, 192, 'หลอดที่ 2', 24, '#333', 'end');
            if (k === 'dca') {
                // วงจรขาดที่สายล่าง มิเตอร์ต่อแทรกเข้าไป: กระแสเข้าขั้วแดง ออกขั้วดำ กลับขั้วลบ
                s += W([[110, 247], [110, 400], [250, 400]]);
                s += meterIcon(385, 330, dig ? '200m' : 'DCmA', dig);
                s += W([[600, 400], [520, 400], [520, 430], [429, 430], [429, 391]], RED, 6) + W([[250, 400], [250, 430], [341, 430], [341, 391]], BLK, 6);
                s += T(385, 478, 'ตัดวงจรแล้วต่อมิเตอร์เข้าไปเป็นส่วนหนึ่งของวงจร (อนุกรม)', 23, '#0f6b70');
                vb = '0 0 900 500';
            } else {
                s += W([[600, 400], [110, 400], [110, k === 'acv' ? 275 : 247]]);
                s += dot(600, 120) + dot(600, 340);
                s += meterIcon(820, 260, k === 'acv' ? (dig ? '230' : 'ACV') : (dig ? '9.00' : 'DCV'), dig);
                s += W([[600, 120], [915, 120], [915, 360], [864, 360], [864, 321]], RED, 6);
                s += W([[600, 340], [700, 340], [700, 360], [776, 360], [776, 321]], BLK, 6);
                s += T(380, 446, k === 'acv' ? 'ต่อคร่อมหลอด สลับสายได้' : 'ต่อคร่อมหลอด (ขนาน)', 24, '#0f6b70');
                if (k === 'dcv') s += T(380, 480, 'สายแดงต่อฝั่งที่ใกล้ขั้วบวกของแหล่งจ่าย', 22, RED);
                vb = '0 0 960 500';
            }
        } else if (k === 'ohm' || k === 'zero') {
            s += meterIcon(200, 200, dig ? '1.00k' : 'Ω', dig);
            if (k === 'ohm') {
                s += res(620, 200, o.val || 'ตัวต้านทาน');
                s += W([[244, 250], [244, 330], [520, 330], [520, 200], [570, 200]], RED, 6) + W([[156, 250], [156, 380], [760, 380], [760, 200], [670, 200]], BLK, 6);
                s += T(440, 430, dig ? 'ตั้งย่าน Ω แล้ววัดได้ทันที' : 'ปรับ 0 Ω ก่อนแล้วจึงวัด', 24, '#0f6b70');
            } else {
                s += W([[244, 250], [244, 330], [500, 330], [500, 290]], RED, 6) + W([[156, 250], [156, 380], [540, 380], [540, 290]], BLK, 6);
                s += `<path d="M500 290 L518 262 M540 290 L522 262" stroke="#555" stroke-width="5"/>` + T(520, 236, 'แตะปลายสายกัน', 24);
                s += T(700, 160, 'หมุน 0Ω ADJ', 26, '#e8742c', 'middle', 600) + T(700, 198, 'ให้เข็มชี้ 0 Ω พอดี', 24, '#e8742c');
            }
            vb = '0 80 860 380';
        } else if (k === 'lab') {
            // แหล่งจ่ายไฟตรงปรับค่าได้ ต่อเข้ามิเตอร์โดยตรง (ใบปฏิบัติงาน 2.1 รูปที่ 2.1)
            s += `<rect x="520" y="70" width="300" height="300" rx="16" fill="#dcdcd6" stroke="#999" stroke-width="3"/>
                  <rect x="545" y="95" width="250" height="70" rx="6" fill="#222"/>${T(600, 131, '0.00A', 28, '#f5d742', 'middle', 600)}${T(730, 131, '12.5V', 28, '#f5d742', 'middle', 600)}
                  <circle cx="600" cy="220" r="26" fill="#333"/><circle cx="730" cy="220" r="30" fill="#333"/>${T(600, 266, 'CURRENT', 18)}${T(730, 266, 'VOLTAGE', 18)}
                  <circle cx="600" cy="325" r="16" fill="#111"/><circle cx="730" cy="325" r="16" fill="#c0392b"/>${T(600, 300, '−', 30, '#111', 'middle', 700)}${T(730, 298, '+', 30, '#c0392b', 'middle', 700)}`;
            s += meterIcon(200, 220, 'DCV', false);
            s += W([[244, 270], [244, 410], [730, 410], [730, 341]], RED, 6) + W([[156, 270], [156, 440], [600, 440], [600, 341]], BLK, 6);
            s += T(670, 40, 'แหล่งจ่ายไฟตรง 0–30 V', 26) + T(200, 120, 'ตั้ง DCV', 24);
            vb = '0 0 860 470';
        }
        return `<svg class="mt-svg" viewBox="${vb}" role="img" aria-label="วงจรการต่อมิเตอร์">${s}</svg>`;
    }

    /* ---------- จอออสซิลโลสโคป (10 × 8 ช่อง) ---------- */
    function scope(o) {
        const X0 = 60, Y0 = 40, D = 60;
        let s = `<rect x="${X0}" y="${Y0}" width="600" height="480" fill="#dff1f3" stroke="#1b5e66" stroke-width="3"/>`;
        for (let i = 1; i < 10; i++) s += `<path d="M${X0 + i * D} ${Y0} V${Y0 + 480}" stroke="#7fb3ba" stroke-width="${i === 5 ? 2.5 : 1.2}"/>`;
        for (let j = 1; j < 8; j++) s += `<path d="M${X0} ${Y0 + j * D} H${X0 + 600}" stroke="#7fb3ba" stroke-width="${j === 4 ? 2.5 : 1.2}"/>`;
        // ไซน์ สูงสุด 2 ช่อง คาบ 4 ช่อง (สองรอบครึ่งจอ)
        const amp = (o.amp || 2) * D, per = (o.per || 4) * D, yc = Y0 + 240;
        let d = '';
        for (let x = 0; x <= 600; x += 4) d += (x ? ' L' : 'M') + (X0 + x) + ' ' + r1(yc - amp * Math.sin(2 * Math.PI * x / per));
        s += `<path d="${d}" fill="none" stroke="#0d3b66" stroke-width="5"/>`;
        if (o.marks) {
            const xp = X0 + per / 4 + per, top = yc - amp, bot = yc + amp;
            s += `<path d="M${xp + 30} ${top} H${720}" stroke="#555" stroke-dasharray="6 6"/><path d="M${X0 + per * 1.75 - 10} ${bot} H${780}" stroke="#555" stroke-dasharray="6 6"/>`;
            s += `<path d="M700 ${top} V${yc}" stroke="#d6455d" stroke-width="4" marker-start="url(#mtA)" marker-end="url(#mtA)"/>${T(718, (top + yc) / 2, 'V<tspan font-size="18" dy="6">p</tspan>', 28, '#d6455d', 'start', 600)}`;
            s += `<path d="M760 ${top} V${bot}" stroke="#2e7d32" stroke-width="4" marker-start="url(#mtA)" marker-end="url(#mtA)"/>${T(778, yc + 40, 'V<tspan font-size="18" dy="6">pp</tspan>', 28, '#2e7d32', 'start', 600)}`;
            s += `<path d="M${X0} ${Y0 + 520} H${X0 + per}" stroke="#e8742c" stroke-width="4" marker-start="url(#mtA)" marker-end="url(#mtA)"/>${T(X0 + per / 2, Y0 + 548, 't (1 รอบ)', 26, '#e8742c', 'middle', 600)}`;
            s += `<path d="M${X0} ${Y0 + 470} V${Y0 + 530} M${X0 + per} ${Y0 + 470} V${Y0 + 530}" stroke="#e8742c" stroke-width="2" stroke-dasharray="5 5"/>`;
            s += T(30, yc, 'X', 24, '#333', 'middle', 700) + T(X0 + 300, 20, 'Y (โวลต์)', 22, '#333') + T(X0 + 640, yc + 22, 'เวลา', 20, '#333', 'start');
        }
        const defs = `<defs><marker id="mtA" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="context-stroke"/></marker></defs>`;
        return `<svg class="mt-svg" viewBox="0 0 ${o.marks ? 860 : 720} ${o.marks ? 600 : 560}" role="img" aria-label="จอออสซิลโลสโคป">${defs}${s}</svg>`;
    }

    /* ---------- รูปคลื่น ---------- */
    function wave(o) {
        const w = o.wave || 'sine';
        let d = '';
        if (w === 'sine') for (let x = 0; x <= 300; x += 3) d += (x ? ' L' : 'M') + (10 + x) + ' ' + r1(60 - 40 * Math.sin(2 * Math.PI * x / 150));
        if (w === 'square') d = 'M10 100 V20 H85 V100 H160 V20 H235 V100 H310 V20';
        if (w === 'tri') d = 'M10 60 L47 20 L122 100 L197 20 L272 100 L310 58';
        if (w === 'pulse') d = 'M10 100 V20 H35 V100 H110 V20 H135 V100 H210 V20 H235 V100 H310';
        if (w === 'saw') d = 'M10 100 L85 20 V100 L160 20 V100 L235 20 V100 L310 20';
        return `<svg class="mt-svg mt-wave" viewBox="0 0 320 120" role="img" aria-label="รูปคลื่น"><path d="M10 60 H310" stroke="#bbb" stroke-dasharray="6 6"/><path d="${d}" fill="none" stroke="#0d6e75" stroke-width="5" stroke-linejoin="round"/></svg>`;
    }

    /* ตารางย่าน DCV → [สเกลที่อ่าน, ตัวคูณ] ตามตารางที่ 2.1 หน้า 26 */
    const DCV = { 0.1: [10, 0.01], 0.5: [50, 0.01], 2.5: [250, 0.01], 10: [10, 1], 50: [50, 1], 250: [250, 1], 1000: [10, 100] };

    function render(root) {
        (root || document).querySelectorAll('[data-meter]').forEach(el => {
            const k = el.dataset.meter, d = el.dataset;
            const fracs = d.ohm ? d.ohm.split(',').map(v => ohmF(+v)) : (d.frac ? d.frac.split(',').map(Number) : []);
            const o = { fracs, nums: !!d.nums, labels: !!d.labels, sel: d.sel, hl: d.hl, disp: d.disp, kind: d.kind, dmm: !!d.dmm, val: d.val, marks: !!d.marks, wave: d.wave };
            if (!({ face, analog, dmm, conn, scope, wave })[k]) return;
            el.innerHTML = ({ face, analog, dmm, conn, scope, wave })[k](o);
        });
    }

    g.Meters = {
        render, face, analog, dmm, conn, scope, wave, ohmF, ac10F, ac10V, DCV,
        // ชิ้นส่วนสำหรับห้องแล็บเสมือน (vlab.js)
        faceInner, needle, PIVOT, FACE_T, pt, ang, AK, ASEL, analogBody, analogScrew, analogAdj, analogKnob,
        DK, DSEL, dmmBody, dmmLCD, dmmKnob, seg7
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => render());
    else render();
})(window);
