/* ===========================================
   LessonCommon — ฟังก์ชันที่ใช้ร่วมกันทั้งในเบราว์เซอร์และสคริปต์ Node
   (_private/encrypt-answers.mjs โหลดไฟล์นี้ด้วย ห้ามใช้ DOM ในส่วนบน)
   =========================================== */
(function (g) {
    'use strict';

    /* --- ทำคำตอบให้อยู่ในรูปเดียวกันก่อนเทียบ:
       ตัดช่องว่าง/ขีดล่าง ตัวพิมพ์ใหญ่ ตัดเลข 0 นำหน้า ตัดตัวห้อยฐาน เช่น "0010 1101" -> "101101" --- */
    function norm(s) {
        let t = String(s == null ? '' : s).trim().toUpperCase();
        t = t.replace(/[\s_,]/g, '');
        t = t.replace(/^0X/, '');
        t = t.replace(/(₁₀|₂|₈|₁₆|₃|₄|₅)$/, '');
        if (/^[0-9A-F]+$/.test(t)) t = t.replace(/^0+(?=.)/, '');
        return t;
    }

    /* --- cyrb53: แฮช 53 บิตแบบเร็ว ใช้กันการแอบดูเฉลยจากซอร์สโค้ดเท่านั้น (ไม่ใช่ระบบความปลอดภัย) --- */
    function cyrb53(str, seed) {
        let h1 = 0xdeadbeef ^ (seed || 0), h2 = 0x41c6ce57 ^ (seed || 0);
        for (let i = 0; i < str.length; i++) {
            const ch = str.charCodeAt(i);
            h1 = Math.imul(h1 ^ ch, 2654435761);
            h2 = Math.imul(h2 ^ ch, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
        h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
        h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
        return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
    }

    function answerHash(salt, id, value) {
        return cyrb53(salt + '|' + id + '|' + norm(value), 2569);
    }

    /* --- แปลงเลขฐาน (ใช้กับโจทย์สุ่ม) --- */
    function toBase(n, b) { return Number(n).toString(b).toUpperCase(); }
    function fromBase(s, b) { return parseInt(norm(s), b); }

    /* --- ขั้นตอนการหาร สำหรับแสดงวิธีทำ: [[ตัวตั้ง, ผลหาร, เศษ], ...] --- */
    function divSteps(n, b) {
        const out = [];
        let x = n;
        do { out.push([x, Math.floor(x / b), x % b]); x = Math.floor(x / b); } while (x > 0);
        return out;
    }

    /* --- base64 <-> bytes --- */
    function b64ToBytes(b64) {
        const bin = atob(b64);
        const u = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
        return u;
    }

    /* --- ถอดรหัสเฉลยด้วยรหัสครู (PBKDF2-SHA256 -> AES-GCM 256) --- */
    async function decryptAnswers(enc, password) {
        const subtle = (g.crypto && g.crypto.subtle);
        if (!subtle) throw new Error('NO_CRYPTO');
        const keyMat = await subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
        const key = await subtle.deriveKey(
            { name: 'PBKDF2', salt: b64ToBytes(enc.salt), iterations: enc.iter, hash: 'SHA-256' },
            keyMat, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
        const plain = await subtle.decrypt({ name: 'AES-GCM', iv: b64ToBytes(enc.iv) }, key, b64ToBytes(enc.data));
        return JSON.parse(new TextDecoder().decode(plain));
    }

    /* --- localStorage แบบไม่พังเมื่อเบราว์เซอร์ปิดการเก็บข้อมูล --- */
    const store = {
        get(k, d) { try { const v = g.localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
        set(k, v) { try { g.localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
    };

    function shuffle(a) {
        const arr = a.slice();
        for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
        return arr;
    }

    function esc(s) {
        return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    }

    /* --- วันเวลาแบบไทย เช่น "18 ตุลาคม 2569 เวลา 21:35:12 น." --- */
    function thaiDateTime(d) {
        d = new Date(d);
        const date = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
        const time = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        return date + ' เวลา ' + time + ' น.';
    }

    /* --- ระยะเวลา เช่น "12 นาที 30 วินาที" --- */
    function duration(ms) {
        let s = Math.max(0, Math.round(ms / 1000));
        const h = Math.floor(s / 3600); s -= h * 3600;
        const m = Math.floor(s / 60); s -= m * 60;
        return [h ? h + ' ชั่วโมง' : '', m ? m + ' นาที' : '', (s || (!h && !m)) ? s + ' วินาที' : ''].filter(Boolean).join(' ');
    }

    g.LessonCommon = { norm, cyrb53, answerHash, toBase, fromBase, divSteps, decryptAnswers, store, shuffle, esc, thaiDateTime, duration };
})(typeof window !== 'undefined' ? window : globalThis);
