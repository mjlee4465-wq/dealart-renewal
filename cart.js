(function () {
  'use strict';
  var KEY = 'dealart.cart';
  var BRAND_URL = { '스즈란테이': 'https://suzurantei.dealart.co.kr/', '오복수산': 'https://oboksusan.dealart.co.kr/', '안주마을': 'https://anjumaeul.dealart.co.kr/' };
  var BRAND_PAGE = { '스즈란테이': 'brand-suzuran.html', '오복수산': 'brand-obok.html', '안주마을': 'brand-anju.html' }; // 브랜드별 주문 페이지 (알려진 곳만)
  var $ = function (id) { return document.getElementById(id); };
  var won = function (n) { return Number(n).toLocaleString('ko-KR') + '원'; };
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  var X = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="m4 4 10 10m0-10L4 14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

  function load() {
    try {
      var c = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(c) ? c.filter(function (x) { return x && x.name && x.qty > 0 && x.price >= 0; }) : [];
    } catch (e) { return []; }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} }
  var cart = load(), tab = 0;
  var isSel = function (it) { return it.sel !== false; }; // 담긴 상품은 기본으로 선택됨
  var brandOf = function (it) { return it.brand || '스즈란테이'; };

  /* 브랜드별로 묶는다 (담은 순서 유지) */
  function groups() {
    var order = [], map = {};
    cart.forEach(function (it) {
      var b = brandOf(it);
      if (!map[b]) { map[b] = []; order.push(b); }
      map[b].push(it);
    });
    return order.map(function (b) { return { brand: b, items: map[b] }; });
  }
  function sub(items) { return items.reduce(function (s, it) { return isSel(it) ? s + it.price * it.qty : s; }, 0); }

  function renderItem(it) {
    var on = isSel(it);
    var li = el('li', 'ct-item');
    var top = el('div', 'ct-top2');
    var lab = el('label', 'ct-check');
    var cb = el('input'); cb.type = 'checkbox'; cb.checked = on; cb.setAttribute('aria-label', it.name + ' 선택');
    cb.addEventListener('change', function () { it.sel = cb.checked; save(); render(); });
    lab.appendChild(cb); lab.appendChild(el('span', 'ct-box'));
    top.appendChild(lab);
    var th = el('div', 'ct-thumb'); var img = el('img');
    img.src = (it.image && /^assets\//.test(it.image)) ? it.image : 'assets/imgImage6.png'; img.alt = ''; th.appendChild(img);
    top.appendChild(th);
    var info = el('div', 'ct-info');
    info.appendChild(el('p', 'ct-name', it.name));
    info.appendChild(el('p', 'ct-opt', '옵션: ' + (it.ship || '지정일 배송')));
    info.appendChild(el('p', 'ct-opt', '예약 주문 · 날짜 지정'));
    top.appendChild(info);
    var del = el('button', 'ct-del'); del.type = 'button'; del.setAttribute('aria-label', it.name + ' 삭제'); del.innerHTML = X;
    del.addEventListener('click', function () { cart.splice(cart.indexOf(it), 1); save(); render(); });
    top.appendChild(del);
    li.appendChild(top);

    var line = el('div', 'ct-line');
    var st = el('div', 'pd-stepper ct-stepper'); st.setAttribute('role', 'group'); st.setAttribute('aria-label', it.name + ' 수량');
    var minus = el('button', null, '−'); minus.type = 'button'; minus.setAttribute('aria-label', '수량 줄이기'); minus.disabled = it.qty <= 1;
    var plus = el('button', null, '+'); plus.type = 'button'; plus.setAttribute('aria-label', '수량 늘리기'); plus.disabled = it.qty >= 99;
    minus.addEventListener('click', function () { if (it.qty > 1) { it.qty--; save(); render(); } });
    plus.addEventListener('click', function () { if (it.qty < 99) { it.qty++; save(); render(); } });
    st.appendChild(minus); st.appendChild(el('output', null, String(it.qty))); st.appendChild(plus);
    line.appendChild(st);
    var pr = el('div', 'ct-pr');
    pr.appendChild(el('strong', 'ct-price', won(it.price * it.qty)));
    pr.appendChild(el('span', 'ct-unit', '개당 ' + won(it.price)));
    line.appendChild(pr);
    li.appendChild(line);
    return li;
  }

  function render() {
    var box = $('ctGroups'); box.textContent = '';
    var empty = cart.length === 0, total = 0, n = 0, brands = [];
    groups().forEach(function (g) {
      var selN = g.items.filter(isSel).length, s = sub(g.items);
      total += s; n += selN; if (selN) brands.push({ brand: g.brand, sum: s, n: selN });

      var sec = el('section', 'ct-group'); sec.setAttribute('aria-label', g.brand + ' 상품');
      var head = el('div', 'ct-ghead');
      var lab = el('label', 'ct-check');
      var cb = el('input'); cb.type = 'checkbox'; cb.checked = selN === g.items.length; cb.indeterminate = selN > 0 && selN < g.items.length;
      cb.setAttribute('aria-label', g.brand + ' 전체 선택');
      cb.addEventListener('change', function () { g.items.forEach(function (it) { it.sel = cb.checked; }); save(); render(); });
      lab.appendChild(cb); lab.appendChild(el('span', 'ct-box'));
      head.appendChild(lab);
      var name = el('a', 'ct-gname', g.brand); name.href = BRAND_PAGE[g.brand] || 'brands.html';
      head.appendChild(name);
      head.appendChild(el('span', 'ct-gcount', g.items.length + '개 상품'));
      sec.appendChild(head);
      var ul = el('ul', 'ct-list');
      g.items.forEach(function (it) { ul.appendChild(renderItem(it)); });
      sec.appendChild(ul);
      var gf = el('div', 'ct-gfoot');
      gf.appendChild(el('span', null, g.brand + ' 선택 상품 금액'));
      gf.appendChild(el('strong', null, won(s)));
      sec.appendChild(gf);
      box.appendChild(sec);
    });

    $('ctAll').checked = cart.length > 0 && cart.every(isSel);
    $('ctCount').textContent = cart.length;
    $('ctBar').hidden = empty; $('ctEmpty').hidden = !empty; $('ctNote').hidden = empty;
    $('ctFoot').hidden = empty || tab !== 0;
    $('ctSumCard').hidden = empty;

    var list = $('ctSumList'); list.textContent = '';
    if (!brands.length) { var none = el('li', 'ct-sum-row'); none.appendChild(el('span', null, '선택한 상품이 없어요')); list.appendChild(none); }
    brands.forEach(function (b) {
      var li = el('li', 'ct-sum-row'); li.appendChild(el('span', null, b.brand + ' (' + b.n + '개)')); li.appendChild(el('strong', null, won(b.sum))); list.appendChild(li);
    });
    $('ctSumTotal').textContent = won(total); $('ctTotal').textContent = won(total);
    $('ctBrandN').textContent = '브랜드 ' + brands.length + '곳';
    $('ctBuyT').textContent = '총 ' + n + '개 상품 주문하기';
    var buy = $('ctBuy'); buy.classList.toggle('is-off', n === 0); buy.setAttribute('aria-disabled', n === 0 ? 'true' : 'false');
    render.brands = brands; render.total = total;
  }

  $('ctAll').addEventListener('change', function () { var v = this.checked; cart.forEach(function (it) { it.sel = v; }); save(); render(); });
  function toast(s) { var t = $('bdToast'); t.textContent = s; t.hidden = false; clearTimeout(t._k); t._k = setTimeout(function () { t.hidden = true; }, 2000); }
  $('ctSelDel').addEventListener('click', function () {
    var n = cart.filter(isSel).length;
    if (!n) { toast('삭제할 상품을 선택해 주세요'); return; }
    cart = cart.filter(function (it) { return !isSel(it); }); save(); render(); toast(n + '개 상품을 삭제했어요');
  });

  /* 주문하기: 선택한 상품만 주문서(order.html)로 */
  $('ctBuy').addEventListener('click', function (e) { if (this.classList.contains('is-off')) { e.preventDefault(); toast('주문할 상품을 선택해 주세요'); } });

  $('ctBack').addEventListener('click', function (e) {
    if (document.referrer && document.referrer.indexOf(location.host) !== -1 && history.length > 1) { e.preventDefault(); history.back(); }
  });

  /* 탭: 주문 / 자주산상품 / 찜한상품 */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('#ctTabs [role=tab]'));
  var FAVS = [
    { key: 'dealart.fav.suzuran', name: '스즈란테이', kind: '일식·도시락 · 예약 주문', page: 'brand-suzuran.html', image: 'assets/imgImage6.png' },
    { key: 'dealart.fav.obok', name: '오복수산', kind: '일식·해산물 · 예약 주문', page: 'brand-obok.html', image: 'assets/imgImage7.png' },
    { key: 'dealart.fav.anju', name: '안주마을', kind: '한식·안주 · 예약 주문', page: 'brand-anju.html', image: 'assets/imgImage8.png' }
  ];
  function liked() { return FAVS.filter(function (f) { try { return localStorage.getItem(f.key) === '1'; } catch (e) { return false; } }); }
  function renderFav() {
    var on = liked(), list = $('ctFavList'); list.textContent = '';
    $('ctFavCount').textContent = on.length; $('ctFavEmpty').hidden = on.length > 0;
    on.forEach(function (f) {
      var li = el('li', 'ct-item'), a = el('a', 'ct-fav'); a.href = f.page;
      var th = el('div', 'ct-thumb'); var img = el('img'); img.src = f.image; img.alt = ''; th.appendChild(img); a.appendChild(th);
      var info = el('div', 'ct-right');
      info.appendChild(el('p', 'ct-ship', f.name));
      info.appendChild(el('p', 'ct-kind', f.kind));
      a.appendChild(info); li.appendChild(a); list.appendChild(li);
    });
  }
  function select(i, focus) {
    tab = i;
    tabs.forEach(function (b, k) {
      var on = k === i; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1;
      $('ctPane' + k).hidden = !on;
    });
    if (focus) tabs[i].focus();
    renderFav(); render();
  }
  tabs.forEach(function (b, i) {
    b.addEventListener('click', function () { select(i); });
    b.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { e.preventDefault(); select((i + d + tabs.length) % tabs.length, true); }
    });
  });
  select(0);
})();
