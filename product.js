(function () {
  'use strict';
  var PRICE = 12900; // 예시 가격 (실제 가격은 주문 페이지 기준)
  var BRANDS = {
    suzuran: { name: '스즈란테이', page: 'brand-suzuran.html', image: 'assets/imgImage6.png', items: ['일본식 도시락'] },
    obok: { name: '오복수산', page: 'brand-obok.html', image: 'assets/imgImage7.png', items: ['카이센동'] }
  };
  var qs = location.search, bm = /[?&]b=([a-z]+)/.exec(qs), B = BRANDS[bm ? bm[1] : 'suzuran'] || BRANDS.suzuran;
  var ITEMS = {};
  for (var n = 1; n <= 5; n++) ITEMS[n] = { name: B.items[n - 1] || '상품명 (예시) ' + n, chip: n === 1 ? '대표' : '메뉴' };
  var $ = function (id) { return document.getElementById(id); };
  var m = /[?&]p=(\d)/.exec(location.search), it = ITEMS[m ? m[1] : 1] || ITEMS[1];
  document.title = it.name + ' | ' + B.name + ' | DEALART 딜아트';
  $('pdImg').src = B.image; $('pdBack').href = B.page; $('pdKeep').href = B.page; $('pdBack').setAttribute('aria-label', B.name + '로 돌아가기');
  $('pdName').textContent = it.name; $('pdChip').textContent = it.chip; $('pdImg').alt = it.name;
  var won = function (n) { return n.toLocaleString('ko-KR') + '원'; };
  var qty = 1;
  function render() {
    $('pdQty').textContent = qty; $('pdMinus').disabled = qty <= 1; $('pdPlus').disabled = qty >= 99;
    $('pdUnit').textContent = won(PRICE); $('pdTotal').textContent = won(PRICE * qty);
  }
  $('pdMinus').addEventListener('click', function () { if (qty > 1) { qty--; render(); } });
  $('pdPlus').addEventListener('click', function () { if (qty < 99) { qty++; render(); } });
  function say(s) { var t = $('bdToast'); t.textContent = s; t.hidden = false; clearTimeout(say.k); say.k = setTimeout(function () { t.hidden = true; }, 2000); }
  $('pdShare').addEventListener('click', function () {
    var url = location.href;
    if (navigator.share) { navigator.share({ title: it.name + ' | ' + B.name, url: url }).catch(function () {}); }
    else if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function () { say('링크를 복사했어요'); }, function () { say('링크를 복사하지 못했어요'); });
    else say('링크를 복사하지 못했어요');
  });
  // 장바구니: 이 브라우저(localStorage)에만 저장된다
  $('pdOrder').addEventListener('click', function () {
    var ship = document.querySelector('input[name=ship]:checked');
    var line = { brand: B.name, name: it.name, qty: qty, price: PRICE, image: B.image, ship: ship ? ship.value : '' };
    try {
      var cart = JSON.parse(localStorage.getItem('dealart.cart') || '[]');
      if (!Array.isArray(cart)) cart = [];
      var same = cart.filter(function (c) { return c.name === line.name && c.ship === line.ship; })[0];
      if (same) same.qty = Math.min(99, same.qty + line.qty); else cart.push(line);
      localStorage.setItem('dealart.cart', JSON.stringify(cart));
      badge(); openModal();
    } catch (e) { say('장바구니에 담지 못했어요'); }
  });
  function badge() {
    var n = 0;
    try { JSON.parse(localStorage.getItem('dealart.cart') || '[]').forEach(function (c) { n += Number(c.qty) || 0; }); } catch (e) {}
    var b = $('pdBadge'); b.hidden = n === 0; b.textContent = n > 99 ? '99+' : String(n);
  }
  var lastFocus = null;
  function openModal() {
    lastFocus = document.activeElement; $('pdModal').hidden = false; document.body.style.overflow = 'hidden';
    $('pdGoCart').focus();
  }
  function closeModal() {
    $('pdModal').hidden = true; document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  $('pdModal').addEventListener('click', function (e) { if (e.target.hasAttribute('data-close')) closeModal(); });
  document.addEventListener('keydown', function (e) {
    if ($('pdModal').hidden) return;
    if (e.key === 'Escape') { closeModal(); return; }
    if (e.key === 'Tab') { // 팝업 안에서만 포커스 이동
      var f = [$('pdGoCart'), $('pdKeep')], i = f.indexOf(document.activeElement);
      e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });
  badge();
  render();
})();
