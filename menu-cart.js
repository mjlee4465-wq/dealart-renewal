/* 브랜드 페이지의 메뉴 카드에서 바로 장바구니에 넣고 빼기 (이 기기의 브라우저에만 저장) */
(function () {
  'use strict';
  var KEY = 'dealart.cart', PRICE = 12900; // 예시 가격 (실제 가격은 주문 페이지 기준)
  var SHIP = '지정일 배송';
  var brandEl = document.querySelector('.bd-name');
  if (!brandEl) return;
  var BRAND = brandEl.textContent.trim();

  function load() {
    try { var c = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(c) ? c : []; } catch (e) { return []; }
  }
  function save(c) { try { localStorage.setItem(KEY, JSON.stringify(c)); return true; } catch (e) { return false; } }
  function lines(c, name) { return c.filter(function (x) { return x && x.brand === BRAND && x.name === name; }); }
  function qtyOf(name) { return lines(load(), name).reduce(function (s, x) { return s + (Number(x.qty) || 0); }, 0); }

  var toastT;
  function toast(msg) {
    var t = document.getElementById('bdToast'); if (!t) return;
    t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(function () { t.hidden = true; }, 1800);
  }
  function badge() {
    var b = document.getElementById('pdBadge'); if (!b) return;
    var n = load().reduce(function (s, x) { return s + (Number(x && x.qty) || 0); }, 0);
    b.hidden = n === 0; b.textContent = n > 99 ? '99+' : String(n);
  }

  function change(name, image, delta) {
    var c = load(), ls = lines(c, name);
    if (delta > 0) {
      if (qtyOf(name) >= 99) return;
      if (ls.length) ls[0].qty = Math.min(99, (Number(ls[0].qty) || 0) + 1);
      else c.push({ brand: BRAND, name: name, qty: 1, price: PRICE, image: image, ship: SHIP });
    } else {
      var last = ls[ls.length - 1]; if (!last) return;
      last.qty = (Number(last.qty) || 0) - 1;
      if (last.qty <= 0) c.splice(c.indexOf(last), 1);
    }
    if (!save(c)) { toast('장바구니에 담지 못했어요'); return; }
    renderAll(); badge();
    var n = qtyOf(name);
    toast(delta > 0 ? '장바구니에 담았어요 (' + n + '개)' : (n ? '수량을 줄였어요 (' + n + '개)' : '장바구니에서 뺐어요'));
  }

  var cards = [];
  function build(card) {
    var name = card.querySelector('h3').textContent.trim();
    var wrap = card.querySelector('.bd-menu-img'), old = wrap.querySelector('.bd-add');
    var image = (wrap.querySelector('img').getAttribute('src') || '');
    var ctl = document.createElement('div'); ctl.className = 'mc';
    var minus = document.createElement('button'); minus.type = 'button'; minus.className = 'mc-b mc-minus'; minus.textContent = '−'; minus.setAttribute('aria-label', name + ' 장바구니에서 빼기');
    var out = document.createElement('output'); out.className = 'mc-n'; out.setAttribute('aria-live', 'polite');
    var plus = document.createElement('button'); plus.type = 'button'; plus.className = 'mc-b mc-plus'; plus.textContent = '+'; plus.setAttribute('aria-label', name + ' 장바구니에 담기');
    minus.addEventListener('click', function () { change(name, image, -1); });
    plus.addEventListener('click', function () { change(name, image, 1); });
    ctl.appendChild(minus); ctl.appendChild(out); ctl.appendChild(plus);
    wrap.replaceChild(ctl, old);
    // 상품명을 누르면 상품 상세로
    var detail = old.getAttribute('href'), h3 = card.querySelector('h3');
    if (detail) { var a = document.createElement('a'); a.className = 'mc-detail'; a.href = detail; a.textContent = name; h3.textContent = ''; h3.appendChild(a); }
    cards.push({ name: name, ctl: ctl, out: out, minus: minus, plus: plus });
  }
  function renderAll() {
    cards.forEach(function (k) {
      var n = qtyOf(k.name);
      k.ctl.classList.toggle('has', n > 0);
      k.out.textContent = n; k.minus.hidden = n === 0; k.out.hidden = n === 0;
      k.plus.disabled = n >= 99;
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll('.bd-menu'), build);
  renderAll(); badge();
  window.addEventListener('pageshow', function () { renderAll(); badge(); }); // 뒤로 오기 등으로 돌아왔을 때 최신 상태
})();
