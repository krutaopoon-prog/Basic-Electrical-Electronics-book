/* ===========================================
   ScoreSheet — ใบรายงานคะแนนหลังนักเรียนกดส่ง (แสดงบนจอ + พิมพ์ A4 หน้าเดียว)
   ใช้: ScoreSheet.render(el, data) แล้ว ScoreSheet.print()
   ต้องโหลด common.js ก่อน
   =========================================== */
(function (g) {
    'use strict';
    const C = g.LessonCommon;

    /* data = { kind, chapter, who:{name,room,no}, score, total, submittedAt, startedAt, attempt, detailHTML, extraHTML } */
    function render(el, d) {
        const pct = d.total ? Math.round(d.score / d.total * 100) : 0;
        el.innerHTML = `
            <div class="ss-top">
                <div class="ss-org">วิทยาลัยเทคนิคอุตรดิตถ์ · วิชางานไฟฟ้าและอิเล็กทรอนิกส์เบื้องต้น</div>
                <h2 class="ss-title">ใบรายงานคะแนน</h2>
                <div class="ss-sub">${C.esc(d.kind)} · ${C.esc(d.chapter)}</div>
            </div>
            <table class="ss-who">
                <tr><th>ชื่อ-สกุล</th><td colspan="3">${C.esc(d.who.name)}</td></tr>
                <tr><th>ชั้น</th><td>${C.esc(d.who.room)}</td><th>เลขที่</th><td>${C.esc(d.who.no)}</td></tr>
            </table>
            <div class="ss-score"><span class="ss-big">${d.score} / ${d.total}</span> คะแนน <span class="ss-pct">(ร้อยละ ${pct})</span></div>
            <table class="ss-meta">
                <tr><th>ส่งเมื่อ</th><td>${C.thaiDateTime(d.submittedAt)}</td></tr>
                <tr><th>เวลาที่ใช้ทำ</th><td>${C.duration(d.submittedAt - d.startedAt)}</td></tr>
                <tr><th>ส่งครั้งที่</th><td>${d.attempt}</td></tr>
            </table>
            ${d.detailHTML || ''}
            ${d.extraHTML || ''}
            <div class="ss-foot">บันทึกเป็น PDF แล้วแนบส่งใน Google Classroom · ${C.esc(location.href.split('#')[0].split('?')[0])}</div>`;
        el.hidden = false;
    }

    /* พิมพ์เฉพาะใบคะแนน (ซ่อนส่วนอื่นของหน้าด้วย body.print-score) */
    function print() {
        document.body.classList.add('print-score');
        const done = () => { document.body.classList.remove('print-score'); g.removeEventListener('afterprint', done); };
        g.addEventListener('afterprint', done);
        g.print();
    }

    g.ScoreSheet = { render, print };
})(window);
