/* 년·월 둥근 목록 + 일 달력 — 주문조회 페이지의 날짜 선택과 같은 모양·동작 (허용 범위가 있는 버전) */
(function () {
  'use strict';
  var WEEK = ['일', '월', '화', '수', '목', '금', '토'];
  var CHEV = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var uid = 0;

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function daysIn(y, m) { return new Date(y, m, 0).getDate(); }
  function sod(d) { var x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
  function iso(y, m, d) { return y + '-' + pad(m) + '-' + pad(d); }

  function mount(host, o) {
    var id = 'ddp' + (++uid);
    var min = sod(o.min), max = sod(o.max), minY = min.getFullYear(), maxY = max.getFullYear();
    var y = 0, m = 0, d = 0;
    var vm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(o.value || '');
    if (vm) { y = +vm[1]; m = +vm[2]; d = +vm[3]; }

    var inRange = function (yy, mm, dd) { var t = new Date(yy, mm - 1, dd); return t >= min && t <= max && t.getMonth() === mm - 1; };
    var monthOk = function (yy, mm) { return new Date(yy, mm, 0) >= min && new Date(yy, mm - 1, 1) <= max; };
    var monthOkAnyYear = function (mm) { for (var k = minY; k <= maxY; k++) if (monthOk(k, mm)) return true; return false; };

    /* ----- 마크업 (주문조회 페이지와 같은 클래스) ----- */
    host.textContent = '';
    var fs = document.createElement('fieldset'); fs.className = 'date-field';
    var lg = document.createElement('legend'); lg.textContent = o.legend; fs.appendChild(lg);
    var row = document.createElement('div'); row.className = 'select-row'; fs.appendChild(row);
    function btn(cls, label, text, hasPop) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'date-btn is-empty'; b.id = id + cls;
      b.setAttribute('aria-haspopup', hasPop); b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-label', o.label + ' ' + label + ' 선택');
      b.innerHTML = '<span>' + text + '</span>' + CHEV; return b;
    }
    function wrapList(b, cls, labelTxt) {
      var w = document.createElement('div'); w.className = 'year-wrap';
      var ul = document.createElement('ul'); ul.className = cls; ul.id = b.id + 'List'; ul.setAttribute('role', 'listbox'); ul.setAttribute('aria-label', o.label + ' ' + labelTxt); ul.hidden = true;
      b.setAttribute('aria-controls', ul.id); w.appendChild(b); w.appendChild(ul); row.appendChild(w); return ul;
    }
    var bY = btn('Y', '연도', '년', 'listbox'), bM = btn('M', '월', '월', 'listbox'), bD = btn('D', '일', '일', 'dialog');
    var ylist = wrapList(bY, 'ylist', '연도'), mlist = wrapList(bM, 'ylist mlist', '월');
    row.appendChild(bD);
    var cal = document.createElement('div'); cal.className = 'cal'; cal.id = id + 'Cal'; cal.setAttribute('role', 'dialog'); cal.setAttribute('aria-label', o.label + ' 날짜 선택'); cal.hidden = true;
    bD.setAttribute('aria-controls', cal.id); row.appendChild(cal);
    host.appendChild(fs);

    function fill(ul, values, labelOf, attr) {
      values.forEach(function (v) {
        var li = document.createElement('li'); li.setAttribute('role', 'option'); li.setAttribute('tabindex', '-1');
        li.setAttribute(attr, String(v)); li.setAttribute('aria-selected', 'false'); li.textContent = labelOf(v); ul.appendChild(li);
      });
    }
    var years = []; for (var yy = minY; yy <= maxY; yy++) years.push(yy);
    var months = []; for (var mm = 1; mm <= 12; mm++) months.push(mm);
    fill(ylist, years, function (v) { return String(v); }, 'data-year');
    fill(mlist, months, function (v) { return v + '월'; }, 'data-month');

    /* ----- 팝업은 한 번에 하나만 ----- */
    function shut(pop, b) { if (!pop.hidden) { pop.hidden = true; b.setAttribute('aria-expanded', 'false'); } }
    function closeAll(except) { if (except !== 'y') shut(ylist, bY); if (except !== 'm') shut(mlist, bM); if (except !== 'd') shut(cal, bD); }
    function reveal(pop, b) { document.dispatchEvent(new CustomEvent('ddp:open', { detail: id })); pop.hidden = false; b.setAttribute('aria-expanded', 'true'); }
    document.addEventListener('ddp:open', function (e) { if (e.detail !== id) closeAll(); });

    /* ----- 값 ----- */
    function value() { return y && m && d && inRange(y, m, d) ? iso(y, m, d) : ''; }
    function emit() { if (o.onChange) o.onChange(value()); }
    function mark(ul, attr, v) { Array.prototype.forEach.call(ul.children, function (li) { li.setAttribute('aria-selected', li.getAttribute(attr) === String(v) ? 'true' : 'false'); }); }
    function paint() {
      bY.firstChild.textContent = y ? y + '년' : '년'; bY.classList.toggle('is-empty', !y); mark(ylist, 'data-year', y || '');
      bM.firstChild.textContent = m ? m + '월' : '월'; bM.classList.toggle('is-empty', !m); mark(mlist, 'data-month', m || '');
      bD.firstChild.textContent = d ? d + '일' : '일'; bD.classList.toggle('is-empty', !d);
      Array.prototype.forEach.call(ylist.children, function (li) { li.setAttribute('aria-disabled', 'false'); });
      Array.prototype.forEach.call(mlist.children, function (li) {
        var mv = +li.getAttribute('data-month'); li.setAttribute('aria-disabled', (y ? monthOk(y, mv) : monthOkAnyYear(mv)) ? 'false' : 'true');
      });
    }
    // 년·월이 바뀐 뒤: 허용되지 않는 달·일은 비운다
    function revalidate() {
      if (y && m && !monthOk(y, m)) { m = 0; d = 0; }
      if (y && m && d && !inRange(y, m, d)) d = 0;
      setInvalid(false); paint(); emit();
    }
    function setInvalid(on) {
      [bY, bM, bD].forEach(function (b) { b.removeAttribute('aria-invalid'); });
      if (on) { (y ? [] : [bY]).concat(m ? [] : [bM], d ? [] : [bD]).forEach(function (b) { b.setAttribute('aria-invalid', 'true'); }); }
    }

    /* ----- 년·월 목록 ----- */
    function openList(ul, b, key, attr, selected) {
      closeAll(key); reveal(ul, b);
      var cur = ul.querySelector('[' + attr + '="' + selected + '"]:not([aria-disabled="true"])') || ul.querySelector('li:not([aria-disabled="true"])');
      if (cur) { cur.focus(); if (cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest' }); }
    }
    function closeList(ul, b, back) { shut(ul, b); if (back) b.focus(); }
    function pickYear(v) { y = +v; revalidate(); }
    function pickMonth(v) {
      var mv = +v;
      if (!y) { for (var k = minY; k <= maxY; k++) if (monthOk(k, mv)) { y = k; break; } }   // 년을 아직 안 골랐다면 가능한 첫 해로
      m = mv; revalidate();
    }
    bY.addEventListener('click', function () { if (ylist.hidden) openList(ylist, bY, 'y', 'data-year', y); else closeList(ylist, bY, false); });
    bM.addEventListener('click', function () { if (mlist.hidden) openList(mlist, bM, 'm', 'data-month', m); else closeList(mlist, bM, false); });
    ylist.addEventListener('click', function (e) { var li = e.target.closest('li'); if (!li) return; pickYear(li.getAttribute('data-year')); closeList(ylist, bY, true); });
    mlist.addEventListener('click', function (e) { var li = e.target.closest('li'); if (!li || li.getAttribute('aria-disabled') === 'true') return; pickMonth(li.getAttribute('data-month')); closeList(mlist, bM, true); });
    function listKeys(ul, b, attr, apply) {
      ul.addEventListener('keydown', function (e) {
        var items = Array.prototype.slice.call(ul.children).filter(function (li) { return li.getAttribute('aria-disabled') !== 'true'; });
        var i = items.indexOf(document.activeElement);
        if (e.key === 'Escape') { e.preventDefault(); closeList(ul, b, true); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); items[Math.min(items.length - 1, i + 1)].focus(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); items[Math.max(0, i - 1)].focus(); }
        else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (i >= 0) { apply(items[i].getAttribute(attr)); closeList(ul, b, true); } }
        else if (e.key === 'Tab') { closeList(ul, b, false); }
      });
    }
    listKeys(ylist, bY, 'data-year', pickYear); listKeys(mlist, bM, 'data-month', pickMonth);

    /* ----- 일: 달력 ----- */
    var vY = minY, vM = min.getMonth() + 1;
    function renderCal() {
      var first = new Date(vY, vM - 1, 1).getDay(), total = daysIn(vY, vM);
      var prevOk = monthOk(vM === 1 ? vY - 1 : vY, vM === 1 ? 12 : vM - 1), nextOk = monthOk(vM === 12 ? vY + 1 : vY, vM === 12 ? 1 : vM + 1);
      var html = '<div class="cal-head"><button type="button" class="cal-nav" data-nav="-1" aria-label="이전 달"' + (prevOk ? '' : ' disabled') + '>‹</button>'
        + '<strong class="cal-title" aria-live="polite">' + vM + '월</strong>'
        + '<button type="button" class="cal-nav" data-nav="1" aria-label="다음 달"' + (nextOk ? '' : ' disabled') + '>›</button></div>'
        + '<div class="cal-week" aria-hidden="true">' + WEEK.map(function (w, i) { return '<span' + (i === 0 ? ' class="sun"' : '') + '>' + w + '</span>'; }).join('') + '</div><div class="cal-grid" role="grid">';
      for (var i = 0; i < first; i++) html += '<span class="cal-pad"></span>';
      for (var dd = 1; dd <= total; dd++) {
        var ok = inRange(vY, vM, dd), on = y === vY && m === vM && d === dd;
        html += '<button type="button" class="cal-day' + (on ? ' on' : '') + (new Date(vY, vM - 1, dd).getDay() === 0 ? ' sun' : '') + '" data-day="' + dd + '"'
          + (ok ? '' : ' disabled') + (on ? ' aria-pressed="true"' : '') + ' aria-label="' + vM + '월 ' + dd + '일">' + dd + '</button>';
      }
      cal.innerHTML = html + '</div>';
    }
    function openCal() {
      closeAll('d');
      vY = y || minY; vM = m || (y && y > minY ? 1 : min.getMonth() + 1);
      if (!monthOk(vY, vM)) { vY = minY; vM = min.getMonth() + 1; }
      renderCal(); reveal(cal, bD);
      var t = cal.querySelector('.cal-day.on') || cal.querySelector('.cal-day:not([disabled])'); if (t) t.focus();
    }
    function closeCal(back) { shut(cal, bD); if (back) bD.focus(); }
    bD.addEventListener('click', function () { if (cal.hidden) openCal(); else closeCal(false); });
    cal.addEventListener('click', function (e) {
      var nav = e.target.closest('.cal-nav');
      if (nav) {
        var dir = nav.getAttribute('data-nav'); vM += Number(dir);
        if (vM > 12) { vM = 1; vY += 1; } else if (vM < 1) { vM = 12; vY -= 1; }
        renderCal();
        (cal.querySelector('[data-nav="' + dir + '"]:not([disabled])') || cal.querySelector('.cal-nav:not([disabled])')).focus();
        return;
      }
      var day = e.target.closest('.cal-day'); if (!day || day.disabled) return;
      y = vY; m = vM; d = +day.getAttribute('data-day'); setInvalid(false); paint(); emit(); closeCal(true);
    });
    cal.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); closeCal(true); return; }
      var cur = document.activeElement; if (!cur || !cur.classList.contains('cal-day')) return;
      var days = Array.prototype.slice.call(cal.querySelectorAll('.cal-day:not([disabled])')), i = days.indexOf(cur), step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
      if (step === undefined) return; e.preventDefault();
      var next = days[Math.max(0, Math.min(days.length - 1, i + step))]; if (next) next.focus();
    });
    // 달력 안에서 다시 그려지는 버튼은 클릭 뒤 문서에서 빠지므로, 클릭 경로로 안쪽 클릭인지 판단한다
    document.addEventListener('click', function (e) {
      if (cal.hidden && ylist.hidden && mlist.hidden) return;
      var path = e.composedPath ? e.composedPath() : [];
      if (!(path.length ? path.indexOf(fs) !== -1 : fs.contains(e.target))) closeAll();
    });

    paint();
    return {
      getValue: value,
      setInvalid: setInvalid,
      firstMissing: function () { return !y ? bY : !m ? bM : bD; },
      focus: function () { (!y ? bY : !m ? bM : bD).focus(); }
    };
  }
  window.DealartDatePicker = { mount: mount };
})();
