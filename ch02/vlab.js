/* ===========================================
   ห้องแล็บมัลติมิเตอร์เสมือน บทที่ 2 (ใช้กับ lab.html ต้องโหลด meters.js ก่อน)
   - โต๊ะทดลอง SVG ซูม/เลื่อนได้ (ล้อเมาส์ สองนิ้ว ปุ่ม + −)
   - มิเตอร์เข็ม (รูปที่ 2.2) และมิเตอร์ดิจิทัล (รูปที่ 2.13) หมุนปุ่มเลือกย่าน สกรูปรับเข็ม ปุ่ม 0Ω ADJ ได้
   - ลากปลั๊กเสียบขั้ว ลากปลายสายวัดไปแตะจุดวัด ค่าที่อ่านได้คำนวณจากวงจรจริง (แก้สมการโนด)
   - ภารกิจทีละขั้นเรียงตามหนังสือ  ?m=3 เปิดภารกิจที่ 3  ?embed=1 ฝังในสไลด์
   ความคืบหน้าเก็บในเครื่องนักเรียน (localStorage: beb-ch02-lab)
   =========================================== */
(function () {
    'use strict';
    const M = window.Meters;
    const $ = s => document.querySelector(s);
    const F = 'font-family="Prompt, Kanit, sans-serif"';
    const FT = 'font-family="Kanit, Sarabun, sans-serif"';
    const r1 = n => Math.round(n * 10) / 10;
    const rad = d => d * Math.PI / 180;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const num = n => { const s = String(Math.round(n * 1000) / 1000); return s; };
    const qs = new URLSearchParams(location.search);
    const EMBED = qs.get('embed') === '1';
    const KEY = 'beb-ch02-lab';
    const store = {
        get() { try { return JSON.parse(localStorage.getItem(KEY)) || { done: [] }; } catch (e) { return { done: [] }; } },
        set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* ใช้งานต่อได้แม้บันทึกไม่ได้ */ } }
    };

    /* ---------- ผังโต๊ะ (หน่วยโลก 2000 × 1200) ---------- */
    const WORLD = { x: 0, y: 60, w: 2000, h: 1120 };
    const MT = { analog: { tx: 20, ty: 150, s: 1 }, dmm: { tx: 10, ty: 132, s: 0.95 } };
    const JACKS = {
        analog: { com: M.AK.com, pos: M.AK.pos, out: M.AK.out },
        dmm: { com: M.DK.com, vma: M.DK.vma, a10: M.DK.a10 }
    };
    const JNAME = { com: '−COM', pos: '+', out: 'OUTPUT', vma: 'VΩmA', a10: '10A' };
    const toW = (m, p) => { const t = MT[m]; return [t.tx + t.s * p[0], t.ty + t.s * p[1]]; };
    const REST = { red: { plug: [760, 1060], tip: [880, 690] }, black: { plug: [670, 1070], tip: [800, 740] } };

    /* ---------- สถานะ ---------- */
    const S = {
        meter: 'analog', sel: { analog: 'off', dmm: 'off' },
        screw: 0, zBase: 0, adjDeg: 0, oblique: false, helper: false,
        fuse: { analog: true, dmm: true }, danger: null,
        leads: { red: null, black: null },
        fx: 'cell', psuV: 12.5, sw: true, link: true, breaker: false, lampBig: false,
        zoomed: false
    };
    function restLeads() {
        ['red', 'black'].forEach(c => { S.leads[c] = { jack: null, plug: REST[c].plug.slice(), tip: REST[c].tip.slice(), tp: null }; });
    }
    restLeads();
    const zoff = () => clamp(S.zBase + S.screw / 1200, -0.08, 0.08);
    // ค่าตั้งต้นของแต่ละย่าน Ω (แบตเตอรี่ในเครื่องให้กระแสไม่เท่ากัน จึงต้องปรับ 0 Ω ทุกครั้งที่เปลี่ยนย่าน)
    const KR = { x1: 0.93, x10: 0.955, x100: 0.97, x1k: 0.985, x10k: 0.91 };

    /* ---------- วงจรบนโต๊ะ ---------- */
    const V = (a, b, v) => ({ t: 'V', a, b, v }), R = (a, b, r) => ({ t: 'R', a, b, r }), I = (a, b, i) => ({ t: 'I', a, b, i });
    const T = (x, y, t, size, c, anchor, wt, extra) => `<text x="${x}" y="${y}" font-size="${size || 26}" ${FT} font-weight="${wt || 500}" fill="${c || '#333'}" text-anchor="${anchor || 'middle'}" dominant-baseline="middle" ${extra || ''}>${t}</text>`;
    const wire = (pts, c) => `<path d="M${pts.map(p => p.join(' ')).join(' L')}" fill="none" stroke="#5b4636" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/><path d="M${pts.map(p => p.join(' ')).join(' L')}" fill="none" stroke="${c || '#c98b3a'}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>`;
    const BANDS = { 0: '#111', 1: '#7b3f00', 2: '#d32f2f', 3: '#f57c00', 4: '#fbc02d', 5: '#388e3c', 6: '#1976d2', 7: '#7b1fa2', 8: '#888', 9: '#fff', g: '#c9a227' };
    const RES = [
        { v: 10, b: [1, 0, 0, 'g'], name: 'น้ำตาล ดำ ดำ' },
        { v: 220, b: [2, 2, 1, 'g'], name: 'แดง แดง น้ำตาล' },
        { v: 1000, b: [1, 0, 2, 'g'], name: 'น้ำตาล ดำ แดง' },
        { v: 4700, b: [4, 7, 2, 'g'], name: 'เหลือง ม่วง แดง' },
        { v: 100000, b: [1, 0, 4, 'g'], name: 'น้ำตาล ดำ เหลือง' }
    ];
    const FX = {
        cell: {
            name: 'ถ่านไฟฉาย 1.5 V',
            tps: [{ id: 'p', node: 'cp', x: 1680, y: 520, lab: 'ขั้ว + ของถ่าน', mark: false }, { id: 'n', node: 'gnd', x: 1106, y: 520, lab: 'ขั้ว − ของถ่าน', mark: false }],
            elems: () => [V('ci', 'gnd', 1.5), R('cp', 'ci', 0.2)],
            draw: () => `<ellipse cx="1400" cy="610" rx="300" ry="26" fill="#000" opacity=".12"/>
                <rect x="1112" y="458" width="14" height="124" rx="5" fill="#b8bec4"/>
                <rect x="1120" y="450" width="520" height="140" rx="22" fill="#2b2d31"/>
                <rect x="1180" y="450" width="380" height="140" fill="#1f6fb2"/>
                <rect x="1120" y="452" width="520" height="30" rx="14" fill="#fff" opacity=".12"/>
                <rect x="1640" y="492" width="40" height="56" rx="9" fill="#c9ced3" stroke="#8c949b" stroke-width="2"/>
                ${T(1370, 522, '1.5 V', 56, '#fff', 'middle', 600)}${T(1370, 568, 'AA', 22, '#cfe3f5')}
                ${T(1604, 520, '+', 46, '#fff', 'middle', 700)}${T(1150, 518, '−', 46, '#fff', 'middle', 700)}
                ${T(1400, 400, 'ถ่านไฟฉาย 1.5 V', 30, '#444', 'middle', 600)}`
        },
        bat9: {
            name: 'แบตเตอรี่ 9 V',
            tps: [{ id: 'p', node: 'bp', x: 1350, y: 398, lab: 'ขั้ว + ของแบตเตอรี่', mark: false }, { id: 'n', node: 'gnd', x: 1470, y: 398, lab: 'ขั้ว − ของแบตเตอรี่', mark: false }],
            elems: () => [V('bi', 'gnd', 9), R('bp', 'bi', 1.5)],
            draw: () => `<ellipse cx="1410" cy="872" rx="150" ry="20" fill="#000" opacity=".12"/>
                <rect x="1300" y="420" width="220" height="440" rx="20" fill="#2c2f35"/>
                <rect x="1300" y="520" width="220" height="250" fill="#e0a21b"/>
                <rect x="1304" y="424" width="40" height="432" rx="16" fill="#fff" opacity=".08"/>
                <rect x="1328" y="396" width="44" height="30" rx="6" fill="#c9ced3" stroke="#8c949b" stroke-width="2"/>
                <path d="M1446 396 h48 l8 14 l-8 14 h-48 l-8 -14 z" fill="#c9ced3" stroke="#8c949b" stroke-width="2"/>
                ${T(1350, 456, '+', 40, '#fff', 'middle', 700)}${T(1470, 456, '−', 40, '#fff', 'middle', 700)}
                ${T(1410, 640, '9 V', 70, '#2c2f35', 'middle', 700)}
                ${T(1410, 340, 'แบตเตอรี่ 9 V', 30, '#444', 'middle', 600)}`
        },
        psu: {
            name: 'แหล่งจ่ายไฟตรง 0–30 V',
            tps: [{ id: 'p', node: 'pp', x: 1430, y: 724, lab: 'ขั้ว + (แดง) ของแหล่งจ่าย', mark: false }, { id: 'n', node: 'gnd', x: 1270, y: 724, lab: 'ขั้ว − (ดำ) ของแหล่งจ่าย', mark: false }],
            elems: () => [V('pi', 'gnd', S.psuV), R('pp', 'pi', 0.05)],
            draw: (st) => {
                const a = st ? st.psuI : 0;
                return `<ellipse cx="1450" cy="836" rx="380" ry="22" fill="#000" opacity=".12"/>
                <rect x="1080" y="330" width="740" height="490" rx="22" fill="#d9dbd6" stroke="#a9aca6" stroke-width="3"/>
                <rect x="1080" y="330" width="740" height="40" rx="20" fill="#fff" opacity=".35"/>
                ${T(1450, 362, 'DC POWER SUPPLY 0–30 V', 24, '#555', 'middle', 600)}
                <rect x="1120" y="392" width="420" height="170" rx="12" fill="#1c1c1c"/>
                ${M.seg7(S.psuV.toFixed(2).padStart(5, ' '), 1160, 424, 64, '#7CFC7C')}
                ${T(1240, 538, 'VOLTAGE (V)', 18, '#9fdc9f')}
                ${M.seg7(Math.min(9.99, Math.abs(a)).toFixed(2), 1418, 446, 40, '#ff6b5b')}${T(1470, 538, 'CURRENT (A)', 18, '#ff9d93')}
                <g data-drag="psuknob" style="cursor:grab"><circle cx="1660" cy="520" r="78" fill="#2a2a2a" stroke="#111" stroke-width="4"/>
                <g transform="rotate(${r1(S.psuV * 10 - 150)} 1660 520)"><circle cx="1660" cy="520" r="62" fill="#3a3a3a"/><path d="M1660 520 V466" stroke="#fff" stroke-width="7" stroke-linecap="round"/></g></g>
                ${T(1660, 626, 'หมุนปรับแรงดัน', 22, '#333', 'middle', 600)}
                <rect x="1225" y="676" width="250" height="96" rx="14" fill="#c6c8c3"/>
                <circle cx="1270" cy="724" r="24" fill="#1c1c1c" stroke="#555" stroke-width="5"/><circle cx="1430" cy="724" r="24" fill="#c0392b" stroke="#7a1f16" stroke-width="5"/>
                <circle cx="1270" cy="724" r="8" fill="#777"/><circle cx="1430" cy="724" r="8" fill="#e8b0aa"/>
                ${T(1270, 664, '−', 40, '#222', 'middle', 700)}${T(1430, 664, '+', 40, '#c0392b', 'middle', 700)}
                <circle cx="1150" cy="724" r="12" fill="#5ce65c"/>${T(1150, 760, 'ON', 16, '#333')}`;
            }
        },
        lamp: {
            name: 'วงจรหลอดไฟ',
            tps: [
                { id: 'bp', node: 'bp', x: 1150, y: 300, lab: 'ขั้ว + ของถ่าน' },
                { id: 's', node: 's', x: 1460, y: 300, lab: 'หลังสวิตช์' },
                { id: 'lt', node: 's', x: 1840, y: 440, lab: 'ขาหลอดด้านบน' },
                { id: 'lb', node: 'l', x: 1840, y: 690, lab: 'ขาหลอดด้านล่าง' },
                { id: 'k1', node: 'l', x: 1650, y: 880, lab: 'จุดตัดวงจร ฝั่งหลอด' },
                { id: 'k2', node: 'gnd', x: 1410, y: 880, lab: 'จุดตัดวงจร ฝั่งถ่าน' },
                { id: 'bn', node: 'gnd', x: 1150, y: 880, lab: 'ขั้ว − ของถ่าน' }
            ],
            elems: () => {
                const e = [V('bpi', 'gnd', 6), R('bp', 'bpi', 0.01), R('s', 'l', S.lampBig ? 11.99 : 39.6)];
                if (S.sw) e.push(R('bp', 's', 0.001));
                if (S.link) e.push(R('l', 'gnd', 0.001));
                return e;
            },
            draw: (st) => {
                const br = st ? clamp(st.lampP / (S.lampBig ? 3 : 0.9), 0, 1.3) : 0;
                let s = `<rect x="940" y="200" width="1000" height="840" rx="26" fill="#f4efe2" stroke="#d8ccb2" stroke-width="3"/>
                    ${wire([[1060, 400], [1060, 300], [1230, 300]])}${wire([[1370, 300], [1840, 300], [1840, 480]])}
                    ${wire([[1840, 640], [1840, 880], [1650, 880]])}${wire([[1410, 880], [1060, 880], [1060, 780]])}`;
                // ถ่าน 4 ก้อนในรางถ่าน
                s += `<rect x="995" y="400" width="130" height="380" rx="14" fill="#2b2d31"/>`;
                for (let i = 0; i < 4; i++) s += `<rect x="1012" y="${412 + i * 91}" width="96" height="82" rx="10" fill="#1f6fb2"/>${T(1060, 453 + i * 91, '1.5V', 20, '#fff')}`;
                s += T(1060, 384, '+', 34, '#c0392b', 'middle', 700) + T(1060, 800, '−', 34, '#222', 'middle', 700) + T(966, 590, 'ถ่าน 4 ก้อน = 6 V', 24, '#333', 'middle', 600, 'transform="rotate(-90 966 590)"');
                // สวิตช์
                const lx = S.sw ? 1370 : 1345, ly = S.sw ? 300 : 222;
                s += `<g data-click="sw" style="cursor:pointer"><rect x="1200" y="180" width="200" height="150" fill="transparent"/>
                    <rect x="1210" y="292" width="180" height="20" rx="8" fill="#9a8f7e"/>
                    <circle cx="1230" cy="300" r="13" fill="#bfc5ca" stroke="#555" stroke-width="3"/><circle cx="1370" cy="300" r="13" fill="#bfc5ca" stroke="#555" stroke-width="3"/>
                    <path d="M1230 300 L${lx} ${ly}" stroke="#333" stroke-width="10" stroke-linecap="round"/><circle cx="${lx}" cy="${ly}" r="9" fill="#e53935"/></g>
                    ${T(1300, 350, S.sw ? 'สวิตช์ เปิด (คลิกเพื่อปิด)' : 'สวิตช์ ปิด (คลิกเพื่อเปิด)', 22, S.sw ? '#2e7d32' : '#c62828', 'middle', 600)}`;
                // หลอดไฟ
                s += `<defs><radialGradient id="vlGlow"><stop offset="0" stop-color="#fff6b0" stop-opacity="${clamp(br, 0, 1)}"/><stop offset=".55" stop-color="#ffd54f" stop-opacity="${clamp(br * 0.7, 0, 1)}"/><stop offset="1" stop-color="#ffd54f" stop-opacity="0"/></radialGradient></defs>
                    <circle cx="1840" cy="560" r="${170 + br * 40}" fill="url(#vlGlow)"/>
                    <rect x="1808" y="610" width="64" height="40" rx="6" fill="#9aa0a6"/><path d="M1808 620 h64 M1808 632 h64" stroke="#6d7378" stroke-width="3"/>
                    <circle cx="1840" cy="545" r="72" fill="${br > 0.05 ? '#fff9d6' : '#eef3f6'}" fill-opacity=".85" stroke="#9aa6ad" stroke-width="3"/>
                    <path d="M1822 610 L1822 560 L1832 545 L1840 560 L1848 545 L1858 560 L1858 610" fill="none" stroke="${br > 0.05 ? '#ff8f00' : '#777'}" stroke-width="${br > 0.05 ? 5 : 3}"/>
                    ${T(1700, 545, S.lampBig ? 'หลอด 6 V 0.5 A' : 'หลอด 6 V 0.15 A', 22, '#333', 'end', 600)}`;
                // จุดตัดวงจร (สายจัมเปอร์ถอดได้)
                s += `<g data-click="link" style="cursor:pointer"><rect x="1380" y="${S.link ? 850 : 930}" width="300" height="${S.link ? 130 : 110}" fill="transparent"/>`;
                if (S.link) s += `<path d="M1410 880 C1440 960 1620 960 1650 880" fill="none" stroke="#5b4636" stroke-width="12"/><path d="M1410 880 C1440 960 1620 960 1650 880" fill="none" stroke="#f2c230" stroke-width="7"/>`;
                else s += `<path d="M1440 990 C1470 1030 1590 1030 1620 990" fill="none" stroke="#5b4636" stroke-width="12"/><path d="M1440 990 C1470 1030 1590 1030 1620 990" fill="none" stroke="#f2c230" stroke-width="7"/>`;
                s += `</g>${T(1530, 838, S.link ? 'จุดตัดวงจร (คลิกถอดสายออก)' : 'ถอดสายแล้ว วงจรขาด (คลิกใส่คืน)', 22, '#8a5a00', 'middle', 600)}`;
                return s;
            }
        },
        res: {
            name: 'แผงตัวต้านทาน 5 ตัว',
            tps: RES.flatMap((r, i) => [
                { id: 'r' + i + 'a', node: 'r' + i + 'a', x: 1110, y: 300 + i * 150, lab: `ขาซ้ายของ R${i + 1}` },
                { id: 'r' + i + 'b', node: 'r' + i + 'b', x: 1610, y: 300 + i * 150, lab: `ขาขวาของ R${i + 1}` }
            ]),
            elems: () => RES.map((r, i) => R('r' + i + 'a', 'r' + i + 'b', r.v)),
            draw: () => {
                let s = `<rect x="980" y="200" width="940" height="820" rx="26" fill="#f4efe2" stroke="#d8ccb2" stroke-width="3"/>${T(1450, 236, 'แผงตัวต้านทาน (อ่านแถบสีแล้วลองวัด)', 26, '#444', 'middle', 600)}`;
                RES.forEach((r, i) => {
                    const y = 300 + i * 150;
                    s += `<path d="M1110 ${y} H1290 M1450 ${y} H1610" stroke="#9aa0a6" stroke-width="6"/>
                        <rect x="1280" y="${y - 30}" width="180" height="60" rx="28" fill="#e9d3a8" stroke="#b89a64" stroke-width="2"/>`;
                    r.b.forEach((b, k) => { s += `<rect x="${[1306, 1338, 1370, 1424][k]}" y="${y - 29}" width="16" height="58" fill="${BANDS[b]}"/>`; });
                    s += T(1690, y, `R${i + 1}`, 30, '#333', 'start', 700) + T(1760, y, r.name, 20, '#666', 'start');
                });
                return s;
            }
        },
        outlet: {
            name: 'เต้ารับไฟบ้าน 220 V',
            ac: true,
            tps: [{ id: 'L', node: 'L', x: 1410, y: 540, lab: 'รู L ของเต้ารับ', mark: false }, { id: 'N', node: 'gnd', x: 1530, y: 540, lab: 'รู N ของเต้ารับ', mark: false }, { id: 'G', node: 'gnd', x: 1470, y: 650, lab: 'รูสายดิน', mark: false }],
            elems: () => (S.breaker ? [V('Li', 'gnd', 220), R('L', 'Li', 0.5)] : []),
            draw: () => `<rect x="900" y="200" width="1000" height="860" rx="20" fill="#efe9dc" stroke="#d8ccb2" stroke-width="3"/>
                <path d="M1050 470 V400 H1470 V430" fill="none" stroke="#bbb" stroke-width="16"/>
                <rect x="960" y="300" width="180" height="250" rx="14" fill="#fafafa" stroke="#999" stroke-width="3"/>
                ${T(1050, 330, 'เบรกเกอร์', 22, '#333', 'middle', 600)}
                <g data-click="breaker" style="cursor:pointer"><rect x="1000" y="352" width="100" height="160" rx="10" fill="#333"/>
                <rect x="1018" y="${S.breaker ? 366 : 432}" width="64" height="66" rx="8" fill="${S.breaker ? '#e53935' : '#9e9e9e'}"/>
                ${T(1050, S.breaker ? 399 : 465, S.breaker ? 'ON' : 'OFF', 24, '#fff', 'middle', 700)}</g>
                ${T(1050, 584, S.breaker ? 'มีไฟ (คลิกเพื่อตัดไฟ)' : 'ตัดไฟแล้ว (คลิกเพื่อจ่ายไฟ)', 20, S.breaker ? '#c62828' : '#2e7d32', 'middle', 600)}
                <rect x="1300" y="430" width="340" height="330" rx="30" fill="#fff" stroke="#bbb" stroke-width="4"/>
                <rect x="1396" y="508" width="28" height="64" rx="6" fill="#222"/><rect x="1516" y="508" width="28" height="64" rx="6" fill="#222"/>
                <circle cx="1470" cy="650" r="20" fill="#222"/>
                ${T(1410, 600, 'L', 24, '#c62828', 'middle', 700)}${T(1530, 600, 'N', 24, '#1565c0', 'middle', 700)}
                <path d="M1370 830 l40 -70 l40 70 z" fill="#ffca28" stroke="#333" stroke-width="4"/>${T(1410, 810, '!', 34, '#333', 'middle', 700)}
                ${T(1480, 812, 'ไฟบ้าน 220 V~ อันตราย', 26, '#c62828', 'start', 700)}
                ${T(1480, 852, 'ตัดไฟก่อนต่อสาย ห้ามจับปลายโลหะ', 22, '#333', 'start', 500)}`
        }
    };
    const fxTP = id => FX[S.fx].tps.find(t => t.id === id);

    /* ---------- แก้สมการวงจร (Modified Nodal Analysis) ---------- */
    function solve(elems) {
        const idx = new Map();
        const nd = n => (n === 'gnd' ? -1 : (idx.has(n) ? idx.get(n) : (idx.set(n, idx.size), idx.size - 1)));
        elems.forEach(e => { nd(e.a); nd(e.b); });
        const N = idx.size, nv = elems.filter(e => e.t === 'V').length, K = N + nv;
        const A = Array.from({ length: K }, () => new Float64Array(K)), z = new Float64Array(K);
        for (let i = 0; i < N; i++) A[i][i] += 1e-12;
        let k = N;
        elems.forEach(e => {
            const a = nd(e.a), b = nd(e.b);
            if (e.t === 'R') {
                const gg = 1 / e.r;
                if (a >= 0) A[a][a] += gg; if (b >= 0) A[b][b] += gg;
                if (a >= 0 && b >= 0) { A[a][b] -= gg; A[b][a] -= gg; }
            } else if (e.t === 'I') { if (a >= 0) z[a] -= e.i; if (b >= 0) z[b] += e.i; }
            else { if (a >= 0) { A[a][k] += 1; A[k][a] += 1; } if (b >= 0) { A[b][k] -= 1; A[k][b] -= 1; } z[k] = e.v; e._k = k; k++; }
        });
        // กำจัดแบบเกาส์เลือกตัวหลัก
        for (let c = 0; c < K; c++) {
            let p = c;
            for (let r = c + 1; r < K; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
            if (Math.abs(A[p][c]) < 1e-30) continue;
            [A[c], A[p]] = [A[p], A[c]]; [z[c], z[p]] = [z[p], z[c]];
            for (let r = 0; r < K; r++) {
                if (r === c) continue;
                const f = A[r][c] / A[c][c];
                if (!f) continue;
                for (let j = c; j < K; j++) A[r][j] -= f * A[c][j];
                z[r] -= f * z[c];
            }
        }
        const x = z.map((v, i) => (Math.abs(A[i][i]) > 1e-30 ? v / A[i][i] : 0));
        return { v: n => (n === 'gnd' || !idx.has(n) ? 0 : x[idx.get(n)]), i: e => x[e._k] || 0 };
    }

    /* ---------- กติกาการอ่านมิเตอร์เข็ม (ตารางที่ 2.1–2.4) ---------- */
    const AITEM = id => M.ASEL.find(a => a[0] === id) || M.ASEL[0];
    const DITEM = id => M.DSEL.find(a => a[0] === id) || M.DSEL[0];
    function aRange(id) {
        const it = AITEM(id), g = it[3];
        if (g === 'dcv') return { g, r: +id.slice(3), label: `DCV ${it[2]} V` };
        if (g === 'acv') return { g, r: +id.slice(3), label: `ACV ${it[2]} V` };
        if (g === 'dca') return { g, r: +id.slice(2) / 1000, label: `DCmA ${it[2]} mA` };
        if (g === 'ohm') return { g, r: { x1: 1, x10: 10, x100: 100, x1k: 1000, x10k: 10000 }[id], label: `Ω ${it[2]}` };
        return { g: 'off', r: 0, label: 'OFF' };
    }
    // แถวที่อ่าน ตัวคูณ หน่วย
    function aRule(id) {
        const a = aRange(id);
        if (a.g === 'dcv') { const [full, mul] = M.DCV[a.r]; return { row: String(full), full, mul, unit: 'V', rowName: `0–${full}` }; }
        if (a.g === 'acv') {
            if (a.r === 10) return { row: 'ac10', full: 10, mul: 1, unit: 'V', rowName: 'สีแดง AC10V' };
            const full = a.r === 1000 ? 10 : a.r; return { row: String(full), full, mul: a.r === 1000 ? 100 : 1, unit: 'V', rowName: `0–${full}` };
        }
        if (a.g === 'dca') { const mul = { 0.0025: 0.01, 0.025: 0.1, 0.25: 1 }[a.r]; return { row: '250', full: 250, mul, unit: 'mA', rowName: '0–250' }; }
        if (a.g === 'ohm') return { row: 'ohm', full: 0, mul: a.r, unit: 'Ω', rowName: 'สเกลโอห์ม (บนสุด)' };
        return null;
    }
    const mulText = m => (m === 1 ? 'อ่านได้เลย' : `แล้วคูณ ${m}`);
    function ruleText(id) {
        const a = aRange(id), u = aRule(id);
        if (!u) return 'ปุ่มอยู่ที่ OFF ยังไม่ได้เลือกย่าน';
        if (id === 'dcv0.1') return `ย่าน DCV 0.1 V (ตำแหน่งเดียวกับ 50 µA) อ่านแถว <b>0–10</b> แล้วคูณ 0.01 (ถ้าวัดกระแส อ่านแถว 0–50 หน่วย µA)`;
        if (a.g === 'ohm') return `ย่าน ${a.label} อ่าน<b>สเกลโอห์มแถวบนสุด</b> (0 อยู่ขวา) แล้วคูณ ${a.r}`;
        return `ย่าน ${a.label} อ่านแถว <b>${u.rowName}</b> ${mulText(u.mul)} ได้หน่วย ${u.unit}`;
    }

    /* ---------- รูปแบบตัวเลขบนจอมิเตอร์ดิจิทัล ---------- */
    const DF = {
        v200m: [1e3, 1, 'mV'], v2000m: [1e3, 0, 'mV'], v20: [1, 2, 'V'], v200: [1, 1, 'V'], v1000: [1, 0, 'V', 1000],
        acv200: [1, 1, 'V'], acv750: [1, 0, 'V', 750],
        a200u: [1e6, 1, 'µA'], a2000u: [1e6, 0, 'µA'], a20m: [1e3, 2, 'mA'], a200m: [1e3, 1, 'mA'], a10: [1, 2, 'A', 10],
        o200: [1, 1, 'Ω'], o2000: [1, 0, 'Ω'], o20k: [1e-3, 2, 'kΩ'], o200k: [1e-3, 1, 'kΩ'], o2000k: [1e-3, 0, 'kΩ'], diode: [1e3, 0, 'mV']
    };
    function fmtD(x, sel) {
        const f = DF[sel];
        if (!f) return sel === 'hfe' ? '000' : '';
        const v = x * f[0], d = f[1];
        const counts = Math.round(Math.abs(v) * Math.pow(10, d));
        if (counts > 1999 || (f[3] && Math.abs(v) > f[3] + 1e-9)) return (v < 0 ? '-' : '') + '1   ';
        let s = (counts / Math.pow(10, d)).toFixed(d);
        if (d === 0) s = s.padStart(3, '0');
        return (v < 0 && counts > 0 ? '-' : '') + s;
    }

    /* ---------- ต่อสายวัด: หาโนดที่ปลายสายแตะ ---------- */
    const tipsTouch = () => { const a = S.leads.red, b = S.leads.black; return !a.tp && !b.tp && Math.hypot(a.tip[0] - b.tip[0], a.tip[1] - b.tip[1]) < 38; };
    function leadNode(c) {
        const L = S.leads[c];
        if (L.tp) { const t = fxTP(L.tp); return t ? t.node : 'air_' + c; }
        if (tipsTouch()) return 'tt';
        return 'air_' + c;
    }
    const leadIn = jack => ['red', 'black'].find(c => S.leads[c].jack === jack) || null;
    const onFixture = c => !!S.leads[c].tp;

    /* ---------- คำนวณสิ่งที่มิเตอร์แสดง ---------- */
    let OUT = { frac: 0, disp: '', warns: [], led: false, lampP: 0, psuI: 0, q: 0, conn: false };
    function compute() {
        const fx = FX[S.fx], base = fx.elems(), ac = !!fx.ac;
        const o = { frac: 0, disp: '', warns: [], led: false, lampP: 0, psuI: 0, q: 0, conn: false, jitter: false };
        const W = (t, cls) => o.warns.push({ t, cls: cls || 'bad' });
        const m = S.meter;
        const comL = leadIn('com');
        const posJack = m === 'analog' ? 'pos' : (leadIn('a10') && !leadIn('vma') ? 'a10' : 'vma');
        const posL = leadIn(posJack), a10L = m === 'dmm' ? leadIn('a10') : null;
        const N = comL ? leadNode(comL) : null, P = posL ? leadNode(posL) : null;
        o.conn = !!(N && P);
        // แรงดันเปิดวงจรระหว่างปลายสาย (ไม่มีมิเตอร์)
        const s0 = solve(base.slice());
        const voc = (o.conn && onFixture(comL) && onFixture(posL)) ? s0.v(P) - s0.v(N) : 0;
        const hot = Math.abs(voc) > 0.05;
        let me = [], read = () => 0;
        if (m === 'analog') {
            const id = S.sel.analog, a = aRange(id);
            if (leadIn('out')) W('ขั้ว OUTPUT ใช้วัดสัญญาณเสียง (dB) ให้ย้ายสายแดงไปเสียบขั้ว +', 'warn');
            if (!S.fuse.analog) { W('ฟิวส์ในมิเตอร์ขาด เข็มไม่ขยับ กดปุ่ม "เปลี่ยนฟิวส์"'); }
            else if (o.conn && a.g !== 'off') {
                if (a.g === 'dcv') { const Rm = 20000 * a.r; me = [R(P, N, Rm)]; read = s => (ac ? 0 : (s.v(P) - s.v(N)) / a.r); if (ac && hot) { W('นี่คือไฟสลับ ย่าน DCV วัดไม่ได้ เข็มสั่นอยู่ที่ 0 ให้ใช้ย่าน ACV', 'warn'); o.jitter = true; } }
                if (a.g === 'acv') { const Rm = 9000 * a.r; me = [R(P, N, Rm)]; read = s => { if (!ac) return 0; const v = Math.abs(s.v(P) - s.v(N)); return a.r === 10 ? M.ac10F(v) : v / a.r; }; if (!ac && hot) W('นี่คือไฟตรง ย่าน ACV เข็มไม่ขึ้น ให้ใช้ย่าน DCV', 'warn'); }
                if (a.g === 'dca') {
                    const Rm = { 0.0025: 40, 0.025: 4, 0.25: 0.4 }[a.r]; me = [R(P, N, Rm)];
                    read = s => (ac ? 0 : (s.v(P) - s.v(N)) / Rm / a.r);
                }
                if (a.g === 'ohm') {
                    const Vb = a.r === 10000 ? 9 : 3, Ri = 20 * a.r, k = (KR[id] || 1) + S.adjDeg / 600;
                    me = [V('om_', P, Vb), R('om_', N, Ri)];
                    read = s => (s.v('om_') - s.v(N)) / Ri / (Vb / Ri) * k;
                    if (hot) W('ห้ามวัดความต้านทานขณะวงจรมีไฟ ปิดสวิตช์หรือถอดแหล่งจ่ายออกก่อน');
                }
            }
            if (S.sel.analog === 'dcv0.1' && o.conn) { me = [R(P, N, 2000)]; read = s => (ac ? 0 : (s.v(P) - s.v(N)) / 0.1); }
        } else {
            const id = S.sel.dmm, it = DITEM(id), g = it[3];
            const P10 = a10L ? leadNode(a10L) : null;
            if (a10L && N) me.push(R(P10, N, 0.01));   // ขั้ว 10A ต่อผ่านชันต์ไปขั้ว COM ตลอด
            const Pv = leadIn('vma') ? leadNode(leadIn('vma')) : null;
            const okV = Pv && N;
            if (g === 'off') { o.disp = ''; }
            else if (g === 'dcv') { if (okV) me.push(R(Pv, N, 1e7)); read = s => (okV && !ac ? s.v(Pv) - s.v(N) : 0); if (ac && hot) W('นี่คือไฟสลับ ให้หมุนไปที่ V~ (ACV)', 'warn'); }
            else if (g === 'acv') { if (okV) me.push(R(Pv, N, 1e6)); read = s => (okV && ac ? Math.abs(s.v(Pv) - s.v(N)) : 0); if (!ac && hot) W('นี่คือไฟตรง ให้หมุนไปที่ V⎓ (DCV)', 'warn'); }
            else if (g === 'dca') {
                const Rm = { a200u: 1000, a2000u: 100, a20m: 10, a200m: 0.4 }[id];
                if (okV && S.fuse.dmm) me.push(R(Pv, N, Rm));
                read = s => (okV && S.fuse.dmm && !ac ? (s.v(Pv) - s.v(N)) / Rm : 0);
                if (!S.fuse.dmm) W('ฟิวส์ 200 mA ในมิเตอร์ขาด ย่านกระแส mA อ่านค่าไม่ได้ กดปุ่ม "เปลี่ยนฟิวส์"');
                if (a10L && !leadIn('vma')) W('ย่าน mA ต้องเสียบสายแดงที่ขั้ว VΩmA', 'warn');
            }
            else if (g === 'a10') {
                read = s => (P10 && N ? (s.v(P10) - s.v(N)) / 0.01 : 0);
                if (!a10L && leadIn('vma')) W('ย่าน 10A ต้องย้ายสายแดงไปเสียบขั้ว 10A', 'warn');
            }
            else if (g === 'ohm' || g === 'diode') {
                if (okV) me.push(I(N, Pv, 1e-3), R(Pv, N, 1e9));
                read = s => (okV ? (s.v(Pv) - s.v(N)) / 1e-3 : 1e12);
                if (hot) W('ห้ามวัดความต้านทานขณะวงจรมีไฟ ค่าที่เห็นเชื่อไม่ได้');
            }
            o.dg = g;
        }
        const s1 = solve(base.concat(me));
        let q = read(s1);
        o.q = q;
        // ผลต่อวงจร: หลอดไฟ แหล่งจ่าย
        if (S.fx === 'lamp') { const Rl = S.lampBig ? 11.99 : 39.6, il = (s1.v('s') - s1.v('l')) / Rl; o.lampP = il * il * Rl; }
        if (S.fx === 'psu') { const ip = (s1.v('pp') - s1.v('pi')) / 0.05; o.psuI = ip; }
        if (m === 'analog') {
            const id = S.sel.analog, a = aRange(id);
            let f = S.fuse.analog ? q : 0;
            // กระแสผ่านมิเตอร์มากเกินไป ฟิวส์ขาด
            if (S.fuse.analog && o.conn && a.g === 'dca') { const I0 = q * a.r; if (Math.abs(I0) > 0.5) blow('analog', 'กระแสไหลผ่านมิเตอร์มากเกิน ฟิวส์ขาด! ย่านกระแสต้องต่ออนุกรม ห้ามแตะคร่อมแหล่งจ่าย'); }
            if (S.fuse.analog && o.conn && a.g === 'ohm' && Math.abs(voc) > 30) blow('analog', 'ใช้ย่าน Ω วัดไฟแรงสูง ฟิวส์ขาด!');
            if (!S.fuse.analog) f = 0;
            o.led = a.g === 'ohm' && a.r === 1 && f > 0.9;
            if (a.g === 'ohm' && o.conn && f > 1.008) W('เข็มเลยขีด 0 Ω ไปทางขวา หมุนปุ่ม 0Ω ADJ ลดลงเล็กน้อย', 'warn');
            if (a.g !== 'ohm' && f > 1.02) W(`เกินย่าน! เข็มตีเลยสเกล มิเตอร์อาจเสีย ให้หมุนไปย่านที่สูงกว่านี้`);
            if (f < -0.02) W('เข็มตีกลับไปทางซ้าย = ต่อสายกลับขั้ว ให้สลับสายแดงกับสายดำ');
            o.frac = f + zoff();
            if (a.g === 'dca' && o.conn && hot && S.fuse.analog && Math.abs(q * a.r) <= 0.5 && Math.abs(q) > 2) { /* แจ้งไว้แล้ว */ }
        } else {
            const id = S.sel.dmm, g = o.dg;
            if (g === 'dca' && S.fuse.dmm && Math.abs(q) > 0.2) { blow('dmm', 'กระแสเกิน 200 mA ฟิวส์ในมิเตอร์ขาด! กระแสสูงต้องย้ายสายแดงไปขั้ว 10A และหมุนไปที่ 10A'); q = 0; }
            if (a10L && N && g !== 'a10' && Math.abs(s1.v(leadNode(a10L)) - s1.v(N)) / 0.01 > 1) W('สายแดงเสียบขั้ว 10A อยู่ ขั้วนี้ต่อตรงเข้า COM ถ้าแตะวัดแรงดันจะเป็นการลัดวงจร!');
            if (g === 'a10' && Math.abs(q) > 10) W('กระแสเกิน 10 A อันตราย!');
            o.disp = g === 'off' ? '' : (g === 'hfe' ? '000' : fmtD(q, id));
            if (o.disp.trim().endsWith('1') && o.disp.includes('   ') && (g === 'dcv' || g === 'acv' || g === 'dca' || g === 'a10')) W('จอขึ้นเลข 1 ทางซ้าย = เกินย่าน ให้หมุนไปย่านที่สูงกว่า', 'warn');
            if (o.disp[0] === '-' && !o.disp.includes('1   ')) W('จอขึ้นเครื่องหมาย − แปลว่าต่อสายกลับขั้ว (ค่ายังใช้ได้)', 'info');
        }
        dangerCheck(voc, o);
        OUT = o;
        return o;
    }
    function blow(m, msg) {
        S.fuse[m] = false;
        flash(msg);
    }
    // ไฟบ้าน: ตั้งย่านผิดแล้วแตะ = อันตราย
    function dangerCheck(voc, o) {
        if (!FX[S.fx].ac || !S.breaker || Math.abs(voc) < 100 || S.danger) return;
        if (S.meter === 'analog') {
            const a = aRange(S.sel.analog);
            if (a.g === 'ohm' || a.g === 'dca') setDanger(`ตั้งย่าน ${a.label} แล้วแตะไฟบ้าน 220 V`, 'กระแสไหลผ่านมิเตอร์มหาศาล ฟิวส์ขาด มิเตอร์อาจไหม้และเกิดประกายไฟใส่มือ ไฟบ้านต้องใช้ย่าน ACV 250 V');
            else if (a.g === 'acv' && a.r < 250) setDanger(`ตั้งย่าน ${a.label} ต่ำกว่า 220 V`, 'เข็มตีเลยสเกลอย่างแรง มิเตอร์เสียหายได้ ไฟบ้านต้องใช้ย่าน ACV 250 V');
        } else {
            const g = DITEM(S.sel.dmm)[3];
            if (['ohm', 'dca', 'a10', 'diode', 'hfe'].includes(g) || (leadIn('a10'))) setDanger('ตั้งมิเตอร์ดิจิทัลผิดย่านแล้วแตะไฟบ้าน', 'ย่านโอห์มและย่านกระแสทนไฟบ้านไม่ได้ ฟิวส์ขาดหรือมิเตอร์ไหม้ ไฟบ้านต้องใช้ V~ 750');
        }
    }
    function setDanger(title, msg) {
        S.danger = { title, msg };
        S.fuse.analog = S.meter === 'analog' ? false : S.fuse.analog;
        S.fuse.dmm = S.meter === 'dmm' ? false : S.fuse.dmm;
    }

    /* ---------- วาดโต๊ะ ---------- */
    const svg = $('#bench');
    let VB = { x: 0, y: 60, w: 2000, h: 1120 };
    svg.innerHTML = `<defs>
            <clipPath id="mirClip"><path clip-rule="evenodd" d="M19 660 a481 481 0 1 0 962 0 a481 481 0 1 0 -962 0 Z M41 660 a459 459 0 1 0 918 0 a459 459 0 1 0 -918 0 Z"/></clipPath>
            <pattern id="vlMat" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#dfe8dc"/><path d="M40 0 H0 V40" fill="none" stroke="#cfdacb" stroke-width="2"/></pattern>
        </defs>
        <rect x="-4000" y="-4000" width="10000" height="10000" fill="#c9d3c5"/>
        <rect x="0" y="60" width="2000" height="1120" rx="30" fill="url(#vlMat)"/>
        <g id="gFx"></g><g id="gTP"></g><g id="gMeter"></g><g id="gDyn"></g><g id="gLeads"></g>`;
    const gFx = $('#gFx'), gTP = $('#gTP'), gMeter = $('#gMeter'), gDyn = $('#gDyn'), gLeads = $('#gLeads');
    function setVB() { svg.setAttribute('viewBox', `${r1(VB.x)} ${r1(VB.y)} ${r1(VB.w)} ${r1(VB.h)}`); }
    function drawMeterStatic() {
        const t = MT[S.meter];
        gMeter.setAttribute('transform', `translate(${t.tx} ${t.ty}) scale(${t.s})`);
        gDyn.setAttribute('transform', `translate(${t.tx} ${t.ty}) scale(${t.s})`);
        gMeter.innerHTML = S.meter === 'analog' ? M.analogBody({}) : M.dmmBody({});
    }
    let needlePos = 0, needleVel = 0;
    function needleMarkup() {
        const a = M.ang(clamp(needlePos, -0.06, 1.06)), off = S.oblique ? 1.4 : 0;
        return `<g transform="${M.FACE_T}" data-part="3">
            <g clip-path="url(#mirClip)"><path id="ndlRef" d="M500 660 L500 110" stroke="#2b2b2b" stroke-width="4" opacity="${S.oblique ? 0.6 : 0}" transform="rotate(${a - off} 500 660)"/></g>
            <g id="ndlWrap" transform="rotate(${off} 500 660)">${M.needle(clamp(needlePos, -0.06, 1.06), { id: 'ndl' })}</g>
            <path id="ndlHit" d="M500 640 L500 130" stroke="transparent" stroke-width="40" transform="rotate(${a} 500 660)"/>
            ${M.PIVOT}</g>`;
    }
    function drawDyn() {
        if (S.meter === 'analog') {
            gDyn.innerHTML = M.analogScrew(S.screw) + M.analogAdj(S.adjDeg) + M.analogKnob(S.sel.analog) + needleMarkup();
        } else {
            gDyn.innerHTML = M.dmmLCD(OUT.disp) + M.dmmKnob(S.sel.dmm);
        }
        // เน้นแถวสเกล + ไฟ LED
        const cls = [];
        if (S.meter === 'analog' && S.helper) { const u = aRule(S.sel.analog); if (u) cls.push('hl-' + u.row); }
        if (OUT.led) cls.push('led-on');
        gMeter.setAttribute('class', cls.join(' '));
    }
    function drawFx() {
        gFx.innerHTML = FX[S.fx].draw(OUT);
        gTP.innerHTML = FX[S.fx].tps.map(t => (t.mark === false ? '' : `<g><circle cx="${t.x}" cy="${t.y}" r="15" fill="#d5d9dc" stroke="#6d7378" stroke-width="3"/><path d="M${t.x - 8} ${t.y} H${t.x + 8} M${t.x} ${t.y - 8} V${t.y + 8}" stroke="#6d7378" stroke-width="3"/></g>`)).join('');
    }
    // หัววัด: ปลายแหลมอยู่ที่ (x, y) ตัวด้ามเอียงลงล่าง
    const PROBE_ANG = { red: -12, black: 12 };
    function probeEnd(c) { const L = S.leads[c], a = rad(PROBE_ANG[c]); return [L.tip[0] - 262 * Math.sin(a), L.tip[1] + 262 * Math.cos(a)]; }
    function plugPos(c) { const L = S.leads[c]; return L.jack ? toW(S.meter, JACKS[S.meter][L.jack]) : L.plug; }
    let hoverTP = null;
    function drawLeads() {
        let s = '';
        ['black', 'red'].forEach(c => {
            const L = S.leads[c], col = c === 'red' ? '#d32f2f' : '#222', dark = c === 'red' ? '#7f1010' : '#000';
            const [px, py] = plugPos(c), [ex, ey] = probeEnd(c);
            const sx = px, sy = py + 64;
            const a = rad(PROBE_ANG[c]);
            const d = `M${r1(sx)} ${r1(sy)} C${r1(sx)} ${r1(sy + 190)}, ${r1(ex - 170 * Math.sin(a))} ${r1(ey + 170 * Math.cos(a))}, ${r1(ex)} ${r1(ey)}`;
            s += `<path d="${d}" fill="none" stroke="${dark}" stroke-width="15" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="10" stroke-linecap="round"/>`;
            // ปลั๊ก
            s += `<g data-drag="plug" data-lead="${c}" style="cursor:grab"><rect x="${r1(px - 17)}" y="${r1(py - 4)}" width="34" height="70" rx="9" fill="${col}" stroke="${dark}" stroke-width="2"/>
                  <circle cx="${r1(px)}" cy="${r1(py)}" r="${L.jack ? 18 : 15}" fill="${col}" stroke="${dark}" stroke-width="3"/><circle cx="${r1(px)}" cy="${r1(py)}" r="6" fill="${L.jack ? '#000' : '#c9ced3'}"/></g>`;
            // หัววัด
            const [tx, ty] = L.tip;
            s += `<g data-drag="tip" data-lead="${c}" style="cursor:grab" transform="translate(${r1(tx)} ${r1(ty)}) rotate(${PROBE_ANG[c]})">
                  <path d="M-3 0 L3 0 L4 46 L-4 46 Z" fill="#c9ced3" stroke="#7a8288" stroke-width="1.5"/>
                  <rect x="-22" y="44" width="44" height="16" rx="7" fill="${col}" stroke="${dark}" stroke-width="2"/>
                  <rect x="-15" y="58" width="30" height="176" rx="12" fill="${col}" stroke="${dark}" stroke-width="2"/>
                  <path d="M-15 90 H15 M-15 104 H15 M-15 118 H15" stroke="${dark}" stroke-width="2" opacity=".5"/>
                  <rect x="-8" y="232" width="16" height="32" rx="5" fill="${dark}"/>
                  <circle cx="0" cy="0" r="30" fill="transparent"/></g>`;
        });
        if (hoverTP) { const t = fxTP(hoverTP); if (t) s += `<circle cx="${t.x}" cy="${t.y}" r="30" fill="none" stroke="#00878f" stroke-width="5" stroke-dasharray="8 6"/>`; }
        gLeads.innerHTML = s;
    }

    /* ---------- เข็มเคลื่อนแบบสปริง ---------- */
    let lastT = 0;
    function tick(t) {
        const dt = Math.min(0.05, (t - lastT) / 1000 || 0.016); lastT = t;
        if (S.meter === 'analog') {
            let target = clamp(OUT.frac, -0.06, 1.06);
            if (OUT.jitter) target += (Math.random() - 0.5) * 0.01;
            const acc = 160 * (target - needlePos) - 17 * needleVel;
            needleVel += acc * dt; needlePos += needleVel * dt;
            if (needlePos > 1.06) { needlePos = 1.06; needleVel = -Math.abs(needleVel) * 0.3; }
            if (needlePos < -0.06) { needlePos = -0.06; needleVel = Math.abs(needleVel) * 0.3; }
            const a = M.ang(needlePos), off = S.oblique ? 1.4 : 0;
            const n = document.getElementById('ndl');
            if (n) {
                n.setAttribute('transform', `rotate(${a.toFixed(3)} 500 660)`);
                const rf = document.getElementById('ndlRef'); if (rf) rf.setAttribute('transform', `rotate(${(a - off).toFixed(3)} 500 660)`);
                const h = document.getElementById('ndlHit'); if (h) h.setAttribute('transform', `rotate(${a.toFixed(3)} 500 660)`);
            }
        }
        requestAnimationFrame(tick);
    }

    /* ---------- อัปเดตทั้งหมดหลังสถานะเปลี่ยน ---------- */
    function update(opts) {
        opts = opts || {};
        compute();
        if (opts.fx !== false) drawFx();
        drawDyn();
        drawLeads();
        renderStatus();
        renderAlerts();
        checkMission();
        if (opts.table !== false) refreshTable();
    }

    /* ---------- ซูม / เลื่อน ---------- */
    function clientToWorld(cx, cy) {
        const p = svg.createSVGPoint(); p.x = cx; p.y = cy;
        return p.matrixTransform(svg.getScreenCTM().inverse());
    }
    function zoomAt(f, wx, wy) {
        const nw = clamp(VB.w / f, 180, 2600), k = nw / VB.w;
        VB.x = wx - (wx - VB.x) * k; VB.y = wy - (wy - VB.y) * k; VB.w = nw; VB.h = VB.h * k;
        setVB();
        if (VB.w < 1100) S.zoomed = true;
        checkMission();
    }
    function fit() { VB = { x: WORLD.x, y: WORLD.y, w: WORLD.w, h: WORLD.h }; setVB(); }
    function animateTo(target) {
        const from = { ...VB }, t0 = performance.now();
        const step = now => {
            const k = Math.min(1, (now - t0) / 450), e = 1 - Math.pow(1 - k, 3);
            ['x', 'y', 'w', 'h'].forEach(p => { VB[p] = from[p] + (target[p] - from[p]) * e; });
            setVB();
            if (k < 1) requestAnimationFrame(step); else { S.zoomed = true; checkMission(); }
        };
        requestAnimationFrame(step);
    }
    function zoomFace() {
        const t = MT[S.meter];
        const r = S.meter === 'analog' ? [132, 46, 536, 372] : [150, 40, 460, 190];
        const x = t.tx + t.s * r[0], y = t.ty + t.s * r[1], w = t.s * r[2], h = t.s * r[3];
        const box = svg.getBoundingClientRect(), asp = box.width / box.height;
        let W = w * 1.06, H = h * 1.06;
        if (W / H < asp) W = H * asp; else H = W / asp;
        animateTo({ x: x + w / 2 - W / 2, y: y + h / 2 - H / 2, w: W, h: H });
    }

    /* ---------- เมาส์ / นิ้ว ---------- */
    const ptrs = new Map();
    let drag = null, pinch = null;
    const angAt = (cx, cy, w) => (Math.atan2(w.x - cx, cy - w.y) * 180 / Math.PI + 360) % 360;
    const knobCenter = () => toW(S.meter, S.meter === 'analog' ? [M.AK.cx, M.AK.cy] : [M.DK.cx, M.DK.cy]);
    function nearestSel(deg) {
        const list = S.meter === 'analog' ? M.ASEL : M.DSEL;
        let best = list[0], bd = 999;
        list.forEach(it => { const d = Math.abs(((deg - it[1]) % 360 + 540) % 360 - 180); if (d < bd) { bd = d; best = it; } });
        return best[0];
    }
    function setSel(id) {
        if (S.sel[S.meter] === id) return;
        if (FX[S.fx].ac && S.breaker && onFixture('red') && onFixture('black')) flash('ห้ามหมุนเปลี่ยนย่านขณะปลายสายแตะไฟบ้าน ให้ยกสายออกก่อน');
        S.sel[S.meter] = id;
        update({ fx: S.fx === 'lamp' || S.fx === 'psu' });
    }
    svg.addEventListener('pointerdown', e => {
        svg.setPointerCapture(e.pointerId);
        ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (ptrs.size === 2) {
            const [a, b] = [...ptrs.values()];
            pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), vb: { ...VB } };
            drag = null; return;
        }
        const w = clientToWorld(e.clientX, e.clientY);
        const t = e.target.closest('[data-drag],[data-click],[data-sel],[data-part],[data-jack]');
        drag = { kind: 'pan', x0: e.clientX, y0: e.clientY, w0: w, vb: { ...VB }, moved: false, el: t };
        if (t && t.dataset.drag) {
            drag.kind = t.dataset.drag; drag.lead = t.dataset.lead;
            if (drag.kind === 'knob') { const [cx, cy] = knobCenter(); drag.c = [cx, cy]; }
            if (drag.kind === 'screw') { drag.c = toW('analog', M.AK.screw); drag.a0 = angAt(...drag.c, w); drag.v0 = S.screw; }
            if (drag.kind === 'adj') { drag.c = toW('analog', M.AK.adj); drag.a0 = angAt(...drag.c, w); drag.v0 = S.adjDeg; }
            if (drag.kind === 'psuknob') { drag.c = [1660, 520]; drag.a0 = angAt(...drag.c, w); drag.v0 = S.psuV; }
            if (drag.kind === 'tip') { const L = S.leads[drag.lead]; drag.off = [L.tip[0] - w.x, L.tip[1] - w.y]; }
            if (drag.kind === 'plug') { const p = plugPos(drag.lead); drag.off = [p[0] - w.x, p[1] - w.y]; }
        }
        e.preventDefault();
    });
    svg.addEventListener('pointermove', e => {
        if (!ptrs.has(e.pointerId)) return;
        ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pinch && ptrs.size === 2) {
            const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
            const mid = clientToWorld((a.x + b.x) / 2, (a.y + b.y) / 2);
            zoomAt(d / pinch.d, mid.x, mid.y); pinch.d = d; return;
        }
        if (!drag) return;
        if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 4) drag.moved = true;
        if (!drag.moved) return;
        const w = clientToWorld(e.clientX, e.clientY);
        const dang = (c, a0) => { let d = angAt(c[0], c[1], w) - a0; if (d > 180) d -= 360; if (d < -180) d += 360; return d; };
        switch (drag.kind) {
            case 'pan': {
                const box = svg.getBoundingClientRect(), k = Math.max(drag.vb.w / box.width, drag.vb.h / box.height);
                VB.x = drag.vb.x - (e.clientX - drag.x0) * k; VB.y = drag.vb.y - (e.clientY - drag.y0) * k; setVB(); break;
            }
            case 'knob': setSel(nearestSel(angAt(drag.c[0], drag.c[1], w))); break;
            case 'screw': { let d = dang(drag.c, drag.a0); S.screw = clamp(drag.v0 + d, -100, 100); if (Math.abs(d) > 150) { drag.a0 = angAt(...drag.c, w); drag.v0 = S.screw; } update({ fx: false, table: false }); break; }
            case 'adj': { let d = dang(drag.c, drag.a0); S.adjDeg = clamp(drag.v0 + d, -90, 120); if (Math.abs(d) > 150) { drag.a0 = angAt(...drag.c, w); drag.v0 = S.adjDeg; } update({ fx: false, table: false }); break; }
            case 'psuknob': { let d = dang(drag.c, drag.a0); S.psuV = Math.round(clamp(drag.v0 + d / 10, 0, 30) * 10) / 10; if (Math.abs(d) > 150) { drag.a0 = angAt(...drag.c, w); drag.v0 = S.psuV; } update(); break; }
            case 'tip': {
                const L = S.leads[drag.lead];
                L.tip = [w.x + drag.off[0], w.y + drag.off[1]];
                const near = FX[S.fx].tps.map(t => [t, Math.hypot(t.x - L.tip[0], t.y - L.tip[1])]).filter(x => x[1] < 46).sort((a, b) => a[1] - b[1])[0];
                L.tp = near ? near[0].id : null; hoverTP = L.tp;
                update({ fx: S.fx === 'lamp' || S.fx === 'psu', table: false }); break;
            }
            case 'plug': {
                const L = S.leads[drag.lead];
                L.jack = null; L.plug = [w.x + drag.off[0], w.y + drag.off[1]];
                update({ fx: false, table: false }); break;
            }
        }
    });
    function endPtr(e) {
        if (!ptrs.has(e.pointerId)) return;
        ptrs.delete(e.pointerId);
        if (pinch) { if (ptrs.size < 2) pinch = null; return; }
        if (!drag) return;
        const d = drag; drag = null; hoverTP = null;
        if (!d.moved) { onClick(d.el); return; }
        if (d.kind === 'tip') {
            const L = S.leads[d.lead];
            if (L.tp) { const t = fxTP(L.tp); L.tip = [t.x, t.y]; }
            else {
                const o = S.leads[d.lead === 'red' ? 'black' : 'red'];
                if (!o.tp && Math.hypot(o.tip[0] - L.tip[0], o.tip[1] - L.tip[1]) < 60) L.tip = [o.tip[0] + 8, o.tip[1] + 4];
            }
            update();
        }
        if (d.kind === 'plug') {
            const L = S.leads[d.lead], J = JACKS[S.meter];
            const other = S.leads[d.lead === 'red' ? 'black' : 'red'].jack;
            const near = Object.keys(J).filter(j => j !== other).map(j => [j, Math.hypot(toW(S.meter, J[j])[0] - L.plug[0], toW(S.meter, J[j])[1] - L.plug[1])]).filter(x => x[1] < 60).sort((a, b) => a[1] - b[1])[0];
            if (near) L.jack = near[0];
            update();
        }
        if (d.kind === 'knob' || d.kind === 'screw' || d.kind === 'adj') update();
    }
    svg.addEventListener('pointerup', endPtr);
    svg.addEventListener('pointercancel', endPtr);
    svg.addEventListener('wheel', e => {
        e.preventDefault();
        const w = clientToWorld(e.clientX, e.clientY);
        zoomAt(Math.pow(1.0015, -e.deltaY), w.x, w.y);
    }, { passive: false });
    svg.addEventListener('keydown', e => {
        const list = S.meter === 'analog' ? M.ASEL : M.DSEL;
        const i = list.findIndex(x => x[0] === S.sel[S.meter]);
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { setSel(list[(i + 1) % list.length][0]); e.preventDefault(); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { setSel(list[(i - 1 + list.length) % list.length][0]); e.preventDefault(); }
        if (e.key === '+' || e.key === '=') zoomAt(1.25, VB.x + VB.w / 2, VB.y + VB.h / 2);
        if (e.key === '-') zoomAt(0.8, VB.x + VB.w / 2, VB.y + VB.h / 2);
    });
    function onClick(el) {
        if (!el) return;
        if (MI && MI.kind === 'parts' && el.closest('[data-part]') && S.meter === 'analog') { partClick(+el.closest('[data-part]').dataset.part); return; }
        if (el.dataset.sel) { setSel(el.dataset.sel); return; }
        const c = el.dataset.click;
        if (c === 'sw') S.sw = !S.sw;
        if (c === 'link') S.link = !S.link;
        if (c === 'breaker') S.breaker = !S.breaker;
        if (c) update();
    }

    /* ---------- ข้อความบอกสถานะใต้โต๊ะ ---------- */
    function leadText(c) {
        const L = S.leads[c], nm = c === 'red' ? 'สายแดง' : 'สายดำ';
        if (!L.jack) return `${nm}: ยังไม่ได้เสียบที่มิเตอร์`;
        let where = 'ปลายสายลอยอยู่';
        if (L.tp) where = 'แตะ' + fxTP(L.tp).lab;
        else if (tipsTouch()) where = 'แตะกับปลายสายอีกเส้น';
        return `${nm} (ขั้ว ${JNAME[L.jack]}): ${where}`;
    }
    function rangeText() {
        if (S.meter === 'analog') return 'ย่าน ' + aRange(S.sel.analog).label;
        const it = DITEM(S.sel.dmm), g = it[3];
        const G = { off: 'OFF', dcv: 'V⎓ (DCV)', acv: 'V~ (ACV)', dca: 'A⎓ (DCA)', a10: '10A', hfe: 'hFE', diode: 'ไดโอด', ohm: 'Ω' };
        return `ย่าน ${G[g]} ${g === 'off' ? '' : it[2]}`;
    }
    function renderStatus() {
        $('#status').innerHTML = `<b>${S.meter === 'analog' ? 'มิเตอร์เข็ม' : 'มิเตอร์ดิจิทัล'}</b> · ${rangeText()}<br>${leadText('red')}<br>${leadText('black')}`;
        $('#howto').innerHTML = S.helper ? (S.meter === 'analog' ? ruleText(S.sel.analog) : dmmRule()) : '';
        $('#howto').hidden = !S.helper;
        $('#fuseBtn').hidden = S.fuse.analog && S.fuse.dmm;
        $('#btnHelp').classList.toggle('on', S.helper);
        $('#btnObl').classList.toggle('on', S.oblique);
        $('#btnObl').hidden = S.meter !== 'analog';
        const dz = $('#danger');
        dz.hidden = !S.danger;
        if (S.danger) { dz.querySelector('h3').textContent = S.danger.title; dz.querySelector('p').textContent = S.danger.msg; }
    }
    function dmmRule() {
        const id = S.sel.dmm, f = DF[id];
        if (!f) return 'อ่านตัวเลขบนจอได้ทันที';
        const top = { 0: '1999', 1: '199.9', 2: '19.99' }[f[1]];
        return `ย่าน ${DITEM(id)[2]} อ่านตัวเลขบนจอได้ทันที หน่วย <b>${f[2]}</b> (ค่าสูงสุด ${f[3] || top}) ถ้าจอขึ้น 1 ทางซ้าย = เกินย่าน`;
    }
    let flashMsg = '', flashT = 0;
    function flash(m) { flashMsg = m; flashT = Date.now(); }
    function renderAlerts() {
        const box = $('#alerts');
        const list = OUT.warns.slice();
        if (flashMsg && Date.now() - flashT < 15000) list.unshift({ t: flashMsg, cls: 'bad' });
        if (S.oblique && S.meter === 'analog') list.push({ t: 'มองเฉียง: เห็นเข็มกับเงาในกระจกแยกกัน ค่าที่อ่านจะคลาด ให้ขยับตาจนเงาหายไปหลังเข็ม (กดปุ่ม "มองเฉียง" อีกครั้ง)', cls: 'warn' });
        const seen = new Set();
        box.innerHTML = list.filter(w => !seen.has(w.t) && seen.add(w.t)).map(w => `<p class="al ${w.cls}">${w.t}</p>`).join('');
    }

    /* ---------- ภารกิจ ---------- */
    const plugOK = (m) => (m === 'dmm' ? S.leads.red.jack === 'vma' && S.leads.black.jack === 'com' : S.leads.red.jack === 'pos' && S.leads.black.jack === 'com');
    const on = (c, ids) => [].concat(ids).includes(S.leads[c].tp);
    const both = (a, b) => (on('red', a) && on('black', b)) || (on('red', b) && on('black', a));
    const AN = S2 => S2.meter === 'analog';
    const PARTS = [
        [1, 'หน้าปัดแสดงสเกล'], [2, 'ไฟ LED บอกการต่อวงจร (CONTINUITY)'], [3, 'เข็มชี้'], [4, 'สกรูปรับเข็มชี้ให้ตรง 0'],
        [5, 'ปุ่มปรับ 0 โอห์ม (0Ω ADJ)'], [6, 'ขั้ว OUTPUT (วัดเสียง dB)'], [7, 'สวิตช์เลือกย่าน'], [8, 'ขั้วบวก + สำหรับสายแดง'], [9, 'ขั้วลบ −COM สำหรับสายดำ']
    ];
    const MISSIONS = [
        { id: 0, title: 'ทดลองอิสระ', page: '', meter: 'analog', fx: 'cell', free: true, goal: 'เลือกมิเตอร์และอุปกรณ์บนโต๊ะได้เอง ลองวัดทุกอย่างที่อยากรู้' },
        { id: 1, title: 'รู้จักส่วนประกอบมิเตอร์เข็ม', page: 'หน้า 23', meter: 'analog', fx: 'cell', kind: 'parts', goal: 'คลิกที่ส่วนประกอบตามชื่อที่บอก ให้ครบ 9 ส่วน (ตรงกับรูปที่ 2.2)' },
        {
            id: 2, title: 'ปรับเข็มให้ชี้ 0 ก่อนใช้งาน', page: 'หน้า 23', meter: 'analog', fx: 'cell', setup: () => { S.zBase = 0.035; },
            goal: 'มิเตอร์ที่ยังไม่ได้ต่อ เข็มต้องชี้ขีด 0 ซ้ายสุดพอดี ถ้าไม่ตรงให้ปรับที่สกรู',
            steps: [
                { t: 'กดปุ่ม "ซูมหน้าปัด" ดูว่าเข็มทับขีด 0 ซ้ายสุดหรือยัง', ok: () => S.zoomed },
                { t: 'ลากหมุนสกรูสีดำใต้หน้าปัด (เลข 4) จนเข็มทับขีด 0 พอดี', ok: () => Math.abs(zoff()) < 0.004 }
            ]
        },
        {
            id: 3, title: 'วัดแรงดันถ่านไฟฉาย (DCV)', page: 'หน้า 25–26', meter: 'analog', fx: 'cell',
            goal: 'ใช้มิเตอร์เข็มวัดแรงดันถ่าน 1.5 V แล้วอ่านค่าให้ถูกตามตารางที่ 2.1',
            steps: [
                { t: 'ลากปลั๊กสายดำไปเสียบขั้ว −COM และสายแดงเสียบขั้ว +', ok: () => plugOK('analog') },
                { t: 'หมุนปุ่มไปที่ DCV 2.5 V (ย่านที่สูงกว่า 1.5 V และใกล้ที่สุด)', ok: () => S.sel.analog === 'dcv2.5' },
                { t: 'ลากปลายสายแดงไปแตะขั้ว + ของถ่าน และสายดำแตะขั้ว −', ok: () => on('red', 'p') && on('black', 'n') },
                { ask: { q: 'เข็มชี้ได้กี่โวลต์', unit: 'V', ans: 1.5, tol: 0.05 } }
            ]
        },
        {
            id: 4, title: 'ซ้อมใบปฏิบัติงาน 2.1', page: 'หน้า 42–43', meter: 'analog', fx: 'psu', kind: 'table',
            setup: () => { S.leads.red.jack = 'pos'; S.leads.black.jack = 'com'; S.leads.red.tp = 'p'; S.leads.black.tp = 'n'; S.leads.red.tip = [1430, 724]; S.leads.black.tip = [1270, 724]; S.psuV = 0.4; S.sel.analog = 'dcv50'; },
            goal: 'ทำตารางที่ 2.1 แบบเดียวกับในหนังสือ: ตั้งแรงดันจากแหล่งจ่าย เลือกย่าน แล้วอ่านค่า ช่องที่ขีดทับคือช่องที่ห้ามวัด'
        },
        {
            id: 5, title: 'วัดไฟบ้านอย่างปลอดภัย (ACV)', page: 'หน้า 26–28', meter: 'analog', fx: 'outlet', setup: () => { S.breaker = true; },
            goal: 'วัดแรงดันไฟบ้านด้วยย่าน ACV 250 V ทำตามลำดับความปลอดภัยในหนังสือ',
            steps: [
                { t: 'เสียบสายดำที่ขั้ว −COM และสายแดงที่ขั้ว +', ok: () => plugOK('analog') },
                { t: 'คลิกเบรกเกอร์ให้เป็น OFF (ตัดไฟก่อนต่อสาย)', ok: () => !S.breaker },
                { t: 'หมุนปุ่มไปที่ ACV 250 V', ok: () => S.sel.analog === 'acv250' },
                { t: 'แตะปลายสายเข้ารู L และรู N ของเต้ารับ (ไฟสลับ สลับสายได้)', ok: () => both('L', 'N') },
                { t: 'คลิกเบรกเกอร์เป็น ON แล้วดูเข็ม ห้ามจับสาย', ok: () => S.breaker && both('L', 'N') },
                { ask: { q: 'ไฟบ้านวัดได้กี่โวลต์', unit: 'V', ans: 220, tol: 3 } },
                { t: 'ตัดไฟ (เบรกเกอร์ OFF) ก่อน แล้วจึงยกสายออก', ok: () => !S.breaker }
            ]
        },
        {
            id: 6, title: 'วัดกระแสหลอดไฟ (DCmA)', page: 'หน้า 28–29', meter: 'analog', fx: 'lamp',
            goal: 'วัดกระแสต้องต่อมิเตอร์อนุกรม คือตัดวงจรออกแล้วให้กระแสไหลผ่านมิเตอร์',
            steps: [
                { t: 'เสียบสายดำที่ขั้ว −COM และสายแดงที่ขั้ว +', ok: () => plugOK('analog') },
                { t: 'คลิกสวิตช์ให้ปิดก่อน (หลอดดับ)', ok: () => !S.sw },
                { t: 'คลิกที่ "จุดตัดวงจร" เพื่อถอดสายออก', ok: () => !S.link },
                { t: 'หมุนปุ่มไปที่ DCmA 250 (0.25 A)', ok: () => S.sel.analog === 'ma250' },
                { t: 'ต่ออนุกรม: สายแดงแตะปลายฝั่งหลอด สายดำแตะปลายฝั่งถ่าน', ok: () => on('red', 'k1') && on('black', 'k2') },
                { t: 'คลิกสวิตช์ให้เปิด หลอดติด กระแสไหลผ่านมิเตอร์', ok: () => S.sw && OUT.lampP > 0.5 },
                { ask: { q: 'กระแสที่ไหลผ่านหลอดกี่มิลลิแอมแปร์', unit: 'mA', ans: 150, tol: 3 } }
            ]
        },
        {
            id: 7, title: 'วัดความต้านทาน (Ω)', page: 'หน้า 30–31', meter: 'analog', fx: 'res',
            goal: 'ก่อนวัดความต้านทานต้องปรับ 0 Ω ทุกครั้งที่ตั้งย่าน แล้วอ่านสเกลบนสุดคูณย่าน',
            steps: [
                { t: 'เสียบสายดำที่ขั้ว −COM และสายแดงที่ขั้ว +', ok: () => plugOK('analog') },
                { t: 'หมุนปุ่มไปที่ Ω ×10', ok: () => S.sel.analog === 'x10' },
                { t: 'ลากปลายสายแดงไปแตะปลายสายดำ (ช็อตปลายสาย)', ok: () => tipsTouch() },
                { t: 'หมุนปุ่ม 0Ω ADJ จนเข็มชี้ 0 Ω (ขวาสุด) พอดี', ok: () => tipsTouch() && Math.abs(OUT.frac - zoff() - 1) < 0.006 },
                { t: 'แตะสายวัดที่ขาทั้งสองของ R2 (แดง แดง น้ำตาล)', ok: () => both('r1a', 'r1b') },
                { ask: { q: 'R2 มีความต้านทานกี่โอห์ม (อ่านสเกลแล้วคูณ 10)', unit: 'Ω', ans: 220, tol: 15 } }
            ]
        },
        {
            id: 8, title: 'มิเตอร์ดิจิทัล: วัดแบตเตอรี่ 9 V', page: 'หน้า 33', meter: 'dmm', fx: 'bat9',
            goal: 'มิเตอร์ดิจิทัลอ่านตัวเลขบนจอได้เลย ลองต่อกลับขั้วดูว่าจอแสดงอะไร',
            steps: [
                { t: 'เสียบสายดำที่ขั้ว COM และสายแดงที่ขั้ว VΩmA', ok: () => plugOK('dmm') },
                { t: 'หมุนปุ่มไปที่ V⎓ 20', ok: () => S.sel.dmm === 'v20' },
                { t: 'สายแดงแตะขั้ว + สายดำแตะขั้ว − ของแบตเตอรี่', ok: () => on('red', 'p') && on('black', 'n') },
                { ask: { q: 'จอแสดงกี่โวลต์', unit: 'V', ans: 9, tol: 0.02 } },
                { t: 'สลับสาย: สายแดงแตะขั้ว − สายดำแตะขั้ว + แล้วดูจอ', ok: () => on('red', 'n') && on('black', 'p') },
                { t: 'จอขึ้นเครื่องหมาย − แปลว่าต่อกลับขั้ว (ค่ายังเท่าเดิม) เข้าใจแล้วคลิกถัดไป', ok: null, ackBtn: 'เข้าใจแล้ว' }
            ]
        },
        {
            id: 9, title: 'มิเตอร์ดิจิทัล: วัดกระแสหลอดไฟ', page: 'หน้า 34–35', meter: 'dmm', fx: 'lamp',
            goal: 'วัดกระแสต้องต่ออนุกรมเหมือนมิเตอร์เข็ม ถ้ากระแสเกิน 200 mA ต้องย้ายสายไปขั้ว 10A',
            steps: [
                { t: 'เสียบสายดำที่ COM สายแดงที่ VΩmA', ok: () => plugOK('dmm') },
                { t: 'ปิดสวิตช์ แล้วคลิกถอดสายที่ "จุดตัดวงจร"', ok: () => !S.sw && !S.link },
                { t: 'หมุนปุ่มไปที่ A⎓ 200m', ok: () => S.sel.dmm === 'a200m' },
                { t: 'สายแดงแตะปลายฝั่งหลอด สายดำแตะปลายฝั่งถ่าน แล้วเปิดสวิตช์', ok: () => on('red', 'k1') && on('black', 'k2') && S.sw && OUT.lampP > 0.5 },
                { ask: { q: 'จอแสดงกี่มิลลิแอมแปร์', unit: 'mA', ans: 150, tol: 1 } },
                { t: 'ปิดสวิตช์ แล้วกดปุ่ม "เปลี่ยนเป็นหลอด 0.5 A" ในแผงนี้', ok: () => !S.sw && S.lampBig },
                { t: 'กระแส 0.5 A = 500 mA เกิน 200 mA: ย้ายสายแดงไปขั้ว 10A และหมุนปุ่มไปที่ 10A', ok: () => S.leads.red.jack === 'a10' && S.sel.dmm === 'a10' },
                { t: 'แตะสายตามเดิม แล้วเปิดสวิตช์', ok: () => on('red', 'k1') && on('black', 'k2') && S.sw && OUT.lampP > 1 },
                { ask: { q: 'จอแสดงกี่แอมแปร์', unit: 'A', ans: 0.5, tol: 0.01 } }
            ]
        },
        {
            id: 10, title: 'มิเตอร์ดิจิทัล: วัดความต้านทาน', page: 'หน้า 35', meter: 'dmm', fx: 'res',
            goal: 'มิเตอร์ดิจิทัลวัดความต้านทานได้ทันที ไม่ต้องปรับ 0 Ω เลือกย่านที่สูงกว่าค่าที่จะวัด',
            steps: [
                { t: 'เสียบสายดำที่ COM สายแดงที่ VΩmA', ok: () => plugOK('dmm') },
                { t: 'หมุนปุ่มไปที่ Ω 2000', ok: () => S.sel.dmm === 'o2000' },
                { t: 'แตะสายวัดที่ขาทั้งสองของ R3 (น้ำตาล ดำ แดง)', ok: () => both('r2a', 'r2b') },
                { ask: { q: 'R3 มีความต้านทานกี่โอห์ม', unit: 'Ω', ans: 1000, tol: 2 } },
                { t: 'แตะ R4 (เหลือง ม่วง แดง) จอขึ้น 1 ทางซ้าย = เกินย่าน หมุนไปที่ Ω 20k', ok: () => both('r3a', 'r3b') && S.sel.dmm === 'o20k' },
                { ask: { q: 'R4 มีความต้านทานกี่กิโลโอห์ม', unit: 'kΩ', ans: 4.7, tol: 0.02 } }
            ]
        }
    ];
    let MI = null, prog = null;
    const save = store.get();

    function startMission(id) {
        MI = MISSIONS.find(m => m.id === id) || MISSIONS[0];
        prog = { done: [], tries: 0, part: 0, cells: {} };
        // รีเซ็ตโต๊ะ
        Object.assign(S, { meter: MI.meter, screw: 0, zBase: 0, adjDeg: 0, oblique: false, danger: null, fx: MI.fx, psuV: 12.5, sw: true, link: true, breaker: false, lampBig: false, zoomed: false });
        S.sel = { analog: 'off', dmm: 'off' };
        S.fuse = { analog: true, dmm: true };
        restLeads(); flashMsg = '';
        if (MI.setup) MI.setup();
        needlePos = clamp(zoff(), -0.06, 1.06); needleVel = 0;
        drawMeterStatic(); fit();
        document.querySelectorAll('[data-meter-pick]').forEach(x => x.classList.toggle('on', x.dataset.meterPick === S.meter));
        $('#fxSel').value = S.fx;
        $('#lampBtn').textContent = 'เปลี่ยนเป็นหลอด 0.5 A';
        renderMission();
        update();
        try { history.replaceState(null, '', `?m=${id}${EMBED ? '&embed=1' : ''}`); } catch (e) { /* file:// */ }
    }
    function markDone() {
        if (!save.done.includes(MI.id)) { save.done.push(MI.id); store.set(save); fillSelect(); }
        $('#mDone').hidden = false;
    }
    function fillSelect() {
        const sel = $('#mSel');
        sel.innerHTML = MISSIONS.filter(m => m.id).concat(MISSIONS[0]).map(m => `<option value="${m.id}">${m.id ? m.id + '. ' : ''}${m.title}${save.done.includes(m.id) ? '  ✓' : ''}</option>`).join('');
        if (MI) sel.value = MI.id;
    }
    function renderMission() {
        $('#mSel').value = MI.id;
        $('#mTitle').textContent = MI.title;
        $('#mPage').textContent = MI.page ? 'หนังสือ' + MI.page : '';
        $('#mPage').hidden = !MI.page;
        $('#mGoal').textContent = MI.goal;
        $('#mDone').hidden = true;
        $('#freeBox').hidden = !MI.free;
        $('#lampBtn').hidden = !(MI.free || MI.id === 9);
        $('#nextBtn').hidden = !MI.id || MI.id === 10;
        const ol = $('#mSteps'); ol.innerHTML = ''; $('#mTable').innerHTML = ''; $('#mParts').innerHTML = '';
        if (MI.kind === 'parts') { renderParts(); return; }
        if (MI.kind === 'table') { buildTable(); return; }
        (MI.steps || []).forEach((st, i) => {
            const li = document.createElement('li');
            if (st.ask) {
                li.className = 'ask';
                li.innerHTML = `<span>${st.ask.q}</span><span class="in"><input type="text" inputmode="decimal" autocomplete="off" aria-label="${st.ask.q}"> <b>${st.ask.unit}</b> <button type="button" class="btn small">ตรวจ</button></span><span class="fb"></span>`;
                const inp = li.querySelector('input'), go = () => checkAsk(i, li);
                li.querySelector('button').addEventListener('click', go);
                inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
            } else {
                li.innerHTML = `<span>${st.t}</span>`;
                if (st.ackBtn) { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn small'; b.textContent = st.ackBtn; b.addEventListener('click', () => { if (current() === i) { prog.done[i] = true; checkMission(); } }); li.appendChild(b); }
            }
            ol.appendChild(li);
        });
        paintSteps();
    }
    const current = () => { if (!MI.steps) return -1; for (let i = 0; i < MI.steps.length; i++) if (!prog.done[i]) return i; return MI.steps.length; };
    function paintSteps() {
        const c = current();
        [...$('#mSteps').children].forEach((li, i) => {
            li.classList.toggle('done', !!prog.done[i]);
            li.classList.toggle('now', i === c);
            const inp = li.querySelector('input'); if (inp) inp.disabled = i !== c;
        });
    }
    function checkMission() {
        if (!MI || !MI.steps || !prog) return;
        let ch = false;
        for (let i = 0; i < MI.steps.length; i++) {
            if (prog.done[i]) continue;
            const st = MI.steps[i];
            if (st.ask || !st.ok) break;
            if (st.ok()) { prog.done[i] = true; ch = true; continue; }
            break;
        }
        paintSteps();
        if (current() === MI.steps.length) markDone();
        return ch;
    }
    // อธิบายวิธีอ่านค่าจากสถานะมิเตอร์ตอนนี้
    function explain(ask) {
        if (S.meter === 'dmm') return `อ่านตัวเลขบนจอได้เลย: ${OUT.disp.trim()} ${DF[S.sel.dmm] ? DF[S.sel.dmm][2] : ''}`;
        const u = aRule(S.sel.analog), a = aRange(S.sel.analog);
        if (!u) return '';
        if (a.g === 'ohm') { const sc = ask.ans / a.r; return `อ่านสเกลโอห์ม เข็มชี้ประมาณ ${num(sc)} แล้วคูณ ${a.r} = ${num(ask.ans)} Ω`; }
        const val = ask.ans, sc = val / u.mul;
        return `ย่าน ${a.label} อ่านแถว ${u.rowName} เข็มชี้ประมาณ ${num(sc)}${u.mul === 1 ? '' : ` × ${u.mul}`} = ${num(val)} ${ask.unit}`;
    }
    function checkAsk(i, li) {
        if (current() !== i) return;
        const ask = MI.steps[i].ask, inp = li.querySelector('input'), fb = li.querySelector('.fb');
        const v = parseFloat(String(inp.value).replace(/,/g, '').replace('−', '-'));
        if (isNaN(v)) { fb.className = 'fb bad'; fb.textContent = 'พิมพ์ตัวเลข'; return; }
        if (Math.abs(v - ask.ans) <= ask.tol) {
            fb.className = 'fb ok'; fb.textContent = 'ถูกต้อง · ' + explain(ask);
            prog.done[i] = true; prog.tries = 0; checkMission();
        } else {
            prog.tries++;
            fb.className = 'fb bad';
            if (S.meter === 'analog') fb.innerHTML = prog.tries < 2 ? `ยังไม่ถูก ลองดูอีกครั้ง: ${ruleText(S.sel.analog)}` : `ยังไม่ถูก วิธีอ่าน: ${explain(ask)}`;
            else fb.textContent = prog.tries < 2 ? 'ยังไม่ถูก ดูตัวเลขบนจอและหน่วยของย่านอีกครั้ง' : 'วิธีอ่าน: ' + explain(ask);
        }
    }
    // ภารกิจที่ 1 ชี้ส่วนประกอบ
    function renderParts() {
        const box = $('#mParts');
        if (prog.part >= PARTS.length) { box.innerHTML = '<p class="al ok">ครบ 9 ส่วนแล้ว เก่งมาก</p>'; markDone(); return; }
        const [n, name] = PARTS[prog.part];
        box.innerHTML = `<p class="pq">ข้อ ${prog.part + 1}/9 คลิกที่: <b>เลข ${n} ${name}</b></p><p class="fb" id="partFb"></p>
            <ol class="plist">${PARTS.map((p, i) => `<li class="${i < prog.part ? 'done' : ''}">${p[1]}</li>`).join('')}</ol>`;
    }
    function partClick(n) {
        if (prog.part >= PARTS.length) return;
        const want = PARTS[prog.part][0];
        if (n === want) { prog.part++; renderParts(); }
        else { const p = PARTS.find(x => x[0] === n); const fb = $('#partFb'); if (fb) { fb.className = 'fb bad'; fb.textContent = p ? `นั่นคือ "${p[1]}" ลองใหม่` : 'ลองใหม่'; } }
    }
    // ภารกิจที่ 4 ตารางที่ 2.1
    const TV = [0.4, 1, 2.3, 4, 8.6, 12.5, 23, 29], TR = [0.5, 2.5, 10, 50];
    function buildTable() {
        let h = `<table class="t21"><tr><th>แรงดัน</th>${TR.map(r => `<th>DCV ${r} V</th>`).join('')}</tr>`;
        TV.forEach(v => {
            h += `<tr><td><button type="button" class="btn small ghost" data-v="${v}">${v} V</button></td>`;
            TR.forEach(r => { h += v > r ? `<td class="x" data-v="${v}" data-r="${r}">ห้ามวัด</td>` : `<td><input type="text" inputmode="decimal" data-v="${v}" data-r="${r}" aria-label="แรงดัน ${v} V ย่าน ${r} V"></td>`; });
            h += '</tr>';
        });
        h += '</table><p class="note">กดปุ่มแรงดันทางซ้ายเพื่อตั้งแหล่งจ่าย แล้วหมุนปุ่มมิเตอร์ไปที่ย่านของคอลัมน์ ช่องจะเปิดให้พิมพ์ค่าที่อ่านได้ (ลองตั้งย่านในช่อง "ห้ามวัด" ดูว่าเข็มเป็นอย่างไร)</p><p class="fb" id="tFb"></p>';
        const box = $('#mTable'); box.innerHTML = h;
        box.querySelectorAll('button[data-v]').forEach(b => b.addEventListener('click', () => { S.psuV = +b.dataset.v; update(); }));
        box.querySelectorAll('input').forEach(inp => {
            const go = () => {
                const v = +inp.dataset.v, r = +inp.dataset.r, x = parseFloat(inp.value);
                if (inp.value.trim() === '') return;
                const tol = Math.max(r / 100, 0.004) + 1e-9;
                const ok = Math.abs(x - v) <= tol;
                inp.classList.toggle('ok', ok); inp.classList.toggle('bad', !ok);
                prog.cells[v + '/' + r] = ok;
                const u = M.DCV[r], sc = v / u[1];
                $('#tFb').className = 'fb ' + (ok ? 'ok' : 'bad');
                $('#tFb').textContent = ok ? `ถูกต้อง: ย่าน ${r} V อ่านแถว 0–${u[0]} เข็มชี้ประมาณ ${num(sc)}${u[1] === 1 ? '' : ` × ${u[1]}`} = ${num(v)} V` : `ยังไม่ถูก ลองดู: ${ruleText('dcv' + r)}`;
                const total = TV.reduce((n, vv) => n + TR.filter(rr => vv <= rr).length, 0);
                const got = Object.values(prog.cells).filter(Boolean).length;
                if (got >= total) { $('#tFb').textContent = `ครบ ${total} ช่องแล้ว เก่งมาก ไปทำของจริงในหนังสือหน้า 43 ได้เลย`; markDone(); }
            };
            inp.addEventListener('change', go);
            inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
        });
        refreshTable();
    }
    function refreshTable() {
        if (!MI || MI.kind !== 'table') return;
        const cur = S.sel.analog;
        document.querySelectorAll('#mTable [data-v]').forEach(el => {
            const v = +el.dataset.v, r = el.dataset.r ? +el.dataset.r : null;
            const live = Math.abs(S.psuV - v) < 1e-6 && (r === null || cur === 'dcv' + r);
            if (el.tagName === 'INPUT') el.disabled = !live;
            el.classList.toggle('live', live && Math.abs(S.psuV - v) < 1e-6);
        });
    }

    /* ---------- ปุ่มต่าง ๆ ---------- */
    $('#zIn').addEventListener('click', () => zoomAt(1.3, VB.x + VB.w / 2, VB.y + VB.h / 2));
    $('#zOut').addEventListener('click', () => zoomAt(1 / 1.3, VB.x + VB.w / 2, VB.y + VB.h / 2));
    $('#zFit').addEventListener('click', fit);
    $('#zFace').addEventListener('click', zoomFace);
    $('#btnHelp').addEventListener('click', () => { S.helper = !S.helper; update({ fx: false }); });
    $('#btnObl').addEventListener('click', () => { S.oblique = !S.oblique; drawDyn(); renderStatus(); renderAlerts(); });
    $('#fuseBtn').addEventListener('click', () => { S.fuse = { analog: true, dmm: true }; flashMsg = ''; update(); });
    $('#dangerBtn').addEventListener('click', () => {
        S.danger = null; S.breaker = false; S.fuse = { analog: true, dmm: true }; flashMsg = '';
        ['red', 'black'].forEach(c => { const L = S.leads[c]; if (L.tp) { L.tp = null; L.tip = REST[c].tip.slice(); } });
        update();
    });
    $('#resetBtn').addEventListener('click', () => startMission(MI.id));
    $('#nextBtn').addEventListener('click', () => startMission(Math.min(10, MI.id + 1)));
    $('#mSel').addEventListener('change', e => startMission(+e.target.value));
    $('#lampBtn').addEventListener('click', () => { S.lampBig = !S.lampBig; if (S.fx !== 'lamp') S.fx = 'lamp'; $('#lampBtn').textContent = S.lampBig ? 'เปลี่ยนเป็นหลอด 0.15 A' : 'เปลี่ยนเป็นหลอด 0.5 A'; update(); });
    $('#fxSel').innerHTML = Object.keys(FX).map(k => `<option value="${k}">${FX[k].name}</option>`).join('');
    $('#fxSel').addEventListener('change', e => { S.fx = e.target.value; ['red', 'black'].forEach(c => { const L = S.leads[c]; L.tp = null; L.tip = REST[c].tip.slice(); }); update(); });
    document.querySelectorAll('[data-meter-pick]').forEach(b => b.addEventListener('click', () => {
        const m = b.dataset.meterPick; if (S.meter === m) return;
        S.meter = m; ['red', 'black'].forEach(c => { S.leads[c].jack = null; S.leads[c].plug = REST[c].plug.slice(); });
        drawMeterStatic(); update();
        document.querySelectorAll('[data-meter-pick]').forEach(x => x.classList.toggle('on', x.dataset.meterPick === S.meter));
    }));
    $('#psuDn').addEventListener('click', () => { S.psuV = Math.max(0, Math.round((S.psuV - 0.1) * 10) / 10); if (S.fx === 'psu') update(); });
    $('#psuUp').addEventListener('click', () => { S.psuV = Math.min(30, Math.round((S.psuV + 0.1) * 10) / 10); if (S.fx === 'psu') update(); });
    window.addEventListener('resize', () => { if (VB.w >= WORLD.w - 1) fit(); });

    if (EMBED) document.body.classList.add('embed');
    fillSelect();
    const m0 = parseInt(qs.get('m'), 10);
    startMission(isNaN(m0) ? 1 : clamp(m0, 0, 10));
    requestAnimationFrame(tick);
    // ให้สคริปต์ทดสอบเรียกดูสถานะได้
    window.VLab = { S, OUT: () => OUT, compute, update, startMission, fmtD, solve, FX, MISSIONS, prog: () => prog, VB: () => VB };
})();
