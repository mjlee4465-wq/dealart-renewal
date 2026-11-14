function dealartOrderBoot() {
  'use strict';
  var KEY = 'dealart.cart';
  var METHODS = [
    { v: '지정일 배송', date: '도착 희망일' },
    { v: '퀵배송', date: '퀵 배송 희망일' },
    { v: '전국택배', date: '발송 희망일' }
  ];
  var BRAND_PAGE = { '스즈란테이': 'brand-suzuran.html', '오복수산': 'brand-obok.html' };
  var DAYS = ['일', '월', '화', '수', '목', '금', '토'];
  var $ = function (id) { return document.getElementById(id); };
  var won = function (n) { return Number(n).toLocaleString('ko-KR') + '원'; };
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }

  /* ---------- 장바구니에서 선택한 상품 ---------- */
  var items = [];
  try {
    var raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    items = (Array.isArray(raw) ? raw : []).filter(function (x) { return x && x.name && x.qty > 0 && x.price >= 0 && x.sel !== false; })
      .map(function (x) { return { brand: x.brand || '스즈란테이', name: x.name, qty: Number(x.qty), price: Number(x.price), image: x.image, ship: METHODS.some(function (m) { return m.v === x.ship; }) ? x.ship : METHODS[0].v }; });
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
  var minD = new Date(today); minD.setDate(minD.getDate() + 1);
  var maxD = new Date(today); maxD.setDate(maxD.getDate() + 120);
  function pretty(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); if (!m) return ''; var d = new Date(+m[1], +m[2] - 1, +m[3]); return m[1] + '.' + m[2] + '.' + m[3] + '(' + DAYS[d.getDay()] + ')'; }

  /* ---------- 브랜드별 주문 영역 ---------- */
  function groupsByBrand() {
    var order = [], map = {};
    items.forEach(function (it) { if (!map[it.brand]) { map[it.brand] = []; order.push(it.brand); } map[it.brand].push(it); });
    return order.map(function (b) { return { brand: b, items: map[b] }; });
  }
  function shipGroups(list) {
    var seen = {}, out = [];
    METHODS.forEach(function (m) { var l = list.filter(function (it) { return it.ship === m.v; }); if (l.length) out.push({ ship: m.v, items: l }); });
    return out;
  }

  function renderBrands() {
    var box = $('odBrands'); box.textContent = ''; sameLinks = []; pickers = [];
    groupsByBrand().forEach(function (g, bi) {
      var card = el('section', 'od-card od-brand'); card.setAttribute('aria-label', g.brand + ' 주문');
      var head = el('div', 'od-bhead');
      var nm = el('a', 'od-bname', g.brand); nm.href = BRAND_PAGE[g.brand] || 'brands.html'; head.appendChild(nm);
      head.appendChild(el('strong', 'od-bsum', won(sub(g.items))));
      card.appendChild(head);

      shipGroups(g.items).forEach(function (sg, si) {
        var key = gk(g.brand, sg.ship), id = 'b' + bi + 's' + si;
        var blk = el('div', 'od-ship');
        // 배송 방법
        var fs = el('fieldset', 'od-methods'); var lg = el('legend', null, '배송 방법'); fs.appendChild(lg);
        METHODS.forEach(function (m) {
          var lab = el('label', 'od-chip'); var inp = el('input'); inp.type = 'radio'; inp.name = 'ship-' + id; inp.value = m.v; inp.checked = m.v === sg.ship;
          inp.addEventListener('change', function () { moveShip(g.brand, sg, m.v, id); });
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
        // 희망일 — 주문조회 페이지와 같은 년·월 목록 + 일 달력
        var meth = METHODS.filter(function (m) { return m.v === sg.ship; })[0];
        var host = el('div', 'od-date'); blk.appendChild(host);
        var label = g.brand + ' ' + meth.date;
        var pk = window.DealartDatePicker.mount(host, { id: id, legend: meth.date, label: meth.date, min: minD, max: maxD, value: dates[key] || '', onChange: function (v) { dates[key] = v; } });
        pickers.push({ brand: g.brand, key: key, label: label, api: pk });
        // 요청사항
        var f2 = el('div', 'od-f'); var l2 = el('label', null, '요청사항 (선택)'); l2.setAttribute('for', id + 'm');
        var m2 = el('input'); m2.id = id + 'm'; m2.type = 'text'; m2.maxLength = 100; m2.placeholder = '예: 도착 시간, 문 앞에 놓아 주세요'; m2.value = memos[key] || '';
        m2.addEventListener('input', function () { memos[key] = m2.value; });
        f2.appendChild(l2); f2.appendChild(m2); blk.appendChild(f2);
        card.appendChild(blk);
      });
      card.appendChild(contactBlock(g.brand, bi));
      box.appendChild(card);
    });
    renderSum();
  }

  // 같은 브랜드 안에서 일부 상품만 다른 배송 방법을 쓰는 경우도 있어, 묶음 단위로 배송 방법을 바꾼다
  function moveShip(brand, sg, to, id) {
    var fromKey = gk(brand, sg.ship), toKey = gk(brand, to);
    sg.items.forEach(function (it) { it.ship = to; });
    if (!dates[toKey] && dates[fromKey]) dates[toKey] = dates[fromKey];
    if (!memos[toKey] && memos[fromKey]) memos[toKey] = memos[fromKey];
    renderBrands();
    // 방금 선택한 칩으로 포커스 복귀 (재렌더로 위치가 바뀔 수 있어 브랜드 안에서 찾는다)
    var cands = document.querySelectorAll('.od-brand[aria-label="' + brand + ' 주문"] input[type=radio][value="' + to + '"]:checked');
    if (cands[0]) cands[0].focus();
  }

  function renderSum() {
    var list = $('odSumList'); list.textContent = '';
    var gs = groupsByBrand(), total = 0;
    gs.forEach(function (g) {
      var s = sub(g.items); total += s;
      var li = el('li', 'ct-sum-row'); li.appendChild(el('span', null, g.brand + ' (' + g.items.length + '개 상품)')); li.appendChild(el('strong', null, won(s))); list.appendChild(li);
    });
    $('odTotal').textContent = won(total); $('odFootTotal').textContent = won(total);
    $('odFootSub').textContent = '브랜드 ' + gs.length + '곳';
    $('odSubmitT').textContent = won(total) + ' 주문서 만들기';
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

  /* ---------- 검증 ---------- */
  function showErr(input, msg) {
    var e = $('odErr'); e.textContent = msg; e.hidden = false;
    Array.prototype.forEach.call(document.querySelectorAll('[aria-invalid]'), function (n) { n.removeAttribute('aria-invalid'); });
    if (input) { input.setAttribute('aria-invalid', 'true'); input.focus(); try { input.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (x) {} }
    return false;
  }
  function validate() {
    var gs = groupsByBrand();
    for (var gi = 0; gi < gs.length; gi++) {
      var brand = gs[gi].brand, o = infoOf(brand), pre = 'c' + gi;
      var own = gi === 0 || !o.likeFirst;
      if (own) {
        if (!o.oName.trim()) return showErr($(pre + 'on'), brand + ' 주문자 이름을 입력해 주세요.');
        if (!phoneOk(o.oPhone)) return showErr($(pre + 'op'), brand + ' 주문자 휴대폰 번호를 확인해 주세요.');
        if (!o.same) {
          if (!o.rName.trim()) return showErr($(pre + 'rn'), brand + ' 받는 분 이름을 입력해 주세요.');
          if (!phoneOk(o.rPhone)) return showErr($(pre + 'rp'), brand + ' 받는 분 휴대폰 번호를 확인해 주세요.');
        }
        if (!o.rAddr.trim()) return showErr($(pre + 'ra'), brand + ' 배송지 주소를 입력해 주세요.');
      }
      var mine = pickers.filter(function (p) { return p.brand === brand; });
      for (var pi = 0; pi < mine.length; pi++) {
        if (!mine[pi].api.getValue()) {
          mine[pi].api.setInvalid(true);
          var t = mine[pi].api.firstMissing(); showErr(t, mine[pi].label + '을(를) 선택해 주세요.'); return false;
        }
      }
    }
    if (!$('oAgree').checked) return showErr($('oAgree'), '개인정보 전달에 동의해 주세요.');
    $('odErr').hidden = true; return true;
  }

  /* ---------- 주문서 ---------- */
  function buildText() {
    var lines = ['[딜아트 주문서]', ''], total = 0;
    groupsByBrand().forEach(function (g) {
      var o = effective(g.brand);
      var rn = o.same ? o.oName : o.rName, rp = o.same ? o.oPhone : o.rPhone;
      lines.push('■ ' + g.brand);
      lines.push('주문자: ' + o.oName.trim() + ' / ' + o.oPhone);
      lines.push('받는 분: ' + rn.trim() + ' / ' + rp);
      lines.push('배송지: ' + [o.rAddr.trim(), o.rAddr2.trim()].filter(Boolean).join(' '));
      shipGroups(g.items).forEach(function (sg) {
        var key = gk(g.brand, sg.ship), meth = METHODS.filter(function (m) { return m.v === sg.ship; })[0];
        lines.push('· ' + sg.ship + ' / ' + meth.date + ' ' + pretty(dates[key]));
        sg.items.forEach(function (it) { lines.push('  - ' + it.name + ' ×' + it.qty + ' (' + won(it.price * it.qty) + ')'); });
        if ((memos[key] || '').trim()) lines.push('  요청: ' + memos[key].trim());
      });
      var sm = sub(g.items); total += sm; lines.push('  소계 ' + won(sm), '');
    });
    lines.push('합계 ' + won(total) + ' (배송비 별도 확인)');
    return lines.join('\n');
  }

  var toastT;
  function toast(m) { var t = $('bdToast'); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(function () { t.hidden = true; }, 2200); }
  function view(done) {
    $('odForm').hidden = done; $('odDone').hidden = !done; $('odFoot').hidden = done || !items.length;
    $('odTitle').textContent = done ? '주문서' : '주문하기';
    $('odBack').setAttribute('href', done ? '#' : 'cart.html');
    window.scrollTo(0, 0);
  }
  $('odBack').addEventListener('click', function (e) { if (!$('odDone').hidden) { e.preventDefault(); view(false); } });

  $('odForm').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) return;
    var text = buildText();
    $('odText').textContent = text;
    try { localStorage.setItem('dealart.lastOrder', JSON.stringify({ at: new Date().toISOString(), text: text })); } catch (x) {}
    view(true); $('odDoneT').setAttribute('tabindex', '-1'); $('odDoneT').focus();
  });
  $('odEdit').addEventListener('click', function () { view(false); });
  $('odCopy').addEventListener('click', function () {
    var text = $('odText').textContent;
    function fallback() {
      var r = document.createRange(); r.selectNodeContents($('odText')); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      var ok = false; try { ok = document.execCommand('copy'); } catch (x) {}
      toast(ok ? '주문서를 복사했어요' : '복사하지 못했어요. 선택된 내용을 직접 복사해 주세요');
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { toast('주문서를 복사했어요'); }, fallback); else fallback();
  });

  /* ---------- 시작 ---------- */
  if (!items.length) { $('odEmpty').hidden = false; $('odBody').hidden = true; $('odFoot').hidden = true; }
  else { renderBrands(); $('odFoot').hidden = false; }
}

// 날짜 선택기 스크립트가 아직 없으면(예전 페이지가 캐시에 남아 있는 경우 등) 먼저 불러온 뒤 시작한다
(function () {
  if (window.DealartDatePicker) { dealartOrderBoot(); return; }
  var s = document.createElement('script'); s.src = 'date-picker.js'; s.onload = dealartOrderBoot; document.head.appendChild(s);
})();
