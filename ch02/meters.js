/* ===========================================
   Meters — ภาพเครื่องวัดของบทที่ 2 (วาดใหม่เพื่อการสอน ไม่ใช่ยี่ห้อใด)
   ใช้ได้ทุกหน้า: สไลด์ แบบฝึกหัด แบบทดสอบ เฉลย

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
   <div data-meter="lab"></div>                               ฝึกอ่านเข็ม / ซ้อมตารางที่ 2.1 (ใช้ในสไลด์และหน้าเว็บ)
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
    const pt = (f, r) => {
        const a = rad(-SPAN / 2 + SPAN * f);
        return [r1(PX + r * Math.sin(a)), r1(PY - r * Math.cos(a))];
    };
    const arc = (r, f0, f1) => {
        const [x0, y0] = pt(f0, r), [x1, y1] = pt(f1, r);
        return `M${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1}`;
    };
    const ohmF = R => (R === Infinity ? 0 : 20 / (20 + R));
    const tick = (f, ra, rb, w, c) => { const [a, b] = pt(f, ra), [x, y] = pt(f, rb); return `<path d="M${a} ${b} L${x} ${y}" stroke="${c || '#222'}" stroke-width="${w || 2}"/>`; };
    const lbl = (f, r, s, size, c, extra) => { const [x, y] = pt(f, r); return `<text x="${x}" y="${y}" font-size="${size || 26}" ${F} font-weight="500" text-anchor="middle" dominant-baseline="middle" fill="${c || '#222'}" ${extra || ''}>${s}</text>`; };

    function faceInner(o) {
        o = o || {};
        let s = `<rect x="0" y="80" width="1000" height="540" rx="18" fill="#fbfaf4" stroke="#bbb" stroke-width="3"/>`;
        // สเกลโอห์ม (บนสุด) 0 อยู่ขวา ∞ อยู่ซ้าย
        s += `<path d="${arc(500, 0, 1)}" fill="none" stroke="#222" stroke-width="3"/>`;
        const OT = [0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 150, 200, 300, 500, 1000, 2000];
        OT.forEach(R => { s += tick(ohmF(R), 500, 486, 2); });
        [0, 1, 2, 5, 10, 20, 30, 50, 100, 200].forEach(R => { s += tick(ohmF(R), 500, 478, 3) + lbl(ohmF(R), 528, R, 26); });
        s += lbl(0, 528, "∞", 30) + lbl(1.06, 500, "Ω", 30);
        // แถบกระจกเงา
        s += `<path d="${arc(470, 0, 1)}" fill="none" stroke="#c9d6df" stroke-width="20"/>`;
        s += `<path d="${arc(470, 0, 1)}" fill="none" stroke="#e9f0f4" stroke-width="6"/>`;
        // สเกลดำ DCV.A & ACV (ใต้กระจก) 0 อยู่ซ้าย
        s += `<path d="${arc(450, 0, 1)}" fill="none" stroke="#222" stroke-width="3"/>`;
        for (let i = 0; i <= 50; i++) s += tick(i / 50, 450, i % 5 ? 438 : 428, i % 5 ? 2 : 3);
        [[10, 410], [50, 377], [250, 344]].forEach(([full, r]) => {
            for (let k = 0; k <= 5; k++) s += lbl(k / 5, r, full * k / 5, 25);
        });
        s += `<text x="70" y="352" font-size="22" ${F} font-weight="600" fill="#222">DCV.A</text><text x="70" y="376" font-size="22" ${F} font-weight="600" fill="#222">&amp;ACV</text>`;
        // สเกลแดง AC 10 V (เฉพาะย่าน 10 ACV) ช่วงต้นสเกลไม่เท่ากับสเกลดำ
        s += `<path d="${arc(312, 0.05, 1)}" fill="none" stroke="#c0392b" stroke-width="3"/>`;
        for (let v = 1; v <= 10; v++) { const f = 0.05 + 0.95 * Math.pow(v / 10, 1.08); s += tick(f, 312, 300, 2, '#c0392b'); if (v % 2 === 0) s += lbl(f, 285, v, 20, '#c0392b'); }
        s += `<text x="150" y="470" font-size="22" ${F} font-weight="600" fill="#c0392b">AC10V</text>`;
        // สเกลย่อยอื่น (hFE, ILI LV, dB) แสดงให้เห็นว่ามี ไม่ใช้อ่านในบทนี้
        s += `<path d="${arc(258, 0.03, 0.97)}" fill="none" stroke="#2c6fbb" stroke-width="2.5"/>`;
        s += `<path d="${arc(232, 0.03, 0.97)}" fill="none" stroke="#555" stroke-width="2"/>`;
        s += `<path d="${arc(206, 0.03, 0.97)}" fill="none" stroke="#c0392b" stroke-width="2"/>`;
        s += `<text x="232" y="520" font-size="20" ${F} fill="#2c6fbb">hFE</text><text x="250" y="548" font-size="18" ${F} fill="#555">LI · LV</text><text x="280" y="574" font-size="18" ${F} fill="#c0392b">dB</text>`;
        s += `<text x="40" y="118" font-size="20" ${F} fill="#888">CONTINUITY</text><circle cx="58" cy="140" r="9" fill="#a33" opacity=".6"/>`;
        // เข็ม
        const fr = o.fracs || [];
        fr.forEach((f, i) => {
            const ff = Math.max(-0.04, Math.min(1.04, f));
            const [x, y] = pt(ff, 545);
            s += `<path class="mt-needle" d="M${PX} ${PY} L${x} ${y}" stroke="#111" stroke-width="4"/>`;
            if (o.nums) { const [nx, ny] = pt(ff, 575); s += `<circle cx="${nx}" cy="${ny}" r="17" fill="#2e9b57"/><text x="${nx}" y="${ny + 1}" font-size="22" ${F} font-weight="700" fill="#fff" text-anchor="middle" dominant-baseline="middle">${i + 1}</text>`; }
        });
        s += `<path d="M420 620 A80 80 0 0 1 580 620 Z" fill="#3a3a3a"/>`;
        // เลขชี้ส่วนประกอบสเกล (รูปที่ 2.3)
        if (o.labels) {
            const call = (n, x, y, tx, ty) => `<path d="M${x} ${y} L${tx} ${ty}" stroke="#d6455d" stroke-width="2.5"/><circle cx="${x}" cy="${y}" r="20" fill="#d6455d"/><text x="${x}" y="${y + 1}" font-size="24" ${F} font-weight="700" fill="#fff" text-anchor="middle" dominant-baseline="middle">${n}</text>`;
            const [a1, b1] = pt(0.03, 500), [a8, b8] = pt(0.97, 470), [a2, b2] = pt(0.02, 445), [a3, b3] = pt(0.12, 312);
            s += call(1, 40, 210, a1, b1) + call(2, 30, 300, a2 + 4, b2) + call(3, 105, 430, a3, b3)
                + call(4, 190, 515, 232, 512) + call(5, 960, 470, pt(0.96, 232)[0], pt(0.96, 232)[1]) + call(6, 960, 540, pt(0.94, 232)[0], pt(0.94, 232)[1])
                + call(7, 330, 600, 300, 575) + call(8, 960, 260, a8, b8);
        }
        return s;
    }
    function face(o) {
        return `<svg class="mt-svg" viewBox="${o.labels ? '-20 70 1040 560' : '0 80 1000 540'}" role="img" aria-label="หน้าปัดมิเตอร์เข็ม">${faceInner(o)}</svg>`;
    }

    /* ---------- ตัวมิเตอร์เข็มทั้งเครื่อง ---------- */
    // ตำแหน่งสวิตช์เลือกย่าน: มุมตามเข็มนาฬิกาจากด้านบน
    const ASEL = [
        ['off', 0, 'OFF', 'off'],
        ['acv1000', 18, '1000', 'acv'], ['acv250', 36, '250', 'acv'], ['acv50', 54, '50', 'acv'], ['acv10', 72, '10', 'acv'],
        ['x10k', 92, '×10k', 'ohm'], ['x1k', 110, '×1k', 'ohm'], ['x100', 128, '×100', 'ohm'], ['x10', 146, '×10', 'ohm'], ['x1', 164, '×1', 'ohm'],
        ['ma250', 186, '250', 'dca'], ['ma25', 204, '25', 'dca'], ['ma2.5', 222, '2.5', 'dca'],
        ['dcv0.1', 240, '0.1', 'dcv'], ['dcv0.5', 256, '0.5', 'dcv'], ['dcv2.5', 272, '2.5', 'dcv'], ['dcv10', 288, '10', 'dcv'], ['dcv50', 304, '50', 'dcv'], ['dcv250', 320, '250', 'dcv'], ['dcv1000', 338, '1000', 'dcv']
    ];
    const GCOL = { acv: '#e0483b', ohm: '#fff', dca: '#fff', dcv: '#fff', off: '#9ad19a' };
    function analog(o) {
        const cx = 400, cy = 662, R = 172;
        const at = (deg, r) => [r1(cx + r * Math.sin(rad(deg))), r1(cy - r * Math.cos(rad(deg)))];
        let s = `<rect x="100" y="20" width="600" height="880" rx="46" fill="#26272b"/>
            <rect x="130" y="48" width="540" height="330" rx="14" fill="#ddd"/>
            <svg x="135" y="54" width="530" height="290" viewBox="0 80 1000 540">${faceInner({ fracs: o.fracs || [0] })}</svg>
            <circle cx="400" cy="390" r="15" fill="#111" stroke="#666" stroke-width="3"/><path d="M390 390 H410" stroke="#888" stroke-width="3"/>
            <circle cx="630" cy="418" r="38" fill="#111" stroke="#555" stroke-width="4"/><text x="630" y="476" font-size="22" ${F} fill="#eee" text-anchor="middle">0Ω ADJ</text>
            <circle cx="180" cy="452" r="20" fill="#111" stroke="#777" stroke-width="5"/><text x="180" y="496" font-size="20" ${F} fill="#e0483b" text-anchor="middle">OUTPUT</text>`;
        // ไฮไลต์กลุ่มย่าน
        if (o.hl) {
            const its = ASEL.filter(a => a[3] === o.hl);
            const a0 = its[0][1] - 9, a1 = its[its.length - 1][1] + 9;
            const [x0, y0] = at(a0, R), [x1, y1] = at(a1, R);
            s += `<path d="M${x0} ${y0} A${R} ${R} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}" fill="none" stroke="#f2a65a" stroke-width="64" opacity=".85"/>`;
        }
        ASEL.forEach(([id, deg, t, grp]) => {
            const [x, y] = at(deg, R);
            const [tx, ty] = at(deg, R - 40);
            s += `<path d="M${tx} ${ty} L${at(deg, R - 26)[0]} ${at(deg, R - 26)[1]}" stroke="${GCOL[grp]}" stroke-width="5"/>`;
            s += `<text x="${x}" y="${y}" font-size="${t.length > 3 ? 21 : 24}" ${F} font-weight="500" fill="${GCOL[grp]}" text-anchor="middle" dominant-baseline="middle">${t}</text>`;
        });
        const glab = (deg, t, c) => { const [x, y] = at(deg, R + 46); return `<text x="${x}" y="${y}" font-size="26" ${F} font-weight="700" fill="${c}" text-anchor="middle" dominant-baseline="middle">${t}</text>`; };
        s += glab(46, 'ACV', '#e0483b') + glab(128, 'Ω', '#fff') + glab(204, 'DCmA', '#fff') + glab(290, 'DCV', '#fff');
        // ปุ่มหมุน
        const sel = ASEL.find(a => a[0] === (o.sel || 'off')) || ASEL[0];
        const [p1, q1] = at(sel[1], 112), [p2, q2] = at(sel[1] + 180, 112);
        s += `<circle cx="${cx}" cy="${cy}" r="126" fill="#1a1a1c" stroke="#444" stroke-width="4"/>
              <path d="M${p2} ${q2} L${p1} ${q1}" stroke="#b87333" stroke-width="40" stroke-linecap="round"/>
              <path d="M${cx} ${cy} L${at(sel[1], 100)[0]} ${at(sel[1], 100)[1]}" stroke="#fff" stroke-width="6" stroke-linecap="round"/>`;
        // ขั้วเสียบสาย
        s += `<circle cx="175" cy="850" r="26" fill="#111" stroke="#888" stroke-width="6"/><text x="175" y="808" font-size="22" ${F} fill="#fff" text-anchor="middle">−COM</text>
              <rect x="585" y="815" width="90" height="72" rx="14" fill="#c0392b"/><circle cx="625" cy="850" r="24" fill="#111" stroke="#e8e8e8" stroke-width="5"/><text x="664" y="808" font-size="26" ${F} fill="#fff" text-anchor="middle">+</text>`;
        let vb = '100 20 600 880';
        if (o.labels) {
            vb = '0 10 800 900';
            const call = (n, x, y, tx, ty) => `<path d="M${x} ${y} L${tx} ${ty}" stroke="#d6455d" stroke-width="3"/><circle cx="${x}" cy="${y}" r="24" fill="#d6455d"/><text x="${x}" y="${y + 1}" font-size="26" ${F} font-weight="700" fill="#fff" text-anchor="middle" dominant-baseline="middle">${n}</text>`;
            s += call(1, 750, 120, 640, 150) + call(2, 50, 80, 162, 128) + call(3, 50, 230, 330, 260)
                + call(4, 50, 390, 384, 390) + call(5, 750, 418, 668, 418) + call(6, 50, 452, 160, 452)
                + call(7, 750, 662, 520, 662) + call(8, 750, 850, 650, 850) + call(9, 50, 850, 150, 850);
        }
        return `<svg class="mt-svg" viewBox="${vb}" role="img" aria-label="มัลติมิเตอร์ชนิดแอนะลอก">${s}</svg>`;
    }

    /* ---------- มัลติมิเตอร์ดิจิทัล (ย่านแบบรุ่นราคาถูกที่ใช้ในหนังสือ) ---------- */
    const DSEL = [
        ['off', 0, 'OFF', 'off'],
        ['acv750', 20, '750', 'acv'], ['acv200', 36, '200', 'acv'],
        ['a200u', 58, '200µ', 'dca'], ['a2000u', 74, '2000µ', 'dca'], ['a20m', 90, '20m', 'dca'], ['a200m', 106, '200m', 'dca'],
        ['a10', 126, '10A', 'a10'], ['hfe', 146, 'hFE', 'hfe'], ['diode', 168, '→|', 'diode'],
        ['o200', 192, '200', 'ohm'], ['o2000', 208, '2000', 'ohm'], ['o20k', 224, '20k', 'ohm'], ['o200k', 240, '200k', 'ohm'], ['o2000k', 256, '2000k', 'ohm'],
        ['v200m', 278, '200m', 'dcv'], ['v2000m', 294, '2000m', 'dcv'], ['v20', 310, '20', 'dcv'], ['v200', 326, '200', 'dcv'], ['v1000', 342, '1000', 'dcv']
    ];
    function dmm(o) {
        const cx = 380, cy = 480, R = 205;
        const at = (deg, r) => [r1(cx + r * Math.sin(rad(deg))), r1(cy - r * Math.cos(rad(deg)))];
        const disp = o.disp || '000';
        let s = `<rect x="130" y="20" width="500" height="960" rx="50" fill="#f5c518" stroke="#c99a00" stroke-width="4"/>
            <rect x="180" y="58" width="400" height="150" rx="12" fill="#3b3b3b"/><rect x="196" y="72" width="368" height="122" rx="6" fill="#c9d3b8"/>
            <text x="548" y="168" font-size="96" ${F} font-weight="500" fill="#1d1d1d" text-anchor="end" letter-spacing="6">${disp}</text>`;
        const glab = (deg, t, r) => { const [x, y] = at(deg, r || R + 44); return `<text x="${x}" y="${y}" font-size="26" ${F} font-weight="700" fill="#222" text-anchor="middle" dominant-baseline="middle">${t}</text>`; };
        s += `<circle cx="${cx}" cy="${cy}" r="${R + 18}" fill="none" stroke="#2e7d32" stroke-width="3" stroke-dasharray="2 8"/>`;
        DSEL.forEach(([id, deg, t]) => {
            const [x, y] = at(deg, R);
            s += `<circle cx="${at(deg, R - 34)[0]}" cy="${at(deg, R - 34)[1]}" r="5" fill="#222"/>`;
            s += `<text x="${x}" y="${y}" font-size="${t.length > 4 ? 20 : 23}" ${F} font-weight="600" fill="#222" text-anchor="middle" dominant-baseline="middle">${t}</text>`;
        });
        s += glab(28, 'V~') + glab(82, 'A⎓') + glab(224, 'Ω') + glab(310, 'V⎓');
        const sel = DSEL.find(a => a[0] === (o.sel || 'off')) || DSEL[0];
        const [p1, q1] = at(sel[1], 128), [p2, q2] = at(sel[1] + 180, 128);
        s += `<circle cx="${cx}" cy="${cy}" r="150" fill="#f08a24" stroke="#c96a10" stroke-width="4"/>
              <path d="M${p2} ${q2} L${p1} ${q1}" stroke="#3949ab" stroke-width="46" stroke-linecap="round"/>
              <path d="M${at(sel[1], 70)[0]} ${at(sel[1], 70)[1]} L${p1} ${q1}" stroke="#fff" stroke-width="6" stroke-linecap="round"/>`;
        // ช่องเสียบทรานซิสเตอร์และขั้วสาย
        s += `<circle cx="230" cy="790" r="44" fill="#3949ab"/><text x="230" y="866" font-size="20" ${F} fill="#222" text-anchor="middle">NPN · PNP</text>
              <circle cx="560" cy="760" r="24" fill="#222" stroke="#b58500" stroke-width="7"/><text x="490" y="767" font-size="22" ${F} font-weight="700" fill="#222" text-anchor="middle">10A</text>
              <circle cx="560" cy="840" r="24" fill="#222" stroke="#b58500" stroke-width="7"/><text x="482" y="847" font-size="22" ${F} font-weight="700" fill="#222" text-anchor="middle">VΩmA</text>
              <circle cx="560" cy="920" r="24" fill="#222" stroke="#b58500" stroke-width="7"/><text x="488" y="927" font-size="22" ${F} font-weight="700" fill="#222" text-anchor="middle">COM</text>`;
        let vb = '130 20 500 960';
        if (o.labels) {
            vb = '0 10 760 990';
            const call = (n, x, y, tx, ty) => `<path d="M${x} ${y} L${tx} ${ty}" stroke="#d6455d" stroke-width="3"/><circle cx="${x}" cy="${y}" r="24" fill="#d6455d"/><text x="${x}" y="${y + 1}" font-size="24" ${F} font-weight="700" fill="#fff" text-anchor="middle" dominant-baseline="middle">${n}</text>`;
            const P = id => at(DSEL.find(a => a[0] === id)[1], R + 14);
            s += call(1, 60, 130, 196, 130) + call(2, 60, 560, 330, 540) + call(3, 60, 790, 186, 790)
                + call(4, 700, 760, 586, 760) + call(5, 700, 840, 586, 840) + call(6, 700, 920, 586, 920)
                + call(7, 60, 210, ...at(0, R + 4)) + call(8, 60, 390, ...P('v200')) + call(9, 700, 200, ...P('acv200'))
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

    /* ---------- ฝึกอ่านเข็ม / ซ้อมตารางที่ 2.1 ----------
       ย่าน → สเกลที่ใช้อ่านและตัวคูณ ตามตารางที่ 2.1 ในหนังสือ */
    const DCV = { 0.1: [10, 0.01], 0.5: [50, 0.01], 2.5: [250, 0.01], 10: [10, 1], 50: [50, 1], 250: [250, 1], 1000: [10, 100] };
    const fmt = n => String(Math.round(n * 1000) / 1000);
    function lab(el) {
        const SRC = (el.dataset.src || '0.4,1,2.3,4,8.6,12.5,23,29').split(',').map(Number);
        const RANGES = (el.dataset.ranges || '0.5,2.5,10,50').split(',').map(Number);
        let V = SRC[0], rng = RANGES[RANGES.length - 1], shown = false, cur = 0;
        el.classList.add('mt-lab');
        el.innerHTML = `<div class="ml-face"></div>
            <div class="ml-ctl">
              <div class="ml-row"><span class="ml-h">แหล่งจ่าย</span>${SRC.map(v => `<button type="button" data-v="${v}">${v} V</button>`).join('')}<button type="button" data-a="rand" class="alt">สุ่มโจทย์</button></div>
              <div class="ml-row"><span class="ml-h">ย่าน DCV</span>${RANGES.map(r => `<button type="button" data-r="${r}">${r} V</button>`).join('')}</div>
              <div class="ml-out" aria-live="polite"></div>
              <div class="ml-row"><button type="button" data-a="show" class="go">เฉลยค่าที่อ่าน</button></div>
            </div>`;
        const out = el.querySelector('.ml-out'), fbox = el.querySelector('.ml-face');
        function draw() {
            const over = V > rng;
            const target = over ? 1.045 : V / rng;
            el.querySelectorAll('[data-v]').forEach(b => b.classList.toggle('on', +b.dataset.v === V));
            el.querySelectorAll('[data-r]').forEach(b => b.classList.toggle('on', +b.dataset.r === rng));
            // เข็มเคลื่อนนุ่ม ๆ จากตำแหน่งเดิม
            const from = cur, t0 = performance.now();
            const step = now => {
                const k = Math.min(1, (now - t0) / 450), e = 1 - Math.pow(1 - k, 3);
                cur = from + (target - from) * e;
                fbox.innerHTML = face({ fracs: [cur] });
                if (k < 1) requestAnimationFrame(step); else fbox.classList.toggle('over', over);
            };
            requestAnimationFrame(step);
            const [full, mul] = DCV[rng];
            if (over) out.innerHTML = `<b class="bad">เกินย่าน!</b> แรงดัน ${V} V สูงกว่าย่าน ${rng} V เข็มตีเกินสเกล มิเตอร์อาจเสีย<br>ช่องนี้ในตาราง 2.1 ถูกกากบาท ให้เปลี่ยนไปย่านที่สูงกว่า`;
            else if (!shown) out.innerHTML = `ย่าน ${rng} V อ่านสเกล <b>0–${full}</b>${mul === 1 ? ' อ่านได้โดยตรง' : ` แล้วคูณ <b>${mul}</b>`} · เข็มชี้เท่าไร`;
            else {
                const sc = V / rng * full;
                out.innerHTML = `อ่านสเกล 0–${full} ได้ <b>${fmt(sc)}</b>${mul === 1 ? '' : ` × ${mul}`} = <b class="ok">${fmt(sc * mul)} V</b>`
                    + (V / rng < 0.2 ? `<br><span class="hint">เข็มบ่ายน้อยมาก อ่านละเอียดไม่ได้ ลองย่านที่ต่ำกว่า (แต่ยังสูงกว่า ${V} V)</span>` : '');
            }
        }
        el.addEventListener('click', e => {
            const b = e.target.closest('button'); if (!b) return;
            e.stopPropagation();
            if (b.dataset.v) { V = +b.dataset.v; shown = false; }
            else if (b.dataset.r) { rng = +b.dataset.r; shown = false; }
            else if (b.dataset.a === 'show') shown = true;
            else if (b.dataset.a === 'rand') {
                const all = Object.keys(DCV).map(Number);
                rng = all[Math.floor(Math.random() * all.length)];
                V = Math.round((5 + Math.floor(Math.random() * 46)) / 50 * rng * 1000) / 1000;   // เข็มตกที่ขีดย่อยเสมอ
                if (!RANGES.includes(rng)) el.querySelectorAll('[data-r]').forEach(x => x.classList.remove('on'));
                shown = false;
            }
            b.blur(); draw();
        });
        el.addEventListener('keydown', e => e.stopPropagation());
        draw();
    }

    function render(root) {
        (root || document).querySelectorAll('[data-meter]').forEach(el => {
            const k = el.dataset.meter, d = el.dataset;
            if (k === 'lab') { lab(el); return; }
            const fracs = d.ohm ? d.ohm.split(',').map(v => ohmF(+v)) : (d.frac ? d.frac.split(',').map(Number) : []);
            const o = { fracs, nums: !!d.nums, labels: !!d.labels, sel: d.sel, hl: d.hl, disp: d.disp, kind: d.kind, dmm: !!d.dmm, val: d.val, marks: !!d.marks, wave: d.wave };
            el.innerHTML = ({ face, analog, dmm, conn, scope, wave })[k](o);
        });
    }

    g.Meters = { render, face, analog, dmm, conn, scope, wave, ohmF, DCV };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => render());
    else render();
})(window);
