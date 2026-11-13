(function () {
  var form = document.getElementById('orderForm');
  if (!form) return;
  var selY = document.getElementById('orderYear');   // 값을 담는 숨은 입력
  var hidM = document.getElementById('orderMonth');
  var hidD = document.getElementById('orderDay');
  var btnY = document.getElementById('orderYearBtn');
  var btnM = document.getElementById('orderMonthBtn');
  var btnD = document.getElementById('orderDayBtn');
  var ylist = document.getElementById('orderYearList');
  var mlist = document.getElementById('orderMonthList');
  var cal = document.getElementById('orderCalendar');
  var field = cal.parentNode;
  var dateErr = document.getElementById('orderDateErr');
  var phone = document.getElementById('orderPhone');
  var phoneErr = document.getElementById('orderPhoneErr');
  var result = document.getElementById('orderResult');
  var resultDesc = document.getElementById('orderResultDesc');
  var today = new Date();
  var curY = today.getFullYear(), curM = today.getMonth() + 1, curD = today.getDate();
  var WEEK = ['일', '월', '화', '수', '목', '금', '토'];

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function daysIn(y, m) { return new Date(y, m, 0).getDate(); }
  function isFuture(y, m, d) { return new Date(y, m - 1, d) > new Date(curY, curM - 1, curD); }
  function year() { return Number(selY.value) || curY; }

  /* ---------- 팝업은 한 번에 하나만 열린다 ---------- */
  var openedBy = null;
  function closeAll(except) {
    if (except !== 'y') shut(ylist, btnY);
    if (except !== 'm') shut(mlist, btnM);
    if (except !== 'd') shut(cal, btnD);
  }
  function shut(pop, btn) { if (!pop.hidden) { pop.hidden = true; btn.setAttribute('aria-expanded', 'false'); } }
  function reveal(pop, btn) { pop.hidden = false; btn.setAttribute('aria-expanded', 'true'); openedBy = btn; }

  /* ---------- 년·월: 둥근 목록 (목록에는 값만 있고 '년'·'월' 항목은 없다) ---------- */
  function fillList(ul, values, labelOf, attr) {
    values.forEach(function (v) {
      var li = document.createElement('li');
      li.setAttribute('role', 'option'); li.setAttribute('tabindex', '-1');
      li.setAttribute(attr, String(v)); li.setAttribute('aria-selected', 'false');
      li.textContent = labelOf(v);
      ul.appendChild(li);
    });
  }
  var maxY = curY + 1, minY = curY - 2; // 내년까지 고를 수 있다
  var yearValues = []; for (var yy = maxY; yy >= minY; yy--) yearValues.push(yy);
  var monthValues = []; for (var mm = 1; mm <= 12; mm++) monthValues.push(mm);
  fillList(ylist, yearValues, function (v) { return String(v); }, 'data-year');
  fillList(mlist, monthValues, function (v) { return v + '월'; }, 'data-month');

  // 올해를 골랐다면 아직 오지 않은 달은 고를 수 없게 흐리게 표시한다
  function refreshMonthList() {
    Array.prototype.forEach.call(mlist.children, function (li) {
      li.setAttribute('aria-disabled', 'false');
    });
  }
  function markSelected(ul, attr, v) {
    Array.prototype.forEach.call(ul.children, function (li) { li.setAttribute('aria-selected', li.getAttribute(attr) === String(v) ? 'true' : 'false'); });
  }
  function openList(ul, btn, key, attr, selected) {
    closeAll(key);
    if (key === 'm') refreshMonthList();
    reveal(ul, btn);
    var cur = ul.querySelector('[' + attr + '="' + selected + '"]') || ul.querySelector('li:not([aria-disabled="true"])');
    if (cur) { cur.focus(); if (cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest' }); }
  }
  function closeList(ul, btn, returnFocus) { shut(ul, btn); if (returnFocus) btn.focus(); }


  function setYear(v) {
    selY.value = v ? String(v) : '';
    btnY.firstChild.textContent = v ? v + '년' : '년'; btnY.classList.toggle('is-empty', !v);
    markSelected(ylist, 'data-year', v || '');
  }
  function setMonth(v) {
    hidM.value = v ? String(v) : '';
    btnM.firstChild.textContent = v ? v + '월' : '월'; btnM.classList.toggle('is-empty', !v);
    markSelected(mlist, 'data-month', v || '');
  }
  function setDay(v) {
    hidD.value = v ? String(v) : '';
    btnD.firstChild.textContent = v ? v + '일' : '일'; btnD.classList.toggle('is-empty', !v);
  }
  // 년·월이 바뀌었을 때 고른 날이 없는 날짜이거나 미래가 되면 일만 비운다
  function revalidate() {
    var y = Number(selY.value), m = Number(hidM.value), d = Number(hidD.value);
    if (y && m && d && new Date(y, m - 1, d).getMonth() !== m - 1) setDay('');
    clearDate();
  }

  // 처음에는 모두 비운 상태로 시작한다 (뒤로 가기 등으로 숨은 값이 남아 있어도 버튼 표시와 어긋나지 않게)
  setYear(''); setMonth(''); setDay('');

  btnY.addEventListener('click', function () { if (ylist.hidden) openList(ylist, btnY, 'y', 'data-year', selY.value); else closeList(ylist, btnY, false); });
  btnM.addEventListener('click', function () { if (mlist.hidden) openList(mlist, btnM, 'm', 'data-month', hidM.value); else closeList(mlist, btnM, false); });
  ylist.addEventListener('click', function (e) {
    var li = e.target.closest('li'); if (!li) return;
    setYear(li.getAttribute('data-year')); revalidate(); closeList(ylist, btnY, true);
  });
  mlist.addEventListener('click', function (e) {
    var li = e.target.closest('li'); if (!li || li.getAttribute('aria-disabled') === 'true') return;
    if (!selY.value) setYear(curY); // 년도를 아직 안 골랐다면 올해로 맞춘다
    setMonth(li.getAttribute('data-month')); revalidate(); closeList(mlist, btnM, true);
  });
  function listKeys(ul, btn, attr, apply) {
    ul.addEventListener('keydown', function (e) {
      var items = Array.prototype.slice.call(ul.children).filter(function (li) { return li.getAttribute('aria-disabled') !== 'true'; });
      var i = items.indexOf(document.activeElement);
      if (e.key === 'Escape') { e.preventDefault(); closeList(ul, btn, true); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); items[Math.min(items.length - 1, i + 1)].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); items[Math.max(0, i - 1)].focus(); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (i >= 0) { apply(items[i].getAttribute(attr)); closeList(ul, btn, true); } }
      else if (e.key === 'Tab') { closeList(ul, btn, false); }
    });
  }
  listKeys(ylist, btnY, 'data-year', function (v) { setYear(v); revalidate(); });
  listKeys(mlist, btnM, 'data-month', function (v) { if (!selY.value) setYear(curY); setMonth(v); revalidate(); });

  /* ---------- 일: 달력 (년도·월은 위에서 따로 고르므로 달력에는 일만 고르는 칸이 있다) ---------- */
  var viewM = curM, viewY = curY;
  function renderCal() {
    var y = viewY, m = viewM, first = new Date(y, m - 1, 1).getDay(), total = daysIn(y, m);
    var selM = Number(hidM.value), selD = Number(hidD.value);
    var html = '<div class="cal-head">'
      + '<button type="button" class="cal-nav" data-nav="-1" aria-label="이전 달"' + (y <= minY && m <= 1 ? ' disabled' : '') + '>‹</button>'
      + '<strong class="cal-title" aria-live="polite">' + m + '월</strong>'
      + '<button type="button" class="cal-nav" data-nav="1" aria-label="다음 달"' + (y >= maxY && m >= 12 ? ' disabled' : '') + '>›</button>'
      + '</div><div class="cal-week" aria-hidden="true">' + WEEK.map(function (w, i) { return '<span' + (i === 0 ? ' class="sun"' : '') + '>' + w + '</span>'; }).join('') + '</div>'
      + '<div class="cal-grid" role="grid">';
    for (var i = 0; i < first; i++) html += '<span class="cal-pad"></span>';
    for (var d = 1; d <= total; d++) {
      var off = false, on = selM === m && selD === d;
      html += '<button type="button" class="cal-day' + (on ? ' on' : '') + (new Date(y, m - 1, d).getDay() === 0 ? ' sun' : '') + '" data-day="' + d + '"'
        + (off ? ' disabled' : '') + (on ? ' aria-pressed="true"' : '') + ' aria-label="' + m + '월 ' + d + '일">' + d + '</button>';
    }
    html += '</div>';
    cal.innerHTML = html;
  }
  function openCal() {
    closeAll('d');
    viewY = year();
    viewM = Number(hidM.value) || (viewY === curY ? curM : 12);
    renderCal(); reveal(cal, btnD);
    var target = cal.querySelector('.cal-day.on') || cal.querySelector('.cal-day:not([disabled])');
    if (target) target.focus();
  }
  function closeCal(returnFocus) { shut(cal, btnD); if (returnFocus) btnD.focus(); }
  btnD.addEventListener('click', function () { if (cal.hidden) openCal(); else closeCal(false); });

  cal.addEventListener('click', function (e) {
    var nav = e.target.closest('.cal-nav');
    if (nav) {
      var dir = nav.getAttribute('data-nav');
      viewM += Number(dir);
      if (viewM > 12) { viewM = 1; viewY += 1; }   // 12월 → 다음 해 1월
      else if (viewM < 1) { viewM = 12; viewY -= 1; } // 1월 → 이전 해 12월
      if (String(viewY) !== selY.value) { setYear(viewY); revalidate(); } // 달력에는 년도가 없으므로 위쪽 년 칸으로 바뀐 해를 보여준다
      renderCal();
      (cal.querySelector('[data-nav="' + dir + '"]:not([disabled])') || cal.querySelector('.cal-nav:not([disabled])')).focus();
      return;
    }
    var day = e.target.closest('.cal-day');
    if (!day || day.disabled) return;
    setYear(viewY);
    setMonth(viewM); setDay(day.getAttribute('data-day'));
    clearDate(); closeCal(true);
  });
  cal.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { e.preventDefault(); closeCal(true); return; }
    var cur = document.activeElement;
    if (!cur || !cur.classList.contains('cal-day')) return;
    var days = Array.prototype.slice.call(cal.querySelectorAll('.cal-day:not([disabled])'));
    var i = days.indexOf(cur), step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    if (step === undefined) return;
    e.preventDefault();
    var next = days[Math.max(0, Math.min(days.length - 1, i + step))];
    if (next) next.focus();
  });
  // 팝업 안에서 다시 그려지는 버튼(달 이동)은 클릭 뒤 문서에서 빠지므로, 클릭 시작 시점의 경로로 안쪽 클릭인지 판단한다.
  document.addEventListener('click', function (e) {
    if (cal.hidden && ylist.hidden && mlist.hidden) return;
    var path = e.composedPath ? e.composedPath() : [];
    var inside = path.length ? path.indexOf(field) !== -1 : field.contains(e.target);
    if (!inside) closeAll();
  });

  /* ---------- 휴대폰 번호 ---------- */
  function formatPhone(v) {
    var d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length < 4) return d;
    if (d.length < 8) return d.slice(0, 3) + '-' + d.slice(3);
    return d.slice(0, 3) + '-' + d.slice(3, 7) + '-' + d.slice(7);
  }
  phone.addEventListener('input', function () { phone.value = formatPhone(phone.value); clear(phone, phoneErr); });

  function show(el, msg, inputs) { el.textContent = msg; el.hidden = false; inputs.forEach(function (i) { i.setAttribute('aria-invalid', 'true'); }); }
  function clear(input, el) { el.hidden = true; el.textContent = ''; input.removeAttribute('aria-invalid'); }
  function clearDate() { dateErr.hidden = true; dateErr.textContent = ''; [btnY, btnM, btnD].forEach(function (s) { s.removeAttribute('aria-invalid'); }); }

  /* ---------- 조회 ---------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    result.hidden = true; closeAll();
    clearDate(); clear(phone, phoneErr);
    var bad = null;
    var y = Number(selY.value), m = Number(hidM.value), d = Number(hidD.value);
    if (!y || !m || !d) {
      var missing = [];
      if (!y) missing.push(btnY); if (!m) missing.push(btnM); if (!d) missing.push(btnD);
      show(dateErr, '주문 날짜를 선택해 주세요.', missing); bad = missing[0];
    } else if (new Date(y, m - 1, d).getMonth() !== m - 1) { show(dateErr, '존재하지 않는 날짜입니다.', [btnD]); bad = btnD; }
    var digits = phone.value.replace(/\D/g, '');
    if (!/^01\d{8,9}$/.test(digits)) { show(phoneErr, '휴대폰 번호를 정확히 입력해 주세요. (예: 010-1234-5678)', [phone]); bad = bad || phone; }
    if (bad) { bad.focus(); return; }
    // 입력한 내용은 저장하거나 전송하지 않는다.
    var cfg = window.DEALART_ORDERS || { ready: false, orders: [] };
    var tkey = y + '-' + pad(m) + '-' + pad(d);
    var test = (cfg.testCases || []).filter(function (t) { return t.date === tkey && String(t.phone).replace(/D/g, '') === digits; })[0];
    if (test) { // 테스트용 입력: 연결 여부와 상관없이 해당 결과 화면을 연다
      if (test.result === 'found') window.DealartOrderViews.showFound([test.order], { date: tkey, phone: digits }, true);
      else window.DealartOrderViews.showEmpty({ date: tkey, phone: digits }, true);
      return;
    }
    if (!cfg.ready) {
      // 주문 데이터가 아직 연결되지 않았다: "주문 없음"으로 잘못 알리지 않고 준비 중이라고 안내한다. (orders-config.js 의 ready 를 true 로 바꾸면 결과 화면이 열린다)
      resultDesc.textContent = y + '.' + pad(m) + '.' + pad(d) + ' 주문의 진행 상황은 카카오톡으로 문의해 주세요.';
      result.hidden = false;
      result.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      return;
    }
    var key = y + '-' + pad(m) + '-' + pad(d);
    var found = (cfg.orders || []).filter(function (o) { return o.date === key && String(o.phone || '').replace(/\D/g, '') === digits; });
    var input = { date: key, phone: digits };
    if (found.length) window.DealartOrderViews.showFound(found, input, false);
    else window.DealartOrderViews.showEmpty(input, false);
  });
})();
