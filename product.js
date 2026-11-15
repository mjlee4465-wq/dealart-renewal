(function () {
  'use strict';
  var PRICE = 12900; // 예시 가격 (실제 가격은 주문 페이지 기준)
  var BRANDS = {
    suzuran: { name: '스즈란테이', page: 'brand-suzuran.html', image: 'assets/imgImage6.png', items: ['치킨+안심까스', '생선까스', '히레까스(안심)', '새우(노바시)+생선까스', '점보새우까스', '기본(점보새우,전복)+선택', '우나기(장어)덮밥'], descs: ['엄선된 육질과 일본 정통 조리법이 만난 최상의 밸런스', '팡코(일본식 빵가루)로 입힌 황금빛 튀김옷, 그 안에 저온숙성된 생선의 부드럽고 촉촉한 육질', '엄선된 육질로 빠르게 튀겨낸 튀김옷은 시각적 즐거움과 고소함 풍미를 극대화', '바다의 풍미를 품은 격조 높은 미식의 경험, 새우와 생선 속살의 탱글한 탄력과 단맛', '바다의 풍미를 품은 압도적인 스케일, 새우 속살의 탱글한 탄력과 바다의 신선함', '안심/생선/새우/치킨중 기회에 맞춰 더해지는 오더 메이드 방식의 특별함, 나만을 위한 미식 오마카세', '통째로 올린 장어 1미, 단순한 보양식을 넘어 정통 일식 우나쥬(장어덮밥)의 정수를 경험하게 하는 특별한 선물'], images: ['assets/suzuran-chicken-hire.jpg', 'assets/suzuran-fish-katsu.jpg', 'assets/suzuran-hire-katsu.jpg', 'assets/suzuran-shrimp-fish.jpg', 'assets/suzuran-jumbo-shrimp.jpg', 'assets/suzuran-select-abalone.jpg', 'assets/suzuran-unagi.jpg'], prices: [19000, 22000, 21000, 25000, 28000, 30000, 42000] },
    obok: { name: '오복수산', page: 'brand-obok.html', image: 'assets/imgImage7.png', items: ['카이센동'] },
    anju: { name: '안주마을', page: 'brand-anju.html', image: 'assets/imgImage8.png', items: ['대표 안주'] }
  };
  var qs = location.search, bm = /[?&]b=([a-z]+)/.exec(qs), B = BRANDS[bm ? bm[1] : 'suzuran'] || BRANDS.suzuran;
  var ITEMS = {};
  for (var n = 1; n <= 7; n++) ITEMS[n] = { name: B.items[n - 1] || '상품명 (예시) ' + n, chip: n === 1 ? '대표' : '메뉴', desc: (B.descs || [])[n - 1], price: (B.prices || [])[n - 1] || PRICE, image: (B.images || [])[n - 1] || B.image };
  var ADDONS = { 'suzuran:6': [
    { name: '안심(히레)', price: 4000, image: 'assets/suzuran-add-hire.jpg' },
    { name: '생선', price: 5000, image: 'assets/suzuran-add-fish.jpg' },
    { name: '새우(노바시)', price: 5000, image: 'assets/suzuran-add-shrimp.jpg' },
    { name: '치킨', price: 3000, image: 'assets/suzuran-add-hire.jpg' },
    { name: '가지요리(아게나스)', price: 2000 },
    { name: '두부튀김(아게다시도후)', price: 3000 }
  ] };
  var $ = function (id) { return document.getElementById(id); };
  var m = /[?&]p=(\d)/.exec(location.search), it = ITEMS[m ? m[1] : 1] || ITEMS[1];
  document.title = it.name + ' | ' + B.name + ' | DEALART 딜아트';
  $('pdImg').src = it.image; $('pdBack').href = B.page; $('pdKeep').href = B.page; $('pdBack').setAttribute('aria-label', B.name + '로 돌아가기');
  $('pdName').textContent = it.name; $('pdChip').textContent = it.chip; if (it.desc) $('pdDesc').textContent = it.desc; $('pdImg').alt = it.name;
  var won = function (n) { return n.toLocaleString('ko-KR') + '원'; };
  var qty = 1;
  var addons = ADDONS[(bm ? bm[1] : 'suzuran') + ':' + (m ? m[1] : 1)] || [], picked = [];
  function unit() { return it.price + picked.reduce(function (s, a) { return s + a.price; }, 0); }
  if (addons.length) {
    var box = $('pdAddons'); box.hidden = false;
    addons.forEach(function (a) {
      var lab = document.createElement('label'); lab.className = 'pd-opt pd-add';
      var cb = document.createElement('input'); cb.type = 'checkbox'; cb.value = a.name;
      var th = null;
      if (a.image) { th = document.createElement('span'); th.className = 'pd-add-th'; var im = document.createElement('img'); im.src = a.image; im.alt = ''; th.appendChild(im); }
      var t = document.createElement('span'); t.className = 'pd-opt-t'; t.textContent = a.name;
      var pr = document.createElement('span'); pr.className = 'pd-opt-p'; pr.textContent = '+' + won(a.price);
      cb.addEventListener('change', function () { picked = addons.filter(function (x, i) { return box.querySelectorAll('input')[i].checked; }); render(); });
      lab.appendChild(cb); if (th) lab.appendChild(th); lab.appendChild(t); lab.appendChild(pr); box.appendChild(lab);
    });
  }
  function render() {
    $('pdQty').textContent = qty; $('pdMinus').disabled = qty <= 1; $('pdPlus').disabled = qty >= 99;
    $('pdUnit').textContent = won(unit());
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
    var line = { brand: B.name, name: it.name, qty: qty, price: unit(), image: it.image, ship: ship ? ship.value : '', opts: picked.map(function (a) { return a.name; }) };
    try {
      var cart = JSON.parse(localStorage.getItem('dealart.cart') || '[]');
      if (!Array.isArray(cart)) cart = [];
      var same = cart.filter(function (c) { return c.name === line.name && c.ship === line.ship && (c.opts || []).join() === line.opts.join(); })[0];
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
