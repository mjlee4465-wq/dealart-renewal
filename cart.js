(function () {
  'use strict';
  var KEY = 'dealart.cart';
  var $ = function (id) { return document.getElementById(id); };
  var won = function (n) { return Number(n).toLocaleString('ko-KR') + '원'; };
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }

  function load() {
    try {
      var c = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(c) ? c.filter(function (x) { return x && x.name && x.qty > 0 && x.price >= 0; }) : [];
    } catch (e) { return []; }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} }
  var cart = load(), tab = 0;
  var isSel = function (it) { return it.sel !== false; }; // 담긴 상품은 기본으로 선택됨

  function render() {
    var list = $('ctList'); list.textContent = '';
    var empty = cart.length === 0, total = 0, n = 0;
    cart.forEach(function (it, i) {
      var on = isSel(it);
      if (on) { total += it.price * it.qty; n++; }
      var li = el('li', 'ct-item');
      var top = el('div', 'ct-top2');
      var lab = el('label', 'ct-check');
      var cb = el('input'); cb.type = 'checkbox'; cb.checked = on; cb.setAttribute('aria-label', it.name + ' 선택');
      cb.addEventListener('change', function () { it.sel = cb.checked; save(); render(); });
      lab.appendChild(cb); lab.appendChild(el('span', 'ct-box'));
      top.appendChild(lab);
      var th = el('div', 'ct-thumb'); var img = el('img'); img.src = 'assets/imgImage6.png'; img.alt = ''; th.appendChild(img);
      top.appendChild(th);
      var info = el('div', 'ct-info');
      info.appendChild(el('p', 'ct-name', (it.brand || '스즈란테이') + ' ' + it.name));
      info.appendChild(el('p', 'ct-opt', '옵션: ' + (it.ship || '지정일 배송')));
      info.appendChild(el('p', 'ct-opt', '예약 주문 · 날짜 지정'));
      top.appendChild(info);
      var del = el('button', 'ct-del'); del.type = 'button'; del.setAttribute('aria-label', it.name + ' 삭제');
      del.innerHTML = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="m4 4 10 10m0-10L4 14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
      del.addEventListener('click', function () { cart.splice(i, 1); save(); render(); });
      top.appendChild(del);
      li.appendChild(top);

      var foot = el('div', 'ct-line');
      var st = el('div', 'pd-stepper ct-stepper'); st.setAttribute('role', 'group'); st.setAttribute('aria-label', it.name + ' 수량');
      var minus = el('button', null, '−'); minus.type = 'button'; minus.setAttribute('aria-label', '수량 줄이기'); minus.disabled = it.qty <= 1;
      var plus = el('button', null, '+'); plus.type = 'button'; plus.setAttribute('aria-label', '수량 늘리기'); plus.disabled = it.qty >= 99;
      minus.addEventListener('click', function () { if (it.qty > 1) { it.qty--; save(); render(); } });
      plus.addEventListener('click', function () { if (it.qty < 99) { it.qty++; save(); render(); } });
      st.appendChild(minus); st.appendChild(el('output', null, String(it.qty))); st.appendChild(plus);
      foot.appendChild(st);
      var pr = el('div', 'ct-pr');
      pr.appendChild(el('strong', 'ct-price', won(it.price * it.qty)));
      pr.appendChild(el('span', 'ct-unit', '개당 ' + won(it.price)));
      foot.appendChild(pr);
      li.appendChild(foot);
      list.appendChild(li);
    });

    var allOn = cart.length > 0 && cart.every(isSel);
    $('ctAll').checked = allOn;
    $('ctCount').textContent = cart.length;
    $('ctBar').hidden = empty; $('ctEmpty').hidden = !empty; $('ctNote').hidden = empty; $('ctFoot').hidden = empty || tab !== 0;
    $('ctTotal').textContent = won(total); $('ctBuyT').textContent = '총 ' + n + '개 상품 주문하기';
    var buy = $('ctBuy'); buy.classList.toggle('is-off', n === 0); buy.setAttribute('aria-disabled', n === 0 ? 'true' : 'false');
    document.body.classList.toggle('ct-has', !empty);
  }

  $('ctAll').addEventListener('change', function () { var v = this.checked; cart.forEach(function (it) { it.sel = v; }); save(); render(); });
  $('ctSelDel').addEventListener('click', function () {
    var n = cart.filter(isSel).length;
    var t = $('bdToast');
    if (!n) { t.textContent = '삭제할 상품을 선택해 주세요'; }
    else { cart = cart.filter(function (it) { return !isSel(it); }); save(); render(); t.textContent = n + '개 상품을 삭제했어요'; }
    t.hidden = false; clearTimeout(t._k); t._k = setTimeout(function () { t.hidden = true; }, 2000);
  });
  $('ctBuy').addEventListener('click', function (e) { if (this.classList.contains('is-off')) e.preventDefault(); });

  $('ctBack').addEventListener('click', function (e) {
    if (document.referrer && document.referrer.indexOf(location.host) !== -1 && history.length > 1) { e.preventDefault(); history.back(); }
  });
  /* 탭: 주문 / 자주산상품 / 찜한상품 */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('#ctTabs [role=tab]'));
  function favOn() { try { return localStorage.getItem('dealart.fav.suzuran') === '1'; } catch (e) { return false; } }
  function renderFav() {
    var on = favOn(), list = $('ctFavList'); list.textContent = '';
    $('ctFavCount').textContent = on ? 1 : 0; $('ctFavEmpty').hidden = on;
    if (!on) return;
    var li = el('li', 'ct-item'), a = el('a', 'ct-fav'); a.href = 'brand-suzuran.html';
    var th = el('div', 'ct-thumb'); var img = el('img'); img.src = 'assets/imgImage6.png'; img.alt = ''; th.appendChild(img); a.appendChild(th);
    var info = el('div', 'ct-right');
    info.appendChild(el('p', 'ct-ship', '스즈란테이'));
    info.appendChild(el('p', 'ct-kind', '일식·도시락 · 예약 주문'));
    a.appendChild(info); li.appendChild(a); list.appendChild(li);
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
