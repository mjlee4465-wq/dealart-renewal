function dealartOrderBoot() {
  'use strict';
  var KEY = 'dealart.cart';
  var METHODS = [
    { v: '퀵배송', date: '퀵 배송 희망일', lead: 1 },    // 가장 빠른 희망일: 내일
    { v: '전국택배', date: '발송 희망일', lead: 2 }   // 가장 빠른 희망일: 모레 (발송일 기준)
  ];
  var BRAND_PAGE = { '스즈란테이': 'brand-suzuran.html', '오복수산': 'brand-obok.html', '안주마을': 'brand-anju.html' };
  var DAYS = ['일', '월', '화', '수', '목', '금', '토'];
  var $ = function (id) { return document.getElementById(id); };
  var won = function (n) { return Number(n).toLocaleString('ko-KR') + '원'; };
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }

  /* ---------- 장바구니에서 선택한 상품 ---------- */
  var items = [];
  try {
    var raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (Array.isArray(raw) && window.DealartLot && DealartLot.ensure(raw)) localStorage.setItem(KEY, JSON.stringify(raw));
    items = (Array.isArray(raw) ? raw : []).filter(function (x) { return x && x.name && x.qty > 0 && x.price >= 0 && x.sel !== false; })
      .map(function (x) { return { brand: x.brand || '스즈란테이', name: x.name, qty: Number(x.qty), price: Number(x.price), image: x.image, lot: x.lot || '', no: x.no || '', ship: METHODS.some(function (m) { return m.v === x.ship; }) ? x.ship : METHODS[0].v }; });
  } catch (e) { items = []; }

  var info = {}; // 브랜드별 주문자·받는 분
  var pickers = []; // 배송 묶음별 날짜 선택기
  var sameLinks = []; // 받는 분 칸이 주문자 값을 따라가는(잠긴) 입력칸
  var dates = {}, memos = {}; // 브랜드|배송방법 별 희망일·요청사항
  var gk = function (b, s) { return b + '|' + s; };
  var sub = function (list) { return list.reduce(function (s, it) { return s + it.price * it.qty; }, 0); };

  /* ---------- 날짜 ---------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  var today = new Date(); today.setHours(0, 0, 0, 0);
  // 휴무일(예: 일요일)은 고를 수 없다. 실제 휴무 요일과 당일 마감 시각은 정책 확정 후 바꾼다.
  var offLabel = function (d) { return d.getDay() === 0 ? '휴무' : ''; };
  function minFor(m) { var d = new Date(today); d.setDate(d.getDate() + m.lead); return d; }
  function firstAvail(m) { var d = minFor(m); while (offLabel(d)) d.setDate(d.getDate() + 1); return d; }
  function validDate(v, m) { var x = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ''); if (!x) return false; var d = new Date(+x[1], +x[2] - 1, +x[3]); return d >= minFor(m) && d <= maxD && !offLabel(d); }
  var maxD = new Date(today); maxD.setDate(maxD.getDate() + 120);
  function pretty(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); if (!m) return ''; var d = new Date(+m[1], +m[2] - 1, +m[3]); return m[1] + '.' + m[2] + '.' + m[3] + '(' + DAYS[d.getDay()] + ')'; }

  /* ---------- 브랜드별 주문 영역 ---------- */
  // 같은 브랜드라도 담을 때마다(lot) 따로 묶는다. 묶음마다 배송비 1회, 희망일도 따로 고른다.
  function groupsByBrand() {
    var order = [], map = {}, total = {}, seen = {};
    items.forEach(function (it) {
      var k = it.brand + '|' + (it.lot || '');
      if (!map[k]) { map[k] = { brand: it.brand, key: k, no: it.no || '', items: [] }; order.push(map[k]); }
      map[k].items.push(it);
    });
    order.forEach(function (g) { total[g.brand] = (total[g.brand] || 0) + 1; });
    order.forEach(function (g) { seen[g.brand] = (seen[g.brand] || 0) + 1; g.n = seen[g.brand]; g.first = g.n === 1; g.label = g.brand + (g.no ? ' · ' + g.no : ''); });
    return order;
  }
  var SHIP_FEE = 10000; // 예시: 브랜드당 1회 (같은 브랜드의 상품이 여러 개여도, 배송 방법이 달라도 한 번만. 장바구니와 동일)
  function shipGroups(list) {
    var seen = {}, out = [];
    METHODS.forEach(function (m) { var l = list.filter(function (it) { return it.ship === m.v; }); if (l.length) out.push({ ship: m.v, items: l }); });
    return out;
  }

  function renderBrands() {
    var box = $('odBrands'); box.textContent = ''; sameLinks = []; pickers = [];
    groupsByBrand().forEach(function (g, bi) {
      var card = el('section', 'od-card od-brand'); card.setAttribute('aria-label', g.label + ' 주문');
      var head = el('div', 'od-bhead');
      var nm = el('a', 'od-bname', g.brand); if (g.no) nm.appendChild(el('small', 'od-bno', '주문번호 ' + g.no)); nm.href = BRAND_PAGE[g.brand] || 'brands.html'; head.appendChild(nm);
      head.appendChild(el('strong', 'od-bsum', won(sub(g.items))));
      card.appendChild(head);

      shipGroups(g.items).forEach(function (sg, si) {
        var key = gk(g.key, sg.ship), id = 'b' + bi + 's' + si;
        var blk = el('div', 'od-ship');
        // 배송 방법
        var fs = el('fieldset', 'od-methods'); var lg = el('legend', null, '배송 방법'); fs.appendChild(lg);
        METHODS.forEach(function (m) {
          var lab = el('label', 'od-chip'); var inp = el('input'); inp.type = 'radio'; inp.name = 'ship-' + id; inp.value = m.v; inp.checked = m.v === sg.ship;
          inp.addEventListener('change', function () { moveShip(g, sg, m.v, id); });
          lab.appendChild(inp); lab.appendChild(el('span', null, m.v)); fs.appendChild(lab);
        });
        blk.appendChild(fs);
        // 상품
        var ul = el('ul', 'od-lines');
        sg.items.forEach(function (it) {
          var li = el('li', 'od-line');
          var th = el('div', 'od-thumb'); var img = el('img'); img.src = (it.image && /^assets\//.test(it.image)) ? it.image : 'assets/imgImage6.png'; img.alt = ''; th.appendChild(img);
          li.appendChild(th);
          var tx = el('div', 'od-ltx'); tx.appendChild(el('p', 'od-lname', it.name)); tx.appendChild(el('p', 'od-lsub', won(it.price) + ' × ' + it.qty + '개')); li.appendChild(tx);
          li.appendChild(el('strong', 'od-lprice', won(it.price * it.qty)));
          ul.appendChild(li);
        });
        blk.appendChild(ul);
        if (si === 0) { var fee = el('div', 'od-fee'); fee.appendChild(el('span', null, '배송비 (주문번호당 1회)')); fee.appendChild(el('strong', null, won(SHIP_FEE))); blk.appendChild(fee); }
        // 희망일 — 주문조회 페이지와 같은 년·월 목록 + 일 달력
        var meth = METHODS.filter(function (m) { return m.v === sg.ship; })[0];
        var host = el('div', 'od-date'); blk.appendChild(host);
        var label = g.label + ' ' + meth.date;
        // 처음 열면 가능한 가장 빠른 날짜가 선택돼 있다
        if (!validDate(dates[key], meth)) dates[key] = iso(firstAvail(meth));
        var pk = window.DealartDatePicker.mount(host, { id: id, legend: meth.date, label: meth.date, min: minFor(meth), max: maxD, off: offLabel, value: dates[key], onChange: function (v) { dates[key] = v; var pe = host.querySelector('.od-ferr'); if (pe) { pe.remove(); updateBanner(); } } });
        pickers.push({ brand: g.brand, gkey: g.key, key: key, label: label, api: pk, host: host });
        // 요청사항
        var f2 = el('div', 'od-f'); var l2 = el('label', null, '요청사항 (선택)'); l2.setAttribute('for', id + 'm');
        var m2 = el('input'); m2.id = id + 'm'; m2.type = 'text'; m2.maxLength = 100; m2.placeholder = '예: 도착 시간, 문 앞에 놓아 주세요'; m2.value = memos[key] || '';
        m2.addEventListener('input', function () { memos[key] = m2.value; });
        f2.appendChild(l2); f2.appendChild(m2); blk.appendChild(f2);
        card.appendChild(blk);
      });
      if (g.first) card.appendChild(contactBlock(g.brand, bi)); // 주문자·받는 분은 브랜드당 한 번만 입력
      box.appendChild(card);
    });
    renderSum();
  }

  // 같은 브랜드 안에서 일부 상품만 다른 배송 방법을 쓰는 경우도 있어, 묶음 단위로 배송 방법을 바꾼다
  function moveShip(g, sg, to, id) {
    var fromKey = gk(g.key, sg.ship), toKey = gk(g.key, to);
    sg.items.forEach(function (it) { it.ship = to; });
    if (!dates[toKey] && dates[fromKey]) dates[toKey] = dates[fromKey];
    if (!memos[toKey] && memos[fromKey]) memos[toKey] = memos[fromKey];
    renderBrands();
    // 방금 선택한 칩으로 포커스 복귀 (재렌더로 위치가 바뀔 수 있어 묶음 안에서 찾는다)
    var cands = document.querySelectorAll('.od-brand[aria-label="' + g.label + ' 주문"] input[type=radio][value="' + to + '"]:checked');
    if (cands[0]) cands[0].focus();
  }

  function renderSum() {
    var list = $('odSumList'); list.textContent = '';
    var gs = groupsByBrand(), total = 0, cnt = 0;
    gs.forEach(function (g) {
      var s = sub(g.items); total += s; cnt += g.items.length;
      var li = el('li', 'ct-sum-row'); li.appendChild(el('span', null, g.label + ' (' + g.items.length + '개 상품)')); li.appendChild(el('strong', null, won(s))); list.appendChild(li);
    });
    var sf = el('li', 'ct-sum-row'); sf.appendChild(el('span', null, '배송비 합계')); sf.appendChild(el('strong', null, won(gs.length * SHIP_FEE))); list.appendChild(sf);
    $('odTotal').textContent = won(total); $('odFootTotal').textContent = won(total);
    $('odFootSub').textContent = '브랜드 ' + gs.length + '곳';
    $('odSubmitT').textContent = '결제하기';
  }

  /* ---------- 브랜드별 주문자·받는 분 ---------- */
  function fmtPhone(v) {
    var d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length < 4) return d; if (d.length < 8) return d.slice(0, 3) + '-' + d.slice(3);
    return d.length === 11 ? d.slice(0, 3) + '-' + d.slice(3, 7) + '-' + d.slice(7) : d.slice(0, 3) + '-' + d.slice(3, 6) + '-' + d.slice(6);
  }
  var phoneOk = function (v) { return /^01[016789]\d{7,8}$/.test(String(v || '').replace(/\D/g, '')); };
  function infoOf(brand) {
    if (!info[brand]) info[brand] = { oName: '', oPhone: '', same: true, rName: '', rPhone: '', rAddr: '', rAddr2: '', likeFirst: true };
    return info[brand];
  }
  function firstBrand() { var g = groupsByBrand(); return g.length ? g[0].brand : null; }
  // 두 번째 브랜드부터는 "첫 브랜드와 같아요"를 고르면 첫 브랜드 정보를 그대로 쓴다
  function effective(brand) { var f = firstBrand(); return brand !== f && infoOf(brand).likeFirst ? infoOf(f) : infoOf(brand); }

  function field(id, label, key, o, opts) {
    var f = el('div', 'od-f'); var l = el('label', null, label); l.setAttribute('for', id);
    var i = el('input'); i.id = id; i.type = opts.type || 'text'; if (opts.mode) i.setAttribute('inputmode', opts.mode);
    if (opts.auto) i.setAttribute('autocomplete', opts.auto); if (opts.ph) i.placeholder = opts.ph;
    i.value = opts.link ? o[opts.link] : o[key]; i.setAttribute('data-label', opts.err || label);
    if (opts.link) { i.disabled = true; sameLinks.push({ i: i, o: o, key: opts.link }); }  // '주문자와 같아요' 상태: 주문자 값을 보여주기만 한다
    else if (opts.mirror) { i.disabled = true; i.setAttribute('data-mirror', key); }   // 체크 상태에서는 첫 브랜드 정보를 보여주기만 한다
    else i.addEventListener('input', function () { if (opts.phone) i.value = fmtPhone(i.value); o[key] = i.value; if (o === infoOf(firstBrand())) refreshMirror(); refreshSame(); });
    f.appendChild(l); f.appendChild(i); return f;
  }
  function refreshSame() { sameLinks.forEach(function (l) { l.i.value = l.o[l.key] || ''; }); }
  function refreshMirror() {
    var src = infoOf(firstBrand());
    Array.prototype.forEach.call(document.querySelectorAll('input[data-mirror]'), function (i) { i.value = src[i.getAttribute('data-mirror')] || ''; });
  }
  function check(id, text, checked, onChange, disabled) {
    var lab = el('label', 'od-same'); var c = el('input'); c.type = 'checkbox'; c.id = id; c.checked = checked; if (disabled) { c.disabled = true; lab.classList.add('is-off'); }
    c.addEventListener('change', function () { onChange(c.checked); });
    lab.appendChild(c); lab.appendChild(el('span', 'ct-box')); lab.appendChild(el('span', null, text)); return lab;
  }
  function contactBlock(brand, bi) {
    var first = firstBrand(), wrap = el('div', 'od-contact'), pre = 'c' + bi;
    var isFirst = brand === first, own = infoOf(brand);
    var mirror = !isFirst && own.likeFirst;
    var o = mirror ? infoOf(first) : own;
    if (!isFirst) {
      wrap.appendChild(check(pre + 'like', first + '와(과) 같은 주문자·받는 분 정보로 보내기', own.likeFirst, function (v) { own.likeFirst = v; renderBrands(); var t = document.getElementById(pre + 'like'); if (t) t.focus(); }));
      if (mirror) wrap.appendChild(el('p', 'od-hint', '체크를 해제하면 이 브랜드의 주문자·받는 분을 따로 입력할 수 있어요.'));
    }
    var cls = mirror ? 'od-sub is-mirror' : 'od-sub', sub = el('div', cls);
    // 주문자
    sub.appendChild(el('h3', 'od-sh', '주문자'));
    sub.appendChild(field(pre + 'on', '이름', 'oName', o, { auto: 'name', err: brand + ' 주문자 이름', mirror: mirror }));
    sub.appendChild(field(pre + 'op', '휴대폰 번호', 'oPhone', o, { type: 'tel', mode: 'numeric', auto: 'tel', ph: '010-0000-0000', phone: true, err: brand + ' 주문자 휴대폰 번호', mirror: mirror }));
    // 받는 분
    sub.appendChild(el('h3', 'od-sh', '받는 분'));
    sub.appendChild(check(pre + 'same', '주문자와 같아요', o.same, function (v) { o.same = v; renderBrands(); var t = document.getElementById(pre + 'same'); if (t) t.focus(); }, mirror));
    var link = o.same;   // 체크되어 있으면 주문자 값을 보여주고 잠근다. 해제하면 직접 입력
    sub.appendChild(field(pre + 'rn', '받는 분 이름', 'rName', o, { auto: 'off', err: brand + ' 받는 분 이름', mirror: mirror, link: link ? 'oName' : null }));
    sub.appendChild(field(pre + 'rp', '받는 분 휴대폰 번호', 'rPhone', o, { type: 'tel', mode: 'numeric', ph: '010-0000-0000', phone: true, err: brand + ' 받는 분 휴대폰 번호', mirror: mirror, link: link ? 'oPhone' : null }));
    sub.appendChild(field(pre + 'ra', '배송지 주소', 'rAddr', o, { auto: 'street-address', ph: '도로명 주소', err: brand + ' 배송지 주소', mirror: mirror }));
    sub.appendChild(field(pre + 'ra2', '상세 주소', 'rAddr2', o, { auto: 'address-line2', ph: '동·호수, 층 등', err: brand + ' 상세 주소', mirror: mirror }));
    wrap.appendChild(sub);
    return wrap;
  }

  /* ---------- 검증 (모든 오류를 한 번에 표시) ---------- */
  var errMsgs = { oName: '이름을 입력해 주세요', oPhone: '휴대폰 번호를 정확히 입력해 주세요', rName: '받는 분 이름을 입력해 주세요', rPhone: '받는 분 휴대폰 번호를 정확히 입력해 주세요', rAddr: '배송지 주소를 입력해 주세요', date: '희망일을 선택해 주세요', agree: '개인정보 전달에 동의해 주세요' };
  function clearErrors() {
    Array.prototype.forEach.call(document.querySelectorAll('.od-ferr'), function (n) { n.remove(); });
    Array.prototype.forEach.call(document.querySelectorAll('[aria-invalid]'), function (n) { n.removeAttribute('aria-invalid'); });
    pickers.forEach(function (p) { p.api.setInvalid(false); });
    $('odErr').hidden = true;
  }
  function updateBanner() {
    var n = document.querySelectorAll('.od-ferr').length, e = $('odErr');
    if (!n) { e.hidden = true; return; }
    e.textContent = '입력하지 않은 항목이 ' + n + '개 있어요. 빨간 표시를 확인해 주세요.'; e.hidden = false;
  }
  function addErr(host, msg) { var p = el('p', 'od-ferr', msg); p.setAttribute('role', 'alert'); host.appendChild(p); return p; }
  function validate() {
    clearErrors();
    var bad = [], gs = groupsByBrand();
    function flag(input, key) { input.setAttribute('aria-invalid', 'true'); var f = input.closest('.od-f'); if (f) addErr(f, errMsgs[key]); bad.push(input); }
    gs.forEach(function (g, gi) {
      var o = infoOf(g.brand), pre = 'c' + gi, own = g.first && (gi === 0 || !o.likeFirst);
      if (own) {
        if (!o.oName.trim()) flag($(pre + 'on'), 'oName');
        if (!phoneOk(o.oPhone)) flag($(pre + 'op'), 'oPhone');
        if (!o.same) {
          if (!o.rName.trim()) flag($(pre + 'rn'), 'rName');
          if (!phoneOk(o.rPhone)) flag($(pre + 'rp'), 'rPhone');
        }
        if (!o.rAddr.trim()) flag($(pre + 'ra'), 'rAddr');
      }
      pickers.filter(function (p) { return p.gkey === g.key; }).forEach(function (p) {
        if (!p.api.getValue()) { p.api.setInvalid(true); addErr(p.host, errMsgs.date); bad.push(p.api.firstMissing()); }
      });
    });
    if (!$('oAgree').checked) {
      var ag = document.querySelector('.od-agree'), w = el('div', 'od-ferr-wrap'); ag.parentNode.insertBefore(w, ag.nextSibling); addErr(w, errMsgs.agree);
      $('oAgree').setAttribute('aria-invalid', 'true'); bad.push($('oAgree'));
    }
    if (bad.length) {
      updateBanner();
      var first = bad.slice().sort(function (x, y) { return x.getBoundingClientRect().top - y.getBoundingClientRect().top; })[0];
      try { first.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (x) {}
      first.focus({ preventScroll: true });
      return false;
    }
    return true;
  }
  // 다시 입력하기 시작하면 그 칸의 오류 표시만 사라진다
  document.addEventListener('input', function (e) {
    var f = e.target.closest && e.target.closest('.od-f'); if (!f) return;
    var p = f.querySelector('.od-ferr'); if (p) { p.remove(); e.target.removeAttribute('aria-invalid'); updateBanner(); }
  });
  $('oAgree').addEventListener('change', function () {
    if (!this.checked) return; this.removeAttribute('aria-invalid');
    var w = document.querySelector('.od-ferr-wrap'); if (w) w.remove(); updateBanner();
  });

  /* ---------- 결제 흐름: 결제 중 → 주문 완료 / 결제 실패 ---------- */
  var toastT;
  function toast(m) { var t = $('bdToast'); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(function () { t.hidden = true; }, 2200); }
  var TITLES = { form: '주문하기', loading: '결제 중', done: '주문 완료', fail: '결제 실패' };
  function view(name) {
    $('odForm').hidden = name !== 'form'; $('odLoading').hidden = name !== 'loading'; $('odDone').hidden = name !== 'done'; $('odFail').hidden = name !== 'fail';
    $('odFoot').hidden = name !== 'form' || !items.length;
    $('odTitle').textContent = TITLES[name];
    $('odBack').setAttribute('href', name === 'form' ? 'cart.html' : (name === 'done' ? 'index.html' : '#'));
    $('odBack').style.visibility = name === 'loading' ? 'hidden' : '';
    document.body.setAttribute('data-od-view', name);
    window.scrollTo(0, 0);
  }
  $('odBack').addEventListener('click', function (e) { if (!$('odFail').hidden) { e.preventDefault(); view('form'); } });

  var payTimer;
  function snapshot() {
    var gs = groupsByBrand(), total = 0, cnt = 0, firstDate = '', methods = {};
    var rows = gs.map(function (g) { var sm = sub(g.items); total += sm; cnt += g.items.length; return { brand: g.brand, n: g.items.length, sum: sm }; });
    items.forEach(function (it) { methods[it.ship] = 1; });
    pickers.forEach(function (p) { var v = dates[p.key]; if (v && (!firstDate || v < firstDate)) firstDate = v; });
    return { rows: rows, total: total, ship: rows.length * SHIP_FEE, firstDate: firstDate, method: Object.keys(methods).join('·') };
  }
  var forceFail = /[?&]pay=fail\b/.test(location.search); // 확인용: order.html?pay=fail 이면 결제 실패 화면을 보여 준다
  function pay() {
    view('loading');
    var snap = snapshot();
    clearTimeout(payTimer);
    payTimer = setTimeout(function () {
      if (forceFail) { forceFail = false; showFail(); } else complete(snap);
    }, 1500);
  }
  function readJSON(k) { try { var v = JSON.parse(localStorage.getItem(k) || '[]'); return Array.isArray(v) ? v : []; } catch (x) { return []; } }
  function complete(snap) {
    var o = effective(firstBrand()), now = new Date(), today = iso(now);
    var orders = readJSON('dealart.orders'), gs = groupsByBrand(), numbers = [];
    var phone = String(o.oPhone || '').replace(/\D/g, '');
    gs.forEach(function (g) {
      var firstD = '', ms = {};
      g.items.forEach(function (it) { ms[it.ship] = 1; });
      pickers.filter(function (p) { return p.gkey === g.key; }).forEach(function (p) { var v = dates[p.key]; if (v && (!firstD || v < firstD)) firstD = v; });
      var number = g.no || (window.DealartLot ? DealartLot.nextNo() : '');
      numbers.push(number);
      orders.push({ date: today, phone: phone, number: number, status: 0, deliveryDate: firstD, method: Object.keys(ms).join('·'), total: sub(g.items),
        items: g.items.map(function (it) { return { brand: it.brand, name: it.name, qty: it.qty, price: it.price, image: it.image }; }) });
    });
    try {
      localStorage.setItem('dealart.orders', JSON.stringify(orders));
      // 자주 산 상품
      var freq = readJSON('dealart.freq');
      items.forEach(function (it) {
        var f = freq.filter(function (x) { return x.name === it.name && x.brand === it.brand; })[0];
        if (f) { f.count = (f.count || 1) + 1; f.last = today; f.price = it.price; } else freq.push({ brand: it.brand, name: it.name, price: it.price, image: it.image, count: 1, last: today });
      });
      localStorage.setItem('dealart.freq', JSON.stringify(freq));
      // 주문한 상품은 장바구니에서 뺀다
      var cart = readJSON(KEY).filter(function (c) { return c.sel === false; });
      localStorage.setItem(KEY, JSON.stringify(cart));
    } catch (x) {}
    // 주문번호마다 카드를 따로 보여 준다
    var nbox = $('odNos'); nbox.textContent = '';
    gs.forEach(function (g, i) {
      var card = el('div', 'od-box od-nocard');
      var top = el('div', 'od-box-top'); top.appendChild(el('span', null, '주문번호' + (gs.length > 1 ? ' ' + (i + 1) : '')));
      var cp = el('button', 'od-link', '복사'); cp.type = 'button'; cp.setAttribute('aria-label', numbers[i] + ' 복사');
      cp.addEventListener('click', function () {
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(numbers[i]).then(function () { toast('주문번호를 복사했어요'); }, function () { toast('복사하지 못했어요'); }); else toast('복사하지 못했어요');
      });
      top.appendChild(cp); card.appendChild(top);
      card.appendChild(el('strong', 'od-no', numbers[i]));
      card.appendChild(el('span', 'od-box-sub', g.brand + ' · ' + g.items.length + '개 상품 · ' + won(sub(g.items))));
      card.appendChild(el('span', 'od-box-sub', '주문 날짜 ' + today.replace(/-/g, '.')));
      nbox.appendChild(card);
    });
    var box = $('odDoneRows'); box.textContent = '';
    snap.rows.forEach(function (r) { var row = el('div', 'od-drow'); row.appendChild(el('span', null, r.brand + ' (' + r.n + '개 상품)')); row.appendChild(el('strong', null, won(r.sum))); box.appendChild(row); });
    var fee = el('div', 'od-drow'); fee.appendChild(el('span', null, '배송비 합계')); fee.appendChild(el('strong', 'soft', won(snap.ship))); box.appendChild(fee);
    $('odDoneTotal').textContent = won(snap.total);
    view('done'); $('odDoneT').setAttribute('tabindex', '-1'); $('odDoneT').focus({ preventScroll: true });
  }
  function showFail() { view('fail'); $('odFailT').setAttribute('tabindex', '-1'); $('odFailT').focus({ preventScroll: true }); }

  $('odForm').addEventListener('submit', function (e) { e.preventDefault(); if (validate()) pay(); });
  $('odRetry').addEventListener('click', pay);

  /* ---------- 시작 ---------- */
  if (!items.length) { $('odEmpty').hidden = false; $('odBody').hidden = true; $('odFoot').hidden = true; }
  else { renderBrands(); $('odFoot').hidden = false; }
}

// 날짜 선택기 스크립트가 아직 없으면(예전 페이지가 캐시에 남아 있는 경우 등) 먼저 불러온 뒤 시작한다
(function () {
  if (window.DealartDatePicker) { dealartOrderBoot(); return; }
  var s = document.createElement('script'); s.src = 'date-picker.js'; s.onload = dealartOrderBoot; document.head.appendChild(s);
})();
