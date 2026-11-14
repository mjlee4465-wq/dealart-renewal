(function () {
  'use strict';
  var PRICE = 12900; // 예시 가격 (실제 가격은 주문 페이지 기준)
  var ITEMS = {
    1: { name: '일본식 도시락', chip: '대표' },
    2: { name: '상품명 (예시) 2', chip: '메뉴' }, 3: { name: '상품명 (예시) 3', chip: '메뉴' },
    4: { name: '상품명 (예시) 4', chip: '메뉴' }, 5: { name: '상품명 (예시) 5', chip: '메뉴' }
  };
  var $ = function (id) { return document.getElementById(id); };
  var m = /[?&]p=(\d)/.exec(location.search), it = ITEMS[m ? m[1] : 1] || ITEMS[1];
  document.title = it.name + ' | 스즈란테이 | DEALART 딜아트';
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
    if (navigator.share) { navigator.share({ title: it.name + ' | 스즈란테이', url: url }).catch(function () {}); }
    else if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function () { say('링크를 복사했어요'); }, function () { say('링크를 복사하지 못했어요'); });
    else say('링크를 복사하지 못했어요');
  });
  // 장바구니: 이 브라우저(localStorage)에만 저장된다
  $('pdOrder').addEventListener('click', function () {
    var ship = document.querySelector('input[name=ship]:checked');
    var line = { brand: '스즈란테이', name: it.name, qty: qty, price: PRICE, ship: ship ? ship.value : '' };
    try {
      var cart = JSON.parse(localStorage.getItem('dealart.cart') || '[]');
      if (!Array.isArray(cart)) cart = [];
      var same = cart.filter(function (c) { return c.name === line.name && c.ship === line.ship; })[0];
      if (same) same.qty = Math.min(99, same.qty + line.qty); else cart.push(line);
      localStorage.setItem('dealart.cart', JSON.stringify(cart));
      say('장바구니에 담았어요');
    } catch (e) { say('장바구니에 담지 못했어요'); }
  });
  render();
})();
