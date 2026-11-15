(function () {
  var $ = function (id) { return document.getElementById(id); };
  var STEPS = ['예약 접수', '상품 준비', '배송 중', '배송 완료', '주문 취소'];
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
    intro.hidden = view === 'found';
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

  /* ---------- 조회된 주문: 주문내역 목록 (날짜 → 상품 카드) ---------- */
  var DAYS = ['일', '월', '화', '수', '목', '금', '토'];
  function arrival(s) { // '2026-01-05' → '1/5(월)'
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '')); if (!m) return '';
    var d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return (d.getMonth() + 1) + '/' + d.getDate() + '(' + DAYS[d.getDay()] + ')';
  }
  function won(n) { return Number(n).toLocaleString('ko-KR') + '원'; }

  function reorder(it) {
    try {
      var cart = JSON.parse(localStorage.getItem('dealart.cart') || '[]'); if (!Array.isArray(cart)) cart = [];
      var same = cart.filter(function (c) { return c.name === it.name && c.brand === it.brand; })[0];
      if (same) { same.qty = Math.min(99, same.qty + (it.qty || 1)); same.sel = true; }
      else if (it.price) cart.push({ brand: it.brand, name: it.name, qty: it.qty || 1, price: it.price, image: it.image, ship: '퀵배송' });
      localStorage.setItem('dealart.cart', JSON.stringify(cart));
    } catch (x) {}
  }

  function renderOrder(o) {
    var group = el('section', 'od');
    var status = Math.max(0, Math.min(4, Number(o.status) || 0));
    var head = el('div', 'od-date');
    head.appendChild(el('strong', null, dot(o.date)));
    if (o.number) head.appendChild(el('span', 'od-no', '주문번호 ' + o.number));
    group.appendChild(head);

    (o.items || []).forEach(function (it) {
      var card = el('article', 'oc');
      card.setAttribute('data-search', ((it.brand || '') + ' ' + (it.name || '')).toLowerCase());
      var line = el('div', 'oc-status');
      var when = arrival(o.deliveryDate);
      line.appendChild(el('strong', 'st st' + status, STEPS[status]));
      if (status === 4) line.appendChild(el('span', null, '결제 금액은 영업일 3~5일 안에 환불돼요'));
      else if (when) line.appendChild(el('span', null, when + (status === 3 ? ' 도착' : ' 도착 예정')));
      if (status < 4) card.setAttribute('data-step', String(status));
      if (it.brand) line.appendChild(el('span', 'chip', it.brand));
      card.appendChild(line);

      var row = el('div', 'oc-row');
      var thumb = el('div', 'oc-thumb');
      if (it.image && /^assets\//.test(it.image)) { var img = el('img'); img.src = it.image; img.alt = ''; thumb.appendChild(img); }
      row.appendChild(thumb);
      var info = el('div', 'oc-info');
      info.appendChild(el('p', 'oc-name', it.name));
      var sub = (it.price ? won(it.price) + ' · ' : '') + (it.qty || 1) + '개';
      info.appendChild(el('p', 'oc-sub', sub));
      row.appendChild(info);
      card.appendChild(row);

      var acts = el('div', 'oc-acts');
      var a1 = el('a', 'oc-btn', '배송·주문 문의'); a1.href = KAKAO; a1.target = '_blank'; a1.rel = 'noopener noreferrer';
      // 다시 주문하기: 같은 상품을 장바구니에 담고 장바구니로 이동
      var a2 = el('a', 'oc-btn', '다시 주문하기'); a2.href = 'cart.html';
      a2.addEventListener('click', function () { reorder(it); });
      acts.appendChild(a1); acts.appendChild(a2);
      card.appendChild(acts);
      group.appendChild(card);
    });
    return group;
  }

  function showFound(orders, input, preview) {
    var box = $('foundBody'); box.textContent = '';
    $('foundMeta').textContent = dot(input.date) + ' 주문 · ' + mask(input.phone);
    $('previewFound').hidden = !preview;
    $('foundSearch').value = ''; $('foundNoMatch').hidden = true;
    orders.forEach(function (o) { box.appendChild(renderOrder(o)); });
    setVisible('found');
    focusTitle('found');
  }

  // 주문한 상품 검색: 상품명·브랜드명에 들어 있는 글자로 카드를 걸러낸다
  $('foundSearch').addEventListener('input', function () {
    var q = this.value.trim().toLowerCase(), shown = 0;
    Array.prototype.forEach.call(document.querySelectorAll('#foundBody .oc'), function (card) {
      var ok = !q || card.getAttribute('data-search').indexOf(q) !== -1; card.hidden = !ok; if (ok) shown++;
    });
    Array.prototype.forEach.call(document.querySelectorAll('#foundBody .od'), function (g) { g.hidden = !g.querySelector('.oc:not([hidden])'); });
    $('foundNoMatch').hidden = shown !== 0;
  });

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
    var sample = { date: '2026-12-31', phone: '01090219021' };
    if (q[1] === 'found') {
      showFound([
        { date: '2026-11-15', number: 'DA-20261115-0042', status: 1, deliveryDate: '2026-11-17', method: '퀵배송', items: [{ brand: '스즈란테이', name: '치킨+안심까스', qty: 2, price: 19000, image: 'assets/suzuran-chicken-hire.jpg' }] },
        { date: '2026-11-15', number: 'DA-20261115-0043', status: 2, deliveryDate: '2026-11-17', method: '전국택배', items: [{ brand: '오복수산', name: '카이센동', qty: 1, price: 12900, image: 'assets/imgImage7.png' }] },
        { date: '2026-11-10', number: 'DA-20261110-0007', status: 3, deliveryDate: '2026-11-12', method: '퀵배송', items: [{ brand: '스즈란테이', name: '생선까스', qty: 1, price: 22000, image: 'assets/suzuran-fish-katsu.jpg' }] },
        { date: '2026-11-05', number: 'DA-20261105-0003', status: 4, deliveryDate: '', method: '전국택배', items: [{ brand: '안주마을', name: '대표 안주', qty: 1, price: 12900, image: 'assets/imgImage8.png' }] }
      ], { date: '2026-11-15', phone: '01012345678' }, true);
    } else { showEmpty(sample, true); }
    window.scrollTo(0, 0);
  }
})();
