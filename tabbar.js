(function () {
  var bar = document.querySelector('.tabbar');
  if (!bar) return;
  var fab = document.querySelector('.kakao-fab');
  var cartFab = document.querySelector('.cart-fab');
  if (cartFab) { // 장바구니 수량 배지 (이 기기에 저장된 장바구니)
    var n = 0;
    try { JSON.parse(localStorage.getItem('dealart.cart') || '[]').forEach(function (c) { n += Number(c && c.qty) || 0; }); } catch (e) {}
    var bd = cartFab.querySelector('.cart-fab-badge'); bd.hidden = n === 0; bd.textContent = n > 99 ? '99+' : String(n);
  }

  /* 1) 스크롤을 내리면 숨기고, 올리면 다시 보여준다 */
  var lastY = window.pageYOffset, ticking = false, THRESHOLD = 8, MIN_Y = 80;
  function setHidden(hidden) {
    bar.classList.toggle('is-hidden', hidden);
    if (fab) fab.classList.toggle('is-low', hidden);
    if (cartFab) cartFab.classList.toggle('is-low', hidden);
  }
  function onScroll() {
    var y = window.pageYOffset;
    var nearBottom = window.innerHeight + y >= document.documentElement.scrollHeight - 4;
    if (y < MIN_Y || nearBottom) setHidden(false);
    else if (y - lastY > THRESHOLD) setHidden(true);
    else if (lastY - y > THRESHOLD) setHidden(false);
    lastY = y; ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  // 키보드로 탭에 포커스가 가면 항상 보여준다
  bar.addEventListener('focusin', function () { setHidden(false); });

  /* 2) 주문조회 배지: 처리 중인 주문 수. 0이면 숨김 */
  var orderTab = bar.querySelector('[data-order-tab]');
  var badge = bar.querySelector('.tab-badge');
  function setOrderBadge(n) {
    n = Math.max(0, parseInt(n, 10) || 0);
    if (!badge || !orderTab) return;
    badge.hidden = n === 0;
    badge.textContent = n > 9 ? '9+' : String(n);
    orderTab.setAttribute('aria-label', n ? '주문조회, 처리 중인 주문 ' + n + '건' : '주문조회');
  }
  var initial = orderTab ? orderTab.getAttribute('data-count') : 0;
  try { var saved = localStorage.getItem('dealart.orderCount'); if (saved !== null) initial = saved; } catch (e) {}
  setOrderBadge(initial);
  window.DealartTabbar = { setOrderBadge: setOrderBadge };
})();

/* 상단 카테고리 탭: 현재 탭을 보이는 위치로 옮기고, 가려진 탭이 있으면 오른쪽 끝을 흐리게 표시 */
(function () {
  var nav = document.querySelector('.cat-nav');
  if (!nav) return;
  function update() {
    var more = nav.scrollWidth > nav.clientWidth + 2;
    var atEnd = nav.scrollLeft + nav.clientWidth >= nav.scrollWidth - 2;
    nav.classList.toggle('has-more', more);
    nav.classList.toggle('at-end', more && atEnd);
  }
  function revealActive() {
    var a = nav.querySelector('a.active');
    if (!a) return;
    var target = a.offsetLeft - (nav.clientWidth - a.offsetWidth) / 2;
    nav.scrollLeft = Math.max(0, target); // 페이지 세로 위치는 건드리지 않는다
  }
  nav.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', function () { update(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { update(); });
  revealActive(); update();
})();
