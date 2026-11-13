(function () {
  var $ = function (id) { return document.getElementById(id); };
  var STEPS = ['예약 접수', '상품 준비', '배송 중', '배송 완료'];
  var KAKAO = 'https://open.kakao.com/o/gbaveXvi';

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
  function mask(phone) {
    var d = String(phone || '').replace(/\D/g, '');
    if (d.length < 10) return '';
    return d.slice(0, 3) + '-' + new Array(d.length - 6).join('*') + '-' + d.slice(-4);
  }
  function dot(s) { return String(s || '').replace(/-/g, '.'); }

  var sections = ['.order-lookup', '.order-steps', '.order-help']; // 결과 화면에는 자체 버튼이 있으므로 폼·진행 단계·하단 문의 영역은 숨긴다
  function setVisible(view) {
    sections.forEach(function (sel) { var n = document.querySelector(sel); if (n) n.hidden = view !== 'form'; });
    $('viewFound').hidden = view !== 'found';
    $('viewEmpty').hidden = view !== 'empty';
    var intro = document.querySelector('.cat-intro');
    var h1 = intro.querySelector('h1'), p = intro.querySelector('.cat-desc');
    if (view === 'form') { h1.textContent = '주문조회'; p.textContent = '주문 날짜와 연락처로 예약 주문 내역을 확인하세요.'; }
    else if (view === 'found') { h1.textContent = '주문조회 결과'; }
    else { h1.textContent = '주문조회 결과'; }
    document.body.setAttribute('data-order-view', view);
  }
  function focusTitle(view) {
    var t = view === 'found' ? $('foundTitle') : $('emptyTitle');
    var ae = document.activeElement; if (ae && ae !== document.body && ae.blur) ae.blur(); // 휴대폰 키보드를 먼저 닫는다
    t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true });
    window.scrollTo(0, 0);
    setTimeout(function () { window.scrollTo(0, 0); }, 300); // 키보드가 닫히며 화면 크기가 늦게 바뀌어도 맨 위에 둔다
  }

  /* ---------- 조회된 주문 ---------- */
  function renderOrder(o, preview) {
    var card = el('article', 'ov-card');
    var top = el('div', 'ov-top');
    var status = Math.max(0, Math.min(3, Number(o.status) || 0));
    top.appendChild(el('span', 'ov-badge', STEPS[status]));
    if (o.number) top.appendChild(el('span', 'ov-number', '주문번호 ' + o.number));
    card.appendChild(top);

    var ol = el('ol', 'stepper');
    ol.setAttribute('aria-label', '주문 진행 단계');
    STEPS.forEach(function (s, i) {
      var li = el('li', 'step' + (i < status ? ' done' : '') + (i === status ? ' now' : ''));
      if (i === status) li.setAttribute('aria-current', 'step');
      li.appendChild(el('span', 'step-dot', i < status ? '✓' : String(i + 1)));
      li.appendChild(el('span', 'step-label', s));
      ol.appendChild(li);
    });
    card.appendChild(ol);

    var dl = el('dl', 'ov-info');
    [['주문 날짜', dot(o.date)], ['배송 예정일', dot(o.deliveryDate)], ['배송 방법', o.method]].forEach(function (r) {
      if (!r[1]) return;
      var row = el('div', 'ov-row'); row.appendChild(el('dt', null, r[0])); row.appendChild(el('dd', null, r[1])); dl.appendChild(row);
    });
    card.appendChild(dl);

    if (o.items && o.items.length) {
      var list = el('ul', 'ov-items');
      o.items.forEach(function (it) {
        var li = el('li');
        var left = el('div', 'ov-item-main');
        if (it.brand) left.appendChild(el('span', 'chip', it.brand));
        left.appendChild(el('strong', null, it.name));
        li.appendChild(left);
        li.appendChild(el('span', 'ov-qty', '수량 ' + (it.qty || 1)));
        list.appendChild(li);
      });
      card.appendChild(list);
    }
    return card;
  }

  function showFound(orders, input, preview) {
    var box = $('foundBody'); box.textContent = '';
    $('foundMeta').textContent = dot(input.date) + ' 주문 · ' + mask(input.phone);
    $('previewFound').hidden = !preview;
    orders.forEach(function (o) { box.appendChild(renderOrder(o, preview)); });
    setVisible('found');
    document.querySelector('.cat-intro .cat-desc').textContent = '조회된 주문 ' + orders.length + '건';
    focusTitle('found');
  }

  /* ---------- 조회된 주문 없음 ---------- */
  function showEmpty(input, preview) {
    $('emptyMeta').textContent = dot(input.date) + ' · ' + mask(input.phone);
    $('previewEmpty').hidden = !preview;
    setVisible('empty');
    document.querySelector('.cat-intro .cat-desc').textContent = '입력하신 정보로 접수된 주문을 찾지 못했습니다.';
    focusTitle('empty');
  }

  function showForm() { setVisible('form'); var b = $('orderYearBtn'); if (b) b.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  document.querySelectorAll('[data-order-retry]').forEach(function (b) { b.addEventListener('click', showForm); });

  window.DealartOrderViews = { showFound: showFound, showEmpty: showEmpty, showForm: showForm };

  /* ---------- 미리보기: orders.html?preview=found | empty (예시 데이터. 실제 주문이 아니다) ---------- */
  var q = /[?&]preview=(found|empty)\b/.exec(location.search);
  if (q) {
    var sample = { date: '2026-12-20', phone: '01012345678' };
    if (q[1] === 'found') {
      showFound([{ date: '2026-12-20', number: 'DA-SAMPLE', status: 1, deliveryDate: '2026-12-25', method: '지정일 배송', items: [{ brand: '스즈란테이', name: '일식 도시락 (예시 상품)', qty: 2 }, { brand: '프룻대디', name: '제철 과일 선물세트 (예시 상품)', qty: 1 }] }], sample, true);
    } else { showEmpty(sample, true); }
    window.scrollTo(0, 0);
  }
})();
